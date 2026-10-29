# Roseachy Desk 2.16.11 — verification and delivery

Source commit: `c6708ba304d799de53b91639db90c391a8b72144`. Final index.html SHA-256: `43961ccb6861205131f63c1026b8483f9fa68e129b1606b47fff807d7cd670be`.

## Scope and preserved work

The supplied 2.16.8 Cloudflare ZIP is preserved under original/ and checkpoints/. This release builds on the previously verified 2.16.10 appearance and workflow fixes. Only index.html and sw.js change from that baseline. The user's two new specifications are included verbatim.

The vault reference informed dimensional cards, rich gradients, soft illumination, glossy primary actions, rounded navigation and a stronger financial hierarchy. All colours derive from the existing selected theme. No reference burgundy/pink is hardcoded into the design. All six existing themes and their light/dark modes remain available; the redesign introduces no new colour picker or runtime library.

## Implemented redesign

- Shared theme tokens generate rich feature-card gradients, primary-action gradients, subtly tinted supporting surfaces, ambient page colour, and theme-tinted shadows. Gradient stops are contrast guarded using the existing colour functions. Status colours remain distinct for success, warning, error and information.
- Sales, inventory, financial balances, report summaries and analytics retain their real values. Report retail sales and gross profit receive feature-card treatment; supporting statistics use softly elevated cards. Bank-balance figures are larger and tabular.
- Consistent card, menu, dialog, field, notification and navigation styling uses the existing canonical stylesheet. Highlights are scoped to elevated surfaces so text-only controls do not acquire unwanted glossy edges. Button hover/press effects respect reduced motion and the existing animation settings.
- Fields retain the tested solid edges, neutral calculated Total wrapper, clear focus outlines and clean placeholder rendering. No sales or payment formula changes.
- Existing navigation, business handlers, stored records, debt workflows, privacy, stock replay, backups, sync and offline behavior are retained. No synthetic data ships in the app.

## Three precise appearance controls

All use native labelled ranges with min 0, max 100, step 1, visible numbers, direct CSS-variable updates and existing persistence. Changing a slider does not rebuild the preview or recalculate the whole theme. Each setting remains independent and survives theme changes and refresh.

| Setting | Continuous mapping |
| --- | --- |
| Roundness | Small/medium/large surfaces: 16/28/40px × value/100. Buttons and single-line fields use their actual half-height × value/100, producing true capsules at 100. |
| Border thickness | 3px × value/100, painted as a fractional inset edge. A transparent structural border keeps dimensions stable. |
| Shadow effect | Two soft card layers interpolate offset, blur, spread and alpha. Main card layer: y 14px, blur 32px, spread −6px, opacity .18, each multiplied by value/100. Menus and featured panels use larger controlled layers; small controls use gentler layers. |

Zero disables the corresponding decorative effect, including inner shadow lighting. Keyboard-focus indicators remain independent. Fractional CSS values are retained; finite screen pixels can make neighbouring tiny increments look similar without snapping the mathematical mapping to presets.

A ResizeObserver updates control half-heights only when their actual layout size changes, including dynamic controls and large text. Removed controls are unobserved. Slider input does not read every component's layout.

Fresh/reset defaults are 80 roundness, 30 border thickness, and 50 shadow effect. Explicit existing numerical values, including zero, are preserved. Older compact/refined/rounded/soft shapes migrate to 25/40/55/75. This is one-time compatibility mapping, not stepped behavior in the new sliders. Transaction schemas are unchanged.

## Executed checks

| Check | Final result |
| --- | --- |
| Business and offline suite | All 14 commands pass: 91 browser groups plus static validation. |
| Static scope | 11 JavaScript units and 51 stylesheets parse; 927 non-appearance functions unchanged from 2.16.10; two geometry helpers added; no production test hooks. |
| Slider precision | All 101 values ascending and descending for each of the three controls, computed and stored values, independence and unchanged preview DOM. Nine check groups pass. |
| Native input | Keyboard Home/End/single steps, mouse clicks and emulated touch positions, backwards adjustment, reset and refresh persistence pass. |
| Theme preservation | All six themes × both modes preserve selected intensities. |
| Pill geometry | Twelve viewport/density combinations with large text, a dynamic multiline button, and observer cleanup pass. |
| Border stability | Card, button and text rectangles stay unchanged at 0, 1, 10, 25, 50, 75, 90, 99 and 100. |
| Responsive matrix | 1,056 cases: eleven views × eight widths × six themes × two modes. Zero page overflow, flagged clipped controls or below-target text samples. |
| Contrast measurements | 110,450 normal-matrix text samples, including gradient endpoints. |
| Maximum/minimum appearances | 768 cases across four views at all three controls set to 0 and all three set to 100. Transaction, inventory and open-cart snapshots remain unchanged. |
| Dialogs | 192 normal supplier-payment/Credit Account cases plus 48 maximum-setting cases pass. |
| Field rendering | 120 before/after combinations cover rest, hover, focus, typing and selection across all themes/modes. |
| Before/after screenshots | 60 matched full-view screenshots per version; zero after-sample contrast failures. |
| Large amount | ₦987,854,321.12 fits at all tested widths and at maximum settings. |
| Zero radius audit | No nonzero container radii in the eight audited views. Native/decorative indicators retain their appropriate behavior. |
| Normal-motion settings | 18 native theme clicks and nine keyboard-operated sliders across 320/1280/1440, without forced clicks or business test hooks. |
| Production HTTP app | All desks, themes, appearance changes and reload: zero console/page errors; service worker active. |
| PWA upgrade | Actual uploaded 2.16.8 → 2.16.11 update, old-cache removal and offline note preservation pass. |
| Standalone preview | Notes and all three sliders persist after reload; no external network requests. |

Widths: 320, 375, 390, 425, 768, 1024, 1280 and 1440. Views: Sales, Stock, Market, Suppliers, Financial, Reports, Notes, Analytics, Saved History, Credit History and Settings. Themes: Cobalt Studio, Midnight & Ember, Pearl & Royal Blue, Cyan Flux, Coral Carbon and Mono Mint.

The uploaded 2.16.8 and final source differ in nine named presentation functions: showToast, appearanceSafe, radiusSet, rsApplyAuditContrast, applyAppearanceSettings, updateAppearanceValue, renderSupplierDebtBoard, renderMarketHistory, finRowHtml. The additional carried-forward changes are toast tones and record-rendering classes from the intervening styling releases. The final incremental patch changes only audited appearance functions and adds the two geometry helpers; financial and inventory algorithms are unchanged.

## Visual review and limits

Selected actual Financial, Sales, Reports, field crops and extreme-setting screens were visually inspected. The HTML gallery and source ZIP contain the screenshot evidence. The full automated matrices are not represented as manual inspection of every case.

The contrast target is 4.5:1 for ordinary text and 3:1 for large text, with a 0.02 numerical tolerance. Measurements use computed colours, alpha compositing and gradient stops; internal table scrolling is distinguished from page overflow. This is targeted verification, not comprehensive WCAG certification. Native popup pixels, SVG/image pixels and assistive technologies were not comprehensively audited.

An initial automated Settings click timed out during motion. The final production run and repeated native navigation across three widths pass without forcing clicks. No failing executed check remains in the final evidence.

Physical Android/iOS, Safari and Firefox were not tested. Touch testing uses Chromium emulation. The standalone preview was tested over local HTTP; managed Chromium blocks file URLs, so file-protocol storage behavior is not claimed. No Cloudflare deployment was performed. The verified deployment ZIP contains the complete 13-file static app at its root and requires no build step.
