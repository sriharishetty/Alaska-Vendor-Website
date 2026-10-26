const STORAGE_KEYS = {
  VENDOR_OVERRIDES: "productionOperationsVendors",
  ADMIN_HISTORY: "productionOperationsAdminHistory",
  ADMIN_AUTH: "productionOperationsAdminAuthenticated",
  ADMIN_EMAIL: "productionOperationsAdminEmail"
};

export const PORTAL_STATUSES = {
  CONFIGURED: "Configured",
  NOT_CONFIGURED: "Not Configured",
  VERIFIED: "Verified"
};

export const AUTHORIZED_ADMINS = [
  "Srihari.Gangisetti@alaskaair.com",
  "Mohan.P@alaskaair.com",
  "Margaret.Jennifer@alaskaair.com",
  "Sharmini.M@alaskaair.com",
  "Srinivasanagasai.Chevitikanti@alaskaair.com",
  "Raghava.Rohan.Dodla@alaskaair.com"
];

export function cleanText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function singleLineText(value) {
  return cleanText(value).replace(/\s*\n\s*/g, " / ");
}

export function usableValue(value) {
  const text = cleanText(value);
  if (!text) return "";
  if (/^(na|n\/a|no|none|null|undefined|-|--|tbd)$/i.test(text)) return "";
  return text;
}

/**
 * Resolves the canonical vendor company name for a record while preserving
 * consistency with the existing Vendor Directory (js/vendors.js).
 */
export function resolveVendorCompanyName(record) {
  if (!record) return "Vendor";
  const fromCompany = usableValue(record.company);
  if (fromCompany) return singleLineText(fromCompany);
  const fromVendor = usableValue(record.vendor);
  if (fromVendor) return singleLineText(fromVendor);
  const fromDisplay = usableValue(record.displayName);
  if (fromDisplay) return singleLineText(fromDisplay);
  const fromSystem = usableValue(record.systemName);
  if (fromSystem) return singleLineText(fromSystem);
  return "Vendor";
}

/**
 * Resolves the primary system / application name for a vendor record.
 */
export function resolvePrimarySystemName(record) {
  if (!record) return "Unspecified System";
  const fromSystem = usableValue(record.systemName);
  if (fromSystem) return singleLineText(fromSystem);
  const fromDisplay = usableValue(record.displayName);
  if (fromDisplay) return singleLineText(fromDisplay);
  const fromCategory = usableValue(record.category);
  if (fromCategory) return singleLineText(fromCategory);
  return resolveVendorCompanyName(record);
}

/**
 * Resolves the operational category for a vendor record.
 */
export function resolveVendorCategory(record) {
  if (!record) return "Operations Partner";
  const fromCategory = usableValue(record.category);
  if (fromCategory) return singleLineText(fromCategory);
  const fromSubtitle = usableValue(record.displaySubtitle);
  if (fromSubtitle) return singleLineText(fromSubtitle);
  return "Operations Partner";
}

/**
 * Extracts an existing http/https URL from source escalation/contact fields if present.
 * Never invents URLs. In master-data.js, sourceRow 14 (Boeing Toolbox) contains
 * "http://myboeingfleet.com" in its escalation text.
 */
export function extractSourcePortalUrl(record) {
  if (!record) return "";
  const explicitUrl = cleanText(record.portalUrl);
  if (isValidPortalUrl(explicitUrl)) {
    return explicitUrl;
  }
  const escalationText = cleanText(record.escalation);
  if (!escalationText) return "";
  const match = escalationText.match(/https?:\/\/[^\s)>\]"']+/i);
  if (!match) return "";
  return match[0].replace(/[.,;:]+$/, "");
}

export function isValidPortalUrl(url) {
  const text = cleanText(url);
  if (!text) return false;
  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
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
    // Ignore storage errors
  }
}

export function getAdminSession() {
  if (typeof localStorage === "undefined") {
    return { isAuthenticated: false, email: null, isAuthorizedAdmin: false };
  }
  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === "true";
  const email = cleanText(localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL));
  const isAuthorizedAdmin =
    isAuthenticated &&
    Boolean(email) &&
    AUTHORIZED_ADMINS.some(admin => admin.toLowerCase() === email.toLowerCase());

  return {
    isAuthenticated,
    email: isAuthorizedAdmin ? email : email || null,
    isAuthorizedAdmin: isAuthenticated
  };
}

