# Roseachy Desk 2.16.10

Primary-colour financial cards, refined spacing and typography, clean field rendering, and live 0–100 Corner Roundness and Border Thickness controls. All six themes and existing business workflows retained.

- [Download Cloudflare Pages ZIP](https://github.com/akudoluda-cmyk/Roseachy-backup/raw/refs/heads/downloads-2.16.10/Roseachy-Desk-2.16.10-Cloudflare-Pages.zip) — complete 13-file static application; no build step.
- [Download standalone HTML preview](https://github.com/akudoluda-cmyk/Roseachy-backup/raw/refs/heads/downloads-2.16.10/Roseachy-Desk-2.16.10-Preview.html).
- [Download before/after visual report](https://github.com/akudoluda-cmyk/Roseachy-backup/raw/refs/heads/downloads-2.16.10/Roseachy-Desk-2.16.10-Visual-Report.html).
- [Download source, tests, reports and checkpoints](https://github.com/akudoluda-cmyk/Roseachy-backup/raw/refs/heads/downloads-2.16.10/Roseachy-Desk-2.16.10-Source-and-Reports.zip).
- [Verification and limitations](VERIFICATION.md), [checksums](SHA256SUMS.txt), [application source](https://github.com/akudoluda-cmyk/Roseachy-backup/tree/release-2.16.10).

Source commit: c7455db. Validation: 91 regression browser groups; 1056 responsive cases; 768 appearance-extreme cases; 240 additional dialog cases. Every slider value checked in both directions, including displayed/stored values, computed radii and inset widths. Keyboard, mouse, emulated touch and refresh persistence passed. Final matrix has no measured text-contrast, page-overflow or clipped-control failures. Production console check passed.

Download the HTML preview and open it. If your browser restricts local HTML storage, serve its directory with `python -m http.server 8000`. Single-file operation was verified over local HTTP with no external requests; managed Chromium blocked file URLs. Physical devices and Safari/Firefox were not tested. Cloudflare deployment was not performed.
