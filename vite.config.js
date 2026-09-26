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
export default defineConfig({
  plugins: [react()],
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
