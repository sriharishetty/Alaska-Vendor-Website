import React from 'react';
import { createRoot } from 'react-dom/client';
import VendorMaintenance from './pages/VendorMaintenance';

const container = document.getElementById('vendor-maintenance-root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <VendorMaintenance />
    </React.StrictMode>
  );
}

