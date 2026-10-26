import React from "react";

export default function ReportHeader({
  formattedDate,
  scope,
  groundStopCount,
  allRegisteredCount,
  onScopeChange,
  onExportFullCsv,
  onExportFilteredCsv,
  onPrintReport
}) {
  return (
    <header className="rpt-header-card" aria-label="Reports and Analytics Page Header">
      <div className="rpt-header-main">
        <div className="rpt-header-copy">
          <div className="rpt-eyebrow-row">
            <span className="rpt-eyebrow">PRODUCTION OPERATIONS</span>
            {formattedDate ? (
              <span className="rpt-date-pill" title="Current system report timestamp">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{formattedDate}</span>
              </span>
            ) : null}
          </div>

          <h1 className="rpt-title">Reports &amp; Analytics</h1>
          <p className="rpt-subtitle">
            Operational insights for applications, vendors, and system health.
          </p>
          <p className="rpt-description">
            Monitor operational application status, vendor coverage, severity distribution, and information completeness.
          </p>
        </div>

        <div className="rpt-header-actions no-print">
          {allRegisteredCount > groundStopCount ? (
            <div className="rpt-scope-segmented" role="group" aria-label="Application dataset scope">
              <button
                type="button"
                className={`rpt-scope-btn ${scope === "ground-stop" ? "is-active" : ""}`}
                onClick={() => onScopeChange("ground-stop")}
                title="Show the 9 core Ground-Stop operational systems"
              >
                Core Systems ({groundStopCount})
              </button>
              <button
                type="button"
                className={`rpt-scope-btn ${scope === "all" ? "is-active" : ""}`}
                onClick={() => onScopeChange("all")}
                title="Include all registered operational systems in master data"
              >
                All Systems ({allRegisteredCount})
              </button>
            </div>
          ) : null}

          <div className="rpt-export-toolbar">
            <button
              type="button"
              className="rpt-btn rpt-btn-secondary"
              onClick={onExportFilteredCsv}
              title="Download currently filtered Application Health rows as CSV (application-health-report.csv)"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Export Filtered CSV</span>
            </button>

            <button
              type="button"
              className="rpt-btn rpt-btn-primary"
              onClick={onExportFullCsv}
              title="Download complete operational report as CSV (production-operations-report.csv)"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export Full Report</span>
            </button>

            <button
              type="button"
              className="rpt-btn rpt-btn-ghost"
              onClick={onPrintReport}
              title="Print clean operational summary report"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

