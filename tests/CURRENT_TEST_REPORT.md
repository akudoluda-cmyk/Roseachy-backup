# Latest verification — Stage 3B.4

See [Day Setup report](DAY_SETUP_TEST_REPORT_2026_11_13.md) for fresh November 13 results and remaining limits. The November 11 report below is preserved as history.

---

# Current test report — Saved Days and day transitions, 2026-11-11

Version: `2.17.2-react-phase3b.3`. Decision: NO-GO for production; migration incomplete.

Executed in the cloud workspace with Node 24.22.1, npm 11.9.0, Python 3.12.14, Playwright 1.62.0 and Chromium 156.0.8078.79. Tests use disposable loopback origins, real IndexedDB v8, production React builds and synthetic records. No live origin, deployment or environment configuration changes. Times below are execution times in Africa/Lagos (UTC+1); machine-readable evidence uses UTC. The day-history browser fixture fixes the clock at 2026-11-09T10:00Z with Africa/Lagos timezone to make business dates deterministic. The table lists the latest completed execution per command.

| Command | Result | Started (Lagos) | Log under tests/evidence/ |
| --- | --- | --- | --- |
| `node scripts/create-browser-harness.mjs` | PASS (exit 0) | 2026-11-11T13:59:56.927752+01:00 | nov11-days-scripts-create-browser-harness.mjs.log |
| `npm run test:unit` | PASS (exit 0) | 2026-11-11T13:59:57.007457+01:00 | nov11-days-test-unit.log |
| `npm run test:static` | PASS (exit 0) | 2026-11-11T13:59:57.794325+01:00 | nov11-days-test-static.log |
| `npm run build` | PASS (exit 0) | 2026-11-11T13:59:59.398630+01:00 | nov11-days-build.log |
| `npm run test:repository` | PASS (exit 0) | 2026-11-11T14:00:01.511736+01:00 | nov11-days-test-repository.log |
| `npm run test:storage` | PASS (exit 0) | 2026-11-11T14:00:03.442939+01:00 | nov11-days-test-storage.log |
| `npm run test:forms` | PASS (exit 0) | 2026-11-11T14:00:05.823492+01:00 | nov11-days-test-forms.log |
| `npm run test:tables` | PASS (exit 0) | 2026-11-11T14:00:23.212931+01:00 | nov11-days-test-tables.log |
| `npm run test:days` | PASS (exit 0) | 2026-11-11T14:01:47.811851+01:00 | nov11-days-test-days.log |
| `npm run test:pos` | PASS (exit 0) | 2026-11-11T14:03:18.904726+01:00 | nov11-days-test-pos.log |
| `npm run test:supplier` | PASS (exit 0) | 2026-11-11T14:05:10.233319+01:00 | nov11-days-test-supplier.log |
| `npm run test:cart` | PASS (exit 0) | 2026-11-11T14:05:54.633474+01:00 | nov11-days-test-cart.log |
| `npm run test:financial` | PASS (exit 0) | 2026-11-11T14:06:33.327578+01:00 | nov11-days-test-financial.log |
| `npm run test:runtime:dev` | PASS (exit 0) | 2026-11-11T14:07:10.630301+01:00 | nov11-days-test-runtime-dev.log |
| `npm run test:runtime` | PASS (exit 0) | 2026-11-11T14:07:25.468825+01:00 | nov11-days-test-runtime.log |

## New day/history coverage

