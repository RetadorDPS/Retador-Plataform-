// Actualiza el color de las barras del sistema (barra de estado arriba y barra
// de navegación abajo) para que combinen con el fondo de la app.
// En Android/Chrome, la meta <theme-color> tiñe las barras del sistema; en cuanto
// cambia el tema de la app, llamamos a esto con el color exacto del nuevo tema.
// index.html declara DOS etiquetas <meta name="theme-color"> (una por media
// query prefers-color-scheme, para que el color correcto ya esté puesto desde
// el primer byte sin depender de JS) — por eso aquí se actualizan TODAS
// (querySelectorAll), nunca solo la primera: si solo se tocara una, un
// usuario que eligió DENTRO de la app un tema distinto al de su sistema vería
// la barra pintada con el color de la etiqueta que su sistema no eligió.
export function setThemeColor(color) {
  if (typeof document === "undefined" || !color) return;
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (!metas.length) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);
  } else {
    metas.forEach(m => m.setAttribute("content", color));
  }
  // El fondo del documento también se pinta del mismo tono, para que las zonas
  // bajo las barras (safe areas / overscroll) nunca muestren un color distinto.
  document.documentElement.style.backgroundColor = color;
  document.body.style.backgroundColor = color;
}
