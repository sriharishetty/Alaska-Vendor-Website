import React from "react";

const RESPONSE_TIERS = [
  {
    key: "Critical",
    title: "Critical",
    subtitle: "Immediate operational attention",
    detail: "Engage on-call ITS team and vendor support bridge immediately upon operational validation.",
    tone: "critical"
  },
  {
    key: "High",
    title: "High",
    subtitle: "Priority operational support",
    detail: "Notify responsible AAG ITS support group and initiate priority vendor ticket or phone contact.",
    tone: "high"
  },
  {
    key: "Medium",
    title: "Medium",
    subtitle: "Standard support escalation",
    detail: "Route through standard ITS operational support queue and documented vendor support portal.",
    tone: "medium"
  },
  {
    key: "Low",
    title: "Low",
    subtitle: "Normal support channel",
    detail: "Track via routine operational support channel during standard service windows.",
    tone: "low"
  }
];

function TierIcon({ tone }) {
  if (tone === "critical") {
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (tone === "high") {
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  }
  if (tone === "medium") {
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function OperationalResponseOverview({
  severityDistribution,
  selectedSeverity,
  onSelectSeverity
}) {
  const countMap = {};
  (severityDistribution || []).forEach(item => {
    countMap[item.key] = item.count || 0;
  });

  return (
    <section className="rpt-panel rpt-response-panel" aria-label="Operational Response Overview">
      <div className="rpt-panel-header">
        <div className="rpt-panel-title-group">
          <div className="rpt-panel-title-row">
            <h2 className="rpt-panel-title">Operational Response Overview</h2>
            <span className="rpt-guidance-tag">OPERATIONAL GUIDANCE</span>
          </div>
          <p className="rpt-panel-subtitle">
            Severity-based operational response expectations and escalation posture
          </p>
        </div>
      </div>

      <div className="rpt-response-grid">
        {RESPONSE_TIERS.map(tier => {
          const count = countMap[tier.key] ?? 0;
          const isSelected = selectedSeverity === tier.key;

          return (
            <button
              key={tier.key}
              type="button"
              className={`rpt-response-card rpt-resp-${tier.tone} ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectSeverity(isSelected ? "ALL" : tier.key)}
              title={`Click to filter Application Health by ${tier.title} severity`}
            >
              <div className={`rpt-resp-icon rpt-resp-icon-${tier.tone}`}>
                <TierIcon tone={tier.tone} />
              </div>

              <div className="rpt-resp-content">
                <div className="rpt-resp-top">
                  <strong className="rpt-resp-title">{tier.title}</strong>
                  <span className="rpt-resp-count-badge">
                    {count} {count === 1 ? "system" : "systems"}
                  </span>
                </div>
                <span className="rpt-resp-subtitle">{tier.subtitle}</span>
                <p className="rpt-resp-detail">{tier.detail}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="rpt-guidance-disclaimer">
        Note: Response tiers above represent internal operational escalation guidance rather than guaranteed contractual vendor SLA commitments. Refer to each system&apos;s documented escalation record for specific response targets.
      </p>
    </section>
  );
}

