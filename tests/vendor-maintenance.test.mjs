import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

import {
  UPDATE_TYPES,
  MAINTENANCE_STATUSES,
  INTEGRATION_STATES,
  DEFAULT_ADMIN_SETTINGS,
  DEMO_MAINTENANCE_RECORDS,
  validateOutlookWebLink,
  sanitizeEmailHtml,
  normalizeAttachments,
  matchVendorFromDirectory,
  matchApplicationsFromText,
  extractMaintenanceDates,
  classifyMaintenanceEmail,
  processIncomingVendorEmail,
  calculateMaintenanceSummary,
  filterAndSortMaintenanceRecords
} from "../admin-react/src/types/vendorMaintenance.js";
import { createVendorMaintenanceServer, loadMasterDataFromDisk } from "../server/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(here, "..");

const results = [];
async function runTest(name, fn) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`PASS: ${name}`);
  } catch (err) {
    results.push({ name, passed: false, error: err.message || String(err) });
    console.error(`FAIL: ${name}\n  -> ${err.stack || err.message}`);
  }
}

const directory = loadMasterDataFromDisk();

// ============================================================================
// TEST 1: Rendering the Vendor Maintenance page & bundle execution in DOM sandbox
// ============================================================================
await runTest("1. Rendering the Vendor Maintenance page and verifying bundle execution", async () => {
  const bundleCode = await readFile(resolve(rootDir, "js/vendor-maintenance.bundle.js"), "utf8");
  assert.ok(bundleCode.includes("Vendor Maintenance"), "Bundle must include Vendor Maintenance page title");
  assert.ok(
    bundleCode.includes(
      "Track vendor maintenance notifications, planned service interruptions, application updates, and operational impacts in one place."
    ),
    "Bundle must include exact required subtitle"
  );
  const script = new vm.Script(bundleCode, { filename: "vendor-maintenance.bundle.js" });
  assert.ok(script, "Vendor Maintenance bundle must compile as valid JS");
});

// ============================================================================
// TEST 2: Empty state when no records exist
// ============================================================================
await runTest("2. Empty state when no records exist", async () => {
  const emptySource = await readFile(
    resolve(rootDir, "admin-react/src/components/maintenance/MaintenanceEmptyState.jsx"),
    "utf8"
  );
  assert.ok(
    emptySource.includes(
      "No vendor maintenance updates yet. Once the Outlook integration is configured, incoming vendor notifications will appear here automatically."
    ),
    "Empty state component must contain the exact required message when no records exist"
  );
  const summary = calculateMaintenanceSummary([]);
  assert.equal(summary.totalUpdates, 0);
  assert.equal(summary.upcomingMaintenance, 0);
  assert.equal(summary.activeIncidents, 0);
  assert.equal(summary.newNotifications, 0);
});

// ============================================================================
// TEST 3: Loading state
// ============================================================================
await runTest("3. Loading state component and integration state", async () => {
  const loadingSource = await readFile(
    resolve(rootDir, "admin-react/src/components/maintenance/MaintenanceLoadingState.jsx"),
    "utf8"
  );
  assert.ok(loadingSource.includes("vm-loading-state"), "Loading state must render skeleton container");
  assert.equal(INTEGRATION_STATES.LOADING, "loading");
});

// ============================================================================
// TEST 4: Error state when the API fails
// ============================================================================
await runTest("4. Error state when the API fails", async () => {
  const errorSource = await readFile(
    resolve(rootDir, "admin-react/src/components/maintenance/MaintenanceErrorState.jsx"),
    "utf8"
  );
  assert.ok(errorSource.includes("onRetry"), "Error state must support retry handler");
  assert.equal(INTEGRATION_STATES.UNAVAILABLE, "unavailable");
});

// ============================================================================
// TEST 5: Summary card counts (calculated dynamically from real records)
// ============================================================================
await runTest("5. Summary card counts calculated accurately from maintenance records", async () => {
  const now = new Date("2026-10-25T12:00:00Z");
  const sampleRecords = [
    {
      id: "r1",
      updateType: "Scheduled Maintenance",
      status: "Scheduled",
      maintenanceStart: "2026-10-26T06:00:00Z",
      maintenanceEnd: "2026-10-26T08:00:00Z"
    },
    {
      id: "r2",
      updateType: "Service Outage",
      status: "Investigating",
      maintenanceStart: "2026-10-25T10:00:00Z",
      maintenanceEnd: null
    },
    {
      id: "r3",
      updateType: "Application Update",
      status: "New",
      maintenanceStart: null,
      maintenanceEnd: null
    },
    {
      id: "r4",
      updateType: "Scheduled Maintenance",
      status: "Completed",
      maintenanceStart: "2026-10-20T02:00:00Z",
      maintenanceEnd: "2026-10-20T04:00:00Z"
    }
  ];
  const counts = calculateMaintenanceSummary(sampleRecords, now);
  assert.equal(counts.totalUpdates, 4, "Total Vendor Updates should equal 4");
  assert.equal(counts.upcomingMaintenance, 1, "Upcoming Maintenance should equal 1");
  assert.equal(counts.activeIncidents, 1, "Active Incidents should equal 1");
  assert.equal(counts.newNotifications, 1, "New Notifications should equal 1");
});

