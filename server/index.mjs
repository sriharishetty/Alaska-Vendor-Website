import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import {
  DEFAULT_ADMIN_SETTINGS,
  INTEGRATION_STATES,
  MAINTENANCE_STATUSES,
  UPDATE_TYPES,
  processIncomingVendorEmail,
  calculateMaintenanceSummary,
  filterAndSortMaintenanceRecords,
  sanitizeEmailHtml,
  validateOutlookWebLink
} from '../admin-react/src/types/vendorMaintenance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DB_PATH = path.resolve(__dirname, 'data', 'vendor-maintenance-db.json');
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB payload limit

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

/**
 * Loads canonical vendors and applications from js/data/master-data.js
 */
export function loadMasterDataFromDisk() {
  try {
    const masterDataFile = path.resolve(PROJECT_ROOT, 'js', 'data', 'master-data.js');
    if (!existsSync(masterDataFile)) {
      return { vendors: [], applications: [] };
    }
    const code = readFileSync(masterDataFile, 'utf8');
    const sandbox = { window: {}, localStorage: { getItem: () => null } };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { timeout: 2000 });
    const md =
      sandbox.window.masterData ||
      sandbox.window.POC_MASTER_DATA ||
      sandbox.window.PRODUCTION_OPERATIONS_DATA ||
      {};
    const vendors = Array.isArray(md.vendors) ? md.vendors : Object.values(md.vendors || {});
    const applications = Array.isArray(md.applications)
      ? md.applications
      : Object.values(md.applications || {});
    return { vendors, applications };
  } catch {
    return { vendors: [], applications: [] };
  }
}

/**
 * Builds in-memory indexes for fast lookup & constraint enforcement
 */
export function buildDatabaseIndexes(records = []) {
  const indexes = {
    byMessageIdentity: new Map(),
    byVendor: new Map(),
    byStatus: new Map(),
    byUpdateType: new Map(),
    byReceivedDate: [],
    byMaintenanceStart: []
  };

  for (const r of records) {
    if (!r || !r.id) continue;
    const mailboxKey = String(r.sourceMailbox || 'default').toLowerCase();
    if (r.outlookInternetMessageId) {
      indexes.byMessageIdentity.set(
        `${mailboxKey}::internet::${String(r.outlookInternetMessageId).toLowerCase()}`,
        r.id
      );
    }
    if (r.outlookMessageId) {
      indexes.byMessageIdentity.set(
        `${mailboxKey}::msg::${String(r.outlookMessageId).toLowerCase()}`,
        r.id
      );
    }

    const vendorKey = String(r.vendorId || r.vendorName || 'unknown').toLowerCase();
    if (!indexes.byVendor.has(vendorKey)) indexes.byVendor.set(vendorKey, []);
    indexes.byVendor.get(vendorKey).push(r.id);

    const statusKey = String(r.status || 'New');
    if (!indexes.byStatus.has(statusKey)) indexes.byStatus.set(statusKey, []);
    indexes.byStatus.get(statusKey).push(r.id);

    const typeKey = String(r.updateType || 'Unknown / Requires Classification');
    if (!indexes.byUpdateType.has(typeKey)) indexes.byUpdateType.set(typeKey, []);
    indexes.byUpdateType.get(typeKey).push(r.id);

    if (r.receivedDate) {
      indexes.byReceivedDate.push({ id: r.id, ts: new Date(r.receivedDate).getTime() });
    }
    if (r.maintenanceStart) {
      indexes.byMaintenanceStart.push({ id: r.id, ts: new Date(r.maintenanceStart).getTime() });
    }
  }

  indexes.byReceivedDate.sort((a, b) => b.ts - a.ts);
  indexes.byMaintenanceStart.sort((a, b) => a.ts - b.ts);
  return indexes;
}

/**
 * Creates a self-contained Vendor Maintenance HTTP Server instance
 */
