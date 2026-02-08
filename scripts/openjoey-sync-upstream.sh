#!/usr/bin/env bash
# Safe upstream sync: merge openclaw/openclaw into a branch so you can resolve
# conflicts (keeping OpenJoey changes) before merging into main.
# Usage: ./scripts/openjoey-sync-upstream.sh
# See: docs/install/openjoey-sync-upstream.md

set -e
cd "$(dirname "$0")/.."

REMOTE="${OPENJOEY_UPSTREAM_REMOTE:-upstream}"
BRANCH="${OPENJOEY_SYNC_BRANCH:-sync-upstream}"

if ! git remote get-url "$REMOTE" &>/dev/null; then
  echo "Remote '$REMOTE' not found. Add openclaw with:"
  echo "  git remote add upstream https://github.com/openclaw/openclaw.git"
  exit 1
fi

echo "Fetching $REMOTE..."
git fetch "$REMOTE"

if git show-ref --quiet "refs/heads/$BRANCH"; then
  echo "Branch $BRANCH already exists. Use it or delete it first:"
  echo "  git checkout $BRANCH   # then resolve conflicts and merge into main"
  echo "  git branch -D $BRANCH  # to start over"
  exit 1
fi

echo "Creating branch $BRANCH from main..."
git checkout main
git checkout -b "$BRANCH"

echo "Merging $REMOTE/main into $BRANCH..."
if ! git merge "$REMOTE/main"; then
  echo ""
  echo "=== Merge had conflicts. Resolve them keeping OpenJoey code in:"
  echo "   src/openjoey/, skills/meme-lord/, landing/, src/telegram/*.ts, etc."
  echo "   See docs/install/openjoey-sync-upstream.md"
  echo ""
  echo "After resolving:"
  echo "  git add ."
  echo "  git commit -m 'Merge upstream/main, keep OpenJoey changes'"
  echo "  git checkout main"
  echo "  git merge $BRANCH"
  echo "  git push origin main"
  echo "  git branch -d $BRANCH"
  exit 1
fi

echo ""
echo "Merge succeeded with no conflicts. To bring into main:"
echo "  git checkout main"
echo "  git merge $BRANCH"
echo "  git push origin main"
echo "  git branch -d $BRANCH"
