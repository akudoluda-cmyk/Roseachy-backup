import { ProductSearchInput } from './ProductSearch.jsx';
import React from 'react';
import { createEntryController } from './entry-controller.js';
import { EntryField, EntryAction, EntryError } from './EntryControls.jsx';
export const salesEntry = createEntryController({rootId:'retailEntry',actionIds:['addBtn','cancelEditBtn','refreshSalePrice']});
export const SalesEntryField = props => props.node.props.id === 'note'
  ? <ProductSearchInput {...props} controller={salesEntry} desk="sales" />
  : <EntryField {...props} controller={salesEntry} desk="sales" />;
export const SalesEntryAction = props => <EntryAction {...props} controller={salesEntry} desk="sales" />;
export const SalesEntryError = () => <EntryError controller={salesEntry} />;
