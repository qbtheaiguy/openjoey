# Contract Verification Procedures

Use this when running Phase 2 (Safety Check) or the `meme-lord safety` command. Cross-check with blockchain explorers before any BUY signal.

## 1. Verification Status

**Goal:** Confirm the contract source code is published and matches bytecode.

| Chain    | Explorer     | Where to check                                 |
| -------- | ------------ | ---------------------------------------------- |
| Solana   | solscan.io   | Token → Contract → "Verified" badge            |
| Ethereum | etherscan.io | Contract tab → "Contract Source Code Verified" |
| BSC      | bscscan.com  | Contract tab → "Contract Source Code Verified" |
| Base     | basescan.org | Contract tab → Verified                        |
| Arbitrum | arbiscan.io  | Contract tab → Verified                        |

**Procedure:**

1. Open explorer for the chain.
2. Paste token/contract address.
3. Go to Contract / Code section.
4. **Pass:** "Verified" or source code visible. **Fail:** "Not verified" or bytecode only.

## 2. Ownership Check

**Goal:** Ensure no single party can change fees, pause, or mint.

- **EVM (Etherscan/BscScan/BaseScan):** Contract → Read → `owner()` or `getOwner()`.
- **Solana:** Check program upgrade authority; prefer immutable (no upgrade key).

**Pass:** Owner is zero address (`0x000...`) or "Renounced".  
**Fail:** Owner is a normal wallet (dev can change contract).

## 3. Mint / Supply Cap

**Goal:** No infinite mint.

- **EVM:** Read contract for `mint()`, `mintTo()`, or similar. Confirm they are disabled, restricted, or onlyOwner with no active mint path.
- **Solana:** Check total supply and whether program can create new tokens.

**Pass:** No active mint or supply fixed. **Fail:** Public or onlyOwner mint that can be called.

## 4. Suspicious Functions (EVM)

Scan contract (or use Token Sniffer / RugCheck) for:

- `blacklist()` / `excludeFromFee()` — can block sells.
- `setMaxTxAmount()` / `setMaxWallet()` — can cap sells.
- `setTax()` / `setFee()` — can raise sell tax.
- `pause()` / `pauseTrading()` — can halt trading.

**Pass:** None of these, or they are disabled/renounced. **Fail:** Active admin controls that affect selling.

## 5. Liquidity Lock / Burn

**Goal:** LP cannot be pulled by dev.

- **EVM:** LP token holder should be a lock contract (e.g. Team.Finance, Unicrypt) or dead address; lock duration visible.
- **Solana:** LP in burn address or time-locked; no single wallet holding withdrawable LP.

**Pass:** LP burned or locked (e.g. >1 year). **Fail:** LP in dev/team wallet, unlock soon, or unknown.

## 6. Quick Checklist (per token)

```
□ Contract verified on explorer
□ owner() = zero / renounced
□ No active mint
□ No blacklist / pause / fee-change that can trap sells
□ LP locked or burned
□ Cross-check with red-flags.md and safety APIs (Honeypot.is, RugCheck.xyz)
```

## 7. Safety APIs (automation)

- **Honeypot.is** — Honeypot/sell restriction check (EVM).
- **Token Sniffer** — Contract score and flags.
- **RugCheck.xyz** — Solana-focused rug and LP checks.

Use these in addition to manual explorer checks; treat "unsafe" or "honeypot" as auto-reject.
