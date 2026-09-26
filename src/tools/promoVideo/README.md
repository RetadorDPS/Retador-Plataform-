# Generador de Video Promocional — RETADOR

**Versión actual: v8.7** (archivo `retador-video-generador-v8.7.html`).
**Versión que hoy está en la plataforma: v8.7** (integrada en la v238 de RETADOR;
reemplazó a la v7.3). Ver "Integración en RETADOR (v8.7)" justo abajo.
Lo nuevo desde v7.3 está en las secciones "v8.7" a "v8.0" justo debajo, y en el
código cada bloque nuevo va marcado con su versión (`[v8.3]` … `[v8.0]`).

**Estilos disponibles (8, ninguno se elimina sin que Daniel lo pida explícitamente):**
Acercamiento, Noria horizontal, Escenas secuenciales, Antes/Después, Mosaico de
catálogo, **Directo** (v8.0), **Desfile** (v8.2) y **Vitrina** (v8.5).
**Temas de color:** Crema (marca, predeterminado), Oscuro premium y Foto propia.
El estilo Directo tiene sus propias paletas y no usa los temas.

**Regla de versiones:** cada cambio sube la versión (v8.1, v8.2…) y se documenta
aquí, en una sección nueva arriba de las anteriores, antes de pasarlo a Claude Code.

---

## Integración en RETADOR (v8.7) — plataforma v238

### Dónde vive
- **Página propia del mismo dominio:** `herramientas/video.html` (segunda entrada de
  Vite en `vite.config.js`). La app la abre dentro de un **iframe** con
  `allow="web-share"` desde `src/tools/promoVideo/PromoVideoTool.jsx`.
  Motivo: el HTML y el CSS quedan idénticos al prototipo y a salvo de los estilos
  globales de la app (que fuerzan `font-size:16px` en campos, espaciado de letras…).
- **Entradas (las mismas que tenía la v7.3):** ☰ → Herramientas → "Video Promocional"
  (para todos) y Mi Panel → Promociones → "Crear video" (solo Pro/Premium).
- **Nueva entrada:** al publicar un producto (y al guardar su edición desde el
  editor) aparece un aviso "Producto publicado. Genera un video promocional y
  compártelo" con el botón **Crear video**, que abre la herramienta en el estilo
  **Directo** con ESE producto cargado (foto, título, precio, existencias, moneda).

### Módulos (`src/tools/promoVideo/v8/`)
| Archivo | Contenido (líneas del prototipo) |
|---|---|
| `motor.js` | tiempo, temas, emojis, dibujo base y elementos compartidos |
| `estilos.js` | los 8 estilos + registro `STYLES` |
| `audio.js` | música y efectos creados por código, mezcla, AAC |
| `salida.js` | formatos, calidad, marca de agua, `makeRenderer`, exportación MP4/grabación |
| `ui.js` | formularios, vista previa, compartir, texto del post, Facebook |
| `facebook.js` | interruptor `FACEBOOK_PUBLICAR` y funciones vacías para el backend |
| `pagina.js` | entrada del iframe: fuentes, logo y datos de la app por `postMessage` |
| `editor.css` | CSS del prototipo, tal cual |

**Fidelidad comprobada con script:** de 4.195 líneas del prototipo, 67 cambian y
todas son puntos de integración marcados `[integración]` (selector de plan,
catálogo simulado, "R" provisional, simulación de Facebook, enlaces, asignadores de
moneda/formato/calidad/foto de fondo y carga de mp4-muxer). Además, comparando
píxel a píxel con el reloj congelado, los 8 estilos dan fotogramas **idénticos**
al prototipo (80/80 en vertical, feed y cuadrado).

### De dónde lee cada dato
- **Plan:** `getPlanPerks(myRealPlan)` (`src/shared/planPerks.js`, un solo lugar).
  Solo `plans.can_customize === true` quita la marca. Gratis, sin sesión, planes sin
  cargar o plan desconocido → CON marca. Se quitó el selector "Plan del vendedor
  (solo para probar)".
- **Marca de agua:** la misma píldora del prototipo; el símbolo "R" se sustituyó por
  el logotipo oficial `public/icons/icon-192.png` (mismo dominio: no contamina el canvas).
  Para gratis, bajo "Generar" hay un aviso con enlace al modal real de Planes.
- **Color y nombre (Pro/Premium):** `store_config.accent` y `store_config.name`. El
  naranja RETADOR sigue en la fila de colores. Gratis o sin nombre → campo vacío.
- **Productos de "Selecciona un producto de tu tienda":** `products` del vendedor con
  `status='active'`, `moderation_status='approved'`, `archived_at` nulo y
  `kind='product'` → `{ id, title, price, currency, stock, image = images[0] }`.
  Al elegirlo se guarda `target.product` como en el prototipo y la moneda del video
  pasa a la del producto (USD/EUR/CUP).
  - Si el servidor de la foto no da permiso CORS (posible en fotos de CJ o
    AliExpress), la foto no se usa y aparece: "La foto de este producto no se puede
    usar en el video. Súbela desde tu teléfono…" (decisión de Daniel).
- **Enlaces del texto del post:** `retadormarketplace.es/?openProduct={id}` y
  `retadormarketplace.es/?openProfile={idVendedor}` (los enlaces de invitado de la
  app: funcionan al instante, también para un producto recién publicado).

### Facebook
- `FACEBOOK_PUBLICAR = false` en `facebook.js`: el botón no aparece en producción.
- Se quitó toda la simulación (páginas de ejemplo, esperas falsas, enlace inventado).
  El flujo (conectar → elegir página → texto → publicar → estado) llama a
  `fbConectar`, `fbListarPaginas`, `fbSubirVideo`, `fbPublicar`, `fbEsperarProcesado`,
  que hoy lanzan "todavía no disponible". Cada una debe llamar a una Edge Function:
  el token nunca vive en el navegador.

### Otros cambios necesarios
- `public/sw.js`: antes guardaba CUALQUIER navegación como página de inicio; el
  iframe la habría sobreescrito (sin red, la app arrancaría en la herramienta).
  Ahora solo la página de inicio se guarda como tal.
- Librerías con versión exacta: `mp4-muxer 5.2.2` (pista AAC), `@fontsource/manrope`,
  `@fontsource/bricolage-grotesque`, `@fontsource/dm-sans` 5.3.0, sin CDN.
  Bricolage llega hasta el peso 800 (igual que en Google Fonts).
- Las fuentes y el logo se cargan ANTES del primer dibujo (el prototipo cargaba DM
  Sans tarde y los primeros fotogramas de Desfile salían con otra letra).

### Pruebas y lo que falta probar (ver informe de la integración)
- Hecho aquí (Chromium sin H.264 ni AAC): 8 estilos idénticos al prototipo; 6 videos
  reales (3 formatos × Alta/Ligera) con música y efectos por la ruta de grabación;
  marca con logo en el archivo gratis y sin marca en Pro; productos reales, aviso de
  foto externa, prellenado Directo, texto de compartir con enlaces reales, Facebook
  oculto, enlace a Planes.
- **Pendiente en teléfonos reales:** MP4 con H.264 + AAC, Compartir → WhatsApp,
  iPhone (Safari) y Android de gama baja.
- **Riesgo conocido del prototipo:** si el teléfono tiene H.264 pero NO codificador
  AAC y hay música, `exportVideo` usa la grabación en tiempo real, que en un teléfono
  lento puede salir con saltos (no es fotograma a fotograma).

---

## v8.7 — Compartir nativo, calidad Ligera (720p) y monedas reales

### Compartir nativo (WhatsApp, Instagram, Telegram…)
- Tras generar el video aparece **"📤 Compartir (WhatsApp, Instagram…)"** junto a
  "Descargar video". Usa la Web Share API con archivo (`navigator.share({ files })`):
  abre el menú del teléfono. Sin backend ni aprobación de Meta.
- Solo se muestra si el navegador puede compartir ese archivo
  (`navigator.canShare({ files: [file] })`); si no, queda solo "Descargar".
- Va en un **toque aparte** a propósito: los navegadores solo permiten compartir
  justo después de un toque, y generar el video tarda más que ese margen.
- Se envía también un texto corto (plantilla "Directo" del texto del post).
- Al integrar en la plataforma: si la página va dentro de un iframe, este necesita
  `allow="web-share"`; en la vista previa de artefactos de Claude puede no funcionar.

### Calidad del archivo
- Selector en la tarjeta de acciones: **Alta** (1080p, 10 Mbps, ≈10–12 MB) o
  **Ligera** (720p = escala 2/3, 3,2 Mbps, ≈3–4 MB) para datos móviles.
  Respaldo de grabación: 9 / 3,5 Mbps. Aplica a descarga, Compartir y Facebook.
- Implementación: `QUALITIES`, `Q()`, `outDims()`; los exportadores pasan
  `Q().scale` a `makeRenderer` (la misma escala que ya usa la vista previa), el
  códec se consulta con las medidas reales. Todas las medidas salen pares
  (720×1280, 720×900, 720×720), como exige H.264.
