// ─────────────────────────────────────────────────────────────────────────────
// RETADOR — Service Worker mínimo.
// Su único objetivo es hacer la app INSTALABLE como PWA. No cachea nada de forma
// agresiva (para no servir versiones viejas): deja que el navegador maneje la red
// con normalidad. Así se puede instalar a pantalla completa sin romper el login,
// el perfil, los productos ni las tasas.
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler de fetch "passthrough": necesario para que el navegador considere la app
// instalable. No intercepta la respuesta → la petición sigue su curso normal a la red.
self.addEventListener("fetch", () => {
  // sin respondWith: comportamiento de red por defecto
});
