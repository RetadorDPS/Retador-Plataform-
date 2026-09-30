// ═════════════════════════════════════════════════════════════════════════════
// Publicar en Facebook — cliente de la Integración con redes sociales.
//
// Quién puede usar Facebook lo decide SOLO el backend (fb-pages: configurado y
// plan permitido), nunca el rol ni un interruptor en el navegador: ver
// fbPuedeUsar(). Para apagarlo para todos se usa el backend
// (private.social_plan_access o quitar los secretos → configurado = false).
// Este archivo lo usan el generador de video, Crear publicación y
// Ajustes → Integración con redes sociales.
//
// Regla no negociable: el token de la página NUNCA vive ni se usa en el
// navegador. Estas funciones solo llaman a las Edge Functions de Supabase
// (fb-oauth-start, fb-pages, fb-publish, fb-publish-status), que guardan los
// tokens cifrados por vendedor y hablan con la API de Meta. Aquí solo llegan
// nombres e ids de Páginas y el estado de las publicaciones.
// ═════════════════════════════════════════════════════════════════════════════

const TAM_MAX_VIDEO = 50 * 1024 * 1024; // igual que el bucket social-videos
// Máximo de fotos en una publicación de varias fotos. Mismo valor que FOTOS_MAX
// en fb-publish (si se cambia uno, cambiar el otro).
export const FB_FOTOS_MAX = 6;
const ESPERA_MAX_MS = 15 * 60 * 1000;   // tope en el navegador para esperar el procesado

// Mensajes claros para cada motivo que devuelve el backend.
const MOTIVOS = {
  no_configurado: "La publicación en Facebook todavía no está disponible.",
  plan_no_permitido: "Publicar en Facebook está incluido en los planes Pro y Premium.",
  cuenta_suspendida: "Tu cuenta está suspendida.",
  eliminacion_pendiente: "Tu cuenta tiene una eliminación pendiente.",
  limite_por_hora: "Llegaste al límite de 5 publicaciones por hora en esta Página.",
  reconectar: "Facebook retiró el permiso. Vuelve a conectar tu Página.",
  // Publicación de fotos (mismos textos que devuelve fb-publish).
  foto_cambiada: "Las fotos del producto cambiaron. Vuelve a elegir la foto.",
  foto_no_disponible: "Esa foto ya no está en el producto. Vuelve a elegirla.",
  sin_imagen: "Esa foto del producto no se puede publicar.",
  publicacion_en_curso: "Ya hay una publicación de este producto en curso en esta Página.",
};

// Conexión con Supabase solo cuando hace falta (no pesa en la carga inicial).
async function cliente() {
  const { supabase } = await import("../../../shared/supabase.js");
  return supabase;
}

// Llama a una Edge Function y devuelve su respuesta; si falla, lanza un error
// con el mensaje real del backend (nunca un token: el backend no los envía).
// Datos extra opcionales para quien los necesite (el creador de publicaciones):
//   e.http               código HTTP de la respuesta, si la hubo
//   e.reintentarDespues  hora devuelta por el límite de 5 por hora
//   e.red = true         la petición no llegó a completarse (corte de red): NO
//                        se sabe si el servidor la recibió.
async function invocar(nombre, cuerpo) {
  const supabase = await cliente();
  const { data, error } = await supabase.functions.invoke(nombre, { body: cuerpo });
  if (error) {
    let detalle = null;
    try { detalle = await error.context?.json(); } catch (_e) { /* sin cuerpo legible */ }
    const e = new Error((detalle && (MOTIVOS[detalle.motivo] || detalle.error)) || "No se pudo completar la acción con Facebook.");
    e.motivo = detalle?.motivo || null;
    const http = Number(error.context?.status);
    if (Number.isInteger(http) && http > 0) e.http = http;
    if (detalle?.reintentar_despues) e.reintentarDespues = detalle.reintentar_despues;
    if (error.name === "FunctionsFetchError") e.red = true;
    throw e;
  }
  return data;
}

// Estado completo: { permitido, motivo, configurado, conexion, paginas }.
export async function fbEstado() {
  return invocar("fb-pages", { accion: "listar" });
}

