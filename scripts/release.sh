#!/usr/bin/env bash
# Example: ./scripts/release.sh patch
#          ./scripts/release.sh minor "Add travel expressions"
set -euo pipefail

BUMP="${1:-patch}"
NOTE="${2:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .git ]]; then
  echo "This folder is not a Git repository. Run ./scripts/publish-first-time.sh first."
  exit 1
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "No GitHub remote named origin. Run ./scripts/publish-first-time.sh first."
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Please commit or stash your current changes before creating a release."
  exit 1
fi

python3 scripts/bump_version.py "$BUMP"
python3 scripts/validate.py
VERSION="$(tr -d '[:space:]' < VERSION)"
TAG="v${VERSION}"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists. Choose a different version bump."
  exit 1
fi

git add VERSION version.json index.html service-worker.js
git commit -m "release: ${TAG}${NOTE:+ — $NOTE}"
git tag -a "$TAG" -m "Release $TAG${NOTE:+ — $NOTE}"
git push origin main
git push origin "$TAG"

echo "✅ $TAG pushed. GitHub Actions will deploy Pages and publish the release ZIP."
