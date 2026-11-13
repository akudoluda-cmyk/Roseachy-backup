# Stage 3B.6 — Durable history commands and day recovery

Archive/Restore/Delete now use a nonmutating domain plan and the existing atomic storage writer. A React recovery notice blocks stale editing after a double failure; background working-state saves wait for day operations and stop during required recovery. These deliberately fix characterized original failure behavior without changing financial arithmetic or successful day-transition semantics.

Next: inventory remaining transaction/cart correction form ownership and migrate a characterized slice; separately cover confirmation write failures, timer-triggered midnight behavior and additional financial boundaries. Legacy controllers/facades and Stage 3C–6 completion gates remain.

# Stage 3B.5 — Settings correction

Explicit React correction UI is implemented with original validation and atomic persistence preserved. Keyboard, failure/retry and saved-day guards are covered against the immutable original. Remaining work: midnight/verification/archive/delete failure characterization, remaining form facades, Stage 3C financial edges and later module/release gates.

# Current checkpoint — Stage 3B.4, 2026-11-13

Day Setup and reconciliation field ownership are now migrated to explicit React components. Confirmation dispatch uses one registered command and awaits its existing persistence promise. Settings correction continues through the original controller and hydrates React state through the scoped facade. See MIGRATION_STATUS.md for the recovery audit and next slice. The prior plan below remains historical; the overall architecture and release gates are still incomplete.

---

# Migration status — 2026-11-11

Decision: NO-GO for production. Migration is incomplete.

## Inputs and checkpoint

Working source is the supplied `Roseachy_Desk_Latest_Stage_3A (1).zip`, extracted into this isolated Git repository. The untouched upload remains under `/workspace/attachments/`. Initial source commit: `a1fa01b`. Current branch: `migration/stage3b-forms`. Package: `2.17.2-react-phase3b.3`. No live origin or business data was accessed.

The user supplied the original 2.17.2 standalone archive. It is preserved as `reference/original-2.17.2.zip` (SHA-256 `55a9a1ba418c910d2065240bffe4a385a449f285f8e973cd335e9722be9e1a04`). Its version meta tag is `2.17.2-m3-spacing`. Its storage source matches this project byte for byte. The older 2.16.12 repository was not substituted. Actual UI creation, cash sale, Working Stock export and reload were exercised independently in both apps; all normalized persisted stock and working-day fields match for that fixture. The expanded fixture also matches edited cash sales, linked refunds, transfer sales, expenses, customer credit purchases and repayments at 1280px and 390px. Full Backups from both apps have independently verified SHA-256 checksums; the original backup restores into a fresh React profile, survives reload, and a tampered file is rejected without mutation. Broader financial coverage remains incomplete.

## Execution gates

- Stage 0 technical gate: PASS — real production build, 12 real IndexedDB checks, actual React dev/production UI smoke.
- Stage 0 baseline: original archived and initial cash-sale/export parity PASS. The tested full-backup round trip passes. Comprehensive feature characterization remains incomplete.
- Stage 3B: IN PROGRESS — Stock, retail Sales, cart, POS, cash-move and supplier-payment fields are React controlled; action guards prevent duplicate submissions; extracted inventory math is tested against original functions. Stock create/edit/cancel/pack/quantity-pricing and cash sale/edit/refund/failed-write recovery checks pass. Business commands still execute in the single legacy atomic controller. Stock and Sales tables now use explicit JSX and React events; product suggestions are React owned, including keyboard selection. A repository boundary publishes committed immutable snapshots with stale-tab notifications. Cart items/payment fields are now React owned with explicit command registration; POS and payment dialogs now have explicit React layouts; Saved Days rows/filters/history banner and Save Day/Start New Day actions are React owned; complete form/workflow coverage and removal of the field compatibility facade remain required before the architecture is complete.
- Stage 3C: NOT COMPLETE (cash edit, linked refund, cart and credit purchase/repayment covered; POS/cash moves and supplier cash debt payments/external advance covered; defined day-save/history/carry-forward fixture covered; bank verification/midnight preservation/other financial edge cases remain) — deterministic credit/refund/purchase/debt/edit/day-close reconciliation and failure coverage against original.
- Stage 4: NOT COMPLETE — supplier payment UI is extracted as part of the financial slice; broader Market, Finance, Reports/Analytics, Notes, Settings, backup/restore and signed-file sync; replace each controller only after parity.
- Stage 5: NOT STARTED — shadcn/Radix design system and accessibility/visual coverage after functional parity.
- Stage 6: PARTIAL foundational checks only — fresh offline production load and npm audit pass. Backup restore and a defined financial fixture pass; update/rollback and full workflow release gates remain incomplete.

## Next steps

1. Keep the verified original immutable. Next, characterize supplier bank verification/reversal, midnight preservation and other financial edge cases. Day-save/next-day transition, historical snapshots, POS and supplier cash payments now have defined parity fixtures. Existing cart, credit/refund, stock move and full-backup fixtures must keep passing.
2. Replace the remaining Stock/Sales field element facade with direct domain arguments and named layouts. Extend FEATURE_PARITY_MATRIX.md to every transaction/action, including Market, Finance, Reports, Notes, Settings and signed-file sync.
3. Run `npm ci`, `npm run test:unit`, `npm run test:static`, `npm run build`, `npm run test:storage`, `npm run test:forms`, `npm run test:repository`, `npm run test:tables`, `npm run test:cart`, `npm run test:financial`, `npm run test:pos`, `npm run test:supplier`, `npm run test:days`, `npm run test:runtime:dev`, `npm run test:runtime`.
4. Proceed through 3B, 3C, 4, 5 and 6 sequentially. Do not interpret smoke coverage as completed migration.

