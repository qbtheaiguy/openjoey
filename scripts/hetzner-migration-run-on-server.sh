#!/usr/bin/env bash
# Run this script ON THE HETZNER SERVER after you SSH in.
# Usage: bash hetzner-migration-run-on-server.sh YOUR_GITHUB_USERNAME
# Example: bash hetzner-migration-run-on-server.sh jane
# Optional env vars (set before running): OPENCLAW_GATEWAY_TOKEN, MOONSHOT_API_KEY, TELEGRAM_BOT_TOKEN

set -e
GITHUB_USER="${1:-}"
if [ -z "$GITHUB_USER" ]; then
  echo "Usage: bash hetzner-migration-run-on-server.sh YOUR_GITHUB_USERNAME"
  echo "Example: bash hetzner-migration-run-on-server.sh jane"
  exit 1
fi

echo "=== Step 6: Back up old config ==="
[ -d /root/.openclaw ] && cp -a /root/.openclaw "/root/.openclaw.backup-$(date +%Y%m%d)" && echo "Backed up .openclaw"
[ -d /root/.openjoey ] && cp -a /root/.openjoey "/root/.openjoey.backup-$(date +%Y%m%d)" && echo "Backed up .openjoey"

echo "=== Step 7: Stop old app (Docker) ==="
for dir in /root/openjoey /root/openclaw; do
  if [ -d "$dir" ] && [ -f "$dir/docker-compose.yml" ]; then
    (cd "$dir" && docker compose down 2>/dev/null) && echo "Stopped Docker in $dir" && break
  fi
done

echo "=== Step 8: Move old code out of the way ==="
[ -d /root/openjoey ] && mv /root/openjoey "/root/openjoey.old-$(date +%Y%m%d)" && echo "Renamed openjoey to openjoey.old"
[ -d /root/openclaw ] && [ ! -d /root/openclaw/.git ] && mv /root/openclaw "/root/openclaw.old-$(date +%Y%m%d)" && echo "Renamed openclaw to openclaw.old"

echo "=== Step 9: Create config dirs ==="
mkdir -p /root/.openclaw /root/.openclaw/workspace
chown -R 1000:1000 /root/.openclaw

echo "=== Step 10: Clone your fork ==="
cd /root
git clone "https://github.com/${GITHUB_USER}/openjoey.git" openclaw
cd openclaw

echo "=== Step 11: Create .env ==="
cp .env.example.hetzner .env
if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
  sed -i "s/change-me-now/$OPENCLAW_GATEWAY_TOKEN/" .env 2>/dev/null || true
fi
if [ -n "$MOONSHOT_API_KEY" ]; then
  sed -i "s|sk-your-moonshot-api-key|$MOONSHOT_API_KEY|" .env 2>/dev/null || true
fi
echo "Edit .env and set OPENCLAW_GATEWAY_TOKEN and MOONSHOT_API_KEY if not set: nano .env"

echo "=== Step 12: Create openclaw.json (Telegram + Kimi K 2.5) ==="
TELEGRAM="${TELEGRAM_BOT_TOKEN:-PUT_YOUR_TELEGRAM_BOT_TOKEN_HERE}"
cat > /root/.openclaw/openclaw.json << EOF
{
  "agents": {
    "defaults": {
      "model": { "primary": "moonshot/kimi-k2.5" }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "$TELEGRAM",
      "dmPolicy": "pairing"
    }
  }
}
EOF
chown 1000:1000 /root/.openclaw/openclaw.json
if [ "$TELEGRAM" = "PUT_YOUR_TELEGRAM_BOT_TOKEN_HERE" ]; then
  echo "Edit Telegram token: nano /root/.openclaw/openclaw.json"
fi

echo "=== Step 13: Build and start ==="
docker compose build
docker compose up -d openclaw-gateway

echo "=== Step 14: Recent logs ==="
docker compose logs --tail 30 openclaw-gateway
echo ""
echo "To watch logs: docker compose logs -f openclaw-gateway"
