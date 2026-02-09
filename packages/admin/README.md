# OpenJoey Admin Dashboard

Next.js 15 (App Router) dashboard for OpenJoey: real-time metrics, usage logs, skill popularity, and estimated revenue from your Supabase backend. Designed to match the openjoey.com design system (white-on-white, orange `#e8613c` accents, glassmorphism).

## Features

- **Real-time metrics:** Total users, usage count, estimated revenue, success rate
- **Usage logs:** Recent skill executions (e.g. meme-guru, signal-guru) with status
- **Skill popularity:** Breakdown of which agents drive the most engagement
- **Design:** Inter typography, pill buttons, soft radial glows; aligned with openjoey.com
- **Performance:** Server Actions for secure, fast data fetching from Supabase

## Tech stack

- Next.js 15 (App Router), React 19
- Supabase (service-role REST client)
- Lucide React icons

## Local development

```bash
# From repo root
pnpm --filter @openjoey/admin dev

# Or from packages/admin
pnpm dev
```

Runs at [http://localhost:3001](http://localhost:3001).

### Environment variables

Create `packages/admin/.env.local` (do not commit):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Use the same Supabase project and **service role** key as the OpenJoey gateway. Keep the key server-side only.

## Deploy to Vercel (admin.openjoey.com)

1. In Vercel, create or use a project for this repo.
2. Set **Root Directory** to `packages/admin`.
3. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Add domain `admin.openjoey.com` in **Settings → Domains** and configure DNS.

See **[OpenJoey Admin – Deploy to Vercel](../../docs/install/openjoey-admin-vercel.md)** in the repo docs for full steps and security notes.

## Build

```bash
pnpm build
```

Produces an optimized production bundle. Vercel runs this automatically when Root Directory is `packages/admin`.
