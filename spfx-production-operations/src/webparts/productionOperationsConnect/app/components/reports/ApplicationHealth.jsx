import React, { useState } from "react";

function getAppMonogram(name) {
  const words = String(name || "APP")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "OP";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getStatusBadgeClass(status) {
  const lower = String(status || "unknown").toLowerCase();
  if (lower === "operational" || lower === "active") return "rpt-badge-status-operational";
  if (lower === "maintenance" || lower === "degraded") return "rpt-badge-status-maintenance";
  if (lower === "inactive") return "rpt-badge-status-inactive";
  return "rpt-badge-status-unknown";
}

function getSeverityBadgeClass(severity) {
  const lower = String(severity || "unknown").toLowerCase();
  if (lower === "critical") return "rpt-badge-sev-critical";
  if (lower === "high") return "rpt-badge-sev-high";
  if (lower === "medium") return "rpt-badge-sev-medium";
  if (lower === "low") return "rpt-badge-sev-low";
  return "rpt-badge-sev-unknown";
}

function AppIcon({ src, name }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!src || imgFailed) {
    return (
      <div className="rpt-app-monogram" aria-hidden="true">
        {getAppMonogram(name)}
      </div>
    );
  }
  return (
    <div className="rpt-app-icon-box">
      <img
        src={src}
        alt={`${name} icon`}
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}

export default function ApplicationHealth({
  applications,
  totalCount,
  searchQuery,
  vendorFilter,
  severityFilter,
  statusFilter,
  missingVendorOnly,
  vendorOptions,
  severityOptions,
  statusOptions,
  onSearchChange,
  onVendorFilterChange,
  onSeverityFilterChange,
  onStatusFilterChange,
  onClearFilters
}) {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    vendorFilter !== "ALL" ||
    severityFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    Boolean(missingVendorOnly);

  return (
    <section className="rpt-panel rpt-app-health-panel" id="rpt-application-health" aria-label="Application Health">
      <div className="rpt-panel-header">
        <div className="rpt-panel-title-group">
          <div className="rpt-panel-title-row">
            <h2 className="rpt-panel-title">Application Health</h2>
            <span className="rpt-live-badge">
              <span className="rpt-status-dot rpt-dot-green" />
              LIVE VIEW
            </span>
          </div>
          <p className="rpt-panel-subtitle">
            Operational status, vendor coverage, and severity classification across registered systems
          </p>
        </div>

        <div className="rpt-panel-meta">
          <span className="rpt-count-pill">
            Showing <strong>{applications.length}</strong> of <strong>{totalCount}</strong> applications
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rpt-filter-bar no-print" role="region" aria-label="Application Health Filters">
        <div className="rpt-search-field">
          <svg
            className="rpt-search-icon"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="rpt-input"
            placeholder="Search application name, description, category, or team..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Search applications by name or description"
          />
        </div>

        <div className="rpt-select-group">
          <label className="rpt-select-wrap">
            <span className="rpt-sr-only">Filter by vendor</span>
            <select
              className="rpt-select"
              value={vendorFilter}
              onChange={e => onVendorFilterChange(e.target.value)}
              aria-label="Filter applications by vendor"
            >
              <option value="ALL">All Vendors</option>
              <option value="UNASSIGNED">Missing / Unassigned Vendor</option>
              {vendorOptions.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="rpt-select-wrap">
            <span className="rpt-sr-only">Filter by severity</span>
            <select
              className="rpt-select"
              value={severityFilter}
              onChange={e => onSeverityFilterChange(e.target.value)}
              aria-label="Filter applications by severity"
            >
              <option value="ALL">All Severities</option>
              {severityOptions.map(sev => (
                <option key={sev} value={sev}>
                  {sev}
                </option>
              ))}
            </select>
          </label>

          <label className="rpt-select-wrap">
            <span className="rpt-sr-only">Filter by operational status</span>
            <select
              className="rpt-select"
              value={statusFilter}
              onChange={e => onStatusFilterChange(e.target.value)}
              aria-label="Filter applications by operational status"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              className="rpt-clear-btn"
              onClick={onClearFilters}
              title="Reset all Application Health filters"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>

      {missingVendorOnly ? (
        <div className="rpt-active-filter-banner no-print">
          <span>
            Filtered by Data Quality: <strong>Applications Missing Vendor Association</strong>
          </span>
          <button type="button" className="rpt-banner-reset" onClick={onClearFilters}>
            Show All Applications
          </button>
        </div>
      ) : null}

      {/* Table */}
      {applications.length === 0 ? (
        <div className="rpt-empty-state">
          <div className="rpt-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3>No matching operational applications</h3>
          <p>No applications match your current search or filter criteria.</p>
          {hasActiveFilters ? (
            <button type="button" className="rpt-btn rpt-btn-secondary" onClick={onClearFilters}>
              Clear All Filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="rpt-table-wrap">
          <table className="rpt-table rpt-app-table">
            <thead>
              <tr>
                <th scope="col" className="rpt-col-app">Application</th>
                <th scope="col" className="rpt-col-desc">Description</th>
                <th scope="col" className="rpt-col-vendor">Vendor</th>
                <th scope="col" className="rpt-col-status">Operational Status</th>
                <th scope="col" className="rpt-col-severity">Severity</th>
                <th scope="col" className="rpt-col-action no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.key} className="rpt-table-row">
                  <td className="rpt-cell-app" data-label="Application">
                    <div className="rpt-app-identity">
                      <AppIcon src={app.icon} name={app.name} />
                      <div className="rpt-app-meta">
                        <a
                          href={app.detailsUrl}
                          className="rpt-app-name-link"
                          title={`View ${app.name} in Operations Directory`}
                        >
                          {app.name}
                        </a>
                        <span className="rpt-app-submeta">
                          {app.category}
                          {app.aagTeam ? ` · ${app.aagTeam}` : ""}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="rpt-cell-desc" data-label="Description">
                    <p className="rpt-app-desc-text" title={app.fullDescription}>
                      {app.shortDescription}
                    </p>
                  </td>

                  <td className="rpt-cell-vendor" data-label="Vendor">
                    {app.hasVendorAssociation ? (
                      <a
                        href={`vendors.html?search=${encodeURIComponent(app.vendor)}`}
                        className="rpt-vendor-chip"
                        title={`View ${app.vendor} in Vendor Directory`}
                      >
                        <span>{app.vendor}</span>
                      </a>
                    ) : (
                      <span
                        className="rpt-vendor-unassigned"
                        title="No external vendor company assigned in master record (Internal ITS support)"
                      >
                        Unassigned (Internal ITS)
                      </span>
                    )}
                  </td>

                  <td className="rpt-cell-status" data-label="Operational Status">
                    <span className={`rpt-badge ${getStatusBadgeClass(app.status)}`}>
                      <span className="rpt-badge-dot" />
                      {app.status}
                    </span>
                  </td>

                  <td className="rpt-cell-severity" data-label="Severity">
                    <span className={`rpt-badge ${getSeverityBadgeClass(app.severity)}`}>
                      {app.severity}
                    </span>
                  </td>

                  <td className="rpt-cell-action no-print" data-label="Action">
                    <a
                      href={app.detailsUrl}
                      className="rpt-action-link"
                      title={`Open ${app.name} operational details`}
                    >
                      <span>View Details</span>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

