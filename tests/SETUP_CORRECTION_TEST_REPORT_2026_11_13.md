# Stage 3B.5 — Settings Daily Setup correction

Executed November 13, 2026, in the same managed cloud environment as the Stage 3B.4 report: Node 24.22.1, Python 3.12.14, Playwright 1.62.0, Chromium 156.0.8078.79, Vite 7.3.7. Real IndexedDB v8, disposable local origins and synthetic data. Production remains NO-GO.

## Completed checks

Each listed command exited 0. Generated logs are in `tests/evidence/setup-correction-session/`; parity screenshots/results are in `tests/evidence/day-setup-{1280,390}/`.

| Command | Outcome |
| --- | --- |
| `npm run test:day-setup` | 8 named groups × original/React × desktop/mobile = 32 passing groups; 2 exact persisted-field parity comparisons |
| `npm run test:unit` | 15 tests passed, none failed/skipped |
| `npm run test:static` | All static checks and 4 filter tests passed |
| `npm run build` | Final version 3B.5 production bundle built successfully |
| `npm run test:runtime:dev` | 12 checks passed |
| `npm run test:runtime` | 14 checks passed, including production offline reload |
| `npm run test:repository` | 7 groups passed, including atomic failure/rollback/retry, committed snapshots, stale writer rejection and reload |
| `node --check public/legacy/03-core.js`, `git diff --check` | Passed |

The extended parity suite ran on the changed dialog code before the final version-only bump; dev/production runtime tests ran after rebuilding 3B.5. Day-history, form, financial and backup regression results from the immediately preceding 3B.4 slice are documented separately; those suites were not rerun for this dialog-only slice. The immutable storage source remains unchanged.

## New evidence

- Initial focus, forward/backward Tab containment, Escape cancellation and reopen retain the original persisted amounts.
- Four correction inputs are React controlled; title/date/error render from presentation state. Save/Close dispatch registered commands rather than native onclick assignments in the React app.
- Two injected IndexedDB write failures leave the entire persisted draft unchanged and retain the user's intended correction for retry.
- Duplicate retry produces the expected persisted correction, locks the normal setup controls and agrees with original behavior.
- Saved financial days reject opening changes without altering either active draft or historical snapshot.
- Existing confirmation, decimal count retention and year-end carry-forward cases still match the original on desktop and mobile; no unexpected browser errors.

No failing run occurred in this slice. The earlier 3B.4 harness navigation/version failures are retained and explained in its report.

## Remaining limits

The atomic correction command, financial validation, shared navigation and field facade remain legacy owned; React is not a second persistent writer. A classic dialog fallback remains for the controller-only harness. Other correction dialogs are not converted by this slice.

Automatic midnight preservation, confirmation/archive/delete failure recovery, verification failure after a committed next-day write, broader financial parity, signed-file sync, service-worker update/rollback and comprehensive device/accessibility checks remain incomplete. No production deployment, schema change or financial-rule change was made.

Report recorded: 2026-11-13T14:35:26+01:00 (Africa/Lagos).