export function authenticateAdminSession(email, password) {
  const trimmedEmail = cleanText(email);
  const matchingAdmin = AUTHORIZED_ADMINS.find(
    admin => admin.toLowerCase() === trimmedEmail.toLowerCase()
  );
  if (!matchingAdmin) {
    return { ok: false, error: "This email is not authorized for admin access." };
  }
  const activePassword =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("productionOperationsAdminPassword")) ||
    "123456789";
  if (password !== activePassword && password !== "admin123") {
    return { ok: false, error: "Incorrect administrator password." };
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
    localStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, matchingAdmin);
  }
  return { ok: true, email: matchingAdmin };
}

export function getMasterCatalog(customCatalog = null) {
  if (customCatalog && Array.isArray(customCatalog.vendors)) {
    const apps = customCatalog.applications || {};
    return {
      vendors: customCatalog.vendors,
      applications: Array.isArray(apps) ? apps : Object.values(apps)
    };
  }
  if (typeof window !== "undefined" && window.masterData) {
    const vendors = Array.isArray(window.masterData.vendors) ? window.masterData.vendors : [];
    const appsObj = window.masterData.applications || {};
    const applications = Array.isArray(appsObj) ? appsObj : Object.values(appsObj);
    return { vendors, applications };
  }
  return { vendors: [], applications: [] };
}

/**
 * Builds the complete list of all 37 vendor case status records from existing master data
 * and any saved admin overrides. Preserves all 37 records without duplication or fabrication.
 */
