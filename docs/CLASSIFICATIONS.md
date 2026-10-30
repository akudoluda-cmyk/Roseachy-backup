# Roseachy Desk 2.16.12 — divisions and subdivisions

Implemented on top of the completed 2.16.11 UI refinement. New classification interfaces are limited to Stock Desk and Market Desk.

## Using the upgrade

- Choose **View All** or **Division View** independently in either desk. Each choice persists.
- Use **+ Add Division** to create a division. In Stock Division View, use Rename, Remove, and **+ Add Subdivision** inside a division.
- Products may have no subdivision; they appear under **No Subdivision**, which is a display grouping, not a stored category.
- Use the existing Stock selection interaction (press and hold a product row), then its existing checkboxes and Select All. **Move Selected** is beside Delete. The destination form also allows adding a subdivision without losing selection.
- Market's goods browser adds products to the currently selected Active List. Divisions never split purchases into separate supplier transactions. Existing quantity, cost, supplier, payment and purchase review controls remain in use.

## Data and storage

One registry, `roseachy_classifications_v1`, is stored through the existing IndexedDB persistence layer. `product.division` remains the stable division ID, preserving the existing `pharmacy` and `essentials` identities. Products additionally carry optional `subdivisionId`. No new database, dependency, or duplicate product store is introduced.

The repeatable migration recovers existing division labels and subdivision references without replacing product IDs, quantities, prices or transaction history. Missing divisions remain visibly Unassigned. Full Backups and Working Stock exports include the registry; their restore paths support older files. New Full Backups use version 32 / schema 18, and Working Stock exports use version 9.

Bulk moves use the existing atomic business-save mechanism and update only the two classification fields. Selection clears only after a committed move. Failed saves retain selection and roll back all assignments. An unfinished Market purchase cannot silently restore an older classification after a Stock move; conflicting deliberate classification edits require reopening the purchase item.

Unused classifications are logically removed with archived records retained for historical references and sync. Removal is blocked for products, recycled products, pending purchases, or active child subdivisions. Names are trimmed and compared case-insensitively within their appropriate scope. Identical subdivision names under different divisions are supported.

Classification records and product subdivision IDs participate in existing Smart Sync serialization, event generation and projection. Devices exchanging these new records need this version. No new controls were added to Sales, Reports, Credit History, Analytics, Notes, or Financial Desk.

## Verification performed

Run with Python, Playwright and Chromium installed (`/usr/bin/chromium`):

```sh
python tests/classifications.py
python tests/classifications_integrity.py
python tests/classifications_release.py
```

The first two suites serve test-only private hooks in memory; those hooks are not present in the deployment ZIP. The release suite serves the unmodified production files and exercises the actual service worker.

Passing checks include:

- Division/subdivision creation, rename, duplicate checks, removal safety, parent/child guards, and stable assignment IDs.
- Existing Stock selection, filtered Select All, cross-view selection, cancellation, subdivision creation during a move, and full rollback after an injected storage failure.
- A sale from a custom division, stock decrement and profit calculation; subsequent reclassification preserves the historical transaction.
- Mixed-division purchases in one list, unchanged draft state across view switches, explicit Amount Paid validation, one supplier purchase, and expected stock quantities. A tested ₦440 purchase with ₦200 paid retains ₦240 supplier debt.
- Full Backup and Working Stock round trips; repeat migration and reload of known, unknown and missing legacy division values.
- Actual generated sync events projected onto a baseline and classification registry reconstructed with no conflicts or quantity/batch movements.
- Markup-like names rendered as text; invalid product/classification references rejected.
- Desktop/tablet/mobile widths (1280, 768, 360), touch controls, dialog focus/Escape, supported theme extremes, independent view preferences, and IndexedDB verification.
- A 2,000-product inventory with 22 divisions and 100 subdivisions, paging/search and one 2,000-product move preserving every non-classification field. In the final test run, opening the grouped view took about 0.8 seconds and the move about 2.1 seconds in this cloud Chromium environment.
- Unmodified production startup, product creation with a custom division/subdivision, service-worker control, and offline reload retaining product and classification data.
- All embedded and external JavaScript syntax checks and `git diff --check`.

Machine-readable results are in `tests/results/`. Tests reported no unexpected browser errors.

## Verification limits

Browser tests used Chromium and touch emulation, not physical Android/iOS devices or Safari. Sync event serialization/replay was tested; a full two-device enrollment and signed-file exchange was not performed. This is targeted regression coverage, not an exhaustive audit of every finance or historical-reporting workflow. Existing report interfaces remain unchanged. New divisions inherit the existing fallback default markup of 0%; product-specific markup and manual prices remain available.
