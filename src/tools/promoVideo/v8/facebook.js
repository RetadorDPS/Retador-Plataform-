// ═════════════════════════════════════════════════════════════════════════════
// Publicar en Facebook — cliente de la Integración con redes sociales.
//
// El botón "Publicar en Facebook" sigue APAGADO en producción con
// FACEBOOK_PUBLICAR hasta hacer la prueba real con Meta. Este mismo archivo lo
// usan la herramienta de video y Ajustes → Integración con redes sociales.
//
// Regla no negociable: el token de la página NUNCA vive ni se usa en el
// navegador. Estas funciones solo llaman a las Edge Functions de Supabase
// (fb-oauth-start, fb-pages, fb-publish, fb-publish-status), que guardan los
// tokens cifrados por vendedor y hablan con la API de Meta. Aquí solo llegan
// nombres e ids de Páginas y el estado de las publicaciones.
// ═════════════════════════════════════════════════════════════════════════════
export const FACEBOOK_PUBLICAR = false;

const TAM_MAX_VIDEO = 50 * 1024 * 1024; // igual que el bucket social-videos
const ESPERA_MAX_MS = 15 * 60 * 1000;   // tope en el navegador para esperar el procesado

// Mensajes claros para cada motivo que devuelve el backend.
const MOTIVOS = {
  no_configurado: "La publicación en Facebook todavía no está disponible.",
  plan_no_permitido: "Publicar en Facebook está incluido en los planes Pro y Premium.",
  cuenta_suspendida: "Tu cuenta está suspendida.",
  eliminacion_pendiente: "Tu cuenta tiene una eliminación pendiente.",
  limite_por_hora: "Llegaste al límite de 5 publicaciones por hora en esta Página.",
  reconectar: "Facebook retiró el permiso. Vuelve a conectar tu Página.",
};

// Conexión con Supabase solo cuando hace falta (no pesa en la carga inicial).
async function cliente() {
  const { supabase } = await import("../../../shared/supabase.js");
  return supabase;
}

// Llama a una Edge Function y devuelve su respuesta; si falla, lanza un error
// con el mensaje real del backend (nunca un token: el backend no los envía).
async function invocar(nombre, cuerpo) {
  const supabase = await cliente();
  const { data, error } = await supabase.functions.invoke(nombre, { body: cuerpo });
  if (error) {
    let detalle = null;
    try { detalle = await error.context?.json(); } catch (_e) { /* sin cuerpo legible */ }
    const e = new Error((detalle && (MOTIVOS[detalle.motivo] || detalle.error)) || "No se pudo completar la acción con Facebook.");
    e.motivo = detalle?.motivo || null;
    throw e;
  }
  return data;
}

// Estado completo: { permitido, motivo, configurado, conexion, paginas }.
export async function fbEstado() {
  return invocar("fb-pages", { accion: "listar" });
}

// Inicia "Continuar con Facebook". Si ya hay Páginas conectadas, no hace nada.
// Si no, pide al backend la URL de Meta y navega a ella en la ventana
// principal (también desde el iframe de la herramienta). La vuelta llega a
// /redes-sociales/facebook/callback/.
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
export async function fbSubirVideo(blob, { ext } = {}) {
  if (ext !== "mp4" || !(blob instanceof Blob)) {
    throw new Error("Facebook necesita el video en MP4 y este navegador lo generó en otro formato. Prueba desde Chrome o Safari actualizados.");
  }
  if (blob.size > TAM_MAX_VIDEO) throw new Error("El video pesa más de 50 MB. Prueba con la calidad Ligera.");
  const supabase = await cliente();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Inicia sesión para publicar.");
  const ruta = `${session.user.id}/${crypto.randomUUID()}.mp4`;
  const { error } = await supabase.storage.from("social-videos").upload(ruta, blob, { contentType: "video/mp4", upsert: false });
  if (error) throw new Error("No se pudo subir el video. Revisa tu conexión y vuelve a intentarlo.");
  return { id: ruta };
}

// Publica el video subido: vertical → Reel; feed/cuadrado → video normal.
// La clave de idempotencia evita duplicados si la petición se repite.
// Devuelve { id, status } de la publicación.
export async function fbPublicar({ subidaId, paginaId, texto, tipo }) {
  const d = await invocar("fb-publish", {
    social_page_id: paginaId, tipo: tipo === "reel" ? "reel" : "video",
    idempotency_key: crypto.randomUUID(), mensaje: texto || "", storage_path: subidaId,
  });
  return { id: d.publicacion.id, status: d.publicacion.status };
}

// Publica un producto propio como enlace (vista previa de RETADOR) o como foto.
export async function fbPublicarProducto({ productoId, paginaId, texto, tipo = "link" }) {
  const d = await invocar("fb-publish", {
    social_page_id: paginaId, tipo: tipo === "photo" ? "photo" : "link",
    idempotency_key: crypto.randomUUID(), mensaje: texto || "", product_id: productoId,
  });
  return { id: d.publicacion.id, status: d.publicacion.status, enlace: d.publicacion.permalink || null };
}

// Facebook procesa el video de forma asíncrona: consulta con la espera que
// indica el backend (5 s → 15 s → 30 s) y con un tope. Devuelve { enlace }.
export async function fbEsperarProcesado(publicacionId) {
  const inicio = Date.now();
  for (;;) {
    const d = await invocar("fb-publish-status", { publicacion_id: publicacionId });
    const p = d.publicacion || {};
    if (p.status === "published") return { enlace: p.permalink || "https://www.facebook.com/" };
    if (p.status === "failed") throw new Error("Facebook no pudo publicar el video. Inténtalo de nuevo más tarde.");
    if (Date.now() - inicio > ESPERA_MAX_MS) throw new Error("Facebook sigue procesando el video. Revisa tu Página en unos minutos.");
    await new Promise((r) => setTimeout(r, Math.max(5, Number(d.reintentar_en) || 5) * 1000));
  }
}
