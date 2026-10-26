/* Keep sidebar navigation, branding, icons, and Vendors & Partners dropdown synchronized across all pages. */
(() => {
    const normalizePath = pathname => pathname.replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();

    const ICONS = {
        home: '<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
        vendors: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        categories: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
        directory: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
        favorites: '<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/></svg>',
        reports: '<svg viewBox="0 0 24 24"><path d="M6 20v-6M12 20V10M18 20V4"/></svg>',
        admin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
    };

    const ensureSidebarTheme = () => {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;

        const brand = sidebar.querySelector(".sidebar-brand");
        if (brand) {
            const textEl = brand.querySelector(".sidebar-brand-text");
            if (textEl) textEl.remove();
            if (!brand.querySelector(".sidebar-alaska-logo")) {
                const href = brand.getAttribute("href") || "home.html";
                const prefix = href.includes("../") ? "../" : "";
                brand.innerHTML = `<img class="sidebar-alaska-logo" src="${prefix}public/alaska-logo-white.svg" alt="Alaska Airlines">`;
            }
        }

        if (!sidebar.dataset.iconsSynced) {
            sidebar.dataset.iconsSynced = "true";
            const links = sidebar.querySelectorAll(".nav-item[href]");
            links.forEach(link => {
                const href = (link.getAttribute("href") || "").toLowerCase();
                const iconSpan = link.querySelector(".nav-icon");
                if (!iconSpan) return;
                if (href.includes("home.html")) iconSpan.innerHTML = ICONS.home;
                else if (href.includes("vendors.html")) iconSpan.innerHTML = ICONS.vendors;
                else if (href.includes("categories.html")) iconSpan.innerHTML = ICONS.categories;
                else if (href.includes("ground-stops.html")) iconSpan.innerHTML = ICONS.directory;
                else if (href.includes("favorites.html")) iconSpan.innerHTML = ICONS.favorites;
                else if (href.includes("reports.html")) iconSpan.innerHTML = ICONS.reports;
                else if (href.includes("index.html") || href.includes("admin")) iconSpan.innerHTML = ICONS.admin;
            });
        }

        const bottom = sidebar.querySelector(".sidebar-bottom");
        if (bottom && !bottom.dataset.themeSynced) {
            bottom.dataset.themeSynced = "true";
            bottom.innerHTML = `
                <p class="sidebar-quote">PEOPLE.<br>PLANES.<br>PARTNERS.<br>TOMORROW.</p>
                <p class="sidebar-copyright">Stronger operations<br>for a brighter tomorrow.</p>
            `;
        }
    };

    const ensureVendorsDropdown = () => {
        const vendorLink = document.querySelector('.sidebar .nav-item[href*="vendors.html"]');
        if (!vendorLink) return null;

        let dropdown = vendorLink.closest(".nav-dropdown");
        if (!dropdown) {
            dropdown = document.createElement("div");
            dropdown.className = "nav-dropdown";
            dropdown.setAttribute("data-nav-dropdown", "vendors");
            vendorLink.parentNode.insertBefore(dropdown, vendorLink);
            dropdown.appendChild(vendorLink);
        }

        vendorLink.classList.add("nav-dropdown-toggle");

        if (!vendorLink.querySelector(".nav-chevron")) {
            const chevron = document.createElement("span");
            chevron.className = "nav-chevron";
            chevron.setAttribute("aria-hidden", "true");
            chevron.innerHTML = '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
            vendorLink.appendChild(chevron);
        }

        const hrefPrefix = vendorLink.getAttribute("href").includes("../") ? "../" : "";
        let menu = dropdown.querySelector(".nav-dropdown-menu") || dropdown.querySelector(".nav-submenu");
        if (!menu) {
            menu = document.createElement("div");
            menu.className = "nav-dropdown-menu";
            menu.setAttribute("role", "group");
            menu.setAttribute("aria-label", "Vendors & Partners submenu");
            menu.innerHTML = `
                <a href="${hrefPrefix}vendor-maintenance.html" class="nav-subitem" data-vendor-subitem="maintenance">
                    <span class="nav-subicon" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    </span>
                    <span>Vendor Maintenance</span>
                </a>
                <a href="${hrefPrefix}vendor-case-status.html" class="nav-subitem" data-vendor-subitem="case-status">
                    <span class="nav-subicon" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>
                    </span>
                    <span>Vendor Case Status</span>
                </a>
            `;
            dropdown.appendChild(menu);
        } else {
            const maintLink = menu.querySelector('[data-vendor-subitem="maintenance"], [data-vendor-view="vendor-maintenance"], a[href*="#vendor-maintenance"], a[href*="vendor-maintenance"]');
            if (maintLink) {
                maintLink.setAttribute("href", `${hrefPrefix}vendor-maintenance.html`);
                maintLink.setAttribute("data-vendor-subitem", "maintenance");
            }
            const caseLink = menu.querySelector('[data-vendor-subitem="case-status"], [data-vendor-view="vendor-case-status"], a[href*="#vendor-case-status"], a[href*="vendor-case-status"]');
            if (caseLink) {
                caseLink.setAttribute("href", `${hrefPrefix}vendor-case-status.html`);
                caseLink.setAttribute("data-vendor-subitem", "case-status");
            }
        }

        if (!vendorLink.dataset.dropdownBound) {
            vendorLink.dataset.dropdownBound = "true";
            vendorLink.addEventListener("click", event => {
                const current = new URL(window.location.href);
                const currentPath = normalizePath(current.pathname);
                const isVendorsPage = currentPath.endsWith("/vendors.html");

                /* If on another page, allow normal navigation to vendors.html
                   where the Vendor Directory page and dropdown open together. */
                if (!isVendorsPage) {
                    dropdown.classList.add("is-open");
                    vendorLink.setAttribute("aria-expanded", "true");
                    return;
                }

                /* Already on vendors.html: if a submenu hash is active, return to
                   main Vendor Directory and keep dropdown open; otherwise toggle dropdown. */
                event.preventDefault();
                if (current.hash === "#vendor-maintenance" || current.hash === "#vendor-case-status") {
                    history.pushState(null, "", current.pathname + current.search);
                    dropdown.classList.add("is-open");
                    vendorLink.setAttribute("aria-expanded", "true");
                    updateActiveItem();
                } else {
                    const isOpen = dropdown.classList.toggle("is-open");
                    vendorLink.setAttribute("aria-expanded", isOpen ? "true" : "false");
                }
            });
        }

        return dropdown;
    };

    const updateActiveItem = () => {
        const current = new URL(window.location.href);
        const currentPath = normalizePath(current.pathname);

        if (currentPath.endsWith("/vendors.html") && current.hash === "#vendor-maintenance") {
            window.location.replace("vendor-maintenance.html");
            return;
        }
        if (currentPath.endsWith("/vendors.html") && current.hash === "#vendor-case-status") {
            window.location.replace("vendor-case-status.html");
            return;
        }

        ensureSidebarTheme();
        const dropdown = ensureVendorsDropdown();
        const links = [...document.querySelectorAll(".sidebar .nav-item[href]")];
        const subitems = [...document.querySelectorAll(".sidebar .nav-subitem[href]")];

        if (!links.length) return;

        links.forEach(link => {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
        });

        subitems.forEach(sub => {
            sub.classList.remove("active");
            sub.removeAttribute("aria-current");
        });

        const isVendorMaintenancePage =
            currentPath.endsWith("/vendor-maintenance.html") ||
            currentPath.endsWith("/vendor-maintenance");
        const isVendorCaseStatusPage =
            currentPath.endsWith("/vendor-case-status.html") ||
            currentPath.endsWith("/vendor-case-status");

        const matchingPage = links.filter(link => normalizePath(new URL(link.href, current.href).pathname) === currentPath);
        const exactHash = matchingPage.find(link => new URL(link.href, current.href).hash === current.hash);
        const plainPage = matchingPage.find(link => !new URL(link.href, current.href).hash);
        const activeLink = exactHash || plainPage || matchingPage[0];

        if (activeLink && !isVendorMaintenancePage && !isVendorCaseStatusPage) {
            activeLink.classList.add("active");
            activeLink.setAttribute("aria-current", "page");
        }

        if (dropdown) {
            const toggle = dropdown.querySelector(".nav-dropdown-toggle");
            const isVendorsPage = currentPath.endsWith("/vendors.html");
            if (isVendorMaintenancePage) {
                dropdown.setAttribute("data-initialized", "true");
                dropdown.classList.add("is-open");
                if (toggle) toggle.setAttribute("aria-expanded", "true");
                const maintSub = dropdown.querySelector('[data-vendor-subitem="maintenance"]');
                if (maintSub) {
                    maintSub.classList.add("active");
                    maintSub.setAttribute("aria-current", "page");
                }
            } else if (isVendorCaseStatusPage) {
                dropdown.setAttribute("data-initialized", "true");
                dropdown.classList.add("is-open");
                if (toggle) toggle.setAttribute("aria-expanded", "true");
                const caseSub = dropdown.querySelector('[data-vendor-subitem="case-status"]');
                if (caseSub) {
                    caseSub.classList.add("active");
                    caseSub.setAttribute("aria-current", "page");
                }
            } else if (isVendorsPage) {
                if (!dropdown.hasAttribute("data-initialized")) {
                    dropdown.setAttribute("data-initialized", "true");
                    dropdown.classList.add("is-open");
                    if (toggle) toggle.setAttribute("aria-expanded", "true");
                }
                const activeSub = current.hash === "#vendor-case-status"
                    ? dropdown.querySelector('[data-vendor-subitem="case-status"]')
                    : null;
                if (activeSub) {
                    activeSub.classList.add("active");
                    activeSub.setAttribute("aria-current", "page");
                }
            } else if (!dropdown.hasAttribute("data-initialized")) {
                dropdown.setAttribute("data-initialized", "true");
                const isOpen = dropdown.classList.contains("is-open");
                if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
            }
        }
    };

    updateActiveItem();
    window.addEventListener("hashchange", updateActiveItem);

    if (document.body) {
        const observer = new MutationObserver(() => {
            const unupgraded = document.querySelector('.sidebar .nav-item[href*="vendors.html"]:not(.nav-dropdown-toggle)');
            const unbranded = document.querySelector('.sidebar .sidebar-brand:not(:has(.sidebar-alaska-logo))');
            if (unupgraded || unbranded) updateActiveItem();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
