import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import * as actual from '../src/domain/pos-math.mjs';
const original=execFileSync('python3',['-c',"import zipfile; print(zipfile.ZipFile('reference/original-2.17.2.zip').read('index.html').decode())"],{maxBuffer:5e6,encoding:'utf8'});
const lines=original.split('\n');
const source=[lines.find(x=>x.startsWith('function n(')),lines.find(x=>x.startsWith('const r2=')),lines.find(x=>x.startsWith('const POS_FORM='))];
for(const name of ['posComponents','posBuild','posMovements','posValidate']){
 const start=original.indexOf('function '+name+'('),end=name==='posBuild'?original.indexOf('\n/* movements',start):original.indexOf('\n',start);
 source.push(original.slice(start,end));
}
const ref=vm.createContext({});vm.runInContext(source.join('\n')+'\nglobalThis.forms=POS_FORM;',ref);
const normalized=value=>JSON.parse(JSON.stringify(value));
test('all six POS types preserve original charges, component movements and validation',()=>{
 assert.deepEqual(normalized(actual.POS_FORM),normalized(ref.forms));
 const amounts=[NaN,-1,0,0.01,1.005,100,1e12,1e12+1,Infinity],secondary=[0,50,200],fees=[0,0.01,5,1e12],methods=['cash','elec','unknown'];
 for(const ty of Object.keys(actual.POS_FORM))for(const A of amounts)for(const B of secondary)for(const fee of fees)for(const via of methods){
  const c=actual.posBuild(ty,A,B,fee,via),expected=ref.posBuild(ty,A,B,fee,via);
  assert.deepEqual(normalized(c),normalized(expected));
  assert.equal(actual.posValidate({ty,A,B,fee,comp:c}),ref.posValidate({ty,A,B,fee,comp:expected}));
  const row={id:'test',type:ty,pos:c};assert.deepEqual(normalized(actual.posComponents(row)),normalized(ref.posComponents(row)));
  assert.deepEqual(normalized(actual.posMovements(row)),normalized(ref.posMovements(row)));
 }
});
test('withdrawal and transfer separate principal from charge income',()=>{
 assert.deepEqual(actual.posBuild('pos_withdrawal',200,0,10,'elec'),{cashIn:0,cashOut:200,elecIn:210,elecOut:0,fee:10,feeVia:'elec',principal:200});
 assert.deepEqual(actual.posBuild('pos_transfer',100,0,5,'cash'),{cashIn:105,cashOut:0,elecIn:0,elecOut:100,fee:5,feeVia:'cash',principal:100});
 assert.match(actual.posValidate({ty:'pos_collect_transfer',A:100,B:101,fee:0,comp:actual.posBuild('pos_collect_transfer',100,101,0,'elec')}),/cannot exceed/);
});
