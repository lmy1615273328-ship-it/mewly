import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { APP_VERSION } from "./types";

const storedVersion = localStorage.getItem("mewly-app-version");
if (storedVersion !== APP_VERSION) {
  localStorage.setItem("mewly-app-version", APP_VERSION);
  if ("caches" in window) {
    caches.keys().then((keys) => keys.filter((key) => key.startsWith("mewly-")).forEach((key) => caches.delete(key))).catch(() => undefined);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.update().catch(() => undefined);
    }).catch(() => undefined);
  });
}
