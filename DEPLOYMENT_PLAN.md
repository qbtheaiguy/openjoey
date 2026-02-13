# OpenJoey Production Deployment Plan

# Hetzner Server: 116.203.215.213

# Database: Supabase (clgplkenrdbxqmkkgyzq)

# Current Status: OpenClaw running with Docker

## 📊 CURRENT PRODUCTION STATE

### Server Details

- **Host**: Hetzner (116.203.215.213)
- **User**: root
- **App Directory**: `/root/openclaw`
- **Current Commit**: `bc42711` - "Deploy: use fetch + reset --hard"
- **Container**: `openclaw:local` running on port 18789

### Current Configuration

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "moonshot/kimi-k2.5"
      }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "simplifiedMenu": true
    }
  },
  "skills": {
    "autoload": ["signal-guru", "research-guru", "alert-guru", "whale-guru", "brave-api-setup"]
  }
}
```

### Environment Variables (Production)

- SUPABASE_URL: https://clgplkenrdbxqmkkgyzq.supabase.co
- MOONSHOT_API_KEY: ✓ Configured
- TELEGRAM_BOT_TOKEN: ✓ Configured
- STRIPE_SECRET_KEY: ✓ Configured

### Database Tables (Expected)

- `users` - Telegram users with tiers/status
- `alerts` - Price alerts
- `usage_events` - Usage tracking
- `referral_leaderboard` - Referral stats
- `sessions` - Active sessions

---

## 🚀 DEPLOYMENT STRATEGY: Blue-Green with Rollback

### Phase 1: Pre-Deployment Safety Checks

#### 1.1 Database Backup

```bash
# Create Supabase backup (manual or use Supabase CLI)
supabase db dump --project-ref clgplkenrdbxqmkkgyzq --output backup-$(date +%Y%m%d).sql

# Verify backup exists
ls -lh /root/backups/
```

#### 1.2 Current State Preservation

```bash
# SSH to server
ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213

# Create full backup of current deployment
cd /root
tar -czf openclaw-backup-$(date +%Y%m%d-%H%M%S).tar.gz openclaw/

# Backup user config
tar -czf openclaw-config-backup-$(date +%Y%m%d-%H%M%S).tar.gz .openclaw/

# Verify Docker volumes are backed up
docker volume ls
```

#### 1.3 Health Check Current System

```bash
cd /root/openclaw

# Check gateway health
curl -s http://127.0.0.1:18789/ | head -20

# Check container status
docker ps

# Check logs (last 100 lines)
docker logs openclaw-openclaw-gateway-1 --tail 100
```

---

### Phase 2: Deploy New Code (Parallel Directory)

#### 2.1 Clone New Codebase

```bash
cd /root

# Clone fresh from your GitHub repo
git clone https://github.com/qbtheaiguy/openjoey.git openjoey-new
cd openjoey-new

# Verify it's the correct commit
git log --oneline -3
# Should show: 98d7a8d feat(openjoey): implement full AI-powered trading assistant architecture
```

#### 2.2 Copy Production Configuration

```bash
cd /root/openjoey-new

# Copy environment from current deployment
cp /root/openclaw/.env .env

# Copy config files
cp /root/openclaw/openclaw.openjoey.json openclaw.openjoey.json

# Update config for OpenJoey (add new fields)
cat >> openclaw.openjoey.json << 'EOF'
,
  "openjoey": {
    "enabled": true,
    "dailyBrief": {
      "enabled": true,
      "time": "09:00",
      "timezone": "UTC"
    },
    "agents": {
      "masterCoordinator": true,
      "newsAgent": true,
      "alertAgent": true,
      "devopsAI": true
    }
  }
EOF
```

#### 2.3 Install Dependencies & Build

```bash
cd /root/openjoey-new

# Install pnpm if not present
npm install -g pnpm

# Install dependencies
pnpm install

# Build the project
pnpm build

# Verify build succeeded
ls -la dist/
```

---

### Phase 3: Database Migration (If Needed)

#### 3.1 Check Current Schema

```bash
# Connect to Supabase (using service role key from .env)
# Check if new tables exist

# Required tables for OpenJoey:
# - users (existing ✓)
# - alerts (existing ✓)
# - usage_events (existing ✓)
# - referral_leaderboard (existing ✓)
# - sessions (existing ✓)
# - skill_usage (may need to add)
# - user_quotas (may need to add)
# - user_watchlist (may need to add)
# - user_favorite_skills (may need to add)
```

#### 3.2 Run Safe Migrations

```bash
# If new tables needed, run migration
cd /root/openjoey-new

# Check for migration files
ls supabase/migrations/

# Apply migrations (if any)
# supabase db push (if using Supabase CLI)
```

---

### Phase 4: Test New Deployment

#### 4.1 Start New Container (Different Port)

```bash
cd /root/openjoey-new

# Create test docker-compose
cat > docker-compose.test.yml << 'EOF'
services:
  openjoey-gateway-test:
    build: .
    image: openjoey:test
    network_mode: host
    environment:
      HOME: /home/node
      TERM: xterm-256color
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      MOONSHOT_API_KEY: ${MOONSHOT_API_KEY}
      BRAVE_API_KEY: ${BRAVE_API_KEY}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    volumes:
      - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
      - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
    init: true
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "127.0.0.1",
        "--port",
        "18790"
      ]
EOF

# Build test image
docker build -t openjoey:test .

# Start test container
docker-compose -f docker-compose.test.yml up -d

# Check test container logs
docker logs openjoey-openjoey-gateway-test-1 --tail 50

