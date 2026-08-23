import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./pwa/installState.js"; // captura "beforeinstallprompt" cuanto antes
import { registerSW } from "./pwa/registerSW.js";

// ── Recuperación real ante un chunk JS "fantasma" (pantalla en blanco) ──────
// Investigado a fondo: tras cada despliegue nuevo, GitHub Pages reemplaza TODOS
// los archivos de golpe (nunca queda el build viejo al lado). Si el navegador
// de alguien ya tenía cargado el índice viejo (o el Service Worker se lo sirvió
// de su caché) justo cuando entra a una parte de la app que pide un pedazo de
// JS aparte (React.lazy: AdminPanel, Wallet, StoreCharts…), ese archivo con su
// nombre-hash viejo YA NO EXISTE en el servidor — Vite dispara el evento real
// "vite:preloadError" en ese caso exacto. Antes esto se quedaba en pantalla
// en blanco sin ninguna recuperación. Ahora: se recarga la página UNA sola vez
// (nunca en bucle — sessionStorage se borra recién cuando la app carga bien),
// lo que trae el índice y los archivos nuevos de verdad.
window.addEventListener("vite:preloadError", () => {
  if (sessionStorage.getItem("retador_reload_chunk_fail")) return; // ya se intentó en esta pestaña
  sessionStorage.setItem("retador_reload_chunk_fail", "1");
  window.location.reload();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
// La app real ya montó — se borra la marca de "ya recargué una vez", así un
// chunk fantasma FUTURO (ej. el próximo despliegue) puede volver a recargar
// una vez más en vez de quedar bloqueado para siempre en esta pestaña.
try { sessionStorage.removeItem("retador_reload_chunk_fail"); } catch (e) {}

registerSW();
