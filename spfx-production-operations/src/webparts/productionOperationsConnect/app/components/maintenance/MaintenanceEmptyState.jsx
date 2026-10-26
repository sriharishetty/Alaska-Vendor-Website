import React from 'react';
import { INTEGRATION_STATES } from '../../types/vendorMaintenance';

export default function MaintenanceEmptyState({
  integrationState,
  hasActiveFilters,
  onClearFilters,
  onToggleDemoData,
  showDemoData,
  onOpenSimulator,
  onOpenAdminSettings,
  isAdmin
}) {
  if (hasActiveFilters) {
    return (
      <div className="vm-empty-state" role="status">
        <div className="vm-empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h3 className="vm-empty-title">No matching maintenance records</h3>
        <p className="vm-empty-desc">
          No vendor maintenance notifications match your active search or filter criteria. Try broadening your date range or clearing the active filters.
        </p>
        <div className="vm-empty-actions">
          <button type="button" className="vm-btn vm-btn-primary" onClick={onClearFilters}>
            Clear All Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vm-empty-state" role="status">
      <div className="vm-empty-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>
      <h3 className="vm-empty-title">No vendor maintenance updates yet</h3>
      <p className="vm-empty-desc">
        No vendor maintenance updates yet. Once the Outlook integration is configured, incoming vendor notifications will appear here automatically.
      </p>

      <div className="vm-empty-meta-box">
        <div className="vm-empty-meta-row">
          <span className="vm-empty-meta-label">Integration Status:</span>
          <span className={`vm-integration-pill vm-integration-${integrationState || INTEGRATION_STATES.NOT_CONFIGURED}`}>
            {integrationState === INTEGRATION_STATES.CONNECTED
              ? 'Mailbox Synchronized (Zero Production Records)'
              : integrationState === INTEGRATION_STATES.UNAVAILABLE
              ? 'Integration Temporarily Unavailable'
              : 'Microsoft 365 / Power Automate Webhook Not Yet Configured'}
          </span>
        </div>
        <div className="vm-empty-meta-row">
          <span className="vm-empty-meta-label">Monitored Outlook Folder:</span>
          <code className="vm-code-chip">Inbox / Vendor Maintenance</code>
        </div>
      </div>

      <div className="vm-empty-actions">
        {onOpenSimulator && (
          <button type="button" className="vm-btn vm-btn-primary" onClick={onOpenSimulator}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Simulate Incoming Vendor Email
          </button>
        )}
        {onToggleDemoData && !showDemoData && (
          <button type="button" className="vm-btn vm-btn-secondary" onClick={onToggleDemoData}>
            Preview Clearly Labeled DEMO DATA
          </button>
        )}
        {isAdmin && onOpenAdminSettings && (
          <button type="button" className="vm-btn vm-btn-outline" onClick={onOpenAdminSettings}>
            Configure Outlook Integration
          </button>
        )}
      </div>
    </div>
  );
}

