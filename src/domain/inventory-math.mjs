/** Extracted unchanged from original 2.17.2; preserve its parsing/rounding semantics. */
function n(v){const x=parseFloat(v);return Number.isFinite(x)?x:0}
export function clampMarkup(v){const x=Number(v);return Number.isFinite(x)?Math.min(500,Math.max(0,x)):0}
export function roundMoney(v){return Math.round((n(v)+Number.EPSILON)*100)/100}
export function priceFromMarkup(cost,markup){cost=Math.max(0,n(cost));return roundMoney(cost*(1+clampMarkup(markup)/100))}
export function impliedMarkup(cost,sell){cost=n(cost);sell=n(sell);return cost>0?Math.max(0,roundMoney((sell-cost)/cost*100)):0}
export function inventoryWhole(value,label,allowZero=true){const x=Number(value);if(String(value).trim()===''||!Number.isSafeInteger(x)||x<0||x>1e12||(!allowZero&&x===0))throw Error(label+' must be a '+(allowZero?'nonnegative':'positive')+' whole number (maximum 1 trillion).');return x;}
export function inventoryMoney(value,label){const x=Number(value);if(String(value).trim()===''||!Number.isFinite(x)||x<0||x>1e12)throw Error(label+' must be a valid nonnegative amount.');return x;}
