#!/usr/bin/env bash
#
# update.sh - ship a new Strix version to the website.
#
# Builds the Mac app and uploads the artifacts (dmg + zip + blockmap +
# latest-mac.yml) to Vercel Blob under downloads/. The marketing "Download for
# Mac" button and the in-app auto-updater both read from there, so this one
# command releases a new version to every user.
#
# Usage:
#   ./update.sh              # bump patch version, build, upload   (the common case)
#   ./update.sh 0.3.0        # set an explicit version, build, upload
#   ./update.sh --no-bump    # build + upload the current version as-is
#   SKIP_BUILD=1 ./update.sh # re-upload the existing dist-app/ without rebuilding
#
# Requirements:
#   - macOS (the build runs electron-builder --mac)
#   - pnpm install already run
#   - Vercel CLI authed with a Blob store on the project, OR BLOB_READ_WRITE_TOKEN
#     set (Vercel dashboard > Storage > your Blob store > ".env.local" tab).
#
# Kept ASCII-only so it runs under the stock macOS bash 3.2.
#
set -euo pipefail
cd "$(dirname "$0")"

# -- 1. Version ---------------------------------------------------------------
arg="${1:-}"
if [ "$arg" = "--no-bump" ] || [ "${SKIP_BUILD:-}" = "1" ]; then
  :                                                   # keep current version
elif [ -n "$arg" ]; then
  npm version "$arg" --no-git-tag-version >/dev/null  # explicit version
else
  npm version patch --no-git-tag-version >/dev/null   # default: bump patch
fi
VERSION="$(node -p "require('./package.json').version")"
echo "==> Releasing Strix $VERSION"

# -- 2. Build -----------------------------------------------------------------
if [ "${SKIP_BUILD:-}" = "1" ]; then
  echo "  - Skipping build (SKIP_BUILD=1); uploading existing dist-app/"
else
  echo "  - Building (unsigned; set STRIX_SIGN=1 to sign and notarize)..."
  rm -rf dist-app   # start clean so stale artifacts never get uploaded
  pnpm dist
fi

# -- 3. Collect artifacts -----------------------------------------------------
shopt -s nullglob
artifacts=( dist-app/*.dmg dist-app/*.zip dist-app/*.blockmap dist-app/latest-mac.yml )
if [ ${#artifacts[@]} -eq 0 ]; then
  echo "  ! Nothing in dist-app/ to upload; run a build first." >&2
  exit 1
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
echo ""
echo "First release only - point the domain at the store, then redeploy:"
echo "    vercel env add DOWNLOADS_BLOB_BASE production    # value: ${base:-<blob base above>}"
echo "    git commit -am \"release: Strix $VERSION\" && git push   # redeploys strixprep.com"
echo ""
echo "After that, every ./update.sh just overwrites the files; no redeploy needed."
