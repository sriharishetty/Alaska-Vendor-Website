import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import MaintenanceStatusBadge from './MaintenanceStatusBadge';
import EmailSourceBadge from './EmailSourceBadge';
import {
  MAINTENANCE_STATUSES,
  UPDATE_TYPES,
  validateOutlookWebLink,
  sanitizeEmailHtml
} from '../../types/vendorMaintenance';

function formatDetailTimestamp(iso) {
  if (!iso) return 'Not provided';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function formatByteSize(bytes) {
  const num = Number(bytes) || 0;
  if (num <= 0) return '0 B';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

export default function MaintenanceDetailsPanel({
  record,
  initialTab = 'overview',
  onClose,
  onUpdateStatus,
  onReprocess,
  isAdmin = false,
  vendorsDirectory = []
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [emailFormat, setEmailFormat] = useState('html');
  const [selectedStatus, setSelectedStatus] = useState(record?.status || 'New');
  const [selectedUpdateType, setSelectedUpdateType] = useState(
    record?.updateType || 'Unknown / Requires Classification'
  );
  const [statusReason, setStatusReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    if (record) {
      setSelectedStatus(record.status || 'New');
      setSelectedUpdateType(record.updateType || 'Unknown / Requires Classification');
      setStatusReason('');
      setActionFeedback(null);
    }
  }, [record]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!record) return null;

  const matchedVendor =
    vendorsDirectory.find(
      (v) =>
        (record.vendorId && v.id === record.vendorId) ||
        (record.vendorName &&
          String(v.name || '').toLowerCase() === String(record.vendorName).toLowerCase())
    ) || null;

  const validatedOutlookLink = validateOutlookWebLink(record.originalEmailWebLink);
  const sanitizedHtml = sanitizeEmailHtml(record.emailBodyHtml || '');
  const hasHtmlContent = Boolean(sanitizedHtml && sanitizedHtml.trim().length > 0);

  const handleSaveStatusUpdate = async (e) => {
    e.preventDefault();
    if (!onUpdateStatus) return;
    setIsUpdating(true);
    setActionFeedback(null);
    try {
      await onUpdateStatus(record.id, {
        status: selectedStatus,
        updateType: selectedUpdateType,
        reason: statusReason || `Manual review update by Operations Admin`
      });
      setActionFeedback({
        type: 'success',
        message: 'Record status and classification updated with audit trail.'
      });
      setStatusReason('');
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Unable to update maintenance record.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTriggerReprocess = async () => {
    if (!onReprocess) return;
    setIsReprocessing(true);
    setActionFeedback(null);
    try {
      await onReprocess(record.id);
      setActionFeedback({
        type: 'success',
        message: 'Email reprocessed through extraction engine without creating duplicate records.'
      });
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Failed to reprocess maintenance email.'
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  const drawerContent = (
    <div className="vm-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="vm-drawer-title">
      <div className="vm-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="vm-drawer-header">
          <div className="vm-drawer-header-top">
            <div className="vm-drawer-badges">
              <MaintenanceStatusBadge status={record.status} />
              <span className="vm-update-type-chip">{record.updateType || 'Unknown / Requires Classification'}</span>
              <EmailSourceBadge
                sourceMailbox={record.sourceMailbox}
                isDemo={Boolean(record.isDemo)}
                processingStatus={record.processingStatus}
              />
              {record.isDemo && (
                <span className="vm-demo-badge">DEMO DATA — NOT PRODUCTION</span>
              )}
            </div>

            <button
              type="button"
              className="vm-drawer-close"
              onClick={onClose}
              aria-label="Close details panel"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <h2 id="vm-drawer-title" className="vm-drawer-title">
            {record.emailSubject || 'No Subject Provided'}
          </h2>

          <div className="vm-drawer-submeta">
            <span>
              <strong>Vendor:</strong> {record.vendorName || 'Unknown'}
            </span>
            <span className="vm-dot-sep">•</span>
            <span>
              <strong>Application:</strong> {record.applicationName || 'Unknown'}
            </span>
            <span className="vm-dot-sep">•</span>
            <span>
              <strong>Record ID:</strong> <code>{record.id}</code>
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="vm-drawer-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`vm-drawer-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview & Extracted Metadata
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'email'}
              className={`vm-drawer-tab ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              Vendor&apos;s Original Email
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={`vm-drawer-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Processing & Audit Trail
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="vm-drawer-body">
          {actionFeedback && (
            <div className={`vm-alert vm-alert-${actionFeedback.type}`}>
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & EXTRACTED METADATA */}
          {activeTab === 'overview' && (
            <div className="vm-tab-section">
              {/* Automated Extraction Distinction Notice */}
              <div className="vm-extraction-banner">
                <div className="vm-extraction-banner-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Automated Extraction Summary (Separated from Vendor&apos;s Original Wording)</span>
                </div>
                <p className="vm-extraction-summary-text">
                  {record.extractedSummary || 'Not provided'}
                </p>
                <div className="vm-extraction-impact-row">
                  <span className="vm-field-label">Operational Impact Assessment:</span>
                  <span className="vm-impact-value">{record.operationalImpact || 'Unknown'}</span>
                </div>
              </div>

              {/* 20 Required Fields Grid */}
              <div className="vm-detail-section">
                <h3 className="vm-section-heading">Vendor & Application Identification</h3>
                <div className="vm-detail-grid">
                  <div className="vm-detail-item">
                    <span className="vm-field-label">1. Vendor Name</span>
                    <span className="vm-field-value">{record.vendorName || 'Unknown'}</span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">2. Matched Vendor Record</span>
                    <span className="vm-field-value">
                      {record.vendorId ? (
                        <span className="vm-matched-pill">
                          Matched ({record.vendorId}) — {matchedVendor?.company || record.vendorName}
                        </span>
                      ) : (
                        <span className="vm-unmatched-pill">Unmatched / Requires Review</span>
                      )}
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">3. Sender Email Address</span>
                    <span className="vm-field-value">
                      <code>{record.senderEmail || 'Not provided'}</code>
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">4. Associated Application</span>
                    <span className="vm-field-value">{record.applicationName || 'Unknown'}</span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">5. Update Type</span>
                    <span className="vm-field-value">{record.updateType || 'Unknown / Requires Classification'}</span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">6. Maintenance Status</span>
                    <span className="vm-field-value">
                      <MaintenanceStatusBadge status={record.status} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="vm-detail-section">
                <h3 className="vm-section-heading">Maintenance Window & Schedule</h3>
                <div className="vm-detail-grid">
                  <div className="vm-detail-item">
                    <span className="vm-field-label">7. Received Date & Time</span>
                    <span className="vm-field-value">{formatDetailTimestamp(record.receivedDate)}</span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">8. Time Zone</span>
                    <span className="vm-field-value">
                      {record.timeZone || 'Unknown (Timezone not specified in vendor email)'}
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">9. Maintenance Start Time</span>
                    <span className="vm-field-value">
                      {record.maintenanceStart
                        ? `${formatDetailTimestamp(record.maintenanceStart)} (${record.timeZone || 'TZ Unknown'})`
                        : 'Not provided'}
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">10. Maintenance End Time</span>
                    <span className="vm-field-value">
                      {record.maintenanceEnd
                        ? `${formatDetailTimestamp(record.maintenanceEnd)} (${record.timeZone || 'TZ Unknown'})`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="vm-detail-section">
                <h3 className="vm-section-heading">Contact Details & Outlook Provenance</h3>
                <div className="vm-detail-grid">
                  <div className="vm-detail-item">
                    <span className="vm-field-label">11. Vendor Contact Details</span>
                    <span className="vm-field-value">
                      {record.contactDetails ||
                        matchedVendor?.contacts?.[0]?.value ||
                        matchedVendor?.primaryOwner ||
                        'Not provided'}
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">12. Original Outlook Email Link</span>
                    <span className="vm-field-value">
                      {validatedOutlookLink ? (
                        <a
                          href={validatedOutlookLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="vm-external-link"
                        >
                          Open in Microsoft Outlook Web ↗
                        </a>
                      ) : (
                        <span className="vm-muted-text">
                          No validated Outlook web URL provided (View stored email in tab above)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">13. Source Mailbox</span>
                    <span className="vm-field-value">{record.sourceMailbox || 'Not provided'}</span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">14. Outlook Message ID</span>
                    <span className="vm-field-value">
                      <code>{record.outlookMessageId || 'Not provided'}</code>
                    </span>
                  </div>
                </div>
              </div>

              <div className="vm-detail-section">
                <h3 className="vm-section-heading">Processing & System Timestamps</h3>
                <div className="vm-detail-grid">
                  <div className="vm-detail-item">
                    <span className="vm-field-label">15. Processing Status</span>
                    <span className="vm-field-value">
                      <span className={`vm-proc-pill vm-proc-${(record.processingStatus || 'processed').toLowerCase()}`}>
                        {record.processingStatus || 'Processed'}
                      </span>
                      {record.processingError && (
                        <div className="vm-proc-error-text">{record.processingError}</div>
                      )}
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">16. Last Processing Attempt</span>
                    <span className="vm-field-value">{formatDetailTimestamp(record.lastProcessedAt)}</span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">17. Created Date</span>
                    <span className="vm-field-value">{formatDetailTimestamp(record.createdAt)}</span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">18. Last Modified Date</span>
                    <span className="vm-field-value">{formatDetailTimestamp(record.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Attachments Metadata (Phase 12) */}
              {Array.isArray(record.attachments) && record.attachments.length > 0 && (
                <div className="vm-detail-section">
                  <h3 className="vm-section-heading">Email Attachments (Safe Metadata Only)</h3>
                  <div className="vm-attachment-list">
                    {record.attachments.map((att) => (
                      <div key={att.id || att.fileName} className="vm-attachment-item">
                        <div className="vm-attachment-info">
                          <span className="vm-attachment-name">{att.fileName}</span>
                          <span className="vm-attachment-meta">
                            {att.contentType} • {formatByteSize(att.size)}
                          </span>
                        </div>
                        {att.isBlockedExecutable || att.isContentTypeMismatch ? (
                          <span className="vm-attachment-blocked">
                            Blocked ({att.securityNote || 'Security policy'})
                          </span>
                        ) : (
                          <span className="vm-attachment-safe">Metadata Verified</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Authorized Operations Review / Status Update Controls */}
              {isAdmin && !record.isDemo && (
                <form className="vm-admin-review-box" onSubmit={handleSaveStatusUpdate}>
                  <div className="vm-admin-review-header">
                    <h4>Authorized Operations Status & Classification Review</h4>
                    <button
                      type="button"
                      className="vm-btn vm-btn-outline vm-btn-sm"
                      onClick={handleTriggerReprocess}
                      disabled={isReprocessing}
                    >
                      {isReprocessing ? 'Reprocessing...' : 'Reprocess Email Extraction'}
                    </button>
                  </div>
                  <div className="vm-admin-review-grid">
                    <div className="vm-filter-field">
                      <label htmlFor="vm-review-status">Maintenance Status</label>
                      <select
                        id="vm-review-status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        {MAINTENANCE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="vm-filter-field">
                      <label htmlFor="vm-review-type">Update Type</label>
                      <select
                        id="vm-review-type"
                        value={selectedUpdateType}
                        onChange={(e) => setSelectedUpdateType(e.target.value)}
                      >
                        {UPDATE_TYPES.map((ut) => (
                          <option key={ut} value={ut}>
                            {ut}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="vm-filter-field vm-review-reason">
                      <label htmlFor="vm-review-note">Audit Note / Reason</label>
                      <input
                        id="vm-review-note"
                        type="text"
                        placeholder="e.g., Vendor confirmed completion via bridge call"
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="vm-admin-review-actions">
                    <button type="submit" className="vm-btn vm-btn-primary" disabled={isUpdating}>
                      {isUpdating ? 'Saving Update...' : 'Save Review Decision'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: VENDOR'S ORIGINAL EMAIL */}
          {activeTab === 'email' && (
            <div className="vm-tab-section">
              <div className="vm-original-email-notice">
                <div>
                  <strong>Original Vendor Notification (Preserved Verbatim)</strong>
                  <p>
                    Scripts, iframes, forms, and active content have been sanitized for security.
                  </p>
                </div>
                <div className="vm-email-view-toggle">
                  {hasHtmlContent && (
                    <button
                      type="button"
                      className={`vm-toggle-btn ${emailFormat === 'html' ? 'active' : ''}`}
                      onClick={() => setEmailFormat('html')}
                    >
                      Formatted HTML
                    </button>
                  )}
                  <button
                    type="button"
                    className={`vm-toggle-btn ${!hasHtmlContent || emailFormat === 'text' ? 'active' : ''}`}
                    onClick={() => setEmailFormat('text')}
                  >
                    Plain Text
                  </button>
                </div>
              </div>

              <div className="vm-email-envelope">
                <div className="vm-envelope-row">
                  <span className="vm-envelope-label">From:</span>
                  <span className="vm-envelope-val">{record.senderEmail || 'Not provided'}</span>
                </div>
                <div className="vm-envelope-row">
                  <span className="vm-envelope-label">Subject:</span>
                  <span className="vm-envelope-val">
                    <strong>{record.emailSubject || 'No Subject'}</strong>
                  </span>
                </div>
                <div className="vm-envelope-row">
                  <span className="vm-envelope-label">Received:</span>
                  <span className="vm-envelope-val">{formatDetailTimestamp(record.receivedDate)}</span>
                </div>
                <div className="vm-envelope-row">
                  <span className="vm-envelope-label">Internet Message ID:</span>
                  <span className="vm-envelope-val">
                    <code>{record.outlookInternetMessageId || 'Not provided'}</code>
                  </span>
                </div>
              </div>

              <div className="vm-email-body-container">
                {hasHtmlContent && emailFormat === 'html' ? (
                  <div
                    className="vm-sanitized-html-body"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                ) : (
                  <pre className="vm-plain-text-body">
                    {record.emailBodyText || 'No email body text provided.'}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROCESSING & AUDIT TRAIL */}
          {activeTab === 'history' && (
            <div className="vm-tab-section">
              <div className="vm-detail-section">
                <h3 className="vm-section-heading">Deduplication & Correlation Identity</h3>
                <div className="vm-detail-grid">
                  <div className="vm-detail-item">
                    <span className="vm-field-label">Outlook Message ID</span>
                    <span className="vm-field-value">
                      <code>{record.outlookMessageId || 'Not provided'}</code>
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">Internet Message ID (RFC 5322)</span>
                    <span className="vm-field-value">
                      <code>{record.outlookInternetMessageId || 'Not provided'}</code>
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">Outlook Conversation ID</span>
                    <span className="vm-field-value">
                      <code>{record.conversationId || 'Not provided'}</code>
                    </span>
                  </div>
                  <div className="vm-detail-item">
                    <span className="vm-field-label">Correlated Parent Record ID</span>
                    <span className="vm-field-value">
                      <code>{record.correlatedRecordId || 'None (Initial Notification)'}</code>
                    </span>
                  </div>
                </div>
              </div>

              <div className="vm-detail-section">
                <h3 className="vm-section-heading">Processing & Audit Timeline</h3>
                {Array.isArray(record.processingHistory) && record.processingHistory.length > 0 ? (
                  <div className="vm-history-timeline">
                    {record.processingHistory.map((item, idx) => (
                      <div key={`${item.timestamp}-${idx}`} className="vm-history-entry">
                        <div className="vm-history-dot" />
                        <div className="vm-history-card">
                          <div className="vm-history-top">
                            <span className="vm-history-action">{item.action}</span>
                            <span className="vm-history-time">
                              {formatDetailTimestamp(item.timestamp)}
                            </span>
                          </div>
                          <p className="vm-history-details">{item.details}</p>
                          <span className="vm-history-actor">Actor: {item.actor || 'System'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="vm-muted-text">No processing history entries recorded.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="vm-drawer-footer">
          {validatedOutlookLink && (
            <a
              href={validatedOutlookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="vm-btn vm-btn-secondary"
            >
              Open Original Email in Outlook Web ↗
            </a>
          )}
          <button type="button" className="vm-btn vm-btn-primary" onClick={onClose}>
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(drawerContent, document.body);
  }
  return drawerContent;
}

