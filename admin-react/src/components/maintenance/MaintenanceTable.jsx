import React, { useState } from 'react';
import MaintenanceStatusBadge from './MaintenanceStatusBadge';
import EmailSourceBadge from './EmailSourceBadge';
import { validateOutlookWebLink } from '../../types/vendorMaintenance';

function formatDateTimeDisplay(isoString, timeZone) {
  if (!isoString) return 'Not provided';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  try {
    const formatted = d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const tzLabel = timeZone && !timeZone.startsWith('Unknown') ? ` (${timeZone})` : '';
    return `${formatted}${tzLabel}`;
  } catch {
    return isoString;
  }
}

function getVendorInitials(name) {
  const clean = String(name || 'UK').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function MaintenanceTable({
  records = [],
  onViewDetails,
  onViewHistory,
  onRefreshRecord,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  refreshingId = null
}) {
  const [copiedId, setCopiedId] = useState(null);

  const totalRecords = records.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedRecords = records.slice(startIdx, startIdx + pageSize);

  const handleCopySubject = async (e, record) => {
    e.stopPropagation();
    const subjectText = record.emailSubject || '';
    if (!subjectText) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(subjectText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = subjectText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(record.id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === record.id ? null : prev));
      }, 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleOpenOriginalEmail = (e, record) => {
    e.stopPropagation();
    const validLink = validateOutlookWebLink(record.originalEmailWebLink);
    if (validLink) {
      window.open(validLink, '_blank', 'noopener,noreferrer');
    } else if (onViewDetails) {
      onViewDetails(record, 'email');
    }
  };

  return (
    <div className="vm-table-card">
      <div className="vm-table-scroll">
        <table className="vm-table" aria-label="Vendor Maintenance Records">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Application</th>
              <th>Email Subject</th>
              <th>Update Type</th>
              <th>Received Date</th>
              <th>Maintenance Start</th>
              <th>Maintenance End</th>
              <th>Status</th>
              <th>Source</th>
              <th className="vm-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((record) => {
              const validOutlookUrl = validateOutlookWebLink(record.originalEmailWebLink);
              const isRefreshing = refreshingId === record.id;

              return (
                <tr
                  key={record.id}
                  className={`vm-table-row ${record.isDemo ? 'vm-row-demo' : ''}`}
                  onClick={() => onViewDetails && onViewDetails(record, 'overview')}
                >
                  {/* 1. Vendor */}
                  <td className="vm-td-vendor">
                    <div className="vm-vendor-cell">
                      <span
                        className={`vm-vendor-avatar ${
                          record.vendorId ? 'vm-avatar-matched' : 'vm-avatar-unmatched'
                        }`}
                        title={
                          record.vendorId
                            ? `Matched Directory Vendor ID: ${record.vendorId}`
                            : 'Unmatched External Sender'
                        }
                      >
                        {getVendorInitials(record.vendorName)}
                      </span>
                      <div className="vm-vendor-meta">
                        <div className="vm-vendor-name-line">
                          <span className="vm-vendor-name">{record.vendorName || 'Unknown'}</span>
                          {record.isDemo && (
                            <span className="vm-demo-badge" title="Sample demonstration record">
                              DEMO DATA
                            </span>
                          )}
                        </div>
                        <span className="vm-vendor-sender" title={record.senderEmail}>
                          {record.senderEmail || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Application */}
                  <td className="vm-td-app">
                    <span
                      className={`vm-app-pill ${
                        !record.applicationName || record.applicationName === 'Unknown'
                          ? 'vm-app-unknown'
                          : ''
                      }`}
                    >
                      {record.applicationName || 'Unknown'}
                    </span>
                  </td>

                  {/* 3. Email Subject */}
                  <td className="vm-td-subject">
                    <div className="vm-subject-wrap">
                      <span className="vm-subject-text" title={record.emailSubject}>
                        {record.emailSubject || 'No Subject Provided'}
                      </span>
                      {record.timeZone && record.timeZone.startsWith('Unknown') && (
                        <span className="vm-tz-warning" title={record.timeZone}>
                          TZ Unspecified
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 4. Update Type */}
                  <td className="vm-td-type">
                    <span className="vm-update-type-chip">
                      {record.updateType || 'Unknown / Requires Classification'}
                    </span>
                  </td>

                  {/* 5. Received Date */}
                  <td className="vm-td-date">
                    {formatDateTimeDisplay(record.receivedDate, null)}
                  </td>

                  {/* 6. Maintenance Start */}
                  <td className="vm-td-date">
                    <span
                      className={
                        !record.maintenanceStart ? 'vm-date-missing' : 'vm-date-present'
                      }
                    >
                      {formatDateTimeDisplay(record.maintenanceStart, record.timeZone)}
                    </span>
                  </td>

                  {/* 7. Maintenance End */}
                  <td className="vm-td-date">
                    <span
                      className={
                        !record.maintenanceEnd ? 'vm-date-missing' : 'vm-date-present'
                      }
                    >
                      {formatDateTimeDisplay(record.maintenanceEnd, record.timeZone)}
                    </span>
                  </td>

                  {/* 8. Status */}
                  <td className="vm-td-status">
                    <MaintenanceStatusBadge status={record.status} />
                  </td>

                  {/* 9. Source */}
                  <td className="vm-td-source">
                    <EmailSourceBadge
                      sourceMailbox={record.sourceMailbox}
                      isDemo={Boolean(record.isDemo)}
                      processingStatus={record.processingStatus}
                    />
                  </td>

                  {/* 10. Actions */}
                  <td className="vm-td-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="vm-action-group">
                      <button
                        type="button"
                        className="vm-action-btn vm-action-primary"
                        onClick={() => onViewDetails && onViewDetails(record, 'overview')}
                        title="View full maintenance details"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        className="vm-icon-btn"
                        onClick={(e) => handleOpenOriginalEmail(e, record)}
                        title={
                          validOutlookUrl
                            ? 'Open Original Email in Microsoft Outlook Web'
                            : 'Open Stored Original Email Content (No external Outlook Web URL attached)'
                        }
                        aria-label="Open Original Email"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </button>

                      {record.emailSubject && (
                        <button
                          type="button"
                          className={`vm-icon-btn ${copiedId === record.id ? 'vm-icon-btn-copied' : ''}`}
                          onClick={(e) => handleCopySubject(e, record)}
                          title={copiedId === record.id ? 'Subject copied!' : 'Copy email subject'}
                          aria-label="Copy email subject"
                        >
                          {copiedId === record.id ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        className="vm-icon-btn"
                        onClick={() => onViewHistory && onViewHistory(record)}
                        title="View processing history & audit trail"
                        aria-label="View processing history"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </button>

                      {onRefreshRecord && (
                        <button
                          type="button"
                          className={`vm-icon-btn ${isRefreshing ? 'vm-spin' : ''}`}
                          onClick={() => onRefreshRecord(record)}
                          disabled={isRefreshing}
                          title="Refresh or reload record details"
                          aria-label="Refresh record details"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 21h5v-5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="vm-pagination-bar">
        <div className="vm-pagination-info">
          Showing <strong>{totalRecords === 0 ? 0 : startIdx + 1}</strong> –{' '}
          <strong>{Math.min(startIdx + pageSize, totalRecords)}</strong> of{' '}
          <strong>{totalRecords}</strong> maintenance records
        </div>

        <div className="vm-pagination-controls">
          <label className="vm-page-size-label">
            Rows per page:
            <select
              className="vm-page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>

          <div className="vm-page-buttons">
            <button
              type="button"
              className="vm-page-btn"
              disabled={safePage <= 1}
              onClick={() => onPageChange && onPageChange(safePage - 1)}
            >
              Previous
            </button>
            <span className="vm-page-indicator">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              className="vm-page-btn"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange && onPageChange(safePage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

