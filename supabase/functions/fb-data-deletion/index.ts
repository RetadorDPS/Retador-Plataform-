// ═══════════════════════════════════════════════════════════════════════════
// fb-data-deletion — solicitud de eliminación de datos de Meta (verify_jwt = false).
//
// POST (Meta, formulario con signed_request firmado con el App Secret):
//   borra los datos sociales de esa cuenta de Facebook (tokens, Páginas,
//   publicaciones y conexión) SIN borrar la cuenta de RETADOR, y responde lo
//   que exige Meta: { url, confirmation_code }.
// GET ?codigo=... (página pública de estado): { status, created_at, completed_at }.
// ═══════════════════════════════════════════════════════════════════════════
import {
  CORS, ORIGEN_APP, PROVEEDOR, admin, aleatorioB64Url, auditar, responder, secretsFaltantes,
  verificarSignedRequest,
} from '../_shared/social.ts'

const PAGINA_ESTADO = `${ORIGEN_APP}/redes-sociales/facebook/eliminacion/`

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
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  if (req.method === 'GET') {
    const codigo = new URL(req.url).searchParams.get('codigo') ?? ''
    if (!/^[A-Za-z0-9_-]{20,64}$/.test(codigo)) return responder({ error: 'Código no válido' }, 400)
    const { data } = await admin.rpc('social_estado_eliminacion', { p_confirmation_code: codigo })
    if (!data) return responder({ error: 'No se encontró esa solicitud' }, 404)
    return responder({ ok: true, ...data })
  }

  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405)
  if (secretsFaltantes().length) return responder({ error: 'No configurado' }, 503)

  const fbUserId = await verificarSignedRequest(await leerSignedRequest(req))
  if (!fbUserId) return responder({ error: 'Solicitud no válida' }, 400)

  const codigo = aleatorioB64Url(24) // 32 caracteres, imposible de adivinar
  const { data: usuarios, error } = await admin.rpc('social_aplicar_evento_meta', {
    p_provider: PROVEEDOR, p_external_user_id: fbUserId, p_modo: 'borrar', p_confirmation_code: codigo,
  })
  if (error) {
    console.error('fb-data-deletion: no se pudo aplicar', error.message)
    return responder({ error: 'No se pudo procesar' }, 500)
  }
  for (const u of (usuarios as string[] | null) ?? []) await auditar(u, 'social_data_deleted', u, { origen: 'meta' })
  // Formato que exige Meta.
  return new Response(JSON.stringify({ url: `${PAGINA_ESTADO}?codigo=${codigo}`, confirmation_code: codigo }), {
    status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
})
