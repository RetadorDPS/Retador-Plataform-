// ─────────────────────────────────────────────────────────────────────────────
// RETADOR — Service Worker (PWA instalable + offline básico).
// Objetivo: que la app sea INSTALABLE de forma fiable (Chrome ofrece "Instalar")
// y que arranque aunque no haya red, SIN servir versiones viejas cuando SÍ hay red.
//   · Navegaciones (abrir la app): network-first → si no hay red, usa la copia.
//   · Estáticos con hash (JS/CSS/íconos): stale-while-revalidate.
//   · Otros orígenes (Supabase, imágenes externas): NO se tocan → van directo a la red.
// No interfiere con el login de Google, el perfil, los productos ni las tasas.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE = "retador-pwa-v28";
const START = self.registration.scope; // p.ej. https://retadordps.github.io/Retador-Plataform-/

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      await cache.add(new Request(START, { cache: "reload" }));
    } catch (e) { /* sin red en la instalación: no pasa nada */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // solo mismo origen

  // Navegaciones (abrir/recargar la app): red primero, copia como respaldo.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(START, fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE);
        return (await cache.match(START)) || (await cache.match(req)) || Response.error();
      }
    })());
    return;
  }

  // Estáticos: responde desde caché al instante y actualiza en segundo plano.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone()).catch(() => {});
        return res;
      })
      .catch(() => cached);
    return cached || network;
  })());
});
