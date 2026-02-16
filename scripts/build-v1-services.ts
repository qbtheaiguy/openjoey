/**
 * OpenJoey V1 Services Build Script
 * Creates a deployable package with all dependencies
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, cpSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

const BUILD_DIR = "./dist/v1-deploy";
const SOURCE_DIRS = [
  "services",
  "supabase-client.ts",
  "kimi-client.ts",
  "price-service.ts",
  "constants.ts",
  "config.ts",
  "tools",
  "data_harvester",
];

console.log("🏗️  Building OpenJoey V1 Services Package...\n");

// Clean and create build directory
if (existsSync(BUILD_DIR)) {
  execSync(`rm -rf ${BUILD_DIR}`);
}
mkdirSync(BUILD_DIR, { recursive: true });

// Copy source files
console.log("📦 Copying source files...");
SOURCE_DIRS.forEach((dir) => {
  const sourcePath = join("./src/openjoey", dir);
  const targetPath = join(BUILD_DIR, dir);

  if (existsSync(sourcePath)) {
    cpSync(sourcePath, targetPath, { recursive: true });
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ⚠️  ${dir} not found`);
  }
});

// Create proper package.json
console.log("\n📝 Creating package.json...");
const packageJson = {
  name: "openjoey-v1-services",
  version: "1.0.0",
  description: "OpenJoey V1 Trading Services - Production Deployment",
  main: "services/conversation_engine/index.js",
  type: "module",
  scripts: {
    build: "tsc",
    start: "node services/conversation_engine/index.js",
    dev: "node --watch services/conversation_engine/index.js",
    status:
      "ps aux | grep -E 'openjoey|conversation|portfolio|alert|whale|radar|sentiment|signal|indicator' | grep -v grep",
    logs: "tail -f /var/log/openjoey-v1.log",
    test: "echo 'Testing V1 services...' && node --check services/conversation_engine/index.js",
  },
  dependencies: {
    grammy: "^1.21.1",
  },
  devDependencies: {
    typescript: "^5.3.0",
    "@types/node": "^20.10.0",
  },
  engines: {
    node: ">=18.0.0",
  },
  keywords: ["openjoey", "trading", "ai", "telegram", "crypto"],
  author: "OpenJoey Team",
  license: "MIT",
};

writeFileSync(join(BUILD_DIR, "package.json"), JSON.stringify(packageJson, null, 2));

// Create tsconfig.json
console.log("🔧 Creating tsconfig.json...");
const tsConfig = {
  compilerOptions: {
    target: "ES2022",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    outDir: "./dist",
    rootDir: ".",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    declaration: true,
    declarationMap: true,
    sourceMap: true,
  },
  include: ["./**/*.ts"],
  exclude: ["node_modules", "dist", "**/*.test.ts"],
};

writeFileSync(join(BUILD_DIR, "tsconfig.json"), JSON.stringify(tsConfig, null, 2));

// Create deployment script
console.log("🚀 Creating deployment script...");
const deployScript = `#!/bin/bash
# OpenJoey V1 Services Deployment Script
# Run this on Hetzner server

set -e

echo "🚀 Deploying OpenJoey V1 Services..."

# Stop existing services
echo "🛑 Stopping existing V1 services..."
pkill -f "openjoey-v1" || true
pkill -f "conversation-service" || true
pkill -f "portfolio-service" || true
pkill -f "alert-service" || true
pkill -f "whale-service" || true
pkill -f "radar-service" || true
pkill -f "sentiment-service" || true
pkill -f "signal-service" || true
pkill -f "indicator-service" || true

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npx tsc

# Create log directory
mkdir -p /var/log/openjoey

# Start V1 services
echo "▶️  Starting V1 services..."

# Start each service with proper logging
nohup node dist/services/conversation_engine/index.js > /var/log/openjoey/conversation.log 2>&1 &
echo $! > /var/run/openjoey-conversation.pid

nohup node dist/services/portfolio_service/index.js > /var/log/openjoey/portfolio.log 2>&1 &
echo $! > /var/run/openjoey-portfolio.pid

nohup node dist/services/alert_service/index.js > /var/log/openjoey/alert.log 2>&1 &
echo $! > /var/run/openjoey-alert.pid

nohup node dist/services/whale_service/index.js > /var/log/openjoey/whale.log 2>&1 &
echo $! > /var/run/openjoey-whale.pid

nohup node dist/services/radar_service/index.js > /var/log/openjoey/radar.log 2>&1 &
echo $! > /var/run/openjoey-radar.pid

nohup node dist/services/sentiment_service/index.js > /var/log/openjoey/sentiment.log 2>&1 &
echo $! > /var/run/openjoey-sentiment.pid

nohup node dist/services/signal_engine/index.js > /var/log/openjoey/signal.log 2>&1 &
echo $! > /var/run/openjoey-signal.pid

nohup node dist/services/indicator_engine/index.js > /var/log/openjoey/indicator.log 2>&1 &
echo $! > /var/run/openjoey-indicator.pid

echo "✅ OpenJoey V1 Services deployed successfully!"
echo ""
echo "📊 Service Status:"
ps aux | grep -E 'openjoey|conversation|portfolio|alert|whale|radar|sentiment|signal|indicator' | grep -v grep || echo "No services running"
echo ""
echo "📋 Logs: tail -f /var/log/openjoey/*.log"
`;

