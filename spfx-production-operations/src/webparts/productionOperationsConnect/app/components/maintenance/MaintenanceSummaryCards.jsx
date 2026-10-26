import React from "react";
import { INTEGRATION_STATES } from "../../types/vendorMaintenance.js";

function getStateFootnote(integrationState, defaultSubtext, isDemoMode) {
  if (isDemoMode) {
    return "Showing DEMO DATA preview";
  }
  switch (integrationState) {
    case INTEGRATION_STATES.LOADING:
      return "Loading records...";
    case INTEGRATION_STATES.NOT_CONFIGURED:
      return "Integration not configured";
    case INTEGRATION_STATES.UNAVAILABLE:
      return "Integration temporarily unavailable";
    case INTEGRATION_STATES.NO_DATA:
      return "No notifications received yet";
    case INTEGRATION_STATES.CONNECTED:
    case INTEGRATION_STATES.SYNCED:
    default:
      return defaultSubtext;
  }
}

export default function MaintenanceSummaryCards({
  summary = {},
  integrationState = INTEGRATION_STATES.NOT_CONFIGURED,
  loading = false,
  isLoading = false,
  showDemoData = false,
  isDemoMode = false
}) {
  const busy = Boolean(loading || isLoading);
  const demo = Boolean(showDemoData || isDemoMode);

  const totalUpdates = busy ? "0" : Number(summary.totalUpdates ?? 0);
  const upcomingMaintenance = busy ? "0" : Number(summary.upcomingMaintenance ?? 0);
  const activeIncidents = busy ? "0" : Number(summary.activeIncidents ?? 0);
  const newNotifications = busy ? "0" : Number(summary.newNotifications ?? 0);

  return (
    <section className="vm-summary-grid" aria-label="Vendor Maintenance summary metrics">
      {/* Card 1: Total Vendor Updates */}
      <article className="vm-kpi-card" data-testid="kpi-total-updates">
        <span className="vm-kpi-icon vm-kpi-blue" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </span>
        <div className="vm-kpi-copy">
          <strong className="vm-kpi-value">{totalUpdates}</strong>
          <span className="vm-kpi-label">Total Vendor Updates</span>
          <small className="vm-kpi-sub">
            {getStateFootnote(integrationState, "Captured vendor email records", demo)}
          </small>
        </div>
        <span className="vm-kpi-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </article>

      {/* Card 2: Upcoming Maintenance */}
      <article className="vm-kpi-card" data-testid="kpi-upcoming-maintenance">
        <span className="vm-kpi-icon vm-kpi-purple" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
          </svg>
        </span>
        <div className="vm-kpi-copy">
          <strong className="vm-kpi-value">{upcomingMaintenance}</strong>
          <span className="vm-kpi-label">Upcoming Maintenance</span>
          <small className="vm-kpi-sub">
            {getStateFootnote(integrationState, "Scheduled maintenance windows", demo)}
          </small>
        </div>
        <span className="vm-kpi-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </article>

      {/* Card 3: Active Incidents */}
      <article className="vm-kpi-card" data-testid="kpi-active-incidents">
        <span className="vm-kpi-icon vm-kpi-orange" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <div className="vm-kpi-copy">
          <strong className="vm-kpi-value">{activeIncidents}</strong>
          <span className="vm-kpi-label">Active Incidents</span>
          <small className="vm-kpi-sub">
            {getStateFootnote(integrationState, "In progress or investigating", demo)}
          </small>
        </div>
        <span className="vm-kpi-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </article>

      {/* Card 4: New Notifications */}
      <article className="vm-kpi-card" data-testid="kpi-new-notifications">
        <span className="vm-kpi-icon vm-kpi-teal" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
        <div className="vm-kpi-copy">
          <strong className="vm-kpi-value">{newNotifications}</strong>
          <span className="vm-kpi-label">New Notifications</span>
          <small className="vm-kpi-sub">
            {getStateFootnote(integrationState, "Awaiting review or action", demo)}
          </small>
        </div>
        <span className="vm-kpi-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </article>
    </section>
  );
}
