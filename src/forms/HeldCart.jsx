import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { createEntryController } from './entry-controller.js';
import { EntryField, EntryAction, EntryError } from './EntryControls.jsx';

export const cartEntry = createEntryController({rootId:'holdPanel',actionIds:['editOpenCartBtn','cancelHoldBtn']});
export const CartPaymentField = props => <EntryField {...props} controller={cartEntry} desk="cart" />;
export const CartAction = props => <EntryAction {...props} controller={cartEntry} desk="cart" />;
export const CartError = () => <EntryError controller={cartEntry} />;
let snapshot = {items:[],live:null};
const listeners = new Set();
const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const getSnapshot = () => snapshot;
function publish(next) {
  flushSync(() => { snapshot=next; for(const fn of listeners)fn(); });
}
function patch(id,fields) {
  publish({...snapshot,items:snapshot.items.map(item=>item.id===id?{...item,...fields}:item)});
}
function update(id,field,value) {
  const item=snapshot.items.find(row=>row.id===id);
  if(!item)return;
  const draft={...item.draft,[field]:value};
  patch(id,{draft,error:''});
  const error=window.RoseachyCartCommands.update(id,draft);
  if(error)patch(id,{error});
}
export const heldCartView = {
  show(model,keepDrafts) {
    const previous=new Map(snapshot.items.map(row=>[row.id,row]));
    publish({...model,items:model.items.map(row=>({
      ...row, draft:keepDrafts&&previous.has(row.id)?previous.get(row.id).draft:{quantity:row.quantity,unit:row.unit},
      error:keepDrafts?previous.get(row.id)?.error||'':'',focusRequest:previous.get(row.id)?.focusRequest||0,
    }))});
  },
  validate() {
    for(const item of snapshot.items) {
      const error=window.RoseachyCartCommands.validate(item.id,item.draft);
      if(error) {patch(item.id,{error,focusRequest:item.focusRequest+1});return false;}
    }
    return true;
  },
};
function CartLine({item,index}) {
  const [open,setOpen]=useState(false);
  const qty=useRef(null);
  useEffect(()=>{
    if(!item.focusRequest)return;
    setOpen(true);
    const frame=requestAnimationFrame(()=>qty.current?.focus());
    return ()=>cancelAnimationFrame(frame);
  },[item.focusRequest]);
  return <div className="savedItem cartEditableRow">
    <details className="cartItemEditor" data-cart-item={index} open={open} onToggle={e=>setOpen(e.currentTarget.open)}>
      <summary><span>{item.name} <small data-item-quantity>× {item.quantity}</small></span><b data-item-total>{item.total}</b></summary>
      <div className="split">
        <label>Quantity<input ref={qty} spellCheck={false} id={`heldItemQty_${index}`} data-item-qty type="number" min={item.product?1:0} step="1"
          value={item.draft.quantity} readOnly={!item.product} aria-invalid={!!item.error} aria-describedby={`heldItemError_${index}`}
          onChange={e=>update(item.id,'quantity',e.target.value)} /></label>
        <label>Unit amount<input spellCheck={false} id={`heldItemPrice_${index}`} data-item-price type="number" min="0.01" step="0.01"
          value={item.draft.unit} readOnly={item.product} onChange={e=>update(item.id,'unit',e.target.value)} /></label>
      </div>
      {item.product&&<p className="help">Recorded selling price{item.quantityPricing?' · quantity discount recalculates automatically':''}</p>}
      <p id={`heldItemError_${index}`} className="help" data-item-error role="alert">{item.error}</p>
    </details>
    <button type="button" className="iconbtn del" data-hdel={index} aria-label={`Remove ${item.removeLabel} from cart`} title="Remove from cart"
      onClick={()=>window.RoseachyCartCommands.remove(item.id)}>×</button>
  </div>;
}
export function HeldCart() {
  const state=useSyncExternalStore(subscribe,getSnapshot);
  return <div id="holdList" style={{marginTop:4}}>
    {state.items.length?state.items.map((item,index)=><CartLine key={item.id} item={item} index={index}/>):<div className="empty">Your cart is empty — select a product and use Add to Cart.</div>}
    {state.live&&<div className="savedItem readonly"><span>{state.live.label}</span><span><b>{state.live.total}</b> <span className="small">not stored yet</span></span></div>}
  </div>;
}
