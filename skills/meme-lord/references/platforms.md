# Platform-Specific Scanning Guides

## Free APIs Overview

All platforms listed here offer **free API tiers** perfect for Meme Lord:

| Platform          | Free Tier     | Rate Limits | Best For                 |
| ----------------- | ------------- | ----------- | ------------------------ |
| **DexScreener**   | Unlimited     | None        | Real-time data, trending |
| **GeckoTerminal** | Unlimited     | 30 req/min  | Volume analysis, history |
| **DEXTools**      | 1M credits/mo | Variable    | Ethereum/BSC depth       |
| **GMGN.ai**       | Limited       | Unknown     | Solana whale tracking    |

---

## DexScreener ⭐ (Recommended)

**Website:** https://dexscreener.com  
**API Docs:** https://docs.dexscreener.com/  
**Pricing:** 100% FREE, no API key needed

### Why Use It:

- ✅ Fastest real-time updates
- ✅ Multi-chain support (Solana, ETH, BSC, Base, etc.)
- ✅ No rate limits
- ✅ Boosted tokens endpoint (trending)

### API Endpoints:

```bash
# Get trending/boosted tokens
curl "https://api.dexscreener.com/token-boosts/top/v1"

# Get specific token pairs
curl "https://api.dexscreener.com/latest/dex/tokens/{tokenAddress}"

# Get all pairs for a chain
curl "https://api.dexscreener.com/latest/dex/pairs/{chain}"

# Search for tokens
curl "https://api.dexscreener.com/latest/dex/search?q={query}"
```

### Supported Chains:

- `solana` - Solana
- `ethereum` - Ethereum
- `bsc` - Binance Smart Chain
- `base` - Base
- `arbitrum` - Arbitrum
- `optimism` - Optimism
- `avalanche` - Avalanche
- `polygon` - Polygon

---

## GeckoTerminal ⭐ (Recommended)

**Website:** https://geckoterminal.com  
**API Docs:** https://api.geckoterminal.com/docs/  
**Pricing:** FREE, 30 requests/minute

### Why Use It:

- ✅ Part of CoinGecko ecosystem
- ✅ Historical data available
- ✅ Network statistics
- ✅ Pool-level granularity

### API Endpoints:

```bash
# List all networks
curl "https://api.geckoterminal.com/api/v2/networks"

# Get trending pools for a network
curl "https://api.geckoterminal.com/api/v2/networks/{network}/pools?page=1"

# Get specific token
curl "https://api.geckoterminal.com/api/v2/networks/{network}/tokens/{tokenAddress}"

# Get token pools
curl "https://api.geckoterminal.com/api/v2/networks/{network}/tokens/{tokenAddress}/pools"
```

### Network IDs:

- `solana` - Solana
- `eth` - Ethereum
- `bsc` - BSC
- `base` - Base
- `arbitrum` - Arbitrum
- `optimism` - Optimism
- `polygon_pos` - Polygon

---

## DEXTools (Free Tier Available)

**Website:** https://dextools.io  
**API Docs:** https://public-api.dextools.io/  
**Pricing:** Free tier = 1M API credits/month

### Why Use It:

- ✅ Deep Ethereum & BSC data
- ✅ Score/rating system
- ✅ Social metrics integration
- ✅ Hot pairs endpoint

### Getting API Key:

1. Go to https://public-api.dextools.io/
2. Sign up for free tier
3. Get API key
4. Include in headers: `X-API-Key: your-key`

### API Endpoints (with key):

```bash
# Get hot pairs
curl "https://public-api.dextools.io/trial/v2/pools/hot" \
  -H "X-API-Key: YOUR_KEY"

# Get token info
curl "https://public-api.dextools.io/trial/v2/token/{chain}/{address}" \
  -H "X-API-Key: YOUR_KEY"
```

---

## GMGN.ai (Solana Focused)

**Website:** https://gmgn.ai  
**API:** Limited public endpoints

### Why Use It:

- ✅ Best Solana whale tracking
- ✅ Smart money flows
- ✅ Paper hands vs diamond hands
- ✅ Real-time alerts

### Note:

GMGN doesn't have a fully public API, but you can:

1. Scrape their web interface
2. Use their embeddable widgets
3. Monitor their public pages

### Useful URLs:

```
https://gmgn.ai/sol/token/{tokenAddress}
https://gmgn.ai/sol/address/{walletAddress}
```

---

## Multi-Platform Strategy

### Why Use Multiple Platforms?

1. **Data Verification**
   - If DexScreener shows $100K volume but GeckoTerminal shows $50K → investigate
   - Cross-platform consistency = higher confidence

2. **Coverage Gaps**
   - Some tokens only listed on certain platforms
   - New pairs appear on DexScreener first
   - Historical data better on GeckoTerminal

3. **Rate Limit Balancing**
   - Spread requests across platforms
   - Failover if one platform is down

### Recommended Priority:

**For Live Hunting:**

1. DexScreener (real-time, no limits)
2. GeckoTerminal (validation)
3. DEXTools (if you have API key)

**For Deep Analysis:**

1. GeckoTerminal (historical context)
2. DexScreener (current state)
3. GMGN (Solana whale data - manual check)

---

## Implementation Notes

### Error Handling

```javascript
// Always have fallbacks
const fetchWithFallback = async (token) => {
  try {
    return await fetchDexScreener(token);
  } catch {
    try {
      return await fetchGeckoTerminal(token);
    } catch {
      return null; // Both failed
    }
  }
};
```

### Rate Limiting

```javascript
// Respect rate limits
const delays = {
  dexscreener: 0, // No limit
  geckoterminal: 2000, // 30 req/min = 1 every 2s
  dextools: 1000, // Depends on tier
};
```

### Data Merging

```javascript
// Merge data from multiple sources
const mergeTokenData = (sources) => {
  return {
    priceUsd: average(sources.map((s) => s.priceUsd)),
    liquidityUsd: max(sources.map((s) => s.liquidityUsd)),
    volume24hUsd: sum(sources.map((s) => s.volume24hUsd)),
    sources: sources.map((s) => s.platform),
  };
};
```

---

## Testing APIs

Quick test commands:

```bash
# Test DexScreener
curl -s "https://api.dexscreener.com/latest/dex/pairs/solana" | jq '.pairs[0]'

# Test GeckoTerminal
curl -s "https://api.geckoterminal.com/api/v2/networks/solana/pools?page=1" | jq '.data[0]'

# Test DEXTools (needs key)
curl -s "https://public-api.dextools.io/trial/v2/pools/hot" \
  -H "X-API-Key: YOUR_KEY" | jq
```