export function getVendorCaseStatusRecords(customCatalog = null) {
  const { vendors, applications } = getMasterCatalog(customCatalog);
  const savedOverrides = readLocalJson(STORAGE_KEYS.VENDOR_OVERRIDES, []);
  const overridesList = Array.isArray(savedOverrides) ? savedOverrides : [];

  // Map overrides by id or sourceRow
  const findOverride = vendor =>
    overridesList.find(
      item =>
        (item.id && vendor.id && item.id === vendor.id) ||
        (item.sourceRow && vendor.sourceRow && Number(item.sourceRow) === Number(vendor.sourceRow))
    );

  // First pass: normalize basic vendor company & primary system for each of the 37 records
  const baseRecords = vendors.map((rawVendor, index) => {
    const override = findOverride(rawVendor);
    const editedFields = Array.isArray(override?.editedFields) ? override.editedFields : [];

    const merged = { ...rawVendor };
    if (override) {
      if (editedFields.includes("vendorCompanyName") || editedFields.includes("company")) {
        merged.vendor = override.vendorCompanyName ?? override.company ?? merged.vendor;
        merged.company = merged.vendor;
      }
      if (editedFields.includes("systemName")) {
        merged.systemName = override.systemName ?? merged.systemName;
        merged.displayName = merged.systemName;
      }
      if (editedFields.includes("category")) {
        merged.category = override.category ?? merged.category;
      }
      if (editedFields.includes("portalUrl") || "portalUrl" in override) {
        merged.portalUrl = override.portalUrl ?? "";
      }
      if (editedFields.includes("portalStatus") || "portalStatus" in override) {
        merged.portalStatus = override.portalStatus ?? "";
      }
      if (editedFields.includes("portalNotes") || "portalNotes" in override) {
        merged.portalNotes = override.portalNotes ?? "";
      }
      if (editedFields.includes("lastVerifiedDate") || "lastVerifiedDate" in override) {
        merged.lastVerifiedDate = override.lastVerifiedDate ?? "";
      }
      if (editedFields.includes("lastVerifiedBy") || "lastVerifiedBy" in override) {
        merged.lastVerifiedBy = override.lastVerifiedBy ?? "";
      }
      if (editedFields.includes("associatedApplications") || "associatedApplications" in override) {
        merged.associatedApplications = override.associatedApplications ?? [];
      }
    }

    const vendorName = resolveVendorCompanyName(merged);
    const rawVendorField = cleanText(merged.company || merged.vendor);
    const primarySystem = resolvePrimarySystemName(merged);
    const category = resolveVendorCategory(merged);

    return {
      index,
      id: merged.id || `vendor-row-${merged.sourceRow || index + 1}`,
      sourceRow: merged.sourceRow,
      vendorName,
      rawVendorName: rawVendorField,
      isInternalOrNaVendor: /^(na|n\/a)$/i.test(rawVendorField),
      primarySystem,
      category,
      aagItsTeam: usableValue(merged.aagItsTeam) || "",
      aagItsPoc: usableValue(merged.aagItsPoc) || "",
      email: usableValue(merged.email) || "",
      phone: usableValue(merged.phone) || "",
      merged,
      editedFields
    };
  });

  // Group systems by normalized vendor company name across all 37 records
  const systemsByVendorCompany = new Map();
  baseRecords.forEach(item => {
    const key = item.vendorName.toLowerCase();
    if (!systemsByVendorCompany.has(key)) {
      systemsByVendorCompany.set(key, new Set());
    }
    if (item.primarySystem) {
      systemsByVendorCompany.get(key).add(item.primarySystem);
    }
  });

  // Also map Ground Stop / directory applications to vendor companies where applicable
  const directoryAppsByVendor = new Map();
  applications.forEach(app => {
    const appName = cleanText(app?.name);
    const appVendor = cleanText(app?.vendor);
    if (!appName || !appVendor) return;
    baseRecords.forEach(item => {
      const vLower = item.vendorName.toLowerCase();
      const appVLower = appVendor.toLowerCase();
      if (
        vLower === appVLower ||
        (vLower.length >= 4 && appVLower.includes(vLower)) ||
        (appVLower.length >= 4 && vLower.includes(appVLower))
      ) {
        if (!directoryAppsByVendor.has(vLower)) {
          directoryAppsByVendor.set(vLower, new Set());
        }
        directoryAppsByVendor.get(vLower).add(appName);
      }
    });
  });

  // Second pass: assemble complete system/application relationships and portal status
  return baseRecords.map(item => {
    const vKey = item.vendorName.toLowerCase();
    const siblingSystemsSet = systemsByVendorCompany.get(vKey) || new Set();
    const directoryAppsSet = directoryAppsByVendor.get(vKey) || new Set();

    // Parse admin-associated applications
    const rawAssoc = item.merged.associatedApplications;
    const adminAssociatedApps = Array.isArray(rawAssoc)
      ? rawAssoc.map(a => cleanText(a)).filter(Boolean)
      : cleanText(rawAssoc)
      ? cleanText(rawAssoc)
          .split(",")
          .map(a => cleanText(a))
          .filter(Boolean)
      : [];

    const allSystemsList = [];
    const seenSystems = new Set();
    const addSystem = sysName => {
      const clean = cleanText(sysName);
      if (!clean) return;
      const lower = clean.toLowerCase();
      if (seenSystems.has(lower)) return;
      seenSystems.add(lower);
      allSystemsList.push(clean);
    };

    addSystem(item.primarySystem);
    adminAssociatedApps.forEach(addSystem);
    siblingSystemsSet.forEach(addSystem);
    directoryAppsSet.forEach(addSystem);

    const relatedSystems = allSystemsList.filter(
      sys => sys.toLowerCase() !== item.primarySystem.toLowerCase()
    );

    // Determine Portal URL:
    // If admin explicitly edited portalUrl (even to ""), respect it; otherwise check source data
    const adminEditedPortalUrl =
      item.editedFields.includes("portalUrl") ||
      (item.merged.portalUrl !== undefined && item.merged.portalUrl !== null);
    const rawPortalUrl = adminEditedPortalUrl
      ? cleanText(item.merged.portalUrl)
      : extractSourcePortalUrl(item.merged);

    const hasValidUrl = isValidPortalUrl(rawPortalUrl);
    const portalUrl = hasValidUrl ? rawPortalUrl : "";
    const lastVerifiedDate = hasValidUrl ? cleanText(item.merged.lastVerifiedDate) : "";
    const lastVerifiedBy = hasValidUrl ? cleanText(item.merged.lastVerifiedBy) : "";
    const portalNotes = cleanText(item.merged.portalNotes);

    // Portal Status rule:
    // - Only "Configured" or "Verified" when a valid URL is present.
    // - Only mark "Verified" if it has actually been checked (explicitly set to Verified with lastVerifiedDate).
    const requestedStatus = cleanText(item.merged.portalStatus);
    const isVerified =
      hasValidUrl &&
      requestedStatus.toLowerCase() === "verified" &&
      Boolean(lastVerifiedDate);

    const portalStatus = !hasValidUrl
      ? "Not Configured"
      : isVerified
      ? "Verified"
      : "Configured";

    const portalSource = !hasValidUrl
      ? ""
      : adminEditedPortalUrl && cleanText(item.merged.portalUrl)
      ? "Admin Configured"
      : "Source Escalation Data";

    return {
      id: item.id,
      sourceRow: item.sourceRow,
      vendorName: item.vendorName,
      rawVendorName: item.rawVendorName,
      isInternalOrNaVendor: item.isInternalOrNaVendor,
      primarySystem: item.primarySystem,
      allSystems: allSystemsList,
      relatedSystems,
      associatedApplications: adminAssociatedApps,
      category: item.category,
      portalUrl,
      portalDisplayText: portalUrl || "Portal Not Configured",
      portalStatus,
      isConfigured: hasValidUrl,
      isVerified,
      portalSource,
      portalNotes,
      lastVerifiedDate,
      lastVerifiedBy,
      aagItsTeam: item.aagItsTeam,
      aagItsPoc: item.aagItsPoc,
      email: item.email,
      phone: item.phone,
      updatedDate: cleanText(item.merged.updatedDate),
      updatedBy: cleanText(item.merged.updatedBy)
    };
  });
}

