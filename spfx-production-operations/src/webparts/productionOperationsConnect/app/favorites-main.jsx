import React from "react";
import { createRoot } from "react-dom/client";
import { Favorites } from "./pages/Favorites";

const container = document.getElementById("favorites-root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Favorites />
    </React.StrictMode>
  );
}

