import { readFileSync } from 'node:fs';
const core=readFileSync(new URL('../public/legacy/03-core.js',import.meta.url),'utf8');
const bridge=readFileSync(new URL('../src/BridgeApp.jsx',import.meta.url),'utf8');
const island=readFileSync(new URL('../src/islands/SalesStockTables.js',import.meta.url),'utf8');
const checks={
  'ledger bridge dispatch':core.includes('RoseachyReactTables.ledger(roseachyTableRowModels(frag))'),
  'stock bridge dispatch':core.includes('RoseachyReactTables.stock(roseachyTableRowModels(stockFrag))'),
  'stock classification staging':core.includes('classificationStockGroups(arr,stockFrag)'),
  'legacy fallback available':core.includes('if(!reactStock){b.appendChild(stockFrag);classificationStockGroups(arr)}'),
  'React portal mounts':island.includes('createPortal(tables.stock.map')&&island.includes('createPortal(tables.ledger.map'),
  'React registration precedes scripts':bridge.indexOf('window.RoseachyReactTables =')<bridge.indexOf('for (const src of scripts)'),
  'service worker cache bumped':readFileSync(new URL('../public/sw.js',import.meta.url),'utf8').includes('react-phase3a')
};
console.log(JSON.stringify(checks,null,2));
if(Object.values(checks).some(v=>!v))process.exit(1);
