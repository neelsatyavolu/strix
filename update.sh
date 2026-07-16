#!/usr/bin/env bash
#
# update.sh - ship a new Strix version to the website.
#
# Builds a Developer ID–signed + notarized Mac app and uploads the artifacts
# (dmg + zip + blockmap + latest-mac.yml) to Vercel Blob under downloads/.
# The marketing "Download for Mac" button and the in-app auto-updater both read
# from there, so this one command releases a new version to every user.
#
# Usage:
#   ./update.sh              # bump patch, signed+notarized build, upload
#   ./update.sh 0.3.0        # set an explicit version, build, upload
#   ./update.sh --no-bump    # build + upload the current version as-is
#   SKIP_BUILD=1 ./update.sh # re-upload the existing dist-app/ without rebuilding
#   ./update.sh --unsigned   # emergency: skip signing (not for public users)
#   ./update.sh --sign-only  # Developer ID sign, skip notarization
#
# Requirements:
#   - macOS (the build runs electron-builder --mac)
#   - pnpm install already run
#   - 1Password CLI (`op`) signed in — Developer ID + notary items
#     (see ~/Documents/GitHub/APPLE_SIGNING.md)
#   - Vercel CLI authed with a Blob store on the project, OR BLOB_READ_WRITE_TOKEN
#     set (Vercel dashboard > Storage > your Blob store > ".env.local" tab).
#
# Kept ASCII-only so it runs under the stock macOS bash 3.2.
#
set -euo pipefail
cd "$(dirname "$0")"

DIST_MODE="apple"   # apple | sign | unsigned
VERSION_ARG=""
NO_BUMP=0

while [ $# -gt 0 ]; do
  case "$1" in
    --no-bump)
      NO_BUMP=1
      shift
      ;;
    --unsigned)
      DIST_MODE="unsigned"
      shift
      ;;
    --sign-only|--sign)
      DIST_MODE="sign"
      shift
      ;;
    --apple|--release)
      DIST_MODE="apple"
      shift
      ;;
    -h|--help)
      sed -n '2,30p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *)
      if [ -z "$VERSION_ARG" ] && [[ "$1" != -* ]]; then
        VERSION_ARG="$1"
        shift
      else
        echo "Unknown option: $1" >&2
        exit 1
      fi
      ;;
  esac
done

# -- 1. Version ---------------------------------------------------------------
if [ "$NO_BUMP" = "1" ] || [ "${SKIP_BUILD:-}" = "1" ]; then
  :                                                   # keep current version
elif [ -n "$VERSION_ARG" ]; then
  npm version "$VERSION_ARG" --no-git-tag-version >/dev/null  # explicit version
else
  npm version patch --no-git-tag-version >/dev/null   # default: bump patch
fi
VERSION="$(node -p "require('./package.json').version")"
echo "==> Releasing Strix $VERSION (dist mode: $DIST_MODE)"

# -- 2. Build -----------------------------------------------------------------
if [ "${SKIP_BUILD:-}" = "1" ]; then
  echo "  - Skipping build (SKIP_BUILD=1); uploading existing dist-app/"
else
  case "$DIST_MODE" in
    apple)
      echo "  - Building Developer ID + notarized release..."
      bash scripts/dist.sh --apple
      ;;
    sign)
      echo "  - Building Developer ID signed (no notarize)..."
      bash scripts/dist.sh --sign
      ;;
    unsigned)
      echo "  - Building UNSIGNED (not for public distribution)..."
      bash scripts/dist.sh --unsigned
      ;;
  esac
fi

# -- 3. Collect artifacts -----------------------------------------------------
# bash 3.2 compatible (no mapfile / nullglob shopt dependency for empty arrays)
artifacts=()
for f in dist-app/*.dmg dist-app/*.zip dist-app/*.blockmap dist-app/latest-mac.yml; do
  [ -f "$f" ] && artifacts+=("$f")
done
if [ ${#artifacts[@]} -eq 0 ]; then
  echo "  ! Nothing in dist-app/ to upload; run a build first." >&2
  exit 1
fi

# Sanity: official release should not ship an ad-hoc signature
if [ "$DIST_MODE" = "apple" ] || [ "$DIST_MODE" = "sign" ]; then
  APP="$(find dist-app -name 'Strix.app' -type d 2>/dev/null | head -1 || true)"
  if [ -n "$APP" ]; then
    if codesign -dv "$APP" 2>&1 | grep -qi 'Signature=adhoc\|flags=0x2(adhoc)'; then
      echo "  ! ERROR: Strix.app is still ad-hoc signed — refusing to upload a public release." >&2
      echo "    Check 1Password Developer ID cert and re-run without --unsigned." >&2
      exit 1
    fi
  fi
fi

# -- 4. Upload to Vercel Blob -------------------------------------------------
# Use the store's read-write token. `vercel blob create-store` wrote it to
# .env.local; load it if it isn't already exported. Force the token path by
# clearing a half-configured OIDC var (the CLI errors if only one OIDC var is set).
if [ -z "${BLOB_READ_WRITE_TOKEN:-}" ] && [ -f .env.local ]; then
  __line="$(grep -E '^BLOB_READ_WRITE_TOKEN=' .env.local || true)"
  __val="${__line#BLOB_READ_WRITE_TOKEN=}"; __val="${__val%\"}"; __val="${__val#\"}"
  [ -n "$__val" ] && export BLOB_READ_WRITE_TOKEN="$__val"
  unset __line __val
fi
unset VERCEL_OIDC_TOKEN || true
if [ -z "${BLOB_READ_WRITE_TOKEN:-}" ]; then
  echo "  ! BLOB_READ_WRITE_TOKEN not found. Run: vercel blob create-store strix-downloads --access public --yes" >&2
  exit 1
fi

base=""
for f in "${artifacts[@]}"; do
  name="$(basename "$f")"
  echo "  - Uploading $name"
  # --allow-overwrite keeps the pathname stable (no random suffix by default).
  out="$(vercel blob put "$f" \
    --access public \
    --pathname "downloads/$name" \
    --allow-overwrite \
    --non-interactive 2>&1)"
  # grep -m1 (not `| head`) so it can't SIGPIPE under `set -o pipefail`.
  url="$(printf '%s\n' "$out" | grep -Eom1 'https://[^[:space:]]+' || true)"
  if [ -z "$base" ] && [ -n "$url" ]; then base="${url%/downloads/*}"; fi
done

# -- 5. Done ------------------------------------------------------------------
echo ""
echo "OK  Published Strix $VERSION to the Blob store"
if [ -n "$base" ]; then
  echo "    Blob base:  $base"
  echo "    Direct dmg: $base/downloads/Strix-Prep.dmg"
fi
echo "    Public dmg: https://strixprep.com/downloads/Strix-Prep.dmg"
if [ "$DIST_MODE" = "unsigned" ]; then
  echo ""
  echo "WARNING: this release is UNSIGNED. Users will see Gatekeeper warnings."
fi
echo ""
echo "First release only - point the domain at the store, then redeploy:"
echo "    vercel env add DOWNLOADS_BLOB_BASE production    # value: ${base:-<blob base above>}"
echo "    git commit -am \"release: Strix $VERSION\" && git push   # redeploys strixprep.com"
echo ""
echo "After that, every ./update.sh just overwrites the files; no redeploy needed."
