# Current test report — 2026-11-09

Decision: NO-GO for production; migration incomplete.

Executed in the restored cloud workspace with Node 24.22.1, npm 11.9.0, Python 3.12.14, Playwright 1.62.0 and Chromium 156.0.8078.79. Tests use disposable loopback origins and synthetic records. No live records, deployment, or environment configuration changes. Times below are Africa/Lagos (UTC+1); machine-readable evidence retains UTC.

| Command | Result | Started (Lagos) | Log under tests/evidence/ |
| --- | --- | --- | --- |
| `node scripts/create-browser-harness.mjs` | PASS (exit 0) | 2026-11-09T13:22:59.336851+01:00 | nov09-scripts-create-browser-harness.mjs.log |
| `npm run test:unit` | PASS (exit 0) | 2026-11-09T13:22:59.382803+01:00 | nov09-test-unit.log |
| `npm run test:static` | PASS (exit 0) | 2026-11-09T13:22:59.766470+01:00 | nov09-test-static.log |
| `npm run build` | PASS (exit 0) | 2026-11-09T13:23:01.094159+01:00 | nov09-build.log |
| `npm run test:repository` | PASS (exit 0) | 2026-11-09T13:23:02.584417+01:00 | nov09-test-repository.log |
| `npm run test:storage` | PASS (exit 0) | 2026-11-09T13:23:04.423161+01:00 | nov09-test-storage.log |
| `npm run test:forms` | PASS (exit 0) | 2026-11-09T13:23:41.110930+01:00 | nov09-test-forms.log |
| `npm run test:tables` | PASS (exit 0) | 2026-11-09T13:23:58.718270+01:00 | nov09-test-tables.log |
| `npm run test:financial` | PASS (exit 0) | 2026-11-09T13:24:07.190526+01:00 | nov09-test-financial.log |
| `npm run test:runtime:dev` | PASS (exit 0) | 2026-11-09T13:24:43.110207+01:00 | nov09-test-runtime-dev.log |
| `npm run test:runtime` | PASS (exit 0) | 2026-11-09T13:24:57.190218+01:00 | nov09-test-runtime.log |

Counts and coverage:

- 9 Node tests: 4 filter contracts, 3 draft-state/command-guard tests, 2 original-source arithmetic tests covering 1,734 boundary comparisons.
- 12 unchanged-storage checks and 7 new repository checks against real IndexedDB v8, including atomic failure, rollback, retry, immutable snapshots and stale-tab write rejection.
- 9 Stock form and 9 Sales form check groups: create/edit/cancel, keyboard picker, pack/quantity pricing, duplicate-submit guard, inventory effects, failed saves and reload.
- 5 React table groups: literal text, grouping, long-press/multi-select/subdivision move, ledger detail, delete reversal.
- 2 viewport runs (1280px, 390px) of original-vs-React financial parity: cash sale edit, linked refund, transfer sale, expense, credit account purchase and partial payment, repayment. All normalized stock, working-day and customer fields plus exact UI totals match. Full Backup SHA-256 independently verified; original export restores into a fresh React profile, survives reload, and tampering is rejected without mutation.
- 12 development and 14 production runtime check groups, including offline reload in production at both widths.

The initial new Sales keyboard test left the selected unit price in the form before its empty-sale assertion. The fixture now clears that value explicitly; the rerun passes. No business rule was changed for that assertion. Historical failure screenshots/traces remain under evidence and are not current pass evidence. The earlier table tests exposed duplicate native/React handlers and long-press release behavior; both fixes are included and the table test passes. Credit button overlap was a CSS priority defect; both desktop and mobile credit flows now pass.

Evidence summaries: repository-results.json, stock-form-results.json, sales-form-results.json, react-table-results.json, dev-results.json, preview-results.json. Baseline exports and normalized comparisons are in baseline-desktop/ and baseline-mobile/. The original archive and unchanged storage hashes are included in tests/checkpoint-results.json. Evidence files are generated/ignored; this report and the summary are versioned.

Not complete/not run: all transaction types and financial boundaries; supplier debt settlement; day close/history parity; cart/POS conversion; Market/Finance/Notes/Settings/Reports conversion; signed two-device sync; old-version backups; interrupted restores; service-worker upgrade/downgrade; full accessibility/theme/device coverage; shadcn/Radix redesign; Cloudflare deployment headers. Prior npm audit reported zero advisories on 2026-11-07; no fresh audit was performed in this batch.

Retained bridges: LegacySurface/legacy-tree, classic loader, uncontrolled filter compatibility, draft-field element facade and legacy business commands. React table/picker markup contains no HTML injection; other legacy modules still construct HTML. This is a runnable migration checkpoint, not a finished migration.
