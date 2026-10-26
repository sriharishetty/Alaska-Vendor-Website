import React, { useEffect, useMemo, useState } from "react";
import LoginScreen from "./Login.jsx";
import VendorEditor from "./VendorEditor.jsx";
import MaintenanceAdminSettingsPanel from "./components/maintenance/MaintenanceAdminSettingsPanel.jsx";
import {
  fetchMaintenanceAdminSettings,
  saveMaintenanceAdminSettings,
  fetchVendorMaintenanceList,
  reprocessMaintenanceRecord
} from "./services/vendorMaintenanceService.js";

const STORAGE = {
  authenticated: "productionOperationsAdminAuthenticated",
  email: "productionOperationsAdminEmail",
  password: "productionOperationsAdminPassword",
  vendors: "productionOperationsVendors",
  applications: "productionOperationsApplications",
  history: "productionOperationsAdminHistory"
};
const ADMINS = [
  "Srihari.Gangisetti@alaskaair.com",
  "Mohan.P@alaskaair.com",
  "Margaret.Jennifer@alaskaair.com",
  "Sharmini.M@alaskaair.com",
  "Srinivasanagasai.Chevitikanti@alaskaair.com",
  "Raghava.Rohan.Dodla@alaskaair.com"
];
const fields = ["systemName", "category", "vendorCompanyName", "prodOpsEscalationProcess", "contactNumbers", "emailAddress", "vendorPOC", "aagItsPOC", "aagItsTeam", "portalUrl", "portalStatus", "lastVerifiedDate", "portalNotes", "infoUpdatedDate", "infoUpdatedBy", "infoApprovedDate", "infoApprovedBy"];

const CARD_PROFILES = {
  "acars": {
    shortName: "ACARS",
    category: "Flight Operations",
    status: "Active",
    sla: "15 min",
    slaIcon: "spark",
    severity: "Critical",
    description: "Aircraft Communications Addressing and Reporting System for flight communications, monitoring and operational messaging.",
    vendor: "SITA",
    poc: "Ryan Wilkins",
    phone: "+1 425-727-3661",
    email: "acars.support@sita.aero",
    team: "ITS Flight Operations",
    logoVariant: "logo-acars"
  },
  "wam": {
    shortName: "WAM",
    category: "Maintenance & Engineering",
    status: "Active",
    sla: "15 min",
    slaIcon: "spark",
    severity: "Critical",
    description: "Workload and Aircraft Maintenance system used for maintenance tracking, scheduling and resource management.",
    vendor: "TRAX (Aviation Solutions)",
    poc: "Byron White",
    phone: "+1 972-421-8175",
    email: "wam.support@trax.aero",
    team: "ITS Maintenance",
    logoVariant: "logo-wam"
  },
  "jetplan": {
    shortName: "JetPlan",
    category: "Flight Operations",
    status: "Active",
    sla: "15 min",
    slaIcon: "phone",
    severity: "Critical",
    description: "Flight planning and fuel management system for operational planning and dispatch support.",
    vendor: "Jeppesen (Boeing)",
    poc: "Ryan Wilkins",
    phone: "+1 800-553-9696",
    email: "jetplan.support@jeppesen.com",
    team: "ITS Flight Operations",
    logoVariant: "logo-jp"
  },
  "Smart4Aviation (S4A)": {
    shortName: "S4A",
    category: "Weight and Balance",
    status: "Active",
    sla: "15 min",
    slaIcon: "spark",
    severity: "Critical",
    description: "Aircraft weight and balance, load planning and performance calculations for safe and efficient operations.",
    vendor: "Smart4Aviation",
    poc: "Arun Sharma",
    phone: "+48 12 379 3737",
    email: "support@smart4aviation.aero",
    team: "ITS Flight Operations",
    logoVariant: "logo-s4a"
  },
  "jcte": {
    shortName: "JCTE",
    category: "Crew & Technical Engineering",
    status: "Active",
    sla: "15 min",
    slaIcon: "spark",
    severity: "Critical",
    description: "Joint Certification and Technical Engineering system for configuration management and engineering data.",
    vendor: "Airbus",
    poc: "Thomas Strand",
    phone: "+46 8 25 38 68",
    email: "support@airbus.com",
    team: "ITS Engineering",
    logoVariant: "logo-jcte"
  },
  "airtrack": {
    shortName: "AirTrack",
    category: "Flight Operations",
    status: "Active",
    sla: "15 min",
    slaIcon: "phone",
    severity: "Critical",
    description: "Real-time aircraft tracking and operational visibility for fleet management and irregular operations.",
    vendor: "Aireon",
    poc: "Mike Johnson",
    phone: "+1 703-790-1200",
    email: "support@aireon.com",
    team: "ITS Flight Operations",
    logoVariant: "logo-airtrack"
  },
  "pilot-briefing": {
    shortName: "Pilot Briefing",
    category: "Crew Operations",
    status: "Active",
    sla: "15 min",
    slaIcon: "phone",
    severity: "Critical",
    description: "Electronic flight bag and briefing system providing pilots with operational information, weather and NOTAMs.",
    vendor: "Jeppesen",
    poc: "Sarah Green",
    phone: "+1 800-553-9696",
    email: "pilotbriefing@jeppesen.com",
    team: "ITS Flight Operations",
    logoVariant: "logo-pb"
  },
  "aircraft-maintenance": {
    shortName: "Aircraft Maintenance",
    category: "Maintenance & Engineering",
    status: "Active",
    sla: "30 min",
    slaIcon: "spark",
    severity: "Standard",
    description: "Aircraft maintenance records, task management and compliance tracking system.",
    vendor: "AMES (Aviation M&E)",
    poc: "David Lee",
    phone: "+1 425-310-1500",
    email: "support@ames.aero",
    team: "ITS Maintenance",
    logoVariant: "logo-am"
  },
  "aims": {
    shortName: "AIMS",
    category: "Airport Operations",
    status: "Active",
    sla: "15 min",
    slaIcon: "phone",
    severity: "Critical",
    description: "Airport Information Management System for airport operations, resource allocation and situational awareness.",
    vendor: "Airbus",
    poc: "Karen Mitchell",
    phone: "+1 214-647-3000",
    email: "aims.support@airbus.com",
    team: "ITS Airport Operations",
    logoVariant: "logo-aims"
  }
};

