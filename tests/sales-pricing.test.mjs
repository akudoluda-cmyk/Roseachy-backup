import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import * as actual from '../src/domain/sales-pricing.mjs';
const original=execFileSync('python3',['-c',"import zipfile; print(zipfile.ZipFile('reference/original-2.17.2.zip').read('index.html').decode())"],{maxBuffer:5e6,encoding:'utf8'});
const names=['n','clone','roundMoney','validQuantityPricing','salePricing','ruleFromSaleRecord'];
const source=names.map(name=>original.match(new RegExp('^function '+name+'\\(.*$','m'))[0]).join('\n');
const start=original.indexOf('function reviseCartItem('),end=original.indexOf('\nfunction cartItemEditor(',start);
const reference=vm.createContext({});vm.runInContext(source+'\n'+original.slice(start,end),reference);
function result(fn,args){try{return JSON.parse(JSON.stringify({value:fn(...args)}))}catch(e){return {error:e.message}}}
test('quantity pricing and historical rules match the original across boundaries',()=>{
 const products=[null,{}, {price:300}, {price:300,quantityPricingEnabled:true,quantityPricingQuantity:3,quantityPricingPrice:800}, {price:0.01,quantityPricingEnabled:true,quantityPricingQuantity:2,quantityPricingPrice:0.01}, {price:300,quantityPricingEnabled:true,quantityPricingQuantity:1,quantityPricingPrice:100}];
 const quantities=['',0,1,2,3,4,6,7,1.5,-1,1e12,Infinity,'2abc'];
 const rules=[null,{sellingPrice:250,quantityPricingEnabled:false},{sellingPrice:300,quantityPricingEnabled:true,quantityPricingQuantity:3,quantityPricingPrice:700}];
 for(const p of products){
  assert.deepEqual(result(actual.validQuantityPricing,[p]),result(reference.validQuantityPricing,[p]));
  for(const qty of quantities)for(const rule of rules)assert.deepEqual(result(actual.salePricing,[p,qty,rule]),result(reference.salePricing,[p,qty,rule]));
 }
 const records=[{}, {unitPrice:200}, {unitSellingPrice:300,quantityPricingEnabledAtSale:true,quantityPricingQuantity:3,quantityPricingPrice:800}];
 for(const r of records)for(const p of products)assert.deepEqual(result(actual.ruleFromSaleRecord,[r,p]),result(reference.ruleFromSaleRecord,[r,p]));
});
test('cart corrections preserve captured pricing, identity, metadata and validation',()=>{
 const rows=[{id:'cart-1',productId:'p',qty:2,unitPrice:300,amount:600,note:'Captured product'}, {id:'cart-2',productId:'p',qty:3,unitSellingPrice:300,amount:800,quantityPricingEnabledAtSale:true,quantityPricingQuantity:3,quantityPricingPrice:800}, {id:'cart-3',qty:0,unitPrice:100,amount:100,note:'Unlinked line'}];
 const values=['',0,1,2,3,4,7,300,100,1.5,-1,'2abc',Infinity,1e12+1];
 for(const row of rows)for(const qty of values)for(const unit of values)assert.deepEqual(result(actual.reviseCartItem,[row,qty,unit]),result(reference.reviseCartItem,[row,qty,unit]));
 const revised=actual.reviseCartItem(rows[1],4,300);assert.equal(revised.amount,1100);assert.equal(revised.id,'cart-2');assert.equal(rows[1].amount,800);
 assert.throws(()=>actual.reviseCartItem(rows[1],4,350),/recorded selling price/);
});
