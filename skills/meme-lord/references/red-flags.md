# Red Flags - Complete Rug/Honeypot Detection

## 🚨 CRITICAL RED FLAGS (Auto-Avoid)

### 1. Honeypot Detection

**What it is:** You can buy but can't sell

**How to Check:**

- Use Honeypot.is
- Attempt small test sell (if testing with real money)
- Check if sell function is disabled in contract

**Red Flag:** Any indication selling is blocked or taxed >50%

### 2. Contract Not Verified

**What it is:** Source code not published on explorer

**How to Check:**

- Solscan/Etherscan → Contract → Code tab
- Should show "Verified" or source code

**Red Flag:** "Contract source code not verified"

### 3. Mint Function Enabled

**What it is:** Owner can create infinite new tokens

**How to Check:**

- Look for `mint()` function in contract
- Check if it's onlyOwner or public

**Red Flag:** Mint function exists and can be called

### 4. Ownership Not Renounced

**What it is:** Developer still has admin control

**How to Check:**

- Contract → Read → owner()
- Check if owner is zero address (0x000...)

**Red Flag:** Owner is a real wallet (not zero address)

### 5. Suspicious Admin Functions

**Look for:**

- `blacklist()` — Can block wallets from selling
- `setMaxTxAmount()` — Can limit how much you can sell
- `setTax()` — Can change buy/sell tax to 99%
- `pause()` — Can pause trading

**Red Flag:** Any function that restricts selling or transfers

### 6. Liquidity Issues

**Not Locked/Burned:**

- LP tokens still in dev wallet
- Can be withdrawn anytime

**How to Check:**

- Solscan → LP token account
- Check if LP is burned or locked in locker

**Red Flag:** LP not locked/burned for >6 months

**Low Liquidity:**

- Liquidity <30% of market cap
- High price impact on sells

**Red Flag:** $100K MC with $20K liquidity (20% ratio)

### 7. Whale Concentration

**Single Wallet >10%:**

- Can dump and crash price
- Often dev wallet

**Team Wallets Combined >20%:**

- Coordinated dump risk
- Check multiple related wallets

**How to Check:**

- DexScreener → Holders tab
- Top 10 holders distribution

### 8. Tax Issues

**Buy Tax >10%:**

- Reduces your entry value immediately
- Often hidden in contract

**Sell Tax >15%:**

- Harder to profit
- Traps you in position

**Hidden Taxes:**

- Check `transfer()` function
- Some taxes only trigger on sells to DEX

### 9. Known Scammer

**How to Check:**

- Contract deployer address
- Check against rugcheck.xyz database
- Search deployer on Twitter for scam reports

**Red Flag:** Deployer has launched >3 tokens that went to zero

### 10. Copycat Token

**Red Flags:**

- Name similar to successful token (SHIB2, DOGE3)
- Trying to ride hype of legitimate project
- Often launched hours after original moons

## ⚠️ CAUTION FLAGS (Higher Scrutiny)

### 1. Very New Contract (<24 hours)

- Not enough history to analyze
- High risk of early dump
- Wait for patterns to emerge

### 2. Suspicious Tokenomics

- 50%+ supply in one wallet
- Massive airdrops to random wallets
- Unusual distribution at launch

### 3. Fake Volume

- Wash trading to appear active
- Check if volume matches holder count
- Sudden volume spike without price move

### 4. No Social Presence

- No Twitter/X
- No Telegram
- No website
- Hard to verify legitimacy

### 5. Renounced But With Backdoor

- Some contracts have hidden mint functions
- Only trigger under specific conditions
- Requires deep contract analysis

## ✅ GREEN FLAGS (Positive Signs)

- Contract verified and audited
- Ownership renounced to zero address
- Liquidity burned (not just locked)
- Fair launch (no team allocation)
- Active community with real engagement
- Transparent dev team (doxxed or reputable)
- Utility or unique feature (not just memes)
- Consistent holder growth
- Healthy buy/sell ratio

## Safety Check Workflow

```
1. Check Honeypot.is → Should be SAFE
2. Verify contract on explorer → Should show source code
3. Check owner() → Should be zero address
4. Scan contract for suspicious functions
5. Check LP status → Should be locked/burned
6. Analyze holder distribution → No wallet >10%
7. Check taxes → Buy <5%, Sell <10%
8. Verify deployer history → Not known scammer
9. Check socials → Active, real community
10. Only then consider buying
```

## Tools for Checking

- **honeypot.is** — Honeypot detection
- **tokensniffer.com** — Comprehensive contract check
- **rugcheck.xyz** — Solana-specific rug checker
- **solscan.io** — Solana contract verification
- **etherscan.io** — Ethereum contract verification
