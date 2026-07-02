import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./pwa/installState.js"; // captura "beforeinstallprompt" cuanto antes
import { registerSW } from "./pwa/registerSW.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerSW();
