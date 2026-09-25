# Generador de Video Promocional — RETADOR

**Estado:** INTEGRADO en RETADOR desde la v213 (ver "Integración en RETADOR" justo abajo).
Las secciones siguientes son el historial del prototipo y se conservan tal cual.

Prototipo funcional actual (artifact publicado, standalone, mismo link en cada versión):
https://claude.ai/artifact/BVpS5cnvCYthJAG2dGG5c7

**Estilos disponibles hoy (los tres, ninguno se elimina sin pedirlo explícitamente):**
Acercamiento, Noria horizontal, Escenas secuenciales, Antes/Después, Mosaico de catálogo (5 en total).
**Temas de color:** Crema (marca, predeterminado) y Oscuro premium — arquitectura
lista para sumar más, incluido el color de marca real del vendedor más adelante.


## Integración en RETADOR (v213)

### Dónde vive
- **Entrada principal:** ☰ Menú → **Herramientas** → tarjeta "Video Promocional"
  (`App.jsx`, bloque `showTools`). Visible para TODOS los planes, gratis incluido.
- **Acceso directo:** Mi Panel → **Promociones** → tarjeta "Video promocional /
  Crear video" (`Store.jsx`, componente `Promos`). Mi Panel ya solo existe para
  Pro/Premium (`isProStore`), así que el acceso directo solo lo ven ellos. Es un
  enlace: llama a `api.onOpenPromoVideo`, que abre la MISMA herramienta.
- La herramienta se abre como capa a pantalla completa (`promoVideoOpen` en
  `App.jsx`), cargada bajo demanda (`React.lazy`, paquete propio de ~95 kB) y
  registrada en la pila del botón Atrás del teléfono (`navSnap`/`navSig`/`applySnap`).

### Archivos creados
- `src/tools/promoVideo/engine.js` — motor copiado TAL CUAL del prototipo
  (verificado por script: todas las líneas idénticas salvo una). Únicos cambios de
  adaptación a módulo: `mp4-muxer` importado del paquete (antes CDN); `setProgress`,
  la moneda y la foto de fondo, que eran globales, se asignan con
  `setProgressHandler` / `setCurrency` / `setBackgroundPhoto`. Añadido nuevo:
  `loadWatermarkLogo`, `drawWatermark`, `withWatermark`.
- `src/tools/promoVideo/PromoVideoTool.jsx` — editor en React con todas las
  funciones del prototipo (carrusel de 5 estilos, pestañas Contenido/Marca/Tema/
  Extras, tamaño 100–160 %, velocidad 50–150 % con rayita, emojis rápidos + selector
  por categorías + pegar emoji, foto de producto, precio con descuento y % automático,
  temas Crema/Oscuro premium/Foto propia, barra de progreso, hasta 4 reseñas con 6
  posiciones, aviso de urgencia, vista previa en vivo, Generar y descargar).
- `src/tools/promoVideo/styles.js` — el CSS del prototipo con los MISMOS valores,
  aislado bajo `.rpv`. El claro/oscuro lo decide el tema de la app (`.rpv-dark`),
  no la preferencia del sistema.
- `src/shared/planPerks.js` — `getPlanPerks(plan)`: ÚNICO lugar de la regla de plan
  para las herramientas (servirá también para los anuncios).
- Dependencias nuevas del proyecto: `mp4-muxer` y `@fontsource/manrope`
  (Manrope viaja dentro de la app, sin CDN, y funciona sin conexión).

### De dónde lee cada dato
- **Plan:** `myRealPlan` de `App.jsx` = fila REAL de la tabla `plans` según
  `profiles.plan` → `getPlanPerks(myRealPlan)`.
- **Color de acento (Pro/Premium):** `store_config.accent` (sección Diseño), vía el
  `storeCfg` que App.jsx ya carga para los Pro. Editable solo para ese video.
- **Nombre de cierre (Pro/Premium):** `store_config.name` (sección Diseño).
  Si está vacío (4 de las 5 cuentas Pro hoy), el campo queda vacío para escribirlo
  a mano — decisión de Daniel: NO usar el nombre real de la persona.
- **Gratis / sin tienda:** acento `#F26B0F` y nombre escrito a mano.
- **Logo de la marca de agua:** `public/icons/icon-192.png` (el ícono real de la
  app, mismo dominio → el canvas no queda "contaminado").

### Cómo se decide la marca de agua
- `conMarcaDeAgua = !(plan?.can_customize === true)`. Gratis, sin sesión, planes
  todavía cargando o plan desconocido → CON marca. Solo `can_customize = true` la quita.
- Se dibuja con `withWatermark(estilo)`: primero el fotograma de siempre, al final
  `drawWatermark` (logo + "Hecho con RETADOR" en una píldora oscura semitransparente,
  esquina inferior derecha, encima de la barra). La misma envoltura la usan la vista
  previa, la exportación MP4 y el respaldo WebM, así que queda en el archivo.
- Para gratis, bajo el botón aparece: "Tu video incluye la marca 'Hecho con
  RETADOR'. Quítala con el plan Pro.", con enlace al modal real de Planes.

### Verificado en esta integración (con evidencia)
- Gratis: video descargado real; la marca aparece en fotogramas extraídos del
  ARCHIVO, tanto con productos como en el cierre con el logo. Pro: sin marca y con
  el color #06B6D4 de "Retador Marketplace" en la barra y en el botón final.
- 5 estilos × 3 temas en vista previa: sin errores en consola.
- Ruta fotograma a fotograma con CPU 6× más lenta y emulación móvil: 647
  fotogramas a 60,00 fps exactos, todos separados 16,67 ms (tardó 58 s en
  generarse, pero sin un solo salto).

### NO verificado (honestamente)
- **MP4/H.264 real en Chrome:** el Chromium del entorno de pruebas no trae codificador
  H.264 y la red bloqueó descargar Chrome. Ahí se usó el respaldo WebM, y la
  fluidez se probó con el mismo bucle y el códec VP9. Falta que Daniel genere un
  video en Chrome de escritorio o Android y confirme que sale `.mp4`.
- **El respaldo WebM NO es fluido** (graba en tiempo real, como ya advertía la v2):
  unos 35 fps en escritorio y 6 fps con CPU 6×. Solo se usa en navegadores sin
  WebCodecs/H.264, como Safari viejo.
- Las tarjetas dentro de la app real (Herramientas y Promociones) no se probaron
  con una sesión real, porque el login es solo con Google. Se probaron montando
  el componente con las filas reales de `plans`.

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

## Sistema de estilos (3 hoy — ninguno se quita sin que Daniel lo pida)

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

---
*Última actualización: tres estilos (Acercamiento, Noria, Secuencial) +
sistema de temas de color (Crema/Oscuro premium) + auditoría de accesibilidad
y estados vacíos usando el criterio de los agentes de diseño/calidad que
Daniel compartió. Renderizado por número de frame y exportación
WebCodecs+mp4-muxer (con respaldo WebM) siguen como en la versión anterior.*
