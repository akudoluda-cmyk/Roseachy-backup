# Stage 3B.6 — Day operation durability and recovery

Executed November 13, 2026, in the managed cloud environment with Node 24.22.1, Python 3.12.14, Playwright 1.62.0, Chromium 156.0.8078.79 and Vite 7.3.7. Synthetic data and disposable local origins; real IndexedDB v8. Production remains NO-GO because migration/release gates remain incomplete.

## Fresh results

| Command | Observed outcome |
| --- | --- |
| `node scripts/create-browser-harness.mjs` | Controller fixture regenerated with the new domain planner |
| `npm run test:unit` | 16 tests passed, zero failed/skipped |
| `npm run test:static` | Static invariants and 4 filter tests passed |
| `npm run build` | Production bundle built |
| `npm run test:storage` | 12 storage checks passed |
| `npm run test:repository` | 7 repository checks passed |
| `npm run test:day-recovery` | 9 groups × original/React × 1280/390px = 36 completed groups; original defects recorded separately, fixed React requirements pass |
| `npm run test:days` | 40 groups and 2 normalized parity comparisons passed |
| `npm run test:day-setup` | 32 groups and 2 exact field comparisons passed |
| `npm run test:forms` | 18 Stock/Sales groups passed |
| `npm run test:financial` | 20 named checks passed across original/React desktop/mobile, including full backup restore and tamper rejection |
| `npm run test:runtime:dev` | 12 checks passed |
| `npm run test:runtime` | 14 checks passed, including offline reload |
| `node --check public/legacy/03-core.js`, `git diff --check` | Passed |

Outcomes are confirmed from complete fresh runner logs and result artifacts, not historical reports. Long-running shell handles expired before final polling; exact shell exit codes for those chains were not retained. There are no tracebacks in their final logs and all expected final result files/check groups are present. Generated logs are under `tests/evidence/day-recovery-session/`; recovery results/traces/screenshots are under `tests/evidence/day-recovery-{1280,390}/`. Earlier failed attempts are retained and are not pass evidence.

## Characterization and intentional defect fixes

The original application has four reproducible unsafe failure behaviors: Archive, Restore and Delete each change working/UI history before the database commit; failed next-day verification followed by failed restoration leaves the old day editable over a committed next-day draft. A queued working-form autosave can then restore that obsolete old day. Both final original runs observed this fifth defect. These are reported as `knownOriginalDefects`, not successful safety checks or expected failures of the fixed React application.

The fixed application requires unchanged saved records AND transaction indexes after injected history failures, then successful duplicate-safe retry. Current stock and draft stay unchanged. The nonmutating planner is separately tested to preserve original collection, IDs, transactions and custom fields.

Midnight coverage crosses October 31 → November 1 at midnight in Africa/Lagos via the real visibility-change handler. Unfinished entry and historical views are protected; a failed automatic save preserves the active records and subsequent visibility retry saves the old day exactly once without advancing its date.

Verification fault injection changes one result from an actual IndexedDB read after the next draft has committed. A successful restoration returns the prior draft and permits retry. A second injected fault prevents restoration; the React application must keep editing disabled, retain the committed next day through the 450ms autosave window, and reload it using the visible recovery action. Keyboard focus and mobile overflow checks pass. Recovery screenshots were visually inspected. No storage implementation is mocked or replaced.

## Failures investigated

1. Initial fixture omitted the required stock division; corrected by selecting Essentials through the UI.
2. Pre-fix Stage 3B.5 failed the safe archive assertion, confirming the defect.
3. Initial recovery notice still allowed queued working-state autosave to overwrite the persisted next day. Autosave now waits for day operations, pending capture is invalidated/cancelled during required recovery, and stale draft persistence is blocked.
4. Original-only assumptions that reload always retained the next day failed nondeterministically because that original autosave race can happen before or during reload. Characterization now records either original outcome and flags the overwrite explicitly. Fixed React assertions still strictly require November 2 before and after reload; no safety assertion was relaxed for the migrated app.

## Remaining limits

The actual 60-second interval trigger, confirmation write-failure handling, additional financial/calendar boundaries, physical device lifecycle, signed-file sync and service-worker upgrade/rollback remain unverified. Other transaction/cart correction controls and legacy facades/controllers remain to migrate. This checkpoint improves command durability and recovery; it is not completion of Stage 3B or production approval.

Schema v8 and `public/legacy/01-storage.js` are unchanged (SHA-256 `4f2a383a447cc12fda21203a9cfdec68b62e89d1cecdf58f15104526fba4f917`). Financial arithmetic, debt-deletion protections and successful day-transition semantics are unchanged. No live records or deployments were accessed.

Report recorded: 2026-11-13T19:36:12+01:00.
