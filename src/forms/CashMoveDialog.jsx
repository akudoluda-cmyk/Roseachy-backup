import React, { useSyncExternalStore } from 'react';
import { createEntryController } from './entry-controller.js';
import { createViewState } from './view-state.mjs';
import { EntryField, EntryAction, EntryError } from './EntryControls.jsx';

const nodes=[
  {tag:'select',props:{id:'xferDir'},children:[
    ['r2p','Retail cash → POS cash'],['ts2p','Today’s sales cash → POS cash'],['p2r','POS cash → Retail cash'],
    ['padd','Add cash to POS (from outside)'],['prem','Take cash out of POS'],
  ].map(([value,label])=>({tag:'option',props:{value},children:[label]}))},
  {tag:'input',props:{id:'xferAmt',spellCheck:false,type:'number',min:'0',step:'0.01',placeholder:'0.00'},children:[]},
  {tag:'input',props:{id:'xferNote',spellCheck:false,placeholder:'e.g. float top-up'},children:[]},
  {tag:'button',props:{id:'xferOk',className:'primary',type:'button'},children:['Move cash']},
  {tag:'button',props:{id:'xferCancel',className:'ghost',type:'button'},children:['Cancel']},
];
const byId=new Map(nodes.map(node=>[node.props.id,node]));
export const cashMoveEntry=createEntryController({initialNodes:nodes,actionIds:['xferOk','xferCancel']});
export const cashMoveView=createViewState({balance:'',noteLabel:'Note (optional)',error:''});
const Field=({id})=><EntryField node={byId.get(id)} controller={cashMoveEntry} desk="cash-move"/>;
function containTab(event){
  if(event.key!=='Tab')return;
  const controls=[...event.currentTarget.querySelectorAll('button,input,select')].filter(el=>!el.disabled&&el.getClientRects().length);
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
}
export function CashMoveDialog(){
  const state=useSyncExternalStore(cashMoveView.subscribe,cashMoveView.getSnapshot);
  // Navigation owns overlay visibility/history until its migration; React owns
  // all content, draft values and actions inside the overlay.
  return <div id="xferOverlay" className="dupOverlay hidden noPrint" role="dialog" aria-modal="true" aria-labelledby="xferTitle" onKeyDown={containTab}>
    <div className="dupModal"><h3 id="xferTitle">Move cash</h3><div className="small" id="xferBal">{state.balance}</div>
      <label className="xferLabel" htmlFor="xferDir">Direction</label><Field id="xferDir"/>
      <label className="xferLabel" htmlFor="xferAmt">Amount</label><Field id="xferAmt"/>
      <label className="xferLabel" id="xferNoteLbl" htmlFor="xferNote">{state.noteLabel}</label><Field id="xferNote"/>
      <div className={`dupConflict${state.error?'':' hidden'}`} id="xferErr" role="alert">{state.error}</div>
      <div className="dupActions" style={{marginTop:20}}>{['xferOk','xferCancel'].map(id=><EntryAction key={id} node={byId.get(id)} controller={cashMoveEntry} desk="cash-move"/>)}</div>
      <EntryError controller={cashMoveEntry}/>
    </div>
  </div>;
}
