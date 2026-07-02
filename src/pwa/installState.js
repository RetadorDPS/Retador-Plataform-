// Captura y comparte el evento de instalación de la PWA.
// Se importa temprano (en main.jsx) para atrapar "beforeinstallprompt" aunque
// dispare antes de que React monte el cartel de instalación.

let deferredPrompt = null;
const listeners = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevenimos el cartel automático del navegador para mostrar el NUESTRO.
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((fn) => fn(e));
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn(null));
  });
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
}

// Suscribe un callback a los cambios del prompt. Devuelve una función para desuscribir.
export function onPromptChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
