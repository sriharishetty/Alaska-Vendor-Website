import React from "react";
import { MAINTENANCE_STATUSES, UPDATE_TYPES } from "../../types/vendorMaintenance.js";

export default function MaintenanceFilters({
  filters = {},
  onFilterChange,
  onChangeFilter,
  onClearFilters,
  filteredCount,
  resultCount = 0,
  totalCount = 0
}) {
  const vendorVal = filters.vendorName ?? filters.vendorQuery ?? "";
  const appVal = filters.application ?? filters.applicationQuery ?? "";
  const subjectVal = filters.emailSubject ?? filters.subjectQuery ?? "";
  const senderVal = filters.senderEmail ?? filters.senderQuery ?? "";
  const updateTypeVal = filters.updateType ?? "";
  const statusVal = filters.status ?? "";
  const dateFromVal = filters.dateFrom ?? "";
  const dateToVal = filters.dateTo ?? "";
  const sortByVal = filters.sortBy || "receivedDate";
  const sortOrderVal = filters.sortOrder || filters.sortDir || "desc";

  const shownCount = filteredCount !== undefined ? filteredCount : resultCount;

  const updateField = (key, value) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        [key]: value
      });
    } else if (onChangeFilter) {
      onChangeFilter(key, value);
    }
  };

  const updateSort = (sortBy, sortOrder) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        sortBy,
        sortOrder
      });
    } else if (onChangeFilter) {
      onChangeFilter("sortBy", sortBy);
      onChangeFilter("sortOrder", sortOrder);
    }
  };

  const hasActiveFilters = Boolean(
    vendorVal ||
    subjectVal ||
    appVal ||
    senderVal ||
    updateTypeVal ||
    statusVal ||
    dateFromVal ||
    dateToVal ||
    sortByVal !== "receivedDate" ||
    sortOrderVal !== "desc"
  );

  return (
    <section className="vm-filters-card" aria-label="Maintenance search and filter controls">
      <div className="vm-filters-row vm-filters-row-search">
        <div className="vm-filter-field">
          <label htmlFor="vm-filter-vendor">Vendor Name</label>
          <div className="vm-input-wrap">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              id="vm-filter-vendor"
              type="search"
              placeholder="Search by vendor..."
              value={vendorVal}
              onChange={e => updateField("vendorName", e.target.value)}
            />
          </div>
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-filter-application">Application / System</label>
          <div className="vm-input-wrap">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <input
              id="vm-filter-application"
              type="search"
              placeholder="Search by application..."
              value={appVal}
              onChange={e => updateField("application", e.target.value)}
            />
          </div>
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-filter-subject">Email Subject</label>
          <div className="vm-input-wrap">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              id="vm-filter-subject"
              type="search"
              placeholder="Search email subject..."
              value={subjectVal}
              onChange={e => updateField("emailSubject", e.target.value)}
            />
          </div>
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-filter-sender">Sender Email</label>
          <div className="vm-input-wrap">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
            </svg>
            <input
              id="vm-filter-sender"
              type="search"
              placeholder="Search sender address..."
              value={senderVal}
              onChange={e => updateField("senderEmail", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="vm-filters-row vm-filters-row-selects">
        <div className="vm-filter-field">
          <label htmlFor="vm-filter-type">Update Type</label>
          <select
            id="vm-filter-type"
            value={updateTypeVal}
            onChange={e => updateField("updateType", e.target.value)}
          >
            <option value="">All Update Types</option>
            {UPDATE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-filter-status">Maintenance Status</label>
          <select
            id="vm-filter-status"
            value={statusVal}
            onChange={e => updateField("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            {MAINTENANCE_STATUSES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-filter-date-from">Date From</label>
          <input
            id="vm-filter-date-from"
            type="date"
            value={dateFromVal}
            onChange={e => updateField("dateFrom", e.target.value)}
          />
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-filter-date-to">Date To</label>
          <input
            id="vm-filter-date-to"
            type="date"
            value={dateToVal}
            onChange={e => updateField("dateTo", e.target.value)}
          />
        </div>

        <div className="vm-filter-field">
          <label htmlFor="vm-filter-sort">Sort By</label>
          <select
            id="vm-filter-sort"
            value={`${sortByVal}:${sortOrderVal}`}
            onChange={e => {
              const [nextSortBy, nextSortOrder] = e.target.value.split(":");
              updateSort(nextSortBy, nextSortOrder);
            }}
          >
            <option value="receivedDate:desc">Received Date (Newest First)</option>
            <option value="receivedDate:asc">Received Date (Oldest First)</option>
            <option value="maintenanceStart:asc">Maintenance Start (Earliest First)</option>
            <option value="maintenanceStart:desc">Maintenance Start (Latest First)</option>
          </select>
        </div>

        <div className="vm-filter-actions">
          <button
            type="button"
            className="vm-clear-btn"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            aria-label="Clear all maintenance filters"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      <div className="vm-filters-meta">
        <span>
          Showing <strong>{shownCount}</strong> of <strong>{totalCount}</strong> maintenance record{totalCount === 1 ? "" : "s"}
        </span>
      </div>
    </section>
  );
}
