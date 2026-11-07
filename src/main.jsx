import React from 'react';
import { createRoot } from 'react-dom/client';
import { BridgeApp } from './BridgeApp.jsx';
import './legacy.css';

// Intentionally no StrictMode during the migration bridge:
// the original application uses global listeners and imperative DOM updates.
createRoot(document.getElementById('root')).render(<BridgeApp />);
