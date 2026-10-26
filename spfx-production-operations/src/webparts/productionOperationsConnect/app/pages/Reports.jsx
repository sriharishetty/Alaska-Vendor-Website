import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildOperationalReportSnapshot,
  exportFilteredApplicationsCsv,
  exportFullOperationalReportCsv
} from "../services/reportsService";
import ReportHeader from "../components/reports/ReportHeader";
import ReportKpiCards from "../components/reports/ReportKpiCards";
import ApplicationHealth from "../components/reports/ApplicationHealth";
import SeverityOverview from "../components/reports/SeverityOverview";
import VendorInsights from "../components/reports/VendorInsights";
import OperationalResponseOverview from "../components/reports/OperationalResponseOverview";
import DataQualitySummary from "../components/reports/DataQualitySummary";

function getReliableSystemDate() {
  try {
    const now = new Date();
    if (Number.isNaN(now.getTime())) return "";
    return now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

export default function Reports() {
  const [scope, setScope] = useState("ground-stop");
  const [snapshot, setSnapshot] = useState(() => buildOperationalReportSnapshot("ground-stop"));

  // Application Health filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [missingVendorOnly, setMissingVendorOnly] = useState(false);
  const [activeKpiFilter, setActiveKpiFilter] = useState("all-apps");

  // Vendor Insights states
  const [vendorViewMode, setVendorViewMode] = useState("unique");
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [missingContactOnly, setMissingContactOnly] = useState(false);

  const formattedDate = useMemo(() => getReliableSystemDate(), []);

  const refreshData = useCallback(
    targetScope => {
      const nextScope = targetScope || scope;
      setSnapshot(buildOperationalReportSnapshot(nextScope));
    },
    [scope]
  );

  useEffect(() => {
    refreshData(scope);
  }, [scope, refreshData]);

  useEffect(() => {
    const handleStorage = () => {
      refreshData(scope);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [scope, refreshData]);

  useEffect(() => {
    document.body.classList.add("reports-ready");
  }, []);

  // Compute dropdown options from actual applications
  const vendorOptions = useMemo(() => {
    const set = new Set();
    (snapshot.applications || []).forEach(app => {
      if (app.hasVendorAssociation && app.vendor) {
        set.add(app.vendor);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [snapshot.applications]);

  const severityOptions = useMemo(() => {
    const order = ["Critical", "High", "Medium", "Low", "Unknown"];
    const present = new Set((snapshot.applications || []).map(a => a.severity));
    return order.filter(s => s !== "Unknown" || present.has("Unknown"));
  }, [snapshot.applications]);

  const statusOptions = useMemo(() => {
    const set = new Set((snapshot.applications || []).map(a => a.status));
    ["Operational", "Maintenance", "Inactive"].forEach(st => set.add(st));
    return Array.from(set);
  }, [snapshot.applications]);

  // Filter Application Health list
  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (snapshot.applications || []).filter(app => {
      if (missingVendorOnly && app.hasVendorAssociation) return false;

      if (vendorFilter === "UNASSIGNED") {
        if (app.hasVendorAssociation) return false;
      } else if (vendorFilter !== "ALL") {
        const vLower = vendorFilter.toLowerCase();
        const appVLower = (app.vendor || "").toLowerCase();
        if (
          appVLower !== vLower &&
          !appVLower.includes(vLower) &&
          !vLower.includes(appVLower)
        ) {
          return false;
        }
      }

      if (severityFilter !== "ALL" && app.severity !== severityFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && app.status !== statusFilter) {
        return false;
      }

      if (q) {
        const haystack = [
          app.name,
          app.shortDescription,
          app.fullDescription,
          app.vendorDisplay,
          app.category,
          app.aagTeam,
          app.aagPOC,
          app.status,
          app.severity
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    snapshot.applications,
    searchQuery,
    vendorFilter,
    severityFilter,
    statusFilter,
    missingVendorOnly
  ]);

  const handleClearAppFilters = useCallback(() => {
    setSearchQuery("");
    setVendorFilter("ALL");
    setSeverityFilter("ALL");
    setStatusFilter("ALL");
    setMissingVendorOnly(false);
    setActiveKpiFilter("all-apps");
  }, []);

  const scrollToElement = id => {
    const el = document.getElementById(id);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectKpiFilter = useCallback(
    kpiKey => {
      if (kpiKey === "all-apps") {
        handleClearAppFilters();
        setActiveKpiFilter("all-apps");
        scrollToElement("rpt-application-health");
        return;
      }
      if (kpiKey === "critical") {
        const nextSev = severityFilter === "Critical" ? "ALL" : "Critical";
        setSeverityFilter(nextSev);
        setStatusFilter("ALL");
        setMissingVendorOnly(false);
        setActiveKpiFilter(nextSev === "Critical" ? "critical" : "all-apps");
        scrollToElement("rpt-application-health");
        return;
      }
      if (kpiKey === "active") {
        const nextStatus = statusFilter === "Operational" ? "ALL" : "Operational";
        setStatusFilter(nextStatus);
        setSeverityFilter("ALL");
        setMissingVendorOnly(false);
        setActiveKpiFilter(nextStatus === "Operational" ? "active" : "all-apps");
        scrollToElement("rpt-application-health");
        return;
      }
      if (kpiKey === "vendors") {
        setActiveKpiFilter("vendors");
        setVendorViewMode("all-records");
        setMissingContactOnly(false);
        scrollToElement("rpt-vendor-insights");
      }
    },
    [severityFilter, statusFilter, handleClearAppFilters]
  );

  const handleSelectSeverity = useCallback(sev => {
    setSeverityFilter(sev);
    setMissingVendorOnly(false);
    setActiveKpiFilter(sev === "Critical" ? "critical" : "all-apps");
  }, []);

  const handleFilterAppHealthByVendor = useCallback(vendorName => {
    setVendorFilter(vendorName);
    setMissingVendorOnly(false);
    scrollToElement("rpt-application-health");
  }, []);

  const handleInspectAppsMissingVendor = useCallback(() => {
    setMissingVendorOnly(true);
    setVendorFilter("UNASSIGNED");
    setSeverityFilter("ALL");
    setStatusFilter("ALL");
  }, []);

  const handleInspectVendorsMissingContact = useCallback(() => {
    setVendorViewMode("all-records");
    setMissingContactOnly(true);
  }, []);

  return (
    <div className="rpt-dashboard-container">
      {/* 1. Compact Enterprise Page Header */}
      <ReportHeader
        formattedDate={formattedDate}
        scope={scope}
        groundStopCount={snapshot.groundStopCount}
        allRegisteredCount={snapshot.allRegisteredCount}
        onScopeChange={nextScope => setScope(nextScope)}
        onExportFullCsv={() => exportFullOperationalReportCsv(snapshot, filteredApplications)}
        onExportFilteredCsv={() => exportFilteredApplicationsCsv(filteredApplications)}
        onPrintReport={() => window.print()}
      />

      {/* 2. Summary KPI Cards */}
      <ReportKpiCards
        kpis={snapshot.kpis}
        activeKpiFilter={activeKpiFilter}
        onSelectKpiFilter={handleSelectKpiFilter}
      />

      {/* 3. Primary Two-Column Operational Grid: Application Health + Severity Overview */}
      <div className="rpt-primary-grid">
        <ApplicationHealth
          applications={filteredApplications}
          totalCount={snapshot.applications.length}
          searchQuery={searchQuery}
          vendorFilter={vendorFilter}
          severityFilter={severityFilter}
          statusFilter={statusFilter}
          missingVendorOnly={missingVendorOnly}
          vendorOptions={vendorOptions}
          severityOptions={severityOptions}
          statusOptions={statusOptions}
          onSearchChange={setSearchQuery}
          onVendorFilterChange={val => {
            setVendorFilter(val);
            if (val !== "UNASSIGNED") setMissingVendorOnly(false);
          }}
          onSeverityFilterChange={handleSelectSeverity}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={handleClearAppFilters}
        />

        <SeverityOverview
          severityDistribution={snapshot.severityDistribution}
          totalApplications={snapshot.kpis.totalApplications}
          selectedSeverity={severityFilter}
          onSelectSeverity={handleSelectSeverity}
        />
      </div>

      {/* 4. Vendor Insights Section (All 37 Vendor Records & Unique Vendor Aggregation) */}
      <VendorInsights
        uniqueVendors={snapshot.uniqueVendors}
        vendorRecords={snapshot.vendorRecords}
        vendorViewMode={vendorViewMode}
        vendorSearchQuery={vendorSearchQuery}
        missingContactOnly={missingContactOnly}
        onVendorViewModeChange={setVendorViewMode}
        onVendorSearchChange={setVendorSearchQuery}
        onClearMissingContactFilter={() => setMissingContactOnly(false)}
        onFilterAppHealthByVendor={handleFilterAppHealthByVendor}
      />

      {/* 5. Secondary Analytical Grid: Operational Response Overview + Data Quality Summary */}
      <div className="rpt-secondary-grid">
        <OperationalResponseOverview
          severityDistribution={snapshot.severityDistribution}
          selectedSeverity={severityFilter}
          onSelectSeverity={handleSelectSeverity}
        />

        <DataQualitySummary
          dataQuality={snapshot.dataQuality}
          onInspectAppsMissingVendor={handleInspectAppsMissingVendor}
          onInspectVendorsMissingContact={handleInspectVendorsMissingContact}
          onJumpToAllVendors={() => {
            setVendorViewMode("all-records");
            setMissingContactOnly(false);
            scrollToElement("rpt-vendor-insights");
          }}
          onJumpToAllApps={() => {
            handleClearAppFilters();
            scrollToElement("rpt-application-health");
          }}
        />
      </div>

      {/* 6. Enterprise Footer */}
      <footer className="rpt-footer">
        <span>Production Operations Connect</span>
        <span aria-hidden="true">•</span>
        <span>Reports &amp; Analytics</span>
        <span aria-hidden="true">•</span>
        <span>Internal Airline Operations Dashboard</span>
      </footer>
    </div>
  );
}

