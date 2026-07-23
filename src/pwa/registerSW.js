// Registra el service worker respetando la subcarpeta del repo en GitHub Pages.
// import.meta.env.BASE_URL === "/Retador-Plataform-/" en producción.
//
// AUTO-SANADOR: tras tantas versiones (v45→v80+), un teléfono podía quedar con un
// service worker VIEJO y roto pegado (p. ej. un manejador push que rompía en
// silencio → aviso genérico de Chrome). Por eso, en cada carga:
//   1) registramos/actualizamos el SW de ESTA versión,
//   2) forzamos registration.update() para bajar el sw.js nuevo ya,
//   3) desregistramos cualquier OTRO service worker de este origen con un scope
//      distinto (de versiones antiguas), que ya no debe controlar nada.
// El propio sw.js hace skipWaiting()+clients.claim() incondicional, así la
// versión nueva toma el control de inmediato sin esperar a cerrar pestañas.
export function registerSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  // Solo en producción: en desarrollo evitamos interferir con el recargado de Vite.
  if (!import.meta.env.PROD) return;

  const base = import.meta.env.BASE_URL || "/";
  const scopeURL = new URL(base, window.location.origin).href; // scope completo esperado

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register(base + "sw.js", { scope: base });
      // Fuerza la comprobación de una versión nueva del sw.js en cada arranque.
      try { await reg.update(); } catch (e) {}
    } catch (err) {
      console.warn("SW no registrado:", err?.message || err);
    }

    // Limpia service workers VIEJOS de otro scope (de versiones anteriores) que
    // pudieran seguir registrados en este origen y robar el control del push.
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        if (r.scope !== scopeURL) {
          try { await r.unregister(); } catch (e) {}
        }
      }
    } catch (e) {}
  });
}
