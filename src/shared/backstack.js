// ─────────────────────────────────────────────────────────────────────────────
// Pila de "atrás" para overlays anidados (visor de fotos, perfil flotante,
// detalle de subasta, etc.).
//
// CÓMO FUNCIONA (estándar, sin trucos):
//  · Al ABRIR una capa, registra aquí su forma de cerrarse y se crea UNA entrada
//    REAL de historial del navegador para esa capa.
//  · ATRÁS del sistema → el navegador consume esa entrada y App.jsx llama a
//    consumeBack(), que solo tiene que CERRAR la capa. No hay que "recomponer"
//    entradas dentro del popstate (eso fallaba según el navegador).
//  · Si la capa se cierra con un botón EN PANTALLA (equis, flecha propia), al
//    des-registrarse retira su entrada con history.back() y App.jsx ignora ese
//    popstate (shouldIgnorePop). Así el historial nunca queda desbalanceado:
//    cada capa = una entrada; cada atrás = una capa.
// ─────────────────────────────────────────────────────────────────────────────
const stack = [];
let ignorePops = 0; // popstate provocados por nosotros al retirar entradas de capas

// Registra una capa: su forma de cerrarse + su entrada real de historial.
// Devuelve la función para des-registrarla (el cleanup del useEffect).
export function pushBackHandler(fn) {
  const item = { fn, popped: false };
  stack.push(item);
  try { window.history.pushState({ layer: stack.length }, ""); } catch (e) {}
  return () => {
    const i = stack.lastIndexOf(item);
    if (i >= 0) stack.splice(i, 1);
    if (!item.popped) {
      // Cerrada con un botón en pantalla (no con atrás): retiramos su entrada
      // para no dejarla huérfana. App.jsx ignorará este popstate.
      ignorePops++;
      try { window.history.back(); } catch (e) { ignorePops = Math.max(0, ignorePops - 1); }
    }
  };
}

// Ejecuta el handler de la capa de más arriba (si hay). Devuelve true si consumió
// el atrás. La capa se SACA de la pila aquí mismo (no espera al cleanup de React):
// así dos "atrás" muy seguidos nunca cierran dos veces la misma capa. Se marca
// popped para que su cleanup no vuelva a tocar el historial (su entrada ya la
// consumió el navegador).
export function consumeBack() {
  const item = stack[stack.length - 1];
  if (item && typeof item.fn === "function") { stack.pop(); item.popped = true; item.fn(); return true; }
  return false;
}

// ¿Este popstate lo provocamos nosotros al retirar la entrada de una capa
// cerrada en pantalla? (App.jsx lo consulta y, si es así, no hace nada.)
export function shouldIgnorePop() {
  if (ignorePops > 0) { ignorePops--; return true; }
  return false;
}

// Decide QUÉ debe hacer el botón atrás del teléfono. Primero los overlays/modales
// que están "por encima" (del más reciente al más antiguo); si no hay ninguno,
// devuelve "screens" para que App.jsx use el HISTORIAL real de pasos (deshace la
// última navegación de pantalla/pestaña, sea la que sea). Función pura y probable.
export function decideSystemBack(s = {}) {
  if (s.plusMenu)    return "plusMenu";
  if (s.editProd)    return "editProd";
  if (s.confirmCfg)  return "confirmCfg";
  if (s.buyModal)    return "buyModal";
  if (s.toolApp)     return "toolApp";
  if (s.showTools)   return "showTools";
  if (s.showCourier) return "showCourier";
  if (s.showAdmin)   return "showAdmin";
  if (s.showWallet)  return "showWallet";
  if (s.showChats)   return "showChats";
  if (s.showNotif)   return "showNotif";
  if (s.showCats)    return "showCats";
  if (s.pubOpen)     return "pubOpen";
  return "screens";
}
