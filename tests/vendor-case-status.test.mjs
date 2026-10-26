import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

import {
  PORTAL_STATUSES,
  AUTHORIZED_ADMINS,
  resolveVendorCompanyName,
  extractSourcePortalUrl,
  isValidPortalUrl,
  getVendorCaseStatusRecords,
  calculateVendorCaseStatusSummary,
  getVendorCaseStatusFilterOptions,
  filterVendorCaseStatusRecords,
  saveVendorPortalConfiguration,
  getAdminSession,
  authenticateAdminSession
} from "../admin-react/src/services/vendorCaseStatusService.js";

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

// Set up simulated browser window + localStorage with actual master-data.js
async function createMasterDataWindow() {
  const masterDataCode = await readFile(resolve(rootDir, "js/data/master-data.js"), "utf8");
  const storageMap = new Map();
  const localStorageMock = {
    getItem(key) {
      return storageMap.has(key) ? storageMap.get(key) : null;
    },
    setItem(key, val) {
      storageMap.set(key, String(val));
    },
    removeItem(key) {
      storageMap.delete(key);
    },
    clear() {
      storageMap.clear();
    }
  };

  const sandboxWindow = {
    localStorage: localStorageMock,
    location: { protocol: "http:", hostname: "localhost" }
  };

  const context = vm.createContext({
    window: sandboxWindow,
    localStorage: localStorageMock,
    fetch: async () => ({ ok: true }),
    console
  });

  vm.runInContext(masterDataCode, context, { filename: "master-data.js" });
  globalThis.window = sandboxWindow;
  globalThis.localStorage = localStorageMock;
  return { sandboxWindow, localStorageMock };
}

await createMasterDataWindow();

// ============================================================================
// 1. All 37 source vendor records are represented correctly
// ============================================================================
await runTest("1. All 37 source vendor records are represented correctly", async () => {
  const records = getVendorCaseStatusRecords();
  assert.equal(records.length, 37, "Must include all 37 existing vendor records from master-data.js");

  const masterVendors = globalThis.window.masterData.vendors;
  assert.equal(masterVendors.length, 37, "Source masterData.vendors has 37 records");

  for (let i = 0; i < 37; i++) {
    assert.equal(records[i].id, masterVendors[i].id, `Record ${i} ID must match masterData`);
    assert.equal(records[i].sourceRow, masterVendors[i].sourceRow, `Record ${i} sourceRow must match masterData`);
  }
});

// ============================================================================
// 2. Vendor names match the existing directory (29 unique vendor companies)
// ============================================================================
await runTest("2. Vendor names match the existing directory (29 unique vendors across 37 records)", async () => {
  const records = getVendorCaseStatusRecords();
  const masterVendors = globalThis.window.masterData.vendors;

  records.forEach((rec, idx) => {
    const expectedName = resolveVendorCompanyName(masterVendors[idx]);
    assert.equal(rec.vendorName, expectedName, `Vendor name at index ${idx} must match existing directory`);
  });

  const summary = calculateVendorCaseStatusSummary(records);
  assert.equal(summary.totalVendorRecords, 37, "Total Vendor Records must be 37");
  assert.equal(summary.totalUniqueVendors, 29, "Total Unique Vendors must be 29");
  assert.equal(summary.totalSystemsApplications, 36, "Total Unique Primary Systems across 37 records must be 36");
  assert.equal(summary.configuredPortalLinks, 1, "Initial Configured Portal Links must be 1 (Boeing)");
});

