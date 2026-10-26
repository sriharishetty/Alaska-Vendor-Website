const FAVORITES_STORAGE_KEYS = {
  APP_FAVORITES: "productionOpsGroundStopFavorites",
  LEGACY_APP_FAVORITES: "favoriteApplications",
  VENDOR_FAVORITES: "productionOpsVendorFavorites",
  COMBINED_FAVORITES: "productionOperationsFavorites",
  SHORT_FAVORITES: "favorites",
  VENDOR_OVERRIDES: "productionOperationsVendors",
  APP_OVERRIDES: "productionOperationsApplications"
};

const APP_CARD_PROFILES = {
  acars: {
    title: "ACARS",
    subtitle: "Aircraft Communications Addressing and Reporting System",
    summary:
      "Real-time air-to-ground datalink messaging between aircraft avionics and ground operations dispatch.",
    category: "Flight Operations",
    severity: "Critical",
    status: "Operational",
    responseSla: "15m Response",
    supportModel: "24/7 Tier-1 Dispatch",
    tone: "blue",
    iconType: "radio"
  },
  "aims-crew": {
    title: "AIMS Crew Management",
    subtitle: "Crew Scheduling, Pairing & Legality",
    summary:
      "Integrated airline crew management platform handling crew pairings, rosters, FAR117 legality, and tracking.",
    category: "Crew Operations",
    severity: "Critical",
    status: "Operational",
    responseSla: "15m Response",
    supportModel: "24/7 Operations Support",
    tone: "teal",
    iconType: "users"
  },
  airbus: {
    title: "Airbus Fleet Systems",
    subtitle: "NAVBLUE & Aircraft Technical Operations",
    summary:
      "Technical flight operations, electronic flight bag (EFB) performance data, and Airbus fleet engineering support.",
    category: "Maintenance & Engineering",
    severity: "High",
    status: "Operational",
    responseSla: "30m Response",
    supportModel: "24/7 Engineering Desk",
    tone: "indigo",
    iconType: "plane"
  },
  boeing: {
    title: "Boeing Toolbox",
    subtitle: "Maintenance Performance & Technical Publications",
    summary:
      "Cloud-hosted aircraft maintenance manuals, wiring diagrams, fault isolation procedures, and engineering data.",
    category: "Maintenance & Engineering",
    severity: "High",
    status: "Operational",
    responseSla: "30m Response",
    supportModel: "24/7 Fleet Technical Desk",
    tone: "navy",
    iconType: "wrench"
  },
  "fusion-twc": {
    title: "Fusion (TWC)",
    subtitle: "Aviation Weather & Airspace Situational Awareness",
    summary:
      "Meteorological visualization, convective weather tracking, turbulence alerting, and route hazard overlays.",
    category: "Flight Operations",
    severity: "Critical",
    status: "Operational",
    responseSla: "15m Response",
    supportModel: "24/7 Aviation Weather Desk",
    tone: "sky",
    iconType: "cloud"
  },
  jcte: {
    title: "JCTE",
    subtitle: "Jeppesen Crew & Tail Tracking Engine",
    summary:
      "Operational disruption recovery, tail assignment optimization, and crew connection alerting.",
    category: "Flight Operations",
    severity: "Critical",
    status: "Operational",
    responseSla: "15m Response",
    supportModel: "24/7 Critical Ops",
    tone: "amber",
    iconType: "compass"
  },
  jetplan: {
    title: "JetPlan",
    subtitle: "Flight Planning & Fuel Optimization Engine",
    summary:
      "Automated IFR flight plan generation, ETOPS calculations, wind routing optimization, and ATC filing.",
    category: "Flight Operations",
    severity: "Critical",
    status: "Operational",
    responseSla: "15m Response",
    supportModel: "24/7 Dispatch Support",
    tone: "orange",
    iconType: "route"
  },
  s4a: {
    title: "Smart4Aviation (S4A)",
    subtitle: "Weight & Balance, Briefing & Flight Info",
    summary:
      "Centralized load control, aircraft weight & balance calculation, NOTAM briefing, and dispatcher workstation.",
    category: "Flight Operations",
    severity: "Critical",
    status: "Operational",
    responseSla: "15m Response",
    supportModel: "24/7 Critical Support",
    tone: "purple",
    iconType: "scale"
  },
  wam: {
    title: "WAM",
    subtitle: "TRAX Maintenance & Engineering ERP",
    summary:
      "Aircraft airworthiness tracking, line and heavy maintenance work orders, MEL/CDL control, and parts inventory.",
    category: "Maintenance & Engineering",
    severity: "Critical",
    status: "Operational",
    responseSla: "15m Response",
    supportModel: "24/7 M&E Critical Desk",
    tone: "crimson",
    iconType: "shield"
  },
  "brock-smartsuite": {
    title: "Brock SmartSuite",
    subtitle: "Baggage Reconciliation & Ramp Operations",
    summary:
      "Passenger baggage tracking, ramp scanning, and automated baggage handling system reconciliation.",
    category: "Airport & Customer Operations",
    severity: "High",
    status: "Operational",
    responseSla: "30m Response",
    supportModel: "24/7 Airport Support",
    tone: "teal",
    iconType: "luggage"
  }
};

