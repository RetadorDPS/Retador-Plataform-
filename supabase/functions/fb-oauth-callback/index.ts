// ═══════════════════════════════════════════════════════════════════════════
// fb-oauth-callback — termina "Conectar Facebook" (verify_jwt = false).
//
// Lo llama la página estática https://retadormarketplace.es/redes-sociales/
// facebook/callback/ con POST {state, code | error}. Es público porque una PWA
// instalada puede volver al navegador SIN la sesión de Supabase; la seguridad
// depende del state: aleatorio, de un solo uso, guardado como hash y atado al
// usuario que lo creó. Si además llega una sesión válida, debe ser la misma.
//
// Orden: 1) consumir el state (atómico) ANTES de tocar el code; 2) cambiar el
// code por token en el servidor; 3) permisos y Páginas; 4) guardar SOLO las
// Páginas con CREATE_CONTENT, con su token cifrado; 5) responder solo datos
// públicos. El token de usuario de Facebook NO se guarda.
// ═══════════════════════════════════════════════════════════════════════════
import {
  CORS, ErrorMeta, PERMISOS, PROVEEDOR, TAREA_PUBLICAR, admin, auditar, cifrarToken, describirError,
  grafo, permisoDePlan, responder, secretsFaltantes, sha256Hex, tokenDesdeCodigo, usuarioDeLaPeticion,
} from '../_shared/social.ts'

