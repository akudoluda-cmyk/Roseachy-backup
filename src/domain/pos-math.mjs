// Calculation/validation bodies preserved from original 2.17.2.
function n(v){const x=parseFloat(v);return Number.isFinite(x)?x:0}
const r2=x=>Math.round(n(x)*100)/100;

export const POS_FORM={pos_withdrawal:{a:'Cash amount',b:null,via:'elec',help:'Customer receives cash; payment comes in electronically.'},pos_transfer:{a:'Transfer amount',b:null,via:'cash',help:'Customer gives cash; send the amount electronically to another account.'},pos_deposit:{a:'Deposit amount',b:null,via:'cash',help:'Customer gives cash; credit or send it into the customer’s own account or wallet.'},pos_collection:{a:'Amount received',b:null,via:'elec',help:'Legacy transaction type.'},pos_collect_transfer:{a:'Amount received',b:'Amount sent',via:'elec',help:'Legacy transaction type.'},pos_collect_withdraw:{a:'Amount received',b:'Cash paid out',via:'elec',help:'Legacy transaction type.'}};

export function posComponents(t){const p=t.pos||{};return{cashIn:n(p.cashIn),cashOut:n(p.cashOut),elecIn:n(p.elecIn),elecOut:n(p.elecOut),fee:n(p.fee),feeVia:p.feeVia==='cash'?'cash':'elec'}}

export function posBuild(type,A,B,fee,feeVia){A=r2(Math.max(0,n(A)));B=r2(Math.max(0,n(B)));fee=r2(Math.max(0,n(fee)));const c={cashIn:0,cashOut:0,elecIn:0,elecOut:0,fee,feeVia:feeVia==='cash'?'cash':'elec',principal:A};
 if(type==='pos_withdrawal'){c.cashOut=A;c.elecIn=A}else if(type==='pos_transfer'||type==='pos_deposit'){c.cashIn=A;c.elecOut=A}else if(type==='pos_collection'){c.elecIn=A}else if(type==='pos_collect_transfer'){c.elecIn=A;c.elecOut=B}else if(type==='pos_collect_withdraw'){c.elecIn=A;c.cashOut=B}
 if(fee>0){if(c.feeVia==='cash')c.cashIn=r2(c.cashIn+fee);else c.elecIn=r2(c.elecIn+fee)}return c}

export function posMovements(t){const c=posComponents(t),o=[];const add=(k,d,a,l)=>{if(a>.004)o.push({id:t.id+'#'+k+'-'+d,parentId:t.id,kind:k,dir:d,amount:a,label:l})};add('cash','in',c.cashIn,'Cash received');add('cash','out',c.cashOut,'Cash paid out');add('electronic','in',c.elecIn,'Card/transfer received');add('electronic','out',c.elecOut,'Transfer sent');return o}

export function posValidate(d){const values=[d.A,d.B,d.fee,...Object.values(d.comp).filter(v=>typeof v==='number')];if(values.some(v=>!Number.isFinite(v)||v<0||v>1e12||!Number.isSafeInteger(Math.round(v*100))))return'Enter valid nonnegative amounts, up to 1 trillion, including fees.';if(!(d.A>0))return'Enter an amount greater than zero.';const f=POS_FORM[d.ty];if(!f)return'Choose a supported POS transaction.';if(f.b&&!(d.B>0))return'Enter '+f.b.toLowerCase()+'.';if((d.ty==='pos_collect_transfer'||d.ty==='pos_collect_withdraw')&&d.B>d.A+.004)return f.b+' cannot exceed the amount received.';return''}
