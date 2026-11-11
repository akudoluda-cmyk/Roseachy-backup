import {SavedDays,DayActions,HistoryBanner} from '../history/SavedDays.jsx';
import {SupplierPaymentDialog} from '../forms/SupplierPaymentDialog.jsx';
import {CashMoveDialog} from '../forms/CashMoveDialog.jsx';
import {PosEntry} from '../forms/PosEntry.jsx';
import {cartEntry,HeldCart,CartPaymentField,CartAction,CartError} from '../forms/HeldCart.jsx';
import { ProductSuggestions } from '../forms/ProductSearch.jsx';
import React, { memo } from 'react';
import nodes from './legacy-tree.json';
import {salesEntry, SalesEntryField, SalesEntryAction, SalesEntryError} from '../forms/SalesEntryControls.jsx';
import { STOCK_FIELDS, STOCK_ACTIONS } from '../forms/stock-form-controller.js';
import { StockEntryField, StockEntryAction, StockEntryError } from '../forms/StockEntryControls.jsx';
import { ReactFilterControl, ReactFilterResetButton, FILTER_IDS } from '../islands/ReactFilterControls.js';

// This genuinely renders the legacy HTML nodes through React createElement.
// It does NOT yet migrate business logic, event handlers or state to React.
// Never rerender this surface while imperative legacy controllers own its nodes.
function renderNode(node, key) {
  if (typeof node === 'string') return node;
  if (node.props?.id === 'savedHistoryPane') return <SavedDays key={key}/>;
  if (node.props?.id === 'dayManageRow') return <DayActions key={key}/>;
  if (node.props?.id === 'historyBar') return <HistoryBanner key={key}/>;
  if (node.props?.id === 'supplierPaymentOverlay') return <SupplierPaymentDialog key={key} />;
  if (node.props?.id === 'xferOverlay') return <CashMoveDialog key={key} />;
  if (node.props?.id === 'posEntry') return <PosEntry key={key} />;
  if (node.props?.id === 'holdList') return <HeldCart key={key} />;
  if (cartEntry.fields.has(node.props?.id)) return <CartPaymentField key={key} node={node} />;
  if (cartEntry.actions.has(node.props?.id)) return <CartAction key={key} node={node} />;
  if (node.props?.id === 'productSuggestions') return <ProductSuggestions key={key} />;
  if (salesEntry.fields.has(node.props?.id)) return <SalesEntryField key={key} node={node} />;
  if (salesEntry.actions.has(node.props?.id)) return <SalesEntryAction key={key} node={node} />;
  if (STOCK_FIELDS.has(node.props?.id)) return <StockEntryField key={key} node={node} />;
  if (STOCK_ACTIONS.has(node.props?.id)) return <StockEntryAction key={key} node={node} />;
  if (FILTER_IDS.has(node.props?.id)) return <ReactFilterControl key={key} node={node} renderNode={renderNode} />;
  const props = { ...node.props, key };
  const children = node.children.map((child, index) => renderNode(child, index));
  if (node.tag === 'div' && node.props?.className?.split(' ').includes('txTools')) {
    children.push(<ReactFilterResetButton key="react-sales-clear" desk="sales" />);
  }
  if (node.tag === 'div' && node.props?.className?.split(' ').includes('controlsRow') &&
      node.children.some(child => child?.props?.id === 'stockDiv')) {
    children.push(<ReactFilterResetButton key="react-stock-clear" desk="stock" />);
  }
  if (node.props?.id === 'holdPanel') children.push(<CartError key="cart-react-error" />);
  if (node.props?.id === 'retailEntry') children.push(<SalesEntryError key="sales-react-error" />);
  if (node.props?.id === 'stockEntryBody') children.push(<StockEntryError key="stock-react-error" />);
  return React.createElement(node.tag, props, ...children);
}

export const LegacySurface = memo(function LegacySurface() {
  return <>{nodes.map((node, index) => renderNode(node, index))}</>;
});
