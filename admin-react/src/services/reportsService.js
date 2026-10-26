const REPORTS_STORAGE_KEYS = {
  VENDOR_OVERRIDES: "productionOperationsVendors",
  APP_OVERRIDES: "productionOperationsApplications"
};

export function cleanReportText(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item ?? "").trim())
      .filter(Boolean)
      .join(" ");
  }
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function singleLineReportText(value) {
  return cleanReportText(value).replace(/\s*\n\s*/g, " · ");
}

export function isPlaceholderOrEmpty(value) {
  const text = cleanReportText(value);
  if (!text) return true;
  return /^(?:na|n\/a|no|none|null|undefined|-|--|tbd)$/i.test(text);
}

export function usableReportValue(value) {
  const text = cleanReportText(value);
  return isPlaceholderOrEmpty(text) ? "" : text;
}

function readLocalArray(key) {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function normalizeOperationalStatus(rawStatus) {
  const text = usableReportValue(rawStatus);
  if (!text) return "Unknown";
  const lower = text.toLowerCase();
  if (lower === "operational" || lower === "active" || lower === "online" || lower === "up") {
    return "Operational";
  }
  if (lower.includes("maint") || lower.includes("degrad") || lower.includes("partial") || lower.includes("warn")) {
    return "Maintenance";
  }
  if (lower === "inactive" || lower === "offline" || lower === "down" || lower === "retired") {
    return "Inactive";
  }
  return text;
}

export function normalizeSeverityLevel(rawSeverity) {
  const text = usableReportValue(rawSeverity);
  if (!text) return "Unknown";
  const lower = text.toLowerCase();
  if (lower.includes("crit") || lower === "sev1" || lower === "sev-1" || lower === "tier-1") {
    return "Critical";
  }
  if (lower.includes("high") || lower === "sev2" || lower === "sev-2") {
    return "High";
  }
  if (lower.includes("med") || lower === "standard" || lower === "moderate" || lower === "sev3") {
    return "Medium";
  }
  if (lower.includes("low") || lower === "minor" || lower === "sev4") {
    return "Low";
  }
  return "Unknown";
}

export function summarizeDescription(rawDesc, fallbackText = "") {
  const full = cleanReportText(rawDesc) || cleanReportText(fallbackText) || "Operational application registered in Production Operations Connect.";
  const singleLine = full.replace(/\s*\n\s*/g, " ");
  if (singleLine.length <= 145) {
    return { shortDescription: singleLine, fullDescription: full };
  }
  const truncated = singleLine.slice(0, 142).replace(/\s+\S*$/, "") + "...";
  return { shortDescription: truncated, fullDescription: full };
}

/**
 * Canonical vendor company matching helper so application vendor names like
 * "TWC / The Weather Company", "AIMS (in Athens Greece)", or "Trax" match
 * their corresponding records in the 37-record master vendor directory.
 */
export function normalizeVendorMatchKey(name) {
  const text = usableReportValue(name).toLowerCase();
  if (!text) return "";
  if (text.includes("weather company") || text.includes("twc") || text.includes("wsi")) {
    return "the weather company (twc)";
  }
  if (text.includes("smart4aviation") || text === "s4a") {
    return "smart4aviation";
  }
  if (text.includes("jeppesen")) {
    return "jeppesen";
  }
  if (text.includes("sita")) {
    return "sita";
  }
  if (text.includes("trax")) {
    return "trax";
  }
  if (text.includes("aims")) {
    return "aims international limited";
  }
  if (text.includes("brock")) {
    return "brock solutions";
  }
  if (text.includes("panasonic")) {
    return "panasonic.aero";
  }
  if (text.includes("sabre")) {
    return "sabre";
  }
  if (text.includes("aerodata")) {
    return "aerodata";
  }
  if (text.includes("boeing")) {
    return "boeing";
  }
  if (text.includes("airbus") || text.includes("navblue")) {
    return "navblue / airbus";
  }
  return text.replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Loads operational applications from window.masterData.applications and merges
 * any administrator overrides from localStorage.
 *
 * @param {"ground-stop" | "all"} scope - "ground-stop" returns the 9 core Ground Stop
 *   operational applications (consistent with Home, Ground Stops, and Admin Control Center);
 *   "all" returns all 10 registered application records (including Brock SmartSuite).
 */
export function getReportApplications(scope = "ground-stop") {
  if (typeof window !== "undefined" && typeof window.syncMasterDataOverrides === "function") {
    try {
      window.syncMasterDataOverrides();
    } catch {
      // Ignore sync warning
    }
  }

  const rawAppsObj = (typeof window !== "undefined" && window.masterData && window.masterData.applications) || {};
  const groundStopKeys =
    (typeof window !== "undefined" && Array.isArray(window.groundStopApplicationKeys) && window.groundStopApplicationKeys) || [];
  const groundStopKeySet = new Set(groundStopKeys);
  const savedAppOverrides = readLocalArray(REPORTS_STORAGE_KEYS.APP_OVERRIDES);

  const entries = Object.entries(rawAppsObj).filter(([key]) => {
    if (key === "application-name") return false;
    if (scope === "all") return true;
    return groundStopKeySet.size === 0 ? true : groundStopKeySet.has(key);
  });

  return entries.map(([key, rawApp]) => {
    const appOverride = savedAppOverrides.find(
      item => item && (item.key === key || item.id === key || (rawApp?.id && item.id === rawApp.id))
    );
    const isEdited = Boolean(appOverride && appOverride.adminEdited);
    const merged = isEdited ? { ...rawApp, ...appOverride } : { ...rawApp };

    const name = usableReportValue(merged.name) || usableReportValue(merged.shortName) || key;
    const category = usableReportValue(merged.category) || usableReportValue(merged.function) || "Operational System";
    const { shortDescription, fullDescription } = summarizeDescription(
      merged.description,
      merged.displaySubtitle || merged.function
    );

    const rawVendor = cleanReportText(merged.vendor);
    const usableVendor = usableReportValue(merged.vendor);
    const hasVendorAssociation = Boolean(usableVendor);
    const vendorDisplay = usableVendor || "Unassigned (Internal ITS)";

    const rawStatus = cleanReportText(merged.status);
    const hasExplicitStatus = !isPlaceholderOrEmpty(rawStatus);
    const status = hasExplicitStatus ? normalizeOperationalStatus(rawStatus) : "Unknown";
    const isOperational = status === "Operational" || status === "Active";

    const rawSeverity = cleanReportText(merged.severity || merged.criticality);
    const hasExplicitSeverity = !isPlaceholderOrEmpty(rawSeverity);
    const severity = hasExplicitSeverity ? normalizeSeverityLevel(rawSeverity) : "Unknown";

    const aagPOC = usableReportValue(merged.aagPOC);
    const aagTeam = usableReportValue(merged.aagTeam || merged.team);
    const phone = usableReportValue(merged.phone);
    const email = usableReportValue(merged.email);
    const response = usableReportValue(merged.response || merged.sla);
    const supportModel = usableReportValue(merged.supportModel);
    const escalation = usableReportValue(merged.escalation);
    const icon = cleanReportText(merged.icon);

    // Completeness check for this application across 7 core operational fields
    const requiredChecks = [
      Boolean(name),
      hasVendorAssociation,
      hasExplicitStatus,
      hasExplicitSeverity,
      Boolean(aagPOC || aagTeam),
      Boolean(phone || email),
      Boolean(fullDescription)
    ];
    const completedFields = requiredChecks.filter(Boolean).length;

    return {
      key,
      id: merged.id || key,
      name,
      icon,
      category,
      shortDescription,
      fullDescription,
      rawVendor: rawVendor || "NA",
      vendor: usableVendor,
      vendorDisplay,
      vendorMatchKey: normalizeVendorMatchKey(usableVendor),
      hasVendorAssociation,
      rawStatus: rawStatus || "Unknown",
      status,
      hasExplicitStatus,
      isOperational,
      rawSeverity: rawSeverity || "Unknown",
      severity,
      hasExplicitSeverity,
      response,
      supportModel,
      aagPOC,
      aagTeam,
      phone,
      email,
      escalation,
      isGroundStopApp: groundStopKeySet.has(key),
      detailsUrl: `ground-stops.html?application=${encodeURIComponent(key)}`,
      completedFields,
      totalRequiredFields: requiredChecks.length
    };
  });
}

/**
 * Loads all 37 vendor records from window.masterData.vendors with any saved admin
 * overrides and computes both per-record details and aggregated unique vendor insights.
 */
export function getReportVendorData(applications = []) {
  const rawVendors =
    (typeof window !== "undefined" && window.masterData && Array.isArray(window.masterData.vendors)
      ? window.masterData.vendors
      : []);
  const savedVendorOverrides = readLocalArray(REPORTS_STORAGE_KEYS.VENDOR_OVERRIDES);

  const findOverride = vendor =>
    savedVendorOverrides.find(
      item =>
        (item.id && vendor.id && item.id === vendor.id) ||
        (item.sourceRow && vendor.sourceRow && Number(item.sourceRow) === Number(vendor.sourceRow))
    );

  // Normalize all 37 vendor directory records
  const vendorRecords = rawVendors.map((raw, idx) => {
    const override = findOverride(raw);
    const editedFields = Array.isArray(override?.editedFields) ? override.editedFields : [];
    const merged = { ...raw };

    if (override) {
      if (editedFields.includes("vendorCompanyName") || editedFields.includes("company")) {
        merged.vendor = override.vendorCompanyName ?? override.company ?? merged.vendor;
        merged.company = merged.vendor;
      }
      if (editedFields.includes("systemName")) {
        merged.systemName = override.systemName ?? merged.systemName;
      }
      if (editedFields.includes("category")) {
        merged.category = override.category ?? merged.category;
      }
      if (editedFields.includes("contactNumbers") || editedFields.includes("phone")) {
        merged.phone = override.contactNumbers ?? override.phone ?? merged.phone;
      }
      if (editedFields.includes("emailAddress") || editedFields.includes("email")) {
        merged.email = override.emailAddress ?? override.email ?? merged.email;
      }
      if (editedFields.includes("vendorPOC") || editedFields.includes("poc")) {
        merged.vendorPoc = override.vendorPOC ?? override.poc ?? merged.vendorPoc;
      }
      if (editedFields.includes("aagItsPOC") || editedFields.includes("aagItsPoc")) {
        merged.aagItsPoc = override.aagItsPOC ?? override.aagItsPoc ?? merged.aagItsPoc;
      }
      if (editedFields.includes("aagItsTeam")) {
        merged.aagItsTeam = override.aagItsTeam ?? merged.aagItsTeam;
      }
    }

    const rawVendorCompany = cleanReportText(merged.company || merged.vendor);
    const usableCompany = usableReportValue(merged.company || merged.vendor);
    const systemName =
      usableReportValue(merged.systemName) ||
      usableReportValue(merged.displayName) ||
      "Unspecified System";
    const vendorName = usableCompany || `${systemName} (Internal / Unassigned)`;
    const hasExplicitVendorCompany = Boolean(usableCompany);

    const category = usableReportValue(merged.category) || "Operations Partner";
    const phone = usableReportValue(merged.phone);
    const email = usableReportValue(merged.email);
    const escalation = usableReportValue(merged.escalation);
    const vendorPoc = usableReportValue(merged.vendorPoc || merged.poc);
    const aagItsPoc = usableReportValue(merged.aagItsPoc);
    const aagItsTeam = usableReportValue(merged.aagItsTeam);

    const hasPhone = Boolean(phone);
    const hasEmail = Boolean(email);
    const hasCompleteContact = hasPhone && hasEmail;
    const hasAnyContact = hasPhone || hasEmail;
    const missingContactInfo = !hasPhone || !hasEmail;

    let contactStatus = "Complete Contact";
    let contactStatusTone = "active";
    if (!hasPhone && !hasEmail) {
      contactStatus = "Missing Phone & Email";
      contactStatusTone = "critical";
    } else if (!hasPhone) {
      contactStatus = "Missing Phone";
      contactStatusTone = "warning";
    } else if (!hasEmail) {
      contactStatus = "Missing Email";
      contactStatusTone = "warning";
    }

    const matchKey = hasExplicitVendorCompany
      ? normalizeVendorMatchKey(usableCompany)
      : `internal-row-${merged.sourceRow || idx + 1}`;

    // Find linked applications from the operational applications dataset
    const linkedCoreApps = applications.filter(app => {
      if (!app.hasVendorAssociation) return false;
      if (app.vendorMatchKey && app.vendorMatchKey === matchKey) return true;
      const vLower = vendorName.toLowerCase();
      const aLower = app.vendor.toLowerCase();
      return (
        vLower === aLower ||
        (vLower.length >= 4 && aLower.includes(vLower)) ||
        (aLower.length >= 4 && vLower.includes(aLower))
      );
    });

    // Completeness check across 6 core vendor record fields
    const requiredChecks = [
      hasExplicitVendorCompany,
      Boolean(systemName),
      hasPhone,
      hasEmail,
      Boolean(escalation),
      Boolean(aagItsTeam || aagItsPoc)
    ];
    const completedFields = requiredChecks.filter(Boolean).length;

    const recordId = merged.id || `vendor-row-${merged.sourceRow || idx + 1}`;

    return {
      id: recordId,
      sourceRow: merged.sourceRow || idx + 1,
      vendorName,
      rawVendorCompany: rawVendorCompany || "NA",
      hasExplicitVendorCompany,
      matchKey,
      systemName,
      category,
      phone,
      email,
      hasPhone,
      hasEmail,
      hasCompleteContact,
      hasAnyContact,
      missingContactInfo,
      contactStatus,
      contactStatusTone,
      escalation,
      vendorPoc,
      aagItsPoc,
      aagItsTeam,
      linkedCoreApps: linkedCoreApps.map(a => a.name),
      linkedCoreAppKeys: linkedCoreApps.map(a => a.key),
      vendorUrl: `vendors.html?vendor=${encodeURIComponent(recordId)}&search=${encodeURIComponent(usableCompany || systemName)}`,
      completedFields,
      totalRequiredFields: requiredChecks.length
    };
  });

  // Aggregate unique vendors without duplicating vendor entries
  const vendorGroupsMap = new Map();

  vendorRecords.forEach(record => {
    const groupKey = record.matchKey;
    if (!vendorGroupsMap.has(groupKey)) {
      vendorGroupsMap.set(groupKey, {
        key: groupKey,
        id: record.id,
        vendorName: record.vendorName,
        hasExplicitVendorCompany: record.hasExplicitVendorCompany,
        directoryRecordCount: 0,
        directorySystems: [],
        linkedCoreApps: [],
        linkedCoreAppKeys: [],
        categories: [],
        recordsWithPhone: 0,
        recordsWithEmail: 0,
        recordsWithEscalation: 0,
        sourceRows: [],
        primaryRecordId: record.id,
        searchQuery: record.hasExplicitVendorCompany ? record.vendorName : record.systemName
      });
    }

    const group = vendorGroupsMap.get(groupKey);
    group.directoryRecordCount += 1;
    group.sourceRows.push(record.sourceRow);

    if (record.systemName && !group.directorySystems.some(s => s.toLowerCase() === record.systemName.toLowerCase())) {
      group.directorySystems.push(record.systemName);
    }
    if (record.category && !group.categories.some(c => c.toLowerCase() === record.category.toLowerCase())) {
      group.categories.push(record.category);
    }
    record.linkedCoreApps.forEach((appName, i) => {
      if (!group.linkedCoreApps.includes(appName)) {
        group.linkedCoreApps.push(appName);
        group.linkedCoreAppKeys.push(record.linkedCoreAppKeys[i]);
      }
    });

    if (record.hasPhone) group.recordsWithPhone += 1;
    if (record.hasEmail) group.recordsWithEmail += 1;
    if (record.escalation) group.recordsWithEscalation += 1;
  });

  // Also ensure any vendor present in applications that wasn't matched above is linked
  applications.forEach(app => {
    if (!app.hasVendorAssociation) return;
    const key = app.vendorMatchKey;
    if (vendorGroupsMap.has(key)) {
      const group = vendorGroupsMap.get(key);
      if (!group.linkedCoreApps.includes(app.name)) {
        group.linkedCoreApps.push(app.name);
        group.linkedCoreAppKeys.push(app.key);
      }
    } else {
      vendorGroupsMap.set(key, {
        key,
        id: `app-vendor-${key}`,
        vendorName: app.vendor,
        hasExplicitVendorCompany: true,
        directoryRecordCount: 0,
        directorySystems: [app.name],
        linkedCoreApps: [app.name],
        linkedCoreAppKeys: [app.key],
        categories: [app.category],
        recordsWithPhone: app.phone ? 1 : 0,
        recordsWithEmail: app.email ? 1 : 0,
        recordsWithEscalation: app.escalation ? 1 : 0,
        sourceRows: [],
        primaryRecordId: "",
        searchQuery: app.vendor
      });
    }
  });

  const uniqueVendors = Array.from(vendorGroupsMap.values())
    .map(group => {
      // Combine core linked apps + vendor directory systems into a deduplicated list of associated applications/systems
      const combinedSystems = [];
      const seen = new Set();
      group.linkedCoreApps.forEach(name => {
        const lower = name.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          combinedSystems.push({ name, isCoreApp: true });
        }
      });
      group.directorySystems.forEach(name => {
        const lower = name.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          combinedSystems.push({ name, isCoreApp: false });
        }
      });

      const hasFullContact = group.recordsWithPhone > 0 && group.recordsWithEmail > 0;
      const hasPartialContact = group.recordsWithPhone > 0 || group.recordsWithEmail > 0;

      let vendorStatus = "Active · Complete Contact";
      let statusTone = "active";
      if (!group.hasExplicitVendorCompany) {
        vendorStatus = "Internal / Unassigned Vendor";
        statusTone = "neutral";
      } else if (hasFullContact) {
        vendorStatus = "Active · Verified Contact";
        statusTone = "active";
      } else if (hasPartialContact) {
        vendorStatus = "Partial Contact Info";
        statusTone = "warning";
      } else {
        vendorStatus = "Missing Contact Info";
        statusTone = "critical";
      }

      const vendorUrl = group.primaryRecordId
        ? `vendors.html?vendor=${encodeURIComponent(group.primaryRecordId)}&search=${encodeURIComponent(group.searchQuery)}`
        : `vendors.html?search=${encodeURIComponent(group.searchQuery)}`;

      return {
        ...group,
        coreAppCount: group.linkedCoreApps.length,
        totalSystemCount: combinedSystems.length,
        combinedSystems,
        allSystemNames: combinedSystems.map(s => s.name),
        vendorStatus,
        statusTone,
        vendorUrl
      };
    })
    .sort((a, b) => {
      if (b.coreAppCount !== a.coreAppCount) return b.coreAppCount - a.coreAppCount;
      if (b.totalSystemCount !== a.totalSystemCount) return b.totalSystemCount - a.totalSystemCount;
      return a.vendorName.localeCompare(b.vendorName);
    });

  return {
    vendorRecords,
    uniqueVendors
  };
}

