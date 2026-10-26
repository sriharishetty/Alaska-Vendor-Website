(function () {
    "use strict";

    const records = (window.masterData && window.masterData.applications) || {};

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
            logoVariant: "logo-wam",
            monogram: "WAM"
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
            logoVariant: "logo-jp",
            monogram: "JP"
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
            logoVariant: "logo-s4a",
            monogram: "S4A"
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
            logoVariant: "logo-jcte",
            monogram: "JT"
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
            logoVariant: "logo-airtrack",
            monogram: "AT"
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
            logoVariant: "logo-pb",
            monogram: "PB"
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
            logoVariant: "logo-am",
            monogram: "AM"
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
            logoVariant: "logo-aims",
            monogram: "AIMS"
        }
    };

    const applications = (window.groundStopApplicationKeys || Object.keys(CARD_PROFILES))
        .map(key => {
            const rawRecord = records[key] || Object.values(records).find(app => app.id === key) || {};
            const profile = CARD_PROFILES[key] || {};
            return {
                key,
                profile,
                record: {
                    ...rawRecord,
                    name: rawRecord.name || profile.shortName || key,
                    category: profile.category || rawRecord.category,
                    description: profile.description || rawRecord.description || rawRecord.function,
                    vendor: (!rawRecord.vendor || /^(?:n\/?a|none|tbd)$/i.test(String(rawRecord.vendor).trim()))
                        ? profile.vendor
                        : rawRecord.vendor,
                    aagPOC: (!rawRecord.aagPOC || /^(?:n\/?a|none|tbd)$/i.test(String(rawRecord.aagPOC).trim()))
                        ? profile.poc
                        : rawRecord.aagPOC,
                    phone: (!rawRecord.phone || /^(?:n\/?a|none|tbd)$/i.test(String(rawRecord.phone).trim()))
                        ? profile.phone
                        : rawRecord.phone,
                    email: (!rawRecord.email || /^(?:n\/?a|none|tbd)$/i.test(String(rawRecord.email).trim()))
                        ? profile.email
                        : rawRecord.email,
                    aagTeam: (!rawRecord.aagTeam || /^(?:n\/?a|none|tbd)$/i.test(String(rawRecord.aagTeam).trim()))
                        ? profile.team
                        : rawRecord.aagTeam
                }
            };
        });

    const grid = document.getElementById("groundStopGrid");
    const totalStat = document.getElementById("groundStopTotalStat");
    const activeStat = document.getElementById("groundStopActiveStat");
    const highSeverityStat = document.getElementById("groundStopHighSeverityStat");
    const averageSlaStat = document.getElementById("groundStopAverageSlaStat");
    const searchInput = document.getElementById("groundStopSearch");
    const appFilter = document.getElementById("groundStopAppFilter");
    const statusFilter = document.getElementById("groundStopStatusFilter");
    const severityFilter = document.getElementById("groundStopSeverityFilter");
    const clearFiltersBtn = document.getElementById("groundStopClearFilters");
    const emptyState = document.getElementById("groundStopEmpty");

    const dialog = document.getElementById("groundStopDialog");
    const dialogLogoWrap = document.getElementById("groundStopDialogLogoWrap");
    const dialogTitle = document.getElementById("groundStopDialogTitle");
    const dialogDescription = document.getElementById("groundStopDialogDescription");
    const dialogSeverity = document.getElementById("groundStopSeverity");
    const dialogStatus = document.getElementById("groundStopStatus");
    const dialogBody = document.getElementById("groundStopDialogBody");
    const dialogClose = document.getElementById("groundStopDialogClose");
    const emailAction = document.getElementById("groundStopEmailAction");
    const callAction = document.getElementById("groundStopCallAction");
    const favoriteAction = document.getElementById("groundStopFavoriteAction");
    const tabs = dialog ? [...dialog.querySelectorAll("[data-detail-tab]")] : [];

    const favoriteKeys = [
        "favorites",
        "productionOperationsFavorites",
        "favoriteApplications",
        "productionOpsGroundStopFavorites"
    ];

    let selectedApplication = null;
    let lastTrigger = null;
    let previousBodyOverflow = "";

    const documentTypes = [
        ["Application Support Guide", ["applicationSupportGuideUrl", "supportGuideUrl"]],
        ["Escalation Procedure", ["escalationProcedureUrl", "escalationUrl"]],
        ["Operational Runbook", ["operationalRunbookUrl", "runbookUrl"]],
        ["Vendor Support Information", ["vendorSupportUrl", "supportInformationUrl"]]
    ];

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function valueText(value) {
        if (Array.isArray(value)) return value.map(valueText).join("\n\n");
        if (value && typeof value === "object") return JSON.stringify(value, null, 2);
        return String(value ?? "").trim();
    }

    function present(value) {
        const text = valueText(value);
        return text && !/^(?:n\/?a|none)$/i.test(text) ? text : "Not specified";
    }

    function linkedText(value, type) {
        const text = valueText(value);
        const pattern = type === "email"
            ? /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
            : /\+?\d[\d\s().-]{5,}\d/g;
        let output = "";
        let position = 0;

        for (const match of text.matchAll(pattern)) {
            const matched = match[0];
            const index = match.index;
            const target = type === "email"
                ? `mailto:${matched}`
                : `tel:${matched.replace(/[^\d+]/g, "")}`;

            output += escapeHtml(text.slice(position, index));
            output += `<a href="${escapeHtml(target)}">${escapeHtml(matched)}</a>`;
            position = index + matched.length;
        }

        return output + escapeHtml(text.slice(position));
    }

    const HOME_APP_LOGOS = {
        "acars": `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 7 9 3 5 7l4 4"/>
                <path d="m17 11 4 4-4 4-4-4"/>
                <path d="m8 12 4 4 6-6-4-4Z"/>
                <path d="m16 8 3-3"/>
                <path d="M9 21a6 6 0 0 0-6-6"/>
            </svg>
        `,
        "wam": `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
            </svg>
        `,
        "jetplan": `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
        `,
        "Smart4Aviation (S4A)": `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
        `,
        "jcte": `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <path d="m9 10 1.5 1.5L14 8"/>
                <path d="M9 15h6"/>
            </svg>
        `,
        "airtrack": `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            </svg>
        `,
        "pilot-briefing": `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7"/>
            </svg>
        `,
        "aircraft-maintenance": `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
        `,
        "aims": `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 19v-5M12 19V9M18 19V5"/>
            </svg>
        `
    };

    function renderLogoBadge(key) {
        const profile = CARD_PROFILES[key] || {};
        const variant = profile.logoVariant || "logo-jp";
        const svgIcon = HOME_APP_LOGOS[key] || HOME_APP_LOGOS["acars"];

        return `
            <div class="gs-card-logo ${escapeHtml(variant)}" aria-hidden="true">
                ${svgIcon}
            </div>
        `;
    }

    function renderSlaIcon(type) {
        if (type === "phone") {
            return `
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 16.92v2.5a1.8 1.8 0 0 1-1.96 1.8 17.8 17.8 0 0 1-7.76-2.76 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 4.12 5.26 1.8 1.8 0 0 1 5.91 3.3h2.5a1.8 1.8 0 0 1 1.8 1.55c.11.85.32 1.68.62 2.48a1.8 1.8 0 0 1-.41 1.9l-1.06 1.06a14.4 14.4 0 0 0 5.4 5.4l1.06-1.06a1.8 1.8 0 0 1 1.9-.41c.8.3 1.63.51 2.48.62A1.8 1.8 0 0 1 22 16.92z"/>
                </svg>
            `;
        }
        return `
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3v3m0 12v3M4.93 4.93l2.12 2.12m9.9 9.9 2.12 2.12M3 12h3m12 0h3M4.93 19.07l2.12-2.12m9.9-9.9 2.12-2.12"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `;
    }

    function resolveCanonicalAppKey(rawVal) {
        if (!rawVal) return null;
        let val = rawVal;
        if (typeof val === "object") {
            if (val.type && String(val.type).toLowerCase() === "vendor") return null;
            val = val.id || val.applicationId || val.appId || val.key || val.name;
        }
        const str = String(val || "").trim();
        if (!str) return null;
        if (/^vendor:/i.test(str)) return null;
        const cleanStr = str.replace(/^app(?:lication)?:/i, "").trim().toLowerCase();
        if (!cleanStr) return null;

        const match = applications.find(app => {
            const candidates = [
                app.key,
                app.record && app.record.id,
                app.record && app.record.name,
                app.profile && app.profile.shortName
            ]
                .filter(Boolean)
                .map(x => String(x).toLowerCase());
            return candidates.includes(cleanStr);
        });
        return match ? match.key : null;
    }

    function getVendorOnlySet() {
        const set = new Set();
        try {
            const raw = JSON.parse(localStorage.getItem("productionOpsVendorFavorites") || "[]");
            if (Array.isArray(raw)) {
                raw.forEach(item => {
                    const id = typeof item === "object" && item !== null ? (item.id || item.sourceRow || item.name) : item;
                    if (id) set.add(String(id).replace(/^vendor:/i, "").trim().toLowerCase());
                });
            }
        } catch {
            // Ignore malformed storage
        }
        return set;
    }

    function favoriteValues() {
        const canonicalSet = new Set();
        const appOnlyKeys = ["productionOpsGroundStopFavorites", "favoriteApplications"];
        const sharedKeys = ["productionOperationsFavorites", "favorites"];
        const vendorOnlySet = getVendorOnlySet();

        let hasAppOnlyStore = false;
        appOnlyKeys.forEach(storageKey => {
            try {
                const raw = localStorage.getItem(storageKey);
                if (raw === null) return;
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) return;
                hasAppOnlyStore = true;
                parsed.forEach(item => {
                    const key = resolveCanonicalAppKey(item);
                    if (key) canonicalSet.add(key);
                });
            } catch {
                // Ignore invalid JSON
            }
        });

        sharedKeys.forEach(storageKey => {
            try {
                const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
                if (!Array.isArray(parsed)) return;
                parsed.forEach(item => {
                    if (typeof item === "string" && /^app(?:lication)?:/i.test(item.trim())) {
                        const key = resolveCanonicalAppKey(item);
                        if (key) canonicalSet.add(key);
                        return;
                    }
                    if (item && typeof item === "object" && String(item.type || "").toLowerCase() === "application") {
                        const key = resolveCanonicalAppKey(item);
                        if (key) canonicalSet.add(key);
                        return;
                    }
                    if (!hasAppOnlyStore) {
                        const rawStr = typeof item === "object" && item !== null
                            ? String(item.id || item.name || "").trim().toLowerCase()
                            : String(item || "").trim().toLowerCase();
                        if (rawStr && !vendorOnlySet.has(rawStr)) {
                            const key = resolveCanonicalAppKey(item);
                            if (key) canonicalSet.add(key);
                        }
                    }
                });
            } catch {
                // Ignore invalid JSON
            }
        });

        return [...canonicalSet];
    }

    function persistFavoriteApps(appKeys) {
        const uniqueAppKeys = [...new Set(appKeys.map(resolveCanonicalAppKey).filter(Boolean))];
        try {
            localStorage.setItem("productionOpsGroundStopFavorites", JSON.stringify(uniqueAppKeys));
            localStorage.setItem("favoriteApplications", JSON.stringify(uniqueAppKeys));

            let vendorIds = [];
            try {
                const rawVendors = JSON.parse(localStorage.getItem("productionOpsVendorFavorites") || "[]");
                if (Array.isArray(rawVendors)) {
                    vendorIds = rawVendors
                        .map(v => (typeof v === "object" && v !== null ? v.id || v.sourceRow : v))
                        .filter(Boolean)
                        .map(v => String(v).replace(/^vendor:/i, "").trim());
                }
            } catch {
                vendorIds = [];
            }

            const combinedTyped = [
                ...uniqueAppKeys.map(k => `app:${k}`),
                ...vendorIds.map(v => `vendor:${v}`)
            ];
            localStorage.setItem("productionOperationsFavorites", JSON.stringify(combinedTyped));
            localStorage.setItem("favorites", JSON.stringify(combinedTyped));
            window.dispatchEvent(new CustomEvent("favorites:updated"));
        } catch {
            // Ignore storage quota / access errors
        }
    }

    function isFavorite(application) {
        if (!application) return false;
        const favKeys = favoriteValues();
        return favKeys.includes(application.key);
    }

    function toggleFavorite(application) {
        if (!application) return false;
        const current = favoriteValues();
        const exists = current.includes(application.key);
        const updated = exists
            ? current.filter(k => k !== application.key)
            : [...current, application.key];
        persistFavoriteApps(updated);
        return !exists;
    }

    function updateDashboardStats() {
        if (totalStat) totalStat.textContent = String(applications.length || 9);
        if (activeStat) activeStat.textContent = String(applications.length || 9);
        if (highSeverityStat) highSeverityStat.textContent = "0";
        if (averageSlaStat) averageSlaStat.textContent = "15 min";
    }

    function populateFilterOptions() {
        if (!appFilter) return;
        const existing = appFilter.value;
        appFilter.innerHTML = `<option value="">All Applications</option>` +
            applications.map(({ key, profile, record }) => {
                const label = profile.shortName || record.name || key;
                return `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`;
            }).join("");
        appFilter.value = existing;
    }

    function searchableText(item) {
        const { record, profile } = item;
        return [
            profile.shortName,
            profile.category,
            profile.description,
            profile.vendor,
            profile.poc,
            profile.phone,
            profile.email,
            profile.team,
            record.name,
            record.function,
            record.description,
            record.category,
            record.vendor,
            record.phone,
            record.email,
            record.severity,
            record.aagTeam,
            record.supportModel
        ].map(valueText).join(" ").toLowerCase();
    }

    function updateFavoriteButton() {
        if (!favoriteAction) return;
        const favorite = selectedApplication && isFavorite(selectedApplication);
        favoriteAction.classList.toggle("active", Boolean(favorite));
        favoriteAction.innerHTML = favorite
            ? '<span aria-hidden="true">★</span><span>Remove from Favorites</span>'
            : '<span aria-hidden="true">☆</span><span>Add to Favorites</span>';
        favoriteAction.setAttribute("aria-pressed", String(Boolean(favorite)));
    }

    function setActionLink(link, value, type, label) {
        if (!link) return;
        const text = valueText(value);
        const pattern = type === "email"
            ? /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
            : /\+?\d[\d\s().-]{5,}\d/g;
        const targets = [...new Set(text.match(pattern) || [])];
        const href = targets.length
            ? `${type === "email" ? "mailto:" : "tel:"}${type === "email" ? targets.join(",") : targets[0].replace(/[^\d+]/g, "")}`
            : "";

        link.textContent = label;
        if (href) {
            link.href = href;
            link.removeAttribute("aria-disabled");
            link.removeAttribute("tabindex");
        } else {
            link.removeAttribute("href");
            link.setAttribute("aria-disabled", "true");
            link.setAttribute("tabindex", "-1");
        }
    }

    function detailsRows(entries) {
        return entries.map(([label, value]) => `
            <div class="ground-stop-info-row">
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(present(value))}</dd>
            </div>
        `).join("");
    }

    function overviewContent(app) {
        const record = app.record;

        return `
            <section class="ground-stop-detail-panel">
                <h3>Application Details</h3>
                <dl class="ground-stop-info-grid">${detailsRows([
                    ["Application Name", record.name],
                    ["Function", record.function || record.description],
                    ["Category", record.category],
                    ["Vendor", record.vendor],
                    ["Environment", record.environment]
                ])}</dl>
            </section>
            <section class="ground-stop-detail-panel">
                <h3>Severity &amp; Status</h3>
                <dl class="ground-stop-info-grid">${detailsRows([
                    ["Severity", record.severity],
                    ["Current Status", record.status],
                    ["Business Criticality", record.criticality],
                    ["Response Target", record.response || app.profile.sla],
                    ["Support Model", record.supportModel]
                ])}</dl>
            </section>
            <section class="ground-stop-detail-panel ground-stop-detail-panel-wide">
                <h3>Key Information</h3>
                <dl class="ground-stop-info-grid">${detailsRows([
                    ["Primary Vendor", record.vendor],
                    ["AAG ITS POC", record.aagPOC],
                    ["ITS Team", record.aagTeam],
                    ["Last Updated", record.lastUpdated || record.updatedDate || record.infoUpdatedDate]
                ])}</dl>
            </section>
        `;
    }

    function contactsContent(app) {
        const record = app.record;
        const rawVendor = valueText(record.vendor);
        const vendorDisplay = rawVendor && !/^(?:n\/?a|none|tbd)$/i.test(rawVendor)
            ? rawVendor
            : "Alaska ITS (Internal)";
        const email = present(record.email);
        const phone = present(record.phone);

        return `
            <section class="ground-stop-detail-panel ground-stop-detail-panel-wide">
                <h3>Operational Contacts</h3>
                <div class="ground-stop-contact-grid">
                    <article class="ground-stop-contact-card">
                        <h4>Vendor</h4>
                        <p>${escapeHtml(vendorDisplay)}</p>
                        <div><span>Vendor POC:</span> ${escapeHtml(present(record.vendorPOC))}</div>
                    </article>
                    <article class="ground-stop-contact-card">
                        <h4>AAG ITS POC</h4>
                        <p>${escapeHtml(present(record.aagPOC))}</p>
                        <div><span>ITS Team:</span> ${escapeHtml(present(record.aagTeam))}</div>
                    </article>
                    <article class="ground-stop-contact-card">
                        <h4>Phone</h4>
                        <p>${phone === "Not specified" ? escapeHtml(phone) : linkedText(phone, "phone")}</p>
                        <div><span>Call Note:</span> ${escapeHtml(present(record.phoneNote))}</div>
                    </article>
                    <article class="ground-stop-contact-card">
                        <h4>Email</h4>
                        <p>${email === "Not specified" ? escapeHtml(email) : linkedText(email, "email")}</p>
                        <div><span>Support Model:</span> ${escapeHtml(present(record.supportModel))}</div>
                    </article>
                </div>
            </section>
        `;
    }

    function supportContent(app) {
        const record = app.record;
        const escalationText = valueText(record.escalation);
        const slaEscalation = escalationText && escalationText.length <= 28
            ? escalationText
            : present(record.criticality || record.severity);
        const slaEscalationLabel = escalationText && escalationText.length <= 28
            ? "Escalation"
            : "Criticality";
        const slaEscalationSub = escalationText && escalationText.length <= 28
            ? "Recorded escalation target"
            : "Business criticality tier";
        const targets = [
            ["Severity", record.severity, "Recorded application severity"],
            ["Response", record.response || app.profile.sla, "Recorded response target"],
            ["Resolution", record.resolution, "Recorded resolution target"],
            [slaEscalationLabel, slaEscalation, slaEscalationSub]
        ];

        return `
            <section class="ground-stop-detail-panel ground-stop-detail-panel-wide">
                <h3>SLA &amp; Support Targets</h3>
                <div class="ground-stop-sla-grid">${targets.map(([label, value, description]) => `
                    <article class="ground-stop-sla-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(present(value))}</strong><small>${escapeHtml(description)}</small></article>
                `).join("")}</div>
            </section>
            <section class="ground-stop-detail-panel ground-stop-detail-panel-wide">
                <h3>Support Model</h3>
                <p class="ground-stop-full-text">${escapeHtml(present(record.supportModel))}</p>
                <p class="ground-stop-full-text ground-stop-support-description">${escapeHtml(present(record.supportDescription))}</p>
            </section>
        `;
    }

    function escalationContent(app) {
        const steps = app.record.escalationSteps;
        const procedure = valueText(app.record.escalation);

        if (Array.isArray(steps) && steps.length) {
            return `
                <section class="ground-stop-detail-panel ground-stop-detail-panel-wide">
                    <h3>Escalation Process</h3>
                    <ol class="ground-stop-escalation-list">${steps.map(step => `<li>${escapeHtml(valueText(step))}</li>`).join("")}</ol>
                    ${procedure && !/^(?:tbd|n\/?a)$/i.test(procedure) ? `<p class="ground-stop-full-text ground-stop-escalation-note">${escapeHtml(procedure)}</p>` : ""}
                </section>
            `;
        }

        return procedure && !/^(?:tbd|n\/?a)$/i.test(procedure)
            ? `<section class="ground-stop-detail-panel ground-stop-detail-panel-wide"><h3>Escalation Process</h3><p class="ground-stop-full-text">${escapeHtml(procedure)}</p></section>`
            : '<section class="ground-stop-detail-panel ground-stop-detail-panel-wide"><h3>Escalation Process</h3><p class="ground-stop-empty-message">Escalation procedure not available.</p></section>';
    }

    function documentContent(app) {
        const record = app.record;
        const rows = documentTypes.map(([title, keys]) => {
            const url = keys.map(k => record[k]).find(value => typeof value === "string" && value.trim());
            const validUrl = url && /^(?:https?:\/\/|\/|\.\.?\/)/i.test(url.trim());

            return `
                <div class="ground-stop-document-row">
                    <span class="ground-stop-document-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6m-6 4h6"/></svg></span>
                    <strong>${escapeHtml(title)}</strong>
                    ${validUrl ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open <span aria-hidden="true">→</span></a>` : '<span class="ground-stop-document-unavailable">Not available</span>'}
                </div>
            `;
        });

        return `<section class="ground-stop-detail-panel ground-stop-detail-panel-wide"><h3>Application Documents</h3><div class="ground-stop-document-list">${rows.join("")}</div></section>`;
    }

    function renderTab(tabName) {
        const content = {
            overview: overviewContent,
            contacts: contactsContent,
            support: supportContent,
            escalation: escalationContent,
            documents: documentContent
        }[tabName](selectedApplication);

        dialogBody.innerHTML = content;
        const activeTab = tabs.find(tab => tab.dataset.detailTab === tabName);
        if (activeTab) {
            dialogBody.setAttribute("aria-labelledby", activeTab.id);
        }
    }

    function activateTab(tab, moveFocus = false) {
        tabs.forEach(item => {
            const active = item === tab;
            item.setAttribute("aria-selected", String(active));
            item.tabIndex = active ? 0 : -1;
        });
        renderTab(tab.dataset.detailTab);
        if (moveFocus) tab.focus();
    }

    function renderCards() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const appVal = appFilter ? appFilter.value : "";
        const statusVal = statusFilter ? statusFilter.value.toLowerCase() : "";
        const severityVal = severityFilter ? severityFilter.value.toLowerCase() : "";

        const filtered = applications.filter(item => {
            if (appVal && item.key !== appVal) return false;

            if (statusVal) {
                const itemStatus = String(item.profile.status || item.record.status || "active").toLowerCase();
                if (statusVal === "active" && !/active|operational/i.test(itemStatus)) return false;
                if (statusVal === "operational" && !/operational|active/i.test(itemStatus)) return false;
            }

            if (severityVal) {
                const itemSeverity = String(item.profile.severity || item.record.severity || "").toLowerCase();
                if (!itemSeverity.includes(severityVal)) return false;
            }

            if (query && !searchableText(item).includes(query)) {
                return false;
            }

            return true;
        });

        const favKeys = favoriteValues();

        grid.innerHTML = filtered.map(({ key, profile, record }) => {
            const isEdited = Boolean(record.adminEdited);
            const title = (isEdited && (record.shortName || record.name)) || profile.shortName || record.name;
            const category = (isEdited && record.category) || profile.category || record.category || "Operations";
            const statusLabel = (isEdited && record.status) || profile.status || "Active";
            const slaLabel = (isEdited && record.response) || profile.sla || "15 min";
            const description = (isEdited && valueText(record.description)) || profile.description || valueText(record.description || record.function);
            const vendor = (isEdited && valueText(record.vendor)) || profile.vendor || valueText(record.vendor) || "Alaska ITS";
            const poc = (isEdited && valueText(record.aagPOC)) || profile.poc || valueText(record.aagPOC) || "On-Call Rotation";
            const phone = (isEdited && valueText(record.phone)) || profile.phone || "+1 800-553-9696";
            const email = (isEdited && valueText(record.email)) || profile.email || "support@alaskaair.com";
            const team = (isEdited && valueText(record.aagTeam)) || profile.team || valueText(record.aagTeam) || "ITS Flight Operations";
            const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
            const emailHref = `mailto:${email}`;
            const isFav = favKeys.includes(key);

            return `
            <article class="ground-stop-card" data-app-card-key="${escapeHtml(key)}">
                <header class="gs-card-header">
                    ${renderLogoBadge(key)}
                    <div class="gs-card-titles">
                        <h2 title="${escapeHtml(record.name || title)}">${escapeHtml(title)}</h2>
                        <span class="gs-category-pill">${escapeHtml(category)}</span>
                    </div>
                    <div class="gs-card-badges">
                        <span class="gs-status-pill">
                            <i class="gs-status-dot" aria-hidden="true"></i>
                            <span>${escapeHtml(statusLabel)}</span>
                        </span>
                        <span class="gs-sla-pill">
                            ${renderSlaIcon(profile.slaIcon)}
                            <span>SLA: ${escapeHtml(slaLabel)}</span>
                        </span>
                        <button
                            type="button"
                            class="gs-card-favorite ${isFav ? "active" : ""}"
                            data-fav-app-key="${escapeHtml(key)}"
                            aria-label="${isFav ? "Remove application from favorites" : "Add application to favorites"}"
                            aria-pressed="${isFav ? "true" : "false"}"
                            title="${isFav ? "Remove from Favorites" : "Add to Favorites"}"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9L12 2.5z"/></svg>
                        </button>
                    </div>
                </header>

                <p class="gs-card-description" title="${escapeHtml(description)}">${escapeHtml(description)}</p>

                <div class="gs-card-info-grid">
                    <div class="gs-info-cell">
                        <span class="gs-info-label">Vendor / Provider</span>
                        <strong class="gs-info-value" title="${escapeHtml(vendor)}">${escapeHtml(vendor)}</strong>
                    </div>
                    <div class="gs-info-cell gs-info-cell-right">
                        <span class="gs-info-label">ITS POC</span>
                        <strong class="gs-info-value" title="${escapeHtml(poc)}">${escapeHtml(poc)}</strong>
                    </div>

                    <div class="gs-contact-cell">
                        <span class="gs-contact-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                        </span>
                        <a href="${escapeHtml(phoneHref)}" class="gs-contact-phone" title="Call ${escapeHtml(phone)}">${escapeHtml(phone)}</a>
                    </div>
                    <div class="gs-contact-cell gs-contact-cell-right">
                        <span class="gs-contact-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                            </svg>
                        </span>
                        <a href="${escapeHtml(emailHref)}" class="gs-contact-email" title="Email ${escapeHtml(email)}">${escapeHtml(email)}</a>
                    </div>
                </div>

                <footer class="gs-card-footer">
                    <div class="gs-card-team" title="Responsible Team: ${escapeHtml(team)}">
                        <span class="gs-team-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                        </span>
                        <span>${escapeHtml(team)}</span>
                    </div>
                    <button type="button" class="ground-stop-details-button" data-app-key="${escapeHtml(key)}">
                        <span>View Details</span>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M5 12h14"/>
                            <path d="m13 6 6 6-6 6"/>
                        </svg>
                    </button>
                </footer>
            </article>
            `;
        }).join("");

        if (emptyState) {
            emptyState.hidden = filtered.length !== 0;
        }
    }

    function openDetails(key, trigger, initialTabName = "contacts") {
        selectedApplication = applications.find(item => item.key === key);
        if (!selectedApplication || !dialog) return;

        const record = selectedApplication.record;
        const severityText = present(record.severity);
        const severityClass = severityText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        lastTrigger = trigger;

        if (dialogLogoWrap) {
            dialogLogoWrap.innerHTML = renderLogoBadge(key);
        }

        dialogTitle.textContent = record.name || selectedApplication.profile.shortName || "Application";
        if (dialogDescription) {
            dialogDescription.textContent = "";
            dialogDescription.hidden = true;
        }
        dialogSeverity.textContent = severityText;
        dialogSeverity.className = `ground-stop-severity ${severityClass}`;
        dialogStatus.textContent = present(record.status);
        setActionLink(emailAction, record.email, "email", "Send Email");
        setActionLink(callAction, record.phone, "phone", "Call Support");
        const targetTab = tabs.find(tab => tab.dataset.detailTab === initialTabName) || tabs[0];
        if (targetTab) {
            activateTab(targetTab);
        }
        updateFavoriteButton();
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialog.showModal();
        if (targetTab) targetTab.focus();
    }

    grid.addEventListener("click", event => {
        const favBtn = event.target.closest("[data-fav-app-key]");
        if (favBtn) {
            event.stopPropagation();
            const targetKey = favBtn.dataset.favAppKey;
            const targetApp = applications.find(item => item.key === targetKey);
            if (targetApp) {
                toggleFavorite(targetApp);
                renderCards();
                if (selectedApplication && selectedApplication.key === targetKey) {
                    updateFavoriteButton();
                }
            }
            return;
        }

        if (event.target.closest("a")) {
            return;
        }

        const button = event.target.closest("[data-app-key]");
        if (button) {
            openDetails(button.dataset.appKey, button, button.dataset.openTab || "contacts");
            return;
        }

        const card = event.target.closest("[data-app-card-key]");
        if (card) {
            openDetails(card.dataset.appCardKey, card, "contacts");
        }
    });

    if (searchInput) searchInput.addEventListener("input", renderCards);
    if (appFilter) appFilter.addEventListener("change", renderCards);
    if (statusFilter) statusFilter.addEventListener("change", renderCards);
    if (severityFilter) severityFilter.addEventListener("change", renderCards);

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            if (appFilter) appFilter.value = "";
            if (statusFilter) statusFilter.value = "";
            if (severityFilter) severityFilter.value = "";
            renderCards();
        });
    }

    if (dialogClose) {
        dialogClose.addEventListener("click", () => dialog.close());
    }
    if (dialog) {
        dialog.addEventListener("click", event => {
            if (event.target === dialog) dialog.close();
        });

        dialog.addEventListener("close", () => {
            document.body.style.overflow = previousBodyOverflow;
            if (lastTrigger?.isConnected) lastTrigger.focus();
            selectedApplication = null;
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => activateTab(tab));
        tab.addEventListener("keydown", event => {
            const current = tabs.indexOf(tab);
            let next = null;
            if (event.key === "ArrowRight") next = tabs[(current + 1) % tabs.length];
            if (event.key === "ArrowLeft") next = tabs[(current - 1 + tabs.length) % tabs.length];
            if (event.key === "Home") next = tabs[0];
            if (event.key === "End") next = tabs[tabs.length - 1];
            if (next) {
                event.preventDefault();
                activateTab(next, true);
            }
        });
    });

    if (favoriteAction) {
        favoriteAction.addEventListener("click", () => {
            if (!selectedApplication) return;
            toggleFavorite(selectedApplication);
            updateFavoriteButton();
            renderCards();
        });
    }

    window.addEventListener("storage", () => {
        renderCards();
        if (selectedApplication) updateFavoriteButton();
    });
    window.addEventListener("focus", () => {
        renderCards();
        if (selectedApplication) updateFavoriteButton();
    });

    populateFilterOptions();
    updateDashboardStats();

    try {
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get("search");
        const appParam = params.get("application") || params.get("app");

        if (searchParam && searchInput) {
            searchInput.value = searchParam;
        }

        renderCards();

        if (appParam) {
            const normalized = appParam.trim().toLowerCase();
            const match = applications.find(item =>
                item.key.toLowerCase() === normalized ||
                String(item.record.id || "").toLowerCase() === normalized ||
                String(item.record.name || "").toLowerCase() === normalized ||
                String(item.profile.shortName || "").toLowerCase() === normalized
            );
            if (match) {
                openDetails(match.key, null);
            }
        }
    } catch (e) {
        renderCards();
    }
}());
