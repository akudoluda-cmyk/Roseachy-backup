# Current checkpoint — Settings Daily Setup correction

Version `2.17.2-react-phase3b.5`; Stage 3B remains in progress. The Settings correction dialog now has explicit React markup, controlled amounts and guarded actions. Run `npm run test:day-setup` for desktop/mobile original parity, including failed-save recovery and saved-day protection. See MIGRATION_STATUS.md and tests/SETUP_CORRECTION_TEST_REPORT_2026_11_13.md. Production remains NO-GO.

---

# Current checkpoint — Day Setup and reconciliation, 2026-11-13

Version `2.17.2-react-phase3b.4`; Stage 3B remains in progress and production is NO-GO. Explicit React components now own Day Setup and reconciliation field state and the confirmation action. Existing calculations, storage, navigation and Settings correction remain behind the single controller. Run `npm ci`, `npm run build`, `npm run test:day-setup` and `npm run test:days`; see MIGRATION_STATUS.md and tests/DAY_SETUP_TEST_REPORT_2026_11_13.md for continuity and verification.

The following checkpoint reports are retained as history.

---

# Current checkpoint — Saved Days and day transitions, 2026-11-11

Version `2.17.2-react-phase3b.3`. Migration remains incomplete and is NOT ready for production. The original 2.17.2 is now archived and the financial/credit/backup parity fixture passes at 1280px and 390px. Stock and retail Sales draft fields/actions, product suggestions, held-cart items/payment fields, explicit table rows, and named POS/cash-move/supplier-payment layouts, Saved Days/history controls and day action buttons are React owned; a repository exposes immutable committed snapshots, while the existing atomic business controller remains authoritative. See MIGRATION_PLAN.md, FEATURE_PARITY_MATRIX.md, DATA_CONTRACT.md and tests/CURRENT_TEST_REPORT.md for the exact coverage and retained bridges.

Run `npm ci`, `npm run test:unit`, `npm run test:static`, `npm run build`, `npm run test:storage`, `npm run test:forms`, `npm run test:repository`, `npm run test:tables`, `npm run test:cart`, `npm run test:financial`, `npm run test:pos`, `npm run test:supplier`, `npm run test:days`, `npm run test:runtime:dev`, and `npm run test:runtime`. Tests require Python Playwright and /usr/bin/chromium, start disposable local servers and write evidence under tests/evidence/. Use `npm run dev` for development or `npm run preview` after a build.

The handoff text below is historical and describes the earlier environment, not the current validation results.

---

# Roseachy Desk 2.17.2 — React migration Stage 3A

**Status: guarded development/staging candidate. NOT validated for live retail use.**

This package extends Phase 2. Phase 3 is intentionally divided into smaller checkpoints because the real React 19 build, IndexedDB durability, and production deployment have **not yet passed** their release gates. Stage **3A** moves eight Sales/Stock filter interactions to React without migrating transaction saves or risking the existing database. Stage 3B (transaction forms) must wait for full build/staging validation.

## What actually changed

- React owns the input event handling of eight existing Sales/Stock filters: `txKindFilter`, `txDivFilter`, `txSearch`, `stockDiv`, `stockSearch`, `stockSort`, `stockLowOnly`, `stockExpiringOnly`.
- React renders new accessible **Clear filters** controls in the Sales and Stock filter toolbars. Clearing filters cannot delete products or modify any transaction.
- A narrow `RoseachyReactFilters` bridge forwards React filter events into the **unchanged** legacy render/selection functions. Only the event wiring is switched; native legacy listeners remain available if the bridge is absent.
- The two Phase 2 React table islands continue to render Sales transaction and Stock inventory rows.
- React filter elements are deliberately **uncontrolled** so existing edit, history restoration, dynamic division options, and draft-state code can still set their DOM values safely. React tracks active status to drive the reset-button state. Full form state migration is **not yet complete**.
- The service-worker version has changed to `2.17.2-react-phase3a` to isolate the staging app's cache from preceding phases.

