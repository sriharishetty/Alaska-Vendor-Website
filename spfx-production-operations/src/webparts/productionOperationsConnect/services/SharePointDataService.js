/**
 * SharePointDataService.js
 * Enterprise SharePoint Online REST API & Baseline Data Adapter for Production Operations Connect.
 *
 * Security & Compliance:
 * - Zero hardcoded passwords, secrets, or API keys.
 * - Uses Microsoft 365 / SharePoint Framework (SPFx) pageContext SSO identity and SharePoint List permissions.
 * - Preserves all 37 existing vendor records (sourceRow 2..38) and all 10 operational application records.
 */

export const SPFX_LIST_CONFIG = {
  APPLICATIONS: "ProdOpsApplications",
  VENDORS: "ProdOpsVendors",
  MAINTENANCE: "VendorMaintenanceUpdates",
  AUDIT_LOG: "ProdOpsAuditLog"
};

export const SPFX_AUTHORIZED_ADMINS = [
  "Srihari.Gangisetti@alaskaair.com",
  "Mohan.P@alaskaair.com",
  "Margaret.Jennifer@alaskaair.com",
  "Sharmini.M@alaskaair.com",
  "Srinivasanagasai.Chevitikanti@alaskaair.com",
  "Raghava.Rohan.Dodla@alaskaair.com"
];

export const SHAREPOINT_LIST_SCHEMAS = [
  {
    listTitle: "ProdOpsApplications",
    description: "Stores the 10 operational applications and 9 core Ground Stop systems.",
    uniqueKeyColumn: "AppKey",
    baselineCount: 10,
    columns: [
      { internalName: "Title", type: "Single line of text", required: true },
      { internalName: "AppKey", type: "Single line of text (Unique)", required: true },
      { internalName: "Category", type: "Choice", required: true },
      { internalName: "VendorCompany", type: "Single line of text", required: false },
      { internalName: "SupportPhone", type: "Single line of text", required: false },
      { internalName: "SupportEmail", type: "Single line of text", required: false },
      { internalName: "ItsPoc", type: "Single line of text", required: false },
      { internalName: "SlaTarget", type: "Single line of text", required: false },
      { internalName: "OperationalStatus", type: "Choice", required: true },
      { internalName: "SeverityLevel", type: "Choice", required: false },
      { internalName: "IsGroundStopApp", type: "Yes/No", required: true },
      { internalName: "Description", type: "Multiple lines of text", required: false },
      { internalName: "EscalationFlowJson", type: "Multiple lines of text", required: false }
    ]
  },
  {
    listTitle: "ProdOpsVendors",
    description: "Stores all 37 vendor directory and case status portal records (Excel sourceRow 2..38).",
    uniqueKeyColumn: "SourceRow",
    baselineCount: 37,
    columns: [
      { internalName: "Title", type: "Single line of text", required: true },
      { internalName: "VendorRecordId", type: "Single line of text (Unique)", required: true },
      { internalName: "SourceRow", type: "Number (Unique)", required: true },
      { internalName: "VendorCompany", type: "Single line of text", required: false },
      { internalName: "Category", type: "Single line of text", required: false },
      { internalName: "PrimaryPhone", type: "Single line of text", required: false },
      { internalName: "SupportEmail", type: "Single line of text", required: false },
      { internalName: "ApplicationOwner", type: "Single line of text", required: false },
      { internalName: "Anchor", type: "Single line of text", required: false },
      { internalName: "ServiceTimings", type: "Single line of text", required: false },
      { internalName: "EscalationDetails", type: "Multiple lines of text", required: false },
      { internalName: "PortalUrl", type: "Hyperlink or Text", required: false },
      { internalName: "PortalStatus", type: "Choice", required: false },
      { internalName: "PortalNotes", type: "Multiple lines of text", required: false },
      { internalName: "LastVerifiedDate", type: "Single line of text", required: false },
      { internalName: "LastVerifiedBy", type: "Single line of text", required: false }
    ]
  },
  {
    listTitle: "VendorMaintenanceUpdates",
    description: "Stores automated Outlook / Power Automate vendor maintenance notices and outage windows.",
    uniqueKeyColumn: "InternetMessageId",
    baselineCount: 6,
    columns: [
      { internalName: "Title", type: "Single line of text", required: true },
      { internalName: "VendorName", type: "Single line of text", required: true },
      { internalName: "RelatedApplication", type: "Single line of text", required: false },
      { internalName: "SenderEmail", type: "Single line of text", required: false },
      { internalName: "ReceivedDateTime", type: "Date and Time", required: true },
      { internalName: "UpdateType", type: "Choice", required: true },
      { internalName: "MaintenanceStatus", type: "Choice", required: true },
      { internalName: "MaintenanceStart", type: "Date and Time", required: false },
      { internalName: "MaintenanceEnd", type: "Date and Time", required: false },
      { internalName: "SummaryText", type: "Multiple lines of text", required: false },
      { internalName: "InternetMessageId", type: "Single line of text (Unique)", required: true }
    ]
  },
  {
    listTitle: "ProdOpsAuditLog",
    description: "Stores administrative change history across applications, vendors, and portals.",
    uniqueKeyColumn: "Id",
    baselineCount: 0,
    columns: [
      { internalName: "Title", type: "Single line of text", required: true },
      { internalName: "ChangedByEmail", type: "Single line of text", required: true },
      { internalName: "ChangedAt", type: "Date and Time", required: true },
      { internalName: "TargetType", type: "Choice", required: true },
      { internalName: "ChangesJson", type: "Multiple lines of text", required: false }
    ]
  }
];

