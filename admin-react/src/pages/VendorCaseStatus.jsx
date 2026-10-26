import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  AUTHORIZED_ADMINS,
  getAdminSession,
  authenticateAdminSession,
  getVendorCaseStatusRecords,
  calculateVendorCaseStatusSummary,
  getVendorCaseStatusFilterOptions,
  filterVendorCaseStatusRecords,
  saveVendorPortalConfiguration,
  isValidPortalUrl
} from "../services/vendorCaseStatusService";

const INITIAL_FILTERS = {
  search: "",
  vendor: "",
  system: "",
  category: "",
  portalStatus: ""
};

const AVATAR_PALETTES = [
  { bg: "#0050c8", fg: "#ffffff" },
  { bg: "#1e1b8b", fg: "#ffffff" },
  { bg: "#034687", fg: "#ffffff" },
  { bg: "#0d5c75", fg: "#ffffff" },
  { bg: "#1d4ed8", fg: "#ffffff" },
  { bg: "#0f766e", fg: "#ffffff" },
  { bg: "#4338ca", fg: "#ffffff" },
  { bg: "#0369a1", fg: "#ffffff" }
];

function getVendorMonogram(name) {
  const cleaned = String(name || "VN")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || "VN";
}

function getAvatarPalette(seed = "") {
  let hash = 0;
  const text = String(seed);
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

export default function VendorCaseStatus() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [adminSession, setAdminSession] = useState(() => getAdminSession());
  const [toastMessage, setToastMessage] = useState(null);

  // Admin Login Modal state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingVendorAfterLogin, setPendingVendorAfterLogin] = useState(null);
  const [loginEmail, setLoginEmail] = useState(AUTHORIZED_ADMINS[0]);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Admin Portal Configuration Modal state
  const [editingRecord, setEditingRecord] = useState(null);
  const [formPortalUrl, setFormPortalUrl] = useState("");
  const [formPortalStatus, setFormPortalStatus] = useState("Not Configured");
  const [formLastVerifiedDate, setFormLastVerifiedDate] = useState("");
  const [formPortalNotes, setFormPortalNotes] = useState("");
  const [formAssociatedApps, setFormAssociatedApps] = useState([]);
  const [customAppInput, setCustomAppInput] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadRecords = useCallback(() => {
    const loaded = getVendorCaseStatusRecords();
    setRecords(loaded);
  }, []);

  useEffect(() => {
    loadRecords();
    const handleStorage = () => {
      loadRecords();
      setAdminSession(getAdminSession());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadRecords]);

  const showToast = useCallback((text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev && prev.text === text ? null : prev));
    }, 4000);
  }, []);

  const summary = useMemo(
    () => calculateVendorCaseStatusSummary(records),
    [records]
  );

  const filterOptions = useMemo(
    () => getVendorCaseStatusFilterOptions(records),
    [records]
  );

  const filteredRecords = useMemo(
    () => filterVendorCaseStatusRecords(records, filters),
    [records, filters]
  );

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.vendor ||
      filters.system ||
      filters.category ||
      filters.portalStatus
  );

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const openEditorForRecord = useCallback(record => {
    setEditingRecord(record);
    setFormPortalUrl(record.portalUrl || "");
    setFormPortalStatus(
      record.isVerified
        ? "Verified"
        : record.isConfigured
        ? "Configured"
        : "Not Configured"
    );
    setFormLastVerifiedDate(record.lastVerifiedDate || "");
    setFormPortalNotes(record.portalNotes || "");
    setFormAssociatedApps(
      Array.isArray(record.associatedApplications)
        ? [...record.associatedApplications]
        : []
    );
    setCustomAppInput("");
    setFormError("");
  }, []);

  const handleRequestConfigure = record => {
    const currentSession = getAdminSession();
    setAdminSession(currentSession);
    if (!currentSession.isAuthenticated) {
      setPendingVendorAfterLogin(record);
      setLoginError("");
      setLoginPassword("");
      setLoginModalOpen(true);
      return;
    }
    openEditorForRecord(record);
  };

  const handleAdminSignIn = e => {
    e.preventDefault();
    const result = authenticateAdminSession(loginEmail, loginPassword);
    if (!result.ok) {
      setLoginError(result.error);
      return;
    }
    const updatedSession = getAdminSession();
    setAdminSession(updatedSession);
    setLoginModalOpen(false);
    setLoginPassword("");
    setLoginError("");
    showToast(`Signed in as ${result.email}`);
    if (pendingVendorAfterLogin) {
      const target = pendingVendorAfterLogin;
      setPendingVendorAfterLogin(null);
      openEditorForRecord(target);
    }
  };

  const handleAdminSignOut = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("productionOperationsAdminAuthenticated");
    }
    setAdminSession(getAdminSession());
    showToast("Admin session locked.", "info");
  };

  const handleCheckAndVerifyUrl = () => {
    const trimmed = String(formPortalUrl || "").trim();
    if (!isValidPortalUrl(trimmed)) {
      setFormError(
        "Enter a valid http:// or https:// portal URL before verifying the link."
      );
      return;
    }
    window.open(trimmed, "_blank", "noopener,noreferrer");
    const todayIso = new Date().toISOString().slice(0, 10);
    setFormPortalStatus("Verified");
    setFormLastVerifiedDate(todayIso);
    setFormError("");
  };

  const handleToggleAssociatedApp = appName => {
    if (!appName) return;
    setFormAssociatedApps(prev => {
      const exists = prev.some(a => a.toLowerCase() === appName.toLowerCase());
      if (exists) {
        return prev.filter(a => a.toLowerCase() !== appName.toLowerCase());
      }
      return [...prev, appName];
    });
  };

  const handleAddCustomApp = () => {
    const trimmed = String(customAppInput || "").trim();
    if (!trimmed) return;
    setFormAssociatedApps(prev => {
      if (prev.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return [...prev, trimmed];
    });
    setCustomAppInput("");
  };

  const handleSavePortalConfig = async e => {
    e.preventDefault();
    if (!editingRecord) return;
    setFormError("");

    const trimmedUrl = String(formPortalUrl || "").trim();
    if (trimmedUrl && !isValidPortalUrl(trimmedUrl)) {
      setFormError(
        "Please enter a valid portal URL starting with http:// or https:// (or leave blank for Not Configured)."
      );
      return;
    }

    if (formPortalStatus === "Verified" && !trimmedUrl) {
      setFormError("A valid portal URL is required before marking a portal as Verified.");
      return;
    }

    if (formPortalStatus === "Verified" && !formLastVerifiedDate) {
      setFormError(
        "Please record the Last Verified Date or click 'Check & Verify Link' to confirm the portal was checked."
      );
      return;
    }

    setIsSaving(true);
    try {
      const effectiveStatus = !trimmedUrl
        ? "Not Configured"
        : formPortalStatus === "Verified"
        ? "Verified"
        : "Configured";

      await saveVendorPortalConfiguration(
        editingRecord.id || editingRecord.sourceRow,
        {
          portalUrl: trimmedUrl,
          portalStatus: effectiveStatus,
          lastVerifiedDate:
            effectiveStatus === "Verified"
              ? formLastVerifiedDate || new Date().toISOString().slice(0, 10)
              : formLastVerifiedDate,
          portalNotes: formPortalNotes,
          associatedApplications: formAssociatedApps
        },
        adminSession.email
      );

      loadRecords();
      setEditingRecord(null);
      showToast(
        `Saved portal configuration for ${editingRecord.vendorName} (${editingRecord.primarySystem}).`
      );
    } catch (err) {
      setFormError(err?.message || "Unable to save portal configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="vcs-page-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`vcs-toast ${
            toastMessage.type === "info" ? "vcs-toast-info" : "vcs-toast-success"
          }`}
          role="status"
        >
          <span>{toastMessage.text}</span>
          <button
            type="button"
            className="vcs-toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <header className="vcs-page-header">
        <div className="vcs-page-header-left">
          <div className="vcs-breadcrumb-row">
            <span className="vcs-breadcrumb-pill">Vendors &amp; Partners</span>
            <span className="vcs-breadcrumb-sep">/</span>
            <span className="vcs-breadcrumb-current">Vendor Case Status</span>
          </div>
          <h1 className="vcs-page-title">Vendor Case Status</h1>
          <p className="vcs-page-subtitle">
            Centralized directory of vendor support portals, case tracking systems, and operational application relationships across all {summary.totalVendorRecords} vendor records.
          </p>
        </div>

        <div className="vcs-page-header-actions">
          {adminSession.isAuthenticated ? (
            <div className="vcs-admin-status-bar">
              <span className="vcs-admin-active-badge">
                <span className="vcs-status-dot vcs-dot-green" />
                Admin Unlocked ({adminSession.email?.split("@")[0] || "Admin"})
              </span>
              <button
                type="button"
                className="vcs-btn vcs-btn-outline"
                onClick={handleAdminSignOut}
              >
                Lock Admin
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="vcs-btn vcs-btn-secondary"
              onClick={() => {
                setPendingVendorAfterLogin(null);
                setLoginError("");
                setLoginModalOpen(true);
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Admin Portal Management</span>
            </button>
          )}
        </div>
      </header>

      {/* 4 Summary Cards */}
      <section className="vendor-kpi-row vcs-kpi-row" aria-label="Vendor Case Status Summary">
        <div
          className={`vendor-kpi-card vcs-kpi-card ${
            !hasActiveFilters ? "vcs-kpi-card-active" : ""
          }`}
          onClick={handleClearFilters}
          role="button"
          tabIndex={0}
          onKeyDown={e => (e.key === "Enter" || e.key === " ") && handleClearFilters()}
          title="Show all 37 vendor records"
        >
          <div className="vendor-kpi-icon kpi-blue" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.9" />
              <path
                d="M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="vendor-kpi-body">
            <div className="vendor-kpi-value" data-testid="kpi-total-records">
              {summary.totalVendorRecords}
            </div>
            <div className="vendor-kpi-title">Total Vendor Records</div>
            <div className="vendor-kpi-sub">
              All {summary.totalVendorRecords} source directory rows
            </div>
          </div>
          <span className="vendor-kpi-chevron" aria-hidden="true">
            ›
          </span>
        </div>

        <div className="vendor-kpi-card vcs-kpi-card">
          <div className="vendor-kpi-icon kpi-green" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 21H21M5 21V5C5 4.44772 5.44772 4 6 4H14C14.5523 4 15 4.44772 15 5V21M15 9H18C18.5523 9 19 9.44772 19 10V21"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 8H12M8 12H12M8 16H12"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="vendor-kpi-body">
            <div className="vendor-kpi-value" data-testid="kpi-unique-vendors">
              {summary.totalUniqueVendors}
            </div>
            <div className="vendor-kpi-title">Total Unique Vendors</div>
            <div className="vendor-kpi-sub">
              Distinct vendor companies across {summary.totalVendorRecords} records
            </div>
          </div>
          <span className="vendor-kpi-chevron" aria-hidden="true">
            ›
          </span>
        </div>

        <div className="vendor-kpi-card vcs-kpi-card">
          <div className="vendor-kpi-icon kpi-purple" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polygon
                points="12 2 2 7 12 12 22 7 12 2"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="2 17 12 22 22 17"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="2 12 12 17 22 12"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="vendor-kpi-body">
            <div className="vendor-kpi-value" data-testid="kpi-total-systems">
              {summary.totalSystemsApplications}
            </div>
            <div className="vendor-kpi-title">Total Systems / Applications</div>
            <div className="vendor-kpi-sub">
              {summary.totalVendorAppRelationships} vendor-application relationships
            </div>
          </div>
          <span className="vendor-kpi-chevron" aria-hidden="true">
            ›
          </span>
        </div>

        <div
          className={`vendor-kpi-card vcs-kpi-card ${
            filters.portalStatus === "Configured" ? "vcs-kpi-card-active" : ""
          }`}
          onClick={() =>
            handleFilterChange(
              "portalStatus",
              filters.portalStatus === "Configured" ? "" : "Configured"
            )
          }
          role="button"
          tabIndex={0}
          onKeyDown={e =>
            (e.key === "Enter" || e.key === " ") &&
            handleFilterChange(
              "portalStatus",
              filters.portalStatus === "Configured" ? "" : "Configured"
            )
          }
          title="Click to filter by Configured Portal Links"
        >
          <div className="vendor-kpi-icon kpi-orange" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="vendor-kpi-body">
            <div className="vendor-kpi-value" data-testid="kpi-configured-portals">
              {summary.configuredPortalLinks}
            </div>
            <div className="vendor-kpi-title">Configured Portal Links</div>
            <div className="vendor-kpi-sub">
              {summary.verifiedPortalLinks} verified · {summary.unconfiguredPortalLinks} not configured
            </div>
          </div>
          <span className="vendor-kpi-chevron" aria-hidden="true">
            ›
          </span>
        </div>
      </section>

      {/* Search and Filter Controls */}
      <section className="vcs-filter-panel" aria-label="Search and filter vendor portals">
        <div className="vcs-filter-row">
          <div className="vcs-search-box">
            <svg
              className="vcs-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className="vcs-search-input"
              placeholder="Search by vendor name, system/application, category, or portal URL..."
              value={filters.search}
              onChange={e => handleFilterChange("search", e.target.value)}
              aria-label="Search vendor case status records"
            />
          </div>

          <div className="vcs-select-group">
            <select
              className="vcs-filter-select"
              value={filters.vendor}
              onChange={e => handleFilterChange("vendor", e.target.value)}
              aria-label="Filter by Vendor"
            >
              <option value="">All Vendors ({filterOptions.vendors.length})</option>
              {filterOptions.vendors.map(vendor => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>

            <select
              className="vcs-filter-select"
              value={filters.system}
              onChange={e => handleFilterChange("system", e.target.value)}
              aria-label="Filter by System or Application"
            >
              <option value="">
                All Systems / Applications ({filterOptions.systems.length})
              </option>
              {filterOptions.systems.map(system => (
                <option key={system} value={system}>
                  {system}
                </option>
              ))}
            </select>

            <select
              className="vcs-filter-select"
              value={filters.category}
              onChange={e => handleFilterChange("category", e.target.value)}
              aria-label="Filter by Category"
            >
              <option value="">All Categories ({filterOptions.categories.length})</option>
              {filterOptions.categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              className="vcs-filter-select"
              value={filters.portalStatus}
              onChange={e => handleFilterChange("portalStatus", e.target.value)}
              aria-label="Filter by Portal Status"
            >
              <option value="">All Portal Statuses</option>
              <option value="Configured">Configured ({summary.configuredPortalLinks})</option>
              <option value="Not Configured">
                Not Configured ({summary.unconfiguredPortalLinks})
              </option>
              <option value="Verified">Verified ({summary.verifiedPortalLinks})</option>
            </select>

            <button
              type="button"
              className="vcs-clear-btn"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        <div className="vcs-results-meta">
          <span>
            Showing <strong>{filteredRecords.length}</strong> of{" "}
            <strong>{summary.totalVendorRecords}</strong> vendor records
          </span>
          {hasActiveFilters && (
            <span className="vcs-active-filter-hint">
              Filtered view active — click <strong>Clear Filters</strong> to reset
            </span>
          )}
        </div>
      </section>

      {/* Vendor Case Status Table */}
      <section className="vcs-table-card" aria-label="Vendor Case Status Directory Table">
        <div className="vcs-table-responsive">
          <table className="vcs-table">
            <thead>
              <tr>
                <th scope="col">Vendor Name</th>
                <th scope="col">System / Application</th>
                <th scope="col">Category</th>
                <th scope="col">Vendor Portal</th>
                <th scope="col">Portal Status</th>
                <th scope="col" className="vcs-col-action">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="vcs-empty-cell">
                    <div className="vcs-empty-state">
                      <div className="vcs-empty-title">
                        No matching vendor records found
                      </div>
                      <p className="vcs-empty-text">
                        No vendor records match your current search or filter criteria.
                      </p>
                      <button
                        type="button"
                        className="vcs-btn vcs-btn-primary"
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const palette = getAvatarPalette(record.vendorName);
                  const monogram = getVendorMonogram(record.vendorName);

                  return (
                    <tr key={record.id} data-vendor-id={record.id}>
                      {/* Column 1: Vendor Name */}
                      <td className="vcs-cell-vendor">
                        <div className="vcs-vendor-identity">
                          <div
                            className="vcs-vendor-avatar"
                            style={{
                              backgroundColor: palette.bg,
                              color: palette.fg
                            }}
                            aria-hidden="true"
                          >
                            {monogram}
                          </div>
                          <div className="vcs-vendor-name-wrap">
                            <div className="vcs-vendor-name-line">
                              <span className="vcs-vendor-name">
                                {record.vendorName}
                              </span>
                              {record.isInternalOrNaVendor && (
                                <span
                                  className="vcs-internal-tag"
                                  title="Source vendor field is NA (Internal / AAG supported)"
                                >
                                  Internal / NA
                                </span>
                              )}
                            </div>
                            <div className="vcs-vendor-meta-line">
                              <span className="vcs-row-id-tag">
                                Row #{record.sourceRow}
                              </span>
                              {record.allSystems.length > 1 && (
                                <span
                                  className="vcs-multi-app-tag"
                                  title={`Supports ${record.allSystems.length} systems/applications: ${record.allSystems.join(", ")}`}
                                >
                                  {record.allSystems.length} Applications
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: System / Application */}
                      <td className="vcs-cell-system">
                        <div className="vcs-primary-system">
                          {record.primarySystem}
                        </div>
                        {record.relatedSystems.length > 0 && (
                          <div className="vcs-related-systems">
                            <span className="vcs-related-label">
                              Also supports:
                            </span>
                            <div className="vcs-related-chips">
                              {record.relatedSystems.map(sys => (
                                <span key={sys} className="vcs-system-chip">
                                  {sys}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Category */}
                      <td className="vcs-cell-category">
                        <span className="vcs-category-pill">
                          {record.category}
                        </span>
                      </td>

                      {/* Column 4: Vendor Portal */}
                      <td className="vcs-cell-portal">
                        {record.isConfigured ? (
                          <div className="vcs-portal-configured-wrap">
                            <a
                              href={record.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="vcs-portal-link"
                              title={`Open ${record.portalUrl} in a new tab`}
                            >
                              <span className="vcs-portal-url-text">
                                {record.portalUrl}
                              </span>
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                            {record.portalNotes ? (
                              <div className="vcs-portal-notes">
                                {record.portalNotes}
                              </div>
                            ) : record.portalSource ? (
                              <div className="vcs-portal-source">
                                {record.portalSource}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="vcs-portal-missing-wrap">
                            <span className="vcs-portal-not-configured">
                              Portal Not Configured
                            </span>
                            {record.portalNotes && (
                              <div className="vcs-portal-notes">
                                {record.portalNotes}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Portal Status */}
                      <td className="vcs-cell-status">
                        {record.isConfigured ? (
                          <div className="vcs-status-stack">
                            <span className="vcs-status-badge vcs-badge-configured">
                              <span className="vcs-status-dot vcs-dot-green" />
                              Configured
                            </span>
                            {record.isVerified && (
                              <span
                                className="vcs-verified-pill"
                                title={`Verified on ${record.lastVerifiedDate}${
                                  record.lastVerifiedBy
                                    ? ` by ${record.lastVerifiedBy}`
                                    : ""
                                }`}
                              >
                                ✓ Verified ({record.lastVerifiedDate})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="vcs-status-badge vcs-badge-unconfigured">
                            <span className="vcs-status-dot vcs-dot-gray" />
                            Not Configured
                          </span>
                        )}
                      </td>

                      {/* Column 6: Action */}
                      <td className="vcs-cell-action">
                        <div className="vcs-action-group">
                          {record.isConfigured ? (
                            <a
                              href={record.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="vcs-btn vcs-btn-primary vcs-open-portal-btn"
                            >
                              <span>Open Portal</span>
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="vcs-btn vcs-btn-disabled vcs-open-portal-btn"
                              disabled
                              title="Portal Not Configured — add a portal URL via Admin Configure"
                            >
                              <span>Open Portal</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="vcs-btn vcs-btn-admin-edit"
                            onClick={() => handleRequestConfigure(record)}
                            title={
                              record.isConfigured
                                ? `Edit portal configuration for ${record.vendorName}`
                                : `Add portal URL for ${record.vendorName}`
                            }
                          >
                            {record.isConfigured ? "Edit" : "+ Add URL"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin Sign-In Modal (rendered in document.body portal) */}
      {loginModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="vcs-modal-backdrop"
            onClick={() => setLoginModalOpen(false)}
          >
            <div
              className="vcs-modal-dialog vcs-modal-sm"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="vcs-login-modal-title"
            >
              <div className="vcs-modal-header">
                <div>
                  <h2 id="vcs-login-modal-title" className="vcs-modal-title">
                    Admin Authorization Required
                  </h2>
                  <p className="vcs-modal-subtitle">
                    Sign in with your Alaska Airlines administrator account to add or update vendor portal URLs.
                  </p>
                </div>
                <button
                  type="button"
                  className="vcs-modal-close"
                  onClick={() => setLoginModalOpen(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAdminSignIn} className="vcs-modal-form">
                {loginError && (
                  <div className="vcs-form-error" role="alert">
                    {loginError}
                  </div>
                )}

                <label className="vcs-field-label">
                  <span>Authorized Admin Email</span>
                  <select
                    className="vcs-input"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                  >
                    {AUTHORIZED_ADMINS.map(email => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="vcs-field-label">
                  <span>Admin Password</span>
                  <input
                    type="password"
                    className="vcs-input"
                    placeholder="Enter administrator password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    autoFocus
                  />
                </label>

                <div className="vcs-modal-footer">
                  <button
                    type="button"
                    className="vcs-btn vcs-btn-outline"
                    onClick={() => setLoginModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="vcs-btn vcs-btn-primary">
                    Unlock Admin Controls
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Admin Portal Configuration Modal (rendered in document.body portal) */}
      {editingRecord &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="vcs-modal-backdrop"
            onClick={() => setEditingRecord(null)}
          >
            <div
              className="vcs-modal-dialog"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="vcs-config-modal-title"
            >
              <div className="vcs-modal-header">
                <div>
                  <div className="vcs-modal-kicker">
                    Vendor Record #{editingRecord.sourceRow} · ID:{" "}
                    {editingRecord.id}
                  </div>
                  <h2 id="vcs-config-modal-title" className="vcs-modal-title">
                    Configure Vendor Portal — {editingRecord.vendorName}
                  </h2>
                  <p className="vcs-modal-subtitle">
                    Primary System: <strong>{editingRecord.primarySystem}</strong>{" "}
                    · Category: <strong>{editingRecord.category}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="vcs-modal-close"
                  onClick={() => setEditingRecord(null)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSavePortalConfig} className="vcs-modal-form">
                {formError && (
                  <div className="vcs-form-error" role="alert">
                    {formError}
                  </div>
                )}

                <div className="vcs-field-group">
                  <label className="vcs-field-label" htmlFor="vcs-portal-url-input">
                    <span>Vendor Support Portal URL</span>
                    <span className="vcs-field-hint">
                      Enter the official vendor support or case portal URL (http:// or https://). Leave empty if not configured.
                    </span>
                  </label>
                  <div className="vcs-url-input-row">
                    <input
                      id="vcs-portal-url-input"
                      type="url"
                      className="vcs-input"
                      placeholder="https://support.vendor-domain.com"
                      value={formPortalUrl}
                      onChange={e => {
                        const val = e.target.value;
                        setFormPortalUrl(val);
                        if (!val.trim()) {
                          setFormPortalStatus("Not Configured");
                        } else if (formPortalStatus === "Not Configured") {
                          setFormPortalStatus("Configured");
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="vcs-btn vcs-btn-secondary vcs-verify-btn"
                      onClick={handleCheckAndVerifyUrl}
                      title="Open URL in a new tab to verify it works and stamp today's verification date"
                    >
                      Check &amp; Verify Link ↗
                    </button>
                  </div>
                </div>

                <div className="vcs-form-grid-2">
                  <label className="vcs-field-label">
                    <span>Portal Configuration Status</span>
                    <select
                      className="vcs-input"
                      value={formPortalStatus}
                      onChange={e => {
                        const next = e.target.value;
                        setFormPortalStatus(next);
                        if (next === "Verified" && !formLastVerifiedDate) {
                          setFormLastVerifiedDate(
                            new Date().toISOString().slice(0, 10)
                          );
                        }
                      }}
                    >
                      <option value="Not Configured">Not Configured</option>
                      <option value="Configured">Configured</option>
                      <option value="Verified">
                        Verified (Checked by Admin)
                      </option>
                    </select>
                  </label>

                  <label className="vcs-field-label">
                    <span>Last Verified Date</span>
                    <input
                      type="date"
                      className="vcs-input"
                      value={formLastVerifiedDate}
                      onChange={e => setFormLastVerifiedDate(e.target.value)}
                    />
                  </label>
                </div>

                <div className="vcs-field-group">
                  <span className="vcs-field-label-title">
                    Associated Systems / Applications
                  </span>
                  <span className="vcs-field-hint">
                    Primary record system is{" "}
                    <strong>{editingRecord.primarySystem}</strong>. Select additional existing applications supported by this vendor:
                  </span>
                  <div className="vcs-app-checklist">
                    {filterOptions.systems
                      .filter(
                        sys =>
                          sys.toLowerCase() !==
                          editingRecord.primarySystem.toLowerCase()
                      )
                      .slice(0, 18)
                      .map(sysName => {
                        const isChecked =
                          formAssociatedApps.some(
                            a => a.toLowerCase() === sysName.toLowerCase()
                          ) ||
                          editingRecord.relatedSystems.some(
                            a => a.toLowerCase() === sysName.toLowerCase()
                          );
                        return (
                          <label key={sysName} className="vcs-app-check-item">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleAssociatedApp(sysName)}
                            />
                            <span>{sysName}</span>
                          </label>
                        );
                      })}
                  </div>
                  <div className="vcs-custom-app-row">
                    <input
                      type="text"
                      className="vcs-input"
                      placeholder="Associate another existing application name..."
                      value={customAppInput}
                      onChange={e => setCustomAppInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="vcs-btn vcs-btn-outline"
                      onClick={handleAddCustomApp}
                    >
                      + Associate App
                    </button>
                  </div>
                </div>

                <label className="vcs-field-label">
                  <span>Internal Notes (Account IDs, Login Guidance, Escalation Info)</span>
                  <textarea
                    className="vcs-textarea"
                    rows={3}
                    placeholder="Add internal operational notes for accessing this vendor's case portal..."
                    value={formPortalNotes}
                    onChange={e => setFormPortalNotes(e.target.value)}
                  />
                </label>

                <div className="vcs-modal-footer">
                  <button
                    type="button"
                    className="vcs-btn vcs-btn-outline"
                    onClick={() => setEditingRecord(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="vcs-btn vcs-btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Portal Configuration"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
