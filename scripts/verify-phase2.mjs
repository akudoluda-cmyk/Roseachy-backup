import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const core=read('public/legacy/03-core.js'),bridge=read('src/BridgeApp.jsx'),island=read('src/islands/SalesStockTables.js');
const stock=read('src/tables/StockInventoryRows.jsx'),ledger=read('src/tables/SalesLedgerRows.jsx');
const checks={
 'ledger data model dispatch':core.includes('RoseachyReactTables.ledger(rows)'),
 'stock data model dispatch':core.includes('RoseachyReactTables.stock(rows)'),
 'stock group data models':core.includes("kind:'group'")&&core.includes('publishReactStock(arr)'),
 'React explicit table components':island.includes('StockInventoryRows')&&island.includes('SalesLedgerRows'),
 'React row actions':stock.includes("'stockEdit'")&&ledger.includes("'ledgerEdit'"),
 'no table HTML injection':![stock,ledger,island].some(s=>s.includes('dangerouslySetInnerHTML')||s.includes('.innerHTML')),
 'React registration precedes scripts':bridge.indexOf('window.RoseachyReactTables =')<bridge.indexOf('for (const src of scripts)'),
 'service worker cache version':read('public/sw.js').includes('react-phase3b.6')
};
console.log(JSON.stringify(checks,null,2));
if(Object.values(checks).some(v=>!v))process.exit(1);
