import React, { useSyncExternalStore } from 'react';
import { createEntryController } from './entry-controller.js';
import { createViewState } from './view-state.mjs';
import { EntryField, EntryAction, EntryError } from './EntryControls.jsx';

const input=(id,props={})=>({tag:'input',props:{id,spellCheck:false,...props},children:[]});
const select=(id,options)=>({tag:'select',props:{id},children:options.map(([value,label])=>({tag:'option',props:{value},children:[label]}))});
const nodes=[
  input('supplierPaymentName',{maxLength:160,placeholder:'Supplier or business name'}),
  select('supplierPaymentClassification',[['advance','Supplier advance'],['prior','Prior obligation not recorded in Roseachy']]),
  input('supplierPaymentAmount',{type:'number',min:'0.01',step:'0.01',inputMode:'decimal',required:true}),
  input('supplierPaymentDate',{type:'date'}),
  select('supplierPaymentFunding',[['business','Business Balance'],['external','External Payment Source']]),
  select('supplierPaymentMethod',[['cash','Cash'],['bank','Transfer / bank']]),input('supplierPaymentNote',{maxLength:500}),
  {tag:'button',props:{id:'supplierPaymentSave',className:'primary',type:'button'},children:['Record Payment']},
  {tag:'button',props:{id:'supplierPaymentCancel',className:'ghost',type:'button'},children:['Cancel']},
  {tag:'button',props:{id:'supplierPaymentCancelTop',className:'iconClose',type:'button','aria-label':'Close supplier payment'},children:['×']},
];
const byId=new Map(nodes.map(node=>[node.props.id,node]));
export const supplierPaymentEntry=createEntryController({initialNodes:nodes,actionIds:['supplierPaymentSave','supplierPaymentCancel','supplierPaymentCancelTop']});
export const supplierPaymentView=createViewState({manual:false,title:'Pay Supplier Debt',summary:null,maximum:undefined,warning:''});
const Field=({id,presentation})=><EntryField node={byId.get(id)} controller={supplierPaymentEntry} desk="supplier-payment" presentation={presentation}/>;
const Action=({id})=><EntryAction node={byId.get(id)} controller={supplierPaymentEntry} desk="supplier-payment"/>;
export function SupplierPaymentDialog(){
  const state=useSyncExternalStore(supplierPaymentView.subscribe,supplierPaymentView.getSnapshot);
  const draft=useSyncExternalStore(supplierPaymentEntry.state.subscribe,supplierPaymentEntry.state.getSnapshot);
  const summary=state.summary;
  // Shared navigation still controls opening/closing this overlay.
  return <div id="supplierPaymentOverlay" className="marketOverlay hidden noPrint" role="dialog" aria-modal="true" aria-labelledby="supplierPaymentTitle">
    <div className="marketPanel supplierPayPanel">
      <div className="marketPanelTop"><div><h3 id="supplierPaymentTitle">{state.title}</h3><div className="subline">Payment is linked to the selected supplier purchase.</div></div><Action id="supplierPaymentCancelTop"/></div>
      <div id="supplierPaymentOwed" className="supplierPaySummary" aria-live="polite">{summary&&<>
        <strong>{summary.heading}</strong><p>{summary.description}</p>
        {summary.outstanding&&<><span className="supplierPayBalance">{summary.outstanding} outstanding</span><p>Purchased {summary.purchased} · Already paid {summary.paid}{summary.pending&&<> · {summary.pending} awaiting confirmation</>}</p></>}
      </>}</div>
      <div id="supplierPaymentManualWrap" className={state.manual?'':'hidden'}>
        <label htmlFor="supplierPaymentName">Supplier name (optional)</label><Field id="supplierPaymentName"/>
        <label htmlFor="supplierPaymentClassification">Payment for</label><Field id="supplierPaymentClassification"/>
      </div>
      <div className="marketForm supplierPayFields">
        <div><label htmlFor="supplierPaymentAmount">Amount to pay (₦)</label><Field id="supplierPaymentAmount" presentation={{max:state.maximum}}/></div>
        <div><label htmlFor="supplierPaymentDate">Payment date</label><Field id="supplierPaymentDate"/></div>
        <div><label htmlFor="supplierPaymentFunding">Payment source</label><Field id="supplierPaymentFunding"/></div>
        <div id="supplierPaymentMethodWrap" className={draft.fields.supplierPaymentFunding.value==='external'?'hidden':''}><label htmlFor="supplierPaymentMethod">Pay from</label><Field id="supplierPaymentMethod"/></div>
        <div className="wide"><label htmlFor="supplierPaymentNote">Note / reference (optional)</label><Field id="supplierPaymentNote"/></div>
      </div>
      <div className="marketWarn" id="supplierPaymentWarn" role="status" aria-live="polite">{state.warning}</div>
      <div className="footerActions supplierPayFooter"><Action id="supplierPaymentSave"/><Action id="supplierPaymentCancel"/></div>
      <EntryError controller={supplierPaymentEntry}/>
    </div>
  </div>;
}
