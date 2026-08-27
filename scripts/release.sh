#!/usr/bin/env bash
# release.sh — cut a NEO release: bump version, tag, push.
# GitHub Actions (release.yml) builds dist/jellyfin.zip + source tarball
# and publishes them as a stable release.
# For dev builds, push to main directly or run:
#   ./scripts/release.sh --dev
#
# Usage:
#   ./scripts/release.sh 1.2.0   # stable release
#   ./scripts/release.sh --dev   # trigger dev build
# (update CHANGELOG.md first for stable releases)
set -euo pipefail

cd "$(dirname "$0")/.."

command -v gh >/dev/null || echo "⚠️ gh not found"

if [ "${1:-}" = "--dev" ]; then
  echo "🔧 Dev build — pushing to main to trigger the dev build workflow."
  git diff --quiet || { echo "⚠️ uncommitted changes — commit or stash them first"; exit 1; }
  git push origin main
  echo "✅ Pushed to main — GitHub Actions will publish the dev build automatically."
  exit 0
fi

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>   e.g. $0 1.2.0"
  echo "       $0 --nightly"
  exit 1
fi

# Sanity checks
git diff --quiet -- src/ || { echo "⚠️ uncommitted src/ changes — commit them first"; exit 1; }

# Bump version in package.json (keeps plugin.json in sync at build time)
python3 - "$VERSION" <<'PY'
import json, sys
v = sys.argv[1]
p = json.load(open('package.json'))
p['version'] = v
with open('package.json', 'w') as f:
    json.dump(p, f, indent=2)
    f.write('\n')
print('package.json version ->', v)
PY

git add package.json
git commit -m "chore: release v${VERSION}"
git tag "v${VERSION}"
git push origin main --tags

echo "✅ v${VERSION} pushed — GitHub Actions builds dist/jellyfin.zip + source tarball"
echo "   and publishes the stable release."
echo "   The PS3 upgrader will detect it (24h auto-check or Update button)."