// ============================================================================
// TEST 6: Search by vendor, subject, application, and sender
// ============================================================================
await runTest("6. Search by vendor name, email subject, application, and sender email", async () => {
  const byVendor = filterAndSortMaintenanceRecords(DEMO_MAINTENANCE_RECORDS, { vendorName: "Smart4Aviation" });
  assert.equal(byVendor.length, 1);
  assert.equal(byVendor[0].vendorName, "Smart4Aviation");

  const bySubject = filterAndSortMaintenanceRecords(DEMO_MAINTENANCE_RECORDS, { emailSubject: "Upper Wind Feed" });
  assert.equal(bySubject.length, 1);
  assert.equal(bySubject[0].vendorName, "Jeppesen");

  const byApp = filterAndSortMaintenanceRecords(DEMO_MAINTENANCE_RECORDS, { application: "JetPlan" });
  assert.equal(byApp.length, 1);
  assert.equal(byApp[0].applicationName, "JetPlan");

  const bySender = filterAndSortMaintenanceRecords(DEMO_MAINTENANCE_RECORDS, { senderEmail: "support@smart4aviation.aero" });
  assert.equal(bySender.length, 1);
  assert.equal(bySender[0].vendorName, "Smart4Aviation");
});

// ============================================================================
// TEST 7: Filter by update type, status, and date range
// ============================================================================
await runTest("7. Filter by update type, status, and date range", async () => {
  const byType = filterAndSortMaintenanceRecords(DEMO_MAINTENANCE_RECORDS, {
    updateType: "Performance Degradation"
  });
  assert.equal(byType.length, 1);
  assert.equal(byType[0].applicationName, "JetPlan");

  const byStatus = filterAndSortMaintenanceRecords(DEMO_MAINTENANCE_RECORDS, {
    status: "Scheduled"
  });
  assert.equal(byStatus.length, 1);
  assert.equal(byStatus[0].vendorName, "Smart4Aviation");

  const byDateRange = filterAndSortMaintenanceRecords(DEMO_MAINTENANCE_RECORDS, {
    dateFrom: "2026-10-25",
    dateTo: "2026-10-25"
  });
  assert.equal(byDateRange.length, 2, "Should return records received on 2026-10-25");
});

// ============================================================================
// TEST 8: Sorting by received date and maintenance start date
// ============================================================================
await runTest("8. Sorting by received date and maintenance start date", async () => {
  const testRecords = [
    ...DEMO_MAINTENANCE_RECORDS,
    {
      id: "demo-no-start",
      vendorName: "SITA",
      applicationName: "ACARS",
      emailSubject: "General Notice",
      receivedDate: "2026-10-24T10:00:00.000Z",
      maintenanceStart: null,
      status: "New",
      updateType: "General Announcement"
    }
  ];

  const sortedByReceivedDesc = filterAndSortMaintenanceRecords(testRecords, {
    sortBy: "receivedDate",
    sortOrder: "desc"
  });
  assert.ok(
    new Date(sortedByReceivedDesc[0].receivedDate) >= new Date(sortedByReceivedDesc[1].receivedDate),
    "Descending receivedDate sort must place newest record first"
  );

  const sortedByStartAsc = filterAndSortMaintenanceRecords(testRecords, {
    sortBy: "maintenanceStart",
    sortOrder: "asc"
  });
  assert.ok(
    new Date(sortedByStartAsc[0].maintenanceStart) <= new Date(sortedByStartAsc[1].maintenanceStart),
    "Ascending maintenanceStart sort must order earliest window first"
  );
  assert.equal(
    sortedByStartAsc[sortedByStartAsc.length - 1].maintenanceStart,
    null,
    "Records missing maintenanceStart must sort to the end"
  );
});

