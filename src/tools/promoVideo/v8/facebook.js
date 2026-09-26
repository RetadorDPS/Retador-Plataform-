// ═════════════════════════════════════════════════════════════════════════════
// Publicar en Facebook — puntos de conexión con el BACKEND (todavía no existe).
//
// El botón "Publicar en Facebook" está APAGADO en producción con FACEBOOK_PUBLICAR.
// La conexión real necesita app propia en Meta for Developers, permiso
// pages_manage_posts aprobado y verificación de negocio.
//
// Regla no negociable: el token de la página NUNCA vive ni se usa en el
// navegador. El navegador solo llama a estas funciones; cada una debe llamar a
// una Edge Function de Supabase que guarda los tokens cifrados por vendedor y
// habla con la API de Meta (ver README → "Publicar en Facebook").
// ═════════════════════════════════════════════════════════════════════════════
export const FACEBOOK_PUBLICAR = false;

const NO_DISPONIBLE = "La publicación en Facebook todavía no está disponible.";

// Inicia "Continuar con Facebook": el backend arma la URL de OAuth y hace el
// intercambio del código. Devuelve cuando la conexión quedó guardada.
export async function fbConectar() { throw new Error(NO_DISPONIBLE); }

// Páginas que el vendedor administra: [{ id, n: nombre, i: inicial }].
export async function fbListarPaginas() { throw new Error(NO_DISPONIBLE); }

// Sube el video (mejor a Storage; el backend lo toma de ahí por límites de tamaño).
// Devuelve { id } de la subida.
export async function fbSubirVideo(/* blob, { ext } */) { throw new Error(NO_DISPONIBLE); }

// Publica: vertical → Reel; feed/cuadrado → video normal de página.
// El backend debe bloquear la doble publicación y limitar publicaciones por hora.
// Devuelve { id } de la publicación.
export async function fbPublicar(/* { subidaId, paginaId, texto, tipo } */) { throw new Error(NO_DISPONIBLE); }

// Facebook procesa el video de forma asíncrona: consultar hasta que termine.
// Devuelve { enlace } de la publicación final.
export async function fbEsperarProcesado(/* publicacionId */) { throw new Error(NO_DISPONIBLE); }
