# Browser acceptance checklist (must be checked before any real deployment)

Use a **test-only origin**; an origin change creates an isolated IndexedDB database.

## Startup
- Open with DevTools Console; confirm no uncaught exception.
- Confirm `window.RoseachyStore.status()` reports `loaded: true`, `mode: indexeddb`.
- Confirm all navigation tabs and every Desk opens and returns.
- Confirm desktop and mobile layouts; verify no missing styles or icons.

## Storage and continuity
- Export a FULL backup from your original deployment BEFORE testing.
- Use test inventory and test sales only (do not test using live financial records).
- Refresh and verify stock quantities, saved days and pending drafts persist.
- Verify two-window stale edit prevention and no duplicate writes.
- Confirm backup export and validation; try import only with disposable test data.
- Verify data-isolation semantics on different subdomains before production cutover.

## Operational workflows
- Sales: cash, bank/transfer, credit, split, refund, held sale, resume.
- Stock: create, edit, merge, division/subdivision grouping, multi-select move, trash/restore.
- Market Desk: active list, categorized view, purchase history, suppliers, export.
- Financial Desk: unlock using test PIN; reconciliation, adjustments, locking.
- Reports, Analytics and Notes: render/filters and data persistence.
- Settings: change theme, reload, restore; ensure no data modifications.

## PWA
- Build with npm run build and serve **dist/** on a test HTTPS origin.
- Install from browser; after full online load, turn offline and reload.
- Confirm `/assets/*.js`, `/assets/*.css`, and `/legacy/*.js` are cached.
- Test service worker update and the explicit update prompt.
- Confirm the original Android WebView integration if used.

## Rollback
- Keep original ZIP and external FULL JSON backup until every test passes.
- Do not overwrite production without a verified rollback deployment.
