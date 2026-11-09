# Data contract — Stage 3B boundaries

Authoritative database: `roseachy_pwa_db`, version **8**. Storage implementation is unchanged from the supplied archive. No schema migration or new financial writer was introduced. Stock, retail Sales and cart payment draft values now live in src/forms/form-state.mjs snapshots consumed by controlled React components. The compatibility facade translates existing reads/writes/event registration for those fields into draft operations. It never writes IndexedDB. The existing inventoryCommit/RoseachyStore.atomic path remains the only business writer. Each submit action has an in-flight guard; failed commits restore draft values through the same boundary.

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

Preserve timestamps, historical snapshots, customer/supplier provenance, returns/batch allocations and backup format versions. Do not infer a new monetary rounding rule from the fixture. The original 2.17.2 artifact is now preserved. Working Stock export and persisted-state comparison pass for the financial/credit fixture. Original 2.17.2 Full Backup import, checksum validation, reload and tampered-file rejection pass. Other older backup versions still require representative fixtures.

## Extracted math

`src/domain/inventory-math.mjs` contains clampMarkup, roundMoney, priceFromMarkup, impliedMarkup, inventoryWhole and inventoryMoney. Their bodies are unchanged from original 2.17.2. The unit suite evaluates the actual original source from the immutable archive and compares 1,734 boundary combinations, including blank values, invalid strings, negatives, fractional values, nonfinite values and upper limits. This preserves legacy parsing/rounding instead of silently introducing new financial semantics.

## Repository observation contract

`src/data/desk-repository.mjs` delegates controller calls to the unchanged storage service. `getSnapshot(key)` returns a deeply frozen detached value with stable identity until persisted content changes; `subscribe(key, listener)` and `subscribeStatus(listener)` notify consumers. Pending and failed writes do not replace committed snapshots. Stale tabs retain their last snapshot, report stale status, and remain blocked by the original write guard. React must not use the mutable `controller.getObject` API as its state model. The compatibility controller is reserved for existing domain operations.

The repository does not replace the Smart Sync commit observer, register a second error handler, open another database, change retries, or write business data independently. `tests/verify-repository.py` exercises actual IndexedDB atomic commits, both failed retry attempts, rollback, successful retry, ordinary queued writes, cross-tab staleness and reload.

## Cart commands and captured prices

`HeldCart.jsx` owns item input strings and validation presentation. Commands address stable item identities, call the existing cart operations, and preserve the existing `dsb_hold_v1` contract. Cart drafts reserve products without deducting stock; completion commits the original linked transaction group through the existing atomic writer. Failed completion restores the visible cart and payment draft for retry.

`src/domain/sales-pricing.mjs` extracts unchanged `validQuantityPricing`, `salePricing`, `ruleFromSaleRecord` and `reviseCartItem` functions. Two tests compare 846 outcomes against the immutable original source. Captured unit prices/quantity discounts survive subsequent stock-price changes; corrected quantities recalculate using their historical rule. Stock, Sales and cart action buttons register explicit commands, rather than relying on captured native click listeners. Field compatibility remains transitional.
