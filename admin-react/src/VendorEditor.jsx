import { useState } from "react";

const tabs = {
  overview: ["systemName", "category", "vendorCompanyName"],
  contacts: ["vendorPOC", "contactNumbers", "emailAddress", "aagItsPOC", "aagItsTeam"],
  portal: ["portalUrl", "portalStatus", "lastVerifiedDate", "portalNotes"],
  escalation: ["prodOpsEscalationProcess"],
  documents: ["infoUpdatedDate", "infoUpdatedBy", "infoApprovedDate", "infoApprovedBy"]
};
const tabLabels = { overview: "Overview", contacts: "Contacts", portal: "Portal & Case Status", escalation: "Escalation", documents: "Documents" };
const textAreas = new Set(["prodOpsEscalationProcess", "contactNumbers", "emailAddress", "vendorPOC", "portalNotes"]);

function labelFor(field) { return field.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase()); }

export default function VendorEditor({ vendor, onClose, onSave }) {
  const [draft, setDraft] = useState(vendor);
  const [activeTab, setActiveTab] = useState("overview");
  return <div className="modal"><form className="editor vendor-editor" onSubmit={event => { event.preventDefault(); onSave(draft); }}>
    <header><div><small>EDIT</small><h2>Edit Vendor Information</h2></div><button type="button" onClick={onClose}>×</button></header>
    <nav className="editor-tabs">{Object.keys(tabs).map(tab => <button key={tab} className={activeTab === tab ? "active" : ""} type="button" onClick={() => setActiveTab(tab)}>{tabLabels[tab]}</button>)}</nav>
    <div className="form-grid">{tabs[activeTab].map(field => <label key={field}>{labelFor(field)}{textAreas.has(field) ? <textarea value={draft[field] || ""} onChange={event => setDraft({ ...draft, [field]: event.target.value })} /> : <input type="text" value={draft[field] || ""} onChange={event => setDraft({ ...draft, [field]: event.target.value })} />}</label>)}</div>
    <footer><button type="button" className="secondary" onClick={onClose}>Cancel</button><button>Save Changes</button></footer>
  </form></div>;
}
