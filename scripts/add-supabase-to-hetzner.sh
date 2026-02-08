#!/usr/bin/env bash
# Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from local .env to Hetzner server.
# Usage:
#   ./scripts/add-supabase-to-hetzner.sh
#   (uses defaults: SSH key ~/.ssh/hetzner-openjoey-new, host root@116.203.215.213)
#
# Override:
#   SSH_KEY=~/.ssh/other_key HETZNER_HOST=root@1.2.3.4 ./scripts/add-supabase-to-hetzner.sh
#
# Requires: .env in repo root with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.

set -e
cd "$(dirname "$0")/.."

# Defaults for OpenJoey Hetzner server
SSH_KEY="${SSH_KEY:-$HOME/.ssh/hetzner-openjoey-new}"
HETZNER_HOST="${HETZNER_HOST:-root@116.203.215.213}"
[ -n "$1" ] && HETZNER_HOST="$1"

if [ ! -f .env ]; then
  echo "Error: .env not found in $(pwd)"
  exit 1
fi

# Read from .env (support KEY=val)
SUPABASE_URL=$(grep -E '^SUPABASE_URL=' .env | head -1 | cut -d= -f2- | sed "s/^['\"]//;s/['\"]$//")
SUPABASE_SERVICE_ROLE_KEY=$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' .env | head -1 | cut -d= -f2- | sed "s/^['\"]//;s/['\"]$//")

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: .env must contain SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "Adding Supabase vars to $HETZNER_HOST:/root/openclaw/.env ..."
echo "Using SSH key: $SSH_KEY"

# Send vars over stdin so we don't embed secrets in the remote command
{
  echo "SUPABASE_URL=$SUPABASE_URL"
  echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
} | ssh -i "$SSH_KEY" "$HETZNER_HOST" 'cd /root/openclaw && \
  while IFS= read -r line; do \
    key="${line%%=*}"; \
    if ! grep -q "^$key=" .env 2>/dev/null; then echo "$line" >> .env; fi; \
  done && \
  echo "Vars added. Restarting gateway..." && \
  docker compose restart openclaw-gateway && \
  echo "Done."'

echo "Supabase env vars are on the server and gateway restarted."
