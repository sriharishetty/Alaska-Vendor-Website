import React, { useMemo, useState } from "react";

function getVendorStatusBadgeClass(tone) {
  if (tone === "active") return "rpt-badge-status-operational";
  if (tone === "warning") return "rpt-badge-status-maintenance";
  if (tone === "critical") return "rpt-badge-sev-critical";
  return "rpt-badge-status-unknown";
}

export default function VendorInsights({
  uniqueVendors,
  vendorRecords,
  vendorViewMode,
  vendorSearchQuery,
  missingContactOnly,
  onVendorViewModeChange,
  onVendorSearchChange,
  onClearMissingContactFilter,
  onFilterAppHealthByVendor
}) {
  const [showAllRows, setShowAllRows] = useState(true);

  const filteredUniqueVendors = useMemo(() => {
    const query = String(vendorSearchQuery || "").trim().toLowerCase();
    return (uniqueVendors || []).filter(v => {
      if (vendorViewMode === "core-only" && v.coreAppCount === 0) return false;
      if (missingContactOnly && v.statusTone === "active") return false;
      if (!query) return true;
      const haystack = [
        v.vendorName,
        ...(v.allSystemNames || []),
        ...(v.categories || []),
        v.vendorStatus
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [uniqueVendors, vendorViewMode, vendorSearchQuery, missingContactOnly]);

  const filteredDirectoryRecords = useMemo(() => {
    const query = String(vendorSearchQuery || "").trim().toLowerCase();
    return (vendorRecords || []).filter(rec => {
      if (missingContactOnly && !rec.missingContactInfo) return false;
      if (!query) return true;
      const haystack = [
        rec.vendorName,
        rec.systemName,
        rec.category,
        ...(rec.linkedCoreApps || []),
        rec.contactStatus,
        rec.aagItsTeam
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [vendorRecords, vendorSearchQuery, missingContactOnly]);

  const isAllRecordsMode = vendorViewMode === "all-records";
  const activeRows = isAllRecordsMode ? filteredDirectoryRecords : filteredUniqueVendors;
  const visibleRows = showAllRows ? activeRows : activeRows.slice(0, 12);

  return (
    <section className="rpt-panel rpt-vendor-insights-panel" id="rpt-vendor-insights" aria-label="Vendor Insights">
      <div className="rpt-panel-header">
        <div className="rpt-panel-title-group">
          <div className="rpt-panel-title-row">
            <h2 className="rpt-panel-title">Vendor Insights</h2>
            <span className="rpt-count-pill">
              {(vendorRecords || []).length} Directory Records · {(uniqueVendors || []).length} Unique Vendors
            </span>
          </div>
          <p className="rpt-panel-subtitle">
            Application coverage, operational system relationships, and contact readiness across all 37 vendor directory records
          </p>
        </div>

        <div className="rpt-panel-actions no-print">
          <a
            href="vendors.html"
            className="rpt-btn rpt-btn-secondary"
            title="Open complete Vendor Directory"
          >
            <span>Open Vendor Directory</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="rpt-filter-bar rpt-vendor-filter-bar no-print">
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
            placeholder="Search vendors, associated systems, or categories..."
            value={vendorSearchQuery}
            onChange={e => onVendorSearchChange(e.target.value)}
            aria-label="Search vendor insights"
          />
        </div>

        <div className="rpt-view-tabs" role="group" aria-label="Vendor aggregation mode">
          <button
            type="button"
            className={`rpt-tab-btn ${vendorViewMode === "unique" ? "is-active" : ""}`}
            onClick={() => onVendorViewModeChange("unique")}
            title="Show deduplicated unique vendor companies aggregated across all 37 directory records"
          >
            Unique Vendors ({(uniqueVendors || []).length})
          </button>
          <button
            type="button"
            className={`rpt-tab-btn ${vendorViewMode === "all-records" ? "is-active" : ""}`}
            onClick={() => onVendorViewModeChange("all-records")}
            title="Show all 37 source vendor records individually"
          >
            All Vendor Records ({(vendorRecords || []).length})
          </button>
          <button
            type="button"
            className={`rpt-tab-btn ${vendorViewMode === "core-only" ? "is-active" : ""}`}
            onClick={() => onVendorViewModeChange("core-only")}
            title="Show vendors linked to Core Ground-Stop applications"
          >
            Core App Vendors
          </button>
        </div>
      </div>

      {missingContactOnly ? (
        <div className="rpt-active-filter-banner no-print">
          <span>
            Filtered by Data Quality: <strong>Vendor Records Missing Phone or Email Contact Information</strong>
          </span>
          <button type="button" className="rpt-banner-reset" onClick={onClearMissingContactFilter}>
            Show All Vendors
          </button>
        </div>
      ) : null}

      {activeRows.length === 0 ? (
        <div className="rpt-empty-state">
          <h3>No matching vendor records</h3>
          <p>No vendors match your current search or view filter.</p>
          <button
            type="button"
            className="rpt-btn rpt-btn-secondary"
            onClick={() => {
              onVendorSearchChange("");
              onVendorViewModeChange("unique");
              onClearMissingContactFilter();
            }}
          >
            Reset Vendor Filters
          </button>
        </div>
      ) : (
        <div className="rpt-table-wrap">
          <table className="rpt-table rpt-vendor-table">
            <thead>
              <tr>
                <th scope="col" className="rpt-col-vname">Vendor Name</th>
                <th scope="col" className="rpt-col-vcount">Number of Associated Applications</th>
                <th scope="col" className="rpt-col-vapps">Associated Application Names</th>
                <th scope="col" className="rpt-col-vstatus">Vendor Status</th>
                <th scope="col" className="rpt-col-vaction no-print">View Vendor</th>
              </tr>
            </thead>
            <tbody>
              {!isAllRecordsMode
                ? visibleRows.map(vendor => (
                    <tr key={vendor.key} className="rpt-table-row">
                      <td className="rpt-cell-vname" data-label="Vendor Name">
                        <div className="rpt-vendor-identity">
                          <a
                            href={vendor.vendorUrl}
                            className="rpt-vendor-name-link"
                            title={`Open ${vendor.vendorName} in Vendor Directory`}
                          >
                            {vendor.vendorName}
                          </a>
                          <span className="rpt-vendor-submeta">
                            {vendor.directoryRecordCount > 0
                              ? `${vendor.directoryRecordCount} directory record${vendor.directoryRecordCount === 1 ? "" : "s"}`
                              : "Application vendor record"}
                            {vendor.categories && vendor.categories.length > 0
                              ? ` · ${vendor.categories.slice(0, 2).join(", ")}`
                              : ""}
                          </span>
                        </div>
                      </td>

                      <td className="rpt-cell-vcount" data-label="Associated Applications">
                        <div className="rpt-vcount-stack">
                          <strong className="rpt-vcount-num">
                            {vendor.totalSystemCount}{" "}
                            <span className="rpt-vcount-unit">
                              {vendor.totalSystemCount === 1 ? "system" : "systems"}
                            </span>
                          </strong>
                          {vendor.coreAppCount > 0 ? (
                            <button
                              type="button"
                              className="rpt-core-app-filter-pill no-print"
                              onClick={() => onFilterAppHealthByVendor(vendor.vendorName)}
                              title={`Filter Application Health table by ${vendor.vendorName}`}
                            >
                              {vendor.coreAppCount} Core Operational {vendor.coreAppCount === 1 ? "App" : "Apps"}
                            </button>
                          ) : (
                            <span className="rpt-vcount-note">0 Core Ground-Stop Apps · Directory System</span>
                          )}
                        </div>
                      </td>

                      <td className="rpt-cell-vapps" data-label="Application Names">
                        <div className="rpt-system-tags">
                          {(vendor.combinedSystems || []).map(sys => (
                            <span
                              key={sys.name}
                              className={`rpt-sys-tag ${sys.isCoreApp ? "rpt-sys-tag-core" : "rpt-sys-tag-dir"}`}
                              title={sys.isCoreApp ? "Core Operational Application" : "Vendor Directory System"}
                            >
                              {sys.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="rpt-cell-vstatus" data-label="Vendor Status">
                        <span className={`rpt-badge ${getVendorStatusBadgeClass(vendor.statusTone)}`}>
                          <span className="rpt-badge-dot" />
                          {vendor.vendorStatus}
                        </span>
                      </td>

                      <td className="rpt-cell-vaction no-print" data-label="View Vendor">
                        <a
                          href={vendor.vendorUrl}
                          className="rpt-action-link"
                          title={`View ${vendor.vendorName} in Vendor Directory`}
                        >
                          <span>View Vendor</span>
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))
                : visibleRows.map(record => {
                    const allAppNames = Array.from(
                      new Set([record.systemName, ...(record.linkedCoreApps || [])].filter(Boolean))
                    );
                    return (
                      <tr key={`${record.id}-${record.sourceRow}`} className="rpt-table-row">
                        <td className="rpt-cell-vname" data-label="Vendor Name">
                          <div className="rpt-vendor-identity">
                            <a
                              href={record.vendorUrl}
                              className="rpt-vendor-name-link"
                              title={`Open ${record.vendorName} in Vendor Directory`}
                            >
                              {record.vendorName}
                            </a>
                            <span className="rpt-vendor-submeta">
                              Record #{record.sourceRow} · {record.category}
                            </span>
                          </div>
                        </td>

                        <td className="rpt-cell-vcount" data-label="Associated Applications">
                          <div className="rpt-vcount-stack">
                            <strong className="rpt-vcount-num">
                              {allAppNames.length}{" "}
                              <span className="rpt-vcount-unit">
                                {allAppNames.length === 1 ? "system" : "systems"}
                              </span>
                            </strong>
                            <span className="rpt-vcount-note">
                              {record.linkedCoreApps.length > 0
                                ? `${record.linkedCoreApps.length} Core Ground-Stop App`
                                : "Directory System Record"}
                            </span>
                          </div>
                        </td>

                        <td className="rpt-cell-vapps" data-label="Application Names">
                          <div className="rpt-system-tags">
                            <span className="rpt-sys-tag rpt-sys-tag-dir">{record.systemName}</span>
                            {(record.linkedCoreApps || [])
                              .filter(name => name.toLowerCase() !== record.systemName.toLowerCase())
                              .map(name => (
                                <span key={name} className="rpt-sys-tag rpt-sys-tag-core">
                                  {name}
                                </span>
                              ))}
                          </div>
                        </td>

                        <td className="rpt-cell-vstatus" data-label="Vendor Status">
                          <span className={`rpt-badge ${getVendorStatusBadgeClass(record.contactStatusTone)}`}>
                            <span className="rpt-badge-dot" />
                            {record.contactStatus}
                          </span>
                        </td>

                        <td className="rpt-cell-vaction no-print" data-label="View Vendor">
                          <a
                            href={record.vendorUrl}
                            className="rpt-action-link"
                            title={`View ${record.vendorName} in Vendor Directory`}
                          >
                            <span>View Vendor</span>
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}

      {activeRows.length > 12 ? (
        <div className="rpt-table-footer no-print">
          <span className="rpt-footer-count">
            Displaying <strong>{visibleRows.length}</strong> of <strong>{activeRows.length}</strong>{" "}
            {isAllRecordsMode ? "vendor directory records" : "unique vendor entries"}
          </span>
          <button
            type="button"
            className="rpt-btn rpt-btn-ghost"
            onClick={() => setShowAllRows(prev => !prev)}
          >
            {showAllRows ? "Show Compact View (Top 12)" : `Show All (${activeRows.length})`}
          </button>
        </div>
      ) : null}
    </section>
  );
}

