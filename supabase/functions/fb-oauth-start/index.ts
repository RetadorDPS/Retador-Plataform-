// ═══════════════════════════════════════════════════════════════════════════
// fb-oauth-start — inicia "Conectar Facebook" (verify_jwt = true).
//
// 1) Exige sesión real de RETADOR (Google). 2) Comprueba el plan en la base.
// 3) Crea un state aleatorio de 32 bytes y guarda SOLO su hash (10 min, un
// solo uso, máximo 5 pendientes). 4) Devuelve la URL del diálogo de Meta.
// El navegador nunca recibe secretos: solo esa URL.
//
// Facebook Login for Business: los permisos los define la configuración de
// inicio de sesión "Retador" en Meta (FACEBOOK_LOGIN_CONFIG_ID). Por eso el
// diálogo se abre con config_id y SIN scope; el code se sigue cambiando por
// token en el servidor (response_type=code).
// ═══════════════════════════════════════════════════════════════════════════
import {
  CORS, GRAPH_VERSION, PROVEEDOR, REDIRECT_URI, admin, aleatorioB64Url, appId,
  auditar, permisoDePlan, responder, secretsFaltantes, sha256Hex, usuarioDeLaPeticion,
} from '../_shared/social.ts'

const DESTINOS = ['ajustes', 'herramienta-video', 'producto']
// Id de la configuración de Facebook Login for Business (no es secreto, pero se
// guarda como Secret de Supabase para poder cambiarlo sin tocar el código).
const LOGIN_CONFIG_ID = Deno.env.get('FACEBOOK_LOGIN_CONFIG_ID') ?? ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405)

  const usuario = await usuarioDeLaPeticion(req)
  if (!usuario) return responder({ error: 'Inicia sesión para conectar Facebook.' }, 401)

  const faltan = secretsFaltantes()
  if (!/^[0-9]{5,32}$/.test(LOGIN_CONFIG_ID)) faltan.push('FACEBOOK_LOGIN_CONFIG_ID')
  if (faltan.length) {
    console.error('fb-oauth-start: faltan secrets', faltan)
    return responder({ error: 'La conexión con Facebook todavía no está configurada.', motivo: 'no_configurado' }, 503)
  }

  const permiso = await permisoDePlan(usuario.id)
  if (!permiso.permitido) {
    return responder({ error: 'Tu plan no incluye la conexión con Facebook.', motivo: permiso.motivo ?? 'plan_no_permitido' }, 403)
  }

  const cuerpo = await req.json().catch(() => ({})) as { return_to?: string; reconectar?: boolean }
  const destino = DESTINOS.includes(String(cuerpo.return_to)) ? String(cuerpo.return_to) : 'ajustes'

  const state = aleatorioB64Url(32)
  const { error } = await admin.rpc('social_crear_state', {
    p_user: usuario.id, p_provider: PROVEEDOR, p_state_hash: await sha256Hex(state), p_return_to: destino,
  })
  if (error) {
    const demasiados = /demasiados_intentos/.test(error.message)
    return responder({
      error: demasiados ? 'Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.' : 'No se pudo iniciar la conexión.',
      motivo: demasiados ? 'demasiados_intentos' : 'error_interno',
    }, demasiados ? 429 : 500)
  }

  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`)
  url.searchParams.set('client_id', appId())
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('state', state)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('config_id', LOGIN_CONFIG_ID)
  if (cuerpo.reconectar) url.searchParams.set('auth_type', 'rerequest')

  await auditar(usuario.id, 'social_connect_start', usuario.id, { destino, reconectar: !!cuerpo.reconectar })
  return responder({ url: url.toString() })
})
