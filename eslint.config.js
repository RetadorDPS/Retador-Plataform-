import globals from "globals";

// Configuración mínima de ESLint usada como RED DE SEGURIDAD durante la
// reorganización del código en archivos por pantalla/sección.
// Solo nos interesa "no-undef": detecta cualquier identificador usado pero no
// importado ni declarado en el archivo (algo que el build de Vite NO detecta y
// que sería un error en tiempo de ejecución).
export default [
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      "no-undef": "error",
    },
  },
];
