import * as React from 'react';
/**
 * Vendor Maintenance Data Model, Validation, Sanitization & Rule-Based Extraction Engine
 * Shared across React frontend, Admin Control Center, Node.js API server, and automated test suite.
 */

export const UPDATE_TYPES = [
  "Scheduled Maintenance",
  "Service Outage",
  "Application Update",
  "Security Advisory",
  "Performance Degradation",
  "General Announcement",
  "Unknown / Requires Classification"
];

export const MAINTENANCE_STATUSES = [
  "New",
  "Scheduled",
  "In Progress",
  "Investigating",
  "Completed",
  "Cancelled",
  "Requires Review"
];

export const STATUS_BADGE_CONFIG = {
  "New": {
    tone: "blue",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
    dot: "#2563EB",
    label: "New"
  },
  "Scheduled": {
    tone: "purple",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    text: "#6D28D9",
    dot: "#7C3AED",
    label: "Scheduled"
  },
  "In Progress": {
    tone: "amber",
    bg: "#FFFBEB",
    border: "#FDE68A",
    text: "#B45309",
    dot: "#D97706",
    label: "In Progress"
  },
  "Investigating": {
    tone: "orange",
    bg: "#FFF7ED",
    border: "#FED7AA",
    text: "#C2410C",
    dot: "#EA580C",
    label: "Investigating"
  },
  "Completed": {
    tone: "green",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    text: "#15803D",
    dot: "#16A34A",
    label: "Completed"
  },
  "Cancelled": {
    tone: "gray",
    bg: "#F8FAFC",
    border: "#CBD5E1",
    text: "#475569",
    dot: "#64748B",
    label: "Cancelled"
  },
  "Requires Review": {
    tone: "red",
    bg: "#FEF2F2",
    border: "#FECACA",
    text: "#B91C1C",
    dot: "#DC2626",
    label: "Requires Review"
  }
};

export const INTEGRATION_STATES = {
  LOADING: "loading",
  NO_DATA: "no_data",
  NOT_CONFIGURED: "not_configured",
  UNAVAILABLE: "unavailable",
  TEMPORARILY_UNAVAILABLE: "unavailable",
  SYNCED: "synced"
};

export const ALLOWED_OUTLOOK_HOSTS = [
  "outlook.office.com",
  "outlook.office365.com",
  "outlook.live.com",
  "outlook.cloud.microsoft"
];

export const PERMITTED_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".csv",
  ".xlsx",
  ".ics",
  ".png",
  ".jpg",
  ".jpeg"
];

export const BLOCKED_ATTACHMENT_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".ps1",
  ".vbs",
  ".js",
  ".msi",
  ".scr",
  ".dll",
  ".com",
  ".jar",
  ".hta",
  ".reg",
  ".sh"
];

export const MAX_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export const DEFAULT_ADMIN_SETTINGS = {
  automaticProcessingEnabled: true,
  outlookFolder: "Vendor Maintenance",
  sourceMailbox: "",
  mailboxType: "shared",
  sharePointSiteUrl: "",
  sharePointListName: "VendorMaintenanceUpdates",
  storageProvider: "local-json",
  defaultTimeZone: "America/Los_Angeles (PDT/PST)",
  showProcessingFailures: true,
  lastSuccessfulIngestionAt: null,
  approvedVendorSenders: [
    "support@smart4aviation.aero",
    "support@smart4aviation.com",
    "aircom.support@sitaonair.aero",
    "acars.support@sita.aero",
    "opssupport@jeppesen.com",
    "jetplan.support@jeppesen.com",
    "pilotbriefing@jeppesen.com",
    "fieldandfacilities@weather.com",
    "metops@weather.com",
    "fusion@weather.com",
    "wam.support@trax.aero",
    "support@airbus.com",
    "aims.support@airbus.com",
    "support@aireon.com",
    "support@ames.aero",
    "support@dynamicsource.se",
    "rwydata@aerodata.aero",
    "servicedesk@accelya.com"
  ],
  approvedVendorDomains: [
    "smart4aviation.aero",
    "smart4aviation.com",
    "sita.aero",
    "sitaonair.aero",
    "jeppesen.com",
    "boeing.com",
    "weather.com",
    "trax.aero",
    "airbus.com",
    "aireon.com",
    "ames.aero",
    "dynamicsource.se",
    "aerodata.aero",
    "accelya.com",
    "five9.com",
    "alvaria.com",
    "brocksolutions.com"
  ],
  applicationAliases: {
    "s4a": "Smart4Aviation (S4A)",
    "smart4aviation": "Smart4Aviation (S4A)",
    "smartsuite s4a": "Smart4Aviation (S4A)",
    "weight and balance": "Smart4Aviation (S4A)",
    "acars": "ACARS",
    "aircom": "ACARS",
    "sita aircom": "ACARS",
    "wam": "WAM",
    "wsifusion": "Weather / WSIFusion",
    "wsi fusion": "Weather / WSIFusion",
    "flightfx": "Weather / WSIFusion",
    "the weather company": "Weather / WSIFusion",
    "jetplan": "JetPlan",
    "jcte": "JCTE",
    "airtrack": "AirTrack",
    "aireon airtrack": "AirTrack",
    "pilot briefing": "Pilot Briefing",
    "aircraft maintenance": "Aircraft Maintenance",
    "ames maintenance": "Aircraft Maintenance",
    "aims": "AIMS",
    "aerodata": "AeroData",
    "dynamic source": "Aircraft performance data",
    "brock smartsuite": "Brock SmartSuite",
    "accelya": "Accelya",
    "revera": "Accelya",
    "five9": "Intelligent Cloud Contact Center",
    "alvaria": "Alvaria",
    "aspect wfm": "Alvaria"
  },
  classificationRules: [
    {
      updateType: "Service Outage",
      keywords: ["outage", "unplanned downtime", "service disruption", "system down", "major incident", "unavailable"]
    },
    {
      updateType: "Performance Degradation",
      keywords: ["degradation", "slow response", "intermittent", "elevated latency", "packet loss", "degraded"]
    },
    {
      updateType: "Security Advisory",
      keywords: ["security advisory", "cve-", "vulnerability", "security patch", "hotfix security", "certificate renewal"]
    },
    {
      updateType: "Scheduled Maintenance",
      keywords: ["scheduled maintenance", "maintenance window", "planned maintenance", "planned outage", "preventive maintenance"]
    },
    {
      updateType: "Application Update",
      keywords: ["release notes", "version upgrade", "application update", "deployment", "software release", "patch deployment"]
    },
    {
      updateType: "General Announcement",
      keywords: ["general announcement", "informational", "contact update", "portal change", "advisory notice"]
    }
  ]
};

