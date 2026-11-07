# Stage 3A production-build and real-storage acceptance checks

**Purpose:** Identify whether the current React bridge is safe to advance to Stage 3B. These tests use a *separate test origin and disposable records*. No tests should target the real Roseachy business origin.

## A. Build and smoke-check the actual React runtime

With Node.js 20+ and registry access:

```bash
npm install
npm run test:static
npm run build
npm run dev
```

`npm install` must generate `package-lock.json`; retain it and use `npm ci` on subsequent environments. Verify that the browser console does not report errors and the Sales/Stock tables, filtering, division grouping, and click handlers still work. All major actions should be tested on a **separate staging hostname** with fake data.

## B. Test the actual IndexedDB engine on an isolated local origin

Requirements: Python 3, `pip install playwright`, and `python -m playwright install chromium`. In the Stage 3A project directory:

```bash
python tests/verify-indexeddb.py
```

The Python runner launches a disposable HTTP server and Chromium context; the fixture loads the **unchanged Stage 3A IndexedDB v8 module** in isolation. It tests:

1. IndexedDB v8 startup (no localStorage fallback)
2. Fresh database migration finalization
3. Stock and saved-day commits and `verify()`
4. Storage after full page reload
5. Indexed transactionRecords lookup
6. Expected object stores and indexes
7. Concurrent stale-window write blocking
8. Subsequent reload after an authorized write
9. Legacy localStorage stock migration and reload durability

The script runs on a clean browser context and uses fake records only. It does **not** exercise React, the entire business UI, backup/restore, offline PWA use, or transaction calculations.

## C. Full end-to-end business acceptance — remains essential

After successful A and B, run on a unique **Cloudflare Pages staging hostname**, not the business production hostname:

- React 19 mount and Vite production asset loading
- Sales/Stock search, reset, division-group changes, sorting, low-stock and expiry views
- Product creation/edit, selection/move, cross-division grouping and data reload
- Cash and credit sales, refunds, discount/tax variants, returns, transaction editing, stock adjustment and day close
- Supplier purchase/debt, market cart/grouping, financial ledgers and reconciliation
- Complete backup -> restore -> reload, including verification against exported baseline
- 390px mobile + desktop keyboard/accessibility checks
- PWA offline reload, service-worker version and update behavior
- Two-tab write conflicts and error/recovery messages in the full app

**Release gate:** Do not publish to the live origin until the React build, real storage tests, business parity checks, backup/restore, and offline tests pass. Maintain the original HTML ZIP as the rollback artifact.

## Test provenance

The original Stage 3A project passed static/contract tests and isolated legacy-controller simulations. In the assistant's current environment, `registry.npmjs.org` DNS is unavailable and Chromium explicitly blocks navigation to loopback/virtual origins (`ERR_BLOCKED_BY_ADMINISTRATOR`), so React 19 and real IndexedDB persistence cannot be certified here. This test runner is supplied to complete those checks elsewhere; **it is not claimed to have passed yet**.
