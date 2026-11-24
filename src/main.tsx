import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppProvider } from "./state";
import "./styles.css";
import "./motion.css";

// Solo en producción: en desarrollo una copia guardada confundiría los cambios en vivo.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { /* sin modo sin conexión */ }); });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider><App /></AppProvider>
  </StrictMode>,
);
