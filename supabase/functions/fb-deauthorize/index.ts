// ═══════════════════════════════════════════════════════════════════════════
// fb-deauthorize — aviso de Meta cuando alguien quita la app (verify_jwt = false).
//
// Meta no tiene la sesión de RETADOR: llama con POST (formulario) y el campo
// signed_request, firmado con HMAC-SHA256 y el App Secret. Sin firma válida no
// se toca nada. Con firma válida: tokens y Páginas borrados, conexión 'revoked'.
// La cuenta de RETADOR y el historial de publicaciones se conservan.
// ═══════════════════════════════════════════════════════════════════════════
import { PROVEEDOR, admin, auditar, responder, secretsFaltantes, verificarSignedRequest } from '../_shared/social.ts'

async function leerSignedRequest(req: Request): Promise<string> {
  const tipo = req.headers.get('content-type') ?? ''
  if (tipo.includes('application/json')) {
    const j = await req.json().catch(() => ({})) as { signed_request?: string }
    return String(j.signed_request ?? '')
  }
  const f = await req.formData().catch(() => null)
  return String(f?.get('signed_request') ?? '')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405)
  if (secretsFaltantes().length) return responder({ error: 'No configurado' }, 503)

  const fbUserId = await verificarSignedRequest(await leerSignedRequest(req))
  if (!fbUserId) return responder({ error: 'Solicitud no válida' }, 400)

  const { data: usuarios, error } = await admin.rpc('social_aplicar_evento_meta', {
    p_provider: PROVEEDOR, p_external_user_id: fbUserId, p_modo: 'desautorizar', p_confirmation_code: null,
  })
  if (error) {
    console.error('fb-deauthorize: no se pudo aplicar', error.message)
    return responder({ error: 'No se pudo procesar' }, 500)
  }
  for (const u of (usuarios as string[] | null) ?? []) await auditar(u, 'social_deauthorized', u, { origen: 'meta' })
  return responder({ ok: true })
})
