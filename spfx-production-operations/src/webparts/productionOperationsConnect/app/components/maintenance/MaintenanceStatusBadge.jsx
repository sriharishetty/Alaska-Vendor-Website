import React from "react";
import { STATUS_BADGE_CONFIG } from "../../types/vendorMaintenance.js";

export default function MaintenanceStatusBadge({ status = "New" }) {
  const config = STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG["Requires Review"];

  return (
    <span
      className={`vm-status-badge vm-status-${config.tone}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.text
      }}
      aria-label={`Maintenance status: ${config.label}`}
    >
      <span
        className="vm-status-dot"
        style={{ backgroundColor: config.dot }}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}

