import React from 'react';
import { createEntryController } from '../forms/entry-controller.js';
import { EntryField, EntryAction, EntryError } from '../forms/EntryControls.jsx';

const openings = [
  ['openingCash', 'Retail opening cash', 'Enter opening retail cash'],
  ['posOpeningCash', 'POS opening cash', 'Enter opening POS cash'],
  ['posOpeningElectronic', 'Opening POS electronic balance', 'Enter opening POS balance'],
  ['openingDebt', 'Opening customer debt', '0.00'],
];
const counts = {
  retail: [['actualCash', 'Retail cash counted', 'cashDiff'], ['actualBankMovement', 'Actual bank movement', 'bankDiff']],
  pos: [['actualPosCash', 'POS cash counted', 'posCashDiff'], ['actualPosElectronic', 'POS electronic balance', 'posElectronicDiff']],
};
const input = (id, props) => ({tag:'input', props:{id, spellCheck:false, ...props}, children:[]});
const nodes = [
  input('business', {type:'hidden', defaultValue:'Roseachy'}),
  input('date', {type:'date'}),
  ...openings.map(([id,,placeholder]) => input(id, {type:'number', min:'0', step:'0.01', placeholder})),
  ...Object.values(counts).flat().map(([id]) => input(id, {type:'number', step:'0.01', placeholder:'Optional'})),
  {tag:'button', props:{id:'finDayConfirm', type:'button', className:'primary finDayConfirmBtn'}, children:['✓ Confirm Day Setup']},
];
const byId = new Map(nodes.map(node => [node.props.id, node]));
export const setupEntry = createEntryController({initialNodes:nodes, actionIds:['finDayConfirm']});
const Field = ({id}) => <EntryField node={byId.get(id)} controller={setupEntry} desk="day-setup"/>;

// The shared controller still owns calculations, persistence and navigation.
// These components own field values and markup; its scoped facade hydrates
// committed values and locks during restore, history viewing and day changes.
export function DaySetup() {
  return <div className="collapseBody open" id="daySetupBody"><div className="collapseInner">
    <div className="row daySetupGrid">
      <Field id="business"/>
      <div><label htmlFor="date">Date</label><Field id="date"/></div>
      {openings.map(([id,label]) => <div key={id}>
        <label htmlFor={id}>{label}</label><Field id={id}/>
        {id !== 'openingDebt' && <div id={`${id}Hint`} className="small openingCashHint" aria-live="polite"/>}
      </div>)}
    </div>
    <div className="finConfirmRow">
      <EntryAction node={byId.get('finDayConfirm')} controller={setupEntry} desk="day-setup"/>
      <span id="finDayConfirmStatus" className="small">Bank review reminder starts after confirmation</span>
    </div>
    <EntryError controller={setupEntry}/>
  </div></div>;
}

export function Reconciliation({desk}) {
  return <div className={`recon${desk === 'pos' ? ' viewOff' : ''}`} id={desk === 'pos' ? 'reconPos' : 'reconRetail'}>
    {counts[desk].map(([id,label,difference]) => <div key={id}>
      <label htmlFor={id}>{label}</label><Field id={id}/>
      <div className="small" id={difference}/>
      {id === 'actualPosElectronic' && <div className="warnText" id="posNegWarn" style={{marginTop:8,textAlign:'left'}}/>}
    </div>)}
  </div>;
}
