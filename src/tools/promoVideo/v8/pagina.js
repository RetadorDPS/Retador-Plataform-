// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional v8.8 — ENTRADA de la página del iframe
// (herramientas/video.html). La app (PromoVideoTool.jsx) le manda los datos
// reales por postMessage (mismo dominio): plan, color y nombre de tienda,
// productos publicados y, si viene de "Producto publicado", el producto inicial.
// ═════════════════════════════════════════════════════════════════════════════
// Fuentes del prototipo (Manrope, Bricolage Grotesque, DM Sans) incluidas en la
// app, sin CDN.
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/bricolage-grotesque/800.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "./editor.css";
import { iniciarEditor } from "./ui.js";
import { setWatermarkLogo } from "./salida.js";

const ORIGEN = window.location.origin;
const LOGO = import.meta.env.BASE_URL + "icons/icon-192.png";

function avisarApp(tipo) {
  if (window.parent && window.parent !== window) window.parent.postMessage({ fuente: "retador-video", tipo }, ORIGEN);
}

// El canvas no espera a las fuentes ni al logo: se cargan antes del primer dibujo.
const logoListo = new Promise(function (resolve) {
  const img = new Image();
  img.onload = function () { setWatermarkLogo(img); resolve(); };
  img.onerror = function () { resolve(); };
  img.src = LOGO;
});
const fuentesListas = document.fonts
  ? Promise.all(["500 40px Manrope", "600 40px Manrope", "700 40px Manrope", "800 40px Manrope",
      '700 40px "Bricolage Grotesque"', '800 40px "Bricolage Grotesque"',
      '400 40px "DM Sans"', '500 40px "DM Sans"', '700 40px "DM Sans"'].map(f => document.fonts.load(f))).catch(() => {})
  : Promise.resolve();

let editor = null, iniciando = false, pendiente = null;
window.addEventListener("message", async function (e) {
  if (e.origin !== ORIGEN || !e.data || e.data.fuente !== "retador-app") return;
  if (e.data.tipo === "iniciar" && !iniciando) {
    iniciando = true;
    const datos = e.data.datos || {};
    document.documentElement.setAttribute("data-theme", datos.tema === "dark" ? "dark" : "light");
    await Promise.all([logoListo, fuentesListas]);
    editor = iniciarEditor(Object.assign({}, datos, { onPlanes: () => avisarApp("planes") }));
    if (pendiente) { editor.actualizar(pendiente); pendiente = null; }
  } else if (e.data.tipo === "actualizar") {
    if (editor) editor.actualizar(e.data.datos); else pendiente = Object.assign({}, pendiente, e.data.datos);
  }
});
avisarApp("lista");
