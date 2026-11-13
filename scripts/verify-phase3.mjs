import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const core = read('public/legacy/03-core.js');
const react = read('src/islands/ReactFilterControls.js');
const contract = read('src/islands/filter-contract.mjs');
const tree = read('src/components/LegacySurface.jsx');
const bridge = read('src/BridgeApp.jsx');
const sw = read('public/sw.js');
const p = JSON.parse(read('package.json'));
const checks = {
  'React-owned Sales/Stock filter ID contract': contract.includes('txKindFilter') && contract.includes('stockExpiringOnly'),
  'React has direct filter input handlers': react.includes("props.onInput = onUpdate") && react.includes('props.onChange = onUpdate'),
  'React has stock/sales reset action': react.includes("window.RoseachyClearFilters?.(desk)"),
  'Filter inputs retain legacy restore compatibility': !/props\.(?:value|checked)\s*=/.test(react),
  'React renders filter controls in original DOM hierarchy': tree.includes('if (FILTER_IDS.has(node.props?.id))'),
  'React registers filter bridge before classic scripts': bridge.indexOf('window.RoseachyReactFilters =') < bridge.indexOf('for (const src of scripts)'),
  'Native legacy filter listeners remain as fallback': core.includes("if(!window.RoseachyReactFilters?.register)$('txDivFilter').addEventListener('change',render)"),
  'Sales adapter registers before controller fallback': core.includes('register(roseachySalesFilterHandlers)'),
  'Stock adapter registers before controller fallback': core.includes('register(roseachyStockFilterHandlers)'),
  'Reset does not call inventory commit': !core.slice(core.indexOf('window.RoseachyClearFilters=function'), core.indexOf("$('stockTable').addEventListener('click',e=>",core.indexOf('window.RoseachyClearFilters=function'))).includes('inventoryCommit'),
  'PWA version separates Phase 3 caches': sw.includes('react-phase3b.5'),
  'Package version and verification match Phase 3': p.version.endsWith('react-phase3b.5') && !!p.scripts['verify:phase3'],
  'IndexedDB module preserved': read('public/legacy/01-storage.js').includes('indexedDB'),
};
console.log(JSON.stringify(checks, null, 2));
assert(Object.values(checks).every(Boolean), 'Phase 3 verification failed');
