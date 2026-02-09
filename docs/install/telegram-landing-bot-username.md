# Fix: "Sorry, this user doesn't seem to exist" on Start on Telegram

If users click **Start on Telegram** on the landing page and Telegram shows **"Sorry, this user doesn't seem to exist"**, the link is pointing at a bot username that does not exist (or was changed).

## Cause

The landing page uses a **single config** for the Telegram bot username. That username must match the bot that receives your `TELEGRAM_BOT_TOKEN` on the server. If the token was created for a different bot (e.g. `openjoey_bot`), the link must use that username, not `OpenJoeyBot`.

## Fix

1. **Get your bot’s real username**
   - In Telegram, open the chat with your bot (the one that works when you message it).
   - Tap the bot’s name at the top → you’ll see **@username** (e.g. `@openjoey_bot`).
   - Or ask BotFather: send `/mybots` → choose your bot → see **Username**.

2. **Set it on the landing page (one place)**
   - Open **`landing/index.html`**.
   - Find the `<body>` tag (near line 768). It has:
     ```html
     <body data-telegram-bot="OpenJoeyBot"></body>
     ```
   - Change `OpenJoeyBot` to your bot’s username **without** the `@`:
     ```html
     <body data-telegram-bot="openjoey_bot"></body>
     ```
   - Save the file.

3. **Redeploy the landing**
   - From the repo root: `vercel --prod` (see [vercel-landing.md](./vercel-landing.md)).

All “Start on Telegram” links and the “Search @…” heading are driven by this single `data-telegram-bot` value.

## Optional: use the name OpenJoeyBot

If you want the link to be **t.me/OpenJoeyBot**:

1. In Telegram, open **@BotFather**.
2. Create a new bot (or choose an existing one).
3. Use **Edit Bot** → **Edit Username** and set the username to **OpenJoeyBot** (if it’s still free).
4. Use that bot’s token as `TELEGRAM_BOT_TOKEN` on your server and keep `data-telegram-bot="OpenJoeyBot"` on the landing.
