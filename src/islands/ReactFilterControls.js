import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Phase 3A owns ONLY filter controls. Deliberately uncontrolled because the
 * existing history/restoration code sets DOM values imperatively. React owns
 * their events and the reset-button UI state, without competing with the
 * validated stock/accounting transaction logic or legacy dynamic <option>s.
 */
import { SALES_FILTER_IDS, STOCK_FILTER_IDS, FILTER_IDS, isFilterActive, filterCurrentValue } from './filter-contract.mjs';
export { FILTER_IDS };

function emitUpdate(desk) {
  window.dispatchEvent(new CustomEvent('roseachy:filter-update', { detail: { desk } }));
}

export function ReactFilterControl({ node, renderNode }) {
  const id = node.props.id;
  const desk = id.startsWith('tx') ? 'sales' : 'stock';
  const reference = useRef(null);
  const [active, setActive] = useState(false);
  const syncFromDom = useCallback(() => {
    const element = reference.current;
    if (element) setActive(isFilterActive(id, filterCurrentValue(element)));
  }, [id]);

  useEffect(() => {
    function onSync(event) {
      if (!event.detail?.desk || event.detail.desk === desk) syncFromDom();
    }
    window.addEventListener('roseachy:filter-sync', onSync);
    syncFromDom();
    return () => window.removeEventListener('roseachy:filter-sync', onSync);
  }, [desk, syncFromDom]);

  const onUpdate = useCallback(() => {
    syncFromDom();
    emitUpdate(desk);
    // Dispatch into the registered legacy read-only filter/render functions.
    window.RoseachyReactFilters?.dispatch?.(id);
  }, [desk, id, syncFromDom]);

  const props = {
    ...node.props,
    ref: reference,
    'data-react-filter': id,
    'data-filter-active': active ? 'true' : 'false',
  };
  if (node.tag === 'select' || node.props.type === 'checkbox') props.onChange = onUpdate;
  else props.onInput = onUpdate;
  const children = (node.children || []).map((child, index) => renderNode(child, index));
  return React.createElement(node.tag, props, ...children);
}

export function ReactFilterResetButton({ desk }) {
  const ids = desk === 'sales' ? SALES_FILTER_IDS : STOCK_FILTER_IDS;
  const [hasFilters, setHasFilters] = useState(false);
  const sync = useCallback(() => {
    setHasFilters(ids.some(id => isFilterActive(id, filterCurrentValue(document.getElementById(id)))));
  }, [ids]);
  useEffect(() => {
    function changed(e) { if (!e.detail?.desk || e.detail.desk === desk) sync(); }
    window.addEventListener('roseachy:filter-update', changed);
    window.addEventListener('roseachy:filter-sync', changed);
    sync();
    return () => {
      window.removeEventListener('roseachy:filter-update', changed);
      window.removeEventListener('roseachy:filter-sync', changed);
    };
  }, [desk, sync]);
  const clear = useCallback(() => {
    if (window.RoseachyClearFilters?.(desk)) {
      sync();
      emitUpdate(desk);
    }
  }, [desk, sync]);
  return React.createElement('button', {
    type: 'button',
    className: 'ghost reactFilterClear noPrint',
    'data-react-filter-reset': desk,
    disabled: !hasFilters,
    onClick: clear,
    'aria-label': desk === 'sales' ? 'Clear sales record filters' : 'Clear stock filters',
    title: 'Clear filters without changing saved records',
  }, 'Clear filters');
}
