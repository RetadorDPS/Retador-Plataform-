// Registra el service worker respetando la subcarpeta del repo en GitHub Pages.
// import.meta.env.BASE_URL === "/Retador-Plataform-/" en producción.
export function registerSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  // Solo en producción: en desarrollo evitamos interferir con el recargado de Vite.
  if (!import.meta.env.PROD) return;

  const base = import.meta.env.BASE_URL || "/";
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(base + "sw.js", { scope: base })
      .catch((err) => console.warn("SW no registrado:", err?.message || err));
  });
}
