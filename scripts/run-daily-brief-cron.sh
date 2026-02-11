#!/usr/bin/env bash
# Wrapper for cron: load .env then run the daily brief. Cron has no env otherwise.
# Usage: run from repo root, or: ./scripts/run-daily-brief-cron.sh
set -e
cd "$(dirname "$0")/.."
if [ -f .env ]; then
  set -a
  # shellcheck source=/dev/null
  . ./.env
  set +a
fi
exec bun run scripts/run-daily-brief.ts
