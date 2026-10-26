export function FavoritesEmptyState({
  variant = "zero-favorites",
  onClearFilters,
  onOpenQuickManage
}) {
  if (variant === "no-matches") {
    return (
      <div className="fav-empty-state fav-empty-state-filtered" role="status">
        <div className="fav-empty-icon-wrap fav-empty-icon-search" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="M8 11h6" />
          </svg>
        </div>
        <h3 className="fav-empty-title">No matching favorites found.</h3>
        <p className="fav-empty-description">
          None of your saved applications or vendors match the current search query or filter selection.
        </p>
        <div className="fav-empty-actions">
          <button
            type="button"
            className="fav-empty-btn fav-empty-btn-primary"
            onClick={onClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fav-empty-state" role="status">
      <div className="fav-empty-icon-wrap" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <h3 className="fav-empty-title">Your favorites start here</h3>
      <p className="fav-empty-description">
        Save the applications and vendors you use most often for quick access.
      </p>
      <div className="fav-empty-actions">
        <a href="ground-stops.html" className="fav-empty-btn fav-empty-btn-primary">
          <span>Browse Applications</span>
        </a>
        <a href="vendors.html" className="fav-empty-btn fav-empty-btn-secondary">
          <span>Explore Vendors</span>
        </a>
        <button
          type="button"
          className="fav-empty-btn fav-empty-btn-tertiary"
          onClick={onOpenQuickManage}
        >
          <span>Quick-Add from Directory</span>
        </button>
      </div>
    </div>
  );
}

