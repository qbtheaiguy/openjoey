---
name: trade-news-feeds
description: >
  Get the latest trade-relevant news fast — Fed, crypto, gold, stocks, forex. RSS-based;
  used by the daily brief and for on-demand "what's the news?" / "what's moving?". Use when the user
  asks for Fed news, crypto headlines, gold/market news, or anything that might affect their trading.
metadata:
  openclaw:
    emoji: "📰"
    requires: { bins: [] }
---

# Trade News Feeds

Quick, RSS-based headlines for **Fed, crypto, gold, stocks, forex** — so users get info fast and can act on it.

## When to use

Use this skill when the user asks for:

- "Latest Fed news" / "What did the Fed say?" / "FOMC"
- "Crypto news" / "Bitcoin headlines" / "What's moving in crypto?"
- "Gold news" / "Commodity headlines"
- "Stock market news" / "What's moving in markets?"
- "Forex news" / "DXY / dollar news"
- "Any news that could affect my trades" / "Trade news"

Goal: **return a short list of real headlines with links** so they can click and act.

## How to get the data

From the **OpenJoey repo root** (e.g. on the server or dev machine):

```bash
bun run scripts/fetch-trade-news.ts --pretty
```

Output is JSON: `[{ "title": "...", "url": "..." }, ...]`. Format for the user as a short list with clickable links (e.g. Markdown or Telegram HTML).

Example reply style:

```
📰 **Latest trade news**

• [Fed holds rates steady; signals one cut in 2025](https://…)
• [Bitcoin holds above $97k as ETF flows stay positive](https://…)
• [Gold hits record on haven demand](https://…)
• [DXY weakens on soft jobs data](https://…)

— Joey, your personal AI trading assistant
```

If the script is not available (e.g. user is not in OpenJoey repo), use web search for the same topics and return 3–5 headlines with links.

## Feeds (what we pull)

Same sources as the **daily brief**:

- **Fed** — federalreserve.gov press
- **Crypto** — Coindesk, CryptoNews
- **Gold** — Kitco
- **Markets** — MarketWatch, Investing.com

All public RSS; no API keys. Data is fresh (typically last few hours).

## Speed

- Fetch runs in parallel with an 8s total timeout.
- Prefer returning 5–10 items; if the user wants "everything", cap at ~15 and add "Reply with 'more' for more."

## Acting on the info

After showing headlines:

- Offer to "set an alert for [symbol]" if they mention one.
- Offer to "summarize one article" if they pick a link.
- For "what should I do?", remind them this is news only — not financial advice — and suggest they check the links and their own strategy.