// ============================================================================
// 3. Application relationships are preserved (including multi-system vendors)
// ============================================================================
await runTest("3. Application relationships are preserved (including multi-application vendors)", async () => {
  const records = getVendorCaseStatusRecords();

  // Check SABRE (5 vendor rows supporting 5 distinct systems)
  const sabreRecords = records.filter((r) => r.vendorName === "SABRE");
  assert.equal(sabreRecords.length, 5, "SABRE must have 5 vendor records");
  for (const rec of sabreRecords) {
    assert.ok(
      rec.allSystems.length >= 5,
      "SABRE record must preserve all 5 associated SABRE systems"
    );
    assert.ok(rec.allSystems.includes("Sabre"));
    assert.ok(rec.allSystems.includes("Image Reservations"));
    assert.ok(rec.allSystems.includes("CSA Mobile - Boarding Agent"));
    assert.ok(rec.allSystems.includes("CSA Mobile - Lobby"));
    assert.ok(rec.allSystems.includes("RAIN"));
  }

  // Check Jeppesen (3 vendor rows + linked Ground Stop apps JetPlan, JCTE)
  const jeppesenRecords = records.filter((r) => r.vendorName === "Jeppesen");
  assert.equal(jeppesenRecords.length, 3, "Jeppesen must have 3 vendor records");
  assert.ok(
    jeppesenRecords[0].allSystems.includes("Flight Planning") &&
      jeppesenRecords[0].allSystems.includes("JCTE") &&
      jeppesenRecords[0].allSystems.includes("JetPlan"),
    "Jeppesen must include both primary systems and linked applications"
  );

  // Check TRAX (2 vendor rows: AS TRAX System, QX TRAX System + Aircraft Maintenance application)
  const traxRecords = records.filter((r) => r.vendorName === "TRAX");
  assert.equal(traxRecords.length, 2, "TRAX must have 2 vendor records");
  assert.ok(
    traxRecords[0].allSystems.includes("AS TRAX System") &&
      traxRecords[0].allSystems.includes("QX TRAX System") &&
      traxRecords[0].allSystems.includes("Aircraft Maintenance"),
    "TRAX must include AS TRAX System, QX TRAX System, and Aircraft Maintenance"
  );
});

// ============================================================================
// 4. No duplicate records were introduced
// ============================================================================
await runTest("4. No duplicate records were introduced", async () => {
  const records = getVendorCaseStatusRecords();
  const uniqueIds = new Set(records.map((r) => r.id));
  const uniqueSourceRows = new Set(records.map((r) => r.sourceRow));
  assert.equal(uniqueIds.size, 37, "All 37 vendor record IDs must be unique");
  assert.equal(uniqueSourceRows.size, 37, "All 37 sourceRow numbers must be unique");
});

// ============================================================================
// 5. Search works across vendor name, application name, category, and portal URL
// ============================================================================
await runTest("5. Search works across vendor name, application name, category, and portal URL", async () => {
  const records = getVendorCaseStatusRecords();

  // Search by vendor name
  const byVendor = filterVendorCaseStatusRecords(records, { search: "Smart4Aviation" });
  assert.equal(byVendor.length, 1);
  assert.equal(byVendor[0].vendorName, "Smart4Aviation");

  // Search by system/application name
  const bySystem = filterVendorCaseStatusRecords(records, { search: "Boeing Toolbox" });
  assert.equal(bySystem.length, 1);
  assert.equal(bySystem[0].vendorName, "Boeing");

  // Search by category
  const byCategory = filterVendorCaseStatusRecords(records, { search: "baggage tracking" });
  assert.equal(byCategory.length, 1);
  assert.equal(byCategory[0].vendorName, "NetTracer");

  // Search by portal URL (Boeing's http://myboeingfleet.com)
  const byPortal = filterVendorCaseStatusRecords(records, { search: "myboeingfleet.com" });
  assert.equal(byPortal.length, 1);
  assert.equal(byPortal[0].vendorName, "Boeing");
});

