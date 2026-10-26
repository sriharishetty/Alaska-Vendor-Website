import React from "react";

export default function ReportKpiCards({
  kpis,
  activeKpiFilter,
  onSelectKpiFilter
}) {
  const {
    totalApplications = 0,
    criticalApplications = 0,
    activeApplications = 0,
    totalVendorRecords = 0,
    totalUniqueVendors = 0
  } = kpis || {};

  return (
    <section className="rpt-kpi-grid" aria-label="Operational Summary Metrics">
      {/* Card 1: Total Applications */}
      <button
        type="button"
        className={`rpt-kpi-card rpt-kpi-blue ${activeKpiFilter === "all-apps" ? "is-selected" : ""}`}
        onClick={() => onSelectKpiFilter("all-apps")}
        title="Click to show all registered operational applications"
      >
        <div className="rpt-kpi-icon-wrap rpt-kpi-icon-blue" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
        <div className="rpt-kpi-body">
          <div className="rpt-kpi-value-row">
            <strong className="rpt-kpi-value">{totalApplications}</strong>
            <span className="rpt-kpi-pill rpt-kpi-pill-blue">100% Tracked</span>
          </div>
          <span className="rpt-kpi-label">Total Applications</span>
          <small className="rpt-kpi-subtext">Registered operational systems</small>
        </div>
      </button>

      {/* Card 2: Critical Applications */}
      <button
        type="button"
        className={`rpt-kpi-card rpt-kpi-red ${activeKpiFilter === "critical" ? "is-selected" : ""}`}
        onClick={() => onSelectKpiFilter("critical")}
        title="Click to filter Application Health by Critical severity"
      >
        <div className="rpt-kpi-icon-wrap rpt-kpi-icon-red" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="rpt-kpi-body">
          <div className="rpt-kpi-value-row">
            <strong className="rpt-kpi-value">{criticalApplications}</strong>
            <span className="rpt-kpi-pill rpt-kpi-pill-red">
              <span className="rpt-status-dot rpt-dot-red" />
              Critical Tier
            </span>
          </div>
          <span className="rpt-kpi-label">Critical Applications</span>
          <small className="rpt-kpi-subtext">Applications requiring attention</small>
        </div>
      </button>

      {/* Card 3: Active Applications */}
      <button
        type="button"
        className={`rpt-kpi-card rpt-kpi-green ${activeKpiFilter === "active" ? "is-selected" : ""}`}
        onClick={() => onSelectKpiFilter("active")}
        title="Click to filter Application Health by Operational / Active status"
      >
        <div className="rpt-kpi-icon-wrap rpt-kpi-icon-green" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="rpt-kpi-body">
          <div className="rpt-kpi-value-row">
            <strong className="rpt-kpi-value">{activeApplications}</strong>
            <span className="rpt-kpi-pill rpt-kpi-pill-green">
              <span className="rpt-status-dot rpt-dot-green" />
              Online
            </span>
          </div>
          <span className="rpt-kpi-label">Active Applications</span>
          <small className="rpt-kpi-subtext">Operational status</small>
        </div>
      </button>

      {/* Card 4: Total Vendors */}
      <button
        type="button"
        className={`rpt-kpi-card rpt-kpi-navy ${activeKpiFilter === "vendors" ? "is-selected" : ""}`}
        onClick={() => onSelectKpiFilter("vendors")}
        title="Click to jump to Vendor Insights directory summary"
      >
        <div className="rpt-kpi-icon-wrap rpt-kpi-icon-navy" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
          </svg>
        </div>
        <div className="rpt-kpi-body">
          <div className="rpt-kpi-value-row">
            <strong className="rpt-kpi-value">{totalVendorRecords}</strong>
            <span className="rpt-kpi-pill rpt-kpi-pill-navy">
              {totalUniqueVendors} Unique
            </span>
          </div>
          <span className="rpt-kpi-label">Total Vendors</span>
          <small className="rpt-kpi-subtext">Registered vendor records</small>
        </div>
      </button>
    </section>
  );
}