# Test health endpoint
curl -s http://127.0.0.1:18790/ | head -20
```

#### 4.2 Verify Core Functionality

```bash
# Test 1: Gateway responds
curl http://127.0.0.1:18790/

# Test 2: Database connection works
# (Check logs for DB connection success)
docker logs openjoey-openjoey-gateway-test-1 | grep -i "database\|supabase\|connected"

# Test 3: Telegram bot webhook (if applicable)
# Check Telegram BotFather for webhook status
```

---

### Phase 5: Switch Production Traffic

#### 5.1 Graceful Switch

```bash
cd /root

# Option A: Port Swap (Instant)
# 1. Stop old container
docker stop openclaw-openclaw-gateway-1

# 2. Start new container on port 18789
cd /root/openjoey-new
docker-compose up -d

# Option B: Rolling Update (Safer)
# 1. Update docker-compose to use new image
cd /root/openclaw

# 2. Pull new code
git fetch origin
git checkout 98d7a8d

# 3. Rebuild
docker-compose build

# 4. Rolling restart
docker-compose up -d
```

#### 5.2 Verify Production Switch

```bash
# Check new container is running
docker ps

# Check health endpoint on production port
curl -s http://127.0.0.1:18789/ | head -20

# Check logs for errors
docker logs <new-container-name> --tail 100

# Test Telegram bot is responding
# Send /start to bot and verify response
```

---

### Phase 6: Monitor & Validate

#### 6.1 Watch Critical Metrics (First 30 minutes)

```bash
# Monitor container health
watch -n 5 'docker ps && docker stats --no-stream'

# Monitor logs for errors
docker logs -f <new-container-name> 2>&1 | grep -i "error\|fail\|exception"

# Monitor user activity
# (Check Telegram bot is receiving messages)
```

#### 6.2 Validation Checklist

- [ ] Gateway health endpoint returns OK
- [ ] Telegram bot responds to /start
- [ ] Users can run /status command
- [ ] Database connections successful
- [ ] No errors in logs for 10 minutes
- [ ] Memory usage stable
- [ ] CPU usage normal

---

## 🔙 ROLLBACK STRATEGY

### Immediate Rollback (If Critical Failure)

```bash
# 1. Stop new container
cd /root/openjoey-new
docker-compose down

# 2. Start old container
cd /root/openclaw
docker start openclaw-openclaw-gateway-1

# 3. Verify old system is running
curl http://127.0.0.1:18789/
docker ps

# 4. Check Telegram bot is responding
```

### Data Rollback (If Database Issues)

```bash
# If database was corrupted, restore from backup
# (Use Supabase dashboard or CLI)
supabase db restore --project-ref clgplkenrdbxqmkkgyzq --backup-file backup-YYYYMMDD.sql
```

### Full System Rollback

```bash
cd /root

# Stop all containers
docker stop $(docker ps -q)

# Restore from backup tar
tar -xzf openclaw-backup-YYYYMMDD.tar.gz

# Restart original
cd openclaw
docker-compose up -d
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Before Starting Deployment

- [ ] Database backup created
- [ ] Current code backup created
- [ ] User config backup created
- [ ] All env vars documented
- [ ] Rollback plan reviewed
- [ ] Maintenance window scheduled (if needed)

### During Deployment

- [ ] Test container runs successfully
- [ ] Database connections verified
- [ ] Telegram bot responds
- [ ] No critical errors in logs
- [ ] Health checks passing

### Post-Deployment

- [ ] Monitor for 30 minutes
- [ ] Verify user interactions work
- [ ] Check admin dashboard loads
- [ ] Confirm monitoring is active
- [ ] Document any issues

---

## 🚨 EMERGENCY CONTACTS & PROCEDURES

### If Deployment Fails

1. **Immediate**: Stop new container, restart old
2. **Database Issues**: Restore from Supabase backup
3. **Telegram Issues**: Check BotFather webhook settings
4. **User Impact**: Post status update if needed

### Key Files to Preserve

- `/root/.openclaw/` - User configurations
- `/root/openclaw/.env` - Environment variables
- `/root/openclaw/openclaw.openjoey.json` - Bot configuration
- Supabase database - User data, alerts, subscriptions

---

## 🎯 DEPLOYMENT COMMANDS SUMMARY

```bash
# 1. SSH to server
ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213

# 2. Create backups
cd /root && tar -czf openclaw-backup-$(date +%Y%m%d).tar.gz openclaw/ .openclaw/

# 3. Clone new code
git clone https://github.com/qbtheaiguy/openjoey.git openjoey-new

# 4. Copy config
cd openjoey-new && cp ../openclaw/.env . && cp ../openclaw/openclaw.openjoey.json .

# 5. Build
pnpm install && pnpm build

# 6. Test on port 18790
docker build -t openjoey:test . && docker run -d -p 18790:18790 openjoey:test

# 7. Switch production
# (Stop old, start new on port 18789)
```

---

## ✅ SUCCESS CRITERIA

Deployment is **SUCCESSFUL** when:

1. Gateway health check passes
2. Telegram bot responds within 3 seconds
3. Database queries return in <500ms
4. No error spikes in logs
5. Users can access all existing features
6. New OpenJoey features (daily brief, multi-agent) work

Deployment is **FAILED** when:

1. Gateway health check fails for >2 minutes
2. Telegram bot stops responding
3. Database connection errors
4. User complaints of broken features
5. Memory/CPU usage spikes uncontrollably

---

**Ready to Deploy**: ☐  
**Deployment Date**: ****\_\_\_****  
**Deployed By**: ****\_\_\_****  
**Rollback Time**: ****\_\_\_**** (if needed)
