import {
  DEFAULT_ADMIN_SETTINGS,
  INTEGRATION_STATES,
  calculateMaintenanceSummary,
  filterAndSortMaintenanceRecords,
  processIncomingVendorEmail
} from "../types/vendorMaintenance.js";

const STORAGE_KEYS = {
  RECORDS: "productionOperationsVendorMaintenanceRecords",
  SETTINGS: "productionOperationsVendorMaintenanceSettings",
  FAILED_QUEUE: "productionOperationsVendorMaintenanceFailedQueue",
  ADMIN_AUTH: "productionOperationsAdminAuthenticated",
  ADMIN_EMAIL: "productionOperationsAdminEmail"
};

export const AUTHORIZED_ADMINS = [
  "Srihari.Gangisetti@alaskaair.com",
  "Mohan.P@alaskaair.com",
  "Margaret.Jennifer@alaskaair.com",
  "Sharmini.M@alaskaair.com",
  "Srinivasanagasai.Chevitikanti@alaskaair.com",
  "Raghava.Rohan.Dodla@alaskaair.com"
];

function getApiBaseUrl() {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
      return String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "");
    }
  } catch {
    // Ignore when not in Vite module context
  }
  if (typeof window !== "undefined" && window.VENDOR_MAINTENANCE_API_URL) {
    return String(window.VENDOR_MAINTENANCE_API_URL).replace(/\/$/, "");
  }
  return "http://localhost:47833";
}

function getCatalogFromWindow() {
  if (typeof window === "undefined" || !window.masterData) {
    return { vendors: [], applications: [] };
  }
  const vendors = Array.isArray(window.masterData.vendors) ? window.masterData.vendors : [];
  const appsObj = window.masterData.applications || {};
  const applications = Array.isArray(appsObj) ? appsObj : Object.values(appsObj);
  return { vendors, applications };
}

function readLocalJson(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function getAdminSession() {
  if (typeof localStorage === "undefined") {
    return { isAuthenticated: false, email: null, isAuthorizedAdmin: false };
  }
  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === "true";
  const email = (localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL) || "").trim();
  const isAuthorizedAdmin =
    isAuthenticated &&
    Boolean(email) &&
    AUTHORIZED_ADMINS.some(admin => admin.toLowerCase() === email.toLowerCase());

  return {
    authenticated: isAuthorizedAdmin,
    isAuthenticated,
    email: isAuthorizedAdmin ? email : null,
    isAuthorizedAdmin
  };
}

function getAuthHeaders(extraHeaders = {}) {
  const session = getAdminSession();
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders
  };
  if (session.isAuthorizedAdmin && session.email) {
    headers["X-Admin-Email"] = session.email;
    headers["X-Admin-Session"] = "authorized";
  }
  return headers;
}

export function getLocalSettings() {
  const saved = readLocalJson(STORAGE_KEYS.SETTINGS, null);
  if (!saved || typeof saved !== "object") {
    return { ...DEFAULT_ADMIN_SETTINGS };
  }
  return {
    ...DEFAULT_ADMIN_SETTINGS,
    ...saved,
    approvedVendorSenders: Array.isArray(saved.approvedVendorSenders)
      ? saved.approvedVendorSenders
      : DEFAULT_ADMIN_SETTINGS.approvedVendorSenders,
    approvedVendorDomains: Array.isArray(saved.approvedVendorDomains)
      ? saved.approvedVendorDomains
      : DEFAULT_ADMIN_SETTINGS.approvedVendorDomains,
    applicationAliases:
      saved.applicationAliases && typeof saved.applicationAliases === "object"
        ? saved.applicationAliases
        : DEFAULT_ADMIN_SETTINGS.applicationAliases
  };
}

export function getLocalRecords() {
  const records = readLocalJson(STORAGE_KEYS.RECORDS, []);
  return Array.isArray(records) ? records.filter(r => r && !r.isDemo) : [];
}

