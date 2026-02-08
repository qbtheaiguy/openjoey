#!/usr/bin/env bash
# Check what you're about to push to origin main (commits and file summary).
# Run before: git push origin main
# Usage: ./scripts/openjoey-check-before-push.sh
# See: docs/install/openjoey-sync-upstream.md

set -e
cd "$(dirname "$0")/.."

ORIGIN="${OPENJOEY_ORIGIN_REMOTE:-origin}"
BRANCH="${OPENJOEY_MAIN_BRANCH:-main}"

echo "=== git status ==="
git status -sb
echo ""

echo "=== Commits ahead of $ORIGIN/$BRANCH (will be pushed) ==="
if ! git rev-parse "$ORIGIN/$BRANCH" &>/dev/null; then
  echo "  (no $ORIGIN/$BRANCH yet — push to create)"
else
  n=$(git rev-list --count "$ORIGIN/$BRANCH"..HEAD 2>/dev/null || echo "0")
  if [ "$n" = "0" ]; then
    echo "  (none — already in sync with $ORIGIN/$BRANCH)"
  else
    git log "$ORIGIN/$BRANCH"..HEAD --oneline
  fi
fi
echo ""

echo "=== Files changed vs $ORIGIN/$BRANCH (summary) ==="
if git rev-parse "$ORIGIN/$BRANCH" &>/dev/null; then
  git diff "$ORIGIN/$BRANCH" --stat
else
  echo "  (no $ORIGIN/$BRANCH to compare)"
fi
echo ""
echo "If this looks correct, run: git push $ORIGIN $BRANCH"