const MAX_TANDAS_DE_PAGINAS = 10

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  // Solo POST: el code nunca viaja en la URL de esta función.
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405)

  const cuerpo = await req.json().catch(() => ({})) as { state?: string; code?: string; error?: string }
  const state = String(cuerpo.state ?? '')
  if (!/^[A-Za-z0-9_-]{43}$/.test(state)) {
    return responder({ ok: false, motivo: 'state_invalido', error: 'El enlace de conexión no es válido. Vuelve a intentarlo.' }, 400)
  }

  // 1) Consumo atómico: si ya se usó, caducó o no existe, no hay fila.
  const { data: filas, error: errState } = await admin.rpc('social_consumir_state', {
    p_state_hash: await sha256Hex(state), p_provider: PROVEEDOR,
  })
  const fila = Array.isArray(filas) ? filas[0] as { user_id: string; return_to: string } | undefined : undefined
  if (errState || !fila) {
    return responder({ ok: false, motivo: 'state_invalido', error: 'Este enlace ya se usó o caducó. Vuelve a conectar desde RETADOR.' }, 400)
  }
  const userId = fila.user_id
  const volverA = fila.return_to

  // Si hay sesión válida, debe ser la del dueño del state.
  const sesion = await usuarioDeLaPeticion(req)
  if (sesion && sesion.id !== userId) {
    await auditar(sesion.id, 'social_connect_failed', userId, { motivo: 'sesion_no_coincide' })
    return responder({ ok: false, motivo: 'sesion_no_coincide', return_to: volverA, error: 'Esta conexión se inició con otra cuenta de RETADOR.' }, 403)
  }

  // Cancelado en Meta (access_denied u otro): el state ya quedó consumido.
  if (cuerpo.error || !cuerpo.code) {
    await auditar(userId, 'social_connect_cancelled', userId, { motivo: String(cuerpo.error ?? 'sin_codigo').slice(0, 50) })
    return responder({ ok: false, motivo: 'cancelado', return_to: volverA, error: 'Conexión cancelada. No se guardó nada.' })
  }

  const faltan = secretsFaltantes()
  if (faltan.length) {
    console.error('fb-oauth-callback: faltan secrets', faltan)
    return responder({ ok: false, motivo: 'no_configurado', return_to: volverA, error: 'La conexión con Facebook todavía no está configurada.' }, 503)
  }

  const permiso = await permisoDePlan(userId)
  if (!permiso.permitido) {
    return responder({ ok: false, motivo: permiso.motivo ?? 'plan_no_permitido', return_to: volverA, error: 'Tu plan no incluye la conexión con Facebook.' }, 403)
  }

  try {
    // 2) Code → token corto → token largo (servidor a servidor).
    const tokenUsuario = await tokenDesdeCodigo(String(cuerpo.code))

    // 3) Identidad y permisos concedidos (el usuario puede desmarcar alguno).
    const yo = await grafo('perfil', 'me', { token: tokenUsuario, params: { fields: 'id,name' } })
    const permisos = await grafo('permisos', 'me/permissions', { token: tokenUsuario })
    const lista = (permisos.data as { permission: string; status: string }[] | undefined) ?? []
    const concedidos = lista.filter((p) => p.status === 'granted').map((p) => p.permission)
    const rechazados = lista.filter((p) => p.status !== 'granted').map((p) => p.permission)
    const sinConceder = PERMISOS.filter((p) => !concedidos.includes(p))
    if (sinConceder.length) {
      await auditar(userId, 'social_connect_failed', userId, { motivo: 'permisos_incompletos', faltan: sinConceder })
      return responder({
        ok: false, motivo: 'permisos_incompletos', faltan: sinConceder, return_to: volverA,
        error: 'Para publicar hace falta aceptar todos los permisos que pide RETADOR.',
      })
    }

    // Páginas que administra (con cursor propio: los enlaces "next" de Meta
    // llevan el token dentro de la URL y no se siguen).
    const paginas: Record<string, unknown>[] = []
    let despues = ''
    for (let i = 0; i < MAX_TANDAS_DE_PAGINAS; i++) {
      const params: Record<string, string> = { fields: 'id,name,tasks,access_token,picture{url}', limit: '100' }
      if (despues) params.after = despues
      const r = await grafo('paginas', 'me/accounts', { token: tokenUsuario, params })
      const tanda = (r.data as Record<string, unknown>[] | undefined) ?? []
      paginas.push(...tanda)
      const paging = r.paging as { cursors?: { after?: string }; next?: string } | undefined
      if (!paging?.next || !paging?.cursors?.after) break
      despues = paging.cursors.after
    }

    // 4) Solo Páginas donde puede publicar; su token se cifra aquí mismo.
    const paraGuardar = []
    for (const p of paginas) {
      const tareas = Array.isArray(p.tasks) ? (p.tasks as string[]) : []
      const pageId = String(p.id ?? '')
      const token = String(p.access_token ?? '')
      if (!tareas.includes(TAREA_PUBLICAR) || !/^[0-9]{1,32}$/.test(pageId) || !token) continue
      const foto = (p.picture as { data?: { url?: string } } | undefined)?.data?.url ?? null
      paraGuardar.push({
        page_id: pageId, page_name: String(p.name ?? 'Página').slice(0, 200), picture_url: foto,
        tasks: tareas, ...(await cifrarToken(token, userId, pageId)),
      })
    }

    const { data: publicas, error: errGuardar } = await admin.rpc('social_guardar_conexion', {
      p_user: userId, p_provider: PROVEEDOR, p_external_user_id: String(yo.id ?? ''),
      p_external_name: String(yo.name ?? ''), p_scopes_granted: concedidos, p_scopes_rejected: rechazados,
      p_data_access_expires_at: null, p_paginas: paraGuardar,
    })
    if (errGuardar) throw new Error(errGuardar.message)

    const lista2 = (publicas as { page_id: string }[]) ?? []
    await auditar(userId, 'social_connect_completed', userId, {
      paginas_publicables: lista2.length, paginas_recibidas: paginas.length, permisos: concedidos,
    })
    // 5) Solo datos públicos de las Páginas.
    return responder({ ok: true, return_to: volverA, paginas: publicas ?? [] })
  } catch (e) {
    const det = describirError(e)
    console.error('fb-oauth-callback:', det)
    await auditar(userId, e instanceof ErrorMeta ? 'social_meta_error' : 'social_connect_failed', userId, det)
    return responder({ ok: false, motivo: 'error_meta', return_to: volverA, error: 'Facebook no respondió como esperábamos. Vuelve a intentarlo.' }, 502)
  }
})