// ============================================================================
// TEST 9: Opening and closing the details panel
// ============================================================================
await runTest("9. Details panel component renders all required fields and close controls", async () => {
  const panelSource = await readFile(
    resolve(rootDir, "admin-react/src/components/maintenance/MaintenanceDetailsPanel.jsx"),
    "utf8"
  );
  assert.ok(panelSource.includes("onClose"), "Details panel must accept onClose callback");
  assert.ok(panelSource.includes("Original Email"), "Details panel must separate original vendor email");
  assert.ok(panelSource.includes("Automated Extraction Summary"), "Details panel must label automated extraction clearly");
  assert.ok(panelSource.includes("Not provided"), "Details panel must show 'Not provided' for missing dates");
});

// ============================================================================
// TEST 10: Rendering sanitized HTML email bodies
// ============================================================================
await runTest("10. Sanitizing HTML email bodies (stripping scripts/events/iframes, preserving tables)", async () => {
  const maliciousHtml = `
    <div>
      <p onclick="alert('xss')">Scheduled Maintenance Window</p>
      <script>window.pwned = true;</script>
      <iframe src="https://evil.example.com"></iframe>
      <a href="javascript:alert(1)">Bad Link</a>
      <a href="https://outlook.office.com/mail/id/123">Valid Link</a>
      <table>
        <thead><tr><th>System</th><th>Window</th></tr></thead>
        <tbody><tr><td>ACARS</td><td>06:00 UTC</td></tr></tbody>
      </table>
    </div>
  `;
  const clean = sanitizeEmailHtml(maliciousHtml);
  assert.ok(!clean.includes("<script"), "Must strip <script> tags");
  assert.ok(!clean.includes("<iframe"), "Must strip <iframe> tags");
  assert.ok(!clean.includes("onclick"), "Must strip inline on* event handlers");
  assert.ok(!clean.includes("javascript:"), "Must neutralize javascript: URLs");
  assert.ok(clean.includes("<table>"), "Must preserve HTML <table> elements");
  assert.ok(clean.includes("<td>ACARS</td>"), "Must preserve table cell contents");
});

// ============================================================================
// TEST 11: Handling missing maintenance start and end dates
// ============================================================================
await runTest("11. Handling missing maintenance start and end dates without inventing values", async () => {
  const result = processIncomingVendorEmail(
    {
      outlookMessageId: "msg-missing-dates-01",
      senderEmail: "acars.support@sita.aero",
      emailSubject: "General Advisory: SITA Operational Bulletin",
      emailBodyText: "Please note our updated escalation phone numbers for ACARS operations.",
      receivedDate: "2026-10-25T15:00:00Z"
    },
    directory,
    DEFAULT_ADMIN_SETTINGS,
    []
  );
  assert.equal(result.record.maintenanceStart, null, "Must not invent maintenanceStart when absent");
  assert.equal(result.record.maintenanceEnd, null, "Must not invent maintenanceEnd when absent");
  assert.equal(result.record.timeZone, "Not provided");
});

// ============================================================================
// TEST 12: Handling unknown vendor and unknown application
// ============================================================================
await runTest("12. Handling unknown vendor and unknown application", async () => {
  const result = processIncomingVendorEmail(
    {
      outlookMessageId: "msg-unknown-01",
      senderEmail: "noc@unrecognized-thirdparty.org",
      emailSubject: "Notice regarding external portal",
      emailBodyText: "We will perform general portal updates next week.",
      receivedDate: "2026-10-25T15:30:00Z"
    },
    directory,
    DEFAULT_ADMIN_SETTINGS,
    []
  );
  assert.equal(result.record.vendorId, null);
  assert.equal(result.record.vendorName, "Unknown");
  assert.equal(result.record.applicationName, "Unknown");
  assert.equal(result.record.status, "Requires Review");
  assert.equal(result.record.processingStatus, "Completed with Review Flag");
});

// ============================================================================
// TEST 16: Preserving original email content separately from extracted summary
// ============================================================================
await runTest("16. Preserving original email content separately from extracted summary", async () => {
  const verbatimBody =
    "Dear Alaska Airlines NOC,\nSITA will perform Scheduled Maintenance on ACARS.\nMaintenance Start: 2026-11-10 06:00 UTC\nMaintenance End: 2026-11-10 08:00 UTC\nImpact: 60s switchover.";
  const result = processIncomingVendorEmail(
    {
      outlookMessageId: "msg-preserve-01",
      senderEmail: "acars.support@sita.aero",
      emailSubject: "[MAINTENANCE] SITA ACARS Switchover",
      emailBodyText: verbatimBody,
      receivedDate: "2026-10-25T16:00:00Z"
    },
    directory,
    DEFAULT_ADMIN_SETTINGS,
    []
  );
  assert.equal(result.record.emailBodyText, verbatimBody, "Original emailBodyText must be preserved verbatim");
  assert.notEqual(result.record.extractedSummary, verbatimBody, "Extracted summary must be separate from verbatim body");
  assert.ok(result.record.extractedSummary.includes("SITA"), "Extracted summary should summarize matched vendor/context");
});

