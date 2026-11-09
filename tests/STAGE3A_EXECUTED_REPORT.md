# Current test report

# Decision: NO-GO — migration incomplete

Executed 2026-11-07. Node 24.22.1, npm 11.9.0, Python 3.12.14, Playwright 1.62.0, Chromium 156.0.8078.79 on Linux. Times in machine-readable evidence are UTC. Disposable local origins and fake records only.

| Command | Result | Evidence |
| --- | --- | --- |
| `npm ci --cache /tmp/roseachy-npm-cache` | PASS (exit 0) | `tests/evidence/ci---cache.log` at 2026-11-07T14:00:05.518796+00:00 |
| `npm run test:static` | PASS (exit 0) | `tests/evidence/run-test-static.log` at 2026-11-07T14:00:06.246735+00:00 |
| `npm run build` | PASS (exit 0) | `tests/evidence/run-build.log` at 2026-11-07T14:00:07.636711+00:00 |
| `npm run test:storage` | PASS (exit 0) | `tests/evidence/run-test-storage.log` at 2026-11-07T14:00:09.107921+00:00 |
| `npm audit --json` | PASS (exit 0) | `tests/evidence/audit---json.log` at 2026-11-07T14:00:11.428174+00:00 |
| npm run test:runtime:dev | PASS: 12 named check groups | tests/evidence/dev-results.json at 2026-11-07T13:58:09.459298+00:00 |
| npm run test:runtime | PASS: 14 named check groups | tests/evidence/preview-results.json at 2026-11-07T13:58:26.062563+00:00 |

Counts: 4 Node filter unit tests, 12 storage checks, 12 development and 14 production browser check groups across 1280px and 390px. Static verifiers cover structure/bridge contracts and are not behavioral parity tests. npm audit reported zero known advisories at execution time. The clean npm ci confirms lockfile-based installation; the final build contains no CSS parser warnings.

The first build emitted CSS warnings from unescaped quotes inside SVG URLs. The CSS correction removes those warnings without changing the SVG shapes. Exploratory browser scripts initially used a nonexistent #tabBtnSales selector; the committed harness uses the actual #tabBtnTx. Both committed runtime test modes completed successfully. No storage implementation or business command changes were made.

Evidence screenshots: tests/evidence/{dev,preview}-{stock,sales}-{1280,390}.png. The runner saves trace ZIPs and screenshots on future failure. Evidence is generated/ignored rather than committed; JSON summary and this report distinguish current runs from historical handoff reports.

NOT RUN: independent original 2.17.2 comparison, React form conversion, financial edge cases, full backup/restore, day-close reconciliation, multi-device signed sync, all themes/screens/accessibility, service-worker upgrades/rollback, physical Android/iOS, Cloudflare staging/deployment headers. These are release blockers, not silently skipped passing tests.

BLOCKED INPUT: original 2.17.2 standalone archive named in the supplied migration requirements. The older 2.16.12 repository cannot certify 2.17.2 parity or provide its original rollback artifact.

Retained bridges: LegacySurface/legacy-tree, classic script loader, React filter bridge and table portals with HTML cells; all business logic still executes in public/legacy/03-core.js. This checkpoint is not a completed React migration.
