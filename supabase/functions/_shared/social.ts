// ═══════════════════════════════════════════════════════════════════════════
// INTEGRACIÓN CON REDES SOCIALES — módulo común de las Edge Functions fb-*.
//
// Reglas que este módulo hace cumplir:
//  · Los tokens de Meta nunca salen de aquí: ni en respuestas, ni en registros,
//    ni en la URL de una petición (van en la cabecera Authorization).
//  · Todo texto de error pasa por limpiar() antes de registrarse o guardarse.
//  · Los tokens de Página se guardan cifrados con AES-256-GCM (llave en el
//    Secret SOCIAL_TOKEN_KEY, nunca en la base ni en el código).
//  · La autorización por plan la decide SIEMPRE la base (social_plan_permite).
// ═══════════════════════════════════════════════════════════════════════════
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const PROVEEDOR = 'facebook'
export const ORIGEN_APP = 'https://retadormarketplace.es'
export const REDIRECT_URI = Deno.env.get('FACEBOOK_REDIRECT_URI') ??
  'https://retadormarketplace.es/redes-sociales/facebook/callback/'
export const GRAPH_VERSION = Deno.env.get('FACEBOOK_GRAPH_VERSION') ?? 'v25.0'
// Solo los permisos acordados. Nada de business_management ni read_insights.
export const PERMISOS = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts']
export const TAREA_PUBLICAR = 'CREATE_CONTENT'
export const VERSION_LLAVE = 1

const APP_ID = Deno.env.get('FACEBOOK_APP_ID') ?? ''
const APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') ?? ''
const LLAVE_B64 = Deno.env.get('SOCIAL_TOKEN_KEY') ?? ''

export const admin: SupabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ── Respuestas ───────────────────────────────────────────────────────────────
export const CORS = {
  'Access-Control-Allow-Origin': ORIGEN_APP,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Vary': 'Origin',
}

export function responder(cuerpo: Record<string, unknown>, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  })
}

// ── Configuración ────────────────────────────────────────────────────────────
// Devuelve la lista de NOMBRES de secrets que faltan (nunca sus valores).
export function secretsFaltantes(): string[] {
  const faltan: string[] = []
  if (!APP_ID) faltan.push('FACEBOOK_APP_ID')
  if (!APP_SECRET) faltan.push('FACEBOOK_APP_SECRET')
  if (!LLAVE_B64) faltan.push('SOCIAL_TOKEN_KEY')
  return faltan
}
export const appId = () => APP_ID

// ── Limpieza de textos (registros, errores guardados) ────────────────────────
// Borra cualquier cosa con forma de token o credencial antes de registrarla.
export function limpiar(texto: unknown, max = 300): string {
  let s = String(texto ?? '')
  if (APP_SECRET) s = s.split(APP_SECRET).join('[oculto]')
  if (LLAVE_B64) s = s.split(LLAVE_B64).join('[oculto]')
  s = s
    .replace(/EAA[A-Za-z0-9]{10,}/g, '[token]')
    .replace(/(access_token|client_secret|appsecret_proof|fb_exchange_token|input_token|code|state)=[^&\s"']+/gi, '$1=[oculto]')
    .replace(/(Bearer|OAuth)\s+[A-Za-z0-9._|-]{10,}/g, '$1 [oculto]')
  return s.slice(0, max)
}

// ── Utilidades de bytes ──────────────────────────────────────────────────────
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const desdeB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
export function aleatorioB64Url(nBytes = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(nBytes))
  return b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export async function sha256Hex(texto: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
async function hmacSha256Hex(llave: string, texto: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(llave),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const firma = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(texto))
  return Array.from(new Uint8Array(firma)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ── Cifrado AES-256-GCM de tokens ────────────────────────────────────────────
// Los datos asociados (AAD) atan el cifrado a su dueño y a su Página: un token
// copiado a otra fila no se puede descifrar.
let llaveCache: CryptoKey | null = null
async function llave(): Promise<CryptoKey> {
  if (llaveCache) return llaveCache
  const cruda = desdeB64(LLAVE_B64)
  if (cruda.length !== 32) throw new Error('SOCIAL_TOKEN_KEY debe ser de 32 bytes en base64')
  llaveCache = await crypto.subtle.importKey('raw', cruda, 'AES-GCM', false, ['encrypt', 'decrypt'])
  return llaveCache
}
const aad = (userId: string, pageId: string) => new TextEncoder().encode(`${userId}:${pageId}`)

export async function cifrarToken(token: string, userId: string, pageId: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(userId, pageId) },
    await llave(), new TextEncoder().encode(token))
  return { token_ciphertext: b64(new Uint8Array(c)), token_iv: b64(iv), key_version: VERSION_LLAVE }
}

export async function descifrarToken(
  fila: { token_ciphertext: string; token_iv: string; key_version: number }, userId: string, pageId: string,
): Promise<string> {
  if (fila.key_version !== VERSION_LLAVE) throw new Error('version_de_llave_desconocida')
  const claro = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: desdeB64(fila.token_iv), additionalData: aad(userId, pageId) },
    await llave(), desdeB64(fila.token_ciphertext))
  return new TextDecoder().decode(claro)
}

