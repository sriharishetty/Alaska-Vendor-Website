import * as React from 'react';
export function FavoritesSummaryCards({
  counts,
  activeCardKey,
  onSelectSystems,
  onSelectVendors,
  onSelectCritical,
  onSelectQuickAccess
}) {
  const {
    favoriteSystemsCount = 0,
    favoriteVendorsCount = 0,
    criticalSystemsCount = 0,
    totalFavoritesCount = 0
  } = counts || {};

  return (
    <section className="fav-summary-section" aria-label="Favorites Summary Metrics">
      <div className="fav-summary-grid">
        {/* Card 1: Favorite Systems */}
        <button
          type="button"
          className={`fav-summary-card fav-summary-card-blue ${
            activeCardKey === "systems" ? "is-active" : ""
          }`}
          onClick={onSelectSystems}
          aria-pressed={activeCardKey === "systems"}
        >
          <div className="fav-summary-card-top">
            <span className="fav-summary-icon fav-summary-icon-blue" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span className="fav-summary-action-pill">
              {activeCardKey === "systems" ? "Filtered: Applications" : "Filter Applications"}
            </span>
          </div>
          <div className="fav-summary-value">{favoriteSystemsCount}</div>
          <div className="fav-summary-label">Favorite Systems</div>
          <p className="fav-summary-meta">
            {favoriteSystemsCount === 1
              ? "1 operational application saved"
              : `${favoriteSystemsCount} operational applications saved`}
          </p>
        </button>

        {/* Card 2: Favorite Vendors */}
        <button
          type="button"
          className={`fav-summary-card fav-summary-card-teal ${
            activeCardKey === "vendors" ? "is-active" : ""
          }`}
          onClick={onSelectVendors}
          aria-pressed={activeCardKey === "vendors"}
        >
          <div className="fav-summary-card-top">
            <span className="fav-summary-icon fav-summary-icon-teal" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9v.01" />
                <path d="M9 12v.01" />
                <path d="M9 15v.01" />
                <path d="M9 18v.01" />
              </svg>
            </span>
            <span className="fav-summary-action-pill">
              {activeCardKey === "vendors" ? "Filtered: Vendors" : "Filter Vendors"}
            </span>
          </div>
          <div className="fav-summary-value">{favoriteVendorsCount}</div>
          <div className="fav-summary-label">Favorite Vendors</div>
          <p className="fav-summary-meta">
            {favoriteVendorsCount === 1
              ? "1 vendor partner bookmarked"
              : `${favoriteVendorsCount} vendor partners bookmarked`}
          </p>
        </button>

        {/* Card 3: Critical Systems */}
        <button
          type="button"
          className={`fav-summary-card fav-summary-card-amber ${
            activeCardKey === "critical" ? "is-active" : ""
          }`}
          onClick={onSelectCritical}
          aria-pressed={activeCardKey === "critical"}
        >
          <div className="fav-summary-card-top">
            <span className="fav-summary-icon fav-summary-icon-amber" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className="fav-summary-action-pill">
              {activeCardKey === "critical" ? "Filtered: Critical" : "Filter Critical"}
            </span>
          </div>
          <div className="fav-summary-value">{criticalSystemsCount}</div>
          <div className="fav-summary-label">Critical Systems</div>
          <p className="fav-summary-meta">
            {criticalSystemsCount === 1
              ? "1 Tier-1 critical system in favorites"
              : `${criticalSystemsCount} Tier-1 critical systems in favorites`}
          </p>
        </button>

        {/* Card 4: Quick Access */}
        <button
          type="button"
          className={`fav-summary-card fav-summary-card-navy ${
            activeCardKey === "all" ? "is-active" : ""
          }`}
          onClick={onSelectQuickAccess}
          aria-pressed={activeCardKey === "all"}
        >
          <div className="fav-summary-card-top">
            <span className="fav-summary-icon fav-summary-icon-navy" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="fav-summary-action-pill">
              {activeCardKey === "all" ? "Showing All" : "View All Favorites"}
            </span>
          </div>
          <div className="fav-summary-value">{totalFavoritesCount}</div>
          <div className="fav-summary-label">Quick Access</div>
          <p className="fav-summary-meta">
            Your saved resources ({favoriteSystemsCount} apps, {favoriteVendorsCount} vendors)
          </p>
        </button>
      </div>
    </section>
  );
}

