# Production Operations Connect

**Production Operations Connect** is a Flight Operations Control Hub designed to empower 24/7 flight reliability. It connects critical application ecosystems, vendor support networks, and rapid escalation pathways into one intelligent, unified workspace.

## 🚀 Key Features

* **Real-Time Operational Dashboard:** Monitor active operational systems, vendor networks, and escalation SLAs in real-time.
* **Vendor & Partner Management:** Direct 24/7 vendor hotlines and tier-3 engineering escalation paths during critical operational events.
* **Unified System Ecosystem:** Centralized application owners, target SLAs, and domain dependencies across all operational categories (Flight, Ground, & Logistics).
* **Proactive SLA Monitoring:** Live vendor performance tracking and software health visibility to prevent operational ground delays.
* **Admin Control Center:** A secure, React-based administrative interface for managing application statuses, vendor information, and operational workflows.

## 📁 Project Structure

```text
production-operations-connect/
├── admin-react/           # React source code for the Admin Control Center
├── admin-react-dist/      # Compiled assets for the Admin Control Center
├── css/                   # Global stylesheets and design tokens
├── js/                    # Core vanilla JavaScript logic and data models
├── public/                # Static assets (images, icons, etc.)
├── scripts/               # PowerShell/VBS automation scripts for data sync
├── home.html              # Main dashboard entry point
├── vendors.html           # Vendor and partner directory
├── categories.html        # System categories overview
├── ground-stops.html      # Operations directory and ground stop manager
├── reports.html           # Reports and analytics
└── favorites.html         # User favorites
```

## 🛠️ Getting Started

### Running the Main Portal
The main portal is built with static web technologies (HTML, CSS, Vanilla JS) for maximum reliability and speed. 
To view the application, simply open `home.html` in any modern web browser, or serve the directory using a local web server of your choice:

```bash
# Example using Python's built-in HTTP server
python -m http.server 8000
```
Then navigate to `http://localhost:8000/home.html`.

### Admin Control Center
The Admin Control Center is a React application embedded within the portal. The compiled version is already available in the `admin-react-dist` folder and is linked via `admin-react-dist/index.html`.

If you need to make changes to the admin interface:
1. Navigate to the `admin-react` directory.
2. Install dependencies (requires Node.js): `npm install`
3. Run the build script to compile the assets: `npm run build`

## 🔒 Security
Administrative access is restricted to authorized Production Operations members via the Admin Control Center login portal.

---
*PEOPLE. PLANES. A BRIGHTER TOMORROW.*
