import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// BUG REAL corregido: RETADOR ahora se sirve desde la raíz de un dominio
// propio (retadormarketplace.es), no desde
// https://retadordps.github.io/Retador-Plataform-/. Con base fijo en
// "/Retador-Plataform-/", el JS/CSS del build se pedía en
// retadormarketplace.es/Retador-Plataform-/assets/... — esa ruta no existe
// en la raíz del dominio, así que daba 404 y la app nunca llegaba a cargar
// (pantalla en negro: el script de tema deja el fondo oscuro, pero nada más
// corre). "/" es el valor real correcto para servir desde la raíz.
// Dos páginas: la app (index.html) y el Generador de Video Promocional
// (herramientas/video.html), que la app abre dentro de un iframe.
// [v8.8] Lista de archivos para que el service worker los guarde al instalarse
// (public/sw.js → "precache.json"): así la app arranca sin conexión desde la
// pantalla de inicio y el Generador de Video tiene su página, código, fuentes
// (solo latín, que es lo que usa el español) y logo sin red. Se genera en cada
// build con los nombres con hash reales, nunca a mano.
function listaPrecache() {
  return {
    name: "retador-precache",
    apply: "build",
    generateBundle(_opts, bundle) {
      const files = Object.values(bundle);
      const byName = Object.fromEntries(files.map((f) => [f.fileName, f]));
      const fuenteOk = (n) => !/\.(woff2?|ttf)$/.test(n) || (/-latin-/.test(n) && n.endsWith(".woff2"));
      function recoger(entryName, conDinamicos) {
        const entry = files.find((f) => f.type === "chunk" && f.isEntry && f.name === entryName);
        const out = new Set(), seen = new Set();
        (function walk(ch) {
          if (!ch || seen.has(ch.fileName)) return;
          seen.add(ch.fileName); out.add(ch.fileName);
          const meta = ch.viteMetadata || {};
          (meta.importedCss || []).forEach((c) => out.add(c));
          (meta.importedAssets || []).forEach((a) => { if (fuenteOk(a)) out.add(a); });
          (ch.imports || []).forEach((i) => walk(byName[i]));
          if (conDinamicos) (ch.dynamicImports || []).forEach((i) => walk(byName[i]));
        })(entry);
        return [...out];
      }
      const lista = {
        app: ["index.html", "icons/icon-192.png"].concat(recoger("main", false)),
        herramienta: ["herramientas/video.html", "icons/icon-192.png"].concat(recoger("video", true)),
      };
      this.emitFile({ type: "asset", fileName: "precache.json", source: JSON.stringify(lista) });
    },
  };
}

export default defineConfig({
  plugins: [react(), listaPrecache()],
  base: "/",
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        video: fileURLToPath(new URL("./herramientas/video.html", import.meta.url)),
      },
    },
  },
});
