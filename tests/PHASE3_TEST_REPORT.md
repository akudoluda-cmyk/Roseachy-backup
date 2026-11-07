# Stage 3A — Verification report

**Date:** 2026-11-01  
**Outcome:** **Static and isolated-controller checks PASSED; React production acceptance NOT RUN.**

| Check | Outcome | Notes |
|---|---|---|
| JS syntax of modified legacy controller | PASS | `node --check` |
| JS syntax of filter controls and contract | PASS | `node --check` |
| Original interface parity | PASS | 2,281 structural elements, 812 distinct IDs, 10 original script paths |
| Phase 2 legacy table-model bridges | PASS | Static wiring, fallbacks and classification staging preserved |
| Phase 3A React filter event wiring | PASS | Static registration and fallback integrity checks |
| UI filter contract | PASS | Four independent Node test cases |
| Service worker version isolation | PASS | Stage 3A version string checked |
| In-browser controller startup | PASS | Chromium, reconstructed legacy DOM, inline script controllers, in-memory localStorage fallback |
| React filter adapter register | PASS | Sales and Stock search and sort actions registered before interaction |
| Search + reset filter | PASS | Controller rendered no-match state, reset restored empty search |
| Sales kind + reset filter | PASS | `pos` selection reset to `all` |
| Browser controller exceptions | PASS | No uncaught JS errors in this limited test |
| Real React 19 / Vite build | BLOCKED | npm registry unavailable (`EAI_AGAIN`) |
| Browser with actual React 19 | NOT RUN | No React 19 dependencies installed |
| IndexedDB v8 persistence | NOT RUN | Isolated browser origin cannot open IDB; mock storage used |
| Production sales/credit/refund/backup/offline | NOT RUN | Requires dedicated staging environment |

## Scope and interpretation

Stage 3A is intentionally smaller than the originally described full Stage 3. It only migrates **filter UI event ownership**, not financial state, stock mutations or business form submissions. The isolated controller test does **not** show that React rendered these controls, because a React 19 runtime was not available. Phase 2's mocked transaction tests remain previous baseline evidence, not fresh Phase 3A end-to-end confirmation.

## Release decision

**DO NOT DEPLOY TO THE LIVE STORE.** Run React 19 build and staging IndexedDB tests, then proceed to Stage 3B: componentize the Stock product form and Sales transaction form one workflow at a time, with rollback tests and no accounting-schema changes.