writeFileSync(join(BUILD_DIR, "deploy.sh"), deployScript);
execSync(`chmod +x ${join(BUILD_DIR, "deploy.sh")}`);

// Create systemd service files
console.log("⚙️  Creating systemd service files...");
const services = [
  "conversation",
  "portfolio",
  "alert",
  "whale",
  "radar",
  "sentiment",
  "signal",
  "indicator",
];

mkdirSync(join(BUILD_DIR, "systemd"), { recursive: true });

services.forEach((service) => {
  const serviceFile = `[Unit]
Description=OpenJoey V1 ${service.charAt(0).toUpperCase() + service.slice(1)} Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/openjoey-v1
ExecStart=/usr/bin/node dist/services/${service}_service/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=append:/var/log/openjoey/${service}.log
StandardError=append:/var/log/openjoey/${service}.log

[Install]
WantedBy=multi-user.target
`;

  writeFileSync(join(BUILD_DIR, "systemd", `openjoey-v1-${service}.service`), serviceFile);
});

// Create install script for systemd
const systemdInstallScript = `#!/bin/bash
# Install OpenJoey V1 Services as systemd services

set -e

echo "⚙️  Installing OpenJoey V1 systemd services..."

# Copy service files
for service in conversation portfolio alert whale radar sentiment signal indicator; do
  cp systemd/openjoey-v1-\${service}.service /etc/systemd/system/
  echo "  ✅ Installed openjoey-v1-\${service}.service"
done

# Reload systemd
systemctl daemon-reload

# Enable services
for service in conversation portfolio alert whale radar sentiment signal indicator; do
  systemctl enable openjoey-v1-\${service}.service
  echo "  ✅ Enabled openjoey-v1-\${service}"
done

echo ""
echo "🚀 Starting services..."
for service in conversation portfolio alert whale radar sentiment signal indicator; do
  systemctl start openjoey-v1-\${service}.service
  echo "  ▶️  Started openjoey-v1-\${service}"
done

echo ""
echo "✅ OpenJoey V1 Services installed as systemd services!"
echo ""
echo "📋 Commands:"
echo "  systemctl status openjoey-v1-conversation"
echo "  systemctl restart openjoey-v1-portfolio"
echo "  journalctl -u openjoey-v1-alert -f"
`;

writeFileSync(join(BUILD_DIR, "install-systemd.sh"), systemdInstallScript);
execSync(`chmod +x ${join(BUILD_DIR, "install-systemd.sh")}`);

// Create README
console.log("📖 Creating deployment README...");
const readme = `# OpenJoey V1 Services - Production Deployment

## 📦 What's Included

This package contains all OpenJoey V1 trading services with proper dependencies:

- **Conversation Engine** - AI chat processing
- **Portfolio Service** - Portfolio tracking
- **Alert Service** - Price alerts
- **Whale Service** - Whale watching
- **Radar Service** - Trending assets
- **Sentiment Service** - Market sentiment
- **Signal Engine** - Trading signals
- **Indicator Engine** - Technical analysis

## 🚀 Quick Deploy

### Option 1: Simple Deployment (Recommended for testing)
\`\`\`bash
# On Hetzner server
cd /opt/openjoey-v1
./deploy.sh
\`\`\`

### Option 2: Systemd Services (Recommended for production)
\`\`\`bash
# On Hetzner server
cd /opt/openjoey-v1
./install-systemd.sh
\`\`\`

## 📊 Monitoring

\`\`\`bash
# Check all services
npm run status

# View logs
tail -f /var/log/openjoey/*.log

# Systemd status
systemctl status openjoey-v1-*
\`\`\`

## 🔧 Configuration

Ensure these environment variables are set:
- \`SUPABASE_URL\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`MOONSHOT_API_KEY\`

## 📁 Directory Structure

\`\`\`
/opt/openjoey-v1/
├── services/           # All V1 services
├── supabase-client.ts # Database client
├── kimi-client.ts     # AI client
├── price-service.ts   # Price data
├── deploy.sh          # Deployment script
├── install-systemd.sh # Systemd installation
└── systemd/           # Service files
\`\`\`

## 🔄 Updates

To update V1 services:
1. Build new package: \`npm run build:v1\`
2. Deploy to Hetzner: \`rsync -avz dist/v1-deploy/ root@hetzner:/opt/openjoey-v1/\`
3. Restart services: \`./deploy.sh\`

## 🆘 Troubleshooting

\`\`\`bash
# Check if services are running
ps aux | grep openjoey

# Check logs
journalctl -u openjoey-v1-conversation -f

# Restart all services
systemctl restart openjoey-v1-*
\`\`\`
`;

writeFileSync(join(BUILD_DIR, "README.md"), readme);

console.log("\n✅ Build complete!");
console.log(`\n📦 Package location: ${BUILD_DIR}`);
console.log("\n🚀 Next steps:");
console.log("  1. Copy package to Hetzner:");
console.log("     rsync -avz dist/v1-deploy/ root@116.203.215.213:/opt/openjoey-v1/");
console.log("  2. SSH to Hetzner and deploy:");
console.log("     ssh root@116.203.215.213");
console.log("     cd /opt/openjoey-v1 && ./deploy.sh");
console.log("");