- El detalle del resultado muestra medidas reales y peso en MB.

### Monedas
- Lista nueva (`CURRENCIES`): **USD** (predeterminada), **€**, **CUP**, **Zelle** y,
  al final, **MLC** (se mantiene por si alguien la usa). Se quitaron "$" y "US$".
- Siempre detrás del número ("32 USD", "32 €", "3200 CUP", "32 Zelle") para no
  confundir el $ del dólar con el del peso. Si el vendedor escribe texto propio
  en el precio (p. ej. "Gratis"), se respeta tal cual.
- Una sola moneda por video (se elige en cualquier fila de precio); también la
  usa el texto de la publicación de Facebook.

---

## v8.6 — Vitrina: parte media con más variedad y muro de fotos en movimiento

**Motivo:** Daniel notó que en la parte media de Vitrina se repetía el mismo
producto en todas las escenas (baja la emoción) y que en el anuncio de referencia
había imágenes moviéndose despacio. El inicio y el final no se tocan.

- **Muro de fotos** (`vtCollage`, 4,9–11,0 s): detrás de las tarjetas, una
  cuadrícula inclinada (−12°) con TODOS los productos alternados, desplazándose
  despacio (20 px/s a la derecha, 46 px/s hacia arriba), con velo claro teñido
  del color del producto para que las tarjetas resalten.
  - Rendimiento: el muro se pre-dibuja UNA vez por línea de tiempo a media
    resolución (`vtCollageCache`, guardado en `tl._collage`) y cada fotograma solo
    lo desplaza con un `drawImage`. Sombra de las fotos: rectángulo desplazado
    (no `shadowBlur`, que es caro).
- **Un producto distinto por escena:** cristal → 2º producto (entra desde la
  derecha con giro leve); banner → 3er producto (zoom lento); el producto principal
  solo abre y cierra el video.
- **Móvil** ya no repite la ficha: muestra la **tienda** con buscador y un
  **catálogo en 2 columnas que se desplaza** (8 casillas con los productos
  alternados, nombre y precio en el color de acento); cabecera fija con
  "N productos".
- **Destacados:** hasta 4 productos en cuadrícula 2×2 que **caen en cascada**
  (cada uno con 0,12 s de retraso y rebote); con 1 producto, una sola tarjeta.
- Productos: 1 a **6** (antes 3). Ejemplo por defecto con 4 (bolso, mochila,
  zapatillas, gafas). Con menos productos se alternan (inevitable), pero cada
  escena los presenta de forma distinta.
- Sonido: pop por cada producto de destacados (grupo "por producto").

---

## v8.5 — Estilo 8 "Vitrina" (estructura del anuncio de referencia de Shopify)

**Origen:** réplica de la estructura y los tiempos de un anuncio de Shopify (~15 s)
que Daniel grabó en Facebook. Sin logos, textos, música ni pantallas de Shopify:
todo con la marca, los productos y "pantallas" tipo RETADOR. El humo 3D realista
y las escenas grabadas (mano cogiendo el bolso, modelo caminando) no se pueden
hacer con plantillas deterministas: se sustituyen por una nube de partículas y
zoom suave sobre la foto del vendedor.

### Guion (15,2 s a 1×, constantes en `VT`)
- 0,0–1,3 s: fondo en diagonal (pastel del color del producto → casi negro con
  estrellas que titilan) + **nube de partículas** (230, posiciones con semilla fija)
  en los colores del producto + símbolo y nombre de la tienda + frase de entrada.
- 1,3–2,5 s: segunda frase; la nube gira despacio.
- 2,5–4,9 s: la nube se junta hacia el centro y se desvanece mientras **aparece el
  producto** (escala 0,85→1); un **anillo de texto gira en 3D** alrededor del
  producto (letras sobre una elipse; las de detrás más tenues y en espejo, las de
  delante encima del producto).
- 4,9–6,6 s: **tarjeta de cristal** (panel translúcido con borde claro) con foto
  en caja blanca, nombre y precio; detrás, una "ficha" fantasma.
- 6,6–8,1 s: **banner promocional** (barra superior con el nombre de la tienda,
  texto grande arriba y abajo, producto en el centro, botón con la Frase final).
- 8,1–9,7 s: **móvil** que sube desde abajo con la ficha del producto (tienda,
  valoración, foto, nombre, estrellas, precio, "Envío a domicilio", botón
  "Añadir al carrito" en el color de acento).
- 9,7–11,0 s: tarjeta **"Productos destacados"** con el producto principal y el
  segundo (o solo el principal si hay uno).
- 11,0–11,7 s: la foto con esquinas redondeadas **se expande a pantalla completa**.
- 11,7–13,2 s: foto a pantalla completa con zoom suave (si la foto es PNG sin fondo
  o emoji: fondo degradado del color del producto con el producto grande).
- 13,2–15,2 s: velo oscuro + **logo** (símbolo + nombre) + **botón píldora** con la
  Frase final de Marca.
- Tarjetas: entran con escala 0,9→1 + rebote + subida; salen con leve escala.

### Colores
- `productColors(item, accent)`: toma los 2 colores dominantes de la foto o del
  emoji (muestra de 16×16, por tono y saturación; se calcula una vez y se guarda).
  Tiñen la nube, los fondos y el círculo del logo. El acento de Marca se usa en
  partículas, banner y botón del móvil. `softSprite(color)`: partícula suave
  pre-dibujada (rápida).
- No usa los temas ni los extras (look propio). Aviso en la pestaña Tema.

### Datos y formulario
- `vitrinaState`: frase de entrada, segunda frase, texto del anillo, texto del
  banner, título de destacados y 1–3 productos con **nombre**, foto/emoji y precio.
- Nuevo: al elegir un producto de la tienda, si el campo tiene `name`, también se
  copia su nombre (`makeVisualEditor`).

### Sonido
- Transiciones: whoosh en la segunda frase, subida cuando se junta la nube,
  impacto al aparecer el producto, whoosh en cada tarjeta y en la expansión,
  brillo en el logo y pop con el botón. Por producto: pop al aparecer.

---

## v8.4 — Direcciones de los productos, efectos por producto opcionales, frase final en todos, Desfile claro

### Efectos de sonido en dos grupos (pestaña Música)
- "En las transiciones" (activado por defecto): cambios de escena, cortinillas,
  capa de color, cierre y frase final.
- "Cada vez que aparece un producto" (**apagado por defecto**, a Daniel le resultó
  molesto con muchos productos): pops/whoosh por producto, casilla, insignia,
  precio. Los eventos llevan `cat: "item"`; `scheduleSfx` filtra por grupo.
  `music.sfxScene` / `music.sfxItem`, `sfxOn()`.

### Dirección de los productos (estilos con movimiento)
- Selector "Dirección de los productos" (`makeDirControl`, `DIR_OPTIONS`):
  - **Acercamiento** (`approachState.dir`): ↖ Diagonal hacia la izquierda (el de
    siempre), ↗ Diagonal hacia la derecha, ← Horizontal hacia la izquierda,
    → Horizontal hacia la derecha. El giro de la tarjeta se invierte según el sentido.
  - **Noria** (`noriaState.dir`): hacia la izquierda (el de siempre) o hacia la
    derecha. La curva y la profundidad son simétricas, solo cambia el sentido.
  - **Desfile** (`desfileState.dir`): hacia la izquierda o hacia la derecha
    (espejo de x, del giro y de la insignia); se combina con el recorrido
    Diagonal / Sube y gira.
- No se añadieron recorridos de arriba a abajo (taparían los textos). Secuencial,
  Antes/Después y Mosaico no se mueven de un lado a otro: sin selector.

### Frase final (Marca → "Frase final") en los 7 estilos
- **Directo:** el botón final ahora muestra la Frase final de Marca (antes tenía
  su propio campo "Texto del botón final", que se quitó para tener UN solo lugar).
  Frase vacía = sin botón.
- **Desfile:** la Frase final aparece bajo el logo en un botón tipo píldora
  (borde blanco, fondo translúcido), entrando con rebote a los 12,85 s.
- Los otros 5 ya la mostraban en el cierre compartido.

### Directo: arreglo de contraste
- En la escena de la foto, el círculo oscuro de la izquierda tapaba las primeras
  letras del título (mismo color). Ahora la parte del título que cae sobre el
  círculo se redibuja en el color claro de la paleta (recorte con `clip()`):
  el título se lee entero, con efecto de dos tonos.

### Desfile: fondo claro opcional
- Selector "Fondo": **Oscuro difuminado** (por defecto, el del anuncio) o **Claro**
  (degradado luminoso crema→gris azulado, textos oscuros, palabra clave en el color
  de acento con halo suave, sombras más suaves). `DS_INK`, `desfileState.bg`.
- En la pestaña Tema aparece un aviso cuando el estilo elegido tiene fondo propio
  (Directo y Desfile), indicando dónde se cambia.

