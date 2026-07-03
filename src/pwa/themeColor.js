// Pinta las barras del sistema (arriba: estado; abajo: navegación) del color del
// tema actual, para que combinen con el fondo de la app en CUALQUIER teléfono.
// En Android/Chrome la meta <theme-color> tiñe las barras del sistema.
//
// IMPORTANTE (evitar el "filito"): esta función se llama de forma SÍNCRONA en el
// mismo instante en que cambia el tema (no en un useEffect posterior). Así la
// barra y el fondo cambian en el mismo frame; nunca hay un frame con la barra de
// un color y el fondo de otro, que es lo que en MIUI/HyperOS dejaba una raya fija
// bajo la barra de estado.
export function setThemeColor(color) {
  if (typeof document === "undefined" || !color) return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
  // El fondo del documento también se pinta del mismo tono, para que las zonas
  // bajo las barras (safe areas / overscroll) nunca muestren un color distinto.
  document.documentElement.style.backgroundColor = color;
  document.body.style.backgroundColor = color;
}