/**
 * Computes all KPI cards, Severity distribution, Operational Response overview,
 * and Data Quality & Information Completeness metrics from actual project data.
 */
export function buildOperationalReportSnapshot(scope = "ground-stop") {
  const applications = getReportApplications(scope);
  const allRegisteredApplications = scope === "all" ? applications : getReportApplications("all");
  const { vendorRecords, uniqueVendors } = getReportVendorData(applications);

  const totalApplications = applications.length;
  const criticalApplications = applications.filter(app => app.severity === "Critical").length;
  const activeApplications = applications.filter(app => app.isOperational).length;
  const totalVendorRecords = vendorRecords.length;
  const totalUniqueVendors = uniqueVendors.length;

  // Severity distribution
  const severityLevels = [
    { key: "Critical", label: "Critical", tone: "critical", description: "Immediate operational attention required" },
    { key: "High", label: "High", tone: "high", description: "Priority operational support and escalation" },
    { key: "Medium", label: "Medium", tone: "medium", description: "Standard operational support channel" },
    { key: "Low", label: "Low", tone: "low", description: "Routine operational monitoring" },
    { key: "Unknown", label: "Unknown", tone: "unknown", description: "Severity not yet classified" }
  ];

  const severityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Unknown: 0
  };

  applications.forEach(app => {
    const key = severityCounts[app.severity] !== undefined ? app.severity : "Unknown";
    severityCounts[key] += 1;
  });

  const severityDistribution = severityLevels
    .filter(level => level.key !== "Unknown" || severityCounts.Unknown > 0)
    .map(level => {
      const count = severityCounts[level.key] || 0;
      const percentage = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
      const exactPercentage = totalApplications > 0 ? Number(((count / totalApplications) * 100).toFixed(1)) : 0;
      const matchingApps = applications.filter(app => app.severity === level.key).map(app => app.name);
      return {
        ...level,
        count,
        percentage,
        exactPercentage,
        matchingApps
      };
    });

  // Data Quality & Information Completeness calculations
  const appsMissingVendor = applications.filter(app => !app.hasVendorAssociation);
  const appsMissingContact = applications.filter(app => !app.phone && !app.email);
  const appsUnknownStatus = applications.filter(app => !app.hasExplicitStatus || app.status === "Unknown");

  const vendorsMissingContact = vendorRecords.filter(v => v.missingContactInfo);
  const vendorsMissingBothContacts = vendorRecords.filter(v => !v.hasPhone && !v.hasEmail);
  const vendorsMissingCompany = vendorRecords.filter(v => !v.hasExplicitVendorCompany);
  const vendorsMissingEscalation = vendorRecords.filter(v => !v.escalation);

  const totalAppRequiredFields = applications.reduce((sum, a) => sum + a.totalRequiredFields, 0);
  const totalAppCompletedFields = applications.reduce((sum, a) => sum + a.completedFields, 0);
  const totalVendorRequiredFields = vendorRecords.reduce((sum, v) => sum + v.totalRequiredFields, 0);
  const totalVendorCompletedFields = vendorRecords.reduce((sum, v) => sum + v.completedFields, 0);

  const combinedRequiredFields = totalAppRequiredFields + totalVendorRequiredFields;
  const combinedCompletedFields = totalAppCompletedFields + totalVendorCompletedFields;
  const dataCompletenessPct =
    combinedRequiredFields > 0
      ? Math.round((combinedCompletedFields / combinedRequiredFields) * 100)
      : 100;

  const appCompletenessPct =
    totalAppRequiredFields > 0
      ? Math.round((totalAppCompletedFields / totalAppRequiredFields) * 100)
      : 100;

  const vendorCompletenessPct =
    totalVendorRequiredFields > 0
      ? Math.round((totalVendorCompletedFields / totalVendorRequiredFields) * 100)
      : 100;

  return {
    generatedAt: new Date().toISOString(),
    scope,
    applications,
    allRegisteredCount: allRegisteredApplications.length,
    groundStopCount: getReportApplications("ground-stop").length,
    vendorRecords,
    uniqueVendors,
    kpis: {
      totalApplications,
      criticalApplications,
      activeApplications,
      totalVendorRecords,
      totalUniqueVendors
    },
    severityDistribution,
    dataQuality: {
      totalVendorRecords,
      totalUniqueVendors,
      totalApplicationRecords: totalApplications,
      appsMissingVendorCount: appsMissingVendor.length,
      appsMissingVendor,
      appsMissingContactCount: appsMissingContact.length,
      appsMissingContact,
      vendorsMissingContactCount: vendorsMissingContact.length,
      vendorsMissingContact,
      vendorsMissingBothContactsCount: vendorsMissingBothContacts.length,
      vendorsMissingCompanyCount: vendorsMissingCompany.length,
      vendorsMissingCompany,
      vendorsMissingEscalationCount: vendorsMissingEscalation.length,
      unknownStatusCount: appsUnknownStatus.length,
      appsUnknownStatus,
      dataCompletenessPct,
      appCompletenessPct,
      vendorCompletenessPct,
      combinedCompletedFields,
      combinedRequiredFields
    }
  };
}

