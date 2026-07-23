// ─────────────────────────────────────────────────────────────────────────────
// RETADOR — Service Worker (PWA instalable + offline básico).
// Objetivo: que la app sea INSTALABLE de forma fiable (Chrome ofrece "Instalar")
// y que arranque aunque no haya red, SIN servir versiones viejas cuando SÍ hay red.
//   · Navegaciones (abrir la app): network-first → si no hay red, usa la copia.
//   · Estáticos con hash (JS/CSS/íconos): stale-while-revalidate.
//   · Otros orígenes (Supabase, imágenes externas): NO se tocan → van directo a la red.
// No interfiere con el login de Google, el perfil, los productos ni las tasas.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE = "retador-pwa-v82";
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

// ── REGISTRO REAL del ciclo del push en la base (public.push_client_log) ───────
// No depende de que el usuario mande captura: cada push deja rastro (recibido /
// mostrado / error con el mensaje exacto). Usa las llaves PÚBLICAS del bundle
// (lo que protege los datos es el RLS). NUNCA lanza: un fallo de log jamás debe
// romper el push. La tabla debe existir con una policy que permita INSERT anónimo.
const SUPA_URL = "https://qsxtjuhueqdxoduyroli.supabase.co";
const SUPA_KEY = "sb_publishable_VbX-xBAVLKl_SnrkOTxc2w_oTe5-1Va";
function logPush(entry) {
  try {
    return fetch(SUPA_URL + "/rest/v1/push_client_log", {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY,
        "Authorization": "Bearer " + SUPA_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        user_id: entry.user_id || null,
        stage: entry.stage,
        detail: entry.detail || null,
        user_agent: (self.navigator && self.navigator.userAgent) || null,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { return Promise.resolve(); }
}

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {};
    let userId = null;
    const bg = []; // logs en segundo plano — nunca bloquean el showNotification
    try {
      // Parseo tolerante: si no es JSON, degradamos a texto plano.
      try { payload = event.data ? event.data.json() : {}; }
      catch (e) { payload = { title: "RETADOR", body: event.data ? event.data.text() : "" }; }
      userId = payload.user_id || payload.userId || (payload.data && payload.data.user_id) || null;
      // 1) Registro de ENTRADA (antes de cualquier otra cosa), sin await.
      bg.push(logPush({ user_id: userId, stage: "push_received" }));

      // Si la app está ABIERTA y VISIBLE, ya se ve el toast interno (realtime):
      // evita duplicar el aviso del sistema. Con un cliente visible, Chrome NO
      // penaliza con el aviso genérico por no llamar showNotification.
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const visible = allClients.some((c) => c.visibilityState === "visible");

      if (!visible) {
        await self.registration.showNotification(payload.title || "RETADOR", {
          body: payload.body || "Tienes una notificación nueva",
          icon: ICON,
          badge: BADGE,
          tag: payload.kind || "retador",
          renotify: true,
          vibrate: [80, 40, 80],
          data: { kind: payload.kind || null, ref_id: payload.ref_id || null, ...payload },
        });
      }
      // 2) Registro de SALIDA con éxito.
      bg.push(logPush({ user_id: userId, stage: "shown", detail: visible ? "omitida (app visible)" : null }));
    } catch (err) {
      // Pase lo que pase, mostramos ALGO (nunca el aviso genérico de Chrome) y lo
      // registramos con el mensaje real del error.
      try {
        await self.registration.showNotification("RETADOR", {
          body: "Tienes una notificación nueva",
          icon: ICON,
          badge: BADGE,
          tag: "retador",
          renotify: true,
        });
      } catch (e2) { /* si ni esto se puede, el catch de abajo lo deja en la base */ }
      bg.push(logPush({ user_id: userId, stage: "error", detail: (err && err.message) ? err.message : String(err) }));
    }
    // Esperamos a los logs con un tope de 4 s — sin retrasar el showNotification
    // ya hecho arriba (si la red del log cuelga, no arrastra al aviso).
    try { await Promise.race([Promise.allSettled(bg), new Promise((r) => setTimeout(r, 4000))]); } catch (e) {}
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
    // Sin ninguna ventana abierta: abrimos una nueva y dejamos el destino en la URL
    // para que la app navegue directo al abrir, según el tipo de aviso.
    let target = scope;
    if (data.ref_id) {
      if (data.kind === "message") target = `${scope}?openConv=${encodeURIComponent(data.ref_id)}`;
      else if (data.kind === "order") target = `${scope}?openOrder=${encodeURIComponent(data.ref_id)}`;
    }
    return self.clients.openWindow(target);
  })());
});