// Mismo estado, reutilizado durante 60 s. Solo para decidir si se MUESTRA una
// entrada de Facebook (tarjeta, botón, sección de Ajustes); para conectar o
// publicar se usa siempre fbEstado(). Si falla (sin sesión, sin red) devuelve
// null y no se guarda, para volver a preguntar la próxima vez.
let estadoCacheado = null;
export function fbEstadoCacheado() {
  if (!estadoCacheado || Date.now() - estadoCacheado.t > 60 * 1000) {
    estadoCacheado = { t: Date.now(), p: fbEstado().catch(() => { estadoCacheado = null; return null; }) };
  }
  return estadoCacheado.p;
}
// true si el backend deja usar Facebook a este usuario (configurado y permitido).
export const fbPuedeUsar = (estado) => !!(estado?.configurado && estado?.permitido);

// Inicia "Continuar con Facebook". Si ya hay Páginas conectadas, no hace nada.
// Si no, pide al backend la URL de Meta y navega a ella en la ventana
// principal (también desde el iframe de la herramienta). La vuelta llega a
// /redes-sociales/facebook/callback/, que devuelve al usuario a volverA
// ("ajustes", "herramienta-video" = Publicar en Facebook desde un video, o
// "producto" = Crear publicación; son los
// únicos destinos que acepta fb-oauth-start).
export async function fbConectar({ volverA = "herramienta-video", reconectar = false } = {}) {
  if (!reconectar) {
    const estado = await fbEstado();
    if (!estado.permitido) throw new Error(MOTIVOS[estado.motivo] || MOTIVOS.plan_no_permitido);
    if (estado.conexion?.status === "active" && (estado.paginas || []).length) return;
  }
  const { url } = await invocar("fb-oauth-start", { return_to: volverA, reconectar });
  if (!/^https:\/\/www\.facebook\.com\//.test(String(url))) throw new Error("Respuesta inesperada al conectar con Facebook.");
  (window.top || window).location.href = url;
  return new Promise(() => {}); // la página se va a Facebook
}

// Páginas donde puede publicar: [{ id, n: nombre, i: inicial, foto, predeterminada }].
// La predeterminada va primero.
export async function fbListarPaginas() {
  const estado = await fbEstado();
  return (estado.paginas || [])
    .map((p) => ({
      id: p.id, n: p.page_name, i: String(p.page_name || "?").trim().charAt(0).toUpperCase(),
      foto: p.picture_url || null, predeterminada: !!p.is_default,
    }))
    .sort((a, b) => Number(b.predeterminada) - Number(a.predeterminada));
}

export async function fbElegirPredeterminada(paginaId) {
  return invocar("fb-pages", { accion: "predeterminada", social_page_id: paginaId });
}

export async function fbDesconectar() {
  return invocar("fb-pages", { accion: "desconectar" });
}

// Sube el video al bucket privado social-videos (carpeta del propio usuario).
// Solo MP4 (lo que acepta Meta) y hasta 50 MB. Devuelve { id: ruta }.
// ruta (opcional): la misma en cada reintento del mismo borrador; si ese archivo
// ya se subió, no se sube otra vez (así no quedan copias sueltas en el bucket).
export async function fbSubirVideo(blob, { ext, ruta } = {}) {
  if (ext !== "mp4" || !(blob instanceof Blob) || (blob.type && blob.type !== "video/mp4")) {
    throw new Error("Facebook necesita el video en MP4 y este navegador lo generó en otro formato. Prueba desde Chrome o Safari actualizados.");
  }
  if (blob.size > TAM_MAX_VIDEO) throw new Error("El video pesa más de 50 MB. Prueba con la calidad Ligera.");
  const supabase = await cliente();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Inicia sesión para publicar.");
  const destino = typeof ruta === "string" && ruta.startsWith(session.user.id + "/") ? ruta : `${session.user.id}/${crypto.randomUUID()}.mp4`;
  const { error } = await supabase.storage.from("social-videos").upload(destino, blob, { contentType: "video/mp4", upsert: false });
  const yaSubido = error && (String(error.statusCode) === "409" || /already exists|duplicate/i.test(String(error.message)));
  if (error && !yaSubido) throw new Error("No se pudo subir el video. Revisa tu conexión y vuelve a intentarlo.");
  return { id: destino };
}

// Borra un video subido que al final no se publicó (el vendedor salió antes).
// Solo en su propia carpeta (lo exige también la política del bucket).
export async function fbBorrarVideoSubido(ruta) {
  if (typeof ruta !== "string" || !ruta.endsWith(".mp4")) return;
  const supabase = await cliente();
  await supabase.storage.from("social-videos").remove([ruta]).catch(() => {});
}

// Publica el video subido: vertical → Reel; feed/cuadrado → video normal.
// La clave de idempotencia evita duplicados si la petición se repite.
// Devuelve { id, status } de la publicación.
// idempotencyKey (opcional): igual que en fbPublicarProducto; si llega se usa tal cual.
export async function fbPublicar({ subidaId, paginaId, texto, tipo, idempotencyKey }) {
  const d = await invocar("fb-publish", {
    social_page_id: paginaId, tipo: tipo === "reel" ? "reel" : "video",
    idempotency_key: idempotencyKey || crypto.randomUUID(), mensaje: texto || "", storage_path: subidaId,
  });
  return { id: d.publicacion.id, status: d.publicacion.status, enlace: d.publicacion.permalink || null, reutilizada: !!d.reutilizada };
}

// Publica un producto propio como enlace (vista previa de RETADOR) o como foto.
// Foto: fotoIndice es la posición en products.images; la URL la elige SIEMPRE el
// servidor desde la base. fotoEsperada solo sirve para que el servidor detecte
// que el orden de fotos cambió. idempotencyKey: si llega, se usa tal cual (así
// un reintento tras un corte de red no publica dos veces); si no, se genera una.
// Esta función nunca cambia la clave por su cuenta: eso lo decide quien llama.
export async function fbPublicarProducto({ productoId, paginaId, texto, tipo = "link", fotoIndice, fotoEsperada, idempotencyKey } = {}) {
  const esFoto = tipo === "photo";
  const cuerpo = {
    social_page_id: paginaId, tipo: esFoto ? "photo" : "link",
    idempotency_key: idempotencyKey || crypto.randomUUID(), mensaje: texto || "", product_id: productoId,
  };
  if (esFoto && fotoIndice !== undefined && fotoIndice !== null) cuerpo.foto_indice = fotoIndice;
  if (esFoto && fotoEsperada !== undefined && fotoEsperada !== null) cuerpo.foto_esperada = fotoEsperada;
  const d = await invocar("fb-publish", cuerpo);
  return { id: d.publicacion.id, status: d.publicacion.status, enlace: d.publicacion.permalink || null, reutilizada: !!d.reutilizada };
}

// Publica VARIAS fotos (de uno o varios productos propios) en UN solo post.
// fotos: [{ productoId, fotoIndice, fotoEsperada }] entre 2 y FB_FOTOS_MAX. Como
// en la foto individual, las URLs las toma el servidor de la base; fotoEsperada
// solo sirve para detectar que el orden de fotos cambió.
export async function fbPublicarFotos({ paginaId, texto, fotos, idempotencyKey } = {}) {
  const d = await invocar("fb-publish", {
    social_page_id: paginaId, tipo: "photos",
    idempotency_key: idempotencyKey || crypto.randomUUID(), mensaje: texto || "",
    fotos: (fotos || []).map((f) => ({ product_id: f.productoId, foto_indice: f.fotoIndice, foto_esperada: f.fotoEsperada })),
  });
  return { id: d.publicacion.id, status: d.publicacion.status, enlace: d.publicacion.permalink || null, reutilizada: !!d.reutilizada };
}

// Facebook procesa el video de forma asíncrona: consulta con la espera que
// indica el backend (5 s → 15 s → 30 s) y con un tope. Devuelve { enlace }.
export async function fbEsperarProcesado(publicacionId) {
  const inicio = Date.now();
  for (;;) {
    const d = await invocar("fb-publish-status", { publicacion_id: publicacionId });
    const p = d.publicacion || {};
    if (p.status === "published") return { enlace: p.permalink || "https://www.facebook.com/" };
    if (p.status === "failed") throw Object.assign(new Error("Facebook no pudo publicar el video. Inténtalo de nuevo más tarde."), { motivo: "procesado_fallido" });
    if (Date.now() - inicio > ESPERA_MAX_MS) throw Object.assign(new Error("Facebook sigue procesando el video. Revisa tu Página en unos minutos."), { motivo: "sigue_procesando" });
    await new Promise((r) => setTimeout(r, Math.max(5, Number(d.reintentar_en) || 5) * 1000));
  }
}
