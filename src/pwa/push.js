// Notificaciones PUSH reales (Web Push): llegan aunque la app esté cerrada.
// Llave pública VAPID (la privada vive solo en el backend / Edge Function).
import { savePushSubscription, deletePushSubscription } from "../shared/index.js";

export const VAPID_PUBLIC_KEY = "BOwMtO9kilts_eoKBqecA_cr8YiQv0S4QoNJYZW7UAvkr_w_JK1Lq5oG5UyLnn2D9qgRzEzwD80TYQkhLSDSslM";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
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
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
    await savePushSubscription(sub, userId);
    return { ok: true };
  } catch (e) { return { ok: false, reason: "error" }; }
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
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    const expired = sub && typeof sub.expirationTime === "number" && sub.expirationTime <= Date.now();

    if (sub && !expired) {
      // Válida: solo la reasociamos a este usuario.
      await savePushSubscription(sub, userId);
      return;
    }

    // No existe o expiró → la recreamos sin pedir permiso (ya está concedido).
    if (sub && expired) { try { await sub.unsubscribe(); } catch (e) {} }
    const opts = { userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) };
    try {
      sub = await reg.pushManager.subscribe(opts);
    } catch (e) {
      // Una sub vieja con OTRA applicationServerKey bloquea la nueva: la quitamos y reintentamos.
      try { const old = await reg.pushManager.getSubscription(); if (old) await old.unsubscribe(); } catch (e2) {}
      sub = await reg.pushManager.subscribe(opts);
    }
    if (sub) await savePushSubscription(sub, userId);
  } catch (e) { /* silencioso: la auto-renovación jamás molesta al usuario */ }
}

// Alias retro-compatible: el comportamiento de "reclamar" ahora lo cubre
// ensurePushSubscription (que además auto-renueva). Se mantiene por si algún
// punto del código lo importaba con el nombre antiguo.
export const reclaimPushSubscription = ensurePushSubscription;