- Two new pure-function tests compare 432 saved-day update scenarios with the immutable original source: normalized business/date matching, retained saved ID/archive status, missing/duplicate transaction guards and old-record immutability. Total unit test count is 15, including the previous inventory, sale/POS math, field-state and filter checks.
- Ten named browser check groups per app per viewport (original and React at 1280px and 390px), followed by complete normalized saved-day/draft/stock equality at each width.
- A failed closing-day commit leaves the saved collection, current draft and stock unchanged; retry and duplicate clicks produce exactly one saved record. Repeat save retains the day/transaction IDs and opening/closing stock snapshots.
- Recent/week/month/custom/archive filters, archive/restore and Enter/Space history opening work. Historical inputs/actions are locked; returning to current day preserves the active draft and live inventory. A closed day shows 10 historical units even after the next-day purchase raises live stock to 11.
- Unsubmitted item and invalid counted-cash guards prevent day close. Failure of both storage attempts for the next-day draft preserves the previous active draft while its closing snapshot remains durable. Retry carries counted retail/POS/electronic balances, debt and opening stock exactly once; a following transition with blank counts uses expected balances.
- Supplier-debt history cannot be deleted. Confirmed deletion of a synthetic non-debt saved snapshot leaves current stock unchanged. Reload preserves all data, subject only to the original loader's derived businessKey index field; real database verification passes.
- Thirty-five synthetic older records are inserted through the public original storage API to exercise pagination, archived filters, reset to the first page, keyboard opening and retention of custom metadata. These pagination fixtures are separate from the preceding UI-created financial parity snapshot.
- React additionally has no duplicate DOM IDs in the tested history flow. The current history surface uses explicit JSX and data-only summary models, retaining the existing financial calculator and single authoritative command/storage owner.

## Regression coverage rerun

- 12 storage and 7 repository check groups: real IndexedDB v8, migration, durable writes, atomic failure/retry, immutable committed snapshots and stale-tab rejection.
- 9 Stock and 9 Sales form check groups; 5 React table groups, including inventory effects, failed saves, keyboard picker, bulk move and deletion reversal.
- POS: 10 groups per app per viewport at 1280/390px, including legacy editors, charges, shortages, cash moves, edit/delete, failure/retry and exact final original-state parity.
- Supplier: original-vs-React credit purchases, linked partial payments, overpayment/date/cash guards, external advance, failure/retry and stock/cash/payable parity at both widths. Original Market/payment data restores exactly from Full Backup; tampered checksum rejection leaves restored data unchanged.
- Cart: original-vs-React quantity/remove/re-add, captured pricing, failure/recovery/retry and duplicate completion at both widths.
- Financial: original-vs-React cash-sale edit, linked refund, transfer, expense, customer credit purchase/partial payment/repayment and exact totals at both widths; independently verified Full Backup checksums and restore/reload/tamper rejection.
- 12 development and 14 production runtime check groups, including production service-worker control and offline reload at 1280/390px.

Detailed earlier fixture coverage and intentional cart/supplier CSS fixes are retained in [POS_SUPPLIER_TEST_REPORT_2026_11_09.md](POS_SUPPLIER_TEST_REPORT_2026_11_09.md). Those fixes remain; this batch changes no financial semantics.

## Test development findings and evidence

The initial next-day failure assertion matched an earlier validation toast before the injected write had finished. It now waits for the specific injected-failure message before checking both failed attempts and state. The original schema-v8 loader adds businessKey to saved records at hydration; the reload check accounts for exactly that normalization. The historical quantity assertion uses the original label `10 units`. Reload can restore working-form inputs in the original, so the second blank-count transition clears those inputs through UI before starting a day. These fixture corrections did not change application persistence, business rules or guard behavior.

Current logs: `nov11-days-*.log`; complete command history: `nov11-days-commands.json`. Historical failed development runs remain identified by their log filenames/command-history entries and are not pass evidence. Day screenshots, before/after reload records, normalized comparisons and check summaries are under `days-1280/` and `days-390/`. Other evidence lives in the existing POS/baseline directories and repository/form/table/runtime result JSON files. Generated evidence is ignored by Git and included in the checkpoint archive. Source/test and unchanged-original/storage hashes are recorded in `checkpoint-results.json`.

## Remaining work and limitations

Day Setup/reconciliation input ownership, midnight automatic preservation, date/month/year rollover boundaries, failure after a successfully committed next-day write during verification, archive/delete write-failure recovery and broader financial reconciliation are not covered by the new browser fixture. Supplier bank verification/reversal, remaining Market/Finance/Reports/Notes/Settings conversion, signed-file sync, older/interrupted backups, service-worker update/rollback, full accessibility/theme/physical-device coverage, shadcn/Radix redesign and deployment checks remain incomplete. No fresh dependency audit was performed.

LegacySurface/legacy-tree, classic loading, field compatibility facades, shared navigation and the domain/storage controller remain transitional. This checkpoint expands real parity coverage and React ownership; it does not complete the migration or establish production readiness. The immutable original and prior checkpoint remain rollback sources; no production cutover occurred.