function renderAppLogoSvg(key) {
  switch (key) {
    case "wam":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      );
    case "jetplan":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      );
    case "Smart4Aviation (S4A)":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "jcte":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="m9 10 1.5 1.5L14 8" />
          <path d="M9 15h6" />
        </svg>
      );
    case "airtrack":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case "pilot-briefing":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
        </svg>
      );
    case "aircraft-maintenance":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "aims":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 19v-5M12 19V9M18 19V5" />
        </svg>
      );
    case "acars":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 7 9 3 5 7l4 4" />
          <path d="m17 11 4 4-4 4-4-4" />
          <path d="m8 12 4 4 6-6-4-4Z" />
          <path d="m16 8 3-3" />
          <path d="M9 21a6 6 0 0 0-6-6" />
        </svg>
      );
  }
}

function renderSlaIcon(type) {
  if (type === "phone") {
    return (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v2.5a1.8 1.8 0 0 1-1.96 1.8 17.8 17.8 0 0 1-7.76-2.76 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 4.12 5.26 1.8 1.8 0 0 1 5.91 3.3h2.5a1.8 1.8 0 0 1 1.8 1.55c.11.85.32 1.68.62 2.48a1.8 1.8 0 0 1-.41 1.9l-1.06 1.06a14.4 14.4 0 0 0 5.4 5.4l1.06-1.06a1.8 1.8 0 0 1 1.9-.41c.8.3 1.63.51 2.48.62A1.8 1.8 0 0 1 22 16.92z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v3m0 12v3M4.93 4.93l2.12 2.12m9.9 9.9 2.12 2.12M3 12h3m12 0h3M4.93 19.07l2.12-2.12m9.9-9.9 2.12-2.12" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function usableCardValue(value) {
  const text = String(value || "").replace(/\s*[—–]\s*/g, " - ").trim();
  return text && !/^(?:n\/?a|tbd|none|no)$/i.test(text) ? text : "";
}

function cardContactSummary(value) {
  return (Array.isArray(value) ? value.join("\n") : String(value || ""))
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(usableCardValue)
    .join(" · ");
}

function contactTarget(value, type) {
  const text = Array.isArray(value) ? value.join("\n") : String(value || "");
  if (type === "email") {
    const addresses = [...new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
    return addresses.length ? `mailto:${addresses.join(",")}` : "";
  }
  const numbers = text.match(/\+?\d[\d\s().-]{5,}\d/g) || [];
  const phone = numbers.map(n => n.trim()).find(n => n.replace(/\D/g, "").length >= 7);
  return phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
}

function initials(value) {
  const text = String(value || "VENDOR").trim();
  const words = text.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "V";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function vendorLogo(company) {
  const identity = String(company || "Vendor").toLocaleLowerCase();
  let hash = 0;
  for (let index = 0; index < identity.length; index += 1) {
    hash = (hash * 31 + identity.charCodeAt(index)) >>> 0;
  }
  const palettes = [
    { bgStart: "#0066CC", bgEnd: "#0052A3" },
    { bgStart: "#211D8A", bgEnd: "#171469" },
    { bgStart: "#004B87", bgEnd: "#003865" },
    { bgStart: "#0D6E6E", bgEnd: "#095252" },
    { bgStart: "#3B288F", bgEnd: "#2A1B6E" },
    { bgStart: "#026AA7", bgEnd: "#014F7D" }
  ];
  let palette = palettes[hash % palettes.length];
  if (identity.includes("smart4aviation")) {
    palette = palettes[0];
  } else if (identity.includes("dynamic source")) {
    palette = palettes[1];
  } else if (identity.includes("aerodata")) {
    palette = palettes[2];
  }
  const mark = initials(company);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette.bgStart}"/><stop offset="100%" stop-color="${palette.bgEnd}"/></linearGradient></defs><rect width="96" height="96" rx="22" fill="url(#g)"/><text x="48" y="59" text-anchor="middle" font-family="Inter,'Segoe UI',Arial,sans-serif" font-size="33" font-weight="800" letter-spacing="-0.5" fill="#FFFFFF">${mark}</text></svg>`;
  return {
    src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    alt: `${company} monogram badge`
  };
}

function renderFormattedPhone(phoneText) {
  if (!phoneText) {
    return <span className="vendor-contact-missing">Phone not listed</span>;
  }
  const parts = String(phoneText).split(/(\([^)]+\))/g);
  return parts.map((part, idx) =>
    part.startsWith("(") && part.endsWith(")") ? (
      <span key={idx} className="vendor-phone-note">{part}</span>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const workbookVendors = (useBase = false) => {
  const rawVendors = useBase ? (window.baseMasterData?.vendors || window.masterData?.vendors) : window.masterData?.vendors;
  if (!Array.isArray(rawVendors)) return [];
  const fieldsToMerge = ["category", "vendorCompanyName", "prodOpsEscalationProcess", "contactNumbers", "emailAddress", "vendorPOC", "aagItsPOC", "aagItsTeam", "infoUpdatedDate", "infoUpdatedBy", "infoApprovedDate", "infoApprovedBy"];
  const records = [];
  rawVendors.forEach(vendor => {
    const mapped = {
      id: `its-application-vendors-${vendor.sourceRow}`,
      sourceRow: vendor.sourceRow,
      vendorDataVersion: 2,
      systemName: vendor.systemName || "",
      category: vendor.category || "",
      vendorCompanyName: vendor.vendor || "",
      prodOpsEscalationProcess: vendor.escalation || "",
      contactNumbers: vendor.phone || "",
      emailAddress: vendor.email || "",
      vendorPOC: vendor.vendorPoc || "",
      aagItsPOC: vendor.aagItsPoc || "",
      aagItsTeam: vendor.aagItsTeam || "",
      infoUpdatedDate: vendor.updatedDate || "",
      infoUpdatedBy: vendor.updatedBy || "",
      infoApprovedDate: vendor.approvedDate || "",
      infoApprovedBy: vendor.approvedBy || "",
      portalUrl: vendor.portalUrl || "",
      portalStatus: vendor.portalStatus || "",
      lastVerifiedDate: vendor.lastVerifiedDate || "",
      portalNotes: vendor.portalNotes || ""
    };
    if (mapped.systemName) {
      records.push(mapped);
      return;
    }
    const parent = records.at(-1);
    if (!parent) return;
    fieldsToMerge.forEach(field => {
      if (mapped[field]) parent[field] = [parent[field], mapped[field]].filter(Boolean).join("\n\n");
    });
  });
  return records;
};

function buildDefaultApplications() {
  const keys = window.groundStopApplicationKeys || Object.keys(CARD_PROFILES);
  const rawApps = window.masterData?.applications || {};
  const saved = read(STORAGE.applications, []);
  return keys.map(key => {
    const raw = rawApps[key] || Object.values(rawApps).find(a => a && (a.id === key || a.key === key)) || {};
    const profile = CARD_PROFILES[key] || {};
    const prior = saved.find(a => a && (a.key === key || a.id === key || (raw.id && a.id === raw.id))) || {};
    const isEdited = Boolean(prior.adminEdited);
    return {
      ...raw,
      ...prior,
      id: raw.id || prior.id || key,
      key,
      adminEdited: isEdited,
      shortName: isEdited ? (prior.shortName || prior.name || profile.shortName || raw.name || key) : (profile.shortName || raw.name || key),
      name: isEdited ? (prior.name || prior.shortName || raw.name || profile.shortName || key) : (profile.shortName || raw.name || key),
      category: isEdited ? (prior.category || profile.category || raw.category || "Operations") : (profile.category || raw.category || "Operations"),
      status: isEdited ? (prior.status || profile.status || "Active") : (profile.status || "Active"),
      response: isEdited ? (prior.response || profile.sla || "15 min") : (profile.sla || "15 min"),
      slaIcon: profile.slaIcon || "spark",
      logoVariant: profile.logoVariant || "logo-acars",
      severity: isEdited ? (prior.severity || profile.severity || raw.severity || "Critical") : (profile.severity || raw.severity || "Critical"),
      description: isEdited
        ? (Array.isArray(prior.description) ? prior.description.join(" ") : (prior.description || profile.description || ""))
        : (profile.description || (Array.isArray(raw.description) ? raw.description.join(" ") : raw.description) || ""),
      vendor: isEdited ? (prior.vendor || profile.vendor || "Alaska ITS") : (profile.vendor || usableCardValue(raw.vendor) || "Alaska ITS"),
      aagPOC: isEdited ? (prior.aagPOC || profile.poc || "On-Call Rotation") : (profile.poc || usableCardValue(raw.aagPOC) || "On-Call Rotation"),
      phone: isEdited ? (prior.phone || profile.phone || "+1 800-553-9696") : (profile.phone || usableCardValue(raw.phone) || "+1 800-553-9696"),
      email: isEdited ? (prior.email || profile.email || "support@alaskaair.com") : (profile.email || usableCardValue(raw.email) || "support@alaskaair.com"),
      aagTeam: isEdited ? (prior.aagTeam || profile.team || "ITS Flight Operations") : (profile.team || usableCardValue(raw.aagTeam) || "ITS Flight Operations")
    };
  });
}

function ApplicationEditor({ application, onClose, onSave }) {
  const [draft, setDraft] = useState(() => ({
    ...application,
    name: application.shortName || application.name || "",
    description: Array.isArray(application.description) ? application.description.join(" ") : (application.description || "")
  }));
  const appFields = [
    ["name", "Application Name"],
    ["category", "Operational Category"],
    ["status", "Status (e.g. Active)"],
    ["response", "Response SLA (e.g. 15 min)"],
    ["severity", "Severity"],
    ["vendor", "Vendor / Provider"],
    ["aagPOC", "ITS POC"],
    ["phone", "Support Phone"],
    ["email", "Support Email"],
    ["aagTeam", "Responsible ITS Team"]
  ];
  return (
    <div className="modal">
      <form
        className="editor"
        onSubmit={e => {
          e.preventDefault();
          onSave({
            ...draft,
            shortName: draft.name,
            adminEdited: true
          });
        }}
      >
        <header>
          <div>
            <small>EDIT OPERATIONAL SYSTEM</small>
            <h2>Edit Application Information</h2>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </header>
        <div className="form-grid">
          {appFields.map(([field, label]) => (
            <label key={field}>
              {label}
              <input
                value={draft[field] || ""}
                onChange={e => setDraft({ ...draft, [field]: e.target.value })}
              />
            </label>
          ))}
          <label className="full-width">
            Description
            <textarea
              rows={3}
              value={draft.description || ""}
              onChange={e => setDraft({ ...draft, description: e.target.value })}
            />
          </label>
        </div>
        <footer>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button>Save Changes</button>
        </footer>
      </form>
    </div>
  );
}

function PasswordEditor({ onClose }) {
  return React.createElement("div", { className: "modal" },
    React.createElement("div", { className: "editor password-editor" },
      React.createElement("header", null,
        React.createElement("div", null,
          React.createElement("small", null, "MICROSOFT 365 SECURITY"),
          React.createElement("h2", null, "SharePoint Online RBAC")
        ),
        React.createElement("button", { type: "button", onClick: onClose }, "×")
      ),
      React.createElement("p", { style: { fontSize: "14px", lineHeight: 1.6, color: "#334155", margin: "12px 0" } },
        "Authentication in SharePoint Framework (SPFx) is managed automatically by Microsoft Entra ID and SharePoint Online site permissions (context.pageContext.user). No passwords or secrets are stored in this web part."
      ),
      React.createElement("footer", null,
        React.createElement("button", { type: "button", onClick: onClose }, "Close")
      )
    )
  );
}

function AdminSidebar() {
  const [vendorsOpen, setVendorsOpen] = useState(false);

  function handleChevronClick(event) {
    event.preventDefault();
    event.stopPropagation();
    setVendorsOpen(prev => !prev);
  }

  return (
    <aside className="sidebar ias-sidebar" aria-label="Sidebar Navigation">
      <a className="sidebar-brand" href="../home.html" aria-label="Alaska Airlines home">
        <img className="sidebar-alaska-logo" src="../public/alaska-logo-white.svg" alt="Alaska Airlines" />
      </a>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <a href="../home.html" className="nav-item">
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
          </span>
          <span>Home</span>
        </a>

        <div className={`nav-dropdown${vendorsOpen ? " is-open" : ""}`} data-nav-dropdown="vendors">
          <a href="../vendors.html" className="nav-item nav-dropdown-toggle" aria-expanded={vendorsOpen ? "true" : "false"}>
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </span>
            <span>Vendors &amp; Partners</span>
            <span className="nav-chevron" aria-hidden="true" onClick={handleChevronClick}>
              <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </span>
          </a>
          <div className="nav-dropdown-menu" role="group" aria-label="Vendors & Partners submenu">
            <a href="../vendor-maintenance.html" className="nav-subitem">
              <span className="nav-subicon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
              </span>
              <span>Vendor Maintenance</span>
            </a>
            <a href="../vendor-case-status.html" className="nav-subitem">
              <span className="nav-subicon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="m9 14 2 2 4-4" /></svg>
              </span>
              <span>Vendor Case Status</span>
            </a>
          </div>
        </div>

        <a href="../categories.html" className="nav-item">
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
          </span>
          <span>System Categories</span>
        </a>

        <a href="../ground-stops.html" className="nav-item">
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
          </span>
          <span>Operations Directory</span>
        </a>

        <a href="../favorites.html" className="nav-item">
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" /></svg>
          </span>
          <span>My Favorites</span>
        </a>

        <a href="../reports.html" className="nav-item">
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 20v-6M12 20V10M18 20V4" /></svg>
          </span>
          <span>Reports &amp; Analytics</span>
        </a>

        <a href="./index.html" className="nav-item active" aria-current="page">
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </span>
          <span>Admin Settings</span>
        </a>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-quote">PEOPLE.<br />PLANES.<br />PARTNERS.<br />TOMORROW.</div>
        <small className="sidebar-copyright">Stronger operations<br />for a brighter tomorrow.</small>
      </div>
    </aside>
  );
}

function Metric({ value, label, detail, icon, tone }) {
  return <article className={`metric metric-${tone}`}><div className="metric-icon">{icon}</div><div><small>{label}</small><strong>{String(value).padStart(2, "0")}</strong><span>{detail}</span></div><i className="metric-state">●</i></article>;
}

function OperationModule({ icon, title, description, href }) {
  return <a className="operation-module" href={href}><span className="module-icon">{icon}</span><span><strong>{title}</strong><small>{description}</small></span><b>↗</b></a>;
}

function App() {
  const [email, setEmail] = useState(() => localStorage.getItem(STORAGE.email));
  const [vendors, setVendors] = useState(() => {
    const saved = read(STORAGE.vendors, []);
    const source = workbookVendors();
    if (!saved.length) return source;
    return source.map(record => {
      const prior = saved.find(
        vendor =>
          (vendor.id && vendor.id === record.id) ||
          (vendor.sourceRow != null && Number(vendor.sourceRow) === Number(record.sourceRow))
      );
      if (!prior) return record;
      if (prior.vendorDataVersion === 2 && !Array.isArray(prior.editedFields)) {
        return { ...record, ...prior, id: record.id, sourceRow: record.sourceRow };
      }
      if (Array.isArray(prior.editedFields)) {
        const mergedEdited = prior.editedFields.reduce(
          (merged, field) => (fields.includes(field) ? { ...merged, [field]: prior[field] || "" } : merged),
          record
        );
        return {
          ...mergedEdited,
          ...(prior.supportPortalUrl ? { supportPortalUrl: prior.supportPortalUrl } : {}),
          ...(prior.caseStatusUrl ? { caseStatusUrl: prior.caseStatusUrl } : {}),
          ...(prior.portalUrl ? { portalUrl: prior.portalUrl } : {}),
          ...(prior.portalStatus ? { portalStatus: prior.portalStatus } : {}),
          ...(prior.lastVerifiedDate ? { lastVerifiedDate: prior.lastVerifiedDate } : {}),
          ...(prior.portalVerifiedAt ? { portalVerifiedAt: prior.portalVerifiedAt } : {}),
          ...(prior.portalNotes ? { portalNotes: prior.portalNotes } : {}),
          ...(Array.isArray(prior.associatedApplications) ? { associatedApplications: prior.associatedApplications } : {}),
          editedFields: prior.editedFields
        };
      }
      return { ...record, ...prior, id: record.id, sourceRow: record.sourceRow };
    });
  });
  const [applications, setApplications] = useState(buildDefaultApplications);
  const [history, setHistory] = useState(() => read(STORAGE.history, []));
  const [appQuery, setAppQuery] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [maintenanceSettings, setMaintenanceSettings] = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [savingMaintSettings, setSavingMaintSettings] = useState(false);

  useEffect(() => {
    fetchMaintenanceAdminSettings().then(res => {
      if (res?.settings) setMaintenanceSettings(res.settings);
    }).catch(() => {});
    fetchVendorMaintenanceList().then(res => {
      if (Array.isArray(res?.records)) setMaintenanceRecords(res.records);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const logout = () => {
      localStorage.removeItem(STORAGE.authenticated);
      localStorage.removeItem(STORAGE.email);
    };
    addEventListener("pagehide", logout);
    return () => removeEventListener("pagehide", logout);
  }, []);
  useEffect(() => {
    const baseVendors = workbookVendors(true);
    localStorage.setItem(STORAGE.vendors, JSON.stringify(vendors.map(v => {
      const base = baseVendors.find(x => x.sourceRow === v.sourceRow) || {};
      const priorEdited = Array.isArray(v.editedFields) ? v.editedFields : [];
      const changed = fields.filter(key => (v[key] || "") !== (base[key] || "") || priorEdited.includes(key));
      return { ...v, editedFields: changed };
    })));
    if (typeof window.syncMasterDataOverrides === "function") window.syncMasterDataOverrides();
  }, [vendors]);
  useEffect(() => {
    localStorage.setItem(STORAGE.applications, JSON.stringify(applications));
    if (typeof window.syncMasterDataOverrides === "function") window.syncMasterDataOverrides();
  }, [applications]);

  const filteredApplications = useMemo(
    () =>
      applications.filter(app =>
        !appQuery.trim() ||
        Object.values(app).join(" ").toLowerCase().includes(appQuery.trim().toLowerCase())
      ),
    [applications, appQuery]
  );

  const systemCountByCompany = useMemo(() => {
    const map = new Map();
    vendors.forEach(record => {
      const company = (usableCardValue(record.vendorCompanyName) || usableCardValue(record.systemName) || "Vendor").toLocaleLowerCase();
      const sys = usableCardValue(record.systemName);
      if (!map.has(company)) map.set(company, new Set());
      if (sys) map.get(company).add(sys.toLocaleLowerCase());
    });
    return map;
  }, [vendors]);

  const results = useMemo(() => vendors.filter(v => Object.values(v).join(" ").toLowerCase().includes(query.toLowerCase())), [vendors, query]);
  const currentPath = window.location.pathname.replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();
  const isActiveNavigation = href => new URL(href, window.location.href).pathname.replace(/\\/g, "/").replace(/\/$/, "").toLowerCase() === currentPath;

  function saveVendor(draft) {
    const currentVendor = vendors.find(x => x.id === draft.id) || {};
    const base = workbookVendors(true).find(x => x.sourceRow === draft.sourceRow) || {};
    const newlyChanged = fields.filter(key => (draft[key] || "") !== (currentVendor[key] || "") || (draft[key] || "") !== (base[key] || ""));
    const editedFields = Array.from(new Set([...(draft.editedFields || []), ...newlyChanged]));
    const updatedDraft = { ...draft, editedFields };
    const nextVendors = vendors.map(v => v.id === draft.id ? updatedDraft : v);
    localStorage.setItem(STORAGE.vendors, JSON.stringify(nextVendors));
    setVendors(nextVendors);
    if (typeof window.persistMasterDataToFile === "function") window.persistMasterDataToFile();
    const item = { action: "Vendor updated", details: `${draft.vendorCompanyName || draft.systemName || "Vendor"} information was updated`, timestamp: new Date().toLocaleString() };
    const next = [item, ...history].slice(0, 50);
    setHistory(next);
    localStorage.setItem(STORAGE.history, JSON.stringify(next));
    setEditing(null);
  }
  function saveApplication(draft) {
    const nextApplications = applications.map(app => app.id === draft.id ? draft : app);
    localStorage.setItem(STORAGE.applications, JSON.stringify(nextApplications));
    setApplications(nextApplications);
    if (typeof window.persistMasterDataToFile === "function") window.persistMasterDataToFile();
    const item = { action: "Application updated", details: `${draft.name || "Application"} information was updated`, timestamp: new Date().toLocaleString() };
    const next = [item, ...history].slice(0, 50);
    setHistory(next);
    localStorage.setItem(STORAGE.history, JSON.stringify(next));
    setEditingApplication(null);
  }
  async function handleSaveMaintenanceSettings(newSettings) {
    setSavingMaintSettings(true);
    try {
      const saved = await saveMaintenanceAdminSettings(newSettings);
      setMaintenanceSettings(saved);
      const item = {
        action: "Outlook Integration Settings updated",
        details: `Monitored folder: ${saved.monitoredFolderName || "Vendor Maintenance"} (${(saved.approvedVendorDomains || []).length} approved vendor domains)`,
        timestamp: new Date().toLocaleString()
      };
      const next = [item, ...history].slice(0, 50);
      setHistory(next);
      localStorage.setItem(STORAGE.history, JSON.stringify(next));
    } finally {
      setSavingMaintSettings(false);
    }
  }
  async function handleReprocessMaintRecord(recordId) {
    const updated = await reprocessMaintenanceRecord(recordId, window.POC_MASTER_DATA || {});
    setMaintenanceRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    return updated;
  }

  if (!email || localStorage.getItem(STORAGE.authenticated) !== "true") {
    return (
      <main className="app">
        <AdminSidebar />
        <LoginScreen onLogin={setEmail} />
      </main>
    );
  }

  return <main className="app">
    <AdminSidebar />
    <section className="dashboard">
      <header className="command-header">
        <div className="header-copy"><small>ITS PRODUCTION OPERATIONS</small><h1>Admin Control Center</h1><p>Manage applications, vendors and operational information.</p></div>
        <div className="header-actions"><button className="header-button" onClick={() => setChangingPassword(true)}>Change Password</button><button className="header-button logout" onClick={() => { localStorage.removeItem(STORAGE.authenticated); localStorage.removeItem(STORAGE.email); setEmail(null); }}>Logout</button></div>
      </header>
      <div className="command-line"><span><i className="online-dot"></i> SYSTEM STATUS: OPERATIONAL</span><span>LAST SYNC · LIVE</span></div>
      <section className="metrics"><Metric value={applications.length} label="APPLICATIONS" detail="Active operational applications" icon="✈" tone="blue" /><Metric value={vendors.length} label="VENDOR RECORDS" detail="Configured vendor contacts" icon="♟" tone="green" /><Metric value={history.length} label="CHANGES" detail="Changes pending review" icon="↻" tone="purple" /></section>
      <section className="section-block operations-block"><div className="section-heading"><div><small>CONTROL ROOM</small><h2>Operations Overview</h2></div><span>ADMINISTRATION</span></div><div className="module-grid"><OperationModule icon="▣" title="Application Management" description="Configure operational systems" href="#applications" /><OperationModule icon="♟" title="Vendor Management" description="Maintain vendor contacts" href="#vendors" /><OperationModule icon="✉" title="Vendor Maintenance & Outlook" description="Configure Outlook email automation" href="#vendor-maintenance-admin" /><OperationModule icon="↻" title="Recent Changes" description="Track administrative activity" href="#activity" /><OperationModule icon="◉" title="Live Vendor Maintenance" description="Open Vendor Maintenance dashboard" href="../vendor-maintenance.html" /><OperationModule icon="⚙" title="Administrative Tools" description="Security and access controls" href="#admin-tools" /></div></section>
      <section className="section-block" id="applications">
        <div className="section-heading vendor-heading">
          <div>
            <small>LIVE SERVICE REGISTER</small>
            <h2>Application Status</h2>
          </div>
          <input
            aria-label="Search applications"
            placeholder="Search applications, vendors, or keywords..."
            value={appQuery}
            onChange={e => setAppQuery(e.target.value)}
          />
          <span>{filteredApplications.length} SYSTEMS</span>
        </div>
        <div className="ground-stop-grid">
          {filteredApplications.map(app => {
            const appKey = app.key || app.id || "acars";
            const profile = CARD_PROFILES[appKey] || {};
            const title = app.shortName || app.name || profile.shortName || appKey;
            const category = app.category || profile.category || "Operations";
            const statusLabel = app.status || profile.status || "Active";
            const slaLabel = app.response || profile.sla || "15 min";
            const description = Array.isArray(app.description)
              ? app.description.join(" ")
              : (app.description || profile.description || app.function || "");
            const vendor = app.vendor || profile.vendor || "Alaska ITS";
            const poc = app.aagPOC || profile.poc || "On-Call Rotation";
            const phone = app.phone || profile.phone || "+1 800-553-9696";
            const emailAddr = app.email || profile.email || "support@alaskaair.com";
            const team = app.aagTeam || profile.team || "ITS Flight Operations";
            const logoVariant = app.logoVariant || profile.logoVariant || "logo-acars";
            const slaIcon = app.slaIcon || profile.slaIcon || "spark";
            const phoneHref = `tel:${String(phone).replace(/[^\d+]/g, "")}`;
            const emailHref = `mailto:${emailAddr}`;

            return (
              <article
                className="ground-stop-card"
                key={app.id}
                onClick={() => setEditingApplication(app)}
              >
                <header className="gs-card-header">
                  <div className={`gs-card-logo ${logoVariant}`} aria-hidden="true">
                    {renderAppLogoSvg(appKey)}
                  </div>
                  <div className="gs-card-titles">
                    <h2 title={title}>{title}</h2>
                    <span className="gs-category-pill">{category}</span>
                  </div>
                  <div className="gs-card-badges">
                    <span className="gs-status-pill">
                      <i className="gs-status-dot" aria-hidden="true"></i>
                      <span>{statusLabel}</span>
                    </span>
                    <span className="gs-sla-pill">
                      {renderSlaIcon(slaIcon)}
                      <span>SLA: {slaLabel}</span>
                    </span>
                  </div>
                </header>

                <p className="gs-card-description" title={description}>
                  {description}
                </p>

                <div className="gs-card-info-grid">
                  <div className="gs-info-cell">
                    <span className="gs-info-label">Vendor / Provider</span>
                    <strong className="gs-info-value" title={vendor}>{vendor}</strong>
                  </div>
                  <div className="gs-info-cell gs-info-cell-right">
                    <span className="gs-info-label">ITS POC</span>
                    <strong className="gs-info-value" title={poc}>{poc}</strong>
                  </div>

                  <div className="gs-contact-cell">
                    <span className="gs-contact-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <a
                      href={phoneHref}
                      className="gs-contact-phone"
                      title={`Call ${phone}`}
                      onClick={e => e.stopPropagation()}
                    >
                      {phone}
                    </a>
                  </div>
                  <div className="gs-contact-cell gs-contact-cell-right">
                    <span className="gs-contact-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <a
                      href={emailHref}
                      className="gs-contact-email"
                      title={`Email ${emailAddr}`}
                      onClick={e => e.stopPropagation()}
                    >
                      {emailAddr}
                    </a>
                  </div>
                </div>

                <footer className="gs-card-footer">
                  <div className="gs-card-team" title={`Responsible Team: ${team}`}>
                    <span className="gs-team-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    <span>{team}</span>
                  </div>
                  <button
                    type="button"
                    className="ground-stop-details-button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingApplication(app);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      </section>
      <section className="section-block" id="vendors">
        <div className="section-heading vendor-heading">
          <div>
            <small>PARTNER DIRECTORY</small>
            <h2>Vendor Management</h2>
          </div>
          <input
            aria-label="Search vendors"
            placeholder="Search vendors..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span>{results.length} RECORDS</span>
        </div>
        <div className="vendor-grid">
          {results.map(v => {
            const company = usableCardValue(v.vendorCompanyName) || usableCardValue(v.systemName) || "Vendor";
            const systemCount = Math.max(systemCountByCompany.get(company.toLocaleLowerCase())?.size || 0, 1);
            const logo = vendorLogo(company);
            const systemName = usableCardValue(v.systemName) || "Operational System";
            const categoryLabel = usableCardValue(v.category)
              ? String(v.category).split("•")[0].trim()
              : "Operations Partner";
            const primaryContact = cardContactSummary(
              usableCardValue(v.vendorPOC) || usableCardValue(v.aagItsPOC)
            );
            const phone = cardContactSummary(v.contactNumbers);
            const emailAddr = cardContactSummary(v.emailAddress);
            const phoneTarget = contactTarget(v.contactNumbers, "phone");
            const emailTarget = contactTarget(v.emailAddress, "email");
            const team = usableCardValue(v.aagItsTeam) || usableCardValue(v.category) || "Department not listed";

            return (
              <article
                className="vendor-card"
                key={v.id}
                onClick={() => setEditing(v)}
              >
                <header className="vendor-card-header">
                  <div className="vendor-logo-frame">
                    <img className="vendor-logo" src={logo.src} alt={logo.alt} loading="lazy" />
                  </div>
                  <div className="vendor-card-heading">
                    <h3 className="vendor-company-name" title={company}>
                      {company}
                    </h3>
                    <div className="vendor-card-submeta">
                      <span className="vendor-category-pill" title={categoryLabel}>
                        {categoryLabel}
                      </span>
                      <span className="vendor-system-count" aria-label={`${systemCount} supported ${systemCount === 1 ? "system" : "systems"}`}>
                        <span className="vendor-system-count-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <rect x="3.5" y="4" width="7" height="6.5" rx="1.2" />
                            <rect x="13.5" y="4" width="7" height="6.5" rx="1.2" />
                            <rect x="3.5" y="13.5" width="7" height="6.5" rx="1.2" />
                            <rect x="13.5" y="13.5" width="7" height="6.5" rx="1.2" />
                          </svg>
                        </span>
                        <strong>{systemCount}</strong>
                        <span>{systemCount === 1 ? "System" : "Systems"}</span>
                      </span>
                    </div>
                  </div>
                  <div className="vendor-card-badges" aria-label="Vendor status">
                    <span className="vendor-status-badge vendor-status-badge-status active">
                      <i aria-hidden="true"></i>Active
                    </span>
                  </div>
                </header>

                <section className="vendor-system-box" aria-label="Supported system and SLA">
                  <span className="vendor-system-box-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                      <path d="m2 17 10 5 10-5" />
                      <path d="m2 12 10 5 10-5" />
                    </svg>
                  </span>
                  <div className="vendor-system-box-copy">
                    <span className="vendor-card-label">SUPPORTED SYSTEM</span>
                    <p className="vendor-system-summary" title={systemName}>
                      {systemName}
                    </p>
                  </div>
                  <span className="vendor-status-badge vendor-status-badge-availability">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="8.5" />
                      <path d="M12 7v5l3.5 2" />
                    </svg>
                    24x7
                  </span>
                </section>

                <div className="vendor-card-contacts" aria-label="Vendor contact details">
                  <div className="vendor-contact-line">
                    <span className="vendor-contact-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5 20c.4-4 2.7-6 7-6s6.6 2 7 6" />
                      </svg>
                    </span>
                    <span className="vendor-contact-key">POC</span>
                    <span className="vendor-contact-val" title={primaryContact || "No primary contact listed"}>
                      {primaryContact ? primaryContact : <span className="vendor-contact-missing">No primary contact listed</span>}
                    </span>
                  </div>
                  <div className="vendor-contact-line">
                    <span className="vendor-contact-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M21 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L7 9.2a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 2 2.3Z" />
                      </svg>
                    </span>
                    <span className="vendor-contact-key">Phone</span>
                    {phoneTarget ? (
                      <a
                        className="vendor-contact-val vendor-contact-phone"
                        href={phoneTarget}
                        title={phone || "Call vendor"}
                        onClick={e => e.stopPropagation()}
                      >
                        {renderFormattedPhone(phone)}
                      </a>
                    ) : (
                      <span className="vendor-contact-val vendor-contact-phone">
                        {renderFormattedPhone(phone)}
                      </span>
                    )}
                  </div>
                  <div className="vendor-contact-line">
                    <span className="vendor-contact-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
                        <path d="m3.5 6 8.5 7 8.5-7" />
                      </svg>
                    </span>
                    <span className="vendor-contact-key">Email</span>
                    {emailTarget ? (
                      <a
                        className="vendor-contact-val vendor-contact-link"
                        href={emailTarget}
                        title={emailAddr || "Email vendor"}
                        onClick={e => e.stopPropagation()}
                      >
                        {emailAddr || "Email vendor"}
                      </a>
                    ) : (
                      <span className="vendor-contact-val">
                        {emailAddr ? emailAddr : <span className="vendor-contact-missing">Email not listed</span>}
                      </span>
                    )}
                  </div>
                  <div className="vendor-contact-line">
                    <span className="vendor-contact-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <circle cx="9" cy="8.5" r="3" />
                        <path d="M3.5 19c.4-2.8 2.4-4.3 5.5-4.3s5.1 1.5 5.5 4.3" />
                        <circle cx="16.5" cy="9.5" r="2.3" />
                        <path d="M16 14.8c2.1.2 3.7 1.4 4 3.7" />
                      </svg>
                    </span>
                    <span className="vendor-contact-key">ITS Team</span>
                    <span className="vendor-contact-val vendor-contact-team" title={team}>
                      {team}
                    </span>
                  </div>
                </div>

                <footer className="vendor-card-footer">
                  <button
                    className="vendor-view vendor-btn-details"
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      const target = emailTarget || phoneTarget;
                      if (target) {
                        (window.__spfxNavigateByHref ? window.__spfxNavigateByHref(target) : (window.location.href = target));
                      } else {
                        setEditing(v);
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
                      <path d="m3.5 6 8.5 7 8.5-7" />
                    </svg>
                    <span>Contact</span>
                  </button>
                  <button
                    className="vendor-contact-btn vendor-btn-contact"
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditing(v);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      </section>
      <section className="section-block" id="vendor-maintenance-admin">
        <div className="section-heading">
          <div>
            <small>MICROSOFT 365 & POWER AUTOMATE</small>
            <h2>Vendor Maintenance Email Integration</h2>
          </div>
          <a href="../vendor-maintenance.html" className="text-action">Open Vendor Maintenance Page →</a>
        </div>
        <MaintenanceAdminSettingsPanel
          settings={maintenanceSettings}
          onSaveSettings={handleSaveMaintenanceSettings}
          records={maintenanceRecords}
          onReprocessRecord={handleReprocessMaintRecord}
          isSaving={savingMaintSettings}
        />
      </section>
      <section className="section-block activity-block" id="activity"><div className="section-heading"><div><small>AUDIT TRAIL</small><h2>Recent Activity</h2></div><span>{history.length ? `${history.length} EVENTS` : "NO EVENTS"}</span></div>{history.length ? <div className="activity-list">{history.slice(0, 5).map((item, index) => <div className="activity-item" key={`${item.timestamp}-${index}`}><i></i><div><strong>{item.action}</strong><small>{item.details}</small></div><time>{item.timestamp}</time></div>)}</div> : <div className="empty-activity"><span>✓</span><div><strong>No recent administrative activity.</strong><small>Vendor and application updates will appear here.</small></div></div>}</section>
      <div id="admin-tools" className="dashboard-footer"><span>ALASKA AIRLINES · PRODUCTION OPERATIONS</span><span>SECURE ADMINISTRATIVE ACCESS</span></div>
    </section>
    {editing && <VendorEditor vendor={editing} onClose={() => setEditing(null)} onSave={saveVendor} />}
    {editingApplication && <ApplicationEditor application={editingApplication} onClose={() => setEditingApplication(null)} onSave={saveApplication} />}
    {changingPassword && <PasswordEditor onClose={() => setChangingPassword(false)} />}
  </main>;
}

export default App;
