function renderApplicationIcon(iconType, monogram) {
  switch (iconType) {
    case "radio":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
          <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
          <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "plane":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      );
    case "wrench":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "cloud":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      );
    case "compass":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "route":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="6" cy="19" r="3" />
          <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
          <circle cx="18" cy="5" r="3" />
        </svg>
      );
    case "scale":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return <span className="fav-card-monogram-text">{monogram || "OP"}</span>;
  }
}

export function FavoriteResourceCard({ item, onRemoveFavorite, onOpenDetails }) {
  const isApplication = item.resourceType === "application";

  if (isApplication) {
    const severityClass =
      item.severity === "Critical"
        ? "fav-badge-severity-critical"
        : item.severity === "High"
        ? "fav-badge-severity-high"
        : "fav-badge-severity-standard";

    const statusClass =
      item.status === "Operational" || item.status === "Active"
        ? "fav-badge-status-operational"
        : "fav-badge-status-warning";

    return (
      <article className="fav-resource-card fav-resource-card-app" data-resource-id={item.favoriteId}>
        <div className="fav-card-header">
          <div className={`fav-card-avatar fav-card-avatar-${item.tone || "blue"}`}>
            {renderApplicationIcon(item.iconType, item.monogram)}
          </div>

          <div className="fav-card-heading-group">
            <div className="fav-card-type-row">
              <span className="fav-type-tag fav-type-tag-app">Application</span>
              <span className="fav-category-tag">{item.category}</span>
            </div>
            <h3 className="fav-card-title">{item.name}</h3>
          </div>

          <button
            type="button"
            className="fav-star-toggle is-favorited"
            onClick={() => onRemoveFavorite("application", item.key, item.name)}
            aria-label={`Remove ${item.name} from favorites`}
            title="Remove from Favorites"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>

        <div className="fav-card-badges-row">
          {item.status && (
            <span className={`fav-pill-badge ${statusClass}`}>
              <span className="fav-status-dot" aria-hidden="true" />
              {item.status}
            </span>
          )}
          {item.severity && (
            <span className={`fav-pill-badge ${severityClass}`}>
              {item.severity} Severity
            </span>
          )}
          {item.responseSla && (
            <span className="fav-pill-badge fav-badge-sla">{item.responseSla}</span>
          )}
        </div>

        <p className="fav-card-description">{item.shortDescription}</p>

        <dl className="fav-card-meta-grid">
          <div className="fav-meta-cell">
            <dt>Vendor / Service Provider</dt>
            <dd>{item.vendor || "Internal / Airline Managed"}</dd>
          </div>
          <div className="fav-meta-cell">
            <dt>Primary Contact / POC</dt>
            <dd>{item.aagPOC || item.aagTeam || "Operations Support Desk"}</dd>
          </div>
          {(item.phone || item.email) && (
            <div className="fav-meta-cell fav-meta-cell-wide">
              <dt>Direct Support Channel</dt>
              <dd className="fav-meta-contact-links">
                {item.phone && <span>{item.phone}</span>}
                {item.phone && item.email && <span className="fav-contact-sep">•</span>}
                {item.email && <span className="fav-contact-email">{item.email}</span>}
              </dd>
            </div>
          )}
        </dl>

        <div className="fav-card-footer">
          <button
            type="button"
            className="fav-card-btn fav-card-btn-secondary"
            onClick={() => onOpenDetails(item)}
          >
            View Details
          </button>
          <a href={item.detailsUrl} className="fav-card-btn fav-card-btn-primary">
            <span>Open Application</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        </div>
      </article>
    );
  }

  // Vendor Card
  const supportedList = Array.isArray(item.supportedSystems) ? item.supportedSystems : [item.systemName];
  const visibleSystems = supportedList.slice(0, 3);
  const remainingSystemsCount = Math.max(0, supportedList.length - visibleSystems.length);

  return (
    <article className="fav-resource-card fav-resource-card-vendor" data-resource-id={item.favoriteId}>
      <div className="fav-card-header">
        <div className="fav-card-avatar fav-card-avatar-vendor">
          <span className="fav-card-monogram-text">{item.monogram}</span>
        </div>

        <div className="fav-card-heading-group">
          <div className="fav-card-type-row">
            <span className="fav-type-tag fav-type-tag-vendor">Vendor</span>
            <span className="fav-category-tag">{item.category}</span>
          </div>
          <h3 className="fav-card-title">{item.name}</h3>
        </div>

        <button
          type="button"
          className="fav-star-toggle is-favorited"
          onClick={() => onRemoveFavorite("vendor", item.id, item.name)}
          aria-label={`Remove ${item.name} from favorites`}
          title="Remove from Favorites"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      </div>

      <div className="fav-card-badges-row">
        <span className="fav-pill-badge fav-badge-status-operational">
          <span className="fav-status-dot" aria-hidden="true" />
          {item.status || "Active"}
        </span>
        <span className="fav-pill-badge fav-badge-systems-count">
          {supportedList.length === 1
            ? "1 Supported System"
            : `${supportedList.length} Supported Systems`}
        </span>
      </div>

      <div className="fav-vendor-systems-box">
        <span className="fav-vendor-systems-label">Supported Systems</span>
        <div className="fav-vendor-systems-chips">
          {visibleSystems.map(sys => (
            <span key={sys} className="fav-system-chip">
              {sys}
            </span>
          ))}
          {remainingSystemsCount > 0 && (
            <span className="fav-system-chip fav-system-chip-more">
              +{remainingSystemsCount} more
            </span>
          )}
        </div>
      </div>

      <dl className="fav-card-meta-grid">
        <div className="fav-meta-cell">
          <dt>Primary Contact</dt>
          <dd>
            {item.primaryContactName
              ? `${item.primaryContactName}${item.primaryContactRole ? ` (${item.primaryContactRole})` : ""}`
              : item.aagTeam || "Vendor Support Desk"}
          </dd>
        </div>
        <div className="fav-meta-cell">
          <dt>Support Phone</dt>
          <dd>{item.phone || "Not listed in directory"}</dd>
        </div>
        {item.email && (
          <div className="fav-meta-cell fav-meta-cell-wide">
            <dt>Support Email</dt>
            <dd className="fav-contact-email">{item.email}</dd>
          </div>
        )}
      </dl>

      <div className="fav-card-footer">
        <button
          type="button"
          className="fav-card-btn fav-card-btn-secondary"
          onClick={() => onOpenDetails(item)}
        >
          Quick View
        </button>
        <a href={item.detailsUrl} className="fav-card-btn fav-card-btn-primary">
          <span>View Vendor</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      </div>
    </article>
  );
}