## Ownership map

| Layer | Current owner | Migration obligation |
| --- | --- | --- |
| Boot | src/BridgeApp.jsx, sequential classic script loader | Remove only after all controllers are replaced |
| Page structure | LegacySurface.jsx + legacy-tree.json (2,281 nodes / 812 IDs) | Replace with named React components |
| Eight filters | ReactFilterControls.js → legacy filter bridge | Preserve dynamic options and restoration semantics |
| Stock/Sales tables | StockInventoryRows/SalesLedgerRows JSX, data models and explicit command methods | Expand edge-case coverage; retire fallback renderers when controller replacement is complete |
| Stock/Sales draft fields | src/forms/* external draft snapshots + React controlled components | Replace remaining compatibility element facade with direct domain commands after complete characterization |
| Inventory/sale/POS math | src/domain/inventory-math.mjs + sales-pricing.mjs + pos-math.mjs | Preserve original rounding, parsing and validation; expand domain extraction |
| POS / payment dialogs | PosEntry.jsx, CashMoveDialog.jsx, SupplierPaymentDialog.jsx with explicit field definitions | Replace remaining controller field facade and shared navigation visibility ownership |
| Product matching | public/legacy/02-product-match.js | Preserve matching and duplicate semantics |
| Saved Days/history/actions | src/history/SavedDays.jsx + day-records.mjs + existing day command owner | Move Day Setup/reconciliation fields and remaining controller ownership after broader characterization |
| All business workflows | public/legacy/03-core.js (remaining shared controller) | Split by tested domain, single writer per operation |
| Persistence | src/data/desk-repository.mjs over unchanged public/legacy/01-storage.js, IndexedDB v8 | Preserve schema, keys, normalization, atomic commit and stale-tab rules |
| PWA/device | public/sw.js, public/js/pwa.js, android-sync-files.js | Test updates, rollback, install and physical devices |
| Appearance | src/legacy.css + core settings | Preserve theme choices while replacing presentation |

Historical function and control inventory: tests/inventory.json. It describes the starting controller and is not proof of complete feature coverage.

## Risks and rollback

- High: broad financial parity is incomplete despite passing credit/refund and full-backup fixtures.
- Critical: most business state remains in one legacy controller; replacement before characterization risks double writes and accounting drift.
- High: Stock/Sales table HTML injection is removed; other modules retain HTML construction and imperative DOM paths.
- High: SW update mixes versioned hashed assets and fixed legacy paths; fresh offline smoke does not prove upgrade/rollback safety.
- High: signed-file two-device sync, older backup versions and interrupted restore recovery remain untested.
- Medium: browser emulation is not physical Android/iOS validation; deployment headers are not exercised by Vite preview.

For development rollback, use the untouched supplied ZIP or initial commit in a separate directory. Do not reset a checkout containing new work. Retain the package lock for reproducible dependency installation. No production cutover has occurred, so no live rollback is necessary. The original archive is preserved; original full-backup recovery into React is verified for the fixture; downgrade/production rollback still requires testing; never restore test records into a live origin.

## Characterized recovery difference

Original 2.17.2 rolls a failed cart save back in storage but leaves its restored cart hidden until reload. The React checkpoint reopens and redraws that preserved draft immediately after rollback, retaining payment values and allowing retry. The original fixture explicitly checks its hidden-panel behavior and reloads; the React fixture requires immediate visibility. Final persisted stock, transactions and totals still match. This is a documented recovery UI fix, not a change to financial arithmetic.

## POS and supplier payment checkpoint

Version `2.17.2-react-phase3b.2` has a distinct service-worker cache version. POS, cash moves and supplier payment content use explicit named React components rather than their legacy JSON subtrees. The original command owner still validates and saves, and shared navigation still opens/closes cash-move and supplier overlays. The storage file remains unchanged.

The original external-supplier-funding handler applies a hidden class to the payment method, but grid CSS makes it visible. A narrowly scoped CSS priority fix now honors that existing hidden state. Tests document this presentation difference while comparing unchanged stored payment semantics. The original navigation also reopens the last cash-move overlay after some reloads; the fixture dismisses it through its Cancel button. Navigation restoration is retained and still needs migration/coverage.

## Day/history checkpoint — 2026-11-11

Version `2.17.2-react-phase3b.3` converts Saved Days rows, range controls, history banner and day action buttons to explicit React markup and registered commands. Native list click/keyboard listeners are disabled when React owns the view. Day-save/update validation is extracted unchanged into `src/domain/day-records.mjs`; 432 scenarios compare it directly with the original source. No persistence/schema/financial arithmetic changes were made.

The fixture covers failures in both closing-day persistence and next-day draft persistence, update identity, duplicate clicks, historical inventory, archive/restore/debt deletion protection, expected/counted carry-forward, reload and pagination. The original storage loader adds a derived `businessKey` to saved records; the reload comparison accepts exactly that existing normalization and otherwise compares all fields. The date is fixed to 2026-11-09 in an Africa/Lagos browser context for deterministic business-day testing; execution dates are recorded separately.

Day Setup and reconciliation fields, the shared daily-operation controller, storage writer and older HTML fallback remain. Midnight preservation, archive/delete write-failure recovery, verification-failure recovery after a committed next-day write, year/month boundaries and full financial reconciliation are not yet characterized by the new browser fixture.