/**
 * RFC-4180 compliant CSV cell escaping (handles commas, double quotes, and newlines).
 */
export function escapeCsvCell(value) {
  const str = String(value ?? "").replace(/\r\n/g, "\n");
  if (/[",\n]/.test(str)) {
    return '"' + str.split('"').join('""') + '"';
  }
  return str;
}

export function triggerCsvDownload(filename, rows) {
  const csvContent =
    "\uFEFF" +
    rows
      .map(row => row.map(escapeCsvCell).join(","))
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports currently filtered application health rows to `application-health-report.csv`.
 */
export function exportFilteredApplicationsCsv(filteredApplications) {
  const headers = [
    "Application ID",
    "Application Name",
    "Category",
    "Vendor",
    "Operational Status",
    "Severity",
    "Target Response Guidance",
    "AAG ITS POC",
    "AAG ITS Team",
    "Support Phone",
    "Support Email",
    "Description"
  ];

  const rows = (filteredApplications || []).map(app => [
    app.id,
    app.name,
    app.category,
    app.vendorDisplay,
    app.status,
    app.severity,
    app.response || "Not specified",
    app.aagPOC || "Not listed",
    app.aagTeam || "Not listed",
    app.phone || "Not listed",
    app.email || "Not listed",
    singleLineReportText(app.fullDescription)
  ]);

  triggerCsvDownload("application-health-report.csv", [headers, ...rows]);
}

/**
 * Exports the full operational report (KPI summary, Application Health, Vendor Insights,
 * and Data Quality completeness) to `production-operations-report.csv`.
 */
export function exportFullOperationalReportCsv(snapshot, filteredApplications) {
  const rows = [];
  const reportDate = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  rows.push(["PRODUCTION OPERATIONS CONNECT — REPORTS & ANALYTICS"]);
  rows.push(["Generated", reportDate]);
  rows.push([]);

  rows.push(["1. EXECUTIVE KPI SUMMARY"]);
  rows.push(["Metric", "Value", "Notes"]);
  rows.push(["Total Applications", snapshot.kpis.totalApplications, "Registered operational systems"]);
  rows.push(["Critical Applications", snapshot.kpis.criticalApplications, "Applications requiring immediate operational attention"]);
  rows.push(["Active Applications", snapshot.kpis.activeApplications, "Systems in Operational / Active status"]);
  rows.push(["Total Vendor Records", snapshot.kpis.totalVendorRecords, `${snapshot.kpis.totalUniqueVendors} unique vendor entries across directory`]);
  rows.push(["Overall Data Completeness", `${snapshot.dataQuality.dataCompletenessPct}%`, `${snapshot.dataQuality.combinedCompletedFields} of ${snapshot.dataQuality.combinedRequiredFields} core operational fields populated`]);
  rows.push([]);

  rows.push(["2. SEVERITY DISTRIBUTION"]);
  rows.push(["Severity Level", "Application Count", "Share (%)", "Applications"]);
  snapshot.severityDistribution.forEach(item => {
    rows.push([
      item.label,
      item.count,
      `${item.percentage}%`,
      item.matchingApps.join("; ") || "None"
    ]);
  });
  rows.push([]);

  rows.push(["3. APPLICATION HEALTH OVERVIEW"]);
  rows.push([
    "Application Name",
    "Category",
    "Vendor",
    "Operational Status",
    "Severity",
    "Response Guidance",
    "AAG ITS Team",
    "AAG ITS POC",
    "Support Phone",
    "Support Email",
    "Description"
  ]);
  (filteredApplications || snapshot.applications).forEach(app => {
    rows.push([
      app.name,
      app.category,
      app.vendorDisplay,
      app.status,
      app.severity,
      app.response || "Standard",
      app.aagTeam || "Not listed",
      app.aagPOC || "Not listed",
      app.phone || "Not listed",
      app.email || "Not listed",
      singleLineReportText(app.fullDescription)
    ]);
  });
  rows.push([]);

  rows.push(["4. VENDOR COVERAGE & DIRECTORY INSIGHTS (ALL 37 SOURCE RECORDS)"]);
  rows.push([
    "Source Row",
    "Vendor Name",
    "System / Application",
    "Category",
    "Linked Core Applications",
    "Contact Status",
    "Vendor Phone",
    "Vendor Email",
    "AAG ITS Team"
  ]);
  snapshot.vendorRecords.forEach(v => {
    rows.push([
      v.sourceRow,
      v.vendorName,
      v.systemName,
      v.category,
      v.linkedCoreApps.join("; ") || "Directory System Only",
      v.contactStatus,
      v.phone || "Not listed",
      v.email || "Not listed",
      v.aagItsTeam || "Not listed"
    ]);
  });
  rows.push([]);

  rows.push(["5. DATA QUALITY & INFORMATION COMPLETENESS"]);
  rows.push(["Quality Metric", "Count", "Details"]);
  rows.push(["Total Vendor Directory Records", snapshot.dataQuality.totalVendorRecords, "Source ITS vendor spreadsheet records"]);
  rows.push(["Total Operational Applications", snapshot.dataQuality.totalApplicationRecords, "Registered operational systems"]);
  rows.push([
    "Applications Missing Vendor Association",
    snapshot.dataQuality.appsMissingVendorCount,
    snapshot.dataQuality.appsMissingVendor.map(a => a.name).join("; ") || "None"
  ]);
  rows.push([
    "Vendor Records Missing Phone or Email",
    snapshot.dataQuality.vendorsMissingContactCount,
    snapshot.dataQuality.vendorsMissingContact.map(v => `${v.vendorName} (${v.systemName})`).join("; ") || "None"
  ]);
  rows.push([
    "Records With Unknown / Missing Status",
    snapshot.dataQuality.unknownStatusCount,
    snapshot.dataQuality.appsUnknownStatus.map(a => a.name).join("; ") || "None"
  ]);

  triggerCsvDownload("production-operations-report.csv", rows);
}