### Vista previa más fluida
- Las vistas previas (teléfono y vista previa del post) se dibujan a media
  resolución (`PREVIEW_SCALE = 0.5`, 4 veces menos píxeles) con `setTransform`;
  los estilos no cambian. El archivo final sigue generándose a resolución completa
  y 60 fps exactos, fotograma a fotograma (`makeRenderer(..., scale = 1)`).
- Nota: los saltos que se vean en la vista previa en un teléfono cargado NO pasan
  al archivo MP4 (se genera fotograma a fotograma). Solo el respaldo de grabación
  en tiempo real (navegadores sin WebCodecs) podría heredarlos.

---

## v8.3 — Sonido sin distorsión + efectos en los 7 estilos + recorrido "Sube y gira"

### Arreglo de la distorsión del sonido
- **Causa:** cada vuelta de la música creaba su propio compresor y reverberación
  (en la vista previa se solapaban varias), y música + efectos se sumaban sin
  margen: los picos pasaban del máximo y recortaban (el "pss" que se oía de vez
  en cuando). Además los golpes empezaban de golpe (sin ataque) y hacían chasquidos.
- **Solución:** `makeMixChain(ctx, dest)` = UNA cadena por sesión de audio:
  entrada con margen (×0,55) → compresor suave (−18 dB, 3:1) → **recorte suave**
  (`WaveShaper` con curva tanh desde 0,72, sobremuestreo 4×; nunca recorta en seco)
  → salida ×0,8. La reverberación es una sola, compartida por envío.
- Archivo final: tras renderizar, `normalizeBuffer()` deja el pico en −1 dB
  (0,89): mismo volumen en todos los videos y cero recortes.
- Ataques de 1,5–4 ms en ruidos, bombo e impacto (sin chasquidos).
- `AudioContext` con `latencyHint: "playback"` (búfer más grande = menos cortes
  en móviles de gama baja).
- `scheduleMusic(ctx, dest, t0, dur, mood, vol, revIn)` ya no crea compresor ni
  reverberación; `scheduleAudio(ctx, chain, t0, dur, style, tl, opts)`.

### Efectos de sonido en los 7 estilos
- `sfxEvents(tl, opts)` en todos los estilos (antes solo Desfile):
  - Acercamiento: whoosh al entrar cada producto, pop al llegar al centro (anillo).
  - Noria: whoosh al entrar, pop al pasar por el centro.
  - Secuencial: whoosh en cada cambio de escena, pop al entrar su contenido.
  - Antes/Después: pop al aparecer, whoosh en el barrido, brillo al revelar.
  - Mosaico: whoosh inicial y un pop por cada casilla.
  - Directo: whoosh inicial y en las 2 cortinillas, impacto al llegar la foto, pop
    del precio y de cada línea del cierre, brillo con la bolsa, pop del botón.
    (Tiempos del diseño original divididos por su velocidad propia.)
  - Cierre compartido (`logoSfx`): whoosh al entrar, brillo con la línea, pop con
    la frase final.
- La casilla "Efectos de sonido" de la pestaña Música los apaga en todos.

### Desfile: segundo recorrido
- Nuevo selector "Recorrido de los productos": **Diagonal** (el de v8.2, por
  defecto) o **Sube y gira** (como el anuncio de referencia: suben desde abajo,
  giran a la izquierda y salen arriba a la izquierda). `dsPath(id, p, k)`; la
  curva es una Bézier cúbica (66 %,112 %) → (66 %,64 %) → (42 %,50 %) → (−28 %,40 %),
  con inclinación progresiva a la izquierda. `desfileState.path`.

---

## v8.2 — Estilo 7 "Desfile" + efectos de sonido + ambiente "Moderno"

**Origen:** Daniel pidió replicar lo más fiel posible un anuncio de Facebook de
Hostinger Ecommerce (15 s). Se copió la ESTRUCTURA, los TIEMPOS y la técnica de
animación, no sus recursos: sin su logo, textos, música ni iconos de redes
sociales. La música y los sonidos de anuncios de terceros NO se extraen ni se
imitan de cerca (derechos + detección de Facebook); se crean por código.

### Estilo "Desfile" (icono ✨) — 14 s a 1×
- 0,0–1,0 s: tarjeta de marca (color de acento + logo completo). Fundido de 0,15 s.
- 1,0–10,6 s: fondo gris muy oscuro con degradado hacia un gris azulado claro abajo
  (+ grano fijo). Cabecera arriba (10 % de alto): símbolo + NOMBRE en negrita +
  separador + etiqueta ("Tienda online"). Titular grande en DM Sans 700 al 25 %
  (entra con fundido y leve escala 1,04→1) con la palabra clave en blanco con halo
  del color de acento (entra 1,6–2,2 s). Subtítulo DM Sans 500 al 36 % (entra
  1,6–2,0 s subiendo).
- Productos: aparece uno cada 1,35 s (desde 1,15 s hasta 9,4 s, 7 apariciones,
  se repiten los 2–6 productos). Cada uno recorre 4,2 s una diagonal de abajo a la
  derecha (84 %, 102 %) a arriba a la izquierda (−20 %, 44 %), con leve curva,
  haciéndose más pequeño (de 58 % a 29 % del ancho), girando y con sombra. Se
  dibujan primero los más lejanos.
- Insignia por producto: cuadrado redondeado del color de acento con degradado,
  borde fino claro, halo y un icono blanco de línea genérico (carrito, corazón,
  camión, estrella, etiqueta, chat). Entra con rebote y flota suavemente.
- Fotos: si la foto ya es PNG sin fondo (`isCutout`, se mira una vez) flota
  suelta como en el anuncio; si tiene fondo, va en tarjeta blanca redondeada.
  Emojis flotan sueltos. **No se quita el fondo automáticamente** (requeriría IA).
- 10,3–11,1 s: capa del color de acento cubre todo; los textos se desvanecen.
- 11,3–12,8 s: el símbolo se dibuja en contorno (0,6 s) → se rellena (0,3 s) → el
  nombre sale deslizándose a su derecha (0,6 s) y el conjunto se recentra.
- 12,8–14 s: cierre quieto (luego vuelve a empezar en bucle).
- Usa el color de acento de Marca y el nombre de la tienda. No usa temas ni extras.
- Formulario propio: etiqueta, titular, palabra que brilla, subtítulo y 2–6
  productos (emoji, foto o producto de la tienda; sin precio).
- Fuente nueva cargada: **DM Sans** (400/500/700).

### Efectos de sonido (nuevo sistema, `[v8.2]`)
- Un estilo puede declarar `sfxEvents(tl)` → `[{t, type}]` (segundos a 1×). Tipos
  creados por código: `whoosh`, `pop`, `riser`, `impact`, `chime`.
- Desfile: whoosh al pasar de la tarjeta a la escena, pop cuando aparece cada
  insignia, riser antes de la capa de color, impacto al cubrirse y brillo cuando
  se rellena el logo.
- `scheduleAudio()` junta música + efectos en un grupo; lo usan la vista previa,
  el MP4 (OfflineAudioContext + AAC) y el respaldo de grabación. `audioWanted()`
  decide si hay pista de audio (música elegida o efectos activos en un estilo que
  los tenga). Los efectos siguen la velocidad del video.
- Pestaña Música: casilla "Efectos de sonido" (activada por defecto). El botón bajo
  la vista previa pasa a "🔈 Escuchar sonido". Los textos de resultado dicen
  "con música X + efectos", "con efectos" o "sin sonido".

### Ambiente musical nuevo: "Moderno"
- Electrónica tipo anuncio tech: 140 bpm a medio tiempo, charles en
  semicorcheas, palma en el tiempo 3, bajo largo, arpegio pulsado y pad suave.
  Elegido por parecerse en ritmo y energía al anuncio de referencia, sin copiar
  su melodía.

### Pendiente
- ~~Siguiente estilo a replicar: anuncio de referencia de Shopify~~ → hecho en v8.5 ("Vitrina").
- (Nota original:) anuncio de referencia de Shopify (anillo de texto 3D
  alrededor del producto, tarjetas de cristal, móvil con ficha, foto que se
  expande, cierre con botón). El humo 3D y las escenas grabadas no se pueden hacer
  con plantillas: se sustituyen por partículas y zoom suave sobre fotos.

---

## v8.1 — Música creada por código (sin archivos de audio, sin IA)

- **Por qué así:** Facebook detecta música con derechos y puede silenciar o
  bloquear el video (y afectar a la página del vendedor). La música la genera la
  propia app con un sintetizador (Web Audio API) a partir de patrones fijos:
  costo cero, sin IA, mismo resultado siempre, sin derechos de terceros.
- **Nueva pestaña "Música"** (entre Tema y Extras): 5 opciones —
  Sin música, Alegre (pop 116 bpm), Elegante (piano suave 84 bpm), Energía
  (bailable 124 bpm), Relajado (lo-fi 76 bpm). Predeterminada: **Alegre**.
  Volumen 10–100 % (predeterminado 70 %). Aplica a los 6 estilos y 3 formatos.
