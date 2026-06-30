#!/usr/bin/env bash
# Example: ./scripts/push-update.sh "content: add 20 have expressions"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MESSAGE="${1:-content: update English Thinking Dictionary}"

if [[ ! -d .git ]] || ! git remote get-url origin >/dev/null 2>&1; then
  echo "Run ./scripts/publish-first-time.sh first."
  exit 1
fi

python3 scripts/validate.py
git add .
if git diff --cached --quiet; then
  echo "No changes to upload."
  exit 0
fi
git commit -m "$MESSAGE"
git push origin main
echo "✅ Uploaded. GitHub Pages deployment has started."
