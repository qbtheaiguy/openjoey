# Chrome Extension Error Fix

## Problem

Chrome extensions (especially MetaMask) can interfere with Next.js development server, causing errors like:

```
Cannot read properties of null (reading 'target')
```

## Solutions Applied

### 1. Webpack Configuration (next.config.ts)

- Added externals to ignore Chrome extension scripts
- Added fallbacks for Node.js modules that aren't needed in browser

### 2. Additional Solutions (if needed)

#### Option A: Disable Chrome Extensions Temporarily

1. Open Chrome in incognito mode (extensions disabled by default)
2. Or disable specific extensions in Chrome settings

#### Option B: Use Different Browser

- Use Firefox or Safari for development
- Extensions won't interfere

#### Option C: Environment Variable

Add to `.env.local`:

```bash
CHROME_EXTENSION_COMPATIBILITY=true
```

#### Option D: Browser Launch Flags

Launch Chrome with:

```bash
google-chrome --disable-extensions --disable-web-security
```

## Testing

After applying the webpack config:

1. Restart the dev server: `pnpm dev`
2. Clear browser cache
3. Reload the page

The error should be resolved while maintaining all admin functionality.
