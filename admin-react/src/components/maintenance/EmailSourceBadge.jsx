import React from "react";

export default function EmailSourceBadge({
  source,
  sourceMailbox,
  isDemo = false,
  folder = "Vendor Maintenance",
  processingStatus
}) {
  if (isDemo || source === "DEMO DATA") {
    return (
      <span
        className="vm-source-badge vm-source-demo"
        title="Demo sandbox record — kept separate from production Outlook records"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>DEMO DATA</span>
      </span>
    );
  }

  const isFailed = processingStatus === "Failed";
  const label = source || "Outlook Email";

  return (
    <span
      className={`vm-source-badge ${isFailed ? "vm-source-error" : "vm-source-outlook"}`}
      title={
        sourceMailbox
          ? `Captured from ${sourceMailbox} (${folder})`
          : `Captured via Microsoft Outlook (${folder})`
      }
    >
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
      <span>{label}</span>
    </span>
  );
}