export function createVendorMaintenanceServer(options = {}) {
  const dbPath = options.dbPath || process.env.VENDOR_MAINTENANCE_DB_PATH || DEFAULT_DB_PATH;
  const webhookApiKey =
    options.webhookApiKey !== undefined
      ? options.webhookApiKey
      : process.env.VENDOR_MAINTENANCE_WEBHOOK_SECRET || process.env.OUTLOOK_WEBHOOK_API_KEY || '';
  const requireWebhookAuth =
    options.requireWebhookAuth !== undefined
      ? options.requireWebhookAuth
      : Boolean(webhookApiKey);
  const allowedOrigin = options.allowedOrigin || process.env.ALLOWED_CORS_ORIGIN || '*';
  const rateLimitPerMinute = Number(options.rateLimitPerMinute || 120);

  const masterData = options.masterData || loadMasterDataFromDisk();

  let state = {
    records: [],
    settings: { ...DEFAULT_ADMIN_SETTINGS },
    lastSyncAt: null,
    failedQueue: []
  };

  // Load persisted database if present
  try {
    if (existsSync(dbPath)) {
      const raw = JSON.parse(readFileSync(dbPath, 'utf8'));
      if (raw && typeof raw === 'object') {
        state.records = Array.isArray(raw.records) ? raw.records : [];
        state.settings = { ...DEFAULT_ADMIN_SETTINGS, ...(raw.settings || {}) };
        state.lastSyncAt = raw.lastSyncAt || null;
        state.failedQueue = Array.isArray(raw.failedQueue) ? raw.failedQueue : [];
      }
    }
  } catch {
    // start with clean state if file unreadable
  }

  let indexes = buildDatabaseIndexes(state.records);
  const rateBuckets = new Map();

  async function persistState() {
    indexes = buildDatabaseIndexes(state.records);
    if (options.inMemoryOnly) return;
    try {
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(state, null, 2), 'utf8');
    } catch {
      // ignore disk write errors in read-only environments
    }
  }

  function checkRateLimit(ip) {
    const now = Date.now();
    const bucket = rateBuckets.get(ip) || { count: 0, resetAt: now + 60_000 };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + 60_000;
    }
    bucket.count += 1;
    rateBuckets.set(ip, bucket);
    return bucket.count <= rateLimitPerMinute;
  }

  function isWebhookAuthorized(req) {
    if (!requireWebhookAuth) return true;
    const headerKey = req.headers['x-api-key'] || req.headers['x-webhook-secret'] || '';
    const authHeader = req.headers['authorization'] || '';
    const bearerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    return (
      (headerKey && headerKey === webhookApiKey) ||
      (bearerToken && bearerToken === webhookApiKey)
    );
  }

  function isAdminAuthorized(req) {
    const adminEmail = req.headers['x-admin-email'] || '';
    const apiKey = req.headers['x-api-key'] || req.headers['x-webhook-secret'] || '';
    if (webhookApiKey && apiKey === webhookApiKey) return true;
    if (adminEmail && adminEmail.toLowerCase().endsWith('@alaskaair.com')) return true;
    if (!options.strictAdminAuth) return true;
    return false;
  }

  function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Admin-Email',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify(payload));
  }

  function readJsonBody(req) {
    return new Promise((resolve, reject) => {
      let totalBytes = 0;
      const chunks = [];
      req.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_BODY_BYTES) {
          reject(Object.assign(new Error('Request payload exceeds maximum size limit'), { status: 413 }));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8');
          if (!text.trim()) {
            resolve({});
            return;
          }
          resolve(JSON.parse(text));
        } catch {
          reject(Object.assign(new Error('Invalid JSON payload'), { status: 400 }));
        }
      });
      req.on('error', (err) => reject(err));
    });
  }

  function getIntegrationState() {
    if (
      state.settings.webhookConfigured ||
      Boolean(state.lastSyncAt) ||
      state.records.length > 0
    ) {
      return INTEGRATION_STATES.CONNECTED;
    }
    return INTEGRATION_STATES.NOT_CONFIGURED;
  }

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Admin-Email'
        });
        res.end();
        return;
      }

      const clientIp = req.socket?.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp)) {
        sendJson(res, 429, { error: 'Too many requests. Please retry after one minute.' });
        return;
      }

      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname.replace(/\/$/, '') || '/';

      // 1. GET /api/vendor-maintenance/summary
      if (req.method === 'GET' && pathname === '/api/vendor-maintenance/summary') {
        const summary = calculateMaintenanceSummary(state.records);
        sendJson(res, 200, {
          ...summary,
          integrationState: getIntegrationState(),
          lastSyncAt: state.lastSyncAt,
          monitoredFolderName: state.settings.monitoredFolderName,
          indexStats: {
            uniqueMessagesIndexed: indexes.byMessageIdentity.size,
            vendorsIndexed: indexes.byVendor.size
          }
        });
        return;
      }

      // 2. GET /api/vendor-maintenance/admin/settings
      if (req.method === 'GET' && pathname === '/api/vendor-maintenance/admin/settings') {
        sendJson(res, 200, {
          settings: state.settings,
          integrationState: getIntegrationState(),
          lastSyncAt: state.lastSyncAt,
          failedQueueCount: state.failedQueue.length
        });
        return;
      }

      // 3. PUT /api/vendor-maintenance/admin/settings
      if (req.method === 'PUT' && pathname === '/api/vendor-maintenance/admin/settings') {
        if (!isAdminAuthorized(req)) {
          sendJson(res, 403, { error: 'Administrative authorization required.' });
          return;
        }
        const body = await readJsonBody(req);
        state.settings = {
          ...state.settings,
          ...body,
          updatedAt: new Date().toISOString()
        };
        await persistState();
        sendJson(res, 200, {
          settings: state.settings,
          integrationState: getIntegrationState()
        });
        return;
      }

      // 4. GET /api/vendor-maintenance
      if (req.method === 'GET' && pathname === '/api/vendor-maintenance') {
        const filters = {
          vendorName: parsedUrl.searchParams.get('vendorName') || '',
          emailSubject: parsedUrl.searchParams.get('emailSubject') || '',
          application: parsedUrl.searchParams.get('application') || '',
          senderEmail: parsedUrl.searchParams.get('senderEmail') || '',
          updateType: parsedUrl.searchParams.get('updateType') || '',
          status: parsedUrl.searchParams.get('status') || '',
          dateFrom: parsedUrl.searchParams.get('dateFrom') || '',
          dateTo: parsedUrl.searchParams.get('dateTo') || '',
          sortBy: parsedUrl.searchParams.get('sortBy') || 'receivedDate',
          sortOrder: parsedUrl.searchParams.get('sortOrder') || 'desc'
        };

        const filtered = filterAndSortMaintenanceRecords(state.records, filters);
        sendJson(res, 200, {
          records: filtered,
          totalCount: state.records.length,
          filteredCount: filtered.length,
          integrationState: getIntegrationState(),
          lastSyncAt: state.lastSyncAt
        });
        return;
      }

      // 5. POST /api/integrations/outlook/vendor-maintenance or /api/vendor-maintenance/email-intake
      if (
        req.method === 'POST' &&
        (pathname === '/api/integrations/outlook/vendor-maintenance' ||
          pathname === '/api/vendor-maintenance/email-intake')
      ) {
        if (!isWebhookAuthorized(req)) {
          sendJson(res, 401, {
            error: 'Unauthorized webhook request. Provide a valid API key or Bearer token.'
          });
          return;
        }

        if (state.settings.enableAutoProcessing === false) {
          sendJson(res, 503, {
            error: 'Automatic vendor email processing is currently paused by an administrator.'
          });
          return;
        }

        const payload = await readJsonBody(req);
        const result = processIncomingVendorEmail(
          payload,
          masterData,
          state.settings,
          state.records
        );

        if (!result.ok) {
          sendJson(res, 400, {
            error: result.errorMessage || 'Invalid email payload.',
            errorCode: result.errorCode
          });
          return;
        }

        state.lastSyncAt = new Date().toISOString();
        state.settings.webhookConfigured = true;

        if (result.duplicate) {
          await persistState();
          sendJson(res, 200, {
            duplicate: true,
            message: 'Duplicate email detected; existing maintenance record returned.',
            record: result.record
          });
          return;
        }

        if (result.correlatedUpdate) {
          state.records = state.records.map((r) =>
            r.id === result.record.id ? result.record : r
          );
        } else {
          state.records.unshift(result.record);
        }

        await persistState();
        sendJson(res, 201, {
          duplicate: false,
          record: result.record,
          correlatedUpdate: Boolean(result.correlatedUpdate)
        });
        return;
      }

      // 6. POST /api/vendor-maintenance/:id/reprocess
      const reprocessMatch = pathname.match(/^\/api\/vendor-maintenance\/([^/]+)\/reprocess$/);
      if (req.method === 'POST' && reprocessMatch) {
        if (!isAdminAuthorized(req)) {
          sendJson(res, 403, { error: 'Administrative authorization required to reprocess records.' });
          return;
        }
        const recordId = decodeURIComponent(reprocessMatch[1]);
        const target = state.records.find((r) => r.id === recordId);
        if (!target) {
          sendJson(res, 404, { error: 'Maintenance record not found.' });
          return;
        }

        const body = await readJsonBody(req);
        const otherRecords = state.records.filter((r) => r.id !== recordId);
        const reprocessed = processIncomingVendorEmail(
          {
            from: target.senderEmail,
            subject: target.emailSubject,
            bodyText: target.emailBodyText,
            bodyHtml: target.emailBodyHtml,
            receivedDateTime: target.receivedDate,
            webLink: target.originalEmailWebLink,
            messageId: `${target.outlookMessageId}-reproc-${Date.now()}`,
            internetMessageId: `${target.outlookInternetMessageId}-reproc-${Date.now()}`,
            conversationId: target.conversationId,
            sourceMailbox: target.sourceMailbox,
            attachments: target.attachments
          },
          masterData,
          state.settings,
          otherRecords
        );

        const nowIso = new Date().toISOString();
        const updatedRecord = {
          ...reprocessed.record,
          id: target.id,
          outlookMessageId: target.outlookMessageId,
          outlookInternetMessageId: target.outlookInternetMessageId,
          createdAt: target.createdAt,
          updatedAt: nowIso,
          lastProcessedAt: nowIso,
          processingHistory: [
            ...(target.processingHistory || []),
            {
              timestamp: nowIso,
              action: 'Reprocessed',
              actor: body.actor || req.headers['x-admin-email'] || 'Operations Admin',
              details: `Re-evaluated vendor/application matching: ${reprocessed.record.vendorName} / ${reprocessed.record.applicationName} (${reprocessed.record.updateType})`
            }
          ]
        };

        state.records = state.records.map((r) => (r.id === recordId ? updatedRecord : r));
        await persistState();
        sendJson(res, 200, { record: updatedRecord });
        return;
      }

      // 7. GET /api/vendor-maintenance/:id and PATCH /api/vendor-maintenance/:id
      const itemMatch = pathname.match(/^\/api\/vendor-maintenance\/([^/]+)$/);
      if (itemMatch) {
        const recordId = decodeURIComponent(itemMatch[1]);
        const target = state.records.find((r) => r.id === recordId);
        if (!target) {
          sendJson(res, 404, { error: 'Maintenance record not found.' });
          return;
        }

        if (req.method === 'GET') {
          sendJson(res, 200, { record: target });
          return;
        }

        if (req.method === 'PATCH') {
          if (!isAdminAuthorized(req)) {
            sendJson(res, 403, { error: 'Administrative authorization required.' });
            return;
          }
          const patch = await readJsonBody(req);
          if (patch.status && !MAINTENANCE_STATUSES.includes(patch.status)) {
            sendJson(res, 400, { error: `Invalid maintenance status: ${patch.status}` });
            return;
          }
          if (patch.updateType && !UPDATE_TYPES.includes(patch.updateType)) {
            sendJson(res, 400, { error: `Invalid update type: ${patch.updateType}` });
            return;
          }

          const nowIso = new Date().toISOString();
          const nextStatus = patch.status || target.status;
          const updatedRecord = {
            ...target,
            status: nextStatus,
            updateType: patch.updateType || target.updateType,
            applicationName: patch.applicationName || target.applicationName,
            operationalImpact: patch.operationalImpact || target.operationalImpact,
            originalEmailWebLink:
              patch.originalEmailWebLink !== undefined
                ? validateOutlookWebLink(patch.originalEmailWebLink)
                : target.originalEmailWebLink,
            emailBodyHtml:
              patch.emailBodyHtml !== undefined
                ? sanitizeEmailHtml(patch.emailBodyHtml)
                : target.emailBodyHtml,
            updatedAt: nowIso,
            processingHistory: [
              ...(target.processingHistory || []),
              {
                timestamp: nowIso,
                action: 'Status Updated',
                actor: patch.actor || req.headers['x-admin-email'] || 'Operations Admin',
                details: patch.reason || `Status updated to ${nextStatus} by authorized user.`
              }
            ]
          };

          state.records = state.records.map((r) => (r.id === recordId ? updatedRecord : r));
          await persistState();
          sendJson(res, 200, { record: updatedRecord });
          return;
        }
      }

      // 8. Static file serving for local development & /vendor-maintenance route
      if (req.method === 'GET') {
        let relativePath = pathname === '/' ? '/home.html' : pathname;
        if (relativePath === '/vendor-maintenance') {
          relativePath = '/vendor-maintenance.html';
        }
        const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullFilePath = path.join(PROJECT_ROOT, safePath);

        if (fullFilePath.startsWith(PROJECT_ROOT) && existsSync(fullFilePath)) {
          const stat = await fs.stat(fullFilePath);
          if (stat.isFile()) {
            const ext = path.extname(fullFilePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            const content = await fs.readFile(fullFilePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
            return;
          }
        }
      }

      sendJson(res, 404, { error: 'Endpoint or resource not found.' });
    } catch (err) {
      const status = err?.status || 500;
      const safeMessage =
        status < 500
          ? err.message
          : 'An internal server error occurred while processing the maintenance request.';
      sendJson(res, status, { error: safeMessage });
    }
  });

  return { server, getState: () => state };
}

// Start server when run directly via `node server/index.mjs`
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase() ===
    fileURLToPath(import.meta.url).toLowerCase();

if (isMainModule) {
  const port = Number(process.env.PORT || 8787);
  const { server } = createVendorMaintenanceServer();
  server.listen(port, () => {
    console.log(
      `[Production Operations Connect] Server & Outlook Webhook API running on http://localhost:${port}`
    );
    console.log(
      `[Vendor Maintenance UI] http://localhost:${port}/vendor-maintenance`
    );
    console.log(
      `[Outlook Webhook Endpoint] POST http://localhost:${port}/api/integrations/outlook/vendor-maintenance`
    );
  });
}
