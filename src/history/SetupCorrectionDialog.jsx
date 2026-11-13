import React, { useSyncExternalStore } from 'react';
import { createEntryController } from '../forms/entry-controller.js';
import { createViewState } from '../forms/view-state.mjs';
import { EntryField, EntryAction } from '../forms/EntryControls.jsx';

const amounts = [
  ['openingCash', 'Opening Retail cash'],
  ['posOpeningCash', 'Opening POS cash'],
  ['posOpeningElectronic', 'Opening POS electronic'],
  ['openingDebt', 'Opening customer debt'],
];
const nodes = [
  ...amounts.map(([id]) => ({tag:'input', props:{id:`setupEdit_${id}`, spellCheck:false, type:'number', min:'0', step:'0.01'}, children:[]})),
  {tag:'button', props:{id:'setupCorrectionClose', type:'button', className:'ghost'}, children:['Close']},
  {tag:'button', props:{id:'setupCorrectionSave', type:'button', className:'primary'}, children:['Save Setup Correction']},
];
const byId = new Map(nodes.map(node => [node.props.id, node]));
export const setupCorrectionEntry = createEntryController({initialNodes:nodes, actionIds:['setupCorrectionClose','setupCorrectionSave']});
export const setupCorrectionView = createViewState({title:'Edit Daily Setup', date:'', error:''});
const Action = ({id}) => <EntryAction node={byId.get(id)} controller={setupCorrectionEntry} desk="setup-correction"/>;
function dialogKeys(event) {
  if (event.key === 'Escape') {
    event.preventDefault(); setupCorrectionEntry.run('setupCorrectionClose').catch(()=>{}); return;
  }
  if (event.key !== 'Tab') return;
  const controls = [...event.currentTarget.querySelectorAll('button,input')].filter(el => !el.disabled && el.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
  else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
}
export function SetupCorrectionDialog() {
  const state = useSyncExternalStore(setupCorrectionView.subscribe, setupCorrectionView.getSnapshot);
  // Shared navigation owns overlay visibility until navigation is migrated.
  // React owns the contents and draft; the existing atomic command is the writer.
  return <div id="setupCorrectionOverlay" className="marketOverlay hidden noPrint" role="dialog" aria-modal="true" aria-labelledby="setupCorrectionTitle" onKeyDown={dialogKeys}>
    <div className="marketPanel">
      <div className="marketPanelHead"><h3 id="setupCorrectionTitle">{state.title}</h3><Action id="setupCorrectionClose"/></div>
      <p id="setupCorrectionDate" className="help">{state.date}</p>
      <p className="help">Settings correction only. The normal Daily Setup stays locked after confirmation. Saved financial days remain protected.</p>
      <div className="split">{amounts.map(([id,label]) => <label key={id} htmlFor={`setupEdit_${id}`}>{label}
        <EntryField node={byId.get(`setupEdit_${id}`)} controller={setupCorrectionEntry} desk="setup-correction"/>
      </label>)}</div>
      <p id="setupCorrectionError" role="alert" className="help">{state.error}</p>
      <Action id="setupCorrectionSave"/>
    </div>
  </div>;
}