/**
 * Validate an Outlook Web Link.
 * Rejects non-HTTPS URLs, untrusted hosts, javascript: URIs, or malformed strings.
 */
export function validateOutlookWebLink(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    const isAllowed = ALLOWED_OUTLOOK_HOSTS.some(
      allowed => host === allowed || host.endsWith("." + allowed)
    );
    if (!isAllowed) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize incoming email HTML safely without executing scripts, forms, or active content.
 * Preserves tables, paragraphs, lists, and formatting needed for operational reference.
 */
export function sanitizeEmailHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") return "";
  let clean = rawHtml;

  // Remove dangerous blocks completely along with their inner content
  clean = clean.replace(/<\s*(script|style|iframe|object|embed|applet|form|frame|frameset|noscript|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");

  // Remove self-closing or unclosed dangerous tags
  clean = clean.replace(/<\s*\/?\s*(script|style|iframe|object|embed|applet|form|input|button|select|textarea|meta|link|base|frame|frameset)[^>]*>/gi, "");

  // Remove inline event handlers (onclick, onerror, onload, etc.)
  clean = clean.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Neutralize javascript:, vbscript:, and data: URLs in href/src/action/xlink:href
  clean = clean.replace(/(href|src|action|formaction|background|poster)\s*=\s*(?:"\s*(?:javascript|vbscript|data):[^"]*"|'\s*(?:javascript|vbscript|data):[^']*'|(?:\s*(?:javascript|vbscript|data):[^\s>]+))/gi, '$1="#"');

  // Remove dangerous CSS expressions in style attributes
  clean = clean.replace(/style\s*=\s*"([^"]*)"/gi, (match, css) => {
    if (/expression\s*\(|javascript\s*:|vbscript\s*:|url\s*\(\s*['"]?\s*javascript:/i.test(css)) {
      return "";
    }
    return `style="${css}"`;
  });

  return clean.trim();
}

/**
 * Normalize and validate attachment metadata without executing or opening files.
 */
export function normalizeAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .filter(item => item && typeof item === "object")
    .map((item, idx) => {
      const fileName = String(item.fileName || item.name || `attachment-${idx + 1}`).trim();
      const size = Number(item.size || item.sizeBytes || 0);
      const contentType = String(item.contentType || item.mimeType || "application/octet-stream").trim().toLowerCase();
      const lowerName = fileName.toLowerCase();
      const extMatch = lowerName.match(/\.[a-z0-9]+$/);
      const extension = extMatch ? extMatch[0] : "";

      const isBlockedExtension = BLOCKED_ATTACHMENT_EXTENSIONS.includes(extension);
      const isPermittedExtension = PERMITTED_ATTACHMENT_EXTENSIONS.includes(extension);
      const isOversized = size > MAX_ATTACHMENT_SIZE_BYTES;
      const isMimeMismatch =
        (extension === ".pdf" && contentType && !contentType.includes("pdf") && contentType !== "application/octet-stream") ||
        contentType.includes("x-msdownload") ||
        contentType.includes("x-executable") ||
        contentType.includes("javascript");

      const warnings = [];
      if (isBlockedExtension) warnings.push("Blocked executable/script extension");
      if (isMimeMismatch) warnings.push("Content-Type does not match file extension");
      if (isOversized) warnings.push("Exceeds 15 MB size limit");
      if (!isPermittedExtension && !isBlockedExtension) warnings.push("Unverified file extension");

      return {
        id: item.id || `att-${idx + 1}`,
        fileName,
        extension: extension || "unknown",
        size: Number.isFinite(size) && size >= 0 ? size : 0,
        contentType,
        isSafeMetadataOnly: !isBlockedExtension && !isMimeMismatch && !isOversized,
        isBlocked: isBlockedExtension || isMimeMismatch,
        warnings
      };
    });
}

/**
 * Extract email address and domain from a raw sender string like "S4A Support <support@smart4aviation.aero>"
 */
export function parseEmailAddress(rawSender) {
  if (!rawSender || typeof rawSender !== "string") {
    return { email: "", displayName: "", domain: "" };
  }
  const trimmed = rawSender.trim();
  const angleMatch = trimmed.match(/^(.*?)\s*<\s*([A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,}))\s*>$/i);
  if (angleMatch) {
    return {
      displayName: angleMatch[1].replace(/^["']|["']$/g, "").trim(),
      email: angleMatch[2].toLowerCase(),
      domain: angleMatch[3].toLowerCase()
    };
  }
  const simpleMatch = trimmed.match(/([A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,}))/i);
  if (simpleMatch) {
    return {
      displayName: trimmed.replace(simpleMatch[0], "").replace(/[<>()"']/g, "").trim(),
      email: simpleMatch[1].toLowerCase(),
      domain: simpleMatch[2].toLowerCase()
    };
  }
  return { email: "", displayName: trimmed, domain: "" };
}

/**
 * Match sender against approved vendor senders, domains, and existing Vendor Directory records.
 */
export function matchVendorFromDirectory(senderInfo, subject, bodyText, catalogVendors = [], settings = DEFAULT_ADMIN_SETTINGS) {
  const { email, domain, displayName } = senderInfo;
  const approvedSenders = (settings.approvedVendorSenders || []).map(s => s.toLowerCase().trim());
  const approvedDomains = (settings.approvedVendorDomains || []).map(d => d.toLowerCase().trim());

  const isSenderApproved =
    (email && approvedSenders.includes(email)) ||
    (domain && approvedDomains.some(d => domain === d || domain.endsWith("." + d)));

  if (!isSenderApproved) {
    return {
      matched: false,
      isApprovedSender: false,
      vendorId: null,
      vendorName: "Unknown",
      matchedVendorRecord: null,
      confidence: "unverified",
      reviewReason: email
        ? `Sender (${email}) is not in the approved vendor senders or domains list.`
        : "Sender email address is missing or invalid."
    };
  }

  const vendorList = Array.isArray(catalogVendors)
    ? catalogVendors
    : Object.values(catalogVendors || {});

  // Search catalogVendors by exact email or domain or vendor company name
  let matchedRecord = null;
  for (const v of vendorList) {
    const rawEmails = String(v.email || v.emailAddress || v.poc || "").toLowerCase();
    if (email && rawEmails.includes(email)) {
      matchedRecord = v;
      break;
    }
    if (domain && rawEmails.includes("@" + domain)) {
      matchedRecord = v;
      break;
    }
  }

  // Domain-to-vendor fallback for known approved domains
  const domainVendorFallback = {
    "smart4aviation.aero": "Smart4Aviation",
    "smart4aviation.com": "Smart4Aviation",
    "sita.aero": "SITA",
    "sitaonair.aero": "SITA",
    "jeppesen.com": "Jeppesen",
    "boeing.com": "Jeppesen (Boeing)",
    "weather.com": "TWC / The Weather Company",
    "trax.aero": "TRAX (Aviation Solutions)",
    "airbus.com": "Airbus",
    "aireon.com": "Aireon",
    "ames.aero": "AMES (Aviation M&E)",
    "dynamicsource.se": "Dynamic Source",
    "aerodata.aero": "AeroData",
    "accelya.com": "Accelya",
    "five9.com": "Five9",
    "alvaria.com": "Alvaria",
    "brocksolutions.com": "Brock Solutions"
  };

  const fallbackCompany = domainVendorFallback[domain] || "";

  if (!matchedRecord && fallbackCompany) {
    matchedRecord = vendorList.find(v => {
      const comp = String(v.company || v.vendor || v.vendorCompanyName || v.displayName || "").toLowerCase();
      return comp.includes(fallbackCompany.toLowerCase().split(" ")[0]);
    }) || null;
  }

  const vendorName = matchedRecord
    ? (matchedRecord.company || matchedRecord.vendor || matchedRecord.vendorCompanyName || matchedRecord.displayName || fallbackCompany)
    : (fallbackCompany || displayName || "Approved Vendor");

  const vendorId = matchedRecord
    ? (matchedRecord.id || `its-application-vendors-${matchedRecord.sourceRow || 1}`)
    : (fallbackCompany ? fallbackCompany.toLowerCase().replace(/[^a-z0-9]+/g, "-") : null);

  return {
    matched: Boolean(vendorId),
    isApprovedSender: true,
    vendorId,
    vendorName,
    matchedVendorRecord: matchedRecord,
    confidence: matchedRecord ? "high" : "medium",
    reviewReason: null
  };
}

/**
 * Match application(s) from subject and body using configured aliases and existing catalog applications.
 */
export function matchApplicationsFromText(subject, bodyText, vendorMatch, catalogApplications = [], settings = DEFAULT_ADMIN_SETTINGS) {
  const combined = `${subject || ""}\n${bodyText || ""}`;
  const lowerText = combined.toLowerCase();
  const aliases = settings.applicationAliases || DEFAULT_ADMIN_SETTINGS.applicationAliases;

  const matchedApps = new Set();

  // Check explicit configured aliases using word-boundary-aware matching
  Object.entries(aliases).forEach(([alias, canonicalName]) => {
    const escaped = alias.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    if (regex.test(lowerText)) {
      matchedApps.add(canonicalName);
    }
  });

  // Check catalog application names
  const appList = Array.isArray(catalogApplications)
    ? catalogApplications
    : Object.values(catalogApplications || {});
  appList.forEach(app => {
    const name = String(app.name || app.systemName || "").trim();
    if (!name || name.length < 3) return;
    const escaped = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    if (regex.test(lowerText)) {
      matchedApps.add(name);
    }
  });

  const list = Array.from(matchedApps);

  if (list.length === 1) {
    return {
      applicationName: list[0],
      allMatchedApplications: list,
      ambiguous: false,
      confidence: "high",
      reviewReason: null
    };
  }

  if (list.length > 1) {
    return {
      applicationName: list.join(", "),
      allMatchedApplications: list,
      ambiguous: true,
      confidence: "ambiguous",
      reviewReason: `Multiple applications matched in message (${list.join(", ")}); verify affected system.`
    };
  }

  // Do not guess an application from weak matches if none matched explicitly
  return {
    applicationName: "Unknown",
    allMatchedApplications: [],
    ambiguous: true,
    confidence: "low",
    reviewReason: "Application name could not be determined reliably from the email content."
  };
}

/**
 * Extract maintenance start, maintenance end, and explicit time zone from email content.
 * Does not silently assume UTC when timezone is missing or ambiguous.
 */
export function extractMaintenanceDates(subject, bodyText) {
  const text = `${subject || ""}\n${bodyText || ""}`;

  // Detect explicit timezone token
  const tzMatch = text.match(/\b(UTC|GMT|PDT|PST|EDT|EST|CDT|CST|MDT|MST|AKDT|AKST|HST|CET|CEST|[+-]\d{2}:?\d{2})\b/i);
  const explicitTimeZone = tzMatch ? tzMatch[1].toUpperCase() : null;

  // Pattern 1: Explicit ISO-8601 range or start/end timestamps
  // e.g. Start: 2026-11-05 02:00 UTC ... End: 2026-11-05 06:00 UTC
  const startLabelMatch = text.match(/(?:maintenance\s+start|start\s*(?:time|date)?|from|begins?)\s*[:\-]\s*(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?(?:\s*(?:UTC|GMT|PDT|PST|EDT|EST|CDT|CST|MDT|MST|Z|[+-]\d{2}:?\d{2}))?)/i);
  const endLabelMatch = text.match(/(?:maintenance\s+end|end\s*(?:time|date)?|until|to|completes?)\s*[:\-]\s*(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?(?:\s*(?:UTC|GMT|PDT|PST|EDT|EST|CDT|CST|MDT|MST|Z|[+-]\d{2}:?\d{2}))?)/i);

  const tzOffsets = {
    UTC: "Z",
    GMT: "Z",
    PDT: "-07:00",
    PST: "-08:00",
    EDT: "-04:00",
    EST: "-05:00",
    CDT: "-05:00",
    CST: "-06:00",
    MDT: "-06:00",
    MST: "-07:00",
    AKDT: "-08:00",
    AKST: "-09:00",
    CET: "+01:00",
    CEST: "+02:00"
  };

  function parseExplicitTimestamp(rawStr, fallbackTz) {
    if (!rawStr) return { iso: null, ambiguous: false, raw: "" };
    const cleaned = rawStr.trim();
    const localMatch = cleaned.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2})?)(?:\s*([A-Z]{2,4}|[+-]\d{2}:?\d{2}))?$/i);
    if (!localMatch) return { iso: null, ambiguous: true, raw: cleaned };

    const datePart = localMatch[1];
    const timePart = localMatch[2].length === 5 ? `${localMatch[2]}:00` : localMatch[2];
    const tzToken = (localMatch[3] || fallbackTz || "").toUpperCase();

    if (!tzToken) {
      // Missing time zone — preserve local representation without silently converting to UTC
      return {
        iso: `${datePart}T${timePart}`,
        ambiguous: true,
        raw: cleaned,
        missingTimeZone: true
      };
    }

    const offset = tzOffsets[tzToken] || (/^[+-]\d{2}:?\d{2}$/.test(tzToken) ? tzToken : null);
    if (!offset) {
      return {
        iso: `${datePart}T${timePart}`,
        ambiguous: true,
        raw: cleaned
      };
    }

    const d = new Date(`${datePart}T${timePart}${offset}`);
    if (Number.isNaN(d.getTime())) {
      return { iso: null, ambiguous: true, raw: cleaned };
    }
    return { iso: d.toISOString(), ambiguous: false, raw: cleaned, timeZone: tzToken };
  }

  // Check for ambiguous slash dates like 05/06/2026 (could be May 6 or June 5)
  const slashDateMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  const hasAmbiguousSlashDate = Boolean(
    slashDateMatch &&
    Number(slashDateMatch[1]) <= 12 &&
    Number(slashDateMatch[2]) <= 12 &&
    Number(slashDateMatch[1]) !== Number(slashDateMatch[2])
  );

  if (startLabelMatch || endLabelMatch) {
    const startParsed = parseExplicitTimestamp(startLabelMatch ? startLabelMatch[1] : null, explicitTimeZone);
    const endParsed = parseExplicitTimestamp(endLabelMatch ? endLabelMatch[1] : null, explicitTimeZone);
    const ambiguous = startParsed.ambiguous || endParsed.ambiguous || !startParsed.iso;
    return {
      maintenanceStart: startParsed.iso || null,
      maintenanceEnd: endParsed.iso || null,
      timeZone: explicitTimeZone || "Not provided",
      ambiguous,
      reviewReason: ambiguous
        ? (startParsed.missingTimeZone
            ? "Maintenance timestamp is missing an explicit time zone."
            : "Maintenance start/end date is incomplete or ambiguous.")
        : null
    };
  }

  // Pattern 2: Same-day window e.g. "2026-11-05 from 02:00 to 05:30 UTC"
  const sameDayWindow = text.match(/\b(\d{4}-\d{2}-\d{2})\s+(?:from|between)\s+(\d{2}:\d{2})\s+(?:to|and|-)\s+(\d{2}:\d{2})(?:\s*(UTC|GMT|PDT|PST|EDT|EST|CDT|CST|MDT|MST))?/i);
  if (sameDayWindow) {
    const datePart = sameDayWindow[1];
    const startTime = sameDayWindow[2];
    const endTime = sameDayWindow[3];
    const tz = (sameDayWindow[4] || explicitTimeZone || "").toUpperCase();
    const startParsed = parseExplicitTimestamp(`${datePart} ${startTime} ${tz}`.trim(), tz);
    const endParsed = parseExplicitTimestamp(`${datePart} ${endTime} ${tz}`.trim(), tz);
    const ambiguous = startParsed.ambiguous || endParsed.ambiguous;
    return {
      maintenanceStart: startParsed.iso,
      maintenanceEnd: endParsed.iso,
      timeZone: tz || "Not provided",
      ambiguous,
      reviewReason: ambiguous ? "Time zone not specified for maintenance window." : null
    };
  }

  if (hasAmbiguousSlashDate) {
    return {
      maintenanceStart: null,
      maintenanceEnd: null,
      timeZone: explicitTimeZone || "Not provided",
      ambiguous: true,
      reviewReason: `Ambiguous date format detected ("${slashDateMatch[0]}"). Preserved original text for operator review.`
    };
  }

  return {
    maintenanceStart: null,
    maintenanceEnd: null,
    timeZone: explicitTimeZone || "Not provided",
    ambiguous: false,
    reviewReason: null
  };
}

