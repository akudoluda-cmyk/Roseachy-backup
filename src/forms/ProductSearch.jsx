import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { EntryField } from './EntryControls.jsx';

let snapshot = { open:false, rows:[], active:-1 };
const listeners = new Set();
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const getSnapshot = () => snapshot;
function publish(next) {
  flushSync(() => {
    snapshot = next;
    for (const listener of listeners) listener();
  });
}
export const productSearchView = {
  show(rows) { publish({open:true, rows, active:-1}); },
  close() { if (snapshot.open) publish({open:false, rows:[], active:-1}); },
};
function choose(id) { window.RoseachyProductSearchCommands?.choose(id); }
function keyDown(event) {
  if (!snapshot.open) return;
  if (event.key === 'Escape') { event.preventDefault(); productSearchView.close(); return; }
  if (!snapshot.rows.length) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const active = event.key === 'ArrowDown' ? Math.min(snapshot.rows.length-1,snapshot.active+1) : Math.max(0,snapshot.active-1);
    publish({...snapshot,active});
  } else if (event.key === 'Enter' && snapshot.active >= 0) {
    event.preventDefault(); choose(snapshot.rows[snapshot.active].id);
  }
}
export function ProductSearchInput(props) {
  const state = useSyncExternalStore(subscribe,getSnapshot);
  return <EntryField {...props} presentation={{
    role:'combobox', 'aria-autocomplete':'list', 'aria-controls':'productSuggestions',
    'aria-expanded':state.open, 'aria-activedescendant':state.active>=0?`product-suggestion-${state.active}`:undefined,
    onKeyDown:keyDown,
  }} />;
}
export function ProductSuggestions() {
  const state = useSyncExternalStore(subscribe,getSnapshot);
  const active = useRef(null);
  useEffect(() => { active.current?.scrollIntoView({block:'nearest'}); }, [state.active]);
  return <div id="productSuggestions" className={`productSuggestDrop${state.open?'':' hidden'}`} role="listbox" aria-label="Inventory products">
    {state.open && (state.rows.length ? state.rows.map((row,index) =>
      <button key={row.id} id={`product-suggestion-${index}`} ref={state.active===index?active:null}
        type="button" role="option" aria-selected={state.active===index}
        className={`productSuggestItem${state.active===index?' active':''}`} data-product-suggest={row.id} data-suggest-index={index}
        onClick={() => choose(row.id)}><span className="productSuggestName">{row.name}</span></button>
    ) : <div className="productSuggestEmpty">No matching product</div>)}
  </div>;
}