export function getLocalFailedQueue() {
  const queue = readLocalJson(STORAGE_KEYS.FAILED_QUEUE, []);
  return Array.isArray(queue) ? queue : [];
}

/**
 * Fetch paginated, filtered, sorted maintenance records + summary from API (or local storage fallback).
 */
export async function fetchVendorMaintenanceList(params = {}) {
  const {
    page = 1,
    pageSize = 10,
    vendorQuery = "",
    subjectQuery = "",
    applicationQuery = "",
    senderQuery = "",
    quickSearch = "",
    updateType = "",
    status = "",
    dateFrom = "",
    dateTo = "",
    sortBy = "receivedDate",
    sortDir = "desc"
  } = params;

  const baseUrl = getApiBaseUrl();
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    vendorQuery,
    subjectQuery,
    applicationQuery,
    senderQuery,
    quickSearch,
    updateType,
    status,
    dateFrom,
    dateTo,
    sortBy,
    sortDir
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);
    const response = await fetch(`${baseUrl}/api/vendor-maintenance?${queryParams.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const payload = await response.json();
      // Sync local cache for offline inspection
      if (Array.isArray(payload.allRecords)) {
        writeLocalJson(STORAGE_KEYS.RECORDS, payload.allRecords);
      }
      return {
        ...payload,
        backendConnected: true
      };
    }
  } catch {
    // Fall back to local store if backend server is not running
  }

  const settings = getLocalSettings();
  const allRecords = getLocalRecords();
  const filtered = filterAndSortMaintenanceRecords(allRecords, {
    vendorQuery,
    subjectQuery,
    applicationQuery,
    senderQuery,
    quickSearch,
    updateType,
    status,
    dateFrom,
    dateTo,
    sortBy,
    sortDir
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const items = filtered.slice(startIdx, startIdx + pageSize);
  const summary = calculateMaintenanceSummary(allRecords);

  const isMailboxConfigured = Boolean(settings.sourceMailbox && settings.sourceMailbox.trim());
  const integrationState = isMailboxConfigured
    ? (allRecords.length > 0 ? INTEGRATION_STATES.SYNCED : INTEGRATION_STATES.NO_DATA)
    : INTEGRATION_STATES.NOT_CONFIGURED;

  return {
    items,
    totalCount: allRecords.length,
    filteredCount: totalFiltered,
    page: safePage,
    pageSize,
    totalPages,
    summary,
    integrationState,
    isMailboxConfigured,
    sourceMailbox: settings.sourceMailbox || null,
    outlookFolder: settings.outlookFolder || "Vendor Maintenance",
    lastSyncAt: settings.lastSuccessfulIngestionAt || null,
    backendConnected: false
  };
}

/**
 * Fetch summary metrics directly (GET /api/vendor-maintenance/summary)
 */
export async function fetchVendorMaintenanceSummary() {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${baseUrl}/api/vendor-maintenance/summary`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback to local summary calculation
  }
  const settings = getLocalSettings();
  const records = getLocalRecords();
  const summary = calculateMaintenanceSummary(records);
  const isMailboxConfigured = Boolean(settings.sourceMailbox && settings.sourceMailbox.trim());

  return {
    ...summary,
    integrationState: isMailboxConfigured
      ? (records.length > 0 ? INTEGRATION_STATES.SYNCED : INTEGRATION_STATES.NO_DATA)
      : INTEGRATION_STATES.NOT_CONFIGURED,
    isMailboxConfigured,
    lastSyncAt: settings.lastSuccessfulIngestionAt || null
  };
}

/**
 * Fetch single maintenance record details (GET /api/vendor-maintenance/:id)
 */
export async function fetchVendorMaintenanceById(id) {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${baseUrl}/api/vendor-maintenance/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback to local store
  }

  const records = getLocalRecords();
  const found = records.find(r => r.id === id) || null;
  if (!found) {
    throw new Error("Maintenance record not found.");
  }
  return found;
}

