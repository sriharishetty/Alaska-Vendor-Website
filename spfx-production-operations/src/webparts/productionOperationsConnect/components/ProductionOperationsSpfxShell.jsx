import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  getSharePointContext,
  setSpfxWorkbenchUser,
  SPFX_ADMIN_ALLOWLIST
} from '../services/SharePointDataService';
import {
  SpfxHomeView,
  SpfxVendorsDirectoryView,
  SpfxCategoriesView,
  SpfxGroundStopsView,
  SpfxDeploymentReadinessModal
} from './SpfxCoreViews';

// Preserved React Views copied inside src/webparts/productionOperationsConnect/app/
import VendorMaintenance from '../app/pages/VendorMaintenance';
import VendorCaseStatus from '../app/pages/VendorCaseStatus';
import Favorites from '../app/pages/Favorites';
import Reports from '../app/pages/Reports';
import App from '../app/App';

const VIEW_BODY_CLASSES = {
  home: 'scroll-shell ias-shell home-page',
  vendors: 'scroll-shell vendors-page',
  'vendor-maintenance': 'scroll-shell vendors-page',
  'vendor-case-status': 'ias-portal vendors-page',
  categories: 'scroll-shell categories-page',
  'ground-stops': 'scroll-shell ground-stops-page',
  favorites: 'scroll-shell ias-shell favorites-page',
  reports: 'scroll-shell ias-shell reports-page',
  admin: 'ias-shell admin-page'
};

