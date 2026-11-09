# Current test report — 2026-11-09

Decision: NO-GO for production; migration incomplete.

Executed in the restored cloud workspace with Node 24.22.1, npm 11.9.0, Python 3.12.14, Playwright 1.62.0 and Chromium 156.0.8078.79. Tests use disposable loopback origins and synthetic records. No live records, deployment, or environment configuration changes. Times below are Africa/Lagos (UTC+1); machine-readable evidence retains UTC.

| Command | Result | Started (Lagos) | Log under tests/evidence/ |
| --- | --- | --- | --- |
| `node scripts/create-browser-harness.mjs` | PASS (exit 0) | 2026-11-09T13:33:53.668287+01:00 | nov09-cart-scripts-create-browser-harness.mjs.log |
| `npm run test:unit` | PASS (exit 0) | 2026-11-09T13:33:53.717269+01:00 | nov09-cart-test-unit.log |
| `npm run test:static` | PASS (exit 0) | 2026-11-09T13:33:54.177932+01:00 | nov09-cart-test-static.log |
| `npm run build` | PASS (exit 0) | 2026-11-09T13:33:55.612910+01:00 | nov09-cart-build.log |
| `npm run test:repository` | PASS (exit 0) | 2026-11-09T13:23:02.584417+01:00 | nov09-test-repository.log |
| `npm run test:storage` | PASS (exit 0) | 2026-11-09T13:23:04.423161+01:00 | nov09-test-storage.log |
| `npm run test:forms` | PASS (exit 0) | 2026-11-09T13:33:57.075508+01:00 | nov09-cart-test-forms.log |
| `npm run test:tables` | PASS (exit 0) | 2026-11-09T13:34:14.940026+01:00 | nov09-cart-test-tables.log |
| `npm run test:financial` | PASS (exit 0) | 2026-11-09T13:35:08.623289+01:00 | nov09-cart-test-financial.log |
| `npm run test:runtime:dev` | PASS (exit 0) | 2026-11-09T13:35:48.591745+01:00 | nov09-cart-test-runtime-dev.log |
| `npm run test:runtime` | PASS (exit 0) | 2026-11-09T13:36:03.793389+01:00 | nov09-cart-test-runtime.log |
| `npm run test:cart` | PASS (exit 0) | 2026-11-09T13:34:24.033086+01:00 | nov09-cart-test-cart.log |

Counts and coverage:

- 11 Node tests: 4 filter contracts, 3 draft-state/command-guard tests, 2 original-source inventory arithmetic tests (1,734 comparisons), and 2 captured-sale/cart-pricing tests (846 comparisons).
- 12 unchanged-storage checks and 7 new repository checks against real IndexedDB v8, including atomic failure, rollback, retry, immutable snapshots and stale-tab write rejection.
- 9 Stock form and 9 Sales form check groups: create/edit/cancel, keyboard picker, pack/quantity pricing, duplicate-submit guard, inventory effects, failed saves and reload.
- 5 React table groups: literal text, grouping, long-press/multi-select/subdivision move, ledger detail, delete reversal.
- 2 cart viewport runs (1280px, 390px): two products, removal/re-addition, invalid edit blocked, quantity edit, draft reload, captured selling price after inventory-price edit, failed commit rollback/retry, duplicate-click completion. Final persisted stock/working-day fields and cash totals match the original.
- 2 viewport runs (1280px, 390px) of original-vs-React financial parity: cash sale edit, linked refund, transfer sale, expense, credit account purchase and partial payment, repayment. All normalized stock, working-day and customer fields plus exact UI totals match. Full Backup SHA-256 independently verified; original export restores into a fresh React profile, survives reload, and tampering is rejected without mutation.
- 12 development and 14 production runtime check groups, including offline reload in production at both widths.

The initial new Sales keyboard test left the selected unit price in the form before its empty-sale assertion. The fixture now clears that value explicitly; the rerun passes. No business rule was changed for that assertion. Historical failure screenshots/traces remain under evidence and are not current pass evidence. The earlier table tests exposed duplicate native/React handlers and long-press release behavior; both fixes are included and the table test passes. Credit button overlap was a CSS priority defect; both desktop and mobile credit flows now pass.

Evidence summaries: repository-results.json, stock-form-results.json, sales-form-results.json, react-table-results.json, dev-results.json, preview-results.json. Baseline exports and normalized comparisons are in baseline-desktop/, baseline-mobile/, baseline-desktop-cart/ and baseline-mobile-cart/. The original archive and unchanged storage hashes are included in tests/checkpoint-results.json. Evidence files are generated/ignored; this report and the summary are versioned.

Not complete/not run: all transaction types and financial boundaries; supplier debt settlement; day close/history parity; POS conversion; Market/Finance/Notes/Settings/Reports conversion; signed two-device sync; old-version backups; interrupted restores; service-worker upgrade/downgrade; full accessibility/theme/device coverage; shadcn/Radix redesign; Cloudflare deployment headers. Prior npm audit reported zero advisories on 2026-11-07; no fresh audit was performed in this batch.

Retained bridges: LegacySurface/legacy-tree, classic loader, uncontrolled filter compatibility, draft-field element facade and legacy business commands. React table/picker markup contains no HTML injection; other legacy modules still construct HTML. This is a runnable migration checkpoint, not a finished migration.

## Cart recovery finding and intentional UI fix

The expanded baseline test reproduced an original 2.17.2 defect: a failed cart completion restores the persisted held draft, but leaves the cart panel hidden. The original fixture checks that condition, verifies the preserved draft, then reloads to retry. React must recover the visible cart immediately, retain its payment values, and retry without duplicate transactions. Both versions finish with identical normalized stock, transaction fields and cash totals. Test products are matched by identity/name; IndexedDB iteration order is not assumed to be insertion order after reload.

The second batch also replaces captured action click listeners with explicit command registration and converts cart item/payment state. These paths remain backed by the existing business command owner. The data-access service itself remains byte-identical to original 2.17.2. No production upgrade/rollback or migration-completion claim is made.
