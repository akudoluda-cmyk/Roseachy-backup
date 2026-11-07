import React, { useLayoutEffect, useState } from 'react';
import { SalesStockTablePortals } from './islands/SalesStockTables.js';
import { LegacySurface } from './components/LegacySurface.jsx';
import scripts from './legacy-scripts.json';

// Script dependencies are loaded sequentially, after React has committed the UI.
// Loading them as ESM imports would change the timing and module execution semantics.
function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = false;
    el.onload = resolve;
    el.onerror = () => reject(new Error(`Could not load ${src}. No business data was reset.`));
    document.body.appendChild(el);
  });
}

let started = false;
export function BridgeApp() {
  const [tables, setTables] = useState({ ledger: null, stock: null });
  useLayoutEffect(() => {
    // Register BEFORE any legacy controller executes. Only the table view is React-owned.
    // React never mutates database values or initiates inventory/financial transactions.
    window.RoseachyReactTables = {
      ledger: rows => setTables(prev => ({ ...prev, ledger: rows })),
      stock: rows => setTables(prev => ({ ...prev, stock: rows })),
    };
    // Register a small, read/write-FILTER-ONLY event bridge before core executes.
    // The business controller registers its handlers once it has initialized.
    const handlers = Object.create(null);
    window.RoseachyReactFilters = {
      register(next) { Object.assign(handlers, next); },
      dispatch(id) {
        if (!Object.hasOwn(handlers, id)) return false;
        handlers[id]();
        return true;
      },
      sync(desk) {
        window.dispatchEvent(new CustomEvent('roseachy:filter-sync', { detail: { desk } }));
      },
      ready(id) { return Object.hasOwn(handlers, id); },
    };
    if (started) return;
    started = true;
    (async () => {
      for (const src of scripts) await loadClassicScript(src);
    })().catch(err => {
      console.error('Roseachy React bridge initialization failed:', err);
      const panel = document.createElement('div');
      panel.id = 'reactBridgeLoadError';
      panel.setAttribute('role', 'alert');
      panel.style.cssText = 'position:fixed;inset:0;z-index:999999;display:grid;place-items:center;background:#fff;color:#132c20;padding:24px;font:16px system-ui';
      panel.textContent = `Roseachy could not finish loading. Do not enter transactions. ${err.message} Reload the application after verifying the deployment.`;
      document.body.appendChild(panel);
    });
  }, []);
  return <><LegacySurface /><SalesStockTablePortals tables={tables} /></>;
}
