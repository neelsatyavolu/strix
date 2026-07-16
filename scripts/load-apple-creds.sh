#!/usr/bin/env bash
# Load Apple Developer ID signing + notarization credentials for Strix.
#
# Usage (source, do not execute):
#   source scripts/load-apple-creds.sh
#
# Sources the shared loader (agmux) from 1Password, imports the .p12 plus Apple
# intermediate CAs into a temporary keychain (electron-builder's CSC_LINK path
# hits a set-key-partition-list password bug), then exports env for EB.
#
# Shared human docs: ~/Documents/GitHub/APPLE_SIGNING.md
#
# After source, exports:
#   CSC_NAME / CSC_KEYCHAIN     # electron-builder signing (no CSC_LINK)
#   APPLE_API_KEY / APPLE_API_KEY_ID / APPLE_API_ISSUER
#   APPLE_TEAM_ID / APPLE_SIGNING_IDENTITY
#   AGMUX_APPLE_CREDS_DIR / STRIX_SIGN_KEYCHAIN
#
# Call strix_cleanup_apple_creds on EXIT (restores keychain search list).

set -euo pipefail

_STRIX_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
_AGMUX_LOADER="${AGMUX_APPLE_CREDS_LOADER:-${HOME}/Documents/GitHub/agmux/scripts/load-apple-creds.sh}"
_DEFAULT_IDENTITY="Developer ID Application: Ramakrishna Satyavolu (VTQW687WBQ)"

if [ ! -f "$_AGMUX_LOADER" ]; then
  echo "error: shared Apple creds loader not found at:" >&2
  echo "  $_AGMUX_LOADER" >&2
  echo "Set AGMUX_APPLE_CREDS_LOADER or clone agmux next to this repo." >&2
  echo "See ~/Documents/GitHub/APPLE_SIGNING.md" >&2
  return 1 2>/dev/null || exit 1
fi

# shellcheck disable=SC1090
source "$_AGMUX_LOADER"

IDENTITY="${APPLE_SIGNING_IDENTITY:-$_DEFAULT_IDENTITY}"
export APPLE_SIGNING_IDENTITY="$IDENTITY"
export CSC_NAME="$IDENTITY"

# Shared notary: APPLE_API_KEY = Key ID, APPLE_API_KEY_PATH = path to .p8
# electron-builder: APPLE_API_KEY = path to .p8, APPLE_API_KEY_ID = Key ID
if [ -n "${APPLE_API_KEY_PATH:-}" ] && [ -f "${APPLE_API_KEY_PATH}" ]; then
  if [ -z "${APPLE_API_KEY_ID:-}" ]; then
    export APPLE_API_KEY_ID="${APPLE_API_KEY:-}"
  fi
  export APPLE_API_KEY="$APPLE_API_KEY_PATH"
fi

# Remember prior keychain search list so cleanup can restore it.
STRIX_PREV_KEYCHAINS="$(security list-keychains -d user | sed 's/^[[:space:]]*"//;s/"$//' | tr '\n' ' ')"
export STRIX_PREV_KEYCHAINS

# Public Apple CA certs needed to make the Developer ID leaf a "valid" identity.
# Without these, find-identity returns 0 and codesign fails with chain errors.
_strix_fetch_apple_cas() {
  local dest="$1"
  mkdir -p "$dest"
  local base="https://www.apple.com/certificateauthority"
  local files=(
    "DeveloperIDG2CA.cer"
    "DeveloperIDCA.cer"
    "AppleRootCA-G2.cer"
    "AppleRootCA-G3.cer"
  )
  local f
  for f in "${files[@]}"; do
    if [ ! -s "$dest/$f" ]; then
      curl -fsSL -o "$dest/$f" "$base/$f"
    fi
  done
  if [ ! -s "$dest/AppleIncRootCertificate.cer" ]; then
    curl -fsSL -o "$dest/AppleIncRootCertificate.cer" \
      "https://www.apple.com/appleca/AppleIncRootCertificate.cer"
  fi
}

