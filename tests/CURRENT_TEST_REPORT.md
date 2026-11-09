# Current test report — POS and supplier payments, 2026-11-09

Version: `2.17.2-react-phase3b.2`. Decision: NO-GO for production; migration incomplete.

Executed in the cloud workspace with Node 24.22.1, npm 11.9.0, Python 3.12.14, Playwright 1.62.0 and Chromium 156.0.8078.79. Tests use disposable loopback origins, real IndexedDB v8, real browser interactions and synthetic records. No live records, deployment, or environment configuration changes. Times below are Africa/Lagos (UTC+1); machine-readable evidence retains UTC. The table lists the latest execution per command.

| Command | Result | Started (Lagos) | Log under tests/evidence/ |
| --- | --- | --- | --- |
| `node scripts/create-browser-harness.mjs` | PASS (exit 0) | 2026-11-09T19:01:12.103034+01:00 | nov09-pos-scripts-create-browser-harness.mjs.log |
| `npm run test:unit` | PASS (exit 0) | 2026-11-09T19:01:12.144312+01:00 | nov09-pos-test-unit.log |
| `npm run test:static` | PASS (exit 0) | 2026-11-09T19:01:12.660063+01:00 | nov09-pos-test-static.log |
| `npm run build` | PASS (exit 0) | 2026-11-09T19:01:14.087768+01:00 | nov09-pos-build.log |
| `npm run test:repository` | PASS (exit 0) | 2026-11-09T19:01:15.566663+01:00 | nov09-pos-test-repository.log |
| `npm run test:storage` | PASS (exit 0) | 2026-11-09T19:01:17.306881+01:00 | nov09-pos-test-storage.log |
| `npm run test:forms` | PASS (exit 0) | 2026-11-09T19:01:19.669357+01:00 | nov09-pos-test-forms.log |
| `npm run test:tables` | PASS (exit 0) | 2026-11-09T19:01:37.537299+01:00 | nov09-pos-test-tables.log |
| `npm run test:pos` | PASS (exit 0) | 2026-11-09T19:03:49.582735+01:00 | nov09-pos-test-pos.log |
| `npm run test:supplier` | PASS (exit 0) | 2026-11-09T19:09:07.978565+01:00 | nov09-pos-test-supplier.log |
| `npm run test:cart` | PASS (exit 0) | 2026-11-09T19:06:25.457230+01:00 | nov09-pos-test-cart.log |
| `npm run test:financial` | PASS (exit 0) | 2026-11-09T19:09:51.126196+01:00 | nov09-pos-test-financial.log |
| `npm run test:runtime:dev` | PASS (exit 0) | 2026-11-09T19:07:50.933633+01:00 | nov09-pos-test-runtime-dev.log |
| `npm run test:runtime` | PASS (exit 0) | 2026-11-09T19:08:05.983791+01:00 | nov09-pos-test-runtime.log |

## Coverage

- 13 Node tests: 4 filter contracts, 3 draft-state/command-guard tests, 2 original-source inventory arithmetic tests (1,734 comparisons), 2 captured-sale/cart-pricing tests (846 comparisons), and 2 POS tests (1,944 scenarios across all six current/legacy types; each compares build, validation, components and movements with original source).
- 12 unchanged-storage checks and 7 repository checks against real IndexedDB v8, including atomic failure, rollback, retry, immutable snapshots and stale-tab write rejection.
- 9 Stock form and 9 Sales form check groups: create/edit/cancel, keyboard picker, pack/quantity pricing, duplicate-submit guard, inventory effects, failed saves and reload.
- 5 React table groups: literal text, grouping, long-press/multi-select/subdivision move, ledger detail, delete reversal.
- POS: 10 named check groups per app per viewport, original and React at 1280px and 390px. Covers amount validation, both charge methods, double-click prevention, withdrawal/transfer/deposit, balance shortages, edit/cancel/delete, failure/rollback/retry, cash transfers/adjustments and their guards, failed cash-move edits, all three legacy POS editors, exact identity/timestamp preservation and reload. Final normalized working-day, transaction-trash, stock and balance fields match original at both widths. React additionally has no duplicate DOM IDs and contains Tab focus in the cash-move dialog.
- Supplier: original and React at 1280px and 390px. Credit purchase, linked partial cash payments, overpayment refusal, duplicate submission, injected commit failure and retry, business-date/cash guards, external advance and exact stock/cash/payable reconciliation. All normalized Market supplier/purchase/payment data, draft and stock fields match. Original full-backup Market data and draft transactions restore exactly into a fresh React profile and survive reload; tampered checksum rejection leaves restored stock, draft and Market data unchanged.
- Cart: original and React at 1280px and 390px. Two products, removal/re-addition, invalid edit blocked, quantity edit, draft reload, captured price after inventory-price edit, failed commit rollback/retry, duplicate-click completion. Final persisted stock/working-day fields and cash totals match.
- Financial: original and React at 1280px and 390px. Cash sale edit, linked refund, transfer sale, expense, credit account purchase and partial payment, repayment. All normalized stock, working-day and customer fields plus exact UI totals match. Full Backup SHA-256 independently verified; original export restores into a fresh React profile and survives reload. Tampering leaves stock, draft and Market records unchanged.
- 12 development and 14 production runtime check groups, including service-worker control/offline reload in production at both widths.

