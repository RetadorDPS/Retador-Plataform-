// ─────────────────────────────────────────────────────────────────────────────
// Pila de "atrás" para overlays anidados (visor de fotos, etc.).
// Un componente que abre una capa a pantalla completa registra aquí su forma de
// cerrarse; cuando el usuario pulsa el botón ATRÁS del teléfono, App.jsx llama a
// consumeBack(), que cierra la capa más reciente (la de más arriba) y devuelve
// true. Si no hay ninguna capa registrada, devuelve false y App.jsx sigue con su
// propia lógica de pantallas/pestañas.
// ─────────────────────────────────────────────────────────────────────────────
const stack = [];

// Registra una forma de "cerrar/retroceder". Devuelve una función para quitarla.
export function pushBackHandler(fn) {
  stack.push(fn);
  return () => {
    const i = stack.lastIndexOf(fn);
    if (i >= 0) stack.splice(i, 1);
  };
}

// Ejecuta el handler de más arriba (si hay). Devuelve true si consumió el atrás.
export function consumeBack() {
  const fn = stack[stack.length - 1];
  if (typeof fn === "function") { fn(); return true; }
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
