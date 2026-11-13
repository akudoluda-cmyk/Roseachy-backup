# 2.17.2-react-phase3b.5 — 2026-11-13

- Convert Settings Daily Setup correction to React fields, presentation and actions.
- Preserve original atomic command and saved-day protections.
- Extend desktop/mobile parity with focus/cancel, injected persistence failure, retry and saved-day protection.

# 2.17.2-react-phase3b.4 — 2026-11-13

- Migrate Day Setup and retail/POS reconciliation layouts and ten fields to explicit React components.
- Register the confirmation action and hold its duplicate-submit guard until the existing save promise settles.
- Add original-vs-React desktop/mobile Day Setup and year-boundary parity tests.
- Preserve schema, financial rules and controller ownership; retain migration continuity and verification reports.

# Changes

## 2026-11-11 — Saved Days and day-transition checkpoint (phase3b.3)

- Converted saved-day rows, range/date filters, history banner and day action buttons to explicit React components and direct registered commands.
- Extracted the original saved-day update guard, preserving missing-transaction rejection and saved/archive identity; added 432 original-source comparisons.
- Added real-browser original-vs-React day-save, history, failure/retry, balance carry-forward, historical stock, debt deletion protection, reload and pagination fixtures.
- Retained original two-step day-transition persistence and IndexedDB v8 unchanged. No deployment or environment configuration changes.
- Migration remains incomplete; broader financial cases, Day Setup and remaining modules/controller removal, redesign and release hardening remain.

## 2026-11-09 — POS and supplier-payment checkpoint (phase3b.2)

- Added explicit React POS, cash-move and supplier-payment layouts with controlled fields and guarded registered actions.
- Extracted original POS calculation/validation functions and tested 1,944 scenarios across six supported/current and legacy types.
- Preserved editing of historical POS options, captured IDs/timestamps, cash/electronic balances, shortage guards, deletion reversal and failed-write recovery.
- Added original-vs-React POS/cash-move and supplier debt/payment tests on desktop/mobile, including external funding, backup restore, retry and duplicate-submit cases.
- Fixed original grid CSS overriding the supplier method’s hidden state for external funding; no financial semantics changed.
- Bumped package, HTML and service-worker cache version to 2.17.2-react-phase3b.2. No environment configuration or publication changes.
- Migration remains incomplete: day-close/history and broader financial cases, remaining modules/controller replacement, redesign and release hardening still require work.

## 2026-11-09 — Stage 3B cart checkpoint

- Replaced held-cart HTML and delegated input/click listeners with React item components and controlled payment fields. Item commands resolve stable identities.
- Extracted unchanged captured-price and cart-correction calculations; added 846 original-source comparisons.
- Added explicit action registration for Stock, Sales and cart buttons while retaining the existing single business writer.
- Added desktop/mobile cart parity tests covering removal, invalid quantity, edit, draft reload, inventory-price changes, atomic failure/retry and duplicate completion.
- Fixed an original recovery UI defect: after a failed cart save, restored items/payment values now remain visible for retry. Tests document that the original requires reload and still verify final record/totals equality.

## 2026-11-09 — Stage 3B repository and interaction checkpoint

- Added an observed repository boundary over unchanged IndexedDB v8; committed immutable snapshots, atomic failure isolation and stale-tab subscriptions pass real-browser checks.
- Replaced Stock/Sales table HTML strings with semantic JSX and direct React events. Disabled native table handlers while React owns the view, fixing duplicate clicks and long-press deselection.
- Converted Sales product suggestions to React, with controlled active option, keyboard selection, Escape, and focus transfer.
- Fixed the credit-account button overlap caused by losing inline CSS important priority during extraction.
- Verified original-vs-React edited sale/refund/transfer/expense/credit/repayment totals, Full Backup restore and checksum rejection on desktop and narrow mobile.
- Added repeatable repository, table and financial npm test commands. No environment draft edits or publishing.
- Migration remains incomplete: POS, most module UI/controllers, full financial characterization, redesign and release hardening remain.

## 2026-11-07 — Stage 3B form checkpoint

- Verified and preserved the original 2.17.2 standalone archive and recorded source hashes.
- Added real original-vs-React persisted-state comparison and UI Working Stock export checks.
- Moved Stock and retail Sales draft fields into React-controlled state; added command guards and a narrow compatibility boundary to the existing atomic writer.
- Extracted unchanged inventory math into a tested module; added original-source boundary comparisons.
- Added real-browser edit/cancel, pack, quantity pricing, overselling, duplicate-submit, refund, write-failure rollback/retry and reload tests.
- Bumped staging package/cache version to 2.17.2-react-phase3b.1 and updated the standalone controller harness dependency.
- Migration remains incomplete. Legacy business logic, Market/Finance and later redesign/release gates remain. Table HTML was subsequently replaced in the 2026-11-09 checkpoint.

## 2026-11-07 — Stage 3A validation checkpoint

- Preserved supplied archive source as the initial Git checkpoint.
- Installed actual React 19 / Vite 7 dependencies and generated package-lock.json.
- Encoded embedded SVG attribute quotes in CSS data URLs; production CSS now builds without the prior parser warnings.
- Added actual React runtime browser tests with disposable origins/contexts, desktop/mobile product creation, filter/reset, cash sale, reload, IndexedDB verification, production offline reload and failure traces/screenshots.
- Added npm test commands, ownership/source inventory, data contract, parity matrix, risk list and migration checklist.
- Existing business controller and IndexedDB implementation remain unchanged. No Stage 3B–6 completion or production readiness is claimed.
