import React from 'react';
import { createPortal } from 'react-dom';
import { StockInventoryRows } from '../tables/StockInventoryRows.jsx';
import { SalesLedgerRows } from '../tables/SalesLedgerRows.jsx';

// Both tables consume data-only models. No generated HTML reaches React.
export function SalesStockTablePortals({ tables }) {
 const salesBody=document.getElementById('ledger'),stockBody=document.getElementById('stockTable');
 const portals=[];
 if(salesBody&&tables.ledger)portals.push(createPortal(React.createElement(SalesLedgerRows,{rows:tables.ledger}),salesBody,'sales-ledger'));
 if(stockBody&&tables.stock)portals.push(createPortal(React.createElement(StockInventoryRows,{rows:tables.stock}),stockBody,'stock-inventory'));
 return React.createElement(React.Fragment,null,...portals);
}
