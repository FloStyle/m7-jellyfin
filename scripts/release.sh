#!/usr/bin/env bash
# release.sh — cut a NEO release: bump version, tag, push.
# GitHub Actions (release.yml) builds dist/jellyfin.zip and publishes it as
# a release asset; the PS3 plugin's built-in upgrader then offers it (24h
# auto-check or the manual Update button).
#
# Usage: ./scripts/release.sh 1.2.0
# (update CHANGELOG.md first, then run this)
set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>   e.g. $0 1.2.0"
  exit 1
fi

cd "$(dirname "$0")/.."

# Sanity checks
git diff --quiet -- src/ || { echo "⚠️ uncommitted src/ changes — commit them first"; exit 1; }
command -v gh >/dev/null || echo "⚠️ gh not found — tag will be pushed via SSH anyway"

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

echo "✅ v${VERSION} pushed — GitHub Actions builds dist/jellyfin.zip and publishes the release."
echo "   The PS3 upgrader will detect it (24h auto-check or Update button)."
