# Stage 3B.4 contract note

`DaySetup.jsx` owns the ten existing state fields and confirmation UI. Persisted keys, schema v8, blank-vs-zero conventions, signed bank movement, business date semantics and calculation rules are preserved. The existing business controller remains the only persistent writer. Returning `finConfirmDay`'s existing promise extends the React busy guard through save completion; it does not add a second save or change confirmation storage semantics. Settings correction still writes through the same atomic command and field facade.

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

## POS and supplier payment boundary

`PosEntry`, `CashMoveDialog` and `SupplierPaymentDialog` define their own field descriptors and explicit JSX layout. The generic entry controller accepts these definitions without deriving those fields from the legacy JSON tree. Existing actions register through `bindEntryAction` and still use the same `inventoryCommit`/storage service. Temporary legacy POS options are managed as React option data, including removal after save/cancel. Fee selection, movement preview, balances, warnings and supplier summaries are data-only presentation models.

`src/domain/pos-math.mjs` preserves original `POS_FORM`, `posBuild`, `posComponents`, `posMovements` and `posValidate`. The original-source tests compare 1,944 scenarios across all six types and their fee routes, principal/secondary amounts, invalid boundaries and limits. Movement rows remain derived views of one parent transaction, never separately persisted financial records.

Supplier payments preserve purchase links, payment IDs, business-date guards, debt limits, source/method classification, original cash-shortage checks and atomic rollback across market records and the working ledger. An external advance does not consume business cash or settle an unrelated purchase. The parity fixture compares the complete normalized Market state alongside Stock/working-day records; only generated IDs/timestamps are normalized, while business calendar dates are compared exactly.

## Saved business days and history — phase3b.3

`day-records.mjs` preserves the original `normalizedDayRecord` behavior: match date and case/space-normalized business, retain saved ID and archive state, reject missing/duplicate incoming IDs when updating and reject an update missing any previously saved transaction. Existing first-save semantics are unchanged. The incoming detached record is mutated as in the original; the prior archive is not rewritten by this calculation. Tests compare 432 scenarios with the original archive implementation.

The authoritative day controller still saves the closing-day snapshot and current draft atomically, verifies persistence, then saves/verifies the next-day draft. React commands invoke that same sequence. React rows receive formatted data only, use saved IDs for actions and retain original summary calculations, filtering/order/pagination and debt-history deletion protection. Historical viewing remains read only and restores the active snapshot on return. No IDB schema, key, transaction ID, date or rounding rule changed. The original loader's derived saved-record `businessKey` field is explicitly accounted for in reload assertions; other record values remain exact.