## Findings and evidence

The initial POS mobile fault-injection test also intercepted background draft autosaves, allowing the actual transaction to succeed after the injected failures were consumed. Faults now target the submitted transaction payload on both storage commit attempts. The cash-move and supplier tests use the same targeted approach. No application persistence behavior changed for this test correction. The initial failed log is retained as `nov09-pos-test-pos-initial-fault-target.log`; command history retains the failed run, and the current POS rerun passes at both widths.

Historical POS records are synthetic fixtures inserted through the original storage API because current original UI no longer creates those three types. After reload, their editing is exercised through the actual UI in both apps. Generated IDs/timestamps are normalized only for cross-app comparison; edit identity/timestamp retention is asserted exactly within each app, and business dates are compared unchanged.

Original external supplier funding adds a hidden class to the payment-method section, but grid CSS keeps it visible. React fixes that CSS priority defect; the fixture explicitly checks the original defect and React visibility while preserving the original payment semantics. The original shared navigation can reopen the last cash-move overlay after reload; the fixture dismisses it through Cancel. Navigation restoration remains legacy and needs dedicated migration/coverage.

Logs: `nov09-pos-*.log`; complete command history: `nov09-pos-commands.json`. Summaries: repository-results.json, stock-form-results.json, sales-form-results.json, react-table-results.json, dev-results.json, preview-results.json. POS data/screenshots are in pos-1280/ and pos-390/. Original exports and normalized comparisons are in baseline-desktop/, baseline-mobile/, baseline-desktop-cart/, baseline-mobile-cart/, baseline-desktop-supplier/ and baseline-mobile-supplier/. Historical failure evidence is not current pass evidence. Evidence files are generated/ignored; this report and checkpoint-results.json are versioned.

The unchanged storage and immutable original archive hashes are asserted and recorded in tests/checkpoint-results.json, together with current source/test hashes. No new dependency audit was performed; the historical 2026-11-07 audit is not a current result.

## Remaining work

Not complete/not run: all financial boundaries; supplier bank verification/reversal; day close/history parity; remaining Market/Finance/Notes/Settings/Reports conversion; signed two-device sync; old-version backups; interrupted restores; service-worker upgrade/downgrade; full accessibility/theme/physical-device coverage; shadcn/Radix redesign; Cloudflare deployment headers.

Retained bridges: LegacySurface/legacy-tree, classic loader, uncontrolled filter compatibility, draft-field element facade, shared overlay navigation and legacy business commands. The original single atomic business writer and IndexedDB v8 schema remain unchanged. POS and payment dialogs use explicit JSX with data-only presentation models; other legacy modules still construct HTML. This is a runnable migration checkpoint, not a completed migration.

## Cart recovery finding and intentional UI fix

The expanded baseline test reproduced an original 2.17.2 defect: a failed cart completion restores the persisted held draft, but leaves the cart panel hidden. The original fixture checks that condition, verifies the preserved draft, then reloads to retry. React must recover the visible cart immediately, retain its payment values, and retry without duplicate transactions. Both versions finish with identical normalized stock, transaction fields and cash totals. Test products are matched by identity/name; IndexedDB iteration order is not assumed to be insertion order after reload.

The second batch also replaces captured action click listeners with explicit command registration and converts cart item/payment state. These paths remain backed by the existing business command owner. The data-access service itself remains byte-identical to original 2.17.2. No production upgrade/rollback or migration-completion claim is made.
