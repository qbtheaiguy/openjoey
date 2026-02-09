# Redis on Hetzner for OpenJoey (reply cache)

OpenJoey uses an optional Redis instance to cache agent replies (Phase 3). If `OPENJOEY_REDIS_URL` or `REDIS_URL` is set, repeated similar messages within a time window can be answered from cache instead of calling the Guru again.

## Install Redis on the Hetzner server

On the OpenJoey Hetzner box (e.g. Debian/Ubuntu):

```bash
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

By default Redis listens on `127.0.0.1:6379`. To allow the gateway (running on the same host) to use it:

- Leave bind as `127.0.0.1` (default) so only local processes can connect.
- Set in the gateway environment: `OPENJOEY_REDIS_URL=redis://127.0.0.1:6379` or `REDIS_URL=redis://127.0.0.1:6379`.

## Add Redis URL to gateway env

If the gateway runs via Docker Compose and uses a `.env` file in the project dir (e.g. `/root/openclaw/.env`):

```bash
echo 'OPENJOEY_REDIS_URL=redis://127.0.0.1:6379' >> /root/openclaw/.env
docker compose restart openclaw-gateway
```

If the gateway runs as a systemd service or directly, add the same variable to the environment (e.g. in the service file or the shell that starts the process).

## Behavior when Redis is unavailable

If Redis is not installed or the URL is not set, the reply cache is skipped: every message is processed by the agent. If the URL is set but Redis is down, the first connection attempt fails and cache read/write is skipped for that process; the agent still runs as usual.
