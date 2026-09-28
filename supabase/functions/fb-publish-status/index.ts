// ═══════════════════════════════════════════════════════════════════════════
// fb-publish-status — estado de una publicación de video (verify_jwt = true).
//
// POST { publicacion_id } → { status, permalink, reintentar_en }
//
// Solo el dueño consulta su publicación. El token se obtiene y descifra en el
// servidor. Frenos contra consultas infinitas:
//  · como máximo una consulta a Meta cada 5 s por publicación;
//  · 'reintentar_en' crece con la edad de la publicación (5 s → 15 s → 30 s);
//  · a los 60 min sin terminar, se da por fallida ('tiempo_agotado').
// Al terminar (publicada o fallida) se borra el video del bucket privado.
// ═══════════════════════════════════════════════════════════════════════════
import {
  BUCKET_VIDEOS, CORS, ErrorMeta, admin, auditar, describirError, grafo, limpiar,
  marcarConexionCaducada, responder, tokenDePagina, usuarioDeLaPeticion,
} from '../_shared/social.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAUSA_MIN_MS = 5_000
const LIMITE_MS = 60 * 60 * 1000

type Fase = { status?: string; errors?: { message?: string }[] }

function publico(p: Record<string, unknown>, reintentarEn: number | null = null) {
  return responder({
    ok: true,
    publicacion: {
      id: p.id, status: p.status, publication_type: p.publication_type, permalink: p.permalink ?? null,
      error_code: p.error_code ?? null,
    },
    reintentar_en: reintentarEn,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405)

  const usuario = await usuarioDeLaPeticion(req)
  if (!usuario) return responder({ error: 'Inicia sesión.' }, 401)
  const c = await req.json().catch(() => ({})) as { publicacion_id?: string }
  if (!UUID.test(String(c.publicacion_id))) return responder({ error: 'Publicación no válida.' }, 400)

  const { data: p } = await admin.from('social_publications').select('*')
    .eq('id', c.publicacion_id).eq('user_id', usuario.id).maybeSingle()
  if (!p) return responder({ error: 'No se encontró esa publicación.' }, 404)
  if (p.status === 'published' || p.status === 'failed') return publico(p)

  const edad = Date.now() - new Date(p.created_at).getTime()
  const reintentarEn = edad < 60_000 ? 5 : edad < 300_000 ? 15 : 30
  const terminar = async (campos: Record<string, unknown>, accion: string, detalles: Record<string, unknown> = {}) => {
    const { data: f } = await admin.from('social_publications').update(campos).eq('id', p.id).select('*').single()
    if (p.storage_path) await admin.storage.from(BUCKET_VIDEOS).remove([p.storage_path]).catch(() => {})
    await auditar(usuario.id, accion, p.id, detalles)
    return publico(f ?? { ...p, ...campos })
  }

  if (edad > LIMITE_MS) {
    return terminar({ status: 'failed', error_code: 'tiempo_agotado', error_message: 'Meta no terminó de procesar el video a tiempo.' },
      'social_publish_failed', { motivo: 'tiempo_agotado' })
  }
  if (!p.facebook_video_id) {
    // Todavía no llegó a Meta (la otra petición sigue en curso) o se cortó.
    if (edad > 10 * 60_000) {
      return terminar({ status: 'failed', error_code: 'sin_respuesta', error_message: 'La publicación no llegó a Meta.' },
        'social_publish_failed', { motivo: 'sin_respuesta' })
    }
    return publico(p, reintentarEn)
  }
  // Freno: no más de una consulta a Meta cada 5 s por publicación.
  if (Date.now() - new Date(p.updated_at).getTime() < PAUSA_MIN_MS) return publico(p, reintentarEn)

  try {
    if (!p.social_page_id) throw new ErrorMeta('token', 'sin_token', '', 'La Página fue desconectada')
    const credencial = await tokenDePagina(usuario.id, p.social_page_id)
    if (!credencial) throw new ErrorMeta('token', 'sin_token', '', 'La Página ya no tiene autorización')
    const v = await grafo('estado_video', String(p.facebook_video_id), {
      token: credencial.token, params: { fields: 'status,permalink_url' },
    })
    const st = (v.status ?? {}) as { video_status?: string; uploading_phase?: Fase; processing_phase?: Fase; publishing_phase?: Fase }
    const fases = [st.uploading_phase, st.processing_phase, st.publishing_phase]
    const conError = fases.find((f) => f?.status === 'error')
    if (st.video_status === 'error' || conError) {
      const msg = limpiar(conError?.errors?.[0]?.message ?? 'Meta no pudo procesar el video', 300)
      return terminar({ status: 'failed', error_code: 'procesado_meta', error_message: msg }, 'social_publish_failed', { motivo: 'procesado_meta' })
    }
    const publicado = st.video_status === 'ready' && (st.publishing_phase?.status ?? 'complete') === 'complete'
    if (publicado) {
      let permalink = typeof v.permalink_url === 'string' ? v.permalink_url : null
      if (permalink && permalink.startsWith('/')) permalink = `https://www.facebook.com${permalink}`
      return terminar({ status: 'published', permalink, published_at: new Date().toISOString() }, 'social_publish_completed', { tipo: p.publication_type })
    }
    // Sigue procesando: se registra la consulta (updated_at) para el freno.
    await admin.from('social_publications').update({ status: 'processing' }).eq('id', p.id)
    return publico({ ...p, status: 'processing' }, reintentarEn)
  } catch (e) {
    const det = describirError(e)
    console.error('fb-publish-status:', det)
    if (e instanceof ErrorMeta) await marcarConexionCaducada(usuario.id, e.codigo)
    const definitivo = e instanceof ErrorMeta && (e.codigo === '190' || e.codigo === 'sin_token' || e.codigo === '100')
    if (definitivo) {
      return terminar({ status: 'failed', error_code: String(det.codigo).slice(0, 50), error_message: det.mensaje },
        'social_meta_error', det)
    }
    // Error pasajero (red, límite de Meta): se reintenta más tarde, sin marcar fallo.
    await auditar(usuario.id, 'social_meta_error', p.id, det)
    return publico(p, 30)
  }
})
