import React, { memo } from 'react';
import { createPortal } from 'react-dom';

// Phase 2: this React component owns the <tr>/<td> structure in both table bodies.
// HTML inside each cell is the original app-generated, escaped legacy markup.
// Event handling stays delegated to the ancestor <tbody> by legacy controllers.
// This is an incremental view migration, NOT a domain or form-state rewrite.
const Row = memo(function Row({ model }) {
  const props = { className: model.className || undefined };
  if (model.stockRow) props['data-stock-row'] = model.stockRow;
  return React.createElement('tr', props, ...model.cells.map((cell, index) => {
    const cellProps = { key: index, dangerouslySetInnerHTML: { __html: cell.html } };
    if (cell.className) cellProps.className = cell.className;
    if (cell.colSpan != null) cellProps.colSpan = cell.colSpan;
    return React.createElement('td', cellProps);
  }));
});

export function SalesStockTablePortals({ tables }) {
  // These targets exist because LegacySurface rendered first.
  const salesBody = document.getElementById('ledger');
  const stockBody = document.getElementById('stockTable');
  const portals = [];
  if (salesBody && tables.ledger) {
    portals.push(createPortal(tables.ledger.map(row => React.createElement(Row,
      { key: row.key, model: row })), salesBody, 'sales-ledger'));
  }
  if (stockBody && tables.stock) {
    portals.push(createPortal(tables.stock.map(row => React.createElement(Row,
      { key: row.stockRow || row.key, model: row })), stockBody, 'stock-inventory'));
  }
  return React.createElement(React.Fragment, null, ...portals);
}
