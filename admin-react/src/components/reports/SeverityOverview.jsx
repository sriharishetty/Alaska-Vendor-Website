import React from "react";

export default function SeverityOverview({
  severityDistribution,
  totalApplications,
  selectedSeverity,
  onSelectSeverity
}) {
  const rows = Array.isArray(severityDistribution) ? severityDistribution : [];

  return (
    <section className="rpt-panel rpt-severity-panel" aria-label="Severity Overview">
      <div className="rpt-panel-header">
        <div className="rpt-panel-title-group">
          <h2 className="rpt-panel-title">Severity Overview</h2>
          <p className="rpt-panel-subtitle">
            Application distribution by operational severity tier
          </p>
        </div>
        {selectedSeverity && selectedSeverity !== "ALL" ? (
          <button
            type="button"
            className="rpt-inline-reset no-print"
            onClick={() => onSelectSeverity("ALL")}
            title="Clear severity filter"
          >
            Reset ({selectedSeverity}) ×
          </button>
        ) : null}
      </div>

      <div className="rpt-severity-list" role="list">
        {rows.map(item => {
          const isSelected = selectedSeverity === item.key;
          const safePct = totalApplications > 0 ? Math.min(100, Math.max(0, item.percentage)) : 0;

          return (
            <button
              key={item.key}
              type="button"
              role="listitem"
              className={`rpt-severity-item rpt-sev-tone-${item.tone} ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectSeverity(isSelected ? "ALL" : item.key)}
              title={`Click to ${isSelected ? "clear filter for" : "filter Application Health by"} ${item.label} severity (${item.count} application${item.count === 1 ? "" : "s"})`}
            >
              <div className="rpt-severity-top">
                <div className="rpt-severity-label-wrap">
                  <span className={`rpt-sev-dot rpt-sev-dot-${item.tone}`} aria-hidden="true" />
                  <span className="rpt-severity-name">{item.label}</span>
                  <span className="rpt-severity-hint">{item.description}</span>
                </div>

                <div className="rpt-severity-stats">
                  <strong className="rpt-severity-count">{item.count}</strong>
                  <span className="rpt-severity-pct">{safePct}%</span>
                </div>
              </div>

              <div className="rpt-severity-bar-track" aria-hidden="true">
                <span
                  className={`rpt-severity-bar-fill rpt-sev-fill-${item.tone}`}
                  style={{ width: `${safePct}%` }}
                />
              </div>

              {item.matchingApps && item.matchingApps.length > 0 ? (
                <div className="rpt-severity-apps-preview">
                  {item.matchingApps.join(" · ")}
                </div>
              ) : (
                <div className="rpt-severity-apps-empty">
                  No applications currently classified as {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="rpt-severity-footer no-print">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Select any severity tier above to filter the Application Health table.</span>
      </div>
    </section>
  );
}