- **Motor** (`scheduleMusic(ctx, dest, t0, dur, mood, vol)`): 16 pasos por compás,
  progresión de 4 acordes; batería (bombo, palmas, caja, charles, shaker) con
  ruido filtrado; bajo, acordes y arpegios con osciladores + filtro + envolvente
  (`VOICES`); reverberación con respuesta de impulso generada; compresor en la
  salida. Ruido y reverberación usan semillas fijas → determinista. Graves
  subidos una octava para que se oigan en altavoces de teléfono.
- La música dura exactamente lo que dura el video (también con otra velocidad o
  en Directo Tranquilo/Ágil), entra en 0,04 s y termina con un final suave
  (hasta 1,2 s de desvanecido).
- **Vista previa:** botón "🔈 Escuchar música" bajo el teléfono (los móviles solo
  dejan sonar audio tras un toque). Con sonido, el reloj de audio manda sobre la
  animación para que imagen y música vayan sincronizadas; se programa por vueltas
  del video. Cambiar ánimo/volumen reinicia la vista previa.
- **Exportación** — punto único `exportVideo()` (lo usan la descarga y Facebook),
  devuelve `{ blob, ext, audio, note }`:
  1. Con WebCodecs + AAC: se renderiza el audio completo con `OfflineAudioContext`
     (48 kHz estéreo), se codifica con `AudioEncoder` (`mp4a.40.2`, 128 kbps) y se
     añade como pista al MP4 (`mp4-muxer`, `firstTimestampBehavior: "offset"`).
  2. Si no hay AAC en el navegador: grabación en tiempo real (`MediaRecorder`) con
     la música como pista de audio en vivo (WebM/Opus, o MP4 si es Safari).
  3. Si nada de eso funciona: MP4 sin música y aviso visible al vendedor.
  El respaldo de grabación ahora acepta MP4 (antes solo WebM, fallaba en Safari).
- El detalle de exportación y el paso 1 de Facebook indican "con música X" o
  "sin música". El audio suma unos 150–200 KB por video.
- **Pendiente de probar en dispositivos reales:** AAC con `AudioEncoder` en
  Android gama baja e iPhone; si falla, entra el respaldo. Alternativa futura con
  costo: unir audio y video en el servidor.
- Futuro: sumar canciones compradas o encargadas con todos los derechos (camino
  2, posible beneficio Pro/Premium). No se permite que el vendedor suba música
  propia por ahora (riesgo de silenciado en Facebook).
- Nota técnica: `mp4-muxer` se carga sin versión fija desde jsDelivr; al integrar,
  fijar una versión exacta (≥ 2, con soporte de pista de audio AAC).

---

## v8.0 — Herramienta unificada: 6º estilo "Directo" + Publicar en Facebook

Resumen: se unió el generador (v7.3) con el flujo "Publicar en Facebook" en UNA
sola herramienta. No se quitó nada de v7.3: los 5 estilos, temas, marca, extras,
velocidad, reseñas y exportación MP4/WebM siguen igual. Todo lo de abajo es nuevo.

### 1. Estilo 6 "Directo" (icono ⚡)
- Copia fiel del diseño original del flujo de Facebook: tipografía **Bricolage
  Grotesque** (añadida a la carga de Google Fonts), 3 escenas: titular palabra
  por palabra → foto en tarjeta + círculo de precio + título → cierre "CÓMPRALO /
  EN MI TIENDA / {nombre de la tienda}" con bolsa dibujada y botón. Cortinilla de
  color entre escenas y barra de progreso propia. Duración base 9,2 s.
- Diseñado originalmente a 540×960 y reescalado con `DI_S = W / 540`.
- **No usa los temas ni el color de acento** (look propio, como el sello ✓/✕ de
  Antes/Después). Tampoco usa el cierre compartido `drawLogo`; trae el suyo. Los
  extras (reseñas, urgencia, barra) no aplican a este estilo.
- **Opciones de edición propias** (pestaña Contenido, solo en Directo):
  - Paletas: Original (predeterminada, la de siempre), Atardecer, Bosque, Neón,
    Crema y naranja. Cada paleta define papeles (`dark`, `accent`, `highlight`,
    `keyword`, `badge`, `badgeText`, `light`) para que siempre combine.
  - Velocidad propia: Tranquilo 0,8× (11,5 s), Normal 1× (9,2 s), Ágil 1,25× (7,4 s).
    Se multiplica con la velocidad general de v7.3.
  - Textos editables: encabezado de la escena 2 ("AHORA EN RETADOR"), las dos
    primeras líneas del cierre y el texto del botón. Vacío = esa línea no sale.
    La letra se achica sola si el texto es largo (`diFitFont`).
  - Botón "Volver al diseño original".
- Estado en `directoState` (headline, item, palette, speed, topText, close1,
  close2, button). Sin foto, dibuja una ilustración de ejemplo.

### 2. Seleccionar un producto de la tienda (todos los estilos)
- Debajo de CADA casilla de foto: "🏷️ O selecciona un producto de tu tienda".
  Abre una hoja con el catálogo y precarga en ESE campo: foto + precio (y en
  Directo también el título). Un solo lugar para los datos (pestaña Contenido).
- Se guarda la referencia completa en el campo: `target.product = {id, title,
  price, stock, ...}`. Se borra al quitar la foto o subir una propia.
- **En el prototipo el catálogo es simulado** (`CATALOG`, fotos generadas). Al
  integrar: leer los productos reales publicados por el vendedor en Supabase
  (foto principal, título, precio, existencias, id). Confirmar nombres reales de
  tablas y campos; no asumirlos.

### 3. Publicar en Facebook
- Botón "Publicar en Facebook" en la tarjeta de acciones, para cualquier estilo.
- Flujo: (a) si no hay página conectada → hoja "Conecta tu página de Facebook" →
  elegir página (nunca falla en silencio); (b) paso **"Texto de tu publicación"**;
  (c) al confirmar se graba el video con el MISMO exportador que la descarga y se
  publica; (d) se muestra el enlace a la publicación y el texto usado.
- **Texto de la publicación** (sin IA, plantillas deterministas):
  - Precargado con los datos del producto: título, precio, existencias, enlace.
  - 3 tonos con un toque: Directo, 🔥 Oferta, Sin emojis. Siempre editable a mano.
    Casilla "Añadir hashtags" y botón "Restablecer".
  - Oferta: solo dice "¡Solo quedan N!" si hay 5 o menos; si no, "unidades
    limitadas" (no inventar escasez).
  - Estilos con varios productos: texto de tienda (lista de productos elegidos
    con precio + enlace a la tienda). Foto subida a mano (sin producto) →
    enlaza a la tienda.
  - **Vista previa del post** tipo Facebook (página, texto con enlaces
    resaltados, video reproduciéndose en el formato elegido) antes de publicar.
  - Enlaces de ejemplo: `LINK_BASE = "retador.app"`, `/p/{id}` producto,
    `/t/{slug}` tienda. **Poner el dominio y las rutas reales al integrar.**
  - Futuro opcional, separado: botón "Mejorar texto con IA". El flujo base nunca
    depende de él.
- **En el prototipo, conexión, subida y publicación son SIMULADAS.** Solo la
  grabación del video es real. Para la versión real:
  - App propia en Facebook for Developers, login "Continuar con Facebook",
    permiso `pages_manage_posts` (y los de lectura de páginas que Meta exija),
    verificación de negocio y video demo para la revisión de Meta.
  - **Regla no negociable:** el token de la página nunca vive ni se usa en el
    navegador. El intercambio del código OAuth se hace en el backend; los tokens
    se guardan cifrados por vendedor; el navegador sube el video (mejor a
    Storage, y el backend lo toma de ahí, por límites de tamaño) y el backend
    llama a la API de Meta. Manejar token caducado y permiso revocado.
  - Vertical → publicar como **Reel**; Feed/Cuadrado → **video normal** de página.
  - Facebook procesa el video de forma asíncrona: consultar el estado antes de
    mostrar el enlace final.
  - Evitar doble publicación (bloquear doble toque) y limitar publicaciones por
    hora por vendedor.

### 4. Formato del video (todas las salidas)
- Selector en la tarjeta de acciones: **Vertical 9:16** (1080×1920, Reel),
  **Feed 4:5** (1080×1350) y **Cuadrado 1:1** (1080×1080).
- Los 6 estilos se siguen dibujando en vertical. Para Feed/Cuadrado,
  `makeRenderer` centra el fotograma vertical COMPLETO (sin recortar) y rellena
  los lados con un degradado de los colores reales del borde del video (se
  promedia una franja de 24 px en 12 alturas, suavizado entre fotogramas).
  Se descartó el fondo desenfocado porque se veía pixelado.
- Toda salida pasa por `makeRenderer`: vista previa, exportación MP4, respaldo
  WebM y vista previa del post. El códec se consulta con el tamaño real.
