import React, { useState } from "react";

export default function DataQualitySummary({
  dataQuality,
  onInspectAppsMissingVendor,
  onInspectVendorsMissingContact,
  onJumpToAllVendors,
  onJumpToAllApps
}) {
  const [expandedDrawer, setExpandedDrawer] = useState(null);

  const {
    totalVendorRecords = 0,
    totalUniqueVendors = 0,
    totalApplicationRecords = 0,
    appsMissingVendorCount = 0,
    appsMissingVendor = [],
    vendorsMissingContactCount = 0,
    vendorsMissingContact = [],
    unknownStatusCount = 0,
    appsUnknownStatus = [],
    dataCompletenessPct = 100,
    appCompletenessPct = 100,
    vendorCompletenessPct = 100,
    combinedCompletedFields = 0,
    combinedRequiredFields = 0
  } = dataQuality || {};

  const toggleDrawer = key => {
    setExpandedDrawer(prev => (prev === key ? null : key));
  };

  return (
    <section className="rpt-panel rpt-quality-panel" id="rpt-data-quality" aria-label="Data Quality and Information Completeness">
      <div className="rpt-panel-header">
        <div className="rpt-panel-title-group">
          <div className="rpt-panel-title-row">
            <h2 className="rpt-panel-title">Data Quality &amp; Information Completeness</h2>
            <span className="rpt-completeness-pill">
              <strong>{dataCompletenessPct}%</strong> Overall Completeness
            </span>
          </div>
          <p className="rpt-panel-subtitle">
            Automated audit of vendor associations, support contact fields, and operational status records ({combinedCompletedFields} of {combinedRequiredFields} required fields populated)
          </p>
        </div>
      </div>

      {/* Completeness Progress Bar */}
      <div className="rpt-quality-meter-box">
        <div className="rpt-quality-meter-labels">
          <span>
            Directory Field Completeness: <strong>{dataCompletenessPct}%</strong>
          </span>
          <span className="rpt-quality-subbreakdown">
            Applications: <strong>{appCompletenessPct}%</strong> · Vendor Directory: <strong>{vendorCompletenessPct}%</strong>
          </span>
        </div>
        <div className="rpt-quality-meter-track" aria-hidden="true">
          <span
            className="rpt-quality-meter-fill"
            style={{ width: `${Math.min(100, Math.max(0, dataCompletenessPct))}%` }}
          />
        </div>
      </div>

      {/* Clickable Metric Cards */}
      <div className="rpt-quality-grid">
        <button
          type="button"
          className="rpt-quality-card"
          onClick={onJumpToAllVendors}
          title="Click to inspect all 37 vendor records in Vendor Insights"
        >
          <span className="rpt-quality-label">Total Vendor Records</span>
          <div className="rpt-quality-val-row">
            <strong className="rpt-quality-value">{totalVendorRecords}</strong>
            <span className="rpt-quality-tag rpt-qtag-neutral">{totalUniqueVendors} unique</span>
          </div>
          <small className="rpt-quality-hint">Click to view all 37 records →</small>
        </button>

        <button
          type="button"
          className="rpt-quality-card"
          onClick={onJumpToAllApps}
          title="Click to view all operational applications in Application Health"
        >
          <span className="rpt-quality-label">Total Application Records</span>
          <div className="rpt-quality-val-row">
            <strong className="rpt-quality-value">{totalApplicationRecords}</strong>
            <span className="rpt-quality-tag rpt-qtag-green">Verified</span>
          </div>
          <small className="rpt-quality-hint">Click to view applications →</small>
        </button>

        <button
          type="button"
          className={`rpt-quality-card ${appsMissingVendorCount > 0 ? "rpt-quality-warn" : ""} ${
            expandedDrawer === "missing-vendor" ? "is-selected" : ""
          }`}
          onClick={() => {
            toggleDrawer("missing-vendor");
            if (onInspectAppsMissingVendor) onInspectAppsMissingVendor();
          }}
          title="Click to inspect applications missing an external vendor association"
        >
          <span className="rpt-quality-label">Apps Missing Vendor</span>
          <div className="rpt-quality-val-row">
            <strong className="rpt-quality-value">{appsMissingVendorCount}</strong>
            <span className={`rpt-quality-tag ${appsMissingVendorCount > 0 ? "rpt-qtag-amber" : "rpt-qtag-green"}`}>
              {appsMissingVendorCount > 0 ? "Internal / NA" : "Complete"}
            </span>
          </div>
          <small className="rpt-quality-hint">
            {expandedDrawer === "missing-vendor" ? "Hide affected apps ↑" : "Click to inspect & filter →"}
          </small>
        </button>

        <button
          type="button"
          className={`rpt-quality-card ${vendorsMissingContactCount > 0 ? "rpt-quality-warn" : ""} ${
            expandedDrawer === "missing-contact" ? "is-selected" : ""
          }`}
          onClick={() => {
            toggleDrawer("missing-contact");
            if (onInspectVendorsMissingContact) onInspectVendorsMissingContact();
          }}
          title="Click to inspect vendor records missing phone or email contact information"
        >
          <span className="rpt-quality-label">Vendors Missing Contact</span>
          <div className="rpt-quality-val-row">
            <strong className="rpt-quality-value">{vendorsMissingContactCount}</strong>
            <span className={`rpt-quality-tag ${vendorsMissingContactCount > 0 ? "rpt-qtag-amber" : "rpt-qtag-green"}`}>
              {vendorsMissingContactCount > 0 ? "Needs Review" : "Complete"}
            </span>
          </div>
          <small className="rpt-quality-hint">
            {expandedDrawer === "missing-contact" ? "Hide affected vendors ↑" : "Click to inspect & filter →"}
          </small>
        </button>

        <button
          type="button"
          className={`rpt-quality-card ${unknownStatusCount > 0 ? "rpt-quality-warn" : ""} ${
            expandedDrawer === "unknown-status" ? "is-selected" : ""
          }`}
          onClick={() => toggleDrawer("unknown-status")}
          title="Click to inspect records with unknown or missing operational status"
        >
          <span className="rpt-quality-label">Unknown / Missing Status</span>
          <div className="rpt-quality-val-row">
            <strong className="rpt-quality-value">{unknownStatusCount}</strong>
            <span className={`rpt-quality-tag ${unknownStatusCount > 0 ? "rpt-qtag-amber" : "rpt-qtag-green"}`}>
              {unknownStatusCount === 0 ? "All Known" : "Incomplete"}
            </span>
          </div>
          <small className="rpt-quality-hint">
            {unknownStatusCount === 0 ? "100% status coverage" : "Click to inspect records →"}
          </small>
        </button>
      </div>

      {/* Expandable Drill-down Inspection Panel */}
      {expandedDrawer === "missing-vendor" ? (
        <div className="rpt-quality-drawer no-print">
          <div className="rpt-quality-drawer-header">
            <strong>
              Applications Missing External Vendor Association ({appsMissingVendor.length})
            </strong>
            <button
              type="button"
              className="rpt-inline-reset"
              onClick={() => setExpandedDrawer(null)}
            >
              Close ×
            </button>
          </div>
          {appsMissingVendor.length === 0 ? (
            <p className="rpt-drawer-empty">All registered operational applications have a configured vendor.</p>
          ) : (
            <ul className="rpt-drawer-list">
              {appsMissingVendor.map(app => (
                <li key={app.key} className="rpt-drawer-item">
                  <div>
                    <strong>{app.name}</strong>
                    <span> · Raw vendor field: &ldquo;{app.rawVendor}&rdquo; · Support team: {app.aagTeam || "ITS Support"}</span>
                  </div>
                  <a href={app.detailsUrl} className="rpt-action-link">
                    Inspect System →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {expandedDrawer === "missing-contact" ? (
        <div className="rpt-quality-drawer no-print">
          <div className="rpt-quality-drawer-header">
            <strong>
              Vendor Records Missing Phone or Email Contact ({vendorsMissingContact.length} of {totalVendorRecords})
            </strong>
            <button
              type="button"
              className="rpt-inline-reset"
              onClick={() => setExpandedDrawer(null)}
            >
              Close ×
            </button>
          </div>
          {vendorsMissingContact.length === 0 ? (
            <p className="rpt-drawer-empty">All 37 vendor directory records have both phone and email contacts.</p>
          ) : (
            <ul className="rpt-drawer-list">
              {vendorsMissingContact.map(v => (
                <li key={`${v.id}-${v.sourceRow}`} className="rpt-drawer-item">
                  <div>
                    <strong>{v.vendorName}</strong>
                    <span>
                      {" "}
                      ({v.systemName}) · Status: <em>{v.contactStatus}</em>
                    </span>
                  </div>
                  <a href={v.vendorUrl} className="rpt-action-link">
                    Open in Directory →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {expandedDrawer === "unknown-status" ? (
        <div className="rpt-quality-drawer no-print">
          <div className="rpt-quality-drawer-header">
            <strong>Records With Unknown or Missing Operational Status ({unknownStatusCount})</strong>
            <button
              type="button"
              className="rpt-inline-reset"
              onClick={() => setExpandedDrawer(null)}
            >
              Close ×
            </button>
          </div>
          {appsUnknownStatus.length === 0 ? (
            <p className="rpt-drawer-empty">
              All {totalApplicationRecords} operational applications have an explicit operational status assigned.
            </p>
          ) : (
            <ul className="rpt-drawer-list">
              {appsUnknownStatus.map(app => (
                <li key={app.key} className="rpt-drawer-item">
                  <div>
                    <strong>{app.name}</strong>
                    <span> · Status field is missing or unspecified</span>
                  </div>
                  <a href={app.detailsUrl} className="rpt-action-link">
                    Inspect System →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

