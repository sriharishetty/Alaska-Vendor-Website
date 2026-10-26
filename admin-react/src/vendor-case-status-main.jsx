import React from "react";
import { createRoot } from "react-dom/client";
import VendorCaseStatus from "./pages/VendorCaseStatus";

const container = document.getElementById("vendor-case-status-root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <VendorCaseStatus />
    </React.StrictMode>
  );
}

