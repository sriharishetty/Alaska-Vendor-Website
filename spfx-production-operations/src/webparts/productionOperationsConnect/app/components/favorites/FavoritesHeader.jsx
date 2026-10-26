import * as React from 'react';
export function FavoritesHeader({ totalFavoritesCount, onOpenQuickManage }) {
  return (
    <header className="fav-hero-banner" aria-label="My Favorites Page Header">
      <div className="fav-hero-inner">
        <div className="fav-hero-copy">
          <div className="fav-hero-eyebrow-row">
            <span className="fav-hero-eyebrow">PRODUCTION OPERATIONS</span>
            <span className="fav-hero-divider" aria-hidden="true">•</span>
            <span className="fav-hero-slogan">PEOPLE. PLANES. A BRIGHTER TOMORROW.</span>
          </div>
          <h1 className="fav-hero-title">My Favorites</h1>
          <p className="fav-hero-subtitle">Your essential systems, always within reach.</p>
          <p className="fav-hero-description">
            Quickly access your saved applications, trusted vendors, and frequently used operational resources.
          </p>
        </div>

        <div className="fav-hero-actions">
          <button
            type="button"
            className="fav-hero-btn fav-hero-btn-primary"
            onClick={onOpenQuickManage}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Manage Saved Items ({totalFavoritesCount})</span>
          </button>
          <div className="fav-hero-links">
            <a href="ground-stops.html" className="fav-hero-btn fav-hero-btn-ghost">
              <span>Browse Applications</span>
            </a>
            <a href="vendors.html" className="fav-hero-btn fav-hero-btn-ghost">
              <span>Explore Vendors</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

