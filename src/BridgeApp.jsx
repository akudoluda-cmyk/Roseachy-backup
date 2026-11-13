import {SetupCorrectionDialog,setupCorrectionEntry,setupCorrectionView} from './history/SetupCorrectionDialog.jsx';
import {setupEntry} from './history/DaySetup.jsx';
import * as dayRecords from './domain/day-records.mjs';
import {dayEntry,savedDaysView} from './history/SavedDays.jsx';
import {supplierPaymentEntry,supplierPaymentView} from './forms/SupplierPaymentDialog.jsx';
import {cashMoveEntry,cashMoveView} from './forms/CashMoveDialog.jsx';
import * as posMath from './domain/pos-math.mjs';
import {posEntry,posView} from './forms/PosEntry.jsx';
import * as salesPricing from './domain/sales-pricing.mjs';
import { cartEntry, heldCartView } from './forms/HeldCart.jsx';
import { productSearchView } from './forms/ProductSearch.jsx';
import { createDeskRepository } from './data/desk-repository.mjs';
import * as inventoryMath from './domain/inventory-math.mjs';
import React, { useLayoutEffect, useState } from 'react';
import { SalesStockTablePortals } from './islands/SalesStockTables.js';
import { LegacySurface } from './components/LegacySurface.jsx';
import scripts from './legacy-scripts.json';
import {salesEntry} from './forms/SalesEntryControls.jsx';
import { stockEntry } from './forms/stock-form-controller.js';

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
    window.RoseachySetupCorrectionView = setupCorrectionView;
    window.RoseachyDayRecords = dayRecords;
    window.RoseachySavedDaysView = savedDaysView;
    window.RoseachyInventoryMath = inventoryMath;
    window.RoseachyPosMath = posMath;
    window.RoseachyPosView = posView;
    window.RoseachyCashMoveView = cashMoveView;
    window.RoseachySupplierPaymentView = supplierPaymentView;
    window.RoseachySalesPricing = salesPricing;
    window.RoseachyCartView = heldCartView;
    window.RoseachyProductSearchView = productSearchView;
    const entries = [salesEntry, cartEntry, stockEntry, posEntry, cashMoveEntry, supplierPaymentEntry, dayEntry, setupEntry, setupCorrectionEntry];
    window.RoseachyForms = {
      element(id,el) { const entry=entries.find(e=>e.fields.has(id)||e.actions.has(id)); return entry?entry.element(id,el):el; },
      registerCommand(id,execute) { const entry=entries.find(e=>e.actions.has(id)); if(!entry)return false; entry.registerCommand(id,execute); return true; },
    };
    // Register views before the business controller. React actions invoke the
    // existing single command owner; views never write the database directly.
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
      for (const src of scripts) {
        await loadClassicScript(src);
        if (src.endsWith('/01-storage.js')) {
          window.RoseachyRepository = createDeskRepository(window.RoseachyStore, window);
        }
      }
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
  return <><LegacySurface /><SetupCorrectionDialog /><SalesStockTablePortals tables={tables} /></>;
}
