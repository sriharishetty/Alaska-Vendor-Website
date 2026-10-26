import * as React from 'react';
import { useEffect } from 'react';
import '../app/legacyViewsBootstrap';
import {
  getAllApplications,
  getAllVendors,
  getGroundStopApplications,
  getSharePointListProvisioningSchema
} from '../services/SharePointDataService';

/**
 * 1. HOME DASHBOARD VIEW (Exact Original home.html + js/home.js)
 */
export function SpfxHomeView({ queryString = '' }) {
  const htmlTemplate =
    (typeof window !== 'undefined' &&
      window.__SPFX_VIEW_TEMPLATES__ &&
      window.__SPFX_VIEW_TEMPLATES__.home) ||
    '';

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.__SPFX_QUERY_STRING__ = queryString || '';
    const cleanup =
      typeof window.__spfxRunHomeView === 'function'
        ? window.__spfxRunHomeView()
        : undefined;
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [queryString]);

  return (
    <div
      className="spfx-legacy-view-host"
      dangerouslySetInnerHTML={{ __html: htmlTemplate }}
    />
  );
}

/**
 * 2. VENDORS & PARTNERS DIRECTORY VIEW (Exact Original vendors.html + js/vendors.js — All 37 Vendors)
 */
export function SpfxVendorsDirectoryView({ queryString = '' }) {
  const htmlTemplate =
    (typeof window !== 'undefined' &&
      window.__SPFX_VIEW_TEMPLATES__ &&
      window.__SPFX_VIEW_TEMPLATES__.vendors) ||
    '';

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.__SPFX_QUERY_STRING__ = queryString || '';
    const cleanup =
      typeof window.__spfxRunVendorsView === 'function'
        ? window.__spfxRunVendorsView()
        : undefined;
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [queryString]);

  return (
    <div
      className="spfx-legacy-view-host"
      dangerouslySetInnerHTML={{ __html: htmlTemplate }}
    />
  );
}

/**
 * 3. SYSTEM CATEGORIES VIEW (Exact Original categories.html + js/categories.js — All 11 Categories)
 */
export function SpfxCategoriesView({ queryString = '' }) {
  const htmlTemplate =
    (typeof window !== 'undefined' &&
      window.__SPFX_VIEW_TEMPLATES__ &&
      window.__SPFX_VIEW_TEMPLATES__.categories) ||
    '';

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.__SPFX_QUERY_STRING__ = queryString || '';
    const cleanup =
      typeof window.__spfxRunCategoriesView === 'function'
        ? window.__spfxRunCategoriesView()
        : undefined;
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [queryString]);

  return (
    <div
      className="spfx-legacy-view-host"
      dangerouslySetInnerHTML={{ __html: htmlTemplate }}
    />
  );
}

/**
 * 4. OPERATIONS DIRECTORY / GROUND STOPS VIEW (Exact Original ground-stops.html + js/ground-stops.js — All 10 Apps)
 */
export function SpfxGroundStopsView({ queryString = '' }) {
  const htmlTemplate =
    (typeof window !== 'undefined' &&
      window.__SPFX_VIEW_TEMPLATES__ &&
      window.__SPFX_VIEW_TEMPLATES__['ground-stops']) ||
    '';

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.__SPFX_QUERY_STRING__ = queryString || '';
    const cleanup =
      typeof window.__spfxRunGroundStopsView === 'function'
        ? window.__spfxRunGroundStopsView()
        : undefined;
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [queryString]);

  return (
    <div
      className="spfx-legacy-view-host"
      dangerouslySetInnerHTML={{ __html: htmlTemplate }}
    />
  );
}

/**
 * 5. SHAREPOINT DEPLOYMENT & LIST SCHEMA READINESS MODAL
 */
export function SpfxDeploymentReadinessModal({ isOpen, onClose, spContext }) {
  if (!isOpen) return null;
  const schemas = getSharePointListProvisioningSchema();
  const vendorsCount = getAllVendors().length;
  const appsCount = Object.keys(getAllApplications()).length;
  const groundStopCount = getGroundStopApplications().length;

  return (
    <div className="spfx-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="spfx-modal-dialog" onClick={e => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '16px'
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#0284c7'
              }}
            >
              SHAREPOINT FRAMEWORK (SPFx) READINESS
            </span>
            <h2 style={{ margin: '4px 0 0', fontSize: '20px', color: '#0f172a' }}>
              Production Operations Connect — Step 1 Verification
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #cbd5e1',
              background: '#fff',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '18px'
          }}
        >
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>PRESERVED VENDORS</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#14532d' }}>{vendorsCount} / 37</div>
            <div style={{ fontSize: '12px', color: '#15803d' }}>0 duplicates • Master rows 2–38</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af' }}>APPLICATIONS</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e3a8a' }}>{appsCount} Total</div>
            <div style={{ fontSize: '12px', color: '#1d4ed8' }}>{groundStopCount} Ground Stop Cards + Custom</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>M365 AUTH CONTEXT</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {spContext.user.email}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Role: {spContext.isAuthorizedAdmin ? 'Authorized Admin' : 'Standard Viewer'}
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Target SharePoint Lists (Prepared for Step 2 — Not Provisioned Yet)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
          {schemas.map(list => (
            <div
              key={list.title}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{list.title}</strong>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
                  {list.columns.length} Columns
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{list.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