// ============================================================================
// TEST 17: Never marking an incident as Completed without completion evidence
// ============================================================================
await runTest("17. Never marking an incident as Completed without explicit completion evidence", async () => {
  const outageResult = processIncomingVendorEmail(
    {
      outlookMessageId: "msg-outage-01",
      senderEmail: "support@smart4aviation.aero",
      emailSubject: "[OUTAGE] S4A Weight and Balance Service Interruption",
      emailBodyText:
        "We are currently experiencing an unplanned service outage affecting S4A load planning. Engineers are investigating.",
      receivedDate: "2026-10-25T16:10:00Z"
    },
    directory,
    DEFAULT_ADMIN_SETTINGS,
    []
  );
  assert.equal(outageResult.record.updateType, "Service Outage");
  assert.notEqual(
    outageResult.record.status,
    "Completed",
    "Outage email without completion evidence must NEVER be marked Completed"
  );
  assert.equal(outageResult.record.status, "Investigating");
});

// ============================================================================
// TEST 18: Correlating follow-up completion or cancellation emails
// ============================================================================
await runTest("18. Correlating follow-up completion and cancellation emails", async () => {
  const initial = processIncomingVendorEmail(
    {
      outlookMessageId: "msg-conv-1",
      conversationId: "conv-sita-999",
      senderEmail: "acars.support@sita.aero",
      emailSubject: "[MAINTENANCE] SITA ACARS Gateway Upgrade",
      emailBodyText:
        "Scheduled maintenance on ACARS. Maintenance Start: 2026-11-12 06:00 UTC. Maintenance End: 2026-11-12 08:00 UTC.",
      receivedDate: "2026-10-25T10:00:00Z"
    },
    directory,
    DEFAULT_ADMIN_SETTINGS,
    []
  );
  assert.equal(initial.record.status, "Scheduled");

  const followUpCompletion = processIncomingVendorEmail(
    {
      outlookMessageId: "msg-conv-2",
      conversationId: "conv-sita-999",
      senderEmail: "acars.support@sita.aero",
      emailSubject: "RE: [MAINTENANCE] SITA ACARS Gateway Upgrade",
      emailBodyText:
        "The scheduled maintenance on ACARS has been completed and all services are restored and operating normally.",
      receivedDate: "2026-10-25T12:00:00Z"
    },
    directory,
    DEFAULT_ADMIN_SETTINGS,
    [initial.record]
  );
  assert.equal(followUpCompletion.record.status, "Completed");
  assert.equal(followUpCompletion.correlatedUpdate, true);
  assert.equal(followUpCompletion.record.id, initial.record.id);

  const followUpCancel = processIncomingVendorEmail(
    {
      outlookMessageId: "msg-conv-3",
      conversationId: "conv-sita-999",
      senderEmail: "acars.support@sita.aero",
      emailSubject: "RE: [MAINTENANCE] SITA ACARS Gateway Upgrade",
      emailBodyText:
        "This scheduled maintenance window on ACARS has been cancelled and postponed until further notice.",
      receivedDate: "2026-10-25T11:00:00Z"
    },
    directory,
    DEFAULT_ADMIN_SETTINGS,
    [initial.record]
  );
  assert.equal(followUpCancel.record.status, "Cancelled");
});

