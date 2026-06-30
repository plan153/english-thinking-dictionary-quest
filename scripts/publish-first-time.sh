#!/usr/bin/env bash
# Creates a public GitHub repo, pushes this app, and enables Pages workflow mode.
# Usage: ./scripts/publish-first-time.sh [repository-name]
set -euo pipefail

REPO_NAME="${1:-english-thinking-dictionary-quest}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. On Mac: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub login will open now. Choose GitHub.com and HTTPS."
  gh auth login --web --git-protocol https
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init -b main
fi
git branch -M main
git add .
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  git commit -m "chore: initial English Thinking Dictionary Quest v$(tr -d '[:space:]' < VERSION)"
elif ! git diff --cached --quiet; then
  git commit -m "chore: prepare GitHub deployment"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
else
  git push -u origin main
fi

OWNER="$(gh api user --jq .login)"

# GitHub Pages needs workflow mode once per repository. This will succeed when the
# authenticated account grants Pages + Administration permission; otherwise the
# workflow is already present and GitHub will show the one-click setting in Pages.
if gh api --method GET "repos/${OWNER}/${REPO_NAME}/pages" >/dev/null 2>&1; then
  gh api --method PUT "repos/${OWNER}/${REPO_NAME}/pages" -f build_type=workflow >/dev/null || true
else
  gh api --method POST "repos/${OWNER}/${REPO_NAME}/pages" -f build_type=workflow >/dev/null || true
fi

echo
printf '✅ Repository: https://github.com/%s/%s\n' "$OWNER" "$REPO_NAME"
printf '🌐 Expected website: https://%s.github.io/%s/\n' "$OWNER" "$REPO_NAME"
echo "If the first deployment does not start, open repository Settings → Pages → Source → GitHub Actions once."