export function cleanFavText(value) {
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

export function isFavPlaceholder(value) {
  const text = cleanFavText(value);
  if (!text) return true;
  return /^(?:na|n\/a|no|none|null|undefined|-|--|tbd)$/i.test(text);
}

export function usableFavValue(value, fallback = "") {
  const text = cleanFavText(value);
  return isFavPlaceholder(text) ? fallback : text;
}

function safeReadStorageArray(key) {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item !== null && item !== undefined)
      .map(item => String(item).trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function buildMonogram(name) {
  const clean = cleanFavText(name).replace(/[^a-zA-Z0-9 ]+/g, " ").trim();
  if (!clean) return "OP";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Loads all normalized applications from masterData + admin overrides + profile metadata.
 */
export function getAllCatalogApplications() {
  if (typeof window !== "undefined" && typeof window.syncMasterDataOverrides === "function") {
    try {
      window.syncMasterDataOverrides();
    } catch {
      // Ignore sync warning
    }
  }

  const rawApps =
    (typeof window !== "undefined" && window.masterData && window.masterData.applications) || {};
  const savedOverrides = safeReadStorageArrayRaw(FAVORITES_STORAGE_KEYS.APP_OVERRIDES);

  const entries = Object.entries(rawApps).filter(([key]) => key !== "application-name");

  return entries.map(([key, app]) => {
    const override = savedOverrides.find(
      item => item && (item.key === key || item.id === key || (app?.id && item.id === app.id))
    );
    const merged = override && override.adminEdited ? { ...app, ...override } : { ...app };
    const profile = APP_CARD_PROFILES[key] || {};

    const name =
      usableFavValue(merged.name) ||
      usableFavValue(profile.title) ||
      usableFavValue(merged.shortName) ||
      key.toUpperCase();
    const subtitle =
      usableFavValue(merged.displaySubtitle) ||
      usableFavValue(profile.subtitle) ||
      usableFavValue(merged.category) ||
      "Operational System";

    const fullDescription =
      usableFavValue(merged.description) ||
      usableFavValue(profile.summary) ||
      subtitle;

    const singleLineDesc = fullDescription.replace(/\s*\n\s*/g, " ");
    const shortDescription =
      singleLineDesc.length > 140
        ? singleLineDesc.slice(0, 137).replace(/\s+\S*$/, "") + "..."
        : singleLineDesc;

    const vendor = usableFavValue(merged.vendor, "Internal / Airline Managed");
    const category =
      usableFavValue(merged.category) ||
      usableFavValue(profile.category) ||
      "Flight Operations";

    const rawStatus = usableFavValue(merged.status) || usableFavValue(profile.status) || "Operational";
    const statusLower = rawStatus.toLowerCase();
    const status =
      statusLower === "active" || statusLower === "operational" || statusLower === "online"
        ? "Operational"
        : statusLower.includes("maint") || statusLower.includes("degrad")
        ? "Maintenance"
        : rawStatus;

    const rawSeverity =
      usableFavValue(merged.severity) ||
      usableFavValue(merged.criticality) ||
      usableFavValue(profile.severity) ||
      "High";
    const sevLower = rawSeverity.toLowerCase();
    const severity = sevLower.includes("crit")
      ? "Critical"
      : sevLower.includes("high")
      ? "High"
      : sevLower.includes("med")
      ? "Medium"
      : "Standard";

    const aagPOC = usableFavValue(merged.aagPOC);
    const aagTeam = usableFavValue(merged.aagTeam || merged.team);
    const phone = usableFavValue(merged.phone);
    const email = usableFavValue(merged.email);
    const responseSla =
      usableFavValue(merged.response || merged.sla) || usableFavValue(profile.responseSla);
    const supportModel =
      usableFavValue(merged.supportModel) || usableFavValue(profile.supportModel);
    const escalation = usableFavValue(merged.escalation);

    return {
      resourceType: "application",
      favoriteId: `app:${key}`,
      key,
      id: merged.id || key,
      name,
      subtitle,
      shortDescription,
      fullDescription,
      vendor,
      category,
      status,
      severity,
      isCritical: severity === "Critical",
      isOperational: status === "Operational" || status === "Active",
      is24x7:
        supportModel.toLowerCase().includes("24/7") ||
        supportModel.toLowerCase().includes("24x7") ||
        escalation.toLowerCase().includes("24x7"),
      aagPOC,
      aagTeam,
      phone,
      email,
      responseSla,
      supportModel,
      escalation,
      monogram: buildMonogram(name),
      tone: profile.tone || "blue",
      iconType: profile.iconType || "app",
      iconPath: usableFavValue(merged.icon),
      detailsUrl: `ground-stops.html?application=${encodeURIComponent(key)}`
    };
  });
}

function safeReadStorageArrayRaw(key) {
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

/**
 * Loads all 37 vendor records from window.masterData.vendors + admin overrides.
 */
export function getAllCatalogVendors(catalogApplications = []) {
  const rawVendors =
    (typeof window !== "undefined" &&
      window.masterData &&
      Array.isArray(window.masterData.vendors) &&
      window.masterData.vendors) ||
    [];
  const savedOverrides = safeReadStorageArrayRaw(FAVORITES_STORAGE_KEYS.VENDOR_OVERRIDES);

  const findOverride = vendor =>
    savedOverrides.find(
      item =>
        item &&
        ((item.id && vendor.id && item.id === vendor.id) ||
          (item.sourceRow && vendor.sourceRow && Number(item.sourceRow) === Number(vendor.sourceRow)))
    );

  // First pass: normalize each of the 37 vendor rows
  const normalizedRows = rawVendors.map((raw, idx) => {
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

    const id = String(merged.id || merged.sourceRow || idx + 1);
    const companyName = usableFavValue(merged.company || merged.vendor);
    const systemName = usableFavValue(merged.systemName || merged.displayName, "Operational System");
    const displayName = companyName || `${systemName} (Internal / Unassigned)`;
    const category = usableFavValue(merged.category, "Operations Partner");
    const vendorPoc = usableFavValue(merged.vendorPoc || merged.poc);
    const aagItsPoc = usableFavValue(merged.aagItsPoc);
    const aagItsTeam = usableFavValue(merged.aagItsTeam);
    const phone = usableFavValue(merged.phone);
    const email = usableFavValue(merged.email);
    const escalation = usableFavValue(merged.escalation);
    const portalUrl = usableFavValue(merged.portalUrl || merged.supportPortal);

    return {
      id,
      sourceRow: merged.sourceRow || idx + 1,
      companyName,
      systemName,
      displayName,
      category,
      vendorPoc,
      aagItsPoc,
      aagItsTeam,
      phone,
      email,
      escalation,
      portalUrl
    };
  });

  // Group systems by company name so if a vendor company supports multiple systems,
  // we show all supported systems on that vendor's card while preserving exact record IDs.
  const systemsByCompany = new Map();
  normalizedRows.forEach(row => {
    const key = (row.companyName || row.displayName).toLowerCase().trim();
    if (!systemsByCompany.has(key)) {
      systemsByCompany.set(key, new Set());
    }
    if (row.systemName) {
      systemsByCompany.get(key).add(row.systemName);
    }
  });

  // Also associate core applications by matching vendor name
  catalogApplications.forEach(app => {
    const appVendorLower = app.vendor.toLowerCase();
    systemsByCompany.forEach((sysSet, companyKey) => {
      if (
        companyKey &&
        companyKey.length > 2 &&
        (appVendorLower.includes(companyKey) || companyKey.includes(appVendorLower))
      ) {
        sysSet.add(app.name);
      }
    });
  });

  return normalizedRows.map(row => {
    const companyKey = (row.companyName || row.displayName).toLowerCase().trim();
    const companySystems = systemsByCompany.get(companyKey)
      ? Array.from(systemsByCompany.get(companyKey))
      : [row.systemName];

    // Ensure the row's own systemName is always first in its supported systems list
    const orderedSystems = [
      row.systemName,
      ...companySystems.filter(s => s && s.toLowerCase() !== row.systemName.toLowerCase())
    ].filter(Boolean);

    const is24x7 =
      row.escalation.toLowerCase().includes("24x7") ||
      row.escalation.toLowerCase().includes("24/7") ||
      row.phone.toLowerCase().includes("24x7") ||
      row.phone.toLowerCase().includes("24/7");

    const hasContact = Boolean(row.phone || row.email || row.vendorPoc || row.aagItsPoc);
    const status = is24x7 ? "24x7 Active" : hasContact ? "Active" : "Directory Listed";

    const primaryContactName = row.vendorPoc || row.aagItsPoc || "";
    const primaryContactRole = row.vendorPoc
      ? "Vendor POC"
      : row.aagItsPoc
      ? "Alaska ITS POC"
      : "";

    return {
      resourceType: "vendor",
      favoriteId: `vendor:${row.id}`,
      id: row.id,
      key: row.id,
      sourceRow: row.sourceRow,
      name: row.companyName || row.displayName,
      companyName: row.companyName || "Internal / Unassigned Vendor",
      systemName: row.systemName,
      supportedSystems: orderedSystems,
      supportedSystemsText: orderedSystems.join(", "),
      category: row.category,
      status,
      severity: is24x7 ? "Critical" : "Standard",
      isCritical: false,
      isOperational: true,
      is24x7,
      primaryContactName,
      primaryContactRole,
      vendorPoc: row.vendorPoc,
      aagPOC: row.aagItsPoc,
      aagTeam: row.aagItsTeam,
      phone: row.phone,
      email: row.email,
      escalation: row.escalation,
      portalUrl: row.portalUrl,
      monogram: buildMonogram(row.companyName || row.systemName),
      detailsUrl: `vendors.html?vendor=${encodeURIComponent(row.id)}`
    };
  });
}

/**
 * Resolves saved application favorite keys and vendor favorite IDs from localStorage
 * without allowing collisions (e.g. "jcte" application vs "jcte" vendor row).
 */
export function getSavedFavoriteIds(catalogApplications = [], catalogVendors = []) {
  const apps = catalogApplications.length ? catalogApplications : getAllCatalogApplications();
  const vendors = catalogVendors.length ? catalogVendors : getAllCatalogVendors(apps);

  const appByKey = new Map();
  const appByName = new Map();
  apps.forEach(app => {
    appByKey.set(app.key.toLowerCase(), app.key);
    appByKey.set(String(app.id).toLowerCase(), app.key);
    appByName.set(app.name.toLowerCase(), app.key);
  });

  const vendorById = new Map();
  const vendorByRow = new Map();
  const vendorByName = new Map();
  vendors.forEach(vendor => {
    vendorById.set(String(vendor.id).toLowerCase(), vendor.id);
    vendorByRow.set(String(vendor.sourceRow), vendor.id);
    if (vendor.name) {
      const lowerName = vendor.name.toLowerCase();
      if (!vendorByName.has(lowerName)) {
        vendorByName.set(lowerName, vendor.id);
      }
    }
    if (vendor.systemName) {
      const lowerSys = vendor.systemName.toLowerCase();
      if (!vendorByName.has(lowerSys)) {
        vendorByName.set(lowerSys, vendor.id);
      }
    }
  });

  const appFavorites = new Set();
  const vendorFavorites = new Set();

  const resolveAppToken = token => {
    const clean = String(token || "").trim();
    if (!clean) return null;
    const lower = clean.toLowerCase();
    if (lower.startsWith("vendor:")) return null;
    const stripped = lower.startsWith("app:") ? lower.slice(4).trim() : lower;
    if (appByKey.has(stripped)) return appByKey.get(stripped);
    if (appByName.has(stripped)) return appByName.get(stripped);
    return null;
  };

  const resolveVendorToken = token => {
    const clean = String(token || "").trim();
    if (!clean) return null;
    const lower = clean.toLowerCase();
    if (lower.startsWith("app:")) return null;
    const stripped = lower.startsWith("vendor:") ? lower.slice(7).trim() : lower;
    if (vendorById.has(stripped)) return vendorById.get(stripped);
    if (vendorByRow.has(stripped)) return vendorByRow.get(stripped);
    if (vendorByName.has(stripped)) return vendorByName.get(stripped);
    return null;
  };

  // 1. Dedicated application favorite storage keys
  const dedicatedAppTokens = [
    ...safeReadStorageArray(FAVORITES_STORAGE_KEYS.APP_FAVORITES),
    ...safeReadStorageArray(FAVORITES_STORAGE_KEYS.LEGACY_APP_FAVORITES)
  ];
  dedicatedAppTokens.forEach(token => {
    const resolved = resolveAppToken(token);
    if (resolved) appFavorites.add(resolved);
  });

  // 2. Dedicated vendor favorite storage key
  const dedicatedVendorTokens = safeReadStorageArray(FAVORITES_STORAGE_KEYS.VENDOR_FAVORITES);
  dedicatedVendorTokens.forEach(token => {
    const resolved = resolveVendorToken(token);
    if (resolved) vendorFavorites.add(resolved);
  });

  // 3. Combined storage keys ("productionOperationsFavorites" and "favorites")
  const combinedTokens = [
    ...safeReadStorageArray(FAVORITES_STORAGE_KEYS.COMBINED_FAVORITES),
    ...safeReadStorageArray(FAVORITES_STORAGE_KEYS.SHORT_FAVORITES)
  ];

  combinedTokens.forEach(token => {
    const lower = String(token || "").trim().toLowerCase();
    if (!lower) return;

    if (lower.startsWith("app:")) {
      const resolvedApp = resolveAppToken(lower);
      if (resolvedApp) appFavorites.add(resolvedApp);
      return;
    }

    if (lower.startsWith("vendor:")) {
      const resolvedVendor = resolveVendorToken(lower);
      if (resolvedVendor) vendorFavorites.add(resolvedVendor);
      return;
    }

    // Legacy untyped token: check if it's already in dedicated vendor favorites or dedicated app favorites
    const matchedApp = resolveAppToken(lower);
    const matchedVendor = resolveVendorToken(lower);

    if (matchedApp && matchedVendor) {
      // Ambiguous legacy ID (e.g. "jcte"): honor whichever dedicated list has it, or default to app if neither
      if (vendorFavorites.has(matchedVendor) && !appFavorites.has(matchedApp)) {
        vendorFavorites.add(matchedVendor);
      } else {
        appFavorites.add(matchedApp);
      }
    } else if (matchedApp) {
      appFavorites.add(matchedApp);
    } else if (matchedVendor) {
      vendorFavorites.add(matchedVendor);
    }
  });

  return {
    appKeys: Array.from(appFavorites),
    vendorIds: Array.from(vendorFavorites)
  };
}

/**
 * Persists the canonical application and vendor favorite sets to localStorage
 * so Ground Stops, Vendor Directory, and My Favorites stay 100% synchronized.
 */
export function persistFavoriteSets(appKeys = [], vendorIds = []) {
  if (typeof localStorage === "undefined") return;

  const cleanApps = Array.from(new Set(appKeys.map(k => String(k).trim()).filter(Boolean)));
  const cleanVendors = Array.from(new Set(vendorIds.map(v => String(v).trim()).filter(Boolean)));

  const combinedTyped = [
    ...cleanApps.map(k => `app:${k}`),
    ...cleanVendors.map(v => `vendor:${v}`)
  ];

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEYS.APP_FAVORITES, JSON.stringify(cleanApps));
    localStorage.setItem(FAVORITES_STORAGE_KEYS.LEGACY_APP_FAVORITES, JSON.stringify(cleanApps));
    localStorage.setItem(FAVORITES_STORAGE_KEYS.VENDOR_FAVORITES, JSON.stringify(cleanVendors));
    localStorage.setItem(FAVORITES_STORAGE_KEYS.COMBINED_FAVORITES, JSON.stringify(combinedTyped));
    localStorage.setItem(FAVORITES_STORAGE_KEYS.SHORT_FAVORITES, JSON.stringify(combinedTyped));
  } catch {
    // Ignore storage quota errors
  }

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("poc:favorites-updated", {
          detail: { appKeys: cleanApps, vendorIds: cleanVendors }
        })
      );
    } catch {
      // Ignore event error
    }
  }
}

