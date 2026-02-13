# OpenJoey Cleanup Plan

**Status:** In Progress  
**Goal:** Remove OpenClaw-specific modules while maintaining production stability

## ✅ Phase 1: Safe Deletions (COMPLETED)

### Deleted Modules

- ✅ `src/macos/` — macOS-specific tools (0 dependencies)
- ✅ `src/channels/plugins/bluebubbles-actions.ts` — iMessage bridge

## 🔄 Phase 2: Runtime Disabling (IN PROGRESS)

### Modules to Disable via Runtime Flags

These modules have too many dependencies to delete safely, but should be disabled:

1. **Browser Automation** (`src/browser/`)
   - **Dependencies:** 23 files import from browser/
   - **Strategy:** Add `OPENJOEY_DISABLE_BROWSER=1` env var check
   - **Files to modify:**
     - `src/browser/config.ts` — return `enabled: false` when env var set
     - `src/gateway/server-methods/browser.ts` — early return when disabled
     - `src/agents/tools/browser-tool.ts` — throw error when disabled

2. **Canvas Host** (`src/canvas-host/`)
   - **Dependencies:** 6 gateway files
   - **Strategy:** Already has `OPENCLAW_SKIP_CANVAS_HOST` env var
   - **Action:** Document and enforce in production

3. **Node Host** (`src/node-host/`)
   - **Dependencies:** 3 CLI files
   - **Strategy:** Add `OPENJOEY_DISABLE_NODE_HOST=1` check
   - **Action:** Disable in CLI entry points

## 📋 Phase 3: Config Schema Cleanup (PENDING)

### iMessage/BlueBubbles References to Remove

- `src/config/schema.ts` — Remove iMessage/BlueBubbles labels
- `src/config/zod-schema.providers.ts` — Remove iMessage/BlueBubbles schemas
- `src/config/types.hooks.ts` — Remove "imessage" from hook types
- `src/infra/outbound/` — Remove bluebubbles routing logic

## 🚫 Cannot Delete (Core Dependencies)

### Modules That Must Stay

- `src/terminal/` — Terminal styling utilities (30+ imports) — **NOT a user tool**
- `src/pairing/` — Core security/auth system (18 imports)
- `src/wizard/` — Setup/onboarding prompts (20 imports)
- `src/tts/` — Already properly stubbed ✅

## 📊 Impact Analysis

### Before Cleanup

- Total `src/` files: ~2,635
- "OpenClaw" references: 7,000+
- Forbidden modules: 5 (browser, canvas-host, node-host, macos, bluebubbles)

### After Phase 1

- Deleted files: 6 (macos/ + bluebubbles)
- Remaining forbidden modules: 3 (browser, canvas-host, node-host)
- Strategy: Runtime disabling instead of deletion

## 🎯 Next Steps

1. Add runtime kill switches for browser/node-host
2. Clean up config schema (iMessage/BlueBubbles)
3. Test on staging server
4. Deploy to production with env vars
5. Monitor for 1 week
6. Schedule Phase 4: Full deletion in next major version

## ⚠️ Production Safety

**Current deployment:** Docker container `openclaw:local` on Hetzner  
**Live users:** Active  
**Strategy:** Non-breaking changes only — disable, don't delete
