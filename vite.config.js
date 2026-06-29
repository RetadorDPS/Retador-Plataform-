import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El "base" debe coincidir con el nombre del repositorio para que GitHub Pages
// cargue bien los archivos (CSS, JS, imágenes) bajo la subcarpeta del repo.
// Repositorio: RetadorDPS/Retador-Plataform-  →  base "/Retador-Plataform-/"
export default defineConfig({
  plugins: [react()],
  base: "/Retador-Plataform-/",
});