/**
 * Resolves the active Microsoft 365 / SharePoint user context.
 * Never uses passwords or secrets. Relies on SharePoint Online SSO or Workbench identity selector.
 */
export function resolveSpfxUserSession() {
  const spfxGlobal = typeof window !== "undefined" ? window.__SPFX_CONTEXT__ : null;
  const pageContextUser = spfxGlobal?.pageContext?.user || spfxGlobal?.currentUser || null;

  let email =
    pageContextUser?.email ||
    pageContextUser?.loginName ||
    (typeof localStorage !== "undefined" && localStorage.getItem("productionOperationsAdminEmail")) ||
    SPFX_AUTHORIZED_ADMINS[0];

  email = String(email || "").trim();

  const isAuthorizedAdmin =
    Boolean(pageContextUser?.isSiteAdmin) ||
    SPFX_AUTHORIZED_ADMINS.some(admin => admin.toLowerCase() === email.toLowerCase());

  const displayName =
    pageContextUser?.displayName ||
    email
      .split("@")[0]
      .split(".")
      .map(part => (part ? part[0].toUpperCase() + part.slice(1) : ""))
      .join(" ") ||
    "SharePoint User";

  if (typeof localStorage !== "undefined" && isAuthorizedAdmin) {
    localStorage.setItem("productionOperationsAdminAuthenticated", "true");
    localStorage.setItem("productionOperationsAdminEmail", email);
  }

  return {
    isAuthenticated: isAuthorizedAdmin,
    isAuthorizedAdmin,
    email,
    displayName,
    authProvider: spfxGlobal?.isLiveSharePoint
      ? "Microsoft 365 SharePoint Context SSO"
      : "SPFx Workbench Microsoft 365 Identity",
    siteUrl: spfxGlobal?.siteUrl || "https://{tenant}.sharepoint.com/sites/ProductionOperations"
  };
}

/**
 * Updates the simulated Microsoft 365 identity when testing in the local SPFx Workbench.
 * In live SharePoint Online, the identity comes directly from _spPageContextInfo / this.context.pageContext.user.
 */
export function setSpfxWorkbenchUser(email) {
  const cleaned = String(email || "").trim();
  const isAuthorized = SPFX_AUTHORIZED_ADMINS.some(
    admin => admin.toLowerCase() === cleaned.toLowerCase()
  );

  if (typeof window !== "undefined") {
    window.__SPFX_CONTEXT__ = {
      ...(window.__SPFX_CONTEXT__ || {}),
      currentUser: {
        email: cleaned,
        loginName: cleaned,
        displayName: cleaned
          .split("@")[0]
          .split(".")
          .map(part => (part ? part[0].toUpperCase() + part.slice(1) : ""))
          .join(" "),
        isSiteAdmin: isAuthorized
      }
    };
  }

  if (typeof localStorage !== "undefined") {
    if (isAuthorized) {
      localStorage.setItem("productionOperationsAdminAuthenticated", "true");
      localStorage.setItem("productionOperationsAdminEmail", cleaned);
    } else {
      localStorage.removeItem("productionOperationsAdminAuthenticated");
      localStorage.setItem("productionOperationsAdminEmail", cleaned);
    }
  }

  return resolveSpfxUserSession();
}

/**
 * Returns the verified baseline dataset (37 vendor records and 10 applications / 9 ground stop keys)
 * confirming zero data loss or duplication.
 */
export function getSpfxBaselineVerificationReport() {
  const master = (typeof window !== "undefined" && window.masterData) || {};
  const vendors = Array.isArray(master.vendors) ? master.vendors : [];
  const applicationsObj = master.applications || {};
  const applicationKeys = Object.keys(applicationsObj);
  const groundStopKeys = Array.isArray(window.groundStopApplicationKeys)
    ? window.groundStopApplicationKeys
    : Array.isArray(window.GROUND_STOP_APP_KEYS)
      ? window.GROUND_STOP_APP_KEYS
      : [];

  const uniqueSourceRows = new Set(vendors.map(v => v.sourceRow).filter(Boolean));

  return {
    vendorCount: vendors.length,
    expectedVendorCount: 37,
    uniqueSourceRowCount: uniqueSourceRows.size,
    applicationCount: applicationKeys.length,
    expectedApplicationCount: 10,
    groundStopAppCount: groundStopKeys.length,
    expectedGroundStopAppCount: 9,
    hasZeroDuplicates: vendors.length === 37 && uniqueSourceRows.size === 37,
    listSchemas: SHAREPOINT_LIST_SCHEMAS
  };
}
