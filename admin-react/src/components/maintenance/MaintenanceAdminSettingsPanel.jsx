import React, { useState, useEffect } from 'react';
import { DEFAULT_ADMIN_SETTINGS, UPDATE_TYPES } from '../../types/vendorMaintenance';

function normalizeClassificationRules(rules) {
  if (!Array.isArray(rules)) return [];
  return rules.map((rule, idx) => ({
    ...rule,
    id: rule.id || `rule-${idx}-${String(rule.updateType || 'rule').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    keyword:
      rule.keyword ||
      (Array.isArray(rule.keywords) ? rule.keywords.join(', ') : '')
  }));
}

export default function MaintenanceAdminSettingsPanel({
  settings,
  onSaveSettings,
  records = [],
  onReprocessRecord,
  isSaving = false,
  onClose
}) {
  const mergedInitial = { ...DEFAULT_ADMIN_SETTINGS, ...(settings || {}) };

  const [monitoredMailbox, setMonitoredMailbox] = useState(mergedInitial.monitoredMailbox || '');
  const [monitoredFolderName, setMonitoredFolderName] = useState(
    mergedInitial.monitoredFolderName || 'Vendor Maintenance'
  );
  const [defaultOperationalTimeZone, setDefaultOperationalTimeZone] = useState(
    mergedInitial.defaultOperationalTimeZone || 'America/Los_Angeles'
  );
  const [enableAutoProcessing, setEnableAutoProcessing] = useState(
    mergedInitial.enableAutoProcessing !== false
  );
  const [webhookConfigured, setWebhookConfigured] = useState(
    Boolean(mergedInitial.webhookConfigured)
  );
  const [approvedDomainsText, setApprovedDomainsText] = useState(
    (mergedInitial.approvedVendorDomains || []).join(', ')
  );
  const [approvedEmailsText, setApprovedEmailsText] = useState(
    (mergedInitial.approvedVendorEmails || []).join(', ')
  );
  const [aliasesJsonText, setAliasesJsonText] = useState(
    JSON.stringify(mergedInitial.applicationAliases || {}, null, 2)
  );
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleType, setNewRuleType] = useState('Scheduled Maintenance');
  const [classificationRules, setClassificationRules] = useState(() =>
    normalizeClassificationRules(mergedInitial.classificationRules)
  );
  const [feedback, setFeedback] = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);

  useEffect(() => {
    if (settings) {
      const next = { ...DEFAULT_ADMIN_SETTINGS, ...settings };
      setMonitoredMailbox(next.monitoredMailbox || '');
      setMonitoredFolderName(next.monitoredFolderName || 'Vendor Maintenance');
      setDefaultOperationalTimeZone(next.defaultOperationalTimeZone || 'America/Los_Angeles');
      setEnableAutoProcessing(next.enableAutoProcessing !== false);
      setWebhookConfigured(Boolean(next.webhookConfigured));
      setApprovedDomainsText((next.approvedVendorDomains || []).join(', '));
      setApprovedEmailsText((next.approvedVendorEmails || []).join(', '));
      setAliasesJsonText(JSON.stringify(next.applicationAliases || {}, null, 2));
      setClassificationRules(normalizeClassificationRules(next.classificationRules));
    }
  }, [settings]);

  const failedOrReviewRecords = (records || []).filter(
    (r) =>
      !r.isDemo &&
      (r.processingStatus === 'Failed' ||
        r.status === 'Requires Review' ||
        r.updateType === 'Unknown / Requires Classification')
  );

  const handleAddRule = () => {
    const kw = newRuleKeyword.trim();
    if (!kw) return;
    setClassificationRules((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        keyword: kw,
        updateType: newRuleType
      }
    ]);
    setNewRuleKeyword('');
  };

  const handleRemoveRule = (id) => {
    setClassificationRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    let parsedAliases = {};
    try {
      parsedAliases = JSON.parse(aliasesJsonText || '{}');
      if (typeof parsedAliases !== 'object' || Array.isArray(parsedAliases)) {
        throw new Error('Application aliases must be a valid JSON object.');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Invalid Application Aliases JSON: ${err.message}`
      });
      return;
    }

    const updatedPayload = {
      monitoredMailbox: monitoredMailbox.trim(),
      monitoredFolderName: monitoredFolderName.trim() || 'Vendor Maintenance',
      defaultOperationalTimeZone: defaultOperationalTimeZone.trim() || 'America/Los_Angeles',
      enableAutoProcessing,
      webhookConfigured,
      approvedVendorDomains: approvedDomainsText
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      approvedVendorEmails: approvedEmailsText
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      applicationAliases: parsedAliases,
      classificationRules
    };

    try {
      await onSaveSettings(updatedPayload);
      setFeedback({
        type: 'success',
        message: 'Vendor Maintenance & Outlook Integration settings saved.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to save settings.'
      });
    }
  };

  const handleReprocessItem = async (id) => {
    if (!onReprocessRecord) return;
    setReprocessingId(id);
    setFeedback(null);
    try {
      await onReprocessRecord(id);
      setFeedback({
        type: 'success',
        message: `Record ${id} reprocessed with current vendor rules and aliases.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || `Failed to reprocess record ${id}.`
      });
    } finally {
      setReprocessingId(null);
    }
  };

  return (
    <div className="vm-admin-settings-panel">
      <div className="vm-admin-panel-header">
        <div>
          <h3 className="vm-admin-panel-title">
            Vendor Maintenance & Microsoft Outlook Integration Settings
          </h3>
          <p className="vm-admin-panel-subtitle">
            Configure monitored mailbox folder, approved external vendor domains/senders, application aliases, classification rules, and review queue.
          </p>
        </div>
        {onClose && (
          <button type="button" className="vm-drawer-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      {feedback && (
        <div className={`vm-alert vm-alert-${feedback.type}`}>
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="vm-admin-form">
        <div className="vm-admin-grid-2">
          <div className="vm-filter-field">
            <label htmlFor="vm-cfg-mailbox">Monitored Outlook Mailbox Address</label>
            <input
              id="vm-cfg-mailbox"
              type="email"
              value={monitoredMailbox}
              onChange={(e) => setMonitoredMailbox(e.target.value)}
              placeholder="ops-vendor-maintenance@alaskaair.com"
            />
          </div>

          <div className="vm-filter-field">
            <label htmlFor="vm-cfg-folder">Monitored Outlook Folder Name</label>
            <input
              id="vm-cfg-folder"
              type="text"
              value={monitoredFolderName}
              onChange={(e) => setMonitoredFolderName(e.target.value)}
              placeholder="Vendor Maintenance"
            />
          </div>

          <div className="vm-filter-field">
            <label htmlFor="vm-cfg-tz">Default Operational Time Zone (Display)</label>
            <select
              id="vm-cfg-tz"
              value={defaultOperationalTimeZone}
              onChange={(e) => setDefaultOperationalTimeZone(e.target.value)}
            >
              <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time - PT)</option>
              <option value="America/Anchorage">America/Anchorage (Alaska Time - AKT)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/Denver">America/Denver (Mountain Time - MT)</option>
              <option value="America/Chicago">America/Chicago (Central Time - CT)</option>
              <option value="America/New_York">America/New_York (Eastern Time - ET)</option>
            </select>
          </div>

          <div className="vm-filter-field vm-toggle-field">
            <label className="vm-checkbox-label">
              <input
                type="checkbox"
                checked={enableAutoProcessing}
                onChange={(e) => setEnableAutoProcessing(e.target.checked)}
              />
              <span>Enable Automatic Email Processing & Classification</span>
            </label>
            <label className="vm-checkbox-label">
              <input
                type="checkbox"
                checked={webhookConfigured}
                onChange={(e) => setWebhookConfigured(e.target.checked)}
              />
              <span>Mark Microsoft 365 / Power Automate Webhook as Active</span>
            </label>
          </div>
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-cfg-domains">
            Approved Vendor Domains (comma-separated, e.g., smart4aviation.aero, sita.aero)
          </label>
          <textarea
            id="vm-cfg-domains"
            rows={2}
            value={approvedDomainsText}
            onChange={(e) => setApprovedDomainsText(e.target.value)}
          />
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-cfg-emails">
            Approved Vendor Sender Email Addresses (comma-separated)
          </label>
          <textarea
            id="vm-cfg-emails"
            rows={2}
            value={approvedEmailsText}
            onChange={(e) => setApprovedEmailsText(e.target.value)}
          />
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-cfg-aliases">
            Application Name Aliases (JSON mapping from keyword/alias to canonical application name)
          </label>
          <textarea
            id="vm-cfg-aliases"
            rows={5}
            className="vm-code-textarea"
            value={aliasesJsonText}
            onChange={(e) => setAliasesJsonText(e.target.value)}
          />
        </div>

        {/* Custom Classification Rules */}
        <div className="vm-detail-section">
          <h4 className="vm-section-heading">Custom Maintenance Classification Rules</h4>
          <div className="vm-rule-builder">
            <input
              type="text"
              placeholder="Keyword or phrase in subject/body..."
              value={newRuleKeyword}
              onChange={(e) => setNewRuleKeyword(e.target.value)}
            />
            <select value={newRuleType} onChange={(e) => setNewRuleType(e.target.value)}>
              {UPDATE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button type="button" className="vm-btn vm-btn-secondary" onClick={handleAddRule}>
              + Add Rule
            </button>
          </div>
          {classificationRules.length > 0 && (
            <div className="vm-rules-list">
              {classificationRules.map((rule) => (
                <div key={rule.id} className="vm-rule-chip">
                  <span>
                    If contains <code>&quot;{rule.keyword}&quot;</code> →{' '}
                    <strong>{rule.updateType}</strong>
                  </span>
                  <button
                    type="button"
                    className="vm-rule-remove"
                    onClick={() => handleRemoveRule(rule.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="vm-admin-form-footer">
          <button type="submit" className="vm-btn vm-btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving Configuration...' : 'Save Integration Settings'}
          </button>
        </div>
      </form>

      {/* Failed / Unclassified Processing Queue */}
      <div className="vm-detail-section vm-failed-queue-section">
        <h4 className="vm-section-heading">
          Failed or Unclassified Email Queue ({failedOrReviewRecords.length})
        </h4>
        {failedOrReviewRecords.length === 0 ? (
          <p className="vm-muted-text">
            No failed or unclassified vendor maintenance emails require administrative reprocessing.
          </p>
        ) : (
          <div className="vm-failed-queue-list">
            {failedOrReviewRecords.map((item) => (
              <div key={item.id} className="vm-failed-queue-item">
                <div className="vm-failed-queue-meta">
                  <strong>{item.emailSubject || 'Untitled Email'}</strong>
                  <span>
                    Sender: <code>{item.senderEmail}</code> • Status: {item.status} • Processing:{' '}
                    {item.processingStatus}
                  </span>
                  {item.processingError && (
                    <span className="vm-proc-error-text">Error: {item.processingError}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="vm-btn vm-btn-outline vm-btn-sm"
                  disabled={reprocessingId === item.id}
                  onClick={() => handleReprocessItem(item.id)}
                >
                  {reprocessingId === item.id ? 'Reprocessing...' : 'Reprocess Record'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