function resolveInternalRoute(rawHref) {
  if (!rawHref || typeof rawHref !== 'string') return null;
  const trimmed = rawHref.trim();
  if (
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('#')
  ) {
    return null;
  }

  let pathname = trimmed;
  let search = '';
  const qIndex = trimmed.indexOf('?');
  if (qIndex !== -1) {
    pathname = trimmed.slice(0, qIndex);
    search = trimmed.slice(qIndex);
  }

  const normalizedPath = pathname.replace(/^\.?\//, '').replace(/^\.\.\//, '').toLowerCase();
  const routeMap = {
    'index.html': 'home',
    'home.html': 'home',
    'vendors.html': 'vendors',
    'vendor-maintenance.html': 'vendor-maintenance',
    'vendor-case-status.html': 'vendor-case-status',
    'categories.html': 'categories',
    'ground-stops.html': 'ground-stops',
    'favorites.html': 'favorites',
    'reports.html': 'reports',
    'admin-react-dist/index.html': 'admin'
  };

  const baseFile = normalizedPath.split('/').pop();
  const viewKey = routeMap[normalizedPath] || routeMap[baseFile];
  if (!viewKey) return null;

  return { viewKey, queryString: search };
}

/**
 * ProductionOperationsSpfxShell
 * Unified SharePoint Framework (SPFx) Full-Bleed React Web Part Shell.
 * Hosts all 9 Production Operations Connect views inside a single SharePoint page
 * without full-page reloads while preserving 100% of existing CSS, components, and data.
 */
export default function ProductionOperationsSpfxShell(props) {
  const initialView = props?.defaultView || 'home';
  const [activeView, setActiveView] = useState(initialView);
  const [viewQueryString, setViewQueryString] = useState('');
  const [vendorsDropdownOpen, setVendorsDropdownOpen] = useState(false);
  const [spContext, setSpContext] = useState(() => getSharePointContext());
  const [readinessOpen, setReadinessOpen] = useState(false);

  const navigateToView = useCallback((viewKey, queryString = '') => {
    if (typeof window !== 'undefined') {
      window.__SPFX_QUERY_STRING__ = queryString || '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setViewQueryString(queryString || '');
    setActiveView(viewKey);
    if (
      viewKey === 'vendors' ||
      viewKey === 'vendor-maintenance' ||
      viewKey === 'vendor-case-status'
    ) {
      setVendorsDropdownOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.className = VIEW_BODY_CLASSES[activeView] || VIEW_BODY_CLASSES.home;
    }
  }, [activeView]);

  useEffect(() => {
    const syncAuth = () => setSpContext(getSharePointContext());
    window.addEventListener('spfx-user-changed', syncAuth);
    window.addEventListener('poc-data-updated', syncAuth);
    return () => {
      window.removeEventListener('spfx-user-changed', syncAuth);
      window.removeEventListener('poc-data-updated', syncAuth);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.__spfxNavigateByHref = (href) => {
      const route = resolveInternalRoute(String(href || ''));
      if (route) {
        navigateToView(route.viewKey, route.queryString);
        return true;
      }
      if (href) {
        window.location.href = href;
      }
      return false;
    };
    return () => {
      delete window.__spfxNavigateByHref;
    };
  }, [navigateToView]);

  const handleDelegatedLinkClick = useCallback(
    (event) => {
      if (event.defaultPrevented) return;
      const anchor = event.target?.closest?.('a[href]');
      if (!anchor) return;
      const rawHref = anchor.getAttribute('href');
      const route = resolveInternalRoute(rawHref);
      if (route) {
        event.preventDefault();
        navigateToView(route.viewKey, route.queryString);
      }
    },
    [navigateToView]
  );

  const isVendorsGroupActive =
    activeView === 'vendors' ||
    activeView === 'vendor-maintenance' ||
    activeView === 'vendor-case-status';

  const handleUserSwitch = (e) => {
    const nextEmail = e.target.value;
    setSpfxWorkbenchUser(nextEmail);
    setSpContext(getSharePointContext());
  };

  const brandLogoUrl =
    (typeof window !== 'undefined' && window.__SPFX_LOGO_URL__) ||
    'public/alaska-logo-white.svg';

  return (
    <div className="spfx-webpart-root" onClick={handleDelegatedLinkClick}>
      {/* Top SharePoint Context & M365 SSO Status Ribbon */}
      <header className="spfx-context-ribbon" role="region" aria-label="SharePoint Framework Context Bar">
        <div className="spfx-ribbon-left">
          <span className="spfx-badge-pill">SPFx Web Part v1.0</span>
          <span className="spfx-ribbon-site">
            {spContext.isLiveSharePoint
              ? `Connected: ${spContext.siteUrl}`
              : 'SharePoint Workbench Mode (37 Vendors & 10 Apps Active)'}
          </span>
        </div>

        <div className="spfx-ribbon-right">
          <button
            type="button"
            className="spfx-readiness-btn"
            onClick={() => setReadinessOpen(true)}
          >
            SPFx Readiness & List Schema
          </button>

          <div className="spfx-user-switcher" title="Microsoft 365 SharePoint Context User">
            <span className="spfx-user-dot" />
            <label htmlFor="spfx-user-select" className="spfx-sr-only">
              Active Microsoft 365 User
            </label>
            <select
              id="spfx-user-select"
              value={spContext.user.email}
              onChange={handleUserSwitch}
              className="spfx-user-select"
            >
              {SPFX_ADMIN_ALLOWLIST.map(email => (
                <option key={email} value={email}>
                  M365 Admin: {email}
                </option>
              ))}
              <option value="ops.viewer@alaskaair.com">
                M365 Viewer: ops.viewer@alaskaair.com (Read-Only)
              </option>
            </select>
          </div>
        </div>
      </header>

      {/* Locked Global Alaska Airlines Sidebar Navigation (Exact Original Structure) */}
      <aside
        className="sidebar ias-sidebar spfx-unified-sidebar"
        aria-label="Primary Sidebar Navigation"
      >
        <a
          href="home.html"
          className="sidebar-brand"
          aria-label="Alaska Airlines Home"
          onClick={e => {
            e.preventDefault();
            navigateToView('home');
          }}
        >
          <img
            src={brandLogoUrl}
            alt="Alaska Airlines"
            className="sidebar-alaska-logo"
          />
        </a>

        <nav className="sidebar-nav" aria-label="Primary Navigation">
          <a
            href="home.html"
            className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault();
              navigateToView('home');
            }}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5.5 9.5V20h13V9.5" />
              </svg>
            </span>
            <span>Home</span>
          </a>

          <div
            className={`nav-dropdown ${
              isVendorsGroupActive || vendorsDropdownOpen ? 'open' : ''
            }`}
          >
            <a
              href="vendors.html"
              className={`nav-item nav-dropdown-toggle ${
                isVendorsGroupActive ? 'active' : ''
              }`}
              onClick={e => {
                e.preventDefault();
                setVendorsDropdownOpen(prev => !prev);
                navigateToView('vendors');
              }}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <circle cx="9" cy="8.5" r="3" />
                  <path d="M3.5 18.5a5.5 5.5 0 0 1 11 0" />
                  <circle cx="17" cy="9.5" r="2.5" />
                  <path d="M14.5 18.5a4.5 4.5 0 0 1 6-4.2" />
                </svg>
              </span>
              <span>Vendors &amp; Partners</span>
              <span className="nav-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </a>
            <div className="nav-dropdown-menu" aria-label="Vendors & Partners submenu">
              <a
                href="vendor-maintenance.html"
                className={`nav-subitem ${
                  activeView === 'vendor-maintenance' ? 'active' : ''
                }`}
                onClick={e => {
                  e.preventDefault();
                  navigateToView('vendor-maintenance');
                }}
              >
                <span className="nav-subitem-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <span>Vendor Maintenance</span>
              </a>
              <a
                href="vendor-case-status.html"
                className={`nav-subitem ${
                  activeView === 'vendor-case-status' ? 'active' : ''
                }`}
                onClick={e => {
                  e.preventDefault();
                  navigateToView('vendor-case-status');
                }}
              >
                <span className="nav-subitem-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <span>Vendor Case Status</span>
              </a>
            </div>
          </div>

          <a
            href="categories.html"
            className={`nav-item ${activeView === 'categories' ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault();
              navigateToView('categories');
            }}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
                <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
                <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <span>System Categories</span>
          </a>

          <a
            href="ground-stops.html"
            className={`nav-item ${activeView === 'ground-stops' ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault();
              navigateToView('ground-stops');
            }}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="4" y="3.5" width="16" height="17" rx="2" />
                <path d="M8 7.5h8" />
                <path d="M8 11.5h8" />
                <path d="M8 15.5h5" />
              </svg>
            </span>
            <span>Operations Directory</span>
          </a>

          <a
            href="favorites.html"
            className={`nav-item ${activeView === 'favorites' ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault();
              navigateToView('favorites');
            }}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="m12 3.5 2.7 5.47 6.04.88-4.37 4.26 1.03 6.01L12 17.28 6.6 20.12l1.03-6.01L3.26 9.85l6.04-.88L12 3.5Z" />
              </svg>
            </span>
            <span>My Favorites</span>
          </a>

          <a
            href="reports.html"
            className={`nav-item ${activeView === 'reports' ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault();
              navigateToView('reports');
            }}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <line x1="5" y1="19" x2="5" y2="11" />
                <line x1="12" y1="19" x2="12" y2="6" />
                <line x1="19" y1="19" x2="19" y2="14" />
              </svg>
            </span>
            <span>Reports &amp; Analytics</span>
          </a>

          <a
            href="admin-react-dist/index.html"
            className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault();
              navigateToView('admin');
            }}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
            </span>
            <span>Admin Settings</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <p className="sidebar-quote">
            <span>PEOPLE.</span>
            <span>PLANES.</span>
            <span>PARTNERS.</span>
            <span>TOMORROW.</span>
          </p>
          <p className="sidebar-copyright">
            Stronger operations
            <br />
            for a brighter tomorrow.
          </p>
        </div>
      </aside>

      {/* Main View Host (Exact Per-Page Main Containers) */}
      {activeView === 'home' && <SpfxHomeView queryString={viewQueryString} />}
      {activeView === 'vendors' && <SpfxVendorsDirectoryView queryString={viewQueryString} />}
      {activeView === 'vendor-maintenance' && (
        <main className="main-content ias-main-content vendors-main" id="vendor-maintenance-root">
          <VendorMaintenance />
        </main>
      )}
      {activeView === 'vendor-case-status' && (
        <main className="main-content ias-main-content vendors-main" id="vendor-case-status-root">
          <VendorCaseStatus />
        </main>
      )}
      {activeView === 'categories' && <SpfxCategoriesView queryString={viewQueryString} />}
      {activeView === 'ground-stops' && <SpfxGroundStopsView queryString={viewQueryString} />}
      {activeView === 'favorites' && (
        <main className="main-content ias-main-content favorites-main" id="favorites-root">
          <Favorites />
        </main>
      )}
      {activeView === 'reports' && (
        <main className="main-content ias-main-content reports-main" id="reports-root">
          <Reports />
        </main>
      )}
      {activeView === 'admin' && (
        <div className="spfx-admin-embedded">
          <App />
        </div>
      )}

      <SpfxDeploymentReadinessModal
        isOpen={readinessOpen}
        onClose={() => setReadinessOpen(false)}
        spContext={spContext}
      />
    </div>
  );
}