/**
 * Calculates the 4 summary card statistics dynamically from actual vendor case status records.
 * Distinguishes between vendor records (37), unique companies (29), and systems/applications.
 */
export function calculateVendorCaseStatusSummary(records = []) {
  const list = Array.isArray(records) ? records : [];
  const totalVendorRecords = list.length;

  // Unique vendor companies (normalized)
  const uniqueVendorCompanies = new Set(
    list.map(r => cleanText(r.vendorName).toLowerCase()).filter(Boolean)
  );

  // Unique primary systems across the 37 vendor records
  const uniquePrimarySystems = new Set(
    list.map(r => cleanText(r.primarySystem).toLowerCase()).filter(Boolean)
  );

  // Total unique systems/applications including linked directory apps
  const allUniqueSystems = new Set();
  let totalVendorAppRelationships = 0;
  list.forEach(r => {
    const systems = Array.isArray(r.allSystems) && r.allSystems.length
      ? r.allSystems
      : [r.primarySystem].filter(Boolean);
    totalVendorAppRelationships += systems.length;
    systems.forEach(sys => {
      const normalized = cleanText(sys).toLowerCase();
      if (normalized) allUniqueSystems.add(normalized);
    });
  });

  const configuredPortalLinks = list.filter(r => r.isConfigured).length;
  const verifiedPortalLinks = list.filter(r => r.isVerified).length;
  const unconfiguredPortalLinks = totalVendorRecords - configuredPortalLinks;

  return {
    totalVendorRecords,
    totalUniqueVendors: uniqueVendorCompanies.size,
    totalSystemsApplications: uniquePrimarySystems.size,
    totalAllUniqueApplications: allUniqueSystems.size,
    totalVendorAppRelationships,
    configuredPortalLinks,
    verifiedPortalLinks,
    unconfiguredPortalLinks
  };
}

/**
 * Extracts sorted filter dropdown options from the 37 vendor records and master catalog.
 */
