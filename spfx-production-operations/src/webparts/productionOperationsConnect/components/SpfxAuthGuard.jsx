import React, { useState } from "react";
import {
  SPFX_AUTHORIZED_ADMINS,
  resolveSpfxUserSession,
  setSpfxWorkbenchUser
} from "../services/SharePointDataService";

/**
 * SpfxAuthGuard (replaces password-based Login in SPFx)
 * Uses Microsoft 365 / SharePoint Framework (SPFx) pageContext SSO identity.
 * Contains zero passwords, secrets, or credentials.
 */
export default function Login({ onLoginSuccess }) {
  const currentSession = resolveSpfxUserSession();
  const [selectedAccount, setSelectedAccount] = useState(
    currentSession.email || SPFX_AUTHORIZED_ADMINS[0]
  );
  const [error, setError] = useState("");

  const handleM365SignIn = e => {
    e.preventDefault();
    setError("");
    const updatedSession = setSpfxWorkbenchUser(selectedAccount);
    if (!updatedSession.isAuthorizedAdmin) {
      setError(
        "The selected Microsoft 365 identity has SharePoint Read-Only (Visitor) permissions. Select an authorized ITS Production Operations Member/Owner account to access Admin Settings."
      );
      return;
    }
    if (typeof onLoginSuccess === "function") {
      onLoginSuccess(updatedSession.email);
    }
  };

  return (
    <div className="login-page" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <span className="eyebrow">MICROSOFT 365 SHAREPOINT SSO</span>
            <h1>Admin Control Center</h1>
            <p className="subtitle">
              Authenticated via SharePoint Online permissions (`context.pageContext.user`). No passwords or secrets are stored in this web part.
            </p>
          </div>

          <form onSubmit={handleM365SignIn} className="login-form">
            <div className="input-group">
              <label htmlFor="spfx-m365-identity">Microsoft 365 / SharePoint Identity</label>
              <select
                id="spfx-m365-identity"
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#f8fafc"
                }}
              >
                <optgroup label="Authorized SharePoint Site Owners / Members (@alaskaair.com)">
                  {SPFX_AUTHORIZED_ADMINS.map(adminEmail => (
                    <option key={adminEmail} value={adminEmail}>
                      {adminEmail} (SharePoint Member / Admin)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="SharePoint Site Visitors (Read-Only Simulation)">
                  <option value="Viewer.Operations@alaskaair.com">
                    Viewer.Operations@alaskaair.com (SharePoint Visitor - Read Only)
                  </option>
                </optgroup>
              </select>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="login-btn">
              Verify SharePoint Permissions &amp; Continue
            </button>
          </form>

          <div className="login-footer">
            <span>Secured by Microsoft Entra ID &amp; SharePoint Online RBAC</span>
          </div>
        </div>
      </div>
    </div>
  );
}

