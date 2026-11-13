# Stage 3B.4 — Day Setup validation

Executed November 13, 2026, report recorded at 2026-11-13T11:31:17+01:00, in the managed cloud workspace. Node 24.22.1, Python 3.12.14, Playwright 1.62.0, Chromium 156.0.8078.79; installed lockfile resolves Vite 7.3.7. Real IndexedDB v8 and synthetic data on disposable local origins. Production remains **NO-GO** because the migration and release gates remain incomplete.

## Fresh baseline

The GitHub Stage 3B.3 source matched all 55 source/public/scripts/package entries in the supplied archive. `npm ci --cache /tmp/roseachy-npm-cache --no-audit --no-fund`, `npm run test:unit`, `npm run test:static`, `npm run build`, `npm run test:storage` and `npm run test:runtime` all exited 0 before conversion. Storage reported 12 passing checks. These are fresh results, distinct from archived November 11 reports.

## Changed implementation validation

All commands below completed with exit 0. Logs are under `tests/evidence/day-setup-session/` (ignored generated files); browser evidence is under `tests/evidence/day-setup-{1280,390}/` and the existing days/runtime/form/baseline evidence directories.

| Command | Actual result | Log suffix after `roseachy-setup-` |
| --- | --- | --- |
| `npm run test:unit` | 15 tests pass, no failures/skips | `unit.log` |
| `npm run test:static` | Static invariants and 4 filter tests pass | `static-final.log` |
| `npm run build` | Production build passes | `build-final.log` |
| `npm run test:days` | 10 groups × original/React × two widths, plus two exact normalized parity checks | `days.log` |
| `npm run test:day-setup` | 5 groups × original/React × two widths, plus two exact field parity checks | `parity.log` |
| `npm run test:runtime:dev` | 12 checks pass | `dev.log` |
| `npm run test:runtime` | 14 checks pass, including service-worker control/offline reload | `runtime.log` |
| `npm run test:forms` | 9 Stock and 9 Sales groups pass | `forms.log` |
| `npm run test:financial` | Original/React financial, credit and backup fixture passes at desktop/mobile; 20 named PASS lines | `financial.log` |
| `git diff --check` | Pass | no output |

The day tests exercised the changed implementation before the final version-only/cache-label bump; runtime and financial regressions exercised the final rebuilt bundle. The new test's log wording was clarified afterward without changing assertions. No skipped/expected-failure cases were substituted for passes.

## New coverage

- Invalid negative opening blocks confirmation. Decimal opening drafts and date survive reload.
- Blank opening debt normalizes to zero. Duplicate confirmation leaves one confirmation record. Identity/opening controls remain locked after reload.
- Settings correction rejects excess decimal places, persists a valid correction and updates locked controlled fields.
- All four closing counts survive navigation/reload, including signed bank movement.
- Duplicate December 31 → January 1 transition creates one saved day, carries counted balances, clears closing counts and unlocks new-day setup. Full compared draft/saved fields equal the original at 1280px and 390px.
- Existing day-history suite retains injected closing/next-draft write failures, history locking, exact stock/draft parity and counted/expected carry-forward.
- Existing financial fixture verifies backup checksums, original backup restore into fresh React storage, reload, and tamper rejection.

## Failures investigated

The first new test attempt failed in original-app Settings because the Advanced details group was collapsed. The harness now opens it through its summary before clicking Edit Daily Setup. No application behavior or assertion was weakened. Initial failure log is retained as `parity-initial.log`.

The first post-version static run failed because cache assertions still named 3B.3. Both static scripts were updated alongside package, HTML and SW version 3B.4, then passed. This was a checkpoint metadata mismatch, not a skipped check.

## Limits and risks

Storage source is byte-for-byte unchanged from the prior checkpoint (SHA-256 `4f2a383a447cc12fda21203a9cfdec68b62e89d1cecdf58f15104526fba4f917`). No data schema or financial arithmetic changes.

The Settings correction dialog, single financial command/controller, navigation and scoped field facade remain transitional. Automatic midnight preservation, confirmation/archive/delete write-failure recovery, verification failure after a committed next-day write and other calendar boundaries remain uncharacterized. Dedicated POS/supplier/cart/repository suites were not rerun in this slice; their previous reports remain historical. Full device sync, service-worker update/rollback, old/interrupted backup recovery, physical devices and comprehensive accessibility/theme coverage remain unverified. No deployment or dependency audit was performed.