/**
 * Classify updateType, status, severity, and action intent (new, update, cancellation, completion).
 * Never marks an incident/maintenance as Completed merely because an email arrived unless explicitly confirmed.
 */
export function classifyMaintenanceEmail(subject, bodyText, settings = DEFAULT_ADMIN_SETTINGS) {
  const combined = `${subject || ""}\n${bodyText || ""}`;
  const lower = combined.toLowerCase();

  const isCancellation = /\b(cancel(?:led|ed|lation)|postponed indefinitely|maintenance window cancelled|abort(?:ed)?)\b/i.test(lower);
  const isExplicitCompletion = /\b(maintenance\s+(?:is\s+|has\s+been\s+)?completed|has\s+been\s+completed|work\s+has\s+concluded|all\s+services\s+(?:are\s+|have\s+been\s+)?restored|services\s+(?:are\s+|have\s+been\s+)?restored|all\s+systems\s+operational|incident\s+(?:is\s+|has\s+been\s+)?resolved|restoration\s+complete|window\s+closed\s+successfully)\b/i.test(lower);
  const isInProgress = /\b(maintenance\s+in\s+progress|currently\s+underway|work\s+has\s+begun|now\s+in\s+progress)\b/i.test(lower);
  const isInvestigating = /\b(investigating|root\s+cause\s+analysis\s+in\s+progress|currently\s+investigating|engineers\s+are\s+investigating)\b/i.test(lower);
  const isFollowUp = /\b(re:|fw:|update\s*#?\d*|follow[\s-]?up|revised\s+schedule|rescheduled|correction)\b/i.test(lower);

  // Determine Update Type from rules
  const rules = settings.classificationRules || DEFAULT_ADMIN_SETTINGS.classificationRules;
  let matchedType = "Unknown / Requires Classification";
  for (const rule of rules) {
    if ((rule.keywords || []).some(kw => lower.includes(kw.toLowerCase()))) {
      matchedType = rule.updateType;
      break;
    }
  }

  // Extract explicit severity if stated
  let severity = "Unknown";
  if (/\b(sev(?:erity)?\s*1|critical|p1|high\s+priority|ground\s+stop\s+risk)\b/i.test(lower)) {
    severity = "Critical";
  } else if (/\b(sev(?:erity)?\s*2|high|major)\b/i.test(lower)) {
    severity = "High";
  } else if (/\b(sev(?:erity)?\s*3|medium|moderate)\b/i.test(lower)) {
    severity = "Medium";
  } else if (/\b(sev(?:erity)?\s*4|low|minor|informational)\b/i.test(lower)) {
    severity = "Low";
  }

  // Determine initial status conservatively
  let status = "New";
  if (isCancellation) {
    status = "Cancelled";
  } else if (isExplicitCompletion) {
    status = "Completed";
  } else if (isInvestigating) {
    status = "Investigating";
  } else if (isInProgress) {
    status = "In Progress";
  } else if (matchedType === "Scheduled Maintenance" || matchedType === "Application Update") {
    status = "Scheduled";
  } else if (matchedType === "Unknown / Requires Classification") {
    status = "Requires Review";
  }

  // Extract operational impact
  let operationalImpact = "Not provided";
  const impactMatch = combined.match(/(?:operational\s+impact|expected\s+impact|impact|service\s+impact|downtime)\s*[:\-]\s*([^\n\r]+)/i);
  if (impactMatch && impactMatch[1].trim()) {
    operationalImpact = impactMatch[1].trim();
  }

  // Extract concise factual summary (clearly marked as automated extraction)
  const firstLines = (bodyText || "")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 20 && !/^(dear|hello|hi\s|regards|sincerely|unsubscribe)/i.test(l));
  const extractedSummary = firstLines.length
    ? firstLines.slice(0, 2).join(" ").slice(0, 320)
    : (subject ? `Notification subject: ${subject}` : "No summary could be extracted.");

  return {
    updateType: matchedType,
    status,
    severity,
    operationalImpact,
    extractedSummary,
    intent: isCancellation
      ? "cancellation"
      : isExplicitCompletion
        ? "completion"
        : isFollowUp
          ? "update"
          : "new"
  };
}

