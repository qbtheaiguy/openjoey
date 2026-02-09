# OpenJoey Admin Dashboard – Deploy to admin.openjoey.com (Vercel)

The OpenJoey Admin Dashboard lives in `packages/admin`. It is a Next.js 15 (App Router) app that talks to your Supabase backend and is intended to be deployed at **admin.openjoey.com** on Vercel.

## Prerequisites

- The repo is connected to Vercel (same org/team as openjoey.com, or a separate project).
- Supabase project for OpenJoey with `users` and `skill_usage` (or equivalent) tables.
- Supabase URL and **service role** key (server-only; never expose in the client).

## Vercel project setup

1. **Git (optional)**  
   If you use Git-based deploys: **Settings** → **Git** → connect the repo (e.g. `qbtheaiguy/openjoey`) and set **Root Directory** to `packages/admin`.  
   If you deploy **only via CLI** (manual), leave Git disconnected and set **Root Directory** to **empty** (see step 2).

2. **Root Directory**
   - **Manual deploy (CLI only):** Set **Root Directory** to **empty** (Override on, value blank). Then deploy from your machine with `cd packages/admin && vercel deploy --prod`.
   - **Git deploy:** Set **Root Directory** to `packages/admin` so Vercel builds that folder from the cloned repo.

3. **Framework preset**  
   Vercel should detect **Next.js** from `packages/admin/next.config.ts`. No override needed.

4. **Environment variables**  
   In the Vercel project → **Settings** → **Environment Variables**, add:

   | Name                        | Value                     | Environments        |
   | --------------------------- | ------------------------- | ------------------- |
   | `SUPABASE_URL`              | Your Supabase project URL | Production, Preview |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Production, Preview |

   Use the same Supabase project and service role key as the OpenJoey gateway. Restrict the key to server-side only (Next.js Server Actions / API routes); never expose it to the browser.

   **Add via CLI (from `packages/admin`):** run the following and paste the value when prompted (Production, then Preview for each):

   ```bash
   cd packages/admin
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_URL preview
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY preview
   ```

   Then trigger a redeploy so the new variables are applied.

5. **Build and deploy**
   - **Manual (CLI):** From repo root: `cd packages/admin && vercel deploy --prod`. Ensure the project’s Root Directory is **empty** in Vercel (Settings → General) so the upload from `packages/admin` is the project root.
   - **Git:** Trigger a deploy via push or **Redeploy** in the dashboard. Root Directory must be `packages/admin`.

## Custom domain (admin.openjoey.com)

1. In the Vercel project: **Settings** → **Domains**.
2. Add `admin.openjoey.com`.
3. Add the DNS record Vercel shows (CNAME to `cname.vercel-dns.com` or the given target).  
   If openjoey.com is already on Vercel, you can use the same root domain and add the subdomain in the same place or in this project’s Domains.

After DNS propagates, the dashboard will be available at **https://admin.openjoey.com**.

## Local development

From the repo root:

```bash
pnpm --filter @openjoey/admin dev
```

Or from `packages/admin`:

```bash
pnpm dev
```

Create a `.env.local` in `packages/admin` with:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Do not commit `.env.local` or the service role key.

## Security notes

- The dashboard uses the **Supabase service role key**, which bypasses RLS. Restrict it to server-side code only (Server Actions / API routes).
- Restrict access to admin.openjoey.com (e.g. Vercel password protection, or add auth in the app) so only operators can view usage and revenue.

## Package location and build

- **Package:** `packages/admin` (name: `@openjoey/admin`).
- **Build:** `pnpm build` from `packages/admin` (runs `next build`).
- **Start:** `pnpm start` (runs `next start`).

## Troubleshooting

### "The specified Root Directory packages/admin does not exist"

This happens when the project builds from Git but the connected repo or branch does not contain `packages/admin`, or the Root Directory is wrong.

1. **Confirm Git repo**  
   Vercel → **openjoey-admin** → **Settings** → **Git**. The connected repository must be the **full monorepo** that has a `packages/admin` folder at the repo root (e.g. your fork of openclaw or the repo that contains this doc). If you connected a different repo (e.g. one that only has the admin app at root), disconnect it and import the correct repo.

2. **Set Root Directory**  
   **Settings** → **General** → **Root Directory**. Use exactly:

   ```text
   packages/admin
   ```

   No leading slash (`/packages/admin`), no trailing slash (`packages/admin/`). Turn **Override** on and save.

3. **Branch**  
   Ensure the deployed branch (e.g. `main`) actually has the `packages/admin` folder. Push your latest code so that branch includes it.

4. **Redeploy**  
   After fixing, use **Deployments** → **Redeploy** on the latest deployment, or push a new commit.
