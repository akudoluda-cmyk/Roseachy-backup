# Data contract — preserved Stage 3A

Authoritative database: `roseachy_pwa_db`, version **8**. Storage implementation is unchanged from the supplied archive. No schema migration or new financial writer was introduced.

`RoseachyStore` normalizes records, maintains record indexes, serializes commit ordering, tracks revision/stale-tab state and exposes `whenSaved()`/`verify()`. UI operations must continue through the existing business command path until its replacement has parity tests. Direct writes in the storage fixture test the storage service only, not business validation.

| Key | Purpose |
| --- | --- |
| dsb_stock_v2 | Product collection / stockRecords |
| dsb_saved_v2 | Saved days / savedDayRecords and transactionRecords index |
| dsb_draft_v2 | Working day transactions, opening stock and day fields |
| dsb_hold_v1 | Held purchase |
| dsb_notes_v1 | Notes |
| dsb_stock_trash_v2 / dsb_tx_trash_v2 | Recoverable deleted records |
| dsb_preimport_v1 | Import recovery |
| roseachy_market_v1 | Market purchase state |
| roseachy_classifications_v1 | Shared classification registry |
| roseachy_appearance_v1 / roseachy_ui_v1 | Appearance/interface state |
| roseachy_working_forms_v1 | Working forms |
| roseachy_finance_vault_v1 / roseachy_finance_review_v1 | Financial state |
| roseachy_inventory_audit_v1 | Inventory audit records |
| roseachy_sync_* and associated shadow keys | Device identity, signing, events, sessions, reconciliation |

The complete mapping is STORE_OF and COLLECTIONS in public/legacy/01-storage.js; this table is a readable summary, not a replacement schema. Preserve all other mapped keys.

Product IDs and transaction IDs are stable references. Product quantities, batches, cost snapshots, price modes, package representation and subdivision IDs carry business semantics. A cash sale in the smoke fixture stores amount 600, quantity 2, unit price 300, cost snapshot 200 and a product reference; quantity moves from 12 to 10 in the same business workflow. The resulting working transaction is persisted in the draft; the smoke does not claim day close or archived-day correctness.

Preserve timestamps, historical snapshots, customer/supplier provenance, returns/batch allocations and backup format versions. Do not infer a new monetary rounding rule from the fixture. Full legacy backup compatibility remains unverified without the original artifact and representative exports.
