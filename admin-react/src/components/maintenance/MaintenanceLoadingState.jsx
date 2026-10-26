import React from 'react';

export default function MaintenanceLoadingState() {
  return (
    <div className="vm-loading-state" aria-busy="true" aria-live="polite">
      <div className="vm-loading-header">
        <div className="vm-spinner" />
        <span>Loading vendor maintenance records and synchronization status...</span>
      </div>
      <div className="vm-skeleton-table">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="vm-skeleton-row">
            <div className="vm-skeleton-cell vm-sk-vendor" />
            <div className="vm-skeleton-cell vm-sk-app" />
            <div className="vm-skeleton-cell vm-sk-subject" />
            <div className="vm-skeleton-cell vm-sk-type" />
            <div className="vm-skeleton-cell vm-sk-date" />
            <div className="vm-skeleton-cell vm-sk-status" />
          </div>
        ))}
      </div>
    </div>
  );
}