### Explicitly not converted

Sales submission, stock creation/editing forms, accounting, transaction/refund logic, credit handling, supplier debts, IndexedDB, backup/restore, PWA sync, Market Desk, Financial Desk, Notes, and Analytics remain on the original controllers. The other React bridge and tables also remain transitional, not a completed React rewrite. This is a controlled migration to prioritize safety over claimed completeness.

## Setup, static verification, and build

Requires Node.js 20+. On a machine with npm registry access:

```bash
npm install
npm run test:static
npm run build
npm run dev
```

On Cloudflare Pages **staging only**: use build command `npm run build`, output directory `dist`, and a **distinct origin/hostname** from the live store.

Additional checks:

```bash
npm run verify:legacy
npm run verify:phase2
npm run verify:phase3
npm run test:filter-contract
```

There is **no package-lock.json**, because dependency installation failed in the current isolated environment with `EAI_AGAIN` resolving npm. After running `npm install` on your own machine, commit its generated lock file and use `npm ci` for repeatable builds. Do not hand-edit lock files.

## Data safety, regression gates

1. Export a complete backup **from the current live HTML app** before testing. Keep that original ZIP deployable as a rollback.
2. Deploy React to a *separate* staging hostname to prevent cross-origin IndexedDB or service-worker conflicts. Use fake records only.
3. Verify React 19 mounts, filters change/clear correctly, stock division options stay correct after product edits, and both Phase 2 table islands work.
4. On the staging origin only, verify the real IndexedDB v8 upgrade/open, data creation, reload persistence, backup/restore, and cross-tab change detection.
5. Test realistic stock sale + refund, credit sale, held cart, supplier purchase/debt, stock division moves, transaction editing, and day close.
6. Test 390px phone layout, desktop, keyboard navigation, print, PWA installation and offline reload, then compare full exports with the baseline.
7. Do **not** replace the working HTML deployment until those checks pass.

## Test provenance and limitations

`npm run test:static` passed: legacy 2,281 nodes/812 IDs/10 script paths, Phase 2 portaled tables, Phase 3 bridge and default invariants, and 4 Node unit tests. Controller-side filter delegation/reset was also simulated in Chromium with an isolated in-memory localStorage fallback and **no** uncaught JS errors. That browser harness **does not use React**, React 19, Vite, IndexedDB, or a real hosted origin, so it is not a React end-to-end pass. See `tests/PHASE3_TEST_REPORT.md`.

## Stage 3A validation handoff (added 2026-11-01)

A disposable Chromium/IndexedDB integration test is included at `tests/verify-indexeddb.py`, with supporting fixture `tests/fixtures/indexeddb-stage3.html`. Run `npm run test:storage` on a machine with Python Playwright, Chromium, and unrestricted localhost access. Detailed instructions and outstanding acceptance gates are in `tests/README_STAGING.md`. This test suite **has not passed in the current restricted environment**; it is not a replacement for a production React 19 build or end-to-end app testing.

## File map

- `src/islands/ReactFilterControls.js`: React-owned filtering controls and reset buttons.
- `src/islands/filter-contract.mjs`: pure filter defaults/active-state functions (unit tested).
- `src/components/LegacySurface.jsx`: places the eight React controls at their original locations without disrupting other legacy elements.
- `src/BridgeApp.jsx`: registers the filter bridge ahead of legacy scripts and retains both Phase 2 table islands.
- `public/legacy/03-core.js`: delegated filter controller actions, legacy fallbacks, and read-only filter reset logic.
- `public/legacy/01-storage.js`: intentionally unchanged IndexedDB v8 storage.
- `scripts/verify-phase3.mjs`, `tests/filter-contract.test.mjs`: static and pure tests.
- `scripts/create-browser-harness.mjs`: generates a test-only HTML fixture for controller testing; this must never be deployed as a live business page.
- `tests/PHASE3_TEST_REPORT.md`: factual checks, limitations, and next gates.
