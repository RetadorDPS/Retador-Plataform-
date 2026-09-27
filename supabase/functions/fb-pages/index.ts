// ═══════════════════════════════════════════════════════════════════════════
// fb-pages — Páginas conectadas (verify_jwt = true). Nunca devuelve tokens.
//
// POST { accion: 'listar' }                          → permiso, conexión y Páginas
// POST { accion: 'predeterminada', social_page_id }  → elige la Página por defecto
// POST { accion: 'desconectar' }                     → borra tokens y revoca en Meta
//
// Desconectar se permite SIEMPRE (aunque el plan ya no incluya Facebook): el
// usuario tiene que poder retirar su autorización en cualquier momento.
// ═══════════════════════════════════════════════════════════════════════════
import {
  CORS, PROVEEDOR, admin, auditar, permisoDePlan, responder, revocarEnMeta, secretsFaltantes,
  usuarioDeLaPeticion,
} from '../_shared/social.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405)

  const usuario = await usuarioDeLaPeticion(req)
  if (!usuario) return responder({ error: 'Inicia sesión.' }, 401)
  const cuerpo = await req.json().catch(() => ({})) as { accion?: string; social_page_id?: string }

  if (cuerpo.accion === 'listar' || !cuerpo.accion) {
    const permiso = await permisoDePlan(usuario.id)
    const { data: conexion } = await admin.from('social_connections')
      .select('status, external_name, scopes_granted, updated_at')
      .eq('user_id', usuario.id).eq('provider', PROVEEDOR).maybeSingle()
    const { data: paginas } = await admin.from('social_pages')
      .select('id, page_id, page_name, picture_url, is_default, status')
      .eq('user_id', usuario.id).eq('status', 'active').order('page_name')
    return responder({
      permitido: permiso.permitido, motivo: permiso.motivo ?? null,
      configurado: secretsFaltantes().length === 0,
      conexion: conexion ?? null, paginas: paginas ?? [],
    })
  }

  if (cuerpo.accion === 'predeterminada') {
    if (!UUID.test(String(cuerpo.social_page_id))) return responder({ error: 'Página no válida.' }, 400)
    const permiso = await permisoDePlan(usuario.id)
    if (!permiso.permitido) return responder({ error: 'Tu plan no incluye la conexión con Facebook.', motivo: permiso.motivo }, 403)
    const { data: ok, error } = await admin.rpc('social_elegir_predeterminada', {
      p_user: usuario.id, p_social_page_id: cuerpo.social_page_id,
    })
    if (error || !ok) return responder({ error: 'No se encontró esa Página entre las tuyas.' }, 404)
    await auditar(usuario.id, 'social_page_selected', String(cuerpo.social_page_id))
    return responder({ ok: true })
  }

  if (cuerpo.accion === 'desconectar') {
    const { data: externo, error } = await admin.rpc('social_desconectar', { p_user: usuario.id, p_provider: PROVEEDOR })
    if (error) return responder({ error: 'No se pudo desconectar. Vuelve a intentarlo.' }, 500)
    if (!externo) return responder({ ok: true, revocado_en_meta: false, sin_conexion: true })
    // Los tokens locales ya se borraron; la revocación en Meta es el paso extra
    // (si falla, lo local ya está limpio y se puede quitar la app desde Facebook).
    const revocado = secretsFaltantes().length === 0 ? await revocarEnMeta(String(externo)) : false
    await auditar(usuario.id, 'social_disconnect', usuario.id, { revocado_en_meta: revocado })
    return responder({ ok: true, revocado_en_meta: revocado })
  }

  return responder({ error: 'Acción no válida.' }, 400)
})
