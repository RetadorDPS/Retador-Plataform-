// Notificaciones PUSH reales (Web Push): llegan aunque la app esté cerrada.
// Llave pública VAPID (la privada vive solo en el backend / Edge Function).
import { savePushSubscription, deletePushSubscription, supabase } from "../shared/index.js";

export const VAPID_PUBLIC_KEY = "BOwMtO9kilts_eoKBqecA_cr8YiQv0S4QoNJYZW7UAvkr_w_JK1Lq5oG5UyLnn2D9qgRzEzwD80TYQkhLSDSslM";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// ── Diagnóstico (push_client_log) — SOLO observabilidad, nunca lógica de negocio.
// Hoy el catch silencioso de ensurePushSubscription/enablePush deja fallos reales
// (renovación tras un 410, RLS, etc.) sin ningún rastro. Esto añade ese rastro sin
// tocar ninguna condición existente. El endpoint NUNCA se guarda entero: solo un
// hash corto no reversible (SHA-256 recortado, con fallback si no hay crypto.subtle).
async function hashEndpointCorto(endpoint) {
  if (!endpoint) return null;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
    }
  } catch (e) {}
  // Fallback simple (no criptográfico) si crypto.subtle no está disponible: sigue sin ser reversible.
  let h = 0;
  for (let i = 0; i < endpoint.length; i++) h = (h * 31 + endpoint.charCodeAt(i)) | 0;
  return "fb" + Math.abs(h).toString(16).padStart(8, "0").slice(0, 10);
}

// "Fire and forget": nunca se espera (no hay await en las llamadas) y todo su
// cuerpo real corre dentro de un try/catch propio, así que jamás puede lanzar
// hacia quien la llama ni retrasar/afectar la suscripción real.
function logPushEvent(stage, detail, userId, endpoint) {
  (async () => {
    try {
      const epHash = endpoint ? await hashEndpointCorto(endpoint) : null;
      const full = epHash ? [detail, "ep:" + epHash].filter(Boolean).join(" | ") : (detail || null);
      await supabase.from("push_client_log").insert({
        user_id: userId ?? null,
        stage,
        detail: full,
        user_agent: (typeof navigator !== "undefined" && navigator.userAgent) || null,
      });
    } catch (e) { /* nunca debe afectar el flujo real de push */ }
  })();
}

export function isStandalone() {
  return typeof window !== "undefined" && (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true
  );
}
export function isIOS() {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}
// iOS solo soporta Web Push con la app instalada (pantalla de inicio) en Safari 16.4+.
// En desarrollo el service worker no se registra (ver registerSW.js) → sin soporte real.
export function isPushSupported() {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.PROD) return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") return false;
  if (isIOS() && !isStandalone()) return false;
  return true;
}

export async function hasActiveSubscription() {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch (e) { return false; }
}

// Pide permiso (si hace falta) y suscribe. Nunca pide permiso "de golpe": solo se
// llama cuando el usuario toca "Activar" en la tarjeta o el interruptor de Ajustes.
export async function enablePush(userId) {
  if (!userId || !isPushSupported()) return { ok: false, reason: "unsupported" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: perm };
  logPushEvent("push_permission", "permiso concedido (enablePush)", userId);
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
      logPushEvent("subscription_created", "nueva suscripción creada (enablePush)", userId, sub && sub.endpoint);
    }
    await savePushSubscription(sub, userId);
    logPushEvent("subscription_saved", "suscripción guardada (enablePush)", userId, sub && sub.endpoint);
    return { ok: true };
  } catch (e) {
    logPushEvent("subscription_error", "enablePush: " + (e && e.message ? e.message : String(e)), userId);
    return { ok: false, reason: "error" };
  }
}

export async function disablePush() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      try { await sub.unsubscribe(); } catch (e) {}
      await deletePushSubscription(endpoint);
    }
  } catch (e) {}
}

// AUTO-RENOVACIÓN INVISIBLE de la suscripción push. Se llama en CADA carga de la
// app: el usuario nunca sabe que existe el concepto de "suscripción".
//   · Si el permiso NO está concedido (o el navegador no soporta push): no hace
//     NADA (silencioso). Nunca vuelve a pedir permiso — solo repara lo ya dado.
//   · Si hay una suscripción válida: la reasocia a ESTE usuario (upsert por
//     endpoint) — importante si el mismo navegador lo usan varias cuentas.
//   · Si NO existe, EXPIRÓ, o el navegador la reporta inválida: crea una nueva EN
//     SILENCIO (el permiso ya está concedido) y la guarda. Así se autorrepara sola
//     con el tiempo, sin intervención del usuario.
export async function ensurePushSubscription(userId) {
  if (!userId || !isPushSupported()) return;                 // navegador sin push
  if (Notification.permission !== "granted") return;          // permiso no concedido: silencioso
  logPushEvent("push_permission", "permiso concedido (ensurePushSubscription)", userId);
  try {
    const reg = await navigator.serviceWorker.ready;
    logPushEvent("sw_ready", "service worker listo", userId);
    let sub = await reg.pushManager.getSubscription();
    const expired = sub && typeof sub.expirationTime === "number" && sub.expirationTime <= Date.now();

    if (sub && !expired) {
      // Válida: solo la reasociamos a este usuario.
      logPushEvent("subscription_existing", "suscripción existente y vigente", userId, sub.endpoint);
      await savePushSubscription(sub, userId);
      logPushEvent("subscription_saved", "reasociada a este usuario", userId, sub.endpoint);
      return;
    }

    // No existe o expiró → la recreamos sin pedir permiso (ya está concedido).
    logPushEvent("subscription_missing", sub ? "suscripción expirada" : "sin suscripción", userId, sub ? sub.endpoint : null);
    if (sub && expired) { try { await sub.unsubscribe(); } catch (e) {} }
    const opts = { userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) };
    try {
      sub = await reg.pushManager.subscribe(opts);
    } catch (e) {
      // Una sub vieja con OTRA applicationServerKey bloquea la nueva: la quitamos y reintentamos.
      logPushEvent("subscription_error", "1er intento de subscribe falló: " + (e && e.message ? e.message : String(e)), userId);
      try { const old = await reg.pushManager.getSubscription(); if (old) await old.unsubscribe(); } catch (e2) {}
      sub = await reg.pushManager.subscribe(opts);
    }
    if (sub) {
      logPushEvent("subscription_created", "nueva suscripción creada", userId, sub.endpoint);
      await savePushSubscription(sub, userId);
      logPushEvent("subscription_saved", "suscripción nueva guardada", userId, sub.endpoint);
    }
  } catch (e) {
    logPushEvent("subscription_error", "ensurePushSubscription: " + (e && e.message ? e.message : String(e)), userId);
    /* silencioso: la auto-renovación jamás molesta al usuario */
  }
}

// Alias retro-compatible: el comportamiento de "reclamar" ahora lo cubre
// ensurePushSubscription (que además auto-renueva). Se mantiene por si algún
// punto del código lo importaba con el nombre antiguo.
export const reclaimPushSubscription = ensurePushSubscription;
