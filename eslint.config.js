import globals from "globals";
import react from "eslint-plugin-react";

// Configuración mínima de ESLint usada como RED DE SEGURIDAD durante la
// reorganización del código en archivos por pantalla/sección.
// Detecta referencias indefinidas (algo que el build de Vite NO detecta):
//   - "no-undef": identificadores normales usados sin importar/declarar.
//   - "react/jsx-no-undef": componentes usados como etiqueta JSX (<Foo/>)
//     sin importar/declarar (no-undef por sí solo NO cubre el caso JSX).
export default [
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { react },
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
      "react/jsx-no-undef": "error",
    },
  },
];
