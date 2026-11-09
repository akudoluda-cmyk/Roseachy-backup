import test from 'node:test';
import assert from 'node:assert/strict';
import { createFormState } from '../src/forms/form-state.mjs';
test('draft snapshots are immutable and preserve unrelated values',()=>{
 const store=createFormState({name:{value:''},qty:{value:'12'}}), before=store.getSnapshot();
 let updates=0;const unsubscribe=store.subscribe(()=>updates++);
 store.patch('name',{value:'Soap'});assert.equal(before.fields.name.value,'');
 assert.equal(store.getSnapshot().fields.qty.value,'12');assert.equal(updates,1);
 store.patch('name',{value:'Soap'});assert.equal(updates,1);unsubscribe();
 assert.throws(()=>store.patch('unknown',{value:'x'}),/Unknown form field/);
});
test('pending command rejects duplicate submission and permits a later command',async()=>{
 const store=createFormState({name:{value:'Soap'}});let finish,count=0;
 const first=store.command('save',()=>{count++;return new Promise(r=>finish=r)});
 assert.equal(store.getSnapshot().pending.save,true);
 assert.equal(await store.command('save',()=>{count++;}),false);
 finish('saved');assert.equal(await first,'saved');assert.equal(count,1);
 await store.command('save',()=>{count++;});assert.equal(count,2);
});
test('failed commands preserve draft and release pending state',async()=>{
 const store=createFormState({qty:{value:'12'}});
 await assert.rejects(store.command('save',()=>{throw Error('Storage full')}),/Storage full/);
 assert.equal(store.getSnapshot().fields.qty.value,'12');
 assert.equal(store.getSnapshot().pending.save,false);
 assert.equal(store.getSnapshot().error,'Storage full');
 await store.command('save',()=>true);assert.equal(store.getSnapshot().error,'');
});
