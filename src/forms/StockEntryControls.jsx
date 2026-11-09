import React from 'react';
import { stockEntry } from './stock-form-controller.js';
import { EntryField, EntryAction, EntryError } from './EntryControls.jsx';
export const StockEntryField = props => <EntryField {...props} controller={stockEntry} desk="stock" />;
export const StockEntryAction = props => <EntryAction {...props} controller={stockEntry} desk="stock" />;
export const StockEntryError = () => <EntryError controller={stockEntry} />;
