import React, { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { createEntryController } from '../forms/entry-controller.js';
import { createViewState } from '../forms/view-state.mjs';
import { EntryField, EntryAction, EntryError } from '../forms/EntryControls.jsx';

const nodes=[
  ...[['savedFrom','Saved days from'],['savedTo','Saved days to']].map(([id,label])=>({tag:'input',props:{id,type:'date','aria-label':label},children:[]})),
  ...[['saveBtn','Save Day','ghost daySaveBtn'],['clearBtn','Start New Day','primary dayStartBtn'],['backCurrentBtn','Back to current day','ghost']].map(([id,label,className])=>({tag:'button',props:{id,className,type:'button'},children:[label]})),
];
const byId=new Map(nodes.map(node=>[node.props.id,node]));
export const dayEntry=createEntryController({initialNodes:nodes,actionIds:['saveBtn','clearBtn','backCurrentBtn']});
export const savedDaysView=createViewState({range:'recent',rows:[],count:0,more:0,historical:false,busy:false,recoveryRequired:false});
const Action=({id})=><EntryAction node={byId.get(id)} controller={dayEntry} desk="day"/>;
const Field=({id})=><EntryField node={byId.get(id)} controller={dayEntry} desk="day"/>;
const command=(action,id)=>window.RoseachyDayCommands.record(action,id);

export function DayActions(){
  return <div id="dayManageRow" className="dayManageRow noPrint" role="group" aria-label="Business day actions">
    <Action id="saveBtn"/><Action id="clearBtn"/><EntryError controller={dayEntry}/>
  </div>;
}
export function HistoryBanner(){
  const {historical}=useSyncExternalStore(savedDaysView.subscribe,savedDaysView.getSnapshot);
  return <div id="historyBar" className={`card readonly noPrint${historical?'':' hidden'}`}>
    <strong>Saved day — read only.</strong> Historical transactions will not change current inventory. <Action id="backCurrentBtn"/>
  </div>;
}
export function SavedDays(){
  const state=useSyncExternalStore(savedDaysView.subscribe,savedDaysView.getSnapshot);
  return <div id="savedHistoryPane" aria-busy={state.busy}>
    <div className="savedTools noPrint" id="savedTools">
      <div className="segChoice" id="savedRangeFilter" role="group" aria-label="Saved-day range">
        {[['recent','Recent'],['week','This Week'],['month','This Month'],['custom','Custom'],['archived','Archived']].map(([mode,label])=><button key={mode} type="button" data-saved-range={mode} className={state.range===mode?'active':''} aria-pressed={state.range===mode} onClick={()=>window.RoseachyDayCommands.range(mode)}>{label}</button>)}
      </div>
      <div className={`savedCustom${state.range==='custom'?'':' hidden'}`} id="savedCustomRange"><Field id="savedFrom"/><Field id="savedTo"/></div>
      <span className="savedCount" id="savedCount" aria-live="polite">{state.count} saved day{state.count===1?'':'s'}</span>
    </div>
    <div id="savedList">
      {!state.count&&<div className="empty">No saved days in this view</div>}
      {state.rows.map(row=><div key={row.id} className={`rsSavedRow${row.archived?' archived':''}`}>
        <div className="rsSavedMain" data-load-id={row.id} role="button" aria-disabled={state.busy} tabIndex={state.busy?-1:0} onClick={()=>command('load',row.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();command('load',row.id);}}}>
          <div className="rsSavedDate">{row.date||'Undated'} <span className="rsSavedBadge">{row.archived?'Archived':'Saved'}</span></div>
          <div className="rsSavedStats"><span>Retail collected <b>{row.retail}</b></span><span>Expected retail cash <b>{row.closing}</b></span></div>
        </div>
        <div className="rsSavedActions">
          <button type="button" disabled={state.busy} className="iconbtn" data-load-id={row.id} onClick={()=>command('load',row.id)}>View ›</button>
          <button type="button" disabled={state.busy} className="iconbtn" data-archive-id={row.id} onClick={()=>command('archive',row.id)}>{row.archived?'Restore':'Archive'}</button>
          <button type="button" disabled={state.busy} className="iconbtn del" data-remove-id={row.id} onClick={()=>command('delete',row.id)}>Delete</button>
        </div>
      </div>)}
      {state.more>0&&<div className="perfMoreBox noPrint"><button type="button" className="ghost perfMoreBtn" data-saved-more="" onClick={()=>window.RoseachyDayCommands.more()}>Load {state.more} more</button></div>}
    </div>
  </div>;
}


export function DayRecoveryNotice(){
  const {recoveryRequired}=useSyncExternalStore(savedDaysView.subscribe,savedDaysView.getSnapshot);
  if(!recoveryRequired)return null;
  // Outside the inert application so the recovery action remains reachable.
  return createPortal(<div id="dayRecoveryOverlay" className="marketOverlay noPrint" style={{zIndex:100001}} role="alertdialog" aria-modal="true" aria-labelledby="dayRecoveryTitle" aria-describedby="dayRecoveryDescription" onKeyDown={event=>{if(event.key==='Tab'){event.preventDefault();event.currentTarget.querySelector('button').focus();}}}>
    <div className="marketPanel">
      <h3 id="dayRecoveryTitle">Reload saved records to continue</h3>
      <p id="dayRecoveryDescription">The day change could not finish safely. Your previous day has been saved. Editing is paused. Reload the saved records, then review Saved Days before entering transactions.</p>
      <button id="dayRecoveryReload" type="button" className="primary" onClick={()=>window.location.reload()}>Reload saved records</button>
    </div>
  </div>,document.body);
}
