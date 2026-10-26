/**
 * SharePoint Online / Microsoft Graph Storage Adapter for VendorMaintenanceUpdates List
 *
 * Uses server-side Microsoft Entra ID Client Credentials flow when configured via environment variables:
 * - AZURE_TENANT_ID
 * - AZURE_CLIENT_ID
 * - AZURE_CLIENT_SECRET
 * - SHAREPOINT_SITE_ID
 * - SHAREPOINT_LIST_ID (List Name: VendorMaintenanceUpdates)
 *
 * Never exposes credentials or tokens to browser clients.
 */

export function isSharePointConfigured(env = process.env) {
  return Boolean(
    env.AZURE_TENANT_ID &&
      env.AZURE_CLIENT_ID &&
      env.AZURE_CLIENT_SECRET &&
      env.SHAREPOINT_SITE_ID &&
      env.SHAREPOINT_LIST_ID
  );
}

let cachedToken = null;
let tokenExpiresAt = 0;

async function getGraphAccessToken(env = process.env) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(
    env.AZURE_TENANT_ID
  )}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: env.AZURE_CLIENT_ID,
    client_secret: env.AZURE_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    throw new Error(`Entra ID token request failed with status ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (Number(data.expires_in) || 3600) * 1000;
  return cachedToken;
}

/**
 * Maps internal VendorMaintenanceUpdate model to SharePoint List item fields
 */
export function mapRecordToSharePointFields(record) {
  return {
    Title: String(record.emailSubject || 'No Subject').slice(0, 255),
    RecordId: record.id,
    VendorName: record.vendorName || 'Unknown',
    VendorId: record.vendorId || '',
    SenderEmail: record.senderEmail || '',
    ApplicationName: record.applicationName || 'Unknown',
    UpdateType: record.updateType || 'Unknown / Requires Classification',
    Status: record.status || 'New',
    Severity: record.severity || 'Medium',
    ReceivedDate: record.receivedDate || null,
    MaintenanceStart: record.maintenanceStart || null,
    MaintenanceEnd: record.maintenanceEnd || null,
    TimeZone: record.timeZone || 'Unknown',
    OperationalImpact: record.operationalImpact || 'Unknown',
    ExtractedSummary: record.extractedSummary || '',
    EmailBodyText: record.emailBodyText || '',
    EmailBodyHtml: record.emailBodyHtml || '',
    OriginalEmailWebLink: record.originalEmailWebLink || '',
    OutlookMessageId: record.outlookMessageId || '',
    InternetMessageId: record.outlookInternetMessageId || '',
    ConversationId: record.conversationId || '',
    SourceMailbox: record.sourceMailbox || '',
    ProcessingStatus: record.processingStatus || 'Processed',
    ProcessingError: record.processingError || '',
    LastProcessedAt: record.lastProcessedAt || new Date().toISOString()
  };
}

/**
 * Maps SharePoint List item fields back to VendorMaintenanceUpdate model
 */
export function mapSharePointItemToRecord(item) {
  const f = item.fields || {};
  return {
    id: f.RecordId || `vmu-sp-${item.id}`,
    sharePointItemId: item.id,
    vendorId: f.VendorId || null,
    vendorName: f.VendorName || 'Unknown',
    senderEmail: f.SenderEmail || 'Not provided',
    emailSubject: f.Title || 'No Subject',
    emailBodyText: f.EmailBodyText || '',
    emailBodyHtml: f.EmailBodyHtml || '',
    receivedDate: f.ReceivedDate || item.createdDateTime,
    updateType: f.UpdateType || 'Unknown / Requires Classification',
    applicationName: f.ApplicationName || 'Unknown',
    maintenanceStart: f.MaintenanceStart || null,
    maintenanceEnd: f.MaintenanceEnd || null,
    timeZone: f.TimeZone || 'Unknown',
    status: f.Status || 'New',
    severity: f.Severity || 'Medium',
    operationalImpact: f.OperationalImpact || 'Unknown',
    extractedSummary: f.ExtractedSummary || '',
    originalEmailWebLink: f.OriginalEmailWebLink || null,
    outlookMessageId: f.OutlookMessageId || '',
    outlookInternetMessageId: f.InternetMessageId || '',
    conversationId: f.ConversationId || '',
    sourceMailbox: f.SourceMailbox || '',
    processingStatus: f.ProcessingStatus || 'Processed',
    processingError: f.ProcessingError || null,
    createdAt: item.createdDateTime || new Date().toISOString(),
    updatedAt: item.lastModifiedDateTime || new Date().toISOString(),
    lastProcessedAt: f.LastProcessedAt || item.lastModifiedDateTime || new Date().toISOString(),
    attachments: [],
    processingHistory: [
      {
        timestamp: f.LastProcessedAt || item.createdDateTime || new Date().toISOString(),
        action: 'Synchronized from SharePoint List',
        actor: 'SharePoint Graph Adapter',
        details: `Loaded item ${item.id} from SharePoint list VendorMaintenanceUpdates`
      }
    ]
  };
}

export async function createSharePointMaintenanceItem(record, env = process.env) {
  const token = await getGraphAccessToken(env);
  const url = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(
    env.SHAREPOINT_SITE_ID
  )}/lists/${encodeURIComponent(env.SHAREPOINT_LIST_ID)}/items`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: mapRecordToSharePointFields(record)
    })
  });

  if (!res.ok) {
    throw new Error(`SharePoint item creation failed with status ${res.status}`);
  }
  return await res.json();
}