/**
 * Toggles an application or vendor favorite and persists immediately.
 */
export function toggleFavoriteItem(resourceType, idOrKey) {
  const apps = getAllCatalogApplications();
  const vendors = getAllCatalogVendors(apps);
  const { appKeys, vendorIds } = getSavedFavoriteIds(apps, vendors);

  const appSet = new Set(appKeys);
  const vendorSet = new Set(vendorIds);
  const target = String(idOrKey || "").trim();

  if (resourceType === "application") {
    if (appSet.has(target)) {
      appSet.delete(target);
    } else {
      appSet.add(target);
    }
  } else if (resourceType === "vendor") {
    if (vendorSet.has(target)) {
      vendorSet.delete(target);
    } else {
      vendorSet.add(target);
    }
  }

  const nextApps = Array.from(appSet);
  const nextVendors = Array.from(vendorSet);
  persistFavoriteSets(nextApps, nextVendors);

  return {
    appKeys: nextApps,
    vendorIds: nextVendors
  };
}

/**
 * Removes a specific item from favorites immediately.
 */
export function removeFavoriteItem(resourceType, idOrKey) {
  const apps = getAllCatalogApplications();
  const vendors = getAllCatalogVendors(apps);
  const { appKeys, vendorIds } = getSavedFavoriteIds(apps, vendors);

  const target = String(idOrKey || "").trim();
  const nextApps =
    resourceType === "application" ? appKeys.filter(k => k !== target) : appKeys;
  const nextVendors =
    resourceType === "vendor" ? vendorIds.filter(v => v !== target) : vendorIds;

  persistFavoriteSets(nextApps, nextVendors);

  return {
    appKeys: nextApps,
    vendorIds: nextVendors
  };
}

/**
 * Computes the complete Favorites Dashboard snapshot from live data + localStorage.
 */
export function getFavoritesSnapshot() {
  const catalogApplications = getAllCatalogApplications();
  const catalogVendors = getAllCatalogVendors(catalogApplications);
  const { appKeys, vendorIds } = getSavedFavoriteIds(catalogApplications, catalogVendors);

  const appKeySet = new Set(appKeys);
  const vendorIdSet = new Set(vendorIds);

  const favoriteApplications = catalogApplications.filter(app => appKeySet.has(app.key));
  const favoriteVendors = catalogVendors.filter(vendor => vendorIdSet.has(vendor.id));
  const allFavorites = [...favoriteApplications, ...favoriteVendors];

  const favoriteSystemsCount = favoriteApplications.length;
  const favoriteVendorsCount = favoriteVendors.length;
  const criticalSystemsCount = favoriteApplications.filter(app => app.severity === "Critical").length;
  const totalFavoritesCount = allFavorites.length;

  return {
    catalogApplications,
    catalogVendors,
    favoriteApplications,
    favoriteVendors,
    allFavorites,
    counts: {
      favoriteSystemsCount,
      favoriteVendorsCount,
      criticalSystemsCount,
      totalFavoritesCount
    }
  };
}

