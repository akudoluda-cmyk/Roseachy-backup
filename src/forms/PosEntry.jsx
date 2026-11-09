import React, { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { createEntryController } from './entry-controller.js';
import { createViewState } from './view-state.mjs';
import { EntryField, EntryAction, EntryError } from './EntryControls.jsx';
import { POS_FORM } from '../domain/pos-math.mjs';

const input=(id,props={})=>({tag:'input',props:{id,spellCheck:false,...props},children:[]});
const select=(id,options)=>({tag:'select',props:{id},children:options.map(([value,label])=>({tag:'option',props:{value},children:[label]}))});
const amount=id=>input(id,{type:'number',min:'0',step:'0.01',placeholder:'0.00'});
const nodes=[
  select('posType',[['pos_withdrawal','Cash withdrawal'],['pos_transfer','Transfer'],['pos_deposit','Deposit / Cash-In']]),
  amount('posA'),amount('posB'),amount('posFee'),input('posRef',{placeholder:'Txn / RRN no.',autoComplete:'off'}),
  input('posParty',{placeholder:'Optional'}),select('posChannel',[['','—'],...['POS terminal','Bank transfer','Mobile wallet','Other'].map(x=>[x,x])]),
  {tag:'button',props:{id:'posAddBtn',className:'primary'},children:['Add']},
  {tag:'button',props:{id:'posCancelEditBtn',className:'ghost'},children:['Cancel']},
];
const byId=new Map(nodes.map(node=>[node.props.id,node]));
export const posEntry=createEntryController({initialNodes:nodes,actionIds:['posAddBtn','posCancelEditBtn']});
const view=createViewState({active:false,editing:false,feeVia:'elec',feeVisible:false,balance:null,effect:'',bad:false,warning:'',shortage:null});
export const posView={...view,
  ensureOption(value,label){
    const field=posEntry.state.getSnapshot().fields.posType;
    if(!field.options.some(o=>o.value===value))flushSync(()=>posEntry.state.patch('posType',{options:[...field.options,{value,label:'Legacy · '+label,legacy:true}]}));
  },
  resetLegacyOption(){
    const field=posEntry.state.getSnapshot().fields.posType,legacy=field.options.find(o=>o.legacy);
    if(legacy)flushSync(()=>posEntry.state.patch('posType',{value:'pos_withdrawal',options:field.options.filter(o=>o!==legacy)}));
  },
};
const Field=({id})=><EntryField node={byId.get(id)} controller={posEntry} desk="pos"/>;
export function PosEntry(){
  const state=useSyncExternalStore(view.subscribe,view.getSnapshot);
  const draft=useSyncExternalStore(posEntry.state.subscribe,posEntry.state.getSnapshot);
  const form=POS_FORM[draft.fields.posType.value]||POS_FORM.pos_withdrawal;
  return <div id="posEntry" className={state.active?'':'hidden'}>
    <div className="posBal" id="posBal">{state.balance&&<>POS cash <b>{state.balance.cash}</b> · Electronic <b>{state.balance.electronic}</b> · Retail cash {state.balance.retail}</>}</div>
    <div className="posGrid">
      <div style={{gridColumn:'1/-1'}}><label htmlFor="posType">Transaction</label><Field id="posType"/><div className="help" id="posTypeHelp">{form.help}</div></div>
      <div><label id="posLblA" htmlFor="posA">{form.a}</label><Field id="posA"/></div>
      <div id="posBWrap" className={form.b?'':'hidden'}><label id="posLblB" htmlFor="posB">{form.b||'Amount sent'}</label><Field id="posB"/></div>
      <div><label htmlFor="posFee">Service charge</label><Field id="posFee"/></div>
      <div><label htmlFor="posRef">Reference (optional)</label><Field id="posRef"/></div>
    </div>
    <div className={`feeVia${state.feeVisible?'':' hidden'}`} id="posFeeVia"><span>Charge paid by</span><div className="seg small" id="posFeeViaSeg" role="group" aria-label="Charge paid by">
      {[['elec','Card / transfer'],['cash','Cash']].map(([via,label])=><button key={via} type="button" data-via={via} className={state.feeVia===via?'active':''} aria-pressed={state.feeVia===via} onClick={()=>window.RoseachyPosCommands.feeVia(via)}>{label}</button>)}
    </div></div>
    <div className={`posEffect${state.bad?' bad':''}`} id="posEffect" aria-live="polite">{state.effect}</div>
    <details className="posMore"><summary>Customer &amp; channel</summary><div className="posMoreGrid">
      <div><label htmlFor="posParty">Customer / note</label><Field id="posParty"/></div>
      <div><label htmlFor="posChannel">Channel</label><Field id="posChannel"/></div>
    </div></details>
    <div className={`posShort${state.shortage?'':' hidden'}`} id="posShort" role="alert">{state.shortage&&<>
      <strong>Insufficient POS cash</strong><div className="amts">Available: {state.shortage.available}<br/>Required: {state.shortage.required}</div>
      <div className="bulkBtns"><button type="button" className="primary" id="posShortFund" data-sf={state.shortage.shortfall} onClick={()=>window.RoseachyPosCommands.fund(state.shortage.shortfall)}>Move cash from Retail</button><button type="button" className="ghost" id="posShortCancel" onClick={()=>window.RoseachyPosCommands.hideShort()}>Cancel</button></div>
    </>}</div>
    <div className="footerActions" style={{marginTop:16}}><EntryAction node={byId.get('posAddBtn')} controller={posEntry} desk="pos"/>
      <EntryAction node={{...byId.get('posCancelEditBtn'),props:{...byId.get('posCancelEditBtn').props,className:`ghost${state.editing?'':' hidden'}`}}} controller={posEntry} desk="pos"/>
    </div>
    <div className="warnText" id="posWarn" role="alert">{state.warning}</div><EntryError controller={posEntry}/>
  </div>;
}