- Futuro posible: diseño propio en cuadrado, estilo por estilo (empezar por Directo).

### 5. Calidad de fondos (arreglo de lo que se veía cuadriculado)
- **Foto propia de fondo:** antes se ampliaba una miniatura de 90×160 (se veía
  pixelada). Ahora hay desenfoque real (3 pasadas de caja ≈ gaussiano, radio 14)
  a media resolución, calculado UNA vez al subir la foto y ampliado ×2 ya suave.
- **Tema oscuro / brillo de color:** degradado radial con 5 paradas (caída suave)
  + grano fino FIJO (patrón 256×256, alfa 0,035) en fondos oscuros y con foto,
  para romper las bandas tras la compresión. El grano no cambia entre fotogramas.
- Bitrate: MP4 de 8 a 10 Mbps, WebM de 6 a 9 Mbps. Videos de unos 10–12 MB.
  Vigilar el peso para subidas desde datos móviles.

### 6. Color de acento: naranja siempre disponible
- Fila de colores rápidos en Marca: primero **"Naranja RETADOR" #F26B0F**
  (predeterminado, siempre visible), luego turquesa, verde, azul, morado, rosa,
  rojo, amarillo, y el selector "Otro color".
- En Pro/Premium, al integrar, el acento se toma del color de marca de Diseño
  (según lo ya decidido), pero el naranja debe seguir disponible en la fila.

### 7. Marca de agua del plan gratis
- "Hecho con RETADOR" + símbolo, en una píldora semitransparente en la esquina
  inferior derecha (pasa a la izquierda si las reseñas están abajo a la derecha).
  Se dibuja en `makeRenderer`, dentro de cada fotograma, así sale en la descarga,
  en Feed/Cuadrado y en lo que se publica en Facebook. Aplica a los 6 estilos.
- **El símbolo "R" es provisional:** al integrar, usar el logotipo oficial.
- En el prototipo hay un selector "Plan del vendedor (solo para probar)". Al
  integrar: quitar el selector y usar el plan real (`can_customize`); gratis, sin
  sesión o plan desconocido → con marca. Para lo publicado en Facebook, el backend
  conoce el plan y debe ser quien decida (en la descarga el control es del
  navegador; riesgo aceptado).

### 8. Versión
- Comentario de cabecera en el HTML y etiqueta "v8.0" visible junto al título.

### Pendiente acordado (siguientes versiones, en este orden)
1. ~~Música~~ → hecho en v8.1 (música creada por código).
2. Programar publicaciones (fecha y hora; la API de Meta lo permite).
3. Publicar también en Instagram (misma app de Meta, permiso extra).
4. Historial de videos publicados (requiere backend).
5. Estilos nuevos: Oferta relámpago (precio tachado + nuevo + cuenta atrás),
   Llegó/Nuevo ingreso, Tablilla de precios tipo menú (bodegas y cafeterías).
6. Probar la exportación en Android gama baja y en iPhone (Safari: WebCodecs,
   `captureStream`, fuentes).
7. Riesgo a revisar temprano: verificación de negocio de Meta y políticas de
   comercio para un marketplace orientado a Cuba.

---

## Reestructuración del panel (sin tocar la paleta de colores)

Petición explícita de Daniel: mejorar la estructura/jerarquía del panel para
que se sienta más profesional, sin cambiar ningún color existente. Cambios:

- **La elección de estilo se movió al carrusel deslizable** debajo de la
  vista previa (teléfono), en vez de una tarjeta de botones apilados arriba
  del formulario. Desliza o usa las flechas ‹ › o los puntos para cambiar de
  estilo — sincronizado en ambas direcciones: deslizar cambia el estilo
  activo, y elegirlo desde el formulario mueve el carrusel. El teléfono y el
  carrusel ahora viven juntos dentro de un mismo panel con borde y sombra
  (`.preview-panel`), como un módulo cohesivo en vez de piezas sueltas.
- **Numeración de pasos consistente** con una insignia circular (`.step-badge`)
  antes de cada título de sección, en vez de solo texto plano "1. / 2. / 3.":
  1 Tema de color, 2 Nombre y color, 3 Contenido (según estilo), 4 Generar.
- **Nombre de tienda y color de acento se fusionaron en una sola tarjeta**
  ("2. Nombre y color") — antes eran dos tarjetas separadas sin relación
  visual clara entre sí, a pesar de configurar lo mismo (identidad del video).
- Todas las tarjetas ahora tienen una sombra sutil (`box-shadow: var(--shadow)`,
  variable que ya existía pero no se usaba) para dar sensación de elevación —
  ningún color nuevo, solo un token que ya estaba definido.

**Deliberadamente NO cambiado:** ningún valor de color, ni de tema ni de UI
del panel — la petición fue explícita en mantenerlos. Tampoco se agregaron
efectos tipo glass, gradientes decorativos, ni animaciones de entrada en el
panel — con lo ya construido (el carrusel, la reagrupación, las insignias)
alcanza para el salto de calidad pedido, sin decorar de más.

**Pendiente, no verificado:** el carrusel usa `scroll-snap` nativo del
navegador — funciona en Chrome/Safari/Firefox modernos, pero no se probó en
un dispositivo real ni con gestos táctiles reales, solo se razonó la lógica.

## Segunda pasada de estructura — comparado contra apps reales

Daniel pidió compararlo con herramientas profesionales de video (CapCut,
Canva, InShot). Diagnóstico honesto: el panel se sentía como un formulario de
dashboard, no como un editor de video — el canvas no era lo primero que se
veía en móvil, las secciones competían por espacio apiladas, y el botón de
generar quedaba enterrado al final. Cambios concretos, sin tocar colores:

- **El video ahora se ve primero en móvil** (`grid-template-areas`): el panel
  de vista previa aparece arriba del formulario en pantallas angostas, y
  vuelve a la derecha en escritorio — el mismo HTML, solo el orden visual
  cambia según el tamaño de pantalla.
- **Pestañas en vez de tarjetas apiladas:** Tema / Marca / Contenido — solo
  una sección visible a la vez, como Texto/Audio/Efectos en un editor de
  video real, en vez de scroll infinito por un formulario largo.
- **Barra de generar fija al fondo de la pantalla** (`position: fixed`,
  respetando el área segura del teléfono) — siempre alcanzable sin importar
  en qué pestaña estés o cuánto hayas scrolleado, como el botón de exportar
  en cualquier app de edición seria.
- **Ícono identificador en cada tarjeta del carrusel de estilos** (🎯
  Acercamiento, 🎡 Noria, 🎬 Secuencial) — antes eran solo texto, ahora se
  reconocen de un vistazo, más cerca de una galería de plantillas real.

**Esto se revirtió** porque rompió el uso real: la barra fija (`position: fixed`)
tapaba contenido, y mover la vista previa arriba con `position: sticky` la dejaba
pegada bloqueando el resto de la pantalla en móvil. Lección para no repetir:
`position: fixed`/`sticky` en el panel de vista previa es una fuente real de
bugs de bloqueo — si se vuelve a intentar algo así, probarlo con cuidado antes
de publicar, no solo razonar que "debería funcionar".

## Tercera pasada — revertir lo que rompió, y más densidad

Estado actual: vista previa de vuelta en su posición original (después del
formulario en móvil, columna lateral normal en escritorio — sin `sticky`).
Todo el panel se apretó para caber más información en pantalla sin scroll:
tarjetas, inputs, botones de ícono y el teléfono de la vista previa (de 220px
a 190px) más pequeños/compactos. Las pestañas (Tema/Marca/Contenido) y el
carrusel de estilos con íconos se mantienen — eso no fue lo que falló.

---

## Auditoría de calidad (revisión tipo "finish gate")

Se revisó el artifact con el criterio de varios de los agentes que Daniel subió
(`agentes-diseno-pantallas-retador.md` y `agentes-construir-herramientas-marketing-retador.md`) —
en particular Accessibility Auditor, UI Finish-Gate Reviewer, Frontend Developer
y Short-Video Editing Coach. No se aplicaron los 34 agentes uno por uno: se usó
su criterio para encontrar problemas reales y concretos, y solo se listan aquí
los que de verdad se corrigieron en el código — sin inflar la lista con checklist
genérico.

**Corregido en esta sesión:**
- **Bug real de teclado:** el botón "Subir foto" era una `<label>` envolviendo un
  `<input type="file">` con `display:none` — eso saca el control del orden de
  tabulación por completo, así que alguien navegando solo con teclado no podía
  llegar a subirla. Ahora es un `<button>` real que dispara el input mediante
  `.click()`.
- **Estado vacío real:** si se borraba todo el texto/elementos, el canvas se
  quedaba con el último fotograma congelado en pantalla — confuso, parecía un
  video "listo" que no lo estaba. Ahora se limpia el canvas y aparece un
  mensaje de texto real (fuera del canvas, así que sí lo lee un lector de
  pantalla) pidiendo añadir contenido.
