// ─────────────────────────────────────────────────────────────────────────────
// RETADOR — Service Worker (PWA instalable + offline básico).
// Objetivo: que la app sea INSTALABLE de forma fiable (Chrome ofrece "Instalar")
// y que arranque aunque no haya red, SIN servir versiones viejas cuando SÍ hay red.
//   · Navegaciones (abrir la app): network-first → si no hay red, usa la copia.
//   · Estáticos con hash (JS/CSS/íconos): stale-while-revalidate.
//   · Otros orígenes (Supabase, imágenes externas): NO se tocan → van directo a la red.
// No interfiere con el login de Google, el perfil, los productos ni las tasas.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE = "retador-pwa-v79";
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

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICACIONES PUSH REALES (llegan aunque la app esté cerrada).
// El backend (Edge Function 'send-push') dispara esto en cada notificación nueva.
// ─────────────────────────────────────────────────────────────────────────────
const ICON = self.registration.scope + "icons/icon-192.png"; // respeta la subcarpeta de GitHub Pages
// El ícono chico de la barra de estado (Android) lo arma el SO a partir del canal
// alfa: icon-192.png es RGB opaco (sin transparencia real) → salía un cuadrado feo.
// badge-mono.png es la MARCA aislada (blanco sólido) sobre fondo TRANSPARENTE real.
const BADGE = self.registration.scope + "badge-mono.png";

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = { title: "RETADOR", body: event.data ? event.data.text() : "" }; }
  event.waitUntil((async () => {
    // Si la app está ABIERTA y VISIBLE, ya se ve el toast interno (realtime):
    // evita la notificación duplicada del sistema para el mismo aviso.
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const visible = allClients.some((c) => c.visibilityState === "visible");
    if (visible) return;
    await self.registration.showNotification(payload.title || "RETADOR", {
      body: payload.body || "",
      icon: ICON,
      badge: BADGE,
      data: payload,
      tag: payload.kind || "retador",
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil((async () => {
    const scope = self.registration.scope;
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Con una ventana ya abierta: la enfocamos y le avisamos (postMessage) a qué
    // conversación/pedido navegar SIN recargar la SPA (App.jsx escucha este mensaje).
    for (const c of allClients) {
      if ("focus" in c) { c.postMessage({ type: "retador-notification-click", data }); return c.focus(); }
    }
    // Sin ninguna ventana abierta: abrimos una nueva. Si es un aviso de mensaje,
    // añadimos la conversación en la URL para que la app navegue directo al abrir.
    const target = (data.kind === "message" && data.ref_id)
      ? `${scope}?openConv=${encodeURIComponent(data.ref_id)}`
      : scope;
    return self.clients.openWindow(target);
  })());
});
