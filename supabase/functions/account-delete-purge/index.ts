import { createClient } from 'npm:@supabase/supabase-js@2'
import { PROVEEDOR, auditar, revocarEnMetaDetalle } from '../_shared/social.ts'

// ═══════════════════════════════════════════════════════════════════════════
// BORRADO DEFINITIVO DE CUENTAS (v240)
// La llama SOLO la tarea diaria de pg_cron (public.run_account_purge) con un
// secreto aleatorio que vive en el Vault de Supabase (no en el código). Sin ese
// secreto responde 401. verify_jwt=false a propósito: quien llama es la base
// de datos, no un usuario con sesión.
//
// Para cada cuenta pendiente cuyo plazo de 30 días ya pasó:
//   0) [redes sociales] revoca en Meta la autorización de Facebook. Si Meta
//      falla, la cuenta se pospone al día siguiente; tras MAX_INTENTOS fallos
//      se sigue igual con el borrado local (nunca queda bloqueada para siempre).
//      Lo ya publicado en Facebook no se borra.
//   1) borra sus archivos de Storage con la API (desde SQL está bloqueado):
//      avatars, kyc, product-images, voice-notes, social-videos (carpeta = id
//      del usuario) y las páginas share-cache de su perfil y sus productos;
//   2) llama a purge_account_data(): pedidos anonimizados, productos,
//      tienda, mensajes, datos personales, datos sociales y la cuenta de Auth.
// Si algo falla, la cuenta sigue pendiente y se reintenta al día siguiente.
// ═══════════════════════════════════════════════════════════════════════════

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const MAX_INTENTOS_REVOCACION = 3

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

// Devuelve true si se puede seguir con el borrado de esta cuenta.
async function revocarFacebook(uid: string): Promise<{ seguir: boolean; detalle: Record<string, unknown> }> {
  const { data: conexiones } = await supabase.from('social_connections')
    .select('external_user_id').eq('user_id', uid).eq('provider', PROVEEDOR).in('status', ['active', 'expired'])
  if (!conexiones?.length) return { seguir: true, detalle: { facebook: 'sin_conexion' } }
  const fallos: string[] = []
  for (const c of conexiones) {
    const r = await revocarEnMetaDetalle(String(c.external_user_id))
    if (!r.ok) fallos.push(r.codigo)
  }
  if (!fallos.length) {
    await auditar(uid, 'social_revoked_on_account_delete', uid, {})
    return { seguir: true, detalle: { facebook: 'revocado' } }
  }
  const { data: intentos } = await supabase.rpc('social_registrar_intento_revocacion', { p_user: uid, p_error_code: fallos[0] })
  const n = Number(intentos ?? MAX_INTENTOS_REVOCACION)
  await auditar(uid, 'social_revoke_failed', uid, { intento: n, codigo: fallos[0] })
  if (n >= MAX_INTENTOS_REVOCACION) {
    await auditar(uid, 'social_revoke_given_up', uid, { intentos: n })
    return { seguir: true, detalle: { facebook: 'revocacion_fallida_se_continua', intentos: n } }
  }
  return { seguir: false, detalle: { facebook: 'revocacion_pospuesta', intentos: n } }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'método no permitido' }, 405)
  const { data: ok } = await supabase.rpc('account_purge_secret_ok', { p: req.headers.get('x-purge-secret') ?? '' })
  if (ok !== true) return json({ error: 'no autorizado' }, 401)

  const { data: vencidas, error } = await supabase.from('account_deletions')
    .select('user_id, scheduled_for').eq('status', 'pendiente').lte('scheduled_for', new Date().toISOString())
  if (error) return json({ error: error.message }, 500)

  const resultados: Record<string, unknown>[] = []
  for (const fila of vencidas ?? []) {
    const uid = String(fila.user_id)
    try {
      // 0) Facebook: revocar en Meta antes de borrar lo local.
      const fb = await revocarFacebook(uid)
      if (!fb.seguir) { resultados.push({ user_id: uid, pospuesta: true, ...fb.detalle }); continue }
      // 1) Archivos
      const { data: archivos, error: errA } = await supabase.rpc('account_purge_files', { p_uid: uid })
      if (errA) throw new Error('lista de archivos: ' + errA.message)
      const porBucket = new Map<string, string[]>()
      for (const a of (archivos ?? []) as { bucket: string; path: string }[]) {
        if (!porBucket.has(a.bucket)) porBucket.set(a.bucket, [])
        porBucket.get(a.bucket)!.push(a.path)
      }
      let borrados = 0
      for (const [bucket, rutas] of porBucket) {
        for (let i = 0; i < rutas.length; i += 100) {
          const { data: r, error: errS } = await supabase.storage.from(bucket).remove(rutas.slice(i, i + 100))
          if (errS) throw new Error(`storage ${bucket}: ${errS.message}`)
          borrados += r?.length ?? 0
        }
      }
      // 2) Datos y cuenta de acceso
      const { data: res, error: errD } = await supabase.rpc('purge_account_data', { p_uid: uid })
      if (errD) throw new Error('datos: ' + errD.message)
      resultados.push({ user_id: uid, archivos_borrados: borrados, datos: res, ...fb.detalle })
    } catch (e) {
      console.error('account-delete-purge', uid, e)
      resultados.push({ user_id: uid, error: String((e as Error)?.message ?? e) })
    }
  }
  return json({ ok: true, procesadas: resultados.length, resultados })
})