// ── Cliente de Meta (Graph API) ──────────────────────────────────────────────
export class ErrorMeta extends Error {
  constructor(public etapa: string, public codigo: string, public subcodigo: string, mensaje: string) {
    super(mensaje)
  }
}

// El token va en la cabecera Authorization, nunca en la URL. appsecret_proof
// permite activar "Require App Secret" en Meta: un token robado no sirve sin él.
export async function grafo(
  etapa: string, ruta: string,
  { metodo = 'GET', token, params = {}, cuerpo }: {
    metodo?: string; token?: string; params?: Record<string, string>; cuerpo?: Record<string, string>
  } = {},
): Promise<Record<string, unknown>> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${ruta.replace(/^\//, '')}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    url.searchParams.set('appsecret_proof', await hmacSha256Hex(APP_SECRET, token))
  }
  let init: RequestInit = { method: metodo, headers }
  if (cuerpo) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    init = { ...init, body: new URLSearchParams(cuerpo).toString() }
  }
  let res: Response
  try {
    res = await fetch(url.toString(), init)
  } catch (_e) {
    // El mensaje de fetch puede contener la URL completa: nunca se propaga.
    throw new ErrorMeta(etapa, 'red', '', 'No se pudo contactar con Meta')
  }
  const json = await res.json().catch(() => null) as Record<string, unknown> | null
  const err = json?.error as Record<string, unknown> | undefined
  if (!res.ok || !json || err) {
    throw new ErrorMeta(etapa, String(err?.code ?? res.status), String(err?.error_subcode ?? ''),
      limpiar(err?.message ?? `HTTP ${res.status}`))
  }
  return json
}

// Intercambio del code por token: requiere el App Secret, así que se hace aquí.
export async function tokenDesdeCodigo(codigo: string): Promise<string> {
  const corto = await grafo('intercambio_codigo', 'oauth/access_token', {
    params: { client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: REDIRECT_URI, code: codigo },
  })
  const largo = await grafo('token_largo', 'oauth/access_token', {
    params: {
      grant_type: 'fb_exchange_token', client_id: APP_ID, client_secret: APP_SECRET,
      fb_exchange_token: String(corto.access_token ?? ''),
    },
  })
  const t = String(largo.access_token ?? '')
  if (!t) throw new ErrorMeta('token_largo', 'sin_token', '', 'Meta no devolvió token')
  return t
}

// Revoca la autorización de la app para ese usuario de Facebook (token de app).
export async function revocarEnMeta(externalUserId: string): Promise<boolean> {
  try {
    await grafo('revocar', `${externalUserId}/permissions`, { metodo: 'DELETE', token: `${APP_ID}|${APP_SECRET}` })
    return true
  } catch (_e) {
    return false
  }
}

// ── Sesión, plan y auditoría ─────────────────────────────────────────────────
export async function usuarioDeLaPeticion(req: Request): Promise<{ id: string } | null> {
  const cab = req.headers.get('Authorization') ?? ''
  const jwt = cab.startsWith('Bearer ') ? cab.slice(7) : ''
  if (!jwt || jwt.split('.').length !== 3) return null
  const { data, error } = await admin.auth.getUser(jwt)
  if (error || !data?.user) return null
  return { id: data.user.id }
}

export async function permisoDePlan(userId: string): Promise<{ permitido: boolean; motivo?: string; plan?: string }> {
  const { data, error } = await admin.rpc('social_plan_permite', { p_user: userId, p_provider: PROVEEDOR })
  if (error || !data) return { permitido: false, motivo: 'error_verificando_plan' }
  return data as { permitido: boolean; motivo?: string; plan?: string }
}

// Registro en audit_log (el mismo de toda la app). Nunca bloquea la acción y
// nunca recibe tokens: los detalles se limpian antes de guardarse.
function limpiarValor(v: unknown, prof = 0): unknown {
  if (prof > 4) return '[omitido]'
  if (typeof v === 'string') return limpiar(v, 300)
  if (Array.isArray(v)) return v.slice(0, 50).map((x) => limpiarValor(x, prof + 1))
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v)) {
      if (/token|secret|code|state|proof/i.test(k)) continue // campos sensibles: ni se guardan
      out[k] = limpiarValor(x, prof + 1)
    }
    return out
  }
  return v
}

export async function auditar(actor: string | null, accion: string, objetivo: string | null, detalles: Record<string, unknown> = {}) {
  try {
    const limpio = limpiarValor(detalles)
    await admin.from('audit_log').insert({
      actor_id: actor, action: accion, target_type: 'social_facebook', target_id: objetivo, details: limpio,
    })
  } catch (_e) {
    // La auditoría nunca debe tumbar la acción principal.
  }
}

// Mensajes cortos y seguros para registrar un error sin datos sensibles.
export function describirError(e: unknown): Record<string, string> {
  if (e instanceof ErrorMeta) return { etapa: e.etapa, codigo: e.codigo, subcodigo: e.subcodigo, mensaje: limpiar(e.message, 200) }
  return { etapa: 'interno', mensaje: limpiar((e as Error)?.message ?? e, 200) }
}