// ============================================================================
// 6. Filters work individually and together
// ============================================================================
await runTest("6. Filters work individually and together", async () => {
  const records = getVendorCaseStatusRecords();
  const options = getVendorCaseStatusFilterOptions(records);
  assert.ok(options.vendors.includes("SABRE"));
  assert.ok(options.categories.includes("Boarding app"));
  assert.ok(options.systems.includes("Boeing Toolbox"));

  // Individual filter: Vendor = SABRE
  const sabreOnly = filterVendorCaseStatusRecords(records, { vendor: "SABRE" });
  assert.equal(sabreOnly.length, 5);

  // Individual filter: Category = Boarding app
  const boardingOnly = filterVendorCaseStatusRecords(records, { category: "Boarding app" });
  assert.equal(boardingOnly.length, 1);
  assert.equal(boardingOnly[0].primarySystem, "CSA Mobile - Boarding Agent");

  // Individual filter: Portal Status = Configured
  const configuredOnly = filterVendorCaseStatusRecords(records, {
    portalStatus: PORTAL_STATUSES.CONFIGURED
  });
  assert.equal(configuredOnly.length, 1);
  assert.equal(configuredOnly[0].vendorName, "Boeing");

  // Combined filters: Vendor = SABRE + Category = Boarding app + Search = "Boarding"
  const combined = filterVendorCaseStatusRecords(records, {
    search: "Boarding",
    vendor: "SABRE",
    category: "Boarding app",
    portalStatus: ""
  });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].primarySystem, "CSA Mobile - Boarding Agent");
});

// ============================================================================
// 7. Clear Filters resets all filters
// ============================================================================
await runTest("7. Clear Filters resets all filters", async () => {
  const records = getVendorCaseStatusRecords();
  const resetResult = filterVendorCaseStatusRecords(records, {
    search: "",
    vendor: "",
    system: "",
    category: "",
    portalStatus: ""
  });
  assert.equal(resetResult.length, 37, "Clearing filters must return all 37 vendor records");
});

// ============================================================================
// 8. Configured portal links open correctly & source data URL extraction works
// ============================================================================
await runTest("8. Configured portal links open correctly", async () => {
  const records = getVendorCaseStatusRecords();
  const boeing = records.find((r) => r.id === "boeing");
  assert.ok(boeing, "Boeing record must exist");
  assert.equal(boeing.portalUrl, "http://myboeingfleet.com");
  assert.equal(boeing.portalStatus, PORTAL_STATUSES.CONFIGURED);
  assert.equal(isValidPortalUrl(boeing.portalUrl), true);

  const pageSource = await readFile(
    resolve(rootDir, "admin-react/src/pages/VendorCaseStatus.jsx"),
    "utf8"
  );
  assert.ok(pageSource.includes('target="_blank"'), "Open Portal link must open in a new tab");
  assert.ok(pageSource.includes('rel="noopener noreferrer"'), "Open Portal link must include rel=noopener noreferrer");
});

// ============================================================================
// 9. Missing portal links display 'Portal Not Configured' and cannot be opened
// ============================================================================
await runTest("9. Missing portal links cannot be opened and display 'Portal Not Configured'", async () => {
  const records = getVendorCaseStatusRecords();
  const unconfigured = records.filter((r) => r.id !== "boeing");
  assert.equal(unconfigured.length, 36, "36 of 37 source records have no portal URL in source data");

  for (const rec of unconfigured) {
    assert.equal(rec.portalUrl, "", `Record ${rec.id} must have empty portalUrl`);
    assert.equal(rec.portalStatus, PORTAL_STATUSES.NOT_CONFIGURED, `Record ${rec.id} must be Not Configured`);
    assert.equal(isValidPortalUrl(rec.portalUrl), false, "Missing portal URL must not validate as openable");
  }

  const pageSource = await readFile(
    resolve(rootDir, "admin-react/src/pages/VendorCaseStatus.jsx"),
    "utf8"
  );
  assert.ok(
    pageSource.includes("Portal Not Configured"),
    "UI must display 'Portal Not Configured' when portal URL is missing"
  );
});

