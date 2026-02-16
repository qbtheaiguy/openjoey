#!/bin/bash
# Deploy Multi-Chain Price Service to Hetzner
# Replaces mock data with real multi-chain API integration

set -e

echo "🚀 Deploying Multi-Chain Price Service to Hetzner..."

# Copy updated price service
echo "📦 Copying price service..."
scp -r /Users/theaiguy/CascadeProjects/openjoey-main/src/openjoey/services/price-service/ root@116.203.215.213:/opt/openjoey/services/

# Copy updated radar service  
echo "📦 Copying radar service..."
scp /Users/theaiguy/CascadeProjects/openjoey-main/src/openjoey/services/radar_service/index.ts root@116.203.215.213:/opt/openjoey/services/radar_service/

# Restart V1 services to pick up new code
echo "🔄 Restarting V1 services..."
ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213 "/opt/openjoey/v1-services.sh restart"

echo "✅ Multi-Chain Price Service deployed!"
echo ""
echo "🧪 What changed:"
echo "  • Real API integration (DexScreener, Binance, Jupiter)"
echo "  • Chain detection (Solana, Ethereum, BSC)"
echo "  • Risk scoring per blockchain"
echo "  • Smart caching with fallback"
echo ""
echo "📊 Test commands:"
echo "  /price RAY"
echo "  /trending solana"
echo "  /portfolio"
echo ""
echo "🎯 V1 is now using REAL market data!"
