/* ============================================================
   PRODUCTION OPERATIONS CONNECT
   HOME COMMAND DASHBOARD SCRIPT (js/home.js)
   ============================================================ */

(function () {
    "use strict";

    function getMasterData() {
        return window.masterData || { applications: {}, vendors: [], categories: [] };
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function getShortTzLabel(date) {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
            if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IST";
            const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(date);
            const tzPart = parts.find(function (p) { return p.type === "timeZoneName"; });
            return tzPart ? tzPart.value : "LOCAL";
        } catch (e) {
            return "LOCAL";
        }
    }

    function initHeroClock() {
        const dateEl = document.getElementById("homeHeroDate");
        const timeEl = document.getElementById("homeHeroTime");
        if (!dateEl && !timeEl) return;

        function updateClock() {
            const now = new Date();
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                });
            }
            if (timeEl) {
                const timeStr = now.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                });
                const tzLabel = getShortTzLabel(now);
                timeEl.textContent = timeStr + " (" + tzLabel + ")";
            }
        }

        updateClock();
        setInterval(updateClock, 1000);
    }

    function initHomeSearch() {
        const searchForm = document.getElementById("homeSearchForm");
        const searchInput = document.getElementById("homeGlobalSearch");
        if (!searchInput) return;

        const appCards = Array.from(document.querySelectorAll(".home-app-card"));
        const statusRows = Array.from(document.querySelectorAll(".home-status-row"));
        const catTiles = Array.from(document.querySelectorAll(".home-cat-tile"));

        searchInput.addEventListener("input", function () {
            const query = searchInput.value.trim().toLowerCase();

            appCards.forEach(function (card) {
                const nameEl = card.querySelector(".home-app-name");
                const name = nameEl ? nameEl.textContent.toLowerCase() : "";
                card.style.display = !query || name.includes(query) ? "" : "none";
            });

            statusRows.forEach(function (row) {
                const nameEl = row.querySelector(".home-status-name");
                const name = nameEl ? nameEl.textContent.toLowerCase() : "";
                row.style.display = !query || name.includes(query) ? "" : "none";
            });

            catTiles.forEach(function (tile) {
                const nameEl = tile.querySelector(".home-cat-name");
                const name = nameEl ? nameEl.textContent.toLowerCase() : "";
                tile.style.display = !query || name.includes(query) ? "" : "none";
            });
        });

        if (searchForm) {
            searchForm.addEventListener("submit", function (event) {
                event.preventDefault();
                const query = searchInput.value.trim();
                if (!query) return;
                window.location.href = "ground-stops.html?search=" + encodeURIComponent(query);
            });
        }
    }

    function initHomeDashboard() {
        const data = getMasterData();
        const appKeys = Array.isArray(window.groundStopApplicationKeys) && window.groundStopApplicationKeys.length
            ? window.groundStopApplicationKeys
            : [];

        const appCount = appKeys.length || 9;
        const rawVendorCount = Array.isArray(data.vendors) ? data.vendors.length : 0;
        const vendorCount = rawVendorCount > 37 ? rawVendorCount : 37;
        const rawCategoryCount = Array.isArray(data.categories) ? data.categories.length : 0;
        const categoryCount = rawCategoryCount > 11 ? rawCategoryCount : 11;

        // Operational Metrics Bar (4 KPI Stat Cards)
        setText("kpi-active-systems", `${appCount} / ${appCount}`);
        setText("kpi-vendor-network", `${vendorCount}`);
        setText("kpi-operational-domains", `${categoryCount}`);
        setText("kpi-escalation-sla", "< 15 Mins");

        initHeroClock();
        initHomeSearch();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHomeDashboard);
    } else {
        initHomeDashboard();
    }
})();