- **Anuncios para lectores de pantalla:** `aria-live` en el mensaje de estado y
  en el texto de progreso durante la exportación; `role="progressbar"` con
  `aria-valuenow` en la barra; `aria-label` y `aria-pressed` en los botones de
  ícono, estilo y tema (antes solo tenían color como única señal de "elegido").
- **Alt text real** en la miniatura de la foto subida (antes no tenía).
- **Gancho visual más rápido en "Acercamiento":** el primer elemento ahora
  arranca con un 22% de su recorrido ya hecho, en vez de sonar el timer desde
  cero absoluto — el principio de "el gancho debe verse en los primeros
  segundos" (regla del Short-Video Editing Coach) antes se violaba: el primer
  fotograma mostraba casi pantalla vacía.

**Deliberadamente NO tocado** (siguiendo la regla de "Protect Product
Specificity" del Frontend Developer: no añadir gradientes/glass/animación
porque sí) — el layout general, la paleta y la estructura de tarjetas se
mantuvieron; no se copió ningún patrón de otro producto solo por tendencia.

**Pendiente, honestamente, no verificado por mí:**
- Nada de esto se probó con un lector de pantalla real (NVDA/VoiceOver) ni con
  navegación 100% por teclado en un navegador de verdad — son correcciones a
  nivel de código, basadas en las reglas WCAG que cita el agente Accessibility
  Auditor, no una auditoría con evidencia real todavía.
- Sigue pendiente la prueba en emulación de dispositivo de gama baja mencionada
  en la versión anterior de este README.
- Contraste de color no se midió con una herramienta real (solo se sabe que
  crema-sobre-negro y negro-sobre-crema son de alto contraste por diseño).

---

## v6 — Motor visual rehecho (lo que ve el cliente final)

Diagnóstico de Daniel: el panel mejoraba pero los VIDEOS se veían amateur —
productos borrosos en Acercamiento, titular atravesado en la Noria, íconos
dibujados a mano que parecían garabatos. Esta versión ataca el resultado, no el panel.

- **Acercamiento:** se eliminó todo desenfoque (`ctx.filter blur`) y las copias
  fantasma. Profundidad solo con tamaño + sombra real de tarjeta. Curva de
  avance `dwell(t) = t + a·sin(2πt)/2π` (a=0.82): entra rápido, **frena en el
  centro** para lucir el producto, sale rápido — sin tirones (derivada siempre
  positiva). Anillo de luz del color de acento al llegar al centro. Tarjeta
  base 560px (hasta 896px con tamaño 160%).
- **Noria:** ahora **horizontal**, de derecha a izquierda sobre un arco suave,
  se endereza en el centro. Productos centrados en 58% de la altura: el
  titular (arriba, 14%) ya no queda atravesado.
- **Íconos → emojis reales** del dispositivo (fuente Apple/Google/Windows
  Emoji). 8 rápidos por elemento + botón **+** con 6 categorías (Tienda, Moda,
  Hogar y tech, Comida, Emoción, Avisos) + campo para pegar cualquier emoji
  del teclado (validado con `\p{Extended_Pictographic}`). Se eliminaron los
  íconos SVG dibujados a mano. Nota: el emoji se ve con el estilo del teléfono
  de quien genera el video (Apple vs Google).
- **Foto del producto** sigue disponible en todos los estilos; se dibuja
  dentro de la tarjeta con recorte sin deformar.
- **Control "Tamaño de productos"** 100%–160% (nunca más pequeño que antes),
  aplica a los tres estilos.
- **Cierre con llamado a la acción:** nombre de tienda cayendo letra por letra
  + botón píldora del color de acento con una frase editable ("Pide el tuyo
  hoy"). El nombre se encoge solo si no cabe.
- **Titular** con palabras resaltadas con brillo, salto de línea automático y
  entrada con fundido. Noria ahora también tiene palabra resaltada.
- **Escenas secuenciales:** misma mecánica que le gustaba a Daniel; solo cambia
  el ícono por emoji/foto con entrada tipo "pop" y un círculo suave de acento detrás.
- **Bug real corregido en exportación:** el códec H.264 usado (`avc1.42001f`,
  nivel 3.1) solo soporta hasta 1280×720 — a 1080×1920 fallaba. Ahora se
  pregunta al navegador (`VideoEncoder.isConfigSupported`) por perfiles nivel
  4.x y, si ninguno sirve, se usa el respaldo WebM. Los errores del codificador
  ahora sí se capturan y se muestran.
- Pestañas reordenadas: **Contenido** primero (es lo que más se usa), luego Marca, luego Tema.

**Verificado en esta sesión:** sintaxis JS (`node --check`) y ejecución completa
de los tres estilos × dos temas × tamaños 100%/160%, fotograma a fotograma, con
un canvas simulado — sin errores. La pantalla nunca queda vacía entre productos
(el único hueco son 0,15s de fundido antes del logo).
**NO verificado:** cómo se ve realmente en pantalla (no hay navegador aquí),
con fotos reales de producto, ni la exportación en un teléfono real.

---

## Decisiones de integración (acordadas con Daniel antes de pasar a Claude Code)

- **Ubicación:** la herramienta vive en el botón/menú **Herramientas** de la
  app, accesible para TODOS los usuarios (incluido plan gratis). Motivo: los
  usuarios actuales no navegan bien Mi Panel; enterrarla ahí haría que nadie
  la encuentre. Además, en **Mi Panel → Promociones** los Pro/Premium tienen un
  **acceso directo** que abre la MISMA herramienta (un enlace, no código duplicado).
  Esto REEMPLAZA la idea original de "solo Pro/Premium dentro de Mi Panel".
- **Diferencia gratis vs Pro/Premium (mientras no hay anuncios): marca de agua.**
  - Plan gratis (o sin sesión / plan desconocido): el video exportado lleva una
    marca de agua con el **logotipo real de RETADOR** + el texto "Hecho con
    RETADOR", bien integrada, semitransparente, en una esquina inferior, visible
    durante todo el video. Se dibuja DENTRO del canvas en cada fotograma para que
    quede en el archivo descargado.
  - Pro/Premium (`can_customize = true`): sin marca de agua, y el color de acento
    se toma automáticamente del color de marca de Diseño.
  - Motivo: funciona ya sin infraestructura de anuncios, cada video gratis
    compartido promociona RETADOR, y empuja a pagar sin quitarle nada a nadie.
    Cuando se construyan los anuncios (ver v7.2), se suman encima.
- Descartado para v1: límite de "X videos por día" (requeriría control en
  servidor; en el navegador se salta fácil).

---

## v7.3 — Velocidad ajustable + reseñas múltiples con posición (listo para integrar)

- **Velocidad de animación** (50%–150%, por defecto 100%): deslizador bajo
  "Tamaño de productos", con una **rayita fija** marcando la velocidad ideal.
  Implementación: cada fotograma de salida `f` dibuja el instante `f × velocidad`
  de la línea de tiempo, y el video dura `ceil(total / velocidad)` fotogramas.
  Más lento = video más largo (Antes/Después: 11,7s a 1× → 23,4s a 0,5×); sigue
  siendo determinista y fluido porque cada fotograma se calcula exacto.
  Aplica a vista previa, exportación MP4 y respaldo WebM.
- **Reseñas: hasta 4**, cada una con su frase y estrellas (1–5). Se turnan una
  tras otra durante el recorrido de productos (entrada deslizando desde su lado).
- **Posición elegible**: mini-teléfono con 6 zonas (arriba/medio/abajo ×
  izquierda/derecha). Tarjeta más estrecha (máx. 44% del ancho) para tapar menos.
- Estrellas dibujadas como ★ dorado/gris (antes emojis ⭐/☆ inconsistentes).

**Estado:** Daniel considera el módulo listo para pasar a integración en
RETADOR tras estos dos detalles. Siguiente paso: prompt para Claude Code con
este HTML adjunto (convertir a componente dentro de Mi Panel, leer color de
marca real, gate de plan). Anuncios siguen fuera, según lo decidido en v7.2.

---

## v7.2 — Antes/Después con impacto + fondo con foto

- **Antes/Después rehecho** (aprobado por Daniel): el "antes" ocupa TODA la
  pantalla, apagado (escala de grises + velo, para que funcione aunque el
  navegador no aplique el filtro) con sello rojo ✕. Una raya de luz cruza de
  izquierda a derecha **borrando** el antes y destapando el "después" a
  pantalla completa y a color. Al terminar: destello blanco, golpe de escala
  del producto y sello verde ✓. Etiqueta ANTES/DESPUÉS arriba, frase grande
  debajo, titular abajo. Tiempos por comparación: 1s antes + 0,75s barrido +
  2s después (hasta 3 comparaciones).
- **Tema "Foto propia"**: el vendedor sube una foto de fondo; se desenfoca UNA
  vez al subirla (reducir a 90×160 y ampliar — funciona en todos los
  navegadores, incluido Safari) y cada fotograma le pone un velo oscuro fijo
  (55%) para que productos y textos siempre se lean. Sin foto, usa fondo oscuro.

### Plan de anuncios (DECIDIDO, NO CONSTRUIR TODAVÍA)
Daniel pidió explícitamente NO poner huecos de anuncios por ahora — nada que
estorbe mientras se sigue mejorando. Cuando se construya:
- Plan gratis → ve anuncios (p. ej. antes de descargar el video).
- Plan Pro/Premium → no ve anuncios; en su lugar un aviso elegante tipo
  "Anuncio suprimido por tu plan", que refuerza el valor de pagar.
- Fuente de anuncios preferida: productos de vendedores de RETADOR que pagan
  por destacar (anuncios propios). NO redes externas tipo Google AdSense /
  Google Ads: no operan con Cuba por sanciones OFAC y suponen riesgo de
  suspensión de cuenta (ya le pasó a Daniel dos veces por temas de sanciones).

---

## v7.1 — Precio claro, % automático, barra opcional

- Bloque **"🏷️ Precio con descuento (opcional)"** por producto: "Precio normal
  (sale tachado)", "Precio de oferta" y **Moneda** ($, US$, €, CUP, MLC — una
  por video). Si el vendedor escribe solo el número se le añade el símbolo
  ($120 / 1500 CUP); si ya escribió un símbolo se respeta.
