#!/usr/bin/env bash
# Full deploy to OpenJoey Hetzner: pull, build gateway, restart, ensure daily brief cron.
# Usage: ./scripts/deploy-hetzner.sh
# Override: SSH_KEY=~/.ssh/other HETZNER_HOST=root@1.2.3.4 ./scripts/deploy-hetzner.sh
set -e
cd "$(dirname "$0")/.."
SSH_KEY="${SSH_KEY:-$HOME/.ssh/hetzner-openjoey-new}"
HETZNER_HOST="${HETZNER_HOST:-root@116.203.215.213}"
[ -n "$1" ] && HETZNER_HOST="$1"

CRON_LINE="0 8 * * * cd /root/openclaw && bun run scripts/run-daily-brief.ts"

echo "Deploying to $HETZNER_HOST ..."
ssh -i "$SSH_KEY" "$HETZNER_HOST" "set -e
  cd /root/openclaw
  git pull origin main
  docker compose build openclaw-gateway
  docker compose up -d openclaw-gateway
  (crontab -l 2>/dev/null | grep -v run-daily-brief || true
   echo '$CRON_LINE') | crontab -
  echo '---'
  echo 'Gateway:'
  docker compose ps openclaw-gateway
  echo 'Cron:'
  crontab -l | grep run-daily-brief || true
  echo 'Done.'"
echo "Deploy complete."
