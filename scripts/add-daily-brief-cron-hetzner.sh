#!/usr/bin/env bash
# Add 8 AM UTC daily brief cron on the OpenJoey Hetzner server.
# Usage:
#   ./scripts/add-daily-brief-cron-hetzner.sh
# Override: SSH_KEY=~/.ssh/other HETZNER_HOST=root@1.2.3.4 ./scripts/add-daily-brief-cron-hetzner.sh
set -e
cd "$(dirname "$0")/.."
SSH_KEY="${SSH_KEY:-$HOME/.ssh/hetzner-openjoey-new}"
HETZNER_HOST="${HETZNER_HOST:-root@116.203.215.213}"
[ -n "$1" ] && HETZNER_HOST="$1"

CRON_LINE="0 8 * * * cd /root/openclaw && ./scripts/run-daily-brief-cron.sh"

echo "Updating $HETZNER_HOST: git pull and add daily brief cron (8 AM UTC)..."
ssh -i "$SSH_KEY" "$HETZNER_HOST" "cd /root/openclaw && git pull origin main && (crontab -l 2>/dev/null | grep -v run-daily-brief || true; echo '$CRON_LINE') | crontab - && echo 'Cron installed.' && crontab -l | grep -E 'run-daily-brief|8 \* \* \*' || true"
echo "Done. Daily brief will run at 8 AM UTC."