// ============================================================================
// 10. Administrators can update portal information without duplicating vendors
// ============================================================================
await runTest("10. Administrators can update portal information & verify portals without duplicates", async () => {
  // Authenticate admin
  const auth = authenticateAdminSession(AUTHORIZED_ADMINS[0], "123456789");
  assert.equal(auth.ok, true, "Admin authentication must succeed for authorized admin");
  assert.equal(getAdminSession().isAuthenticated, true);

  // Update Smart4Aviation (id: "smart4aviation") with a configured & verified portal URL + additional application
  await saveVendorPortalConfiguration("smart4aviation", {
    portalUrl: "https://support.smart4aviation.aero",
    portalStatus: PORTAL_STATUSES.VERIFIED,
    portalNotes: "24x7 Operations Support Portal verified by ITS Flight Ops",
    lastVerifiedDate: "2026-10-26",
    associatedApplications: ["S4A - Smart4Aviation/Weight and Balance", "Smart4Aviation (S4A)"]
  });

  const updatedRecords = getVendorCaseStatusRecords();
  assert.equal(updatedRecords.length, 37, "Updating a vendor portal must NOT create duplicate vendor records");

  const s4a = updatedRecords.find((r) => r.id === "smart4aviation");
  assert.equal(s4a.portalUrl, "https://support.smart4aviation.aero");
  assert.equal(s4a.portalStatus, PORTAL_STATUSES.VERIFIED);
  assert.equal(s4a.lastVerifiedDate, "2026-10-26");
  assert.equal(s4a.portalNotes, "24x7 Operations Support Portal verified by ITS Flight Ops");

  // Verify summary counts updated dynamically
  const summaryAfter = calculateVendorCaseStatusSummary(updatedRecords);
  assert.equal(summaryAfter.totalVendorRecords, 37);
  assert.equal(summaryAfter.configuredPortalLinks, 2);
  assert.equal(summaryAfter.verifiedPortalLinks, 1);

  // Verify that marking Verified WITHOUT a lastVerifiedDate downgrades to Configured until checked
  await saveVendorPortalConfiguration("aircraft-performance", {
    portalUrl: "https://support.dynamicsource.se",
    portalStatus: PORTAL_STATUSES.VERIFIED,
    portalNotes: "Added portal link but not yet verified with date",
    lastVerifiedDate: ""
  });
  const afterSecondSave = getVendorCaseStatusRecords();
  const ds = afterSecondSave.find((r) => r.id === "aircraft-performance");
  assert.equal(
    ds.portalStatus,
    PORTAL_STATUSES.CONFIGURED,
    "Portal must only be marked Verified when lastVerifiedDate is recorded"
  );
});

// ============================================================================
// 11. Existing website routes and navigation integration work
// ============================================================================
await runTest("11. Existing website routes and sidebar navigation work", async () => {
  const htmlPages = [
    "home.html",
    "vendors.html",
    "vendor-maintenance.html",
    "vendor-case-status.html",
    "categories.html",
    "ground-stops.html",
    "favorites.html",
    "reports.html"
  ];

  for (const page of htmlPages) {
    const content = await readFile(resolve(rootDir, page), "utf8");
    assert.ok(
      content.includes('href="vendor-case-status.html"'),
      `${page} must link Vendor Case Status in sidebar to vendor-case-status.html`
    );
  }

  const sidebarJs = await readFile(resolve(rootDir, "js/sidebar-active.js"), "utf8");
  assert.ok(
    sidebarJs.includes("vendor-case-status.html"),
    "js/sidebar-active.js must support vendor-case-status.html active state"
  );
});

// ============================================================================
// 12. The application builds and syntax-verifies cleanly
// ============================================================================
await runTest("12. The application builds and bundles compile cleanly", async () => {
  const vcsBundle = await readFile(resolve(rootDir, "js/vendor-case-status.bundle.js"), "utf8");
  assert.ok(vcsBundle.includes("Vendor Case Status"), "Bundle must include Vendor Case Status");
  assert.ok(vcsBundle.includes("Portal Not Configured"), "Bundle must include Portal Not Configured state");
  const script = new vm.Script(vcsBundle, { filename: "vendor-case-status.bundle.js" });
  assert.ok(script, "js/vendor-case-status.bundle.js must be valid JS");
});

const passedCount = results.filter((r) => r.passed).length;
console.log(`\n========================================`);
console.log(`VENDOR CASE STATUS TEST SUMMARY: ${passedCount}/${results.length} PASSED`);
console.log(`========================================\n`);

if (passedCount !== results.length) {
  process.exit(1);
}
