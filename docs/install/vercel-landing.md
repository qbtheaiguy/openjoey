# Deploy OpenJoey Landing Page to Vercel

The static landing page lives in **`landing/`** (single `index.html`). To serve it at **openjoey.com** / **web-dhuvk0jda-qbs-projects-2b124455.vercel.app** using the existing Vercel project **"web"**:

## 1. Link this repo to the Vercel project (one-time)

From the repo root:

```bash
vercel link --yes --project web --scope qbs-projects-2b124455
```

This creates `.vercel/` (gitignored) and links to **qbs-projects-2b124455/web**.

## 2. Configure the project in Vercel Dashboard

### Where to find Root Directory

1. Open your project: **[https://vercel.com/qbs-projects-2b124455/web](https://vercel.com/qbs-projects-2b124455/web)**  
   (Or: Vercel → your team **Qb's projects** → project **web**.)

2. Click the **Settings** tab (top navigation, next to Deployments / Domains / etc.).

3. Stay on **General** (first sub-tab under Settings).

4. Scroll to the **Build & Development** section.  
   There you’ll see:
   - **Framework Preset**
   - **Build Command**
   - **Output Directory**
   - **Root Directory** ← this is the one you need.

5. For **Root Directory**:
   - Turn **Override** **ON** (toggle or “Edit”).
   - Enter: **`landing`** (no slash; the folder name only).
   - Save.

6. Also in **Build & Development**:
   - **Framework Preset:** set to **Other** (so Vercel does not run a Next.js build).
   - **Build Command:** leave empty (static, no build).
   - **Output Directory:** leave default.

Direct link to project settings:  
**[https://vercel.com/qbs-projects-2b124455/web/settings](https://vercel.com/qbs-projects-2b124455/web/settings)**

If you don’t see **Root Directory** under General, check the **Git** or **Source** section in Settings—some layouts put it there.

## 3. Deploy

From the repo root:

```bash
vercel --prod
```

Or push to the Git branch connected to **web**; Vercel will build from `landing/` and deploy.

## 4. Domains

The project already has **openjoey.com**, **www.openjoey.com**, and **web-dhuvk0jda-qbs-projects-2b124455.vercel.app**. No extra domain setup is needed.

## Optional: deploy without changing Root Directory

If you prefer not to set Root Directory to `landing`, you can rely on the root **`vercel.json`**:

- `outputDirectory: "landing"` and empty `buildCommand` (and `framework: null`).

Then the repo root is the project root; Vercel will look for built output in `landing/`. For a static site with no build, **Root Directory = `landing`** is the most reliable.