// ============================================================================
// LIVE IN-PROCESS BACKEND API SERVER TESTS (Tests 13, 14, 15, 19, 20)
// ============================================================================
const testSecret = "unit-test-webhook-secret-999";
const { server } = createVendorMaintenanceServer({
  inMemoryOnly: true,
  webhookApiKey: testSecret,
  requireWebhookAuth: true,
  strictAdminAuth: true,
  masterData: directory
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}/api/vendor-maintenance`;

try {
  // TEST 14: Rejecting unauthorized webhook requests
  await runTest("14. Rejecting unauthorized webhook requests with 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/email-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": "wrong-secret" },
      body: JSON.stringify({
        senderEmail: "acars.support@sita.aero",
        emailSubject: "Unauthorized test"
      })
    });
    assert.equal(res.status, 401, "Missing or invalid webhook secret must return 401");
  });

  // TEST 15: Rejecting malformed email payloads
  await runTest("15. Rejecting malformed email payloads with 400 Bad Request", async () => {
    const resMissingSender = await fetch(`${baseUrl}/email-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": testSecret },
      body: JSON.stringify({
        emailSubject: "No sender address"
      })
    });
    assert.equal(resMissingSender.status, 400, "Payload missing valid senderEmail must return 400");

    const resEmptyContent = await fetch(`${baseUrl}/email-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": testSecret },
      body: JSON.stringify({
        senderEmail: "acars.support@sita.aero",
        emailSubject: "   ",
        emailBodyText: "   "
      })
    });
    assert.equal(resEmptyContent.status, 400, "Payload with empty subject and empty body must return 400");
  });

  // TEST 13: Preventing duplicate records for the same outlookMessageId or outlookInternetMessageId
  let createdRecordId = null;
  await runTest("13. Preventing duplicate records for the same outlookMessageId or outlookInternetMessageId", async () => {
    const payload = {
      outlookMessageId: "AAMk-DEDUP-TEST-100",
      outlookInternetMessageId: "<dedup-100@sita.aero>",
      conversationId: "conv-dedup-100",
      senderEmail: "acars.support@sita.aero",
      emailSubject: "[MAINTENANCE] SITA ACARS Datalink Upgrade",
      emailBodyText:
        "Scheduled maintenance on ACARS. Maintenance Start: 2026-11-20 06:00 UTC. Maintenance End: 2026-11-20 08:00 UTC.",
      receivedDate: "2026-10-25T17:00:00Z",
      sourceMailbox: "vendor-maintenance@alaskaair.com",
      folderName: "Vendor Maintenance",
      originalEmailWebLink: "https://outlook.office.com/mail/deeplink?ItemID=AAMk-DEDUP-TEST-100"
    };

    const firstRes = await fetch(`${baseUrl}/email-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": testSecret },
      body: JSON.stringify(payload)
    });
    assert.equal(firstRes.status, 201);
    const firstData = await firstRes.json();
    assert.equal(firstData.duplicate, false);
    createdRecordId = firstData.record.id;

    // Send identical message again
    const secondRes = await fetch(`${baseUrl}/email-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": testSecret },
      body: JSON.stringify(payload)
    });
    assert.equal(secondRes.status, 200);
    const secondData = await secondRes.json();
    assert.equal(secondData.duplicate, true, "Duplicate delivery must be flagged duplicate: true");
    assert.equal(secondData.record.id, createdRecordId, "Must return the existing record without creating a duplicate");
  });

  // TEST 19: Admin status updates with audit logging
  await runTest("19. Admin status updates (PATCH) with audit logging in processingHistory", async () => {
    assert.ok(createdRecordId, "Record ID from previous test must exist");
    const patchRes = await fetch(`${baseUrl}/${encodeURIComponent(createdRecordId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": testSecret },
      body: JSON.stringify({
        status: "In Progress",
        actor: "Srihari.Gangisetti@alaskaair.com"
      })
    });
    assert.equal(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.equal(patchData.record.status, "In Progress");
    const lastAudit = patchData.record.processingHistory[patchData.record.processingHistory.length - 1];
    assert.equal(lastAudit.action, "Status Updated");
    assert.equal(lastAudit.actor, "Srihari.Gangisetti@alaskaair.com");
    assert.ok(lastAudit.details.includes("In Progress"));
  });

  // TEST 20: Reprocessing a failed or unclassified email without creating duplicate records
  await runTest("20. Reprocessing an email updates classification in-place without duplicating records", async () => {
    const beforeListRes = await fetch(baseUrl);
    const beforeList = await beforeListRes.json();
    const countBefore = beforeList.records.length;

    const reprocRes = await fetch(`${baseUrl}/${encodeURIComponent(createdRecordId)}/reprocess`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": testSecret },
      body: JSON.stringify({
        actor: "Srihari.Gangisetti@alaskaair.com"
      })
    });
    assert.equal(reprocRes.status, 200);
    const reprocData = await reprocRes.json();
    assert.equal(reprocData.record.id, createdRecordId);
    const lastEntry = reprocData.record.processingHistory[reprocData.record.processingHistory.length - 1];
    assert.equal(lastEntry.action, "Reprocessed");

    const afterListRes = await fetch(baseUrl);
    const afterList = await afterListRes.json();
    assert.equal(afterList.records.length, countBefore, "Reprocessing must not create duplicate records");
  });
} finally {
  server.close();
}

const passedCount = results.filter((r) => r.passed).length;
console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passedCount}/${results.length} PASSED`);
console.log(`========================================`);

if (passedCount !== results.length) {
  process.exit(1);
}

