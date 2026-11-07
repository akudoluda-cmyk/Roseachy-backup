# Migration status — 2026-11-07

Decision: NO-GO for production. Migration is incomplete.

## Inputs and checkpoint

Working source is the supplied `Roseachy_Desk_Latest_Stage_3A (1).zip`, extracted into this isolated Git repository. The untouched upload remains under `/workspace/attachments/`. Initial source commit: `a1fa01b`. No live origin or business data was accessed.

The required original `Roseachy-Desk-2_17_2-Clean-Spacing-Cloudflare-Pages(3).zip` was not supplied. `/workspace/Roseachy-backup` contains 2.16.12; it is older and is NOT substituted as the 2.17.2 behavioral baseline. No verified original 2.17.2 export is available. A reconstruction from the React tree would not be an independent reference.

## Execution gates

- Stage 0 technical gate: PASS — real production build, 12 real IndexedDB checks, actual React dev/production UI smoke.
- Stage 0 acceptance baseline and original rollback: BLOCKED on the original 2.17.2 artifact. No complete baseline parity claim.
- Stage 3B: NOT STARTED — create a documented single command/repository boundary, extract and test pure calculations, migrate Stock and Sales forms and table cells, then test edit, duplicate submit, errors and reload against original behavior.
- Stage 3C: NOT STARTED — deterministic credit/refund/purchase/debt/edit/day-close reconciliation and failure coverage against original.
- Stage 4: NOT STARTED — Market, Finance, Reports/Analytics, Notes, Settings, backup/restore and signed-file sync; replace each controller only after parity.
- Stage 5: NOT STARTED — shadcn/Radix design system and accessibility/visual coverage after functional parity.
- Stage 6: PARTIAL foundational checks only — fresh offline production load and npm audit pass. Update/rollback, financial reconciliation, backup restore and full workflow release gates remain unrun.

## Next steps

1. Obtain the original 2.17.2 standalone archive and verify its identity/checksum; keep it immutable. Use disposable business fixtures, not live records.
2. Audit original behavior side by side with this checkpoint; extend FEATURE_PARITY_MATRIX.md to each action. Preserve a verified fixture export and prove round-trip recovery.
3. Run `npm ci`, `npm run test:static`, `npm run build`, `npm run test:storage`, `npm run test:runtime:dev`, `npm run test:runtime`.
4. Proceed through 3B, 3C, 4, 5 and 6 sequentially. Do not interpret smoke coverage as completed migration.

## Ownership map

| Layer | Current owner | Migration obligation |
| --- | --- | --- |
| Boot | src/BridgeApp.jsx, sequential classic script loader | Remove only after all controllers are replaced |
| Page structure | LegacySurface.jsx + legacy-tree.json (2,281 nodes / 812 IDs) | Replace with named React components |
| Eight filters | ReactFilterControls.js → legacy filter bridge | Preserve dynamic options and restoration semantics |
| Stock/Sales tables | SalesStockTables.js portals, legacy HTML cells/delegated actions | Replace cell HTML and delegated mutations with explicit React components |
| Product matching | public/legacy/02-product-match.js | Preserve matching and duplicate semantics |
| All business workflows | public/legacy/03-core.js, 901,242 bytes, 880 named function declarations | Split by tested domain, single writer per operation |
| Persistence | public/legacy/01-storage.js, IndexedDB v8 | Preserve schema, keys, normalization, atomic commit and stale-tab rules |
| PWA/device | public/sw.js, public/js/pwa.js, android-sync-files.js | Test updates, rollback, install and physical devices |
| Appearance | src/legacy.css + core settings | Preserve theme choices while replacing presentation |

Machine-readable function and control inventory: tests/inventory.json. This is a source inventory, not proof of complete feature coverage.

## Risks and rollback

- Critical: absent independent 2.17.2 baseline prevents financial parity and original rollback certification.
- Critical: most business state remains in one legacy controller; replacement before characterization risks double writes and accounting drift.
- High: HTML cell injection and imperative DOM paths remain; security and migration work is unfinished.
- High: SW update mixes versioned hashed assets and fixed legacy paths; fresh offline smoke does not prove upgrade/rollback safety.
- High: full export/restore and signed-file two-device sync remain untested.
- Medium: browser emulation is not physical Android/iOS validation; deployment headers are not exercised by Vite preview.

For development rollback, use the untouched supplied ZIP or initial commit in a separate directory. Do not reset a checkout containing new work. Retain the package lock for reproducible dependency installation. No production cutover has occurred, so no live rollback is necessary. A production rollback procedure remains blocked on the original archive and verified backup/export; never restore test records into a live origin.
