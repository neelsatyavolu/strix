#!/usr/bin/env bash
# Build the Strix macOS app (electron-builder).
#
# Modes:
#   ./scripts/dist.sh              unsigned (fast local package)
#   ./scripts/dist.sh --sign       Developer ID from 1Password (no notarize)
#   ./scripts/dist.sh --apple      Developer ID + notarize + staple (public release)
#   ./scripts/dist.sh --release    alias for --apple
#
# Env overrides:
#   STRIX_SIGN=1|0   STRIX_NOTARIZE=1|0
#   AGMUX_APPLE_CREDS_LOADER=…  (path to shared load-apple-creds.sh)
#
# Shared credentials docs: ~/Documents/GitHub/APPLE_SIGNING.md
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="unsigned"   # unsigned | sign | apple

usage() {
  cat <<'EOF'
Build Strix macOS .app / .dmg / .zip → dist-app/

  ./scripts/dist.sh            Unsigned (local only)
  ./scripts/dist.sh --sign     Developer ID sign via 1Password (no notarize)
  ./scripts/dist.sh --apple    Developer ID + notarize + staple (public download)
  ./scripts/dist.sh --release  Same as --apple

Requires: pnpm, macOS, Xcode CLT. For --sign/--apple: `op` signed in +
1Password items from ~/Documents/GitHub/APPLE_SIGNING.md
EOF
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --sign|--dev)
      MODE="sign"
      shift
      ;;
    --apple|--release|--notarize)
      MODE="apple"
      shift
      ;;
    --unsigned)
      MODE="unsigned"
      shift
      ;;
    -h|--help)
      usage 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage 1
      ;;
  esac
done

cleanup() {
  if [ "$(type -t strix_cleanup_apple_creds 2>/dev/null || true)" = "function" ]; then
    strix_cleanup_apple_creds
  elif [ -n "${AGMUX_APPLE_CREDS_DIR:-}" ] && [ -d "${AGMUX_APPLE_CREDS_DIR}" ]; then
    rm -rf "${AGMUX_APPLE_CREDS_DIR}"
  fi
  unset APPLE_CERTIFICATE APPLE_CERTIFICATE_PASSWORD APPLE_API_KEY \
        APPLE_API_KEY_ID APPLE_API_ISSUER APPLE_API_KEY_PATH \
        APPLE_SIGNING_IDENTITY APPLE_TEAM_ID \
        CSC_LINK CSC_KEY_PASSWORD CSC_NAME CSC_KEYCHAIN \
        STRIX_SIGN_KEYCHAIN STRIX_SIGN_KEYCHAIN_PASS 2>/dev/null || true
}
trap cleanup EXIT

if [ "$MODE" = "sign" ] || [ "$MODE" = "apple" ]; then
  # shellcheck disable=SC1091
  source "$ROOT/scripts/load-apple-creds.sh"
  # load-apple-creds already imports into CSC_KEYCHAIN (and may unset APPLE_CERTIFICATE
  # so electron-builder does not re-import via CSC_LINK). Do not use
  # agmux_cert_is_usable after that — it requires APPLE_CERTIFICATE still set.
  if [ "${AGMUX_APPLE_CERT_EXPIRED:-0}" = "1" ]; then
    if command -v agmux_print_expired_cert_help >/dev/null 2>&1; then
      agmux_print_expired_cert_help
    else
      echo "error: Apple signing certificate is expired" >&2
    fi
    exit 1
  fi
  if [ -z "${CSC_NAME:-}" ] && [ -z "${CSC_KEYCHAIN:-}" ]; then
    echo "error: signing env not prepared (need CSC_NAME / CSC_KEYCHAIN)" >&2
    exit 1
  fi
  if command -v strix_require_developer_id >/dev/null 2>&1; then
    strix_require_developer_id || exit 1
  fi
  export STRIX_SIGN=1
  if [ "$MODE" = "apple" ]; then
    if [ -z "${APPLE_API_KEY:-}" ] || [ -z "${APPLE_API_KEY_ID:-}" ] || [ -z "${APPLE_API_ISSUER:-}" ]; then
      echo "error: notarization needs Key ID + issuer + AuthKey_*.p8 on 'Xanom Apple Dev Creds'" >&2
      echo "See ~/Documents/GitHub/APPLE_SIGNING.md" >&2
      exit 1
    fi
    export STRIX_NOTARIZE=1
    echo "==> Developer ID sign + notarize"
  else
    if command -v strix_disable_notarization_env >/dev/null 2>&1; then
      strix_disable_notarization_env
    fi
    export STRIX_NOTARIZE=0
    echo "==> Developer ID sign only (not notarized)"
  fi
else
  export STRIX_SIGN=0
  export STRIX_NOTARIZE=0
  echo "==> Unsigned build"
fi

echo "  - Building icon..."
pnpm build:icon

echo "  - electron-builder (mode=$MODE)..."
rm -rf dist-app
pnpm exec electron-builder --mac --config electron-builder.config.cjs

APP="$(find dist-app -name 'Strix.app' -type d | head -1 || true)"
if [ -n "$APP" ] && [ -d "$APP" ]; then
  echo "  - codesign check:"
  codesign -dv --verbose=2 "$APP" 2>&1 | grep -E '^Authority=|^Identifier=|^TeamIdentifier=|^Signature=|^Format=' || true
  if [ "$MODE" = "apple" ]; then
    echo "  - Gatekeeper assess (post-notarize):"
    spctl --assess --type execute --verbose "$APP" 2>&1 || true
  fi
fi

echo ""
echo "OK  Artifacts in dist-app/"
ls -lh dist-app/*.{dmg,zip,yml} 2>/dev/null || ls -la dist-app/ | head -20
