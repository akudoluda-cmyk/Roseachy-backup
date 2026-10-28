# Roseachy Desk 2.16.10 — verification and design notes

28 October 2026, Africa/Lagos. Baseline: 2.16.9, commit `1a21173e2a7cf99916fea835a9229d64d908d690`. Final source SHA-256: `83a58c93d62c882945c7e9ebef36a42622bfa52eaa78032775a0a2fbe33abd34`.

## What changed

The references informed stronger primary-colour feature cards, understated supporting surfaces, more deliberate spacing, soft shadows and clearer typography. The existing six theme identities, brand, workflows and navigation remain. No medical/password-vault content or unrelated features were copied.

- Primary financial/hero cards now use each theme's established primary palette with contrast-checked text. Supporting cards remain neutral. Financial labels, amounts, supporting totals and actions have clearer spacing and numerical hierarchy.
- Cleaner system body typography, retained brand typography, less empty header space, consistent panel padding, aligned menu controls and restrained interaction effects.
- Corner Roundness replaces the four-preset UI with a native 0–100 range in steps of one. Existing presets migrate to intensities 25/40/55/75; defaults use 55. This migration does not turn the new slider into presets: every integer value has its own interpolation.
- Border Thickness uses 0–3px fractional inset edges. The old 0–1 dead zone and hairline/hidden-border mode switches are removed. Structural dimensions remain fixed while the visible inset edge changes.
- Both values update immediately through CSS variables, display their current numbers and persist using the existing appearance store. Moving a range does not rerender the application, rebuild the preview or recalculate theme colours.
- Source-level field cleanup removes dashed read-only/disabled edges, native appearance conflicts and the one-pixel clipped background gap around rounded inputs. Field hover, focus, typing and selection use solid clean edges with no masks, transforms or background images. Native checkboxes/radio/range controls retain their intended behavior.
- Sales Total's tinted parent wrapper is removed. The read-only calculated field keeps a consistent surface, a restrained accent edge and bold amount; no calculation changes.
- The existing cart priority selector now accounts for the cart panel being outside the entry card. Add to Cart is primary before the cart opens; Complete Sale is primary while it is open. Click handlers and cart logic are unchanged.
- Forty-five conflicting geometry priority flags and six stepped-border rules are retired. The bank-review panel, audit entries, day-action strip, credit form panels and status corners also follow the same mappings. A broad zero-roundness audit found no remaining rounded containers in the eight inspected views. The existing canonical component stylesheet and theme/settings structure are reused. No new runtime dependencies or duplicate appearance system.

## Precise mappings

| Control | Mapping |
| --- | --- |
| Corner Roundness | Small radius: `value × 0.16px`; medium: `value × 0.28px`; large cards: `value × 0.4px`; normal buttons: `value × 0.22px`; single-line fields: configured height × `value / 200` |
| Border Thickness | `value × 0.03px`, painted as an inset edge without changing layout dimensions |

CSS mappings retain fractional values without whole-pixel radius/border rounding. Controls use sensible different maximum radii; large cards do not become pill-shaped. Screen pixels and browser rasterization have finite precision, so this is continuous proportional CSS, not a claim that each 0.03px increment creates a separate whole screen pixel. Keyboard focus outlines remain independent of decorative border intensity. Labelled tertiary controls and purely decorative brand/indicator shapes keep their own appropriate treatment.

## Executed verification

| Check | Result |
| --- | --- |
| Existing regression suite | All 14 commands passed: 91 browser check groups plus static validation |
| Static scope | 11 JavaScript units and 51 CSS blocks parsed; 927 functions unchanged; only five audited appearance functions changed; no production test hooks |
| Precision | All 101 values ascending and descending for both sliders; stored values, displayed values, computed radii and rendered inset widths checked |
| Live controls | Native keyboard endpoints/one-step changes, actual mouse and emulated touch positions, backward movement, reload persistence and Reset Shape passed |
| Layout stability | Card, button and text rectangles unchanged at border levels 0, 1, 25, 50, 75 and 100 |
| Normal responsive matrix | 1,056 rendered cases: 11 views × 8 widths × 6 themes × 2 modes |
| Text contrast | 110,451 normal-matrix samples; zero below the chosen target |
| Extreme appearance matrix | 768 rendered cases at both controls 0 and both controls 100; four main views across every width/theme/mode |
| Additional dialogs | 192 default supplier-payment/Credit Account cases; 48 additional cases at maximum appearance values at 320/1440 |
| Field interaction states | 120 baseline/after combinations: six themes, both modes, resting/hover/focus/typing/selection; before/after field captures retained |
| Before/after sample | 60 matched full-view captures per version; 0 text-contrast failures in the after sample |
| Large bank value | ₦987,854,321.12 fits the tested widths, including maximum appearance at 320/1440 |
| Offline PWA | Actual 2.16.9 → 2.16.10 update and offline note persistence passed |
| Standalone preview | Single HTML saves/reloads notes and appearance values, accepts native keyboard input, makes zero external requests |
| Production console | Uninstrumented HTTP app, all desks, all theme choices, appearance changes and reload: zero console/page errors; service worker active |

Widths: **320, 375, 390, 425, 768, 1024, 1280, 1440**. Themes: **Cobalt Studio, Midnight & Ember, Pearl & Royal Blue, Cyan Flux, Coral Carbon, Mono Mint**, each in light and dark mode. All normal and extreme matrix cases passed their page-overflow and text-contrast checks. Default matrix also checked clipped control widths. Populated synthetic stock, transactions, supplier debt, long names, private account lists and large financial values were used. Appearance stress checks preserve the transaction, inventory and open-cart snapshots exactly.

The text target is 4.5:1 for ordinary text and 3:1 for large text; disabled text is held to the same practical target. Computed colours, alpha compositing and gradient endpoints are measured, with 0.02 numerical tolerance. Native closed details are excluded. Internal table scrolling is distinguished from page overflow. This targeted audit is not comprehensive WCAG certification; screen readers, native select-popup pixels and SVG/image pixel contrast were not comprehensively audited.

## Visual review and artifact findings

Actual rendered Cobalt/Pearl Financial cards, Ember Sales fields and appearance extremes were inspected, as were the clean field-edge crops. Additional screens and before/after pairs are retained in the visual report and full PNG evidence. Automated rendering covers the full matrices; it is not represented as separate manual inspection of every case.

The source audit confirmed dashed read-only/disabled borders, native input painting combined with clipped backgrounds, and the tinted Total wrapper. These style-level sources were removed directly. Before/after captures show clean final borders and no wrapper shade. The user's intermittent artifact on their own device was not separately captured here; no zigzag was observed in the tested final hover/focus/typing/selection states. Exact behavior on an untested browser/device cannot be guaranteed.

## Preservation and limits

Business calculations, inventory, credit privacy/history, supplier purchasing/debt, saved days, backups, sync and transaction handlers are retained and regression-tested. Appearance metadata gains one numeric roundness value and a version update; transaction/storage schemas are unchanged. Test fixtures and test hooks do not ship in the application.

No known failure remains in the executed checks. No requested source work is intentionally deferred. Physical Android/iOS devices, Safari/Firefox and assistive-technology sessions were not tested. Touch testing uses Chromium device emulation. Managed Chromium blocks file URLs, so the standalone HTML was verified over local HTTP; local-file storage remains browser dependent. Cloudflare deployment was not performed. The deployment ZIP contains the complete 13-file static app at its root, with no build step.
