// Actualiza el color de las barras del sistema (barra de estado arriba y barra
// de navegación abajo) para que combinen con el fondo de la app.
// En Android/Chrome, la meta <theme-color> tiñe las barras del sistema; en cuanto
// cambia el tema de la app, llamamos a esto con el color exacto del nuevo tema.
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
