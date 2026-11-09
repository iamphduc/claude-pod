import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../../../shared/tokens.css";
import "./fonts.css";
import "./agentprism-openaflow.css";
import "./index.css";
import { App } from "./App";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