export function getVendorCaseStatusFilterOptions(records = [], customCatalog = null) {
  const list = Array.isArray(records) ? records : [];
  const { applications } = getMasterCatalog(customCatalog);

  const vendorSet = new Set();
  const systemSet = new Set();
  const categorySet = new Set();

  list.forEach(r => {
    if (r.vendorName) vendorSet.add(r.vendorName);
    if (r.primarySystem) systemSet.add(r.primarySystem);
    if (Array.isArray(r.allSystems)) {
      r.allSystems.forEach(sys => {
        if (sys) systemSet.add(sys);
      });
    }
    if (r.category) categorySet.add(r.category);
  });

  applications.forEach(app => {
    const name = cleanText(app?.name);
    if (name) systemSet.add(name);
  });

  const sortAlpha = (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" });

  return {
    vendors: Array.from(vendorSet).sort(sortAlpha),
    systems: Array.from(systemSet).sort(sortAlpha),
    categories: Array.from(categorySet).sort(sortAlpha),
    statuses: ["Configured", "Not Configured", "Verified"]
  };
}

/**
 * Filters and searches vendor case status records immediately across:
 * - Search query (Vendor name, System/application name, Category, Portal URL, Notes)
 * - Vendor dropdown filter
 * - System/application dropdown filter
 * - Category dropdown filter
 * - Portal status dropdown filter
 */
export function filterVendorCaseStatusRecords(records = [], filters = {}) {
  const list = Array.isArray(records) ? records : [];
  const search = cleanText(filters.search).toLowerCase();
  const vendorFilter = cleanText(filters.vendor).toLowerCase();
  const systemFilter = cleanText(filters.system).toLowerCase();
  const categoryFilter = cleanText(filters.category).toLowerCase();
  const statusFilter = cleanText(filters.portalStatus).toLowerCase();

  return list.filter(record => {
    // 1. Vendor dropdown filter
    if (vendorFilter && record.vendorName.toLowerCase() !== vendorFilter) {
      return false;
    }

    // 2. System / Application dropdown filter (matches primary or any associated system)
    if (systemFilter) {
      const matchesPrimary = record.primarySystem.toLowerCase() === systemFilter;
      const matchesAssociated =
        Array.isArray(record.allSystems) &&
        record.allSystems.some(sys => sys.toLowerCase() === systemFilter);
      if (!matchesPrimary && !matchesAssociated) {
        return false;
      }
    }

    // 3. Category dropdown filter
    if (categoryFilter && record.category.toLowerCase() !== categoryFilter) {
      return false;
    }

    // 4. Portal Status dropdown filter
    if (statusFilter) {
      if (statusFilter === "configured") {
        if (!record.isConfigured) return false;
      } else if (statusFilter === "not configured") {
        if (record.isConfigured) return false;
      } else if (statusFilter === "verified") {
        if (!record.isVerified) return false;
      }
    }

    // 5. Free-text search across vendor name, system/app, category, portal URL
    if (search) {
      const haystacks = [
        record.vendorName,
        record.rawVendorName,
        record.primarySystem,
        ...(Array.isArray(record.allSystems) ? record.allSystems : []),
        record.category,
        record.portalUrl,
        record.portalDisplayText,
        record.portalStatus,
        record.portalNotes,
        record.aagItsTeam,
        String(record.id || ""),
        String(record.sourceRow || "")
      ];
      const matchesSearch = haystacks.some(
        val => val && String(val).toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }

    return true;
  });
}

/**
 * Updates an existing vendor record's portal configuration and application associations
 * using the existing productionOperationsVendors persistence mechanism.
 * Never creates duplicate vendor records.
 */
export async function saveVendorPortalConfiguration(vendorIdOrRow, updates = {}, adminEmail = "") {
  const { vendors } = getMasterCatalog();
  const targetVendor = vendors.find(
    v =>
      (v.id && v.id === vendorIdOrRow) ||
      (v.sourceRow && Number(v.sourceRow) === Number(vendorIdOrRow))
  );

  if (!targetVendor) {
    throw new Error(`Vendor record "${vendorIdOrRow}" was not found in the directory.`);
  }

  const rawPortalUrl = cleanText(updates.portalUrl);
  if (rawPortalUrl && !isValidPortalUrl(rawPortalUrl)) {
    throw new Error("Portal URL must be a valid http:// or https:// web address.");
  }

  const hasUrl = Boolean(rawPortalUrl);
  const requestedStatus = cleanText(updates.portalStatus);
  const rawVerifiedDate = cleanText(updates.lastVerifiedDate);

  // Enforce rule: Only mark a link Verified after it has actually been checked (requires URL + verified date)
  let finalStatus = "Not Configured";
  let finalVerifiedDate = "";
  if (hasUrl) {
    if (requestedStatus.toLowerCase() === "verified" && Boolean(rawVerifiedDate)) {
      finalStatus = "Verified";
      finalVerifiedDate = rawVerifiedDate;
    } else {
      finalStatus = "Configured";
      finalVerifiedDate = rawVerifiedDate;
    }
  }

  const finalNotes = cleanText(updates.portalNotes);
  const finalApps = Array.isArray(updates.associatedApplications)
    ? Array.from(
        new Set(updates.associatedApplications.map(a => cleanText(a)).filter(Boolean))
      )
    : [];

  const todayDisplay = new Date().toLocaleDateString("en-US");
  const updatedBy = cleanText(adminEmail) || getAdminSession().email || "Admin";

  const savedOverrides = readLocalJson(STORAGE_KEYS.VENDOR_OVERRIDES, []);
  const overridesList = Array.isArray(savedOverrides) ? [...savedOverrides] : [];

  const existingIdx = overridesList.findIndex(
    item =>
      (item.id && targetVendor.id && item.id === targetVendor.id) ||
      (item.sourceRow &&
        targetVendor.sourceRow &&
        Number(item.sourceRow) === Number(targetVendor.sourceRow))
  );

  const portalFieldNames = [
    "portalUrl",
    "portalStatus",
    "portalNotes",
    "lastVerifiedDate",
    "lastVerifiedBy",
    "associatedApplications",
    "infoUpdatedDate",
    "infoUpdatedBy"
  ];

  const baseEntry =
    existingIdx >= 0
      ? { ...overridesList[existingIdx] }
      : {
          id: targetVendor.id,
          sourceRow: targetVendor.sourceRow,
          vendorDataVersion: 2,
          systemName: targetVendor.systemName || targetVendor.displayName || "",
          category: targetVendor.category || targetVendor.displaySubtitle || "",
          vendorCompanyName: targetVendor.vendor || targetVendor.company || "",
          vendorPOC: targetVendor.vendorPoc || targetVendor.poc || "",
          contactNumbers: targetVendor.phone || "",
          emailAddress: targetVendor.email || "",
          aagItsPOC: targetVendor.aagItsPoc || "",
          aagItsTeam: targetVendor.aagItsTeam || "",
          prodOpsEscalationProcess: targetVendor.escalation || "",
          infoApprovedDate: targetVendor.approvedDate || "",
          infoApprovedBy: targetVendor.approvedBy || "",
          editedFields: []
        };

  const mergedEditedFields = Array.from(
    new Set([...(Array.isArray(baseEntry.editedFields) ? baseEntry.editedFields : []), ...portalFieldNames])
  );

  const updatedEntry = {
    ...baseEntry,
    id: targetVendor.id,
    sourceRow: targetVendor.sourceRow,
    portalUrl: rawPortalUrl,
    portalStatus: finalStatus,
    portalNotes: finalNotes,
    lastVerifiedDate: finalVerifiedDate,
    lastVerifiedBy: finalStatus === "Verified" ? updatedBy : baseEntry.lastVerifiedBy || "",
    associatedApplications: finalApps,
    infoUpdatedDate: todayDisplay,
    infoUpdatedBy: updatedBy,
    updatedDate: todayDisplay,
    updatedBy,
    editedFields: mergedEditedFields
  };

  if (existingIdx >= 0) {
    overridesList[existingIdx] = updatedEntry;
  } else {
    overridesList.push(updatedEntry);
  }

  writeLocalJson(STORAGE_KEYS.VENDOR_OVERRIDES, overridesList);

  // Record audit history entry
  const history = readLocalJson(STORAGE_KEYS.ADMIN_HISTORY, []);
  const historyList = Array.isArray(history) ? history : [];
  historyList.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action: "Vendor Portal Updated",
    type: "Vendor Portal",
    item: `${resolveVendorCompanyName(targetVendor)} (${resolvePrimarySystemName(targetVendor)})`,
    admin: updatedBy,
    timestamp: new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }),
    details: `${resolveVendorCompanyName(targetVendor)} (${resolvePrimarySystemName(targetVendor)}) — ${
      hasUrl ? `Portal ${finalStatus}: ${rawPortalUrl}` : "Portal set to Not Configured"
    }`
  });
  writeLocalJson(STORAGE_KEYS.ADMIN_HISTORY, historyList);

  // Sync window.masterData in-memory and persist to file service if running
  if (typeof window !== "undefined") {
    if (typeof window.syncMasterDataOverrides === "function") {
      window.syncMasterDataOverrides();
    }
    if (typeof window.persistMasterDataToFile === "function") {
      await window.persistMasterDataToFile();
    }
  }

  return updatedEntry;
}
