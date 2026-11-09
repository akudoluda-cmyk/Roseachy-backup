# Changes

## 2026-11-09 — Stage 3B repository and interaction checkpoint

- Added an observed repository boundary over unchanged IndexedDB v8; committed immutable snapshots, atomic failure isolation and stale-tab subscriptions pass real-browser checks.
- Replaced Stock/Sales table HTML strings with semantic JSX and direct React events. Disabled native table handlers while React owns the view, fixing duplicate clicks and long-press deselection.
- Converted Sales product suggestions to React, with controlled active option, keyboard selection, Escape, and focus transfer.
- Fixed the credit-account button overlap caused by losing inline CSS important priority during extraction.
- Verified original-vs-React edited sale/refund/transfer/expense/credit/repayment totals, Full Backup restore and checksum rejection on desktop and narrow mobile.
- Added repeatable repository, table and financial npm test commands. No environment draft edits or publishing.
- Migration remains incomplete: cart/POS, most module UI/controllers, full financial characterization, redesign and release hardening remain.

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
