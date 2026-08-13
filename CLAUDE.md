# CLAUDE.md

## Regla de idioma (obligatoria, sin excepciones)

TODO el trabajo realizado en este repositorio debe estar en **ESPAÑOL**, sin ninguna palabra en inglés, salvo nombres de funciones, variables, tablas o identificadores técnicos que ya existan en el código (esos no se traducen, pero sí las explicaciones alrededor de ellos). Esto aplica a:

- Respuestas al usuario en el chat.
- Comentarios dentro del código.
- Mensajes de commit.
- Textos, etiquetas, mensajes de error y cualquier copy visible en la app (frontend).
- Reportes, resúmenes y documentación generada.

El dueño del proyecto no habla inglés. Nunca respondas ni escribas en inglés en este repositorio.

## Regla de reportes

Al final de CUALQUIER reporte de trabajo realizado en este proyecto, siempre se debe indicar el número de versión real resultante. La fuente de verdad del número de versión es el nombre de caché del Service Worker (`public/sw.js` → `CACHE = "retador-pwa-vNN"`) junto con `APP_VERSION_FALLBACK` en `src/shared/theme.jsx` (deben coincidir siempre). `package.json` se queda fijo en `1.0.0` y NO refleja la versión real — nunca reportar ese número. Al desplegar, subir ambos valores (`CACHE` y `APP_VERSION_FALLBACK`) al mismo número nuevo. Nunca omitir este dato en el reporte final.

## Verificación contra datos reales

Este proyecto tiene acceso real a Supabase mediante conectores MCP. Antes de declarar un bug "resuelto" o una funcionalidad "verificada", se debe confirmar contra datos y funciones reales de Supabase (no solo simulación o lectura de código sin ejecutar), siempre que sea posible.

## Contexto del proyecto

RETADOR — marketplace para Cuba/España. App real, ya desplegada en producción (GitHub Pages, `retadordps.github.io/Retador-Plataform-/`), usada por gente real. El despliegue se dispara automáticamente al hacer push a `main` (ver `.github/workflows/deploy.yml`).
