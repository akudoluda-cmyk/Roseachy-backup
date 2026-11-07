# Feature parity matrix

Original 2.17.2 baseline is unavailable. PASS below means the stated current-app check passed; independent original-vs-React parity is BLOCKED for every row. No accepted deferrals or completed form migration are implied.

| Feature | Current owner | Current-app evidence | Remaining work |
| --- | --- | --- | --- |
| Boot and eight filters | React bridge/filter controls | PASS dev + built app, 1280/390px; stock search/reset | All filter combinations, persisted preferences |
| Product create | Legacy core | PASS UI creation, 12 units, cost 200/price 300 | React form ownership, edits, invalid inputs, failed writes |
| Cash sale | Legacy core + React table portal | PASS two units/600, one draft transaction, stock 10, reload | Exact daily UI totals, duplicate-submit, edit, saved-day close |
| Storage v8 | Unchanged storage module | PASS 12 checks: migration, reload, index, stale-tab rejection | Full-app races, failure recovery and repository boundary |
| Offline shell | Service worker + React build | PASS fresh install/control/offline reload at 1280/390px | Version updates, rollback, physical devices |
| Divisions/subdivisions/bulk moves | Legacy core | NOT RUN in this React checkpoint | All grouping/move/selection behavior and React ownership |
| Credit, repayments, refunds | Legacy core | NOT RUN | Financial parity fixtures and form migration |
| Market/supplier debts | Legacy core | NOT RUN | Purchase lists, stock integration, partial payments, debt settlement |
| Finance/POS/cash movements | Legacy core | NOT RUN | Arithmetic, opening/closing, history, reconciliation |
| Reports/Analytics/printing | Legacy core | NOT RUN | Deterministic report totals, filters, export and print |
| Notes/settings/themes | Legacy core | NOT RUN | CRUD, persistence, keyboard and theme coverage |
| Full/working backup restore | Legacy core | NOT RUN | Original export comparison, invalid-file refusal, round trip |
| Sync/file/device integrations | Legacy core + Android helper | NOT RUN | Signed-file exchange, conflicts, device authority, retry recovery |
| Accessibility/responsive design | Legacy CSS/DOM | PASS smoke no horizontal overflow at 390/1280px | Dialog focus, full keyboard use, all screens/themes, tablet |

Full acceptance baseline and feature-specific tests must be expanded before removing LegacySurface or the business controller.
