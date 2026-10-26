/* Vendor records are supplied exclusively by js/data/master-data.js. */

(function () {

    "use strict";

    const vendors = window.masterData.vendors;

    const vendorGrid =
        document.getElementById("vendorGrid");

    const vendorSearch =
        document.getElementById("vendorSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const teamFilter =
        document.getElementById("teamFilter");

    const statusFilter =
        document.getElementById("statusFilter");

    const vendorSortSelect =
        document.getElementById("vendorSortSelect");

    const vendorViewGrid =
        document.getElementById("vendorViewGrid");

    const vendorViewList =
        document.getElementById("vendorViewList");

    const vendorResultCount =
        document.getElementById("vendorResultCount");

    const noVendorResults =
        document.getElementById("noVendorResults");

    const clearVendorFilters =
        document.getElementById("clearVendorFilters");

    const vendorModal =
        document.getElementById("vendorModal");

    const vendorModalClose =
        document.getElementById("vendorModalClose");


    /* ========================================================
       MODAL ELEMENTS
       ======================================================== */

    const modalIcon =
        document.getElementById("vendorModalIcon");

    const modalTitle =
        document.getElementById("vendorModalTitle");

    const modalCompany =
        document.getElementById("vendorModalCompany");

    const modalSubtitle =
        document.getElementById("vendorModalSubtitle");

    const detailSystem =
        document.getElementById("detailSystem");

    const detailSupportedSystems =
        document.getElementById("detailSupportedSystems");

    const detailCategory =
        document.getElementById("detailCategory");

    const detailCompany =
        document.getElementById("detailCompany");

    const detailTeam =
        document.getElementById("detailTeam");

    const detailStatusSupport =
        document.getElementById("detailStatusSupport");

    const detailVendorPoc =
        document.getElementById("detailVendorPoc");

    const detailAagPoc =
        document.getElementById("detailAagPoc");

    const detailPhone =
        document.getElementById("detailPhone");

    const detailEmail =
        document.getElementById("detailEmail");

    const detailEscalation =
        document.getElementById("detailEscalation");

    const detailSourceRow =
        document.getElementById("detailSourceRow");

    const detailUpdatedDate =
        document.getElementById("detailUpdatedDate");

    const detailUpdatedBy =
        document.getElementById("detailUpdatedBy");

    const detailApprovedDate =
        document.getElementById("detailApprovedDate");

    const detailApprovedBy =
        document.getElementById("detailApprovedBy");

    const vendorEmailButton =
        document.getElementById("vendorEmailButton");

    const vendorCallButton =
        document.getElementById("vendorCallButton");

    const vendorFavoriteButton =
        document.getElementById("vendorFavoriteButton");

    const vendorCompanyCount =
        document.getElementById("vendorCompanyCount");

    const vendorContactCount =
        document.getElementById("vendorContactCount");

    const vendorEscalationCount =
        document.getElementById("vendorEscalationCount");


    let currentVendor = null;


    /* ========================================================
       HELPERS
       ======================================================== */

    function escapeHtml(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function displayValue(value) {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === "" || /^(?:n\/?a|tbd|none|no)$/i.test(String(value).trim())
        ) {
            return "Not specified";
        }

        return escapeHtml(value)
            .replace(/\n/g, "<br>");

    }


    function initials(value) {

        const text =
            String(value || "VENDOR")
                .trim();

        const words =
            text
                .replace(/[^A-Za-z0-9 ]/g, " ")
                .split(/\s+/)
                .filter(Boolean);

        if (!words.length) {
            return "V";
        }


        if (words.length === 1) {

            return words[0]
                .substring(0, 2)
                .toUpperCase();

        }

        return (
            words[0][0] +
            words[1][0]
        ).toUpperCase();

    }


    function vendorIcon(vendor) {

        const label = [
            vendor.company,
            vendor.vendor,
            vendor.displayName,
            vendor.category
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const icons = [
            '<path d="M4 20V5l8-2 8 2v15"></path><path d="M8 8h2m4 0h2M8 12h2m4 0h2M8 16h2m4 0h2"></path>',
            '<path d="M7 18h10a3.5 3.5 0 0 0 .4-7A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18Z"></path><path d="m8 21 1-1m4 1 1-1m4 1 1-1"></path>',
            '<path d="M4 8h16v12H4z"></path><path d="M8 8V5h8v3M8 12v4m8-4v4"></path>',
            '<path d="m2.5 12 7.1-1.1 3.1-6.7 1.8.5-1 6.6 4.1.2 4-2.2.8.6-2.8 2.8 2.8 2.8-.8.6-4-2.2-4.1.2 1 6.6-1.8.5-3.1-6.7L2.5 12Z"></path>',
            '<path d="M4 10a8 8 0 0 1 16 0"></path><path d="M7 10v6m10-6v6M5 16h3m8 0h3M9 20h6"></path>',
            '<rect x="4" y="5" width="16" height="14" rx="2"></rect><path d="M8 9h8M8 13h5m-5 3h3"></path>',
            '<circle cx="9" cy="8" r="3"></circle><path d="M3.5 19c.5-3.1 2.3-4.7 5.5-4.7s5 1.6 5.5 4.7M15 6a3 3 0 0 1 0 5.8M16 14.5c2.4.4 3.8 1.8 4.2 4.5"></path>',
            '<circle cx="12" cy="12" r="7"></circle><path d="M12 5v7l4 2"></path>',
            '<path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z"></path><path d="m8 10 4 2 4-2M8 14l4 2 4-2"></path>',
            '<path d="M5 5h14v14H5z"></path><path d="M8 9h8M8 12h8M8 15h5"></path>',
            '<path d="M4 18h16M6 18V8h12v10M9 8V5h6v3"></path>',
            '<path d="M12 3v4m0 10v4M3 12h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8m-7.2 7.2-2.8 2.8"></path><circle cx="12" cy="12" r="3"></circle>'
        ];

        const ordinal =
            Math.max(0, vendors.indexOf(vendor));

        let hash = ordinal;

        if (/(weather|wsi|rain|fusion)/.test(label)) {
            hash += 1;
        } else if (/(baggage|cargo|icargo|spot|nettracer)/.test(label)) {
            hash += 2;
        } else if (/(flight|aircraft|aerodata|boeing|avtec|jetplan|jeppesen)/.test(label)) {
            hash += 3;
        }

        const path = icons[hash % icons.length];
        const accentX = 4 + (ordinal % 7) * 2.6;
        const accentY = 4 + (Math.floor(ordinal / 7) % 6) * 3;
        const accentRadius = 0.8 + (ordinal % 3) * 0.25;

        return `<svg viewBox="0 0 24 24" aria-hidden="true">${path}<circle class="vendor-icon-accent" cx="${accentX}" cy="${accentY}" r="${accentRadius}"></circle></svg>`;

    }


    function uniqueSorted(values) {

        return [
            ...new Set(
                values
                    .map(value =>
                        String(value || "").trim()
                    )
                    .filter(Boolean)
            )
        ].sort(
            (a, b) =>
                a.localeCompare(b)
        );

    }


    function searchableText(vendor) {

        return [

            vendor.systemName,
            vendor.displayName,
            vendor.displaySubtitle,
            vendor.category,
            vendor.company || vendor.vendor,
            vendor.escalation,
            vendor.phone,
            vendor.email,
            vendor.vendorPoc,
            vendor.aagItsPoc,
            vendor.aagItsTeam

        ]
            .join(" ")
            .toLowerCase();

    }


    function usableCardValue(value) {
        const text = String(value || "").replace(/\s*[—–]\s*/g, " - ").trim();
        return text && !/^(?:n\/?a|tbd|none|no)$/i.test(text)
            ? text
            : "";
    }


    function cardContactSummary(value) {
        return (Array.isArray(value) ? value.join("\n") : String(value || ""))
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(usableCardValue)
            .join(" · ");
    }


    function formatPhoneHtml(phoneText) {
        if (!phoneText) {
            return '<span class="vendor-contact-missing">Phone not listed</span>';
        }
        return escapeHtml(phoneText).replace(
            /\(([^)]+)\)/g,
            '<span class="vendor-phone-note">($1)</span>'
        );
    }


    const verifiedVendorLogos = Object.freeze({});


    function vendorLogo(vendor, company) {
        const verifiedLogo = verifiedVendorLogos[String(vendor.id || "")];

        if (verifiedLogo) {
            return {
                src: verifiedLogo,
                alt: `${company} logo`
            };
        }

        const identity = company.toLocaleLowerCase();
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


    function contactTarget(value, type) {
        const text = Array.isArray(value) ? value.join("\n") : String(value || "");

        if (type === "email") {
            const addresses = [...new Set(
                text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []
            )];

            return addresses.length
                ? `mailto:${addresses.join(",")}`
                : "";
        }

        const numbers = text.match(/\+?\d[\d\s().-]{5,}\d/g) || [];
        const phone = numbers
            .map(number => number.trim())
            .find(number => number.replace(/\D/g, "").length >= 7);

        return phone
            ? `tel:${phone.replace(/[^\d+]/g, "")}`
            : "";
    }


    function companyName(vendor) {
        return usableCardValue(vendor.company) ||
            usableCardValue(vendor.vendor) ||
            usableCardValue(vendor.displayName) ||
            "Vendor";
    }


    function supportedSystems(vendor) {
        const company = companyName(vendor).toLocaleLowerCase();
        const systems = new Map();

        vendors.forEach(record => {
            if (companyName(record).toLocaleLowerCase() !== company) {
                return;
            }

            const system = usableCardValue(
                record.systemName || record.displayName
            );

            if (system) {
                systems.set(system.toLocaleLowerCase(), system);
            }
        });

        return [...systems.values()];
    }


    function supportedSystemCount(vendor) {
        return Math.max(supportedSystems(vendor).length, 1);
    }


    /* ========================================================
       FILTER OPTIONS
       ======================================================== */

    function populateFilters() {

        const categories =
            uniqueSorted(
                vendors.flatMap(vendor =>

                    String(
                        vendor.category || ""
                    )
                        .split("•")
                        .map(item =>
                            item.trim()
                        )

                )
            );


        const teams =
            uniqueSorted(
                vendors.map(vendor =>
                    vendor.aagItsTeam
                )
            );


        categories.forEach(category => {

            const option =
                document.createElement("option");

            option.value = category;

            option.textContent = category;

            categoryFilter.appendChild(
                option
            );

        });


        teams.forEach(team => {

            const option =
                document.createElement("option");

            option.value = team;

            option.textContent = team;

            teamFilter.appendChild(
                option
            );

        });

    }


    const FILTER_ICONS = {
        categories: '<svg class="vendor-filter-lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"/></svg>',
        teams: '<svg class="vendor-filter-lead-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5v.8h-13V19z"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.5c2.5.2 4.5 1.8 4.8 4.2v1.1h-4v-.8c0-1.7-.6-3.2-1.7-4.4.3-.1.6-.1.9-.1z"/></svg>',
        status: '<svg class="vendor-filter-lead-icon is-status" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="#16A34A" stroke-width="2.2"/><circle cx="12" cy="12" r="4.5" fill="#16A34A"/></svg>'
    };


    function setupCustomFilter(select) {
        if (!select) return;

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "vendor-filter-custom";

        select.parentNode.insertBefore(
            wrapper,
            select
        );

        wrapper.appendChild(select);

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "vendor-filter-trigger";

        button.setAttribute(
            "aria-haspopup",
            "listbox"
        );

        const iconType = select.dataset.filterIcon || "";
        const iconMarkup = FILTER_ICONS[iconType] || "";

        const menu =
            document.createElement("div");

        menu.className =
            "vendor-filter-menu";

        menu.setAttribute(
            "role",
            "listbox"
        );

        function syncSelection() {

            const selected =
                select.options[select.selectedIndex];

            const labelText = selected ? selected.textContent : "";

            button.innerHTML = `${iconMarkup}<span class="vendor-filter-trigger-text">${escapeHtml(labelText)}</span>`;

            menu
                .querySelectorAll("[role='option']")
                .forEach(function (option) {

                    const active =
                        option.dataset.value ===
                        select.value;

                    option.classList.toggle(
                        "selected",
                        active
                    );

                    option.setAttribute(
                        "aria-selected",
                        String(active)
                    );

                });

        }

        Array.from(select.options).forEach(
            function (option) {

                const item =
                    document.createElement("button");

                item.type =
                    "button";

                item.className =
                    "vendor-filter-option";

                item.dataset.value =
                    option.value;

                item.textContent =
                    option.textContent;

                item.setAttribute(
                    "role",
                    "option"
                );

                item.addEventListener(
                    "click",
                    function () {

                        select.value =
                            item.dataset.value;

                        select.dispatchEvent(
                            new Event("change", {
                                bubbles: true
                            })
                        );

                        wrapper.classList.remove(
                            "open"
                        );

                    }
                );

                menu.appendChild(item);

            }
        );

        button.addEventListener(
            "click",
            function () {

                const isOpen =
                    wrapper.classList.contains(
                        "open"
                    );

                document
                    .querySelectorAll(
                        ".vendor-filter-custom.open"
                    )
                    .forEach(function (item) {

                        item.classList.remove(
                            "open"
                        );

                    });

                if (!isOpen) {

                    wrapper.classList.add(
                        "open"
                    );

                }

            }
        );

        select.addEventListener(
            "change",
            syncSelection
        );

        wrapper.appendChild(button);
        wrapper.appendChild(menu);
        syncSelection();

        document.addEventListener(
            "click",
            function (event) {

                if (!wrapper.contains(event.target)) {

                    wrapper.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    /* ========================================================
       STATISTICS
       ======================================================== */

    function calculateStats() {

        const companies =
            new Set(

                vendors
                    .map(vendor =>
                        String(
                            vendor.company || vendor.vendor || ""
                        )
                            .replace(/\s+/g, " ")
                            .trim()
                    )
                    .filter(Boolean)

            );


        const contacts =
            vendors.filter(vendor =>

                vendor.phone ||
                vendor.email ||
                vendor.vendorPoc ||
                vendor.aagItsPoc

            ).length;


        const escalations =
            vendors.filter(vendor =>
                vendor.escalation
            ).length;

        const vendorRecordIconCount = document.getElementById("vendorRecordIconCount");
        const vendorRecordCount = document.getElementById("vendorRecordCount");
        const vendorRecordSubtext = document.getElementById("vendorRecordSubtext");
        const vendorDirectoryCount = document.getElementById("vendorDirectoryCount");

        if (vendorRecordIconCount) {
            vendorRecordIconCount.textContent = vendors.length;
        }
        if (vendorRecordCount) {
            vendorRecordCount.textContent = vendors.length;
        }
        if (vendorRecordSubtext) {
            vendorRecordSubtext.textContent = `Current count: ${vendors.length}`;
        }
        if (vendorDirectoryCount) {
            vendorDirectoryCount.textContent = `(${vendors.length})`;
        }

        if (vendorCompanyCount) {
            vendorCompanyCount.textContent =
                companies.size;
        }


        if (vendorContactCount) {
            vendorContactCount.textContent =
                contacts;
        }


        if (vendorEscalationCount) {
            vendorEscalationCount.textContent =
                escalations;
        }

    }


    /* ========================================================
       RENDER VENDOR CARDS
       ======================================================== */

    function renderVendors() {

        const query =
            vendorSearch.value
                .trim()
                .toLowerCase();


        const selectedCategory =
            categoryFilter.value;


        const selectedTeam =
            teamFilter.value;

        const selectedStatus =
            statusFilter ? statusFilter.value : "";

        const sortMode =
            vendorSortSelect ? vendorSortSelect.value : "default";

        const favoriteIds = getFavorites();


        const filtered =
            vendors.filter(vendor => {

                const matchesSearch =
                    !query ||
                    searchableText(vendor)
                        .includes(query);


                const categoryParts =
                    String(
                        vendor.category || ""
                    )
                        .split("•")
                        .map(item =>
                            item.trim()
                        );


                const matchesCategory =
                    !selectedCategory ||
                    categoryParts.includes(
                        selectedCategory
                    );


                const matchesTeam =
                    !selectedTeam ||
                    vendor.aagItsTeam ===
                    selectedTeam;

                let matchesStatus = true;
                if (selectedStatus === "Escalation") {
                    matchesStatus = Boolean(usableCardValue(vendor.escalation));
                } else if (selectedStatus === "Active" || selectedStatus === "24x7") {
                    matchesStatus = true;
                }


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesTeam &&
                    matchesStatus
                );

            });

        if (sortMode === "name-asc") {
            filtered.sort((a, b) => companyName(a).localeCompare(companyName(b)));
        } else if (sortMode === "name-desc") {
            filtered.sort((a, b) => companyName(b).localeCompare(companyName(a)));
        } else if (sortMode === "system-asc") {
            filtered.sort((a, b) =>
                String(a.systemName || a.displayName || "").localeCompare(
                    String(b.systemName || b.displayName || "")
                )
            );
        } else if (sortMode === "team-asc") {
            filtered.sort((a, b) =>
                String(a.aagItsTeam || "").localeCompare(String(b.aagItsTeam || ""))
            );
        }


        vendorGrid.innerHTML = "";


        filtered.forEach(
            vendor => {

                const originalIndex =
                    vendors.indexOf(vendor);


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "vendor-card";
                card.dataset.index = String(originalIndex);


                const company = companyName(vendor);
                const systemCount = supportedSystemCount(vendor);
                const logo = vendorLogo(vendor, company);
                const systemName = usableCardValue(
                    vendor.systemName || vendor.displayName
                );
                const systemSubtitle = usableCardValue(vendor.displaySubtitle);
                const categoryLabel = usableCardValue(vendor.category)
                    ? String(vendor.category).split("•")[0].trim()
                    : "Operations Partner";
                const primaryContact = cardContactSummary(
                    usableCardValue(vendor.vendorPoc) ||
                    usableCardValue(vendor.aagItsPoc)
                );
                const phone = cardContactSummary(vendor.phone);
                const email = cardContactSummary(vendor.email);
                const phoneTarget = contactTarget(vendor.phone, "phone");
                const emailTarget = contactTarget(vendor.email, "email");
                const team = usableCardValue(vendor.aagItsTeam) ||
                    usableCardValue(vendor.category) ||
                    "Department not listed";
                const vendorKey = vendor.id || String(vendor.sourceRow);
                const isFav = favoriteIds.includes(vendorKey);
                const fullSystemLabel = systemName || systemSubtitle || "Operational System";

                card.innerHTML = `
                    <header class="vendor-card-header">
                        <div class="vendor-logo-frame">
                            <img class="vendor-logo" src="${logo.src}" alt="${escapeHtml(logo.alt)}" loading="lazy">
                        </div>
                        <div class="vendor-card-heading">
                            <h3 class="vendor-company-name" title="${escapeHtml(company)}">
                                ${escapeHtml(company)}
                            </h3>
                            <div class="vendor-card-submeta">
                                <span class="vendor-category-pill" title="${escapeHtml(categoryLabel)}">${escapeHtml(categoryLabel)}</span>
                                <span class="vendor-system-count" aria-label="${systemCount} supported ${systemCount === 1 ? "system" : "systems"}">
                                    <span class="vendor-system-count-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="7" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="7" height="6.5" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="6.5" rx="1.2"/></svg></span>
                                    <strong>${systemCount}</strong>
                                    <span>${systemCount === 1 ? "System" : "Systems"}</span>
                                </span>
                            </div>
                        </div>
                        <div class="vendor-card-badges" aria-label="Vendor status and favorite">
                            <span class="vendor-status-badge vendor-status-badge-status active"><i aria-hidden="true"></i>Active</span>
                            <button class="vendor-card-favorite ${isFav ? "active" : ""}" type="button" data-vendor-id="${escapeHtml(vendorKey)}" aria-label="${isFav ? "Remove vendor from favorites" : "Add vendor to favorites"}" title="${isFav ? "Remove from Favorites" : "Add to Favorites"}">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9L12 2.5z"/></svg>
                            </button>
                        </div>
                    </header>

                    <section class="vendor-system-box" aria-label="Supported system and SLA">
                        <span class="vendor-system-box-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
                        </span>
                        <div class="vendor-system-box-copy">
                            <span class="vendor-card-label">SUPPORTED SYSTEM</span>
                            <p class="vendor-system-summary" title="${escapeHtml(fullSystemLabel)}">
                                ${escapeHtml(fullSystemLabel)}
                            </p>
                        </div>
                        <span class="vendor-status-badge vendor-status-badge-availability"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></svg>24x7</span>
                    </section>

                    <div class="vendor-card-contacts" aria-label="Vendor contact details">
                        <div class="vendor-contact-line">
                            <span class="vendor-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.4-4 2.7-6 7-6s6.6 2 7 6"/></svg></span>
                            <span class="vendor-contact-key">POC</span>
                            <span class="vendor-contact-val" title="${escapeHtml(primaryContact || "No primary contact listed")}">${primaryContact ? escapeHtml(primaryContact) : '<span class="vendor-contact-missing">No primary contact listed</span>'}</span>
                        </div>
                        <div class="vendor-contact-line">
                            <span class="vendor-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L7 9.2a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 2 2.3Z"/></svg></span>
                            <span class="vendor-contact-key">Phone</span>
                            ${phoneTarget ? `<a class="vendor-contact-val vendor-contact-phone" href="${escapeHtml(phoneTarget)}" title="${escapeHtml(phone || "Call vendor")}">${formatPhoneHtml(phone)}</a>` : `<span class="vendor-contact-val vendor-contact-phone">${formatPhoneHtml(phone)}</span>`}
                        </div>
                        <div class="vendor-contact-line">
                            <span class="vendor-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg></span>
                            <span class="vendor-contact-key">Email</span>
                            ${emailTarget ? `<a class="vendor-contact-val vendor-contact-link" href="${escapeHtml(emailTarget)}" title="${escapeHtml(email || "Email vendor")}">${email ? escapeHtml(email) : "Email vendor"}</a>` : `<span class="vendor-contact-val">${email ? escapeHtml(email) : '<span class="vendor-contact-missing">Email not listed</span>'}</span>`}
                        </div>
                        <div class="vendor-contact-line">
                            <span class="vendor-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.4-2.8 2.4-4.3 5.5-4.3s5.1 1.5 5.5 4.3"/><circle cx="16.5" cy="9.5" r="2.3"/><path d="M16 14.8c2.1.2 3.7 1.4 4 3.7"/></svg></span>
                            <span class="vendor-contact-key">ITS Team</span>
                            <span class="vendor-contact-val vendor-contact-team" title="${escapeHtml(team)}">${escapeHtml(team)}</span>
                        </div>
                    </div>

                    <footer class="vendor-card-footer">
                        <button class="vendor-view vendor-btn-details" type="button" data-index="${originalIndex}">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                            <span>View Details</span>
                        </button>
                        <button class="vendor-contact-btn vendor-btn-contact" type="button" data-index="${originalIndex}" data-email-target="${escapeHtml(emailTarget)}" data-phone-target="${escapeHtml(phoneTarget)}">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>
                            <span>Contact</span>
                        </button>
                    </footer>
                `;


                vendorGrid.appendChild(card);

            }
        );


        const rangeLabel = filtered.length > 0
            ? `Showing 1 – ${filtered.length} of ${vendors.length} vendor records`
            : `Showing 0 of ${vendors.length} vendor records`;

        vendorResultCount.textContent = rangeLabel;


        vendorGrid.hidden =
            filtered.length === 0;

        noVendorResults.hidden =
            filtered.length !== 0;

    }


    /* ========================================================
       OPEN VENDOR MODAL
       ======================================================== */

    function openVendorModal(vendor, initialTab) {

        currentVendor = vendor;


        modalIcon.innerHTML =
            vendorIcon(vendor);


        modalTitle.textContent =
            vendor.displayName ||
            "Vendor";


        modalCompany.textContent =
            vendor.company || vendor.vendor ||
            "";


        modalSubtitle.textContent =
            vendor.displaySubtitle ||
            "Production Operations vendor information";


        detailSystem.innerHTML =
            displayValue(
                vendor.systemName ||
                vendor.displayName
            );


        detailSupportedSystems.innerHTML =
            displayValue(
                supportedSystems(vendor).join("\n")
            );


        detailStatusSupport.innerHTML =
            displayValue([
                vendor.status,
                vendor.supportAvailability || vendor.supportSchedule || vendor.supportHours
            ].filter(Boolean).join("\n") || "No status or support schedule recorded.");


        detailCategory.innerHTML =
            displayValue(
                vendor.category
            );


        detailCompany.innerHTML =
            displayValue(
                vendor.company || vendor.vendor
            );


        detailTeam.innerHTML =
            displayValue(
                vendor.aagItsTeam
            );


        detailVendorPoc.innerHTML =
            displayValue(
                vendor.vendorPoc
            );


        detailAagPoc.innerHTML =
            displayValue(
                vendor.aagItsPoc
            );


        detailPhone.innerHTML =
            displayValue(
                vendor.phone
            );


        detailEmail.innerHTML =
            displayValue(
                vendor.email
            );


        detailEscalation.innerHTML =
            displayValue(
                vendor.escalation
            );


        detailSourceRow.innerHTML =
            displayValue(
                vendor.sourceRow
            );


        detailUpdatedDate.innerHTML =
            displayValue(
                vendor.updatedDate
            );


        detailUpdatedBy.innerHTML =
            displayValue(
                vendor.updatedBy
            );


        detailApprovedDate.innerHTML =
            displayValue(
                vendor.approvedDate
            );


        detailApprovedBy.innerHTML =
            displayValue(
                vendor.approvedBy
            );


        vendorModal.classList.add(
            "active"
        );


        vendorModal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";


        resetModalTabs(initialTab || "overview");

        updateFavoriteButton();

    }


    /* ========================================================
       CLOSE MODAL
       ======================================================== */

    function closeVendorModal() {

        vendorModal.classList.remove(
            "active"
        );


        vendorModal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";


        currentVendor = null;

    }


    /* ========================================================
       MODAL TABS
       ======================================================== */

    function resetModalTabs(activeTabName) {
        const targetTab = activeTabName || "overview";

        document
            .querySelectorAll(
                ".vendor-modal-tab"
            )
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.tab === targetTab
                );

            });


        document
            .querySelectorAll(
                ".vendor-tab-panel"
            )
            .forEach(panel => {

                panel.classList.toggle(
                    "active",
                    panel.dataset.panel === targetTab
                );

            });

    }


    document
        .querySelectorAll(
            ".vendor-modal-tab"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const tab =
                        this.dataset.tab;


                    document
                        .querySelectorAll(
                            ".vendor-modal-tab"
                        )
                        .forEach(item => {

                            item.classList.toggle(
                                "active",
                                item === this
                            );

                        });


                    document
                        .querySelectorAll(
                            ".vendor-tab-panel"
                        )
                        .forEach(panel => {

                            panel.classList.toggle(
                                "active",
                                panel.dataset.panel ===
                                tab
                            );

                        });

                }
            );

        });


    /* ========================================================
       CARD CLICK
       ======================================================== */

    vendorGrid.addEventListener(
        "click",
        function (event) {

            const favBtn =
                event.target.closest(
                    ".vendor-card-favorite"
                );

            if (favBtn) {
                event.stopPropagation();
                const vendorId = favBtn.dataset.vendorId;
                if (vendorId) {
                    const favorites = getFavorites();
                    const idx = favorites.indexOf(vendorId);
                    if (idx === -1) {
                        favorites.push(vendorId);
                    } else {
                        favorites.splice(idx, 1);
                    }
                    saveFavorites(favorites);
                    renderVendors();
                }
                return;
            }

            if (event.target.closest("a")) {
                return;
            }

            const contactBtn =
                event.target.closest(
                    ".vendor-contact-btn"
                );

            if (contactBtn) {
                event.stopPropagation();
                const index = Number(contactBtn.dataset.index);
                if (!Number.isNaN(index) && vendors[index]) {
                    openVendorModal(vendors[index], "contacts");
                }
                return;
            }

            const button =
                event.target.closest(
                    ".vendor-view"
                );

            const card =
                event.target.closest(
                    ".vendor-card"
                );

            const targetEl = button || card;

            if (!targetEl) {
                return;
            }

            const index =
                Number(
                    targetEl.dataset.index
                );

            if (
                !Number.isNaN(index) &&
                vendors[index]
            ) {

                openVendorModal(
                    vendors[index]
                );

            }

        }
    );


    /* ========================================================
       SEARCH, FILTERS & VIEW TOGGLE
       ======================================================== */

    vendorSearch.addEventListener(
        "input",
        renderVendors
    );


    categoryFilter.addEventListener(
        "change",
        renderVendors
    );


    teamFilter.addEventListener(
        "change",
        renderVendors
    );

    if (statusFilter) {
        statusFilter.addEventListener("change", renderVendors);
    }

    if (vendorSortSelect) {
        vendorSortSelect.addEventListener("change", renderVendors);
    }

    if (vendorViewGrid && vendorViewList) {
        vendorViewGrid.addEventListener("click", function () {
            vendorGrid.classList.remove("list-view");
            vendorViewGrid.classList.add("active");
            vendorViewGrid.setAttribute("aria-pressed", "true");
            vendorViewList.classList.remove("active");
            vendorViewList.setAttribute("aria-pressed", "false");
        });

        vendorViewList.addEventListener("click", function () {
            vendorGrid.classList.add("list-view");
            vendorViewList.classList.add("active");
            vendorViewList.setAttribute("aria-pressed", "true");
            vendorViewGrid.classList.remove("active");
            vendorViewGrid.setAttribute("aria-pressed", "false");
        });
    }


    /* ========================================================
       CLEAR FILTERS
       ======================================================== */

    clearVendorFilters.addEventListener(
        "click",
        function () {

            vendorSearch.value = "";

            categoryFilter.value = "";

            teamFilter.value = "";

            if (statusFilter) {
                statusFilter.value = "";
                statusFilter.dispatchEvent(new Event("change"));
            }

            if (vendorSortSelect) {
                vendorSortSelect.value = "default";
            }

            categoryFilter.dispatchEvent(
                new Event("change")
            );

            teamFilter.dispatchEvent(
                new Event("change")
            );

            renderVendors();

        }
    );


    /* ========================================================
       CLOSE MODAL
       ======================================================== */

    vendorModalClose.addEventListener(
        "click",
        closeVendorModal
    );


    vendorModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                vendorModal
            ) {

                closeVendorModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                vendorModal.classList.contains(
                    "active"
                )
            ) {

                closeVendorModal();

            }

        }
    );


    /* ========================================================
       EMAIL
       ======================================================== */

    vendorEmailButton.addEventListener(
        "click",
        function () {

            if (
                currentVendor &&
                currentVendor.email &&
                currentVendor.email !== "No"
            ) {

                window.location.href =
                    "mailto:" +
                    currentVendor.email;

            }

        }
    );


    /* ========================================================
       PHONE
       ======================================================== */

    vendorCallButton.addEventListener(
        "click",
        function () {

            if (
                currentVendor &&
                currentVendor.phone &&
                currentVendor.phone !== "No"
            ) {

                const phone =
                    currentVendor.phone
                        .match(
                            /\+?\d[\d\s().-]{6,}/
                        );


                if (phone) {

                    window.location.href =
                        "tel:" +
                        phone[0]
                            .replace(
                                /[^0-9+]/g,
                                ""
                            );

                }

            }

        }
    );


    /* ========================================================
       FAVORITES
       ======================================================== */

    function resolveCanonicalVendorId(rawVal) {
        if (!rawVal) return null;
        let val = rawVal;
        if (typeof val === "object") {
            if (val.type && String(val.type).toLowerCase() === "application") return null;
            val = val.id || val.sourceRow || val.name;
        }
        const str = String(val || "").trim();
        if (!str) return null;
        if (/^app(?:lication)?:/i.test(str)) return null;
        const cleanStr = str.replace(/^vendor:/i, "").trim().toLowerCase();
        if (!cleanStr) return null;

        const vendor = vendors.find(function (candidate) {
            return (
                String(candidate.id || "").toLowerCase() === cleanStr ||
                String(candidate.sourceRow || "").toLowerCase() === cleanStr ||
                String(candidate.displayName || "").toLowerCase() === cleanStr
            );
        });
        return vendor ? (vendor.id || String(vendor.sourceRow)) : null;
    }

    function getAppOnlySet() {
        const set = new Set();
        ["productionOpsGroundStopFavorites", "favoriteApplications"].forEach(function (storageKey) {
            try {
                const raw = JSON.parse(localStorage.getItem(storageKey) || "[]");
                if (Array.isArray(raw)) {
                    raw.forEach(function (item) {
                        const id = typeof item === "object" && item !== null ? (item.id || item.key || item.name) : item;
                        if (id) set.add(String(id).replace(/^app(?:lication)?:/i, "").trim().toLowerCase());
                    });
                }
            } catch (e) {
                // Ignore
            }
        });
        return set;
    }

    function getFavorites() {
        const result = [];
        const appOnlySet = getAppOnlySet();
        let hasVendorOnlyStore = false;

        try {
            const rawVendorFavs = localStorage.getItem("productionOpsVendorFavorites");
            if (rawVendorFavs !== null) {
                const parsed = JSON.parse(rawVendorFavs);
                if (Array.isArray(parsed)) {
                    hasVendorOnlyStore = true;
                    parsed.forEach(function (item) {
                        const vendorId = resolveCanonicalVendorId(item);
                        if (vendorId && !result.includes(vendorId)) {
                            result.push(vendorId);
                        }
                    });
                }
            }
        } catch (e) {
            // Ignore
        }

        ["productionOperationsFavorites", "favorites"].forEach(function (storageKey) {
            try {
                const saved = JSON.parse(localStorage.getItem(storageKey)) || [];
                if (!Array.isArray(saved)) return;

                saved.forEach(function (item) {
                    if (typeof item === "string" && /^vendor:/i.test(item.trim())) {
                        const vendorId = resolveCanonicalVendorId(item);
                        if (vendorId && !result.includes(vendorId)) {
                            result.push(vendorId);
                        }
                        return;
                    }
                    if (item && typeof item === "object" && String(item.type || "").toLowerCase() === "vendor") {
                        const vendorId = resolveCanonicalVendorId(item);
                        if (vendorId && !result.includes(vendorId)) {
                            result.push(vendorId);
                        }
                        return;
                    }
                    if (!hasVendorOnlyStore) {
                        const rawStr = typeof item === "object" && item !== null
                            ? String(item.id || item.sourceRow || item.name || "").trim().toLowerCase()
                            : String(item || "").trim().toLowerCase();
                        if (rawStr && !appOnlySet.has(rawStr)) {
                            const vendorId = resolveCanonicalVendorId(item);
                            if (vendorId && !result.includes(vendorId)) {
                                result.push(vendorId);
                            }
                        }
                    }
                });
            } catch (error) {
                // Ignore storage parse error
            }
        });

        return result;
    }


    function saveFavorites(favorites) {
        const uniqueVendorIds = [...new Set(favorites.map(resolveCanonicalVendorId).filter(Boolean))];
        try {
            localStorage.setItem("productionOpsVendorFavorites", JSON.stringify(uniqueVendorIds));

            let appKeys = [];
            try {
                const rawApps = JSON.parse(localStorage.getItem("productionOpsGroundStopFavorites") || localStorage.getItem("favoriteApplications") || "[]");
                if (Array.isArray(rawApps)) {
                    appKeys = rawApps
                        .map(function (a) { return typeof a === "object" && a !== null ? (a.id || a.key || a.name) : a; })
                        .filter(Boolean)
                        .map(function (a) { return String(a).replace(/^app(?:lication)?:/i, "").trim(); });
                }
            } catch (e) {
                appKeys = [];
            }

            const combinedTyped = appKeys.map(function (k) { return "app:" + k; })
                .concat(uniqueVendorIds.map(function (v) { return "vendor:" + v; }));

            localStorage.setItem("productionOperationsFavorites", JSON.stringify(combinedTyped));
            localStorage.setItem("favorites", JSON.stringify(combinedTyped));
            window.dispatchEvent(new CustomEvent("favorites:updated"));
        } catch (e) {
            // Ignore
        }
    }


    function updateFavoriteButton() {

        if (!currentVendor) {
            return;
        }


        const favorites =
            getFavorites();


        const key =
            currentVendor.id ||
            String(
                currentVendor.sourceRow
            );


        const isFavorite =
            favorites.includes(key);


        vendorFavoriteButton.classList.toggle(
            "active",
            isFavorite
        );


        vendorFavoriteButton.textContent =
            isFavorite
                ? "★ Remove from Favorites"
                : "☆ Add to Favorites";

    }


    vendorFavoriteButton.addEventListener(
        "click",
        function () {

            if (!currentVendor) {
                return;
            }


            const favorites =
                getFavorites();


            const key =
                currentVendor.id ||
                String(
                    currentVendor.sourceRow
                );


            const index =
                favorites.indexOf(key);


            if (index === -1) {

                favorites.push(key);

            } else {

                favorites.splice(
                    index,
                    1
                );

            }


            saveFavorites(
                favorites
            );


            updateFavoriteButton();
            renderVendors();

        }
    );


    /* ========================================================
       INITIALIZE
       ======================================================== */

    populateFilters();
    setupCustomFilter(categoryFilter);
    setupCustomFilter(teamFilter);
    setupCustomFilter(statusFilter);

    calculateStats();

    try {
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get("search");
        const vendorParam = params.get("vendor");

        if (searchParam && vendorSearch) {
            vendorSearch.value = searchParam;
        }

        renderVendors();

        if (vendorParam) {
            const targetVendor = vendors.find(function (v) {
                return (
                    String(v.id).toLowerCase() === vendorParam.toLowerCase() ||
                    String(v.sourceRow) === vendorParam ||
                    String(v.displayName || "").toLowerCase() === vendorParam.toLowerCase() ||
                    String(v.company || v.vendor || "").toLowerCase() === vendorParam.toLowerCase()
                );
            });
            if (targetVendor) {
                openVendorModal(targetVendor);
            }
        }
    } catch (e) {
        renderVendors();
    }

    window.addEventListener("storage", function (event) {
        if (
            !event.key ||
            event.key === FAVORITES_STORAGE_KEY ||
            event.key === "productionOperationsFavorites" ||
            event.key === "favorites"
        ) {
            updateFavoriteButton();
            renderVendors();
        }
    });

    window.addEventListener("focus", function () {
        updateFavoriteButton();
        renderVendors();
    });

})();
