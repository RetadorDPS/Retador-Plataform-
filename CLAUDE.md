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

## Proveedores: CJ y AliExpress son independientes (obligatorio)

- RETADOR tiene DOS proveedores independientes: **CJ** y **AliExpress**. Todo lo que habla con un proveedor (importar, cotizar envío, stock, tokens) vive en funciones propias de ese proveedor (`cj-*` para CJ, `ali-*` para AliExpress).
- Un cambio pedido para un proveedor NUNCA modifica funciones, tablas ni lógica del otro. Si parece necesario tocar el otro, se pregunta antes a Daniel.
- Solo se comparte lo que es igual para todos: checkout, pedidos, comisión, fulfillment y pantallas. Lo compartido recibe datos ya calculados por el proveedor y no llama al proveedor directamente. El punto central (`catalog-pro-freight-quote`) solo decide a qué función de proveedor llamar según el `provider` del producto.
- Después de cualquier cambio, verificar que el otro proveedor sigue funcionando igual que antes.

## Arreglos en el sistema, nunca parches

- Todo arreglo se hace en el SISTEMA, nunca como parche a un producto. Si hay productos viejos afectados, se hace backfill a todos (catálogo, staging y copias de vendedores).

## Dinero y datos

- El costo real del proveedor nunca lo ve un vendedor ni un comprador (solo el admin).
- Envío a Cuba: siempre proveedor → hub de Phoenix (EE. UU.) → Cuba. Precio = tramo real al hub + tramo hub→Cuba (tarifa por libra de `platform_config` × peso real). Días = días al hub + rango hub→Cuba.
- Nunca inventar datos. Si un dato no existe en la API, se dice y se usa la opción más conservadora.

## Presupuesto de llamadas a APIs externas

- No hacer pruebas masivas ni en paralelo contra CJ o AliExpress: en serie, con pausa entre llamadas y con el mínimo necesario. CJ ya congeló el acceso una vez por exceso de llamadas, y AliExpress corta con `AppApiCallLimit` si se llama en paralelo.

## Honestidad en los reportes

- Reportar siempre qué se verificó en la app real, qué solo en datos y qué no se pudo verificar.

## Contexto del proyecto

RETADOR — marketplace para Cuba/España. App real, ya desplegada en producción (GitHub Pages, `retadordps.github.io/Retador-Plataform-/`), usada por gente real. El despliegue se dispara automáticamente al hacer push a `main` (ver `.github/workflows/deploy.yml`).