strix_prepare_signing_keychain() {
  local p12_path="" kc kc_pass login cas

  if [ -n "${AGMUX_APPLE_CREDS_DIR:-}" ] && [ -f "${AGMUX_APPLE_CREDS_DIR}/certificate.p12" ]; then
    p12_path="${AGMUX_APPLE_CREDS_DIR}/certificate.p12"
  fi

  # Prefer an already-valid Developer ID identity (with private key) in search list.
  if security find-identity -v -p codesigning 2>/dev/null | grep -Fq "$IDENTITY"; then
    echo "  Strix: using existing keychain identity: $IDENTITY"
    unset CSC_LINK CSC_KEY_PASSWORD APPLE_CERTIFICATE 2>/dev/null || true
    return 0
  fi

  if [ -z "$p12_path" ] || [ ! -f "$p12_path" ]; then
    echo "error: no Developer ID identity in keychain and no .p12 to import" >&2
    return 1
  fi
  if [ -z "${APPLE_CERTIFICATE_PASSWORD:-}" ]; then
    echo "error: APPLE_CERTIFICATE_PASSWORD missing; cannot import .p12" >&2
    return 1
  fi

  login="$HOME/Library/Keychains/login.keychain-db"
  kc="${AGMUX_APPLE_CREDS_DIR}/strix-sign.keychain-db"
  kc_pass="$(/usr/bin/openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  cas="${AGMUX_APPLE_CREDS_DIR}/apple-cas"
  _strix_fetch_apple_cas "$cas"

  security delete-keychain "$kc" >/dev/null 2>&1 || true
  security create-keychain -p "$kc_pass" "$kc"
  security set-keychain-settings -lut 21600 "$kc"
  security unlock-keychain -p "$kc_pass" "$kc"

  # Intermediates / roots first so the leaf becomes a valid codesigning identity.
  local cer
  for cer in "$cas"/*.cer; do
    [ -f "$cer" ] || continue
    security import "$cer" -k "$kc" -T /usr/bin/codesign -T /usr/bin/security >/dev/null 2>&1 || true
  done

  security import "$p12_path" -k "$kc" -P "$APPLE_CERTIFICATE_PASSWORD" \
    -T /usr/bin/codesign -T /usr/bin/security -T /usr/bin/productbuild >/dev/null
  # -k must be the *keychain* password (electron-builder's CSC_LINK path gets this wrong).
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$kc_pass" "$kc" >/dev/null

  # Put our keychain first; keep login so other tools still work.
  security list-keychains -d user -s "$kc" "$login"

  export STRIX_SIGN_KEYCHAIN="$kc"
  export STRIX_SIGN_KEYCHAIN_PASS="$kc_pass"
  export CSC_KEYCHAIN="$kc"
  # Do not set CSC_LINK — EB would re-import and hit the partition-list bug.
  # Also clear APPLE_CERTIFICATE so electron-builder.config.cjs cannot re-map it.
  unset CSC_LINK CSC_KEY_PASSWORD APPLE_CERTIFICATE APPLE_CERTIFICATE_PASSWORD 2>/dev/null || true

  if ! security find-identity -v -p codesigning 2>/dev/null | grep -Fq "$IDENTITY"; then
    echo "error: imported p12 but identity not found: $IDENTITY" >&2
    security find-identity -v -p codesigning 2>&1 || true
    return 1
  fi
  echo "  Strix: imported Developer ID + Apple CAs into temp keychain"
  return 0
}

strix_prepare_signing_keychain || {
  echo "error: failed to prepare signing keychain" >&2
  return 1 2>/dev/null || exit 1
}

strix_require_developer_id() {
  if command -v agmux_require_developer_id >/dev/null 2>&1; then
    agmux_require_developer_id
  else
    return 0
  fi
}

strix_disable_notarization_env() {
  unset APPLE_API_KEY APPLE_API_KEY_ID APPLE_API_ISSUER APPLE_API_KEY_PATH 2>/dev/null || true
  if command -v agmux_disable_notarization_env >/dev/null 2>&1; then
    agmux_disable_notarization_env
  fi
}

strix_cleanup_apple_creds() {
  local login="$HOME/Library/Keychains/login.keychain-db"
  # Restore a clean search list (drop temp keychains).
  if [ -n "${STRIX_PREV_KEYCHAINS:-}" ]; then
    # shellcheck disable=SC2086
    security list-keychains -d user -s $STRIX_PREV_KEYCHAINS >/dev/null 2>&1 \
      || security list-keychains -d user -s "$login" >/dev/null 2>&1 || true
  else
    security list-keychains -d user -s "$login" >/dev/null 2>&1 || true
  fi
  # If restore still points at deleted temps, force login-only.
  if ! security list-keychains -d user 2>/dev/null | grep -q 'login.keychain'; then
    security list-keychains -d user -s "$login" >/dev/null 2>&1 || true
  fi

  if [ -n "${STRIX_SIGN_KEYCHAIN:-}" ] && [ -f "${STRIX_SIGN_KEYCHAIN}" ]; then
    security delete-keychain "$STRIX_SIGN_KEYCHAIN" >/dev/null 2>&1 || true
  fi
  if [ -n "${AGMUX_APPLE_CREDS_DIR:-}" ] && [ -d "${AGMUX_APPLE_CREDS_DIR}" ]; then
    rm -rf "${AGMUX_APPLE_CREDS_DIR}"
  fi
  unset APPLE_CERTIFICATE APPLE_CERTIFICATE_PASSWORD APPLE_API_KEY \
        APPLE_API_KEY_ID APPLE_API_ISSUER APPLE_API_KEY_PATH \
        APPLE_SIGNING_IDENTITY APPLE_TEAM_ID \
        CSC_LINK CSC_KEY_PASSWORD CSC_NAME CSC_KEYCHAIN \
        STRIX_SIGN_KEYCHAIN STRIX_SIGN_KEYCHAIN_PASS STRIX_PREV_KEYCHAINS \
        AGMUX_APPLE_CREDS_DIR 2>/dev/null || true
}

echo "  Strix: signing ready (CSC_NAME=$CSC_NAME${CSC_KEYCHAIN:+, CSC_KEYCHAIN set})"
