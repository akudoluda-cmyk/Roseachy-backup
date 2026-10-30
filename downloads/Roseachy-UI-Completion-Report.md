# Roseachy 2.16.11 — completed UI refinement build

This build replaces the earlier `UI-Refined` ZIP. It uses the uploaded 2.16.11 application, not the older Git checkout. Only `index.html` and the service-worker cache version changed; the deployment ZIP retains the original 13-file Cloudflare Pages structure.

## Implemented changes

- Eight coordinated 0–100 controls use fractional calculations. Global Spacing controls separation; Field Size controls field dimensions; Section Size controls internal padding; Vertical Rhythm controls text spacing; Vertical Compactness reduces vertical whitespace. Corner Roundness, Border Thickness and Shadow Effect retain their existing independent roles.
- Vertical Compactness is saved, restored, included in appearance resets and carried in the existing full-backup appearance data.
- Live slider changes update CSS and numerical/descriptive feedback without rebuilding the preview or recalculating business records. Obsolete stepped field-sizing rules were removed.
- Touch controls share a 44px minimum instead of competing selector-specific rules. Switch labels and range controls retain adequate touch areas. Text size is not reduced to achieve compactness. Minimum sizes can cap vertical compression; horizontal field padding and other applicable values still interpolate.
- A one-time appearance-schema conversion maps existing version-17 and version-18 field/card/grid sizing into the independent controls. It preserves themes and pricing preferences. The slider numbers can change on upgrade to preserve approximate physical sizes. The tested field-height mappings differ by less than 0.3px before accessibility floors. Safety floors take precedence over legacy undersized controls. Default fields are 48px high and default card padding is 27px, matching the uploaded app.
- Card headers now sit inside a fixed gutter that leaves the outer edge visible. Supplier groups use one inset divider per shared boundary. Table surfaces sit inside the wrapper edge. Thickness and radius changes do not change the tested layout boxes.
- Sales navigation uses fixed equal slots, lightweight SVG icons, reserved label space and active-only visible labels. Existing keyboard, swipe and navigation handlers remain in use. Hover no longer translates a navigation item. Reduced-motion and print exclusions are preserved.
- The Sales logo has a small optical left adjustment without changing its asset, aspect ratio or other desk logos.
- Inputs use plain backgrounds, and selects specify one positioned arrow. Native spelling marks are disabled on business-entry fields, including dynamically generated fields; focus rings and native validity checks remain enabled. This removes browser spelling squiggles as an unwanted decoration source.
- The service worker has a new cache version so the app can offer its normal safe update flow.

## Verification performed

| Check | Result |
|---|---|
| JavaScript syntax | Inline scripts and all three external JS files passed |
| Full slider range | 808 actual computed-style positions passed, plus reverse checks at the brief's representative values |
| Control independence | Unrelated font, padding, grid and button dimensions stayed unchanged in targeted checks |
| Preference migration | 66 combinations across versions 17/18, three densities and representative values passed; conversion is idempotent |
| Persistence | All eight distinct slider values survived actual input events and reload |
| Mixed extremes | 144 theme/mode/size configurations checked through eight views: Sales, Stock, Reports, Notes, Analytics, Market, Finance and Settings—1,152 view/configuration visits |
| Responsive widths | 360, 768 and 1280 pixels; page overflow and visible field-height checks passed |
| Field states | 1,008 paint/validation checks across six themes, two modes, two extremes, six field types and seven states passed |
| Borders | Thickness/radius extremes, fixed header clearance, no card layout shifts, and generated-group/table boundary fixtures passed |
| Navigation | Keyboard, touch tabs, synthetic swipe, active-label/indicator alignment, 100 rapid production-handler clicks and reduced-motion checks passed |
| Printing | Navigation hidden in print; populated report remains available |
| Touch sizing | Previously failing text/date controls, header buttons, slider and switch targets meet the tested 44px minimum |
| Business smoke workflow | Created stock, recorded cash sale, completed a cart, checked stock decrement and gross profit, saved notes and supplier, rendered reports, captured a checksummed full backup, and verified reload persistence |
| Offline release check | Unmodified production HTML and service worker reloaded offline and retained a saved note |
| Browser errors | No uncaught JavaScript errors in completed checks; database verification passed |
| Visual review | Representative desktop/mobile screenshots and maximum-thickness shared boundaries inspected |

The mixed-extreme matrix initially stopped after its 1,152 view visits because a 3px gutter measured 2.9999847px. The follow-up border stage used a 0.01px tolerance and passed. This was floating-point measurement noise, not a hidden failing application assertion.

## Verification limits

Testing used installed Chromium, desktop/mobile viewport sizes and touch emulation. It does not establish physical Android/iOS or Safari behavior. The original device-specific zigzag was not independently reproduced; the build addresses the identified decoration mechanisms, and no unwanted patterns were found in the tested states. The business smoke workflow is not an exhaustive financial or sync regression suite; calculation logic was not changed. This package has not been deployed or published.

## Deliverables

- `Roseachy-Desk-2.16.11-UI-Completed-Cloudflare-Pages.zip`: deployable app, with `index.html` at the ZIP root.
- `Roseachy-UI-Verification.zip`: test scripts, measured results, screenshots, this report and a source patch for review. Test-only hooks are injected into served responses by the test harness; they are absent from the deployment ZIP. The release check uses unmodified production HTML.
