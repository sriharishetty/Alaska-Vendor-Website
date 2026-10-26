export function FavoriteDetailsModal({ item, onClose, onRemoveFavorite }) {
  if (!item) return null;

  const isApp = item.resourceType === "application";

  return (
    <div
      className="fav-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="favModalTitle"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fav-modal-dialog">
        <div className="fav-modal-header">
          <div className="fav-modal-title-group">
            <span className={`fav-type-tag ${isApp ? "fav-type-tag-app" : "fav-type-tag-vendor"}`}>
              {isApp ? "Application Profile" : "Vendor Partner Profile"}
            </span>
            <h2 id="favModalTitle" className="fav-modal-title">
              {item.name}
            </h2>
            <p className="fav-modal-subtitle">
              {isApp ? item.subtitle : `Category: ${item.category}`}
            </p>
          </div>
          <button
            type="button"
            className="fav-modal-close"
            onClick={onClose}
            aria-label="Close details modal"
          >
            ✕
          </button>
        </div>

        <div className="fav-modal-body">
          <div className="fav-modal-badges">
            <span className="fav-pill-badge fav-badge-status-operational">
              <span className="fav-status-dot" aria-hidden="true" />
              {item.status || "Operational"}
            </span>
            {isApp && item.severity && (
              <span
                className={`fav-pill-badge ${
                  item.severity === "Critical"
                    ? "fav-badge-severity-critical"
                    : "fav-badge-severity-high"
                }`}
              >
                {item.severity} Severity
              </span>
            )}
            <span className="fav-pill-badge fav-badge-sla">{item.category}</span>
          </div>

          {isApp ? (
            <div className="fav-modal-section">
              <h4>Operational Overview</h4>
              <p className="fav-modal-text">{item.fullDescription}</p>
            </div>
          ) : (
            <div className="fav-modal-section">
              <h4>Supported Operational Systems ({item.supportedSystems?.length || 1})</h4>
              <div className="fav-vendor-systems-chips">
                {(item.supportedSystems || [item.systemName]).map(sys => (
                  <span key={sys} className="fav-system-chip">
                    {sys}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="fav-modal-grid">
            {isApp && (
              <div className="fav-modal-field">
                <span className="fav-modal-label">Vendor / Service Provider</span>
                <span className="fav-modal-value">{item.vendor || "Internal / Airline Managed"}</span>
              </div>
            )}
            {!isApp && (
              <div className="fav-modal-field">
                <span className="fav-modal-label">Vendor POC</span>
                <span className="fav-modal-value">{item.vendorPoc || "Not specified in directory"}</span>
              </div>
            )}
            <div className="fav-modal-field">
              <span className="fav-modal-label">Alaska ITS POC</span>
              <span className="fav-modal-value">{item.aagPOC || "Not specified in directory"}</span>
            </div>
            <div className="fav-modal-field">
              <span className="fav-modal-label">Alaska ITS Team</span>
              <span className="fav-modal-value">{item.aagTeam || "Production Operations"}</span>
            </div>
            <div className="fav-modal-field">
              <span className="fav-modal-label">Support Phone</span>
              <span className="fav-modal-value">{item.phone || "Not listed"}</span>
            </div>
            <div className="fav-modal-field">
              <span className="fav-modal-label">Support Email</span>
              <span className="fav-modal-value fav-contact-email">{item.email || "Not listed"}</span>
            </div>
            {isApp && item.responseSla && (
              <div className="fav-modal-field">
                <span className="fav-modal-label">Target Response SLA</span>
                <span className="fav-modal-value">{item.responseSla}</span>
              </div>
            )}
          </div>

          {item.escalation && (
            <div className="fav-modal-section">
              <h4>Escalation & Support Notes</h4>
              <pre className="fav-modal-escalation">{item.escalation}</pre>
            </div>
          )}
        </div>

        <div className="fav-modal-footer">
          <button
            type="button"
            className="fav-card-btn fav-card-btn-danger-outline"
            onClick={() => {
              onRemoveFavorite(item.resourceType, isApp ? item.key : item.id, item.name);
              onClose();
            }}
          >
            Remove from Favorites
          </button>
          <div className="fav-modal-footer-right">
            <button type="button" className="fav-card-btn fav-card-btn-secondary" onClick={onClose}>
              Close
            </button>
            <a href={item.detailsUrl} className="fav-card-btn fav-card-btn-primary">
              <span>{isApp ? "Open in Ground Stops" : "Open in Vendor Directory"}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickManageFavoritesModal({
  isOpen,
  onClose,
  catalogApplications,
  catalogVendors,
  savedAppKeys,
  savedVendorIds,
  onToggleItem
}) {
  const [activeTab, setActiveTab] = useState("applications");
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const appSet = new Set(savedAppKeys || []);
  const vendorSet = new Set(savedVendorIds || []);
  const q = query.trim().toLowerCase();

  const filteredApps = (catalogApplications || []).filter(app => {
    if (!q) return true;
    return (
      app.name.toLowerCase().includes(q) ||
      app.vendor.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
    );
  });

  const filteredVendors = (catalogVendors || []).filter(vendor => {
    if (!q) return true;
    return (
      vendor.name.toLowerCase().includes(q) ||
      vendor.systemName.toLowerCase().includes(q) ||
      vendor.category.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fav-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="favManageModalTitle"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fav-modal-dialog fav-modal-dialog-wide">
        <div className="fav-modal-header">
          <div className="fav-modal-title-group">
            <span className="fav-type-tag fav-type-tag-app">Directory Bookmark Manager</span>
            <h2 id="favManageModalTitle" className="fav-modal-title">
              Add or Remove Favorites
            </h2>
            <p className="fav-modal-subtitle">
              Select operational applications and vendor records to pin to your My Favorites workspace.
            </p>
          </div>
          <button
            type="button"
            className="fav-modal-close"
            onClick={onClose}
            aria-label="Close bookmark manager"
          >
            ✕
          </button>
        </div>

        <div className="fav-manage-toolbar">
          <div className="fav-manage-tabs">
            <button
              type="button"
              className={`fav-manage-tab ${activeTab === "applications" ? "active" : ""}`}
              onClick={() => setActiveTab("applications")}
            >
              Applications ({catalogApplications.length})
            </button>
            <button
              type="button"
              className={`fav-manage-tab ${activeTab === "vendors" ? "active" : ""}`}
              onClick={() => setActiveTab("vendors")}
            >
              Vendors ({catalogVendors.length})
            </button>
          </div>
          <input
            type="search"
            className="fav-manage-search"
            placeholder="Filter applications or vendors..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="fav-modal-body fav-manage-list">
          {activeTab === "applications" ? (
            filteredApps.map(app => {
              const isSaved = appSet.has(app.key);
              return (
                <div key={app.key} className={`fav-manage-row ${isSaved ? "is-saved" : ""}`}>
                  <div className="fav-manage-row-info">
                    <div className="fav-manage-row-title">
                      <strong>{app.name}</strong>
                      <span className="fav-category-tag">{app.category}</span>
                      <span
                        className={`fav-pill-badge ${
                          app.severity === "Critical"
                            ? "fav-badge-severity-critical"
                            : "fav-badge-severity-high"
                        }`}
                      >
                        {app.severity}
                      </span>
                    </div>
                    <div className="fav-manage-row-sub">
                      Vendor: {app.vendor} • {app.shortDescription}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`fav-manage-toggle-btn ${isSaved ? "active" : ""}`}
                    onClick={() => onToggleItem("application", app.key, app.name)}
                  >
                    <span>{isSaved ? "★ Saved" : "☆ Add Favorite"}</span>
                  </button>
                </div>
              );
            })
          ) : (
            filteredVendors.map(vendor => {
              const isSaved = vendorSet.has(vendor.id);
              return (
                <div key={vendor.id} className={`fav-manage-row ${isSaved ? "is-saved" : ""}`}>
                  <div className="fav-manage-row-info">
                    <div className="fav-manage-row-title">
                      <strong>{vendor.name}</strong>
                      <span className="fav-category-tag">{vendor.category}</span>
                    </div>
                    <div className="fav-manage-row-sub">
                      System: {vendor.supportedSystemsText}
                      {vendor.primaryContactName ? ` • POC: ${vendor.primaryContactName}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`fav-manage-toggle-btn ${isSaved ? "active" : ""}`}
                    onClick={() => onToggleItem("vendor", vendor.id, vendor.name)}
                  >
                    <span>{isSaved ? "★ Saved" : "☆ Add Favorite"}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="fav-modal-footer">
          <span className="fav-manage-summary">
            Currently saved: <strong>{appSet.size}</strong> applications and{" "}
            <strong>{vendorSet.size}</strong> vendors
          </span>
          <button type="button" className="fav-card-btn fav-card-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

