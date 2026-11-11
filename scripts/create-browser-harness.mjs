// Test-only browser fixture: real DOM + Phase 3 classic controllers, no React/Vite.
// Isolates data workflows and adapter registration; does NOT validate React runtime.
import { readFileSync, writeFileSync } from 'node:fs';
const nodes=JSON.parse(readFileSync(new URL('../src/components/legacy-tree.json',import.meta.url),'utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const voids=new Set(['input','img','link','meta','br','hr','source','area','base','col','embed','param','track','wbr']);
const booleanAttrs=new Set(['disabled','checked','selected','required','multiple','autofocus','autoplay','controls','loop','muted','hidden','readonly','open','novalidate','download']);
const attrName={className:'class',htmlFor:'for',tabIndex:'tabindex',autoComplete:'autocomplete',autoFocus:'autofocus',readOnly:'readonly',spellCheck:'spellcheck'};
function serialize(node){if(typeof node==='string')return escape(node);if(!node||!node.tag)return'';
 const attrs=Object.entries(node.props||{}).flatMap(([k,v])=>{
  if(k==='children'||k==='key'||k==='ref'||k.startsWith('on')||v==null||v===false)return [];
  k=attrName[k]||k;
  if(booleanAttrs.has(k.toLowerCase()))return v?[k]:[];
  if(k==='style'&&typeof v==='object')v=Object.entries(v).map(([a,b])=>a.replace(/[A-Z]/g,x=>'-'+x.toLowerCase())+':'+b).join(';');
  return [`${k}="${escape(v)}"`];
 }).join(' ');
 const open=`<${node.tag}${attrs?' '+attrs:''}>`;
 return voids.has(node.tag)?open:open+(node.children||[]).map(serialize).join('')+`</${node.tag}>`;
}
const body=nodes.map(serialize).join('');
const math=readFileSync(new URL('../src/domain/inventory-math.mjs',import.meta.url),'utf8').replaceAll('export function','function');
const mathBridge=`(()=>{${math};window.RoseachyInventoryMath={clampMarkup,roundMoney,priceFromMarkup,impliedMarkup,inventoryWhole,inventoryMoney};})();`;
const pricing=readFileSync(new URL('../src/domain/sales-pricing.mjs',import.meta.url),'utf8').replace(/import[^;]+;/,'const {roundMoney}=window.RoseachyInventoryMath;').replaceAll('export function','function');
const pricingBridge=`(()=>{${pricing};window.RoseachySalesPricing={validQuantityPricing,salePricing,ruleFromSaleRecord,reviseCartItem};})();`;
const pos=readFileSync(new URL('../src/domain/pos-math.mjs',import.meta.url),'utf8').replaceAll('export ','');
const posBridge=`(()=>{${pos};window.RoseachyPosMath={POS_FORM,posComponents,posBuild,posMovements,posValidate};})();`;
const day=readFileSync(new URL('../src/domain/day-records.mjs',import.meta.url),'utf8').replaceAll('export ','');
const dayBridge=`(()=>{${day};window.RoseachyDayRecords={normalizedDayRecord};})();`;
const bridge=`window.RoseachyReactFilters=(()=>{const handlers=Object.create(null);return{register(next){Object.assign(handlers,next)},dispatch(id){if(!Object.hasOwn(handlers,id))return false;handlers[id]();return true},ready(id){return Object.hasOwn(handlers,id)},sync(desk){window.dispatchEvent(new CustomEvent('roseachy:filter-sync',{detail:{desk}}))}}})();`;
const scripts=JSON.parse(readFileSync(new URL('../src/legacy-scripts.json',import.meta.url),'utf8')).filter(path=>path.includes('/legacy/'));
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/legacy.css"><title>Test only - Roseachy Controller</title></head><body spellcheck="false"><script>${mathBridge}${pricingBridge}${posBridge}${dayBridge}${bridge}</script>${body}${scripts.map(s=>`<script src="${s}"></script>`).join('')}</body></html>`;
const dest=new URL('../__phase3_browser_harness.html',import.meta.url);
writeFileSync(dest,html);
console.log(`Created ${dest.pathname}: ${body.length} HTML bytes; ${scripts.length} controllers`);
