import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  INTEGRATION_STATES,
  DEMO_MAINTENANCE_RECORDS,
  calculateMaintenanceSummary,
  filterAndSortMaintenanceRecords
} from '../types/vendorMaintenance';
import {
  fetchVendorMaintenanceList,
  fetchVendorMaintenanceById,
  ingestOutlookVendorEmail,
  reprocessMaintenanceRecord,
  updateMaintenanceRecordStatus,
  fetchMaintenanceAdminSettings,
  saveMaintenanceAdminSettings,
  getAdminSession
} from '../services/vendorMaintenanceService';
import MaintenanceSummaryCards from '../components/maintenance/MaintenanceSummaryCards';
import MaintenanceFilters from '../components/maintenance/MaintenanceFilters';
import MaintenanceTable from '../components/maintenance/MaintenanceTable';
import MaintenanceEmptyState from '../components/maintenance/MaintenanceEmptyState';
import MaintenanceLoadingState from '../components/maintenance/MaintenanceLoadingState';
import MaintenanceErrorState from '../components/maintenance/MaintenanceErrorState';
import MaintenanceDetailsPanel from '../components/maintenance/MaintenanceDetailsPanel';
import MaintenanceAdminSettingsPanel from '../components/maintenance/MaintenanceAdminSettingsPanel';

const INITIAL_FILTERS = {
  vendorName: '',
  emailSubject: '',
  application: '',
  senderEmail: '',
  updateType: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'receivedDate',
  sortOrder: 'desc'
};

const SAMPLE_WEBHOOK_TEMPLATES = [
  {
    label: 'Scheduled Maintenance (Smart4Aviation / S4A)',
    from: 'Smart4Aviation Support <support@smart4aviation.aero>',
    subject: '[SCHEDULED MAINTENANCE] S4A Weight & Balance Upgrade Window',
    bodyText:
      'Scheduled maintenance will be performed on S4A - Smart4Aviation/Weight and Balance.\nMaintenance Start: 2026-11-15T06:00:00Z\nMaintenance End: 2026-11-15T08:00:00Z\nTime Zone: UTC\nImpact: Brief 5-minute dispatch load sheet Failover during database switchover.',
    bodyHtml:
      '<div><p><strong>Scheduled Maintenance Notice:</strong> S4A Weight &amp; Balance Upgrade</p><table><thead><tr><th>System</th><th>Start (UTC)</th><th>End (UTC)</th><th>Impact</th></tr></thead><tbody><tr><td>S4A Weight &amp; Balance</td><td>2026-11-15 06:00 UTC</td><td>2026-11-15 08:00 UTC</td><td>Brief 5-min failover</td></tr></tbody></table></div>',
    webLink: 'https://outlook.office365.com/owa/?ItemID=AAMkAGVmMDEzMTM4LTg4AC1B',
    conversationId: 'AAQkAGVmMDEzMTM4-CONV-S4A-100'
  },
  {
    label: 'Service Outage (SITA / ACARS)',
    from: 'SITA Operations <acars.support@sita.aero>',
    subject: '[URGENT OUTAGE] Unplanned ACARS Ground Station Degradation - US West',
    bodyText:
      'We are currently investigating an unplanned service outage affecting ACARS VHF air-ground datalink processors in the Pacific Northwest region.\nImpact: Delayed OOOI messages and flight plan uplink retries.\nTime Zone: PST',
    bodyHtml:
      '<p><strong>URGENT SERVICE OUTAGE:</strong> Investigating ACARS VHF datalink degradation in US West (PST).</p>',
    webLink: 'https://outlook.office.com/mail/inbox/id/AAQkAGVmMDEzMTM4-SITA-200',
    conversationId: 'AAQkAGVmMDEzMTM4-CONV-SITA-200'
  },
  {
    label: 'Follow-up Completion Confirmation (S4A)',
    from: 'Smart4Aviation Support <support@smart4aviation.aero>',
    subject: 'RE: [SCHEDULED MAINTENANCE] S4A Weight & Balance Upgrade Window - Completed',
    bodyText:
      'Maintenance completed. All systems operational and services have been restored following the S4A Weight & Balance upgrade window.',
    bodyHtml:
      '<p><strong>Update:</strong> Maintenance completed. All systems operational and services have been restored.</p>',
    webLink: 'https://outlook.office365.com/owa/?ItemID=AAMkAGVmMDEzMTM4-S4A-101',
    conversationId: 'AAQkAGVmMDEzMTM4-CONV-S4A-100'
  },
  {
    label: 'Unknown Vendor / Missing Dates (Requires Review)',
    from: 'External Cloud Relay <noc-alerts@unregistered-vendor-example.net>',
    subject: 'Notice regarding upcoming certificate rotation',
    bodyText:
      'Please be advised our engineering team will rotate TLS certificates during an upcoming window. Contact NOC if you experience connectivity issues.',
    bodyHtml:
      '<p>Please be advised our engineering team will rotate TLS certificates during an upcoming window.</p>',
    webLink: '',
    conversationId: 'AAQkAGVmMDEzMTM4-CONV-UNK-300'
  }
];

