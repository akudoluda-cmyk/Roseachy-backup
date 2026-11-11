import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {normalizedDayRecord} from '../src/domain/day-records.mjs';
const original=execFileSync('python3',['-c',"import zipfile;print(zipfile.ZipFile('reference/original-2.17.2.zip').read('index.html').decode())"],{maxBuffer:5e6,encoding:'utf8'});
const start=original.indexOf('function normalizedDayRecord('),end=original.indexOf('\nasync function persistBusinessDay',start);
const ref=vm.createContext({});vm.runInContext(original.split('\n').find(l=>l.startsWith('function businessKey('))+'\n'+original.slice(start,end),ref);
function outcome(fn,record,records){
 const input=structuredClone(record),history=structuredClone(records);
 try{return JSON.parse(JSON.stringify({result:fn(input,history),input,history}));}
 catch(e){return {error:e.message,input,history};}
}
test('saved-day identity/update guard matches original across incomplete and legacy records',()=>{
 const txs=[[],[{id:'one'}],[{id:'two'}],[{id:'one'},{id:'two'}],[{id:'one'},{id:'one'}],[{amount:1}]];
 for(const archived of [false,true])for(const business of [' Shop ','SHOP','Other'])for(const date of ['2026-11-09','2026-11-10'])for(const old of txs)for(const tx of txs){
  const record={id:'new',business,date,tx,archived:false},records=[{id:'saved',business:'shop',date:'2026-11-09',tx:old,archived}];
  assert.deepEqual(outcome(normalizedDayRecord,record,records),outcome(ref.normalizedDayRecord,record,records));
 }
});
test('updates retain archive identity and reject missing or duplicate committed transactions',()=>{
 const previous={id:'saved',business:'Shop',date:'2026-11-09',archived:true,tx:[{id:'payment',amount:20}]};
 const next={id:'new',business:' SHOP ',date:previous.date,tx:[{id:'payment',amount:30},{id:'sale',amount:100}],archived:false};
 assert.equal(normalizedDayRecord(next,[previous]).existing,previous);assert.equal(next.id,'saved');assert.equal(next.archived,true);assert.equal(previous.tx[0].amount,20);
 assert.throws(()=>normalizedDayRecord({...next,tx:[]},[previous]),/missing 1 previously saved/);
 assert.throws(()=>normalizedDayRecord({...next,tx:[{id:'payment'},{id:'payment'}]},[previous]),/missing or duplicate/);
});
