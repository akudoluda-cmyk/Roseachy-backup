import { roundMoney } from './inventory-math.mjs';

// Original 2.17.2 calculation bodies: captured sale pricing survives later stock edits.
function n(v){const x=parseFloat(v);return Number.isFinite(x)?x:0}
function clone(v){return JSON.parse(JSON.stringify(v))}

export function validQuantityPricing(p){return !!p&&!!p.quantityPricingEnabled&&Math.floor(n(p.quantityPricingQuantity))>=2&&n(p.quantityPricingPrice)>0}

export function salePricing(product,qty,ruleOverride=null){qty=Math.max(0,n(qty));const normal=n(ruleOverride?.sellingPrice??product?.price),rule=ruleOverride||product||{},enabled=!!rule.quantityPricingEnabled&&Math.floor(n(rule.quantityPricingQuantity))>=2&&n(rule.quantityPricingPrice)>0;if(!enabled||qty<Math.floor(n(rule.quantityPricingQuantity)))return{total:roundMoney(normal*qty),applied:false,bundleCount:0,remainingUnits:qty,unitSellingPrice:normal,quantityPricingQuantity:Math.floor(n(rule.quantityPricingQuantity))||0,quantityPricingPrice:n(rule.quantityPricingPrice)||0};const threshold=Math.floor(n(rule.quantityPricingQuantity)),bundle=n(rule.quantityPricingPrice),bundleCount=Math.floor(qty/threshold),remainingUnits=qty%threshold;return{total:roundMoney(bundleCount*bundle+remainingUnits*normal),applied:true,bundleCount,remainingUnits,unitSellingPrice:normal,quantityPricingQuantity:threshold,quantityPricingPrice:bundle}}

export function ruleFromSaleRecord(t,p){return{sellingPrice:n(t?.unitSellingPrice??t?.unitPrice??p?.price),quantityPricingEnabled:!!t?.quantityPricingEnabledAtSale,quantityPricingQuantity:Math.floor(n(t?.quantityPricingQuantity)),quantityPricingPrice:n(t?.quantityPricingPrice)}}

export function reviseCartItem(old,qty,unit){
 const q=Number(qty),price=Number(unit);
 if(!String(qty).trim()||!Number.isSafeInteger(q)||q<0||(old.productId&&q<1)||(!old.productId&&q!==n(old.qty)))throw Error('Enter a positive whole-unit quantity.');
 if(!String(unit).trim()||!Number.isFinite(price)||price<=0||price>1e12||Math.abs(price*100-Math.round(price*100))>1e-6)throw Error('Enter a positive unit amount with at most two decimal places.');
 if(old.productId&&price!==n(old.unitSellingPrice??old.unitPrice))throw Error('This product uses its recorded selling price.');
 if(q===n(old.qty)&&price===n(old.unitSellingPrice??old.unitPrice))return clone(old);
 const rule=ruleFromSaleRecord(old),pricing=old.productId?salePricing(null,q,rule):{total:roundMoney(price*(q||1)),applied:false};
 if(!(pricing.total>0)||pricing.total>1e12)throw Error('The revised item total is invalid or too large.');
 return {...old,qty:q,totalUnits:q,looseUnitsEntered:q,packSelected:false,packsEntered:0,unitPrice:price,unitSellingPrice:price,amount:pricing.total,actualSaleTotal:pricing.total,quantityPricingApplied:!!pricing.applied};
}