/**
 * Ingest a vendor email notification (POST /api/integrations/outlook/vendor-maintenance)
 */
export async function ingestOutlookVendorEmail(emailPayload) {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(`${baseUrl}/api/integrations/outlook/vendor-maintenance`, {
      method: "POST",
      headers: getAuthHeaders({ "X-Integration-Source": "PowerAutomate-Outlook-V3" }),
      body: JSON.stringify(emailPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to ingest vendor email.");
    }
    return data;
  } catch (err) {
    if (err.message && !err.message.includes("fetch") && !err.message.includes("abort") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
  }

  // Local fallback processing when Node API is offline
  const settings = getLocalSettings();
  if (!settings.automaticProcessingEnabled) {
    throw new Error("Automatic email ingestion is currently disabled in Admin Settings.");
  }

  const catalog = getCatalogFromWindow();
  const existing = getLocalRecords();
  const result = processIncomingVendorEmail(emailPayload, catalog, settings, existing);

  if (!result.ok) {
    const failedQueue = getLocalFailedQueue();
    const failedEntry = {
      id: `fail-${Date.now()}`,
      timestamp: new Date().toISOString(),
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      senderEmail: emailPayload?.senderEmail || "Unknown",
      emailSubject: emailPayload?.emailSubject || "(No Subject)",
      rawPayload: {
        senderEmail: emailPayload?.senderEmail,
        emailSubject: emailPayload?.emailSubject,
        receivedDate: emailPayload?.receivedDate,
        outlookMessageId: emailPayload?.outlookMessageId
      }
    };
    writeLocalJson(STORAGE_KEYS.FAILED_QUEUE, [failedEntry, ...failedQueue].slice(0, 100));
    throw new Error(result.errorMessage);
  }

  if (!result.duplicate) {
    let nextRecords;
    if (result.correlatedUpdate) {
      nextRecords = existing.map(r => (r.id === result.record.id ? result.record : r));
    } else {
      nextRecords = [result.record, ...existing];
    }
    writeLocalJson(STORAGE_KEYS.RECORDS, nextRecords);
    const updatedSettings = {
      ...settings,
      lastSuccessfulIngestionAt: new Date().toISOString()
    };
    writeLocalJson(STORAGE_KEYS.SETTINGS, updatedSettings);
  }

  return result;
}

/**
 * Reprocess a maintenance record (POST /api/vendor-maintenance/:id/reprocess)
 * Restricted to authorized administrators.
 */
export async function reprocessMaintenanceRecord(id) {
  const session = getAdminSession();
  if (!session.isAuthorizedAdmin) {
    throw new Error("Unauthorized: Only authenticated Production Operations administrators can reprocess records.");
  }

  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${baseUrl}/api/vendor-maintenance/${encodeURIComponent(id)}/reprocess`, {
      method: "POST",
      headers: getAuthHeaders(),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback to local re-extraction
  }

  const records = getLocalRecords();
  const target = records.find(r => r.id === id);
  if (!target) {
    throw new Error("Record not found for reprocessing.");
  }

  const settings = getLocalSettings();
  const catalog = getCatalogFromWindow();
  const otherRecords = records.filter(r => r.id !== id);
  const reprocessed = processIncomingVendorEmail(
    {
      id: target.id,
      senderEmail: target.senderEmail,
      senderDisplayName: target.senderDisplayName,
      emailSubject: target.emailSubject,
      emailBodyText: target.emailBodyText,
      emailBodyHtml: target.emailBodyHtml,
      receivedDate: target.receivedDate,
      originalEmailWebLink: target.originalEmailWebLink,
      outlookMessageId: target.outlookMessageId,
      outlookInternetMessageId: target.outlookInternetMessageId,
      conversationId: target.conversationId,
      sourceMailbox: target.sourceMailbox,
      attachments: target.attachments
    },
    catalog,
    settings,
    otherRecords
  );

  if (!reprocessed.ok) {
    throw new Error(reprocessed.errorMessage || "Reprocessing failed.");
  }

  const nowIso = new Date().toISOString();
  const updatedRecord = {
    ...reprocessed.record,
    id: target.id,
    createdAt: target.createdAt,
    updatedAt: nowIso,
    lastProcessedAt: nowIso,
    processingHistory: [
      {
        timestamp: nowIso,
        action: `Manual Reprocess by ${session.email}`,
        status: reprocessed.record.processingStatus,
        details: `Re-evaluated vendor and application rules. Status: ${reprocessed.record.status}.`
      },
      ...(target.processingHistory || [])
    ],
    auditTrail: [
      {
        timestamp: nowIso,
        actor: session.email,
        change: `Reprocessed record (Status: ${target.status} → ${reprocessed.record.status})`
      },
      ...(target.auditTrail || [])
    ]
  };

  const nextRecords = records.map(r => (r.id === id ? updatedRecord : r));
  writeLocalJson(STORAGE_KEYS.RECORDS, nextRecords);
  return updatedRecord;
}

/**
 * Update a maintenance record status or classification (PATCH /api/vendor-maintenance/:id)
 * Restricted to authorized administrators.
 */
export async function updateMaintenanceRecordStatus(id, patchData) {
  const session = getAdminSession();
  if (!session.isAuthorizedAdmin) {
    throw new Error("Unauthorized: Administrator sign-in is required to modify maintenance status.");
  }

  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${baseUrl}/api/vendor-maintenance/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(patchData),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback to local update
  }

  const records = getLocalRecords();
  const target = records.find(r => r.id === id);
  if (!target) {
    throw new Error("Maintenance record not found.");
  }

  const nowIso = new Date().toISOString();
  const updated = {
    ...target,
    ...patchData,
    updatedAt: nowIso,
    auditTrail: [
      {
        timestamp: nowIso,
        actor: session.email,
        change: `Updated record (${Object.keys(patchData).join(", ")})`
      },
      ...(target.auditTrail || [])
    ]
  };

  const nextRecords = records.map(r => (r.id === id ? updated : r));
  writeLocalJson(STORAGE_KEYS.RECORDS, nextRecords);
  return updated;
}

/**
 * Fetch Admin Settings for Vendor Maintenance Outlook Integration
 */
export async function fetchMaintenanceAdminSettings() {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${baseUrl}/api/vendor-maintenance/admin/settings`, {
      method: "GET",
      headers: getAuthHeaders(),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data.settings) {
        writeLocalJson(STORAGE_KEYS.SETTINGS, data.settings);
      }
      return data;
    }
  } catch {
    // Fallback to local settings
  }

  return {
    settings: getLocalSettings(),
    failedQueue: getLocalFailedQueue()
  };
}

/**
 * Save Admin Settings for Vendor Maintenance Outlook Integration.
 * Strictly requires an authenticated administrator session.
 */
export async function saveMaintenanceAdminSettings(nextSettings) {
  const session = getAdminSession();
  if (!session.isAuthorizedAdmin) {
    throw new Error("Unauthorized: Only authenticated Production Operations administrators can modify Outlook integration settings.");
  }

  const sanitizedSettings = {
    ...DEFAULT_ADMIN_SETTINGS,
    ...nextSettings,
    updatedBy: session.email,
    updatedAt: new Date().toISOString()
  };

  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${baseUrl}/api/vendor-maintenance/admin/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(sanitizedSettings),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const saved = await response.json();
      writeLocalJson(STORAGE_KEYS.SETTINGS, saved.settings || sanitizedSettings);
      return saved.settings || sanitizedSettings;
    }
  } catch {
    // Save locally when API server is offline
  }

  writeLocalJson(STORAGE_KEYS.SETTINGS, sanitizedSettings);
  return sanitizedSettings;
}
