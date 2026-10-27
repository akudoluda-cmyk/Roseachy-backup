# Validation — Roseachy Desk 2.16.8

`results/final-validation.json` records each final command, its exit code, duration, and the exact production HTML hash. Individual JSON files contain assertions and outcomes; `final-*.log` files contain command output.

The runner executes:

```text
node static_check.cjs
python ux_workflows.py
python cart_items.py
python pricing.py app
python cart_setup.py
python credit_analytics.py
python payment_matrix.py
python safety.py
python regression.py app
python sync.py
python item_sync.py
python ux_mobile.py
python compatibility_ui.py
python pwa_update.py
```

## New coverage

- Unified first/subsequent add, repeat-product quantity merging and bundle discount; one visible add-to-cart action; empty review cannot append a product.
- Product selection clear, cart-item remove, immediate totals, retained group IDs, friendlier headings, record grouping.
- Open-cart quantity edit and completion blocking on invalid input.
- Completed-cart quantity increases/decreases, preserved prices/discounts, stock movement exactly once, saved-day copies, stable transaction identities, shared-payment debt reconciliation.
- Fractional/blank/insufficient quantities, linked repayments, stale editor rejection, injected IndexedDB failure, complete rollback and retry.
- Manual non-stock price editing without inventory movement; backup/restore and reload after corrections.
- Collapsible inline note editing, original creation time and refreshed Last Saved date.
- Default-masked credit totals, exact nonzero reveal, and unchanged accounting.
- Supplier blank, explicit zero, fully paid, negative, excessive, and over-precision inputs; no mutation on blank submission; reduced-motion behavior.
- Real signed sync enrollment and duplicate imports with an earlier 2.16.7 peer: corrected quantity and audit arrive once, quantity reduction restores stock once, an unedited middle item stays byte-identical, and no-op saving adds no audit.
- Actual clicks/typing and viewport-fit checks for open and completed expanded editors on desktop and mobile, across 5 themes × 2 modes. Notes and supplier review are exercised in both profiles.

## Existing coverage rerun

The prior pricing, cart-payment matrix, credit history/repayments, analytics, confirmed setup, financial/inventory regression, atomic recovery, backup, and signed-sync suites were carried forward. Selectors that referred to the removed Add Item button were adapted to the unified Add to Cart action. Compatibility tests generate an actual backup from the unchanged 2.16.7 baseline. Both correction dialogs are checked across 40 desktop/mobile/theme/mode combinations. A real service worker updates the baseline app to 2.16.8, removes the old cache, and retains notes/database records while offline.

Static validation parses 11 JavaScript units, checks that the pre-existing style blocks are unchanged, and rejects production test hooks. ZIP validation checks archive CRC and entry hashes against source. GitHub publication is verified against the local source commit and the downloadable ZIP hash.

## Test-development findings

The first cart-edit test clicked a second save before the deliberately rejected first operation had released its busy flag; the harness now waits for that operation to finish. The first exact backup comparison encountered the existing restore behavior that derives `businessKey` on saved days. The assertion now excludes only that derived field and compares all transaction, inventory, and other saved data. These adjustments did not relax financial or stock assertions.

The suite uses synthetic records only. Mobile means Chromium touch/device-scale emulation, not physical hardware. No live Cloudflare deployment or hardware power-loss test was performed.
