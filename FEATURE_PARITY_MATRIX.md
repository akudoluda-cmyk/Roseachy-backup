# Stage 3B.5 addition

| Feature | Owner | Verification | Remaining |
| --- | --- | --- | --- |
| Settings opening correction | `SetupCorrectionDialog.jsx` + single original business command | Desktop/mobile original parity: keyboard/cancel, invalid precision, failed save retains draft, duplicate retry, saved-day protection | Shared navigation, field facade and controller retained |

# Stage 3B.4 addition — 2026-11-13

| Feature | Migrated owner | Evidence | Remaining |
| --- | --- | --- | --- |
| Day Setup and closing counts | `src/history/DaySetup.jsx` | `test:day-setup` compares original/production React at desktop/mobile; `test:days` exercises history and failed transitions | Legacy business controller and field facade retained |
| Confirmation and persisted locks | React registered action; existing controller command | Invalid/blank amounts, double click, reload locks | Confirmation write-failure recovery not characterized by new fixture |
| Settings opening correction | Existing legacy dialog → controlled setup state | Precision validation and persisted corrected amount | Dialog conversion and broader failure coverage |
| Year-end transition | Existing controller; React fields | Dec 31 → Jan 1, exact counted carry-forward and reset | Automatic midnight and other calendar cases |

The previous matrix follows as historical context.

# Feature parity matrix

Original 2.17.2 is archived in reference/. Independent persisted-state parity passes for the product creation, cash-sale edit/refund, transfer sale, expense, credit purchase/repayment, export/restore/reload fixture at 1280px and 390px. Other PASS entries describe the stated current-app checks only; they are not comprehensive original parity. No accepted deferrals or completed migration are implied.

| Feature | Current owner | Current-app evidence | Remaining work |
| --- | --- | --- | --- |
| Boot and eight filters | React bridge/filter controls | PASS dev + built app, 1280/390px; stock search/reset | All filter combinations, persisted preferences |
| Product create/edit | React draft fields + legacy atomic command | PASS create/edit/cancel, duplicate-submit, packs, quantity pricing, failed-write rollback/retry, reload; basic original fixture parity | Direct domain commands, all field combinations; division/subdivision move test now passes |
| Cash sale | React draft fields/actions and JSX rows + legacy atomic command | PASS two units/600, duplicate-submit, edit quantity delta, cancel, overselling rejection, failed-write rollback/retry, reload; basic original fixture parity | All payment paths and broader day-close edge cases; tested daily totals and explicit JSX rows pass |
| Multi-item Sales cart | React HeldCart/payment fields + explicit commands | PASS original-vs-React at 1280/390px: remove/re-add, quantity edit, invalid edit blocked, draft reload, recorded price retained after inventory price edit, failed write, retry, duplicate completion; final data/totals equal | Broader payment allocations and completed-cart correction dialog migration; original hidden-draft recovery defect fixed explicitly |
| Storage v8 | Unchanged storage module | PASS 12 checks: migration, reload, index, stale-tab rejection | Repository boundary PASS: 7 real-IDB checks; broader full-app races remain |
| Offline shell | Service worker + React build | PASS fresh install/control/offline reload at 1280/390px | Version updates, rollback, physical devices |
| Divisions/subdivisions/bulk moves | React rows/events + legacy classification commands | PASS group toggle, long press, Select All and move to subdivision; all nonclassification fields preserved | Dialog/form migration and broader group edge cases |
| Credit, repayments, refunds | React retail draft fields + legacy core | PASS original-vs-React linked refund, credit account purchase with partial payment, repayment, exact cash/stock reconciliation | Full financial parity and ownership migration |
| Market/supplier debts | React supplier-payment dialog + legacy business commands | PASS credit stock purchase, linked partial cash payments, overpayment refusal, duplicate-click guard, failure/retry, date/cash guards, external advance and stock/cash/payable parity; original backup restore with exact Market/payment records at 1280/390px | Purchase-list UI, supplier bank verification, reversals, broader supplier history and remaining Market conversion |
| POS/cash movements | React PosEntry/CashMoveDialog + extracted POS math + legacy ledger commands | PASS withdrawals/transfers/deposits, charge methods, shortage guards, edit/cancel/delete, failure/retry, all three legacy-type editors, cash moves/adjustments, reload and exact original-state parity | Broader bank/POS transfer cases, broader day close, navigation ownership |
| Saved Days/day transition | React SavedDays, DayActions and HistoryBanner + unchanged atomic day controller | PASS original-vs-React at 1280/390px: save/update/double click; both persistence-stage failures; archive/filter/history/return; counted and expected carry-forward; debt deletion protection; old stock snapshots; reload and pagination | Day Setup fields, midnight preservation, verification-after-write failure, archive/delete failure and full ownership migration |
| Financial Desk | Legacy core | POS balances covered through Sales Desk; Financial Desk UI NOT RUN | Account views, bank review, opening/closing, history, reconciliation and React ownership |
| Reports/Analytics/printing | Legacy core | NOT RUN | Deterministic report totals, filters, export and print |
| Notes/settings/themes | Legacy core | NOT RUN | CRUD, persistence, keyboard and theme coverage |
| Full/working backup restore | Legacy core | PASS Working Stock export; original Full Backup restore into React, independent checksum, reload, tampered checksum rejection | Older backup versions, interrupted restore, Working Stock restore, React UI ownership |
| Sync/file/device integrations | Legacy core + Android helper | NOT RUN | Signed-file exchange, conflicts, device authority, retry recovery |
| Accessibility/responsive design | Legacy CSS + React controls/rows | PASS smoke at 390/1280px, credit button reachable, React product picker arrows/Enter/Escape/focus; cash-move dialog Tab containment and Escape | Dialog focus, full keyboard use, all screens/themes, tablet |

Full acceptance baseline and feature-specific tests must be expanded before removing LegacySurface or the business controller.