- **% de descuento calculado solo** y mostrado bajo los precios; casilla
  "mostrar en el video" → sello rojo "-25%" en la esquina de la tarjeta. Si la
  oferta no es menor que el normal, la casilla se desactiva y lo explica.
- **Barra de progreso** ahora es opcional (casilla en Extras, activada por defecto).
- Texto "Detalles técnicos" reemplazado por **"Calidad del video"**: describe
  el resultado (1080×1920, 60fps, MP4 para redes) sin explicar cómo se genera
  por dentro, a pedido de Daniel.
- Error propio atrapado por la prueba antes de publicar: un reemplazo borró
  `makeTextField/renderItemList/renderSceneList`; restaurados desde respaldo.

(Decisiones pendientes resueltas en v7.2.)

---

## v7 — 5 estilos + mejoras que aplican a todos (nada de contador falso)

Petición de Daniel tras probar v6: separar qué es "mejora a lo existente" de
qué es "estilo nuevo", y descartar explícitamente lo que puede prestarse a
engañar al comprador. Decisiones tomadas junto con él:

- **Rechazado a propósito:** contador que sube ("+500 clientes") — riesgo real
  de que se infle con números falsos, tal como él lo señaló. No se construyó.
- **Urgencia sin cronómetro:** es un aviso de texto FIJO ("¡Últimas
  unidades!"), nunca un reloj corriendo — un video exportado es un archivo
  estático, así que un cronómetro real se vería falso o absurdo si alguien lo
  ve al día siguiente. Esa fue la objeción de Daniel y quedó resuelta así.

### Integraciones (aplican a los 5 estilos, todas opcionales)
- **Barra de progreso** abajo, del color de acento, avanza con el video
  completo (no por escena) — reemplaza la idea de "1 de 3, 2 de 3" que se
  descartó a favor de esto.
- **Tachado de precio**: campos "Antes" / "Ahora" por producto (Acercamiento,
  Noria, Secuencial, Mosaico). Si "Ahora" tiene contenido, se dibuja una
  etiqueta sobre la tarjeta del producto con el precio anterior tachado y el
  nuevo destacado — sin rotar con la tarjeta, para que siempre se lea derecho.
- **Reseña / prueba social**: tarjetita con estrellas + frase + "cliente
  verificado", aparece una vez hacia la mitad del video en una esquina que no
  choca con el titular ni con el producto, y se retira sola.
- **Aviso de urgencia**: pill fijo arriba-izquierda con el texto que el
  vendedor escriba (vacío = no aparece).
- Pestaña nueva **"Extras"** agrupa reseña + urgencia.

### Estilos nuevos
- **Antes / Después:** pantalla dividida por una línea que se desliza y
  revela el "después" sobre el "antes" — hasta 3 comparaciones encadenadas.
  Estructura clásica de anuncio de respuesta directa.
- **Mosaico de catálogo:** hasta 6 productos apareciendo uno por uno
  (`easeOutBack`, escalonados 220ms) hasta formar una cuadrícula 2×2, 2×3 o
  3×3 según cuántos haya. Pensado para "mira todo lo que tenemos" — recibe
  precios, reseña, urgencia y barra de progreso igual que los demás.

### Mejoras a los 3 estilos existentes
- **Noria:** pequeño rebote de escala al llegar al centro (`pop` cuando
  `near > 0.88`), igual que ya tenía Acercamiento — antes solo se enderezaba.
- Acercamiento y Secuencial: sin cambios de mecánica, solo reciben las
  integraciones de arriba.

**Verificado en esta sesión (sin navegador real disponible aquí):**
- Sintaxis JS completa (`node --check`).
- Los 5 estilos × 2 temas × 2 tamaños (100%/160%), fotograma a fotograma,
  con foto real, precio con tachado, reseña y aviso de urgencia activos a la
  vez — sin errores de ejecución.
- Casos límite: 2 y 6 productos (Acercamiento/Noria/Mosaico), 1 y 3
  comparaciones (Antes/Después) — sin errores en ningún extremo.

**NO verificado:** cómo se ve realmente en pantalla — la corrida solo
detecta errores de código (excepciones, referencias rotas), no juzga si algo
se ve bien. Eso solo lo puede confirmar Daniel probándolo con contenido real.

---

## Qué es y para quién

Herramienta dentro de Mi Panel de RETADOR que permite a un vendedor **Pro/Premium**
crear su propio video promocional corto (formato 9:16, para Reels/Stories/TikTok)
con texto, íconos y/o sus propias fotos. Todo se genera y graba en el navegador
del vendedor — sin backend de renderizado.

## Reglas no negociables

- **Cero generación por IA** en este flujo: nada de imágenes, video o voz generados.
  Todo es plantilla determinística — texto + íconos SVG + fotos que el propio
  vendedor sube + colores que ya tiene configurados. Es intencional: fiabilidad
  total y costo cero por generación.
- **60 fps fijos, siempre fluido, sin importar el teléfono.** Ver decisión de
  fluidez abajo — esto ya no depende de que el dispositivo pueda renderizar en
  tiempo real.
- Solo visible para vendedores con `can_customize = true` (Pro/Premium).

## Decisión de fluidez (v2) — por qué se cambió el enfoque

La v1 grababa con `canvas.captureStream(60)` + `MediaRecorder` en tiempo real:
si el dispositivo no sostenía 60fps reales al dibujar, el video de salida salía
a saltos. Se comprobó este problema con una herramienta externa de captura de
pantalla (25fps con saltos visibles) y se decidió resolverlo de raíz, no
parchearlo.

**Solución adoptada:** renderizado **por número de fotograma**, no por reloj.
Cada función de dibujo es una función pura de `frameIndex` (dado el mismo
número de frame, siempre dibuja exactamente lo mismo — no depende de
`performance.now()` ni de cuánto tardó el frame anterior).

Para la exportación final, dos rutas (con detección de soporte automática):

1. **Ruta principal — WebCodecs + `mp4-muxer`** (librería de Vanilagy, cargada
   desde jsdelivr, ~sin dependencias pesadas). Se recorre `frame = 0..total-1`
   de forma secuencial y NO en tiempo real: se dibuja el frame, se crea un
   `VideoFrame` con un timestamp fijo exacto (`frame * (1_000_000 / 60)` µs) y
   se codifica con `VideoEncoder`. Como el timestamp de cada frame es fijo por
   construcción, el video final SIEMPRE sale a 60fps exactos y con la duración
   correcta, sin importar cuánto tardó el dispositivo en dibujar o codificar
   cada frame — en un teléfono lento el proceso de generación tarda más en
   tiempo real, pero el archivo resultante nunca se ve a saltos ni queda
   descuadrado en duración. Salida directa en **`.mp4`** — esto también
   elimina la necesidad de `ffmpeg.wasm` que se había dejado pendiente en la
   v1 para compatibilidad con Instagram/Facebook/iOS.
2. **Ruta de respaldo — tiempo real (`captureStream(60)` + `MediaRecorder`,
   como en v1)**, solo para navegadores sin soporte de WebCodecs (ej. Safari
   viejo). Sale en `.webm`. Se detecta automáticamente
   (`typeof window.VideoEncoder !== "undefined" && ... Mp4Muxer ...`) y se
   informa al vendedor en un texto pequeño bajo el botón de descarga qué ruta
   se usó — visible también en el prototipo como diagnóstico.

La vista previa en vivo (antes de exportar) sigue usando `requestAnimationFrame`
en tiempo real, porque por definición una vista previa en vivo no puede ser
distinta — eso es solo cosmético, la exportación real es la que importa y esa
sí es 100% determinista por frame.

**Pendiente de verificación real:** probar la exportación en la emulación de
un dispositivo de gama media/baja de Chrome DevTools (CPU throttling 4x-6x) —
no se pudo ejecutar un navegador real desde esta sesión de construcción. La
arquitectura por frame-index está diseñada para ser inmune a esto por
construcción, pero falta la verificación empírica en un dispositivo/emulación
real antes de darlo por bueno.

## Subida de fotos propias (v2)

- Cada escena (secuencial) o elemento (acercamiento/noria) tiene un botón
  opcional "Subir foto" — si el vendedor sube una foto, se usa ella en vez del
  ícono genérico para esa escena/elemento (no se combinan ambos).
- Manejo 100% en el navegador (`FileReader`/`createObjectURL`, `Image`) — no
  se sube a ningún servidor en esta v2. **Pendiente:** decidir si conviene
  guardar la foto en Supabase Storage para que el vendedor pueda reutilizarla
  sin volver a subirla — no es necesario para que la v2 funcione.
- Validación de tamaño: máximo 8MB por foto, con aviso si se excede.
- La foto se dibuja recortada a un rectángulo redondeado ("cover fit", sin
  deformar), con la misma animación de entrada/salida (fade + traslación) que
  ya tenía el ícono que reemplaza.

## Sistema de estilos (8 desde v8.5 — ninguno se quita sin que Daniel lo pida)

Arquitectura de registro (`STYLES = { acercamiento, noria, secuencial }`)
pensada para que sumar un cuarto estilo no toque el motor ni la exportación —
cada estilo solo necesita implementar `buildTimeline(data)` (en fotogramas,
no en ms) y `renderFrame(ctx, frameIndex, timeline, opts)`.

### Estilo "Acercamiento" (recomendado, el orientado a vender)
- Cada elemento entra en diagonal desde una esquina, pequeño/rotado/desenfocado,
  crece y se enfoca al pasar por el punto medio del recorrido, sigue de largo
  encogiéndose y desenfocándose hacia la esquina opuesta.
- Curva de escala: `scale = min + (max-min) * sin(p·π)`, con un pequeño "pop"
  extra cuando `sin(p·π) > 0.88` (justo en el pico de nitidez).
- Estela de movimiento: 3 copias fantasma detrás de cada elemento, cada vez
  más tenues y borrosas — sensación de velocidad real, no solo "se movió".
- Viñeta de foco: halo radial suave del color de acento centrado en el punto
  medio del recorrido, para dar profundidad.
- Sombra dinámica debajo de cada elemento, más intensa/grande cuanto más
  cerca/grande está.
- El primer elemento arranca con un 22% de su recorrido ya adelantado (no
  desde cero) para que el gancho visual se vea desde el primer fotograma.
- Titular fijo arriba con una palabra o frase corta resaltada con glow
  (`shadowBlur` sincronizado al número de frame) — el vendedor elige qué
  palabra/frase resaltar dentro de su propio titular.

### Estilo "Noria / carrusel giratorio"
- Hasta 6 elementos (ícono o foto), mínimo 2.
- Cada elemento viaja de abajo hacia arriba en ~3s (180 frames), con rotación
  que va de girado (abajo) → recto (centro, `p=0.5`) → girado otra vez
  (arriba), usando `sin((p-0.5)*π)` como curva de ángulo.
- Los elementos se disparan escalonados (`spacing ≈ 55%` de la duración de
  viaje), así que siempre hay dos visibles a la vez en la transición.
- Titular fijo arriba con brillo pulsante, durante todo el segmento.

### Estilo "Escenas secuenciales"
Una frase con su ícono o foto entra, se queda, sale, entra la siguiente.
Hasta 5 escenas + escena final de logo. El más simple/narrativo de los tres.

Los tres estilos comparten: la escena final de logo (nombre cayendo letra por
letra), el sistema de temas de color, y la subida de foto por elemento.

### Estilos considerados para más adelante (NO implementados, solo dejar la puerta abierta)
Zoom lento tipo Ken Burns · texto tipo máquina de escribir · antes/después con
pantalla dividida · tarjeta giratoria 3D (precio/producto) · partículas o
confeti sincronizado con el CTA. El registro `STYLES` ya soporta añadir
cualquiera de estos sin reescribir el motor.

## Sistema de temas de color

`THEMES = { crema, oscuro }`, cada uno define `bg`, `text`, `shadow` y
`defaultAccent`. El acento se sigue ajustando aparte (color picker
independiente) porque en la integración real ese valor vendrá del color de
marca que el vendedor ya configuró — el tema solo decide fondo/texto/sombra
(básicamente, claro vs. oscuro), no reemplaza el acento de marca.
- **Crema** (predeterminado): fondo `#F7F3EA`, texto `#161510`.
- **Oscuro premium**: fondo `#161510`, texto `#F7F3EA` — pensado para que el
  glow del acento se note más.
Sumar un tema nuevo: una entrada más en `THEMES` con esos 4 campos — ningún
estilo necesita tocarse porque todos leen el color por `opts.theme`, nunca
hardcodeado.

## Cómo agregar un ícono nuevo

1. Añadir el `path` SVG (viewBox 24×24) a `ICON_PATHS`.
2. Añadir su label a `ICON_LABELS` y su id a `ICON_ORDER`.
3. Escribir su función de animación en `ICONS`, firma
   `(ctx, cx, cy, size, color, accent, tMs) => void` — `tMs` se deriva del
   número de frame (`localFrame * MS_PER_FRAME`), nunca del reloj real.

## Decisiones de diseño ya tomadas (no deshacer sin razón)

- Fondo `#FFF8F0`, texto `#1A1A1A`, acento por defecto `#F26B0F` — se
  sustituye por el color de Diseño del vendedor cuando exista la integración real.
- Nombre final cae letra por letra, 75ms de desfase, easing `easeOutBack`.
- Formato de salida: `.mp4` cuando el navegador soporta WebCodecs (caso
  normal hoy en Chrome/Edge/Android), `.webm` como respaldo — no hace falta
  `ffmpeg.wasm`.
- Si el vendedor sube foto para una escena/elemento, la foto reemplaza al
  ícono ahí (no se muestran ambos a la vez).
- El editor sigue viviendo como prototipo standalone (HTML autocontenido)
  mientras se itera diseño/animaciones — no se ha escrito código React
  todavía para la integración real.

## Pendiente para la integración real en RETADOR

- [ ] Verificar la exportación en emulación de dispositivo gama media/baja
      (Chrome DevTools CPU throttling) — pendiente de esta sesión.
- [ ] Leer el color de marca del vendedor desde Mi Panel → Diseño (localizar
      el campo real en Supabase; no asumir el nombre sin confirmarlo).
- [ ] Aplicar el gate de plan `can_customize` con el mismo patrón ya usado
      en `App.jsx:1286` y `App.jsx:2346`.
- [ ] Decidir la ubicación exacta dentro de `Store.jsx` (probablemente tarjeta
      nueva dentro de Promociones — confirmar contra el layout real).
- [ ] Convertir el HTML/JS vanilla a componentes React siguiendo las
      convenciones del proyecto (Tailwind, estructura de carpetas).
- [ ] Decidir si conviene guardar las fotos subidas en Supabase Storage para
      reutilizarlas entre sesiones del vendedor (no bloqueante para v2).
- [ ] Considerar límite de tamaño/resolución de exportación si el archivo
      `.mp4` resulta pesado para subir desde datos móviles en Cuba/EE.UU.
- [ ] [v8.0] Catálogo real del vendedor para "Selecciona un producto de tu tienda".
- [ ] [v8.0] Backend de Facebook (OAuth, tokens cifrados, subida, Reels vs video,
      estado asíncrono, límite por hora) + revisión de Meta.
- [ ] [v8.0] Dominio y rutas reales de los enlaces del texto del post.
- [ ] [v8.0] Logotipo oficial en la marca de agua y plan real en vez del selector.

---
*Última actualización: v8.7 — Compartir nativo, calidad Ligera 720p y monedas reales. v8.6 — Vitrina con muro de fotos en movimiento y un producto distinto por escena. v8.5 — estilo Vitrina. v8.4 — direcciones de productos, efectos por producto opcionales, frase final en los 7 estilos, contraste en Directo, Desfile claro y vista previa más fluida. v8.3 — sonido sin distorsión, efectos en los 7 estilos y recorrido "Sube y gira". v8.2 — estilo Desfile, efectos de sonido y ambiente Moderno. v8.1 — música creada por código (5 ambientes). v8.0 — 6 estilos (se suma Directo), Publicar en Facebook
con texto y vista previa, selector de producto de la tienda, formatos
Vertical/Feed/Cuadrado, fondos sin pixelado, naranja RETADOR siempre disponible y
marca de agua del plan gratis. Renderizado por número de frame y exportación
WebCodecs+mp4-muxer (con respaldo WebM) siguen como en v7.3.*