export default function VendorMaintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [integrationState, setIntegrationState] = useState(INTEGRATION_STATES.NOT_CONFIGURED);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [adminSettings, setAdminSettings] = useState(null);

  const [showDemoData, setShowDemoData] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsInitialTab, setDetailsInitialTab] = useState('overview');
  const [refreshingId, setRefreshingId] = useState(null);

  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [simForm, setSimForm] = useState({
    from: SAMPLE_WEBHOOK_TEMPLATES[0].from,
    subject: SAMPLE_WEBHOOK_TEMPLATES[0].subject,
    bodyText: SAMPLE_WEBHOOK_TEMPLATES[0].bodyText,
    bodyHtml: SAMPLE_WEBHOOK_TEMPLATES[0].bodyHtml,
    webLink: SAMPLE_WEBHOOK_TEMPLATES[0].webLink,
    conversationId: SAMPLE_WEBHOOK_TEMPLATES[0].conversationId,
    internetMessageId: `<sim-${Date.now()}@smart4aviation.aero>`
  });
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [simFeedback, setSimFeedback] = useState(null);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const adminSession = useMemo(() => getAdminSession(), []);
  const isAdmin = Boolean(adminSession?.authenticated);

  const masterData = useMemo(() => {
    if (typeof window !== 'undefined') {
      const md = window.masterData || window.POC_MASTER_DATA || window.PRODUCTION_OPERATIONS_DATA;
      if (md) {
        const vendors = Array.isArray(md.vendors) ? md.vendors : Object.values(md.vendors || {});
        const applications = Array.isArray(md.applications) ? md.applications : Object.values(md.applications || {});
        return { vendors, applications };
      }
    }
    return { vendors: [], applications: [] };
  }, []);

  const loadMaintenanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listResult, settingsResult] = await Promise.all([
        fetchVendorMaintenanceList(),
        fetchMaintenanceAdminSettings()
      ]);

      setRecords(Array.isArray(listResult.records) ? listResult.records : []);
      setIntegrationState(
        listResult.integrationState || INTEGRATION_STATES.NOT_CONFIGURED
      );
      setLastSyncAt(listResult.lastSyncAt || null);
      if (settingsResult?.settings) {
        setAdminSettings(settingsResult.settings);
      }
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load vendor maintenance updates. Please check service availability.'
      );
      setIntegrationState(INTEGRATION_STATES.UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaintenanceData();
  }, [loadMaintenanceData]);

  // Active dataset (production records OR explicitly toggled DEMO DATA preview)
  const activeRecords = useMemo(() => {
    if (showDemoData) {
      return DEMO_MAINTENANCE_RECORDS;
    }
    return records;
  }, [showDemoData, records]);

  // Summary metrics calculated strictly from actual active records
  const summaryMetrics = useMemo(() => {
    return calculateMaintenanceSummary(activeRecords);
  }, [activeRecords]);

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    return filterAndSortMaintenanceRecords(activeRecords, filters);
  }, [activeRecords, filters]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.vendorName ||
        filters.emailSubject ||
        filters.application ||
        filters.senderEmail ||
        filters.updateType ||
        filters.status ||
        filters.dateFrom ||
        filters.dateTo
    );
  }, [filters]);

  // Available application options from master data + records
  const applicationOptions = useMemo(() => {
    const set = new Set();
    (masterData.applications || []).forEach((app) => {
      if (app?.name) set.add(app.name);
    });
    activeRecords.forEach((rec) => {
      if (rec?.applicationName && rec.applicationName !== 'Unknown') {
        set.add(rec.applicationName);
      }
    });
    return Array.from(set).sort();
  }, [masterData.applications, activeRecords]);

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  const handleViewDetails = (record, tab = 'overview') => {
    setSelectedRecord(record);
    setDetailsInitialTab(tab);
  };

  const handleViewHistory = (record) => {
    setSelectedRecord(record);
    setDetailsInitialTab('history');
  };

  const handleRefreshSingleRecord = async (record) => {
    if (record.isDemo) return;
    setRefreshingId(record.id);
    try {
      const refreshed = await fetchVendorMaintenanceById(record.id);
      if (refreshed) {
        setRecords((prev) =>
          prev.map((item) => (item.id === refreshed.id ? refreshed : item))
        );
        if (selectedRecord && selectedRecord.id === refreshed.id) {
          setSelectedRecord(refreshed);
        }
      }
    } finally {
      setRefreshingId(null);
    }
  };

  const handleUpdateRecordStatus = async (recordId, patch) => {
    const updated = await updateMaintenanceRecordStatus(recordId, patch);
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedRecord && selectedRecord.id === updated.id) {
      setSelectedRecord(updated);
    }
    return updated;
  };

  const handleReprocessRecord = async (recordId) => {
    const updated = await reprocessMaintenanceRecord(recordId, masterData);
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedRecord && selectedRecord.id === updated.id) {
      setSelectedRecord(updated);
    }
    return updated;
  };

  const handleSaveAdminSettings = async (newSettings) => {
    setIsSavingSettings(true);
    try {
      const saved = await saveMaintenanceAdminSettings(newSettings);
      setAdminSettings(saved);
      if (saved.webhookConfigured) {
        setIntegrationState(INTEGRATION_STATES.CONNECTED);
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleApplyTemplate = (idx) => {
    const tpl = SAMPLE_WEBHOOK_TEMPLATES[idx];
    if (!tpl) return;
    setSimForm({
      from: tpl.from,
      subject: tpl.subject,
      bodyText: tpl.bodyText,
      bodyHtml: tpl.bodyHtml,
      webLink: tpl.webLink,
      conversationId: tpl.conversationId,
      internetMessageId: `<sim-${Date.now()}@vendor-notification.org>`
    });
    setSimFeedback(null);
  };

  const handleSimulateIngestion = async (e) => {
    e.preventDefault();
    setSimSubmitting(true);
    setSimFeedback(null);
    try {
      const result = await ingestOutlookVendorEmail(
        {
          from: simForm.from,
          subject: simForm.subject,
          bodyText: simForm.bodyText,
          bodyHtml: simForm.bodyHtml,
          webLink: simForm.webLink,
          conversationId: simForm.conversationId,
          internetMessageId: simForm.internetMessageId,
          messageId: `AAMkSim-${Date.now()}`,
          receivedDateTime: new Date().toISOString(),
          sourceMailbox:
            adminSettings?.monitoredMailbox || 'ops-vendor-maintenance@alaskaair.com',
          folderName: adminSettings?.monitoredFolderName || 'Vendor Maintenance'
        },
        masterData
      );

      if (result.duplicate) {
        setSimFeedback({
          type: 'warning',
          message: `Duplicate Prevented: Email with InternetMessageId ${simForm.internetMessageId} already exists (${result.record?.id}). No duplicate record created.`
        });
      } else {
        setShowDemoData(false);
        await loadMaintenanceData();
        setSimFeedback({
          type: 'success',
          message: `Processed incoming email → Record ${result.record?.id} (${result.record?.updateType} | Status: ${result.record?.status}).`
        });
      }
    } catch (err) {
      setSimFeedback({
        type: 'error',
        message: err?.message || 'Failed to ingest simulated vendor email.'
      });
    } finally {
      setSimSubmitting(false);
    }
  };

  return (
    <div className="vm-page-wrapper">
      {/* Page Header */}
      <header className="vm-page-header">
        <div className="vm-header-main">
          <div className="vm-header-eyebrow">
            <span className="vm-origin-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Origin: Automated Microsoft Outlook Vendor Notifications
            </span>
            <span className="vm-folder-badge">
              Folder: <strong>{adminSettings?.monitoredFolderName || 'Vendor Maintenance'}</strong>
            </span>
          </div>

          <h1 className="vm-page-title">Vendor Maintenance</h1>
          <p className="vm-page-subtitle">
            Track vendor maintenance notifications, planned service interruptions, application updates, and operational impacts in one place.
          </p>
        </div>

        <div className="vm-header-controls">
          {/* Synchronization & Mailbox Connection Status Indicator */}
          <div className="vm-sync-status-card">
            <div className="vm-sync-row">
              <span
                className={`vm-sync-dot ${
                  integrationState === INTEGRATION_STATES.CONNECTED
                    ? 'vm-dot-connected'
                    : integrationState === INTEGRATION_STATES.UNAVAILABLE
                    ? 'vm-dot-error'
                    : 'vm-dot-unconfigured'
                }`}
              />
              <span className="vm-sync-status-label">
                {integrationState === INTEGRATION_STATES.CONNECTED
                  ? 'Outlook Webhook Active'
                  : integrationState === INTEGRATION_STATES.UNAVAILABLE
                  ? 'Integration Temporarily Unavailable'
                  : 'Mailbox Authentication Not Configured'}
              </span>
            </div>
            <div className="vm-sync-timestamp">
              {lastSyncAt
                ? `Last synchronized: ${new Date(lastSyncAt).toLocaleString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}`
                : 'No live mailbox sync recorded yet'}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="vm-header-actions">
            <button
              type="button"
              className="vm-btn vm-btn-secondary"
              onClick={() => setShowSimulatorModal(true)}
              title="Test incoming Outlook / Power Automate email payload"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Test Email Ingestion
            </button>

            <button
              type="button"
              className={`vm-btn ${showDemoData ? 'vm-btn-demo-active' : 'vm-btn-outline'}`}
              onClick={() => {
                setShowDemoData((prev) => !prev);
                setCurrentPage(1);
              }}
            >
              {showDemoData ? 'Exit DEMO DATA Mode' : 'Preview DEMO DATA'}
            </button>

            <button
              type="button"
              className="vm-btn vm-btn-outline"
              onClick={() => setShowAdminModal(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Integration Settings
            </button>

            <button
              type="button"
              className="vm-btn vm-btn-primary"
              onClick={loadMaintenanceData}
              disabled={loading}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Demo Data Banner when previewing DEMO DATA */}
      {showDemoData && (
        <div className="vm-demo-banner" role="region" aria-label="Demo Data Notice">
          <div className="vm-demo-banner-left">
            <span className="vm-demo-badge">DEMO DATA SANDBOX</span>
            <span>
              Displaying <strong>clearly labeled sample records</strong> for UI preview only. These records are strictly separated from production data.
            </span>
          </div>
          <button
            type="button"
            className="vm-btn vm-btn-outline vm-btn-sm"
            onClick={() => setShowDemoData(false)}
          >
            Return to Production View
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <MaintenanceSummaryCards
        summary={summaryMetrics}
        loading={loading}
        integrationState={integrationState}
        lastSyncAt={lastSyncAt}
        showDemoData={showDemoData}
      />

      {/* Search & Filter Bar */}
      <MaintenanceFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        availableApplications={applicationOptions}
        totalCount={activeRecords.length}
        filteredCount={filteredRecords.length}
      />

      {/* Main Content Area: Loading / Error / Empty / Table */}
      {loading ? (
        <MaintenanceLoadingState />
      ) : error ? (
        <MaintenanceErrorState errorMessage={error} onRetry={loadMaintenanceData} />
      ) : filteredRecords.length === 0 ? (
        <MaintenanceEmptyState
          integrationState={integrationState}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onToggleDemoData={() => setShowDemoData(true)}
          showDemoData={showDemoData}
          onOpenSimulator={() => setShowSimulatorModal(true)}
          onOpenAdminSettings={() => setShowAdminModal(true)}
          isAdmin={true}
        />
      ) : (
        <MaintenanceTable
          records={filteredRecords}
          onViewDetails={handleViewDetails}
          onViewHistory={handleViewHistory}
          onRefreshRecord={handleRefreshSingleRecord}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          refreshingId={refreshingId}
        />
      )}

      {/* Maintenance Details Side Panel */}
      {selectedRecord && (
        <MaintenanceDetailsPanel
          record={selectedRecord}
          initialTab={detailsInitialTab}
          onClose={() => setSelectedRecord(null)}
          onUpdateStatus={handleUpdateRecordStatus}
          onReprocess={handleReprocessRecord}
          isAdmin={true}
          vendorsDirectory={masterData.vendors || []}
        />
      )}

      {/* Simulate Incoming Vendor Email Modal (For Local / Power Automate Webhook Testing) */}
      {showSimulatorModal &&
        createPortal(
          <div
            className="vm-drawer-backdrop"
            onClick={() => setShowSimulatorModal(false)}
            role="dialog"
            aria-modal="true"
          >
            <div className="vm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="vm-admin-panel-header">
                <div>
                  <h3 className="vm-admin-panel-title">
                    Simulate Incoming Outlook / Power Automate Email Webhook
                  </h3>
                  <p className="vm-admin-panel-subtitle">
                    Test automated vendor matching, application detection, classification, date extraction, follow-up correlation, and duplicate prevention.
                  </p>
                </div>
                <button
                  type="button"
                  className="vm-drawer-close"
                  onClick={() => setShowSimulatorModal(false)}
                >
                  ✕
                </button>
              </div>

              {simFeedback && (
                <div className={`vm-alert vm-alert-${simFeedback.type}`}>
                  <span>{simFeedback.message}</span>
                </div>
              )}

              <div className="vm-template-bar">
                <span className="vm-field-label">Load Preset Scenario:</span>
                <div className="vm-template-buttons">
                  {SAMPLE_WEBHOOK_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={tpl.label}
                      type="button"
                      className="vm-btn vm-btn-outline vm-btn-sm"
                      onClick={() => handleApplyTemplate(idx)}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSimulateIngestion} className="vm-admin-form">
                <div className="vm-admin-grid-2">
                  <div className="vm-filter-field">
                    <label htmlFor="sim-from">Sender Email (From)</label>
                    <input
                      id="sim-from"
                      type="text"
                      required
                      value={simForm.from}
                      onChange={(e) => setSimForm({ ...simForm, from: e.target.value })}
                    />
                  </div>
                  <div className="vm-filter-field">
                    <label htmlFor="sim-msgid">Internet Message ID (Deduplication Key)</label>
                    <input
                      id="sim-msgid"
                      type="text"
                      required
                      value={simForm.internetMessageId}
                      onChange={(e) =>
                        setSimForm({ ...simForm, internetMessageId: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="vm-filter-field">
                  <label htmlFor="sim-subject">Email Subject</label>
                  <input
                    id="sim-subject"
                    type="text"
                    required
                    value={simForm.subject}
                    onChange={(e) => setSimForm({ ...simForm, subject: e.target.value })}
                  />
                </div>

                <div className="vm-filter-field">
                  <label htmlFor="sim-body">Email Body (Plain Text)</label>
                  <textarea
                    id="sim-body"
                    rows={4}
                    required
                    value={simForm.bodyText}
                    onChange={(e) => setSimForm({ ...simForm, bodyText: e.target.value })}
                  />
                </div>

                <div className="vm-admin-grid-2">
                  <div className="vm-filter-field">
                    <label htmlFor="sim-weblink">Outlook Web Link (Optional)</label>
                    <input
                      id="sim-weblink"
                      type="text"
                      value={simForm.webLink}
                      onChange={(e) => setSimForm({ ...simForm, webLink: e.target.value })}
                    />
                  </div>
                  <div className="vm-filter-field">
                    <label htmlFor="sim-conv">Conversation ID (For Thread Correlation)</label>
                    <input
                      id="sim-conv"
                      type="text"
                      value={simForm.conversationId}
                      onChange={(e) =>
                        setSimForm({ ...simForm, conversationId: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="vm-admin-form-footer">
                  <button
                    type="button"
                    className="vm-btn vm-btn-outline"
                    onClick={() => setShowSimulatorModal(false)}
                  >
                    Close
                  </button>
                  <button type="submit" className="vm-btn vm-btn-primary" disabled={simSubmitting}>
                    {simSubmitting
                      ? 'Ingesting & Extracting...'
                      : 'Send to Outlook Ingestion Pipeline'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Admin Integration Settings Modal */}
      {showAdminModal &&
        createPortal(
          <div
            className="vm-drawer-backdrop"
            onClick={() => setShowAdminModal(false)}
            role="dialog"
            aria-modal="true"
          >
            <div className="vm-modal-card vm-modal-wide" onClick={(e) => e.stopPropagation()}>
              <MaintenanceAdminSettingsPanel
                settings={adminSettings}
                onSaveSettings={handleSaveAdminSettings}
                records={records}
                onReprocessRecord={handleReprocessRecord}
                isSaving={isSavingSettings}
                onClose={() => setShowAdminModal(false)}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
