import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import * as migrated from '../src/domain/inventory-math.mjs';
// Compare against the actual immutable original, not a copy of our implementation.
const original = execFileSync('python3',['-c',"import zipfile; print(zipfile.ZipFile('reference/original-2.17.2.zip').read('index.html').decode())"],{maxBuffer:5e6,encoding:'utf8'});
const names=['n',...Object.keys(migrated)];
const source=names.map(n=>original.match(new RegExp('^function '+n+'\\(.*$', 'm'))[0]).join('\n');
const reference=vm.createContext({});vm.runInContext(source,reference);
function outcome(fn,args){try{return {value:fn(...args)}}catch(e){return {error:e.message}}}
test('pricing, rounding and validation preserve original outcomes across boundaries',()=>{
 const values=['',null,undefined,'12abc',NaN,Infinity,-1,-0.005,0,0.005,1.005,2,200,300,500,1e12,1e12+1];
 for(const [name,fn] of Object.entries(migrated)){
  for(const x of values)for(const y of values){
   const args=name==='inventoryWhole'?[x,'Quantity',y!==0]:name==='inventoryMoney'?[x,'Cost']:[x,y];
   assert.deepEqual(outcome(fn,args),outcome(reference[name],args),`${name} ${args}`);
  }
 }
});
test('mandatory fixture arithmetic and invalid inventory rules',()=>{
 assert.equal(migrated.priceFromMarkup(200,50),300);
 assert.equal(migrated.roundMoney(300*2),600);
 assert.equal(migrated.impliedMarkup(200,300),50);
 assert.throws(()=>migrated.inventoryWhole(1.5,'Quantity'),/whole number/);
 assert.throws(()=>migrated.inventoryMoney(-1,'Cost'),/nonnegative/);
});
