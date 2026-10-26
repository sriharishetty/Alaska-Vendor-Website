import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./login.css";
import "./admin-ui.css";
import "./airline-admin.css";
import "../../js/motion.js";

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