/**
 * Normalize subject for correlation of follow-up / cancellation emails
 */
export function normalizeSubjectForCorrelation(subject) {
  return String(subject || "")
    .replace(/^(?:\s*(?:re|fw|fwd|updated|cancelled|canceled|resolved|completed)\s*[:\-]\s*)+/gi, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Complete Email-to-VendorMaintenanceUpdate extraction pipeline.
 * Supports duplicate detection, correlation with earlier records, and review flagging.
 */
export function processIncomingVendorEmail(payload, catalog = {}, settings = DEFAULT_ADMIN_SETTINGS, existingRecords = []) {
  const nowIso = new Date().toISOString();

  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      errorCode: "INVALID_PAYLOAD",
      errorMessage: "Email ingestion payload must be a JSON object."
    };
  }

  const rawSender = String(payload.senderEmail || payload.from || "").trim();
  const senderDisplayName = String(payload.senderDisplayName || payload.fromName || "").trim();
  const emailSubject = String(payload.emailSubject || payload.subject || "").trim();
  const emailBodyText = String(payload.emailBodyText || payload.bodyPreview || payload.bodyText || "").trim();
  const emailBodyHtml = sanitizeEmailHtml(String(payload.emailBodyHtml || payload.bodyHtml || ""));
  const sourceMailbox = String(payload.sourceMailbox || settings.sourceMailbox || "Vendor Maintenance").trim();
  const outlookMessageId = String(payload.outlookMessageId || payload.messageId || "").trim();
  const outlookInternetMessageId = String(payload.outlookInternetMessageId || payload.internetMessageId || "").trim();
  const conversationId = String(payload.conversationId || "").trim();
  const inReplyTo = String(payload.inReplyTo || "").trim();

  if (!rawSender || (!emailSubject && !emailBodyText)) {
    return {
      ok: false,
      errorCode: "MISSING_REQUIRED_FIELDS",
      errorMessage: "Incoming email must include a senderEmail and either emailSubject or emailBodyText."
    };
  }

  const senderInfo = parseEmailAddress(rawSender);
  if (!senderInfo.email) {
    return {
      ok: false,
      errorCode: "INVALID_SENDER_EMAIL",
      errorMessage: `Sender email "${rawSender}" is not a valid email address.`
    };
  }

  // Validate receivedDate
  let receivedDate = nowIso;
  if (payload.receivedDate || payload.receivedDateTime) {
    const parsedReceived = new Date(payload.receivedDate || payload.receivedDateTime);
    if (Number.isNaN(parsedReceived.getTime())) {
      return {
        ok: false,
        errorCode: "INVALID_RECEIVED_DATE",
        errorMessage: "receivedDate is not a valid timestamp."
      };
    }
    receivedDate = parsedReceived.toISOString();
  }

  // Duplicate detection by (sourceMailbox + outlookInternetMessageId) or (sourceMailbox + outlookMessageId)
  const duplicateRecord = existingRecords.find(rec => {
    if (rec.isDemo) return false;
    const sameMailbox = (rec.sourceMailbox || "").toLowerCase() === sourceMailbox.toLowerCase();
    if (outlookInternetMessageId && rec.outlookInternetMessageId === outlookInternetMessageId && sameMailbox) {
      return true;
    }
    if (outlookMessageId && rec.outlookMessageId === outlookMessageId && sameMailbox) {
      return true;
    }
    return false;
  });

  if (duplicateRecord) {
    return {
      ok: true,
      duplicate: true,
      record: duplicateRecord,
      message: "Duplicate Outlook message detected; skipped creating a duplicate record."
    };
  }

  // Match vendor, application, dates, and classification
  const vendorMatch = matchVendorFromDirectory(
    senderInfo,
    emailSubject,
    emailBodyText,
    catalog.vendors || [],
    settings
  );

  const appMatch = matchApplicationsFromText(
    emailSubject,
    emailBodyText,
    vendorMatch,
    catalog.applications || [],
    settings
  );

  const dateMatch = extractMaintenanceDates(emailSubject, emailBodyText);
  const classification = classifyMaintenanceEmail(emailSubject, emailBodyText, settings);
  const validatedWebLink = validateOutlookWebLink(payload.originalEmailWebLink || payload.webLink);
  const attachments = normalizeAttachments(payload.attachments);

  // Collect review reasons
  const reviewReasons = [
    vendorMatch.reviewReason,
    appMatch.reviewReason,
    dateMatch.reviewReason
  ].filter(Boolean);

  if (attachments.some(a => a.isBlocked)) {
    reviewReasons.push("Email contains blocked or suspicious attachment metadata.");
  }

  const requiresReview =
    !vendorMatch.isApprovedSender ||
    dateMatch.ambiguous ||
    appMatch.ambiguous ||
    classification.updateType === "Unknown / Requires Classification";

  const finalStatus = requiresReview ? "Requires Review" : classification.status;
  const classificationConfidence = !vendorMatch.isApprovedSender
    ? "Unverified Sender"
    : requiresReview
      ? "Requires Operator Verification"
      : "High (Rule-Matched)";

  // Check if this email is a follow-up, correction, or cancellation for an existing maintenance record
  const normSubj = normalizeSubjectForCorrelation(emailSubject);
  let relatedRecord = null;
  if (vendorMatch.isApprovedSender && (classification.intent !== "new" || conversationId || inReplyTo)) {
    relatedRecord = existingRecords.find(rec => {
      if (rec.isDemo) return false;
      if (rec.vendorName !== vendorMatch.vendorName) return false;
      if (inReplyTo && rec.outlookInternetMessageId && rec.outlookInternetMessageId === inReplyTo) {
        return true;
      }
      if (
        conversationId &&
        rec.conversationId === conversationId &&
        normalizeSubjectForCorrelation(rec.emailSubject) === normSubj
      ) {
        return true;
      }
      return false;
    });
  }

  if (relatedRecord && (classification.intent === "cancellation" || classification.intent === "completion" || classification.intent === "update")) {
    const previousStatus = relatedRecord.status;
    const nextStatus = requiresReview ? "Requires Review" : classification.status;

    const updatedRecord = {
      ...relatedRecord,
      status: nextStatus,
      maintenanceStart: dateMatch.maintenanceStart || relatedRecord.maintenanceStart,
      maintenanceEnd: dateMatch.maintenanceEnd || relatedRecord.maintenanceEnd,
      operationalImpact:
        classification.operationalImpact !== "Not provided"
          ? classification.operationalImpact
          : relatedRecord.operationalImpact,
      updatedAt: nowIso,
      lastProcessedAt: nowIso,
      relatedMessageIds: Array.from(
        new Set([...(relatedRecord.relatedMessageIds || []), outlookInternetMessageId || outlookMessageId].filter(Boolean))
      ),
      followUpMessages: [
        ...(relatedRecord.followUpMessages || []),
        {
          receivedDate,
          senderEmail: senderInfo.email,
          emailSubject,
          emailBodyText,
          intent: classification.intent,
          outlookMessageId,
          outlookInternetMessageId
        }
      ],
      processingHistory: [
        {
          timestamp: nowIso,
          action: `Correlated ${classification.intent} email`,
          status: "Processed",
          details: `Follow-up message "${emailSubject}" updated status from ${previousStatus} to ${nextStatus}.`
        },
        ...(relatedRecord.processingHistory || [])
      ],
      auditTrail: [
        {
          timestamp: nowIso,
          actor: "Outlook Automation",
          change: `Status ${previousStatus} → ${nextStatus} (${classification.intent} notice received)`
        },
        ...(relatedRecord.auditTrail || [])
      ]
    };

    return {
      ok: true,
      duplicate: false,
      correlatedUpdate: true,
      record: updatedRecord
    };
  }

  const recordId = payload.id || `vm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const newRecord = {
    id: recordId,
    vendorId: vendorMatch.vendorId,
    vendorName: vendorMatch.vendorName,
    matchedVendorRecord: vendorMatch.matchedVendorRecord
      ? {
          id: vendorMatch.matchedVendorRecord.id,
          company: vendorMatch.matchedVendorRecord.company || vendorMatch.matchedVendorRecord.vendor,
          systemName: vendorMatch.matchedVendorRecord.systemName,
          phone: vendorMatch.matchedVendorRecord.phone,
          email: vendorMatch.matchedVendorRecord.email,
          aagItsTeam: vendorMatch.matchedVendorRecord.aagItsTeam,
          aagItsPoc: vendorMatch.matchedVendorRecord.aagItsPoc
        }
      : null,
    senderEmail: senderInfo.email,
    senderDisplayName: senderDisplayName || senderInfo.displayName || senderInfo.email,
    emailSubject: emailSubject || "(No Subject)",
    emailBodyText: emailBodyText || "Not provided",
    emailBodyHtml: emailBodyHtml || "",
    receivedDate,
    updateType: classification.updateType,
    applicationName: appMatch.applicationName,
    allMatchedApplications: appMatch.allMatchedApplications,
    maintenanceStart: dateMatch.maintenanceStart,
    maintenanceEnd: dateMatch.maintenanceEnd,
    timeZone: dateMatch.timeZone || "Not provided",
    status: finalStatus,
    severity: classification.severity,
    operationalImpact: classification.operationalImpact,
    extractedSummary: classification.extractedSummary,
    classificationConfidence,
    reviewReasons,
    originalEmailWebLink: validatedWebLink,
    outlookMessageId: outlookMessageId || null,
    outlookInternetMessageId: outlookInternetMessageId || null,
    conversationId: conversationId || null,
    sourceMailbox,
    source: payload.source || "Microsoft Outlook",
    attachments,
    processingStatus: requiresReview ? "Completed with Review Flag" : "Processed",
    processingError: null,
    isDemo: Boolean(payload.isDemo),
    createdAt: nowIso,
    updatedAt: nowIso,
    lastProcessedAt: nowIso,
    relatedMessageIds: [],
    followUpMessages: [],
    processingHistory: [
      {
        timestamp: nowIso,
        action: "Initial Email Ingestion & Rule Extraction",
        status: requiresReview ? "Completed with Review Flag" : "Processed",
        details: reviewReasons.length
          ? `Flagged for review: ${reviewReasons.join(" ")}`
          : `Matched vendor "${vendorMatch.vendorName}" and application "${appMatch.applicationName}".`
      }
    ],
    auditTrail: [
      {
        timestamp: nowIso,
        actor: "Outlook Automation",
        change: `Created maintenance record with status "${finalStatus}"`
      }
    ]
  };

  return {
    ok: true,
    duplicate: false,
    correlatedUpdate: false,
    record: newRecord
  };
}

/**
 * Calculate the 4 KPI summary cards from actual maintenance records.
 * Never hardcodes counts; returns 0 when records array is empty.
 */
export function calculateMaintenanceSummary(records = [], now = new Date()) {
  const validRecords = Array.isArray(records) ? records : [];
  const nowTime = now.getTime();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  let totalUpdates = validRecords.length;
  let upcomingMaintenance = 0;
  let activeIncidents = 0;
  let newNotifications = 0;
  let requiresReviewCount = 0;

  validRecords.forEach(record => {
    const status = record.status || "New";
    const updateType = record.updateType || "";

    // Upcoming Maintenance: Scheduled status OR future maintenanceStart
    const startMs = record.maintenanceStart ? new Date(record.maintenanceStart).getTime() : NaN;
    if (
      status === "Scheduled" ||
      (!Number.isNaN(startMs) && startMs > nowTime && status !== "Cancelled" && status !== "Completed")
    ) {
      upcomingMaintenance += 1;
    }

    // Active Incidents: In Progress or Investigating, or active Service Outage / Performance Degradation
    if (
      status === "In Progress" ||
      status === "Investigating" ||
      ((updateType === "Service Outage" || updateType === "Performance Degradation") &&
        status !== "Completed" &&
        status !== "Cancelled")
    ) {
      activeIncidents += 1;
    }

    // New Notifications: Status === "New" or received within last 48h and not Completed/Cancelled
    const recvMs = record.receivedDate ? new Date(record.receivedDate).getTime() : NaN;
    if (
      status === "New" ||
      status === "Requires Review" ||
      (!Number.isNaN(recvMs) && nowTime - recvMs <= fortyEightHoursMs && status === "New")
    ) {
      newNotifications += 1;
    }

    if (status === "Requires Review") {
      requiresReviewCount += 1;
    }
  });

  return {
    totalUpdates,
    upcomingMaintenance,
    activeIncidents,
    newNotifications,
    requiresReviewCount
  };
}

/**
 * Filter and sort VendorMaintenanceUpdate records according to all filter controls.
 */
export function filterAndSortMaintenanceRecords(records = [], filters = {}) {
  const {
    vendorQuery = "",
    vendorName = "",
    subjectQuery = "",
    emailSubject = "",
    applicationQuery = "",
    application = "",
    senderQuery = "",
    senderEmail = "",
    quickSearch = "",
    updateType = "",
    status = "",
    dateFrom = "",
    dateTo = "",
    sortBy = "receivedDate",
    sortDir = "",
    sortOrder = ""
  } = filters;

  const effectiveSortDir = (sortDir || sortOrder || "desc").toLowerCase();
  const vq = (vendorQuery || vendorName).trim().toLowerCase();
  const sq = (subjectQuery || emailSubject).trim().toLowerCase();
  const aq = (applicationQuery || application).trim().toLowerCase();
  const eq = (senderQuery || senderEmail).trim().toLowerCase();
  const qq = quickSearch.trim().toLowerCase();

  const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00Z`).getTime() : null;
  const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999Z`).getTime() : null;

  const filtered = (Array.isArray(records) ? records : []).filter(rec => {
    if (vq && !String(rec.vendorName || "").toLowerCase().includes(vq)) return false;
    if (sq && !String(rec.emailSubject || "").toLowerCase().includes(sq)) return false;
    if (aq && !String(rec.applicationName || "").toLowerCase().includes(aq)) return false;
    if (eq && !String(rec.senderEmail || "").toLowerCase().includes(eq)) return false;

    if (qq) {
      const haystack = [
        rec.vendorName,
        rec.applicationName,
        rec.emailSubject,
        rec.senderEmail,
        rec.updateType,
        rec.status,
        rec.operationalImpact
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(qq)) return false;
    }

    if (updateType && rec.updateType !== updateType) return false;
    if (status && rec.status !== status) return false;

    if (fromMs !== null || toMs !== null) {
      const targetDateStr = rec.receivedDate || rec.maintenanceStart;
      const targetMs = targetDateStr ? new Date(targetDateStr).getTime() : NaN;
      if (Number.isNaN(targetMs)) return false;
      if (fromMs !== null && targetMs < fromMs) return false;
      if (toMs !== null && targetMs > toMs) return false;
    }

    return true;
  });

  filtered.sort((a, b) => {
    const field = sortBy === "maintenanceStart" ? "maintenanceStart" : "receivedDate";
    const aHas = Boolean(a[field]);
    const bHas = Boolean(b[field]);
    if (!aHas && !bHas) return 0;
    if (!aHas) return 1; // Always push missing/null dates to the end
    if (!bHas) return -1;
    const aTime = new Date(a[field]).getTime();
    const bTime = new Date(b[field]).getTime();
    const safeA = Number.isNaN(aTime) ? 0 : aTime;
    const safeB = Number.isNaN(bTime) ? 0 : bTime;
    return effectiveSortDir === "asc" ? safeA - safeB : safeB - safeA;
  });

  return filtered;
}

/**
 * Optional clearly labeled DEMO DATA records for local development inspection ONLY.
 * Never loaded as production records; only shown if user explicitly toggles "Preview Demo Sandbox".
 */
export const DEMO_MAINTENANCE_RECORDS = [
  {
    id: "demo-vm-s4a-001",
    isDemo: true,
    vendorId: "its-application-vendors-1",
    vendorName: "Smart4Aviation",
    matchedVendorRecord: {
      id: "its-application-vendors-1",
      company: "Smart4Aviation",
      systemName: "S4A - Smart4Aviation/Weight and Balance",
      phone: "+48 12 379 3737",
      email: "support@smart4aviation.aero",
      aagItsTeam: "ITS Flight Operations",
      aagItsPoc: "Arun Sharma / Ryan Wilkins"
    },
    senderEmail: "support@smart4aviation.aero",
    senderDisplayName: "Smart4Aviation NOC",
    emailSubject: "[DEMO DATA] Scheduled Maintenance: S4A Weight & Balance Database Failover Test",
    emailBodyText:
      "DEMO DATA — FOR DEVELOPMENT PREVIEW ONLY.\n\nSmart4Aviation will perform scheduled database failover maintenance for S4A Weight and Balance.\nMaintenance Start: 2026-11-02 03:00 UTC\nMaintenance End: 2026-11-02 04:30 UTC\nOperational Impact: Intermittent 30-second reconnect during primary-to-secondary switchover. CLP closeout messaging remains active.",
    emailBodyHtml:
      "<p><strong>DEMO DATA — FOR DEVELOPMENT PREVIEW ONLY.</strong></p><p>Smart4Aviation will perform scheduled database failover maintenance for <strong>S4A Weight and Balance</strong>.</p><table><thead><tr><th>Window</th><th>Timestamp (UTC)</th><th>Impact</th></tr></thead><tbody><tr><td>Maintenance Start</td><td>2026-11-02 03:00 UTC</td><td>30s reconnect</td></tr><tr><td>Maintenance End</td><td>2026-11-02 04:30 UTC</td><td>Normal operations resume</td></tr></tbody></table>",
    receivedDate: "2026-10-25T16:15:00.000Z",
    updateType: "Scheduled Maintenance",
    applicationName: "Smart4Aviation (S4A)",
    allMatchedApplications: ["Smart4Aviation (S4A)"],
    maintenanceStart: "2026-11-02T03:00:00.000Z",
    maintenanceEnd: "2026-11-02T04:30:00.000Z",
    timeZone: "UTC",
    status: "Scheduled",
    severity: "Medium",
    operationalImpact: "Intermittent 30-second reconnect during primary-to-secondary switchover.",
    extractedSummary: "DEMO DATA: Scheduled S4A Weight and Balance database failover test on 2026-11-02 from 03:00 to 04:30 UTC.",
    classificationConfidence: "High (Rule-Matched)",
    reviewReasons: [],
    originalEmailWebLink: "https://outlook.office365.com/mail/deeplink?ItemID=DEMO-S4A-001",
    outlookMessageId: "AAMkADemoS4A001",
    outlookInternetMessageId: "<demo-s4a-001@smart4aviation.aero>",
    conversationId: "AAQkADemoConvS4A001",
    sourceMailbox: "DEMO SANDBOX (Not Connected to Live Mailbox)",
    source: "DEMO DATA",
    attachments: [
      {
        id: "demo-att-1",
        fileName: "S4A-Failover-Runbook-Nov2026.pdf",
        extension: ".pdf",
        size: 248120,
        contentType: "application/pdf",
        isSafeMetadataOnly: true,
        isBlocked: false,
        warnings: []
      }
    ],
    processingStatus: "Processed (DEMO DATA)",
    processingError: null,
    createdAt: "2026-10-25T16:15:02.000Z",
    updatedAt: "2026-10-25T16:15:02.000Z",
    lastProcessedAt: "2026-10-25T16:15:02.000Z",
    relatedMessageIds: [],
    followUpMessages: [],
    processingHistory: [
      {
        timestamp: "2026-10-25T16:15:02.000Z",
        action: "Demo Sandbox Sample Loaded",
        status: "Processed (DEMO DATA)",
        details: "Labeled DEMO DATA record for UI inspection."
      }
    ],
    auditTrail: [
      {
        timestamp: "2026-10-25T16:15:02.000Z",
        actor: "Demo Sandbox",
        change: "Loaded labeled DEMO DATA record"
      }
    ]
  },
  {
    id: "demo-vm-jeppesen-002",
    isDemo: true,
    vendorId: "jetplan",
    vendorName: "Jeppesen",
    matchedVendorRecord: {
      id: "jetplan",
      company: "Jeppesen",
      systemName: "JetPlan",
      phone: "1-800-732-2800",
      email: "OpsSupport@jeppesen.com",
      aagItsTeam: "ITS Flight Operations",
      aagItsPoc: "Ryan Wilkins"
    },
    senderEmail: "opssupport@jeppesen.com",
    senderDisplayName: "Jeppesen Operations Support",
    emailSubject: "[DEMO DATA] Investigating: JetPlan Upper Wind Feed Latency",
    emailBodyText:
      "DEMO DATA — FOR DEVELOPMENT PREVIEW ONLY.\n\nJeppesen engineers are currently investigating elevated latency on the NOAA upper wind data feed into JetPlan.\nOperational Impact: Flight plan weather calculation times may increase by 15-25 seconds.\nStart: 2026-10-25 14:00 UTC",
    emailBodyHtml:
      "<p><strong>DEMO DATA — FOR DEVELOPMENT PREVIEW ONLY.</strong></p><p>Jeppesen engineers are currently investigating elevated latency on the NOAA upper wind data feed into <strong>JetPlan</strong>.</p><p><strong>Operational Impact:</strong> Flight plan weather calculation times may increase by 15–25 seconds.</p>",
    receivedDate: "2026-10-25T14:10:00.000Z",
    updateType: "Performance Degradation",
    applicationName: "JetPlan",
    allMatchedApplications: ["JetPlan"],
    maintenanceStart: "2026-10-25T14:00:00.000Z",
    maintenanceEnd: null,
    timeZone: "UTC",
    status: "Investigating",
    severity: "High",
    operationalImpact: "Flight plan weather calculation times may increase by 15-25 seconds.",
    extractedSummary: "DEMO DATA: Jeppesen is investigating elevated latency on the NOAA upper wind feed into JetPlan.",
    classificationConfidence: "High (Rule-Matched)",
    reviewReasons: [],
    originalEmailWebLink: "https://outlook.office365.com/mail/deeplink?ItemID=DEMO-JEP-002",
    outlookMessageId: "AAMkADemoJep002",
    outlookInternetMessageId: "<demo-jep-002@jeppesen.com>",
    conversationId: "AAQkADemoConvJep002",
    sourceMailbox: "DEMO SANDBOX (Not Connected to Live Mailbox)",
    source: "DEMO DATA",
    attachments: [],
    processingStatus: "Processed (DEMO DATA)",
    processingError: null,
    createdAt: "2026-10-25T14:10:05.000Z",
    updatedAt: "2026-10-25T14:10:05.000Z",
    lastProcessedAt: "2026-10-25T14:10:05.000Z",
    relatedMessageIds: [],
    followUpMessages: [],
    processingHistory: [
      {
        timestamp: "2026-10-25T14:10:05.000Z",
        action: "Demo Sandbox Sample Loaded",
        status: "Processed (DEMO DATA)",
        details: "Labeled DEMO DATA record for UI inspection."
      }
    ],
    auditTrail: [
      {
        timestamp: "2026-10-25T14:10:05.000Z",
        actor: "Demo Sandbox",
        change: "Loaded labeled DEMO DATA record"
      }
    ]
  }
];
