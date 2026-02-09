#!/usr/bin/env bash
# Install Redis on the OpenJoey Hetzner server and add OPENJOEY_REDIS_URL to gateway .env.
#
# Usage:
#   ./scripts/add-redis-to-hetzner.sh
#   (defaults: SSH key ~/.ssh/hetzner-openjoey-new, host root@116.203.215.213)
#
# Override:
#   SSH_KEY=~/.ssh/other_key HETZNER_HOST=root@1.2.3.4 ./scripts/add-redis-to-hetzner.sh
#
# Option: SKIP_INSTALL=1 to only add the env var (Redis already installed).

set -e
cd "$(dirname "$0")/.."

SSH_KEY="${SSH_KEY:-$HOME/.ssh/hetzner-openjoey-new}"
HETZNER_HOST="${HETZNER_HOST:-root@116.203.215.213}"
[ -n "$1" ] && HETZNER_HOST="$1"

REDIS_URL="redis://127.0.0.1:6379"

echo "Target: $HETZNER_HOST (SSH key: $SSH_KEY)"

if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  echo "Installing Redis..."
  ssh -i "$SSH_KEY" "$HETZNER_HOST" '
    apt-get update -qq && apt-get install -y -qq redis-server
    systemctl enable redis-server
    systemctl start redis-server
    redis-cli ping
  '
  echo "Redis installed and running."
fi

echo "Setting OPENJOEY_REDIS_URL in gateway .env and restarting..."
# Pass REDIS_URL so remote gets literal value (gateway uses network_mode: host → 127.0.0.1)
ssh -i "$SSH_KEY" "$HETZNER_HOST" "cd /root/openclaw && \
  V='$REDIS_URL'; \
  if grep -q '^OPENJOEY_REDIS_URL=' .env 2>/dev/null; then \
    sed -i \"s|^OPENJOEY_REDIS_URL=.*|OPENJOEY_REDIS_URL=\$V|\" .env; \
  else \
    echo \"OPENJOEY_REDIS_URL=\$V\" >> .env; \
  fi; \
  docker compose restart openclaw-gateway 2>/dev/null || true; \
  echo Done."

echo "Redis URL is set. Gateway will use the reply cache when Redis is available."
