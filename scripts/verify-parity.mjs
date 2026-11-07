// Zero-dependency source integrity checks. Does not replace browser testing.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const tree = JSON.parse(readFileSync(join(root, 'src/components/legacy-tree.json')));
const scripts = JSON.parse(readFileSync(join(root, 'src/legacy-scripts.json')));
let elements = 0, ids = new Set(), duplicates = [], reactHandlers = 0;
function visit(node) {
  if (typeof node === 'string') return;
  elements++;
  const id = node.props?.id;
  if (id) { if (ids.has(id)) duplicates.push(id); ids.add(id); }
  if (Object.keys(node.props || {}).some(p => /^on[A-Z]/.test(p))) reactHandlers++;
  (node.children || []).forEach(visit);
}
tree.forEach(visit);
for (const src of scripts) {
  const path = join(root, 'public', src.replace(/^\//, ''));
  if (!existsSync(path)) throw Error(`Missing script: ${src}`);
}
if (duplicates.length) throw Error('Duplicate DOM IDs: ' + duplicates.join(', '));
if (elements < 1500 || ids.size < 750) throw Error('React DOM tree may be incomplete');
if (scripts.length !== 10) throw Error('Legacy boot order changed');
if (!ids.has('salesDesk') || !ids.has('marketDesk') || !ids.has('financialDesk') || !ids.has('settingsDesk')) throw Error('Missing core desk sections');
if (!ids.has('stockCostAll') || !ids.has('tabBtnStock')) throw Error('Missing key stock controls');
console.log(JSON.stringify({elements, ids:ids.size, scripts:scripts.length, unexpectedReactEventProps:reactHandlers, status:'Static structure verified'},null,2));
