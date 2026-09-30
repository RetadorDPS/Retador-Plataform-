// ═══════════════════════════════════════════════════════════════════════════
// fb-publish — publica en una Página de Facebook (verify_jwt = true).
//
// POST { social_page_id, tipo: 'link'|'photo'|'photos'|'video'|'reel', idempotency_key,
//        product_id?, mensaje?, storage_path?, foto_indice?, foto_esperada?,
//        fotos?: [{ product_id, foto_indice, foto_esperada? }] }
//
// 'photo': foto_indice es la posición dentro de products.images (0 si no llega).
// La URL SIEMPRE sale del registro del producto; foto_esperada (opcional) solo
// se compara con ella para detectar que el orden de fotos cambió.
// 'photos': UNA publicación con varias fotos (de uno o varios productos propios).
// Cada foto se valida igual que 'photo'. Se reserva UNA sola publicación (una
// clave de idempotencia, cuenta 1 en el límite por hora, product_id nulo para
// no bloquear por producto); Meta descarga cada foto como no publicada y después
// se crea un único post en el feed con attached_media.
//
// Orden de comprobaciones (todas en el servidor):
//  1) sesión; 2) plan central (Gratis y Empresas no, Pro y Premium sí; ni
//  suspendidos ni con borrado pendiente); 3) datos: producto propio, activo,
//  sin archivar y aprobado por moderación, y su enlace público de RETADOR
//  respondiendo 200 (link) o su foto elegida (photo), o video propio en el bucket
//  privado (ruta, extensión, tipo, tamaño y existencia); 4) reserva atómica
//  en la base: dueño de la Página, Página activa con CREATE_CONTENT,
//  idempotencia y límite de 5 por hora; 5) token descifrado SOLO aquí;
//  6) llamada a Meta con appsecret_proof; 7) resultado en social_publications.
//
// Los videos no se publican al instante: quedan 'processing' y fb-publish-status
// consulta a Meta hasta 'published' o 'failed'. Nunca se devuelve un token.
// ═══════════════════════════════════════════════════════════════════════════
import {
  BUCKET_VIDEOS, CORS, ErrorMeta, GRAPH_VERSION, TAM_MAX_VIDEO, admin, auditar, describirError,
  enlaceProducto, grafo, limpiar, marcarConexionCaducada, permisoDePlan, responder,
  secretsFaltantes, tokenDePagina, usuarioDeLaPeticion,
} from '../_shared/social.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TIPOS = ['link', 'photo', 'photos', 'video', 'reel']
// Máximo de fotos por publicación. Prudente a propósito: Meta no publica una cifra
// clara. Para cambiarlo, cambiar también FB_FOTOS_MAX en facebook.js.
const FOTOS_MAX = 6
const DURACION_URL_FIRMADA = 2 * 60 * 60 // 2 h: Meta descarga el video de forma asíncrona
const FOTO_INDICE_MAX = 199
const URL_FOTO_MAX = 2000

const MOTIVOS: Record<string, [number, string]> = {
  limite_por_hora: [429, 'Llegaste al límite de 5 publicaciones por hora en esta Página. Inténtalo más tarde.'],
  publicacion_en_curso: [409, 'Ya hay una publicación de este producto en curso en esta Página.'],
  pagina_no_disponible: [404, 'Esa Página no está conectada o ya no permite publicar. Vuelve a conectar Facebook.'],
  producto_no_disponible: [404, 'Ese producto no está publicado o no es tuyo.'],
  archivo_no_permitido: [403, 'Ese video no te pertenece.'],
  plan_no_permitido: [403, 'Tu plan no incluye publicar en Facebook.'],
  cuenta_suspendida: [403, 'Tu cuenta está suspendida.'],
  eliminacion_pendiente: [403, 'Tu cuenta tiene una eliminación pendiente.'],
}

// Texto del usuario: sin caracteres de control (salvo saltos de línea), máx. 5000.
const limpiarMensaje = (s: unknown) =>
  String(s ?? '').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').slice(0, 5000).trim()

// URL de la foto número `indice` de products.images, o la respuesta de error.
// La URL sale SOLO de la base; foto_esperada solo detecta que el orden cambió.
function fotoDeProducto(images: unknown, indice: number, esperada: string | null, indiceDado: boolean): string | Response {
  const fotos: unknown[] = Array.isArray(images) ? images : []
  if (indice >= fotos.length) {
    return indiceDado
      ? responder({ ok: false, motivo: 'foto_no_disponible', error: 'Esa foto ya no está en el producto. Vuelve a elegirla.' }, 400)
      : responder({ ok: false, motivo: 'sin_imagen', error: 'Este producto no tiene una foto publicable.' }, 400)
  }
  const bruta = fotos[indice]
  const img = typeof bruta === 'string' ? bruta.trim() : ''
  if (!/^https:\/\//.test(img) || img.length > URL_FOTO_MAX) {
    return responder({ ok: false, motivo: 'sin_imagen', error: 'Esa foto del producto no se puede publicar.' }, 400)
  }
  if (esperada !== null && esperada !== img) {
    return responder({ ok: false, motivo: 'foto_cambiada', error: 'Las fotos del producto cambiaron. Vuelve a elegir la foto.' }, 409)
  }
  return img
}

function rechazo(motivo: string, extra: Record<string, unknown> = {}): Response {
  const [estado, texto] = MOTIVOS[motivo] ?? [400, 'No se pudo publicar.']
  return responder({ ok: false, motivo, error: texto, ...extra }, estado)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405)

  const usuario = await usuarioDeLaPeticion(req)
  if (!usuario) return responder({ error: 'Inicia sesión.' }, 401)
  if (secretsFaltantes().length) {
    return responder({ ok: false, motivo: 'no_configurado', error: 'La publicación en Facebook todavía no está configurada.' }, 503)
  }

  const c = await req.json().catch(() => ({})) as Record<string, unknown>
  const socialPageId = String(c.social_page_id ?? '')
  const tipo = String(c.tipo ?? '')
  const clave = String(c.idempotency_key ?? '')
  const productId = c.product_id ? String(c.product_id) : null
  const storagePath = c.storage_path ? String(c.storage_path) : null
  const mensaje = limpiarMensaje(c.mensaje)
  if (!UUID.test(socialPageId) || !UUID.test(clave) || !TIPOS.includes(tipo) || (productId && !UUID.test(productId))) {
    return responder({ ok: false, motivo: 'datos_invalidos', error: 'Datos de publicación no válidos.' }, 400)
  }

  // Foto elegida (solo 'photo'; en los demás tipos se ignora). Sin foto_indice
  // se usa la primera, como hasta ahora. Solo enteros reales: "2" no vale.
  const fotoIndiceDado = tipo === 'photo' && c.foto_indice !== undefined && c.foto_indice !== null
  const fotoIndice = fotoIndiceDado ? c.foto_indice : 0
  const fotoEsperada = tipo === 'photo' && c.foto_esperada !== undefined && c.foto_esperada !== null ? c.foto_esperada : null
  if (!Number.isInteger(fotoIndice) || (fotoIndice as number) < 0 || (fotoIndice as number) > FOTO_INDICE_MAX ||
      (fotoEsperada !== null && (typeof fotoEsperada !== 'string' || fotoEsperada.length > URL_FOTO_MAX))) {
    return responder({ ok: false, motivo: 'datos_invalidos', error: 'Datos de publicación no válidos.' }, 400)
  }

  // Varias fotos: lista de { product_id, foto_indice, foto_esperada? }, sin repetidas.
  let lista: { productId: string; indice: number; esperada: string | null }[] = []
  if (tipo === 'photos') {
    const bruta = Array.isArray(c.fotos) ? c.fotos : null
    // Sin product_id ni storage_path sueltos: los productos van dentro de la lista.
    if (productId || storagePath) return responder({ ok: false, motivo: 'datos_invalidos', error: 'Datos de publicación no válidos.' }, 400)
    if (!bruta || bruta.length < 2 || bruta.length > FOTOS_MAX) {
      return responder({ ok: false, motivo: 'datos_invalidos', error: `Elige entre 2 y ${FOTOS_MAX} fotos.` }, 400)
    }
    const vistas = new Set<string>()
    for (const f of bruta as Record<string, unknown>[]) {
      const pid = String(f?.product_id ?? '')
      const ind = f?.foto_indice
      const esp = f?.foto_esperada === undefined || f?.foto_esperada === null ? null : f.foto_esperada
      if (!UUID.test(pid) || !Number.isInteger(ind) || (ind as number) < 0 || (ind as number) > FOTO_INDICE_MAX ||
          (esp !== null && (typeof esp !== 'string' || esp.length > URL_FOTO_MAX)) || vistas.has(`${pid}:${ind}`)) {
        return responder({ ok: false, motivo: 'datos_invalidos', error: 'Datos de publicación no válidos.' }, 400)
      }
      vistas.add(`${pid}:${ind}`)
      lista.push({ productId: pid, indice: ind as number, esperada: esp as string | null })
    }
  }

  const permiso = await permisoDePlan(usuario.id)
  if (!permiso.permitido) return rechazo(permiso.motivo ?? 'plan_no_permitido')

  // ── Datos de lo que se publica (antes de reservar: un rechazo aquí no gasta cupo)
  let enlace = '', imagen = ''
  const imagenes: string[] = []   // 'photos': URLs sacadas de la base, en el orden elegido
  if (tipo === 'link' || tipo === 'photo') {
    if (!productId) return responder({ ok: false, motivo: 'falta_producto', error: 'Elige un producto.' }, 400)
    const { data: p } = await admin.from('products').select('id, seller_id, status, archived_at, moderation_status, images')
      .eq('id', productId).maybeSingle()
    // Publicado de verdad: propio, activo, sin archivar (archivar NO cambia
    // status) y aprobado por moderación. Misma regla que usa la app.
    if (!p || p.seller_id !== usuario.id || p.status !== 'active' || p.archived_at !== null ||
        p.moderation_status !== 'approved') return rechazo('producto_no_disponible')
    if (tipo === 'link') {
      // Enlace público real de RETADOR (el de shareLink). Las páginas de vista
      // previa se regeneran cada 20 min: si aún no existe, no se publica un
      // enlace roto (Facebook guardaría la vista previa rota).
      enlace = enlaceProducto(productId)
      const ok = await fetch(enlace, { method: 'GET', redirect: 'manual' })
        .then((r) => { r.body?.cancel(); return r.status === 200 }).catch(() => false)
      if (!ok) {
        return responder({ ok: false, motivo: 'enlace_no_disponible', error: 'La página pública de este producto todavía no está lista. Prueba en unos minutos.' }, 409)
      }
    } else {
      const r = fotoDeProducto(p.images, fotoIndice as number, fotoEsperada as string | null, fotoIndiceDado)
      if (r instanceof Response) return r
      imagen = r
    }
  } else if (tipo === 'photos') {
    // Todos los productos en UNA consulta; cada foto con las mismas reglas que 'photo'.
    const ids = [...new Set(lista.map((f) => f.productId))]
    const { data: filas } = await admin.from('products').select('id, seller_id, status, archived_at, moderation_status, images')
      .in('id', ids)
    const porId = new Map((filas ?? []).map((p: Record<string, unknown>) => [String(p.id), p]))
    for (const f of lista) {
      const p = porId.get(f.productId) as Record<string, unknown> | undefined
      if (!p || p.seller_id !== usuario.id || p.status !== 'active' || p.archived_at !== null ||
          p.moderation_status !== 'approved') return rechazo('producto_no_disponible')
      const r = fotoDeProducto(p.images, f.indice, f.esperada, true)
      if (r instanceof Response) return r
      imagenes.push(r)
    }
  } else {
    // Video: solo de la carpeta del propio usuario en el bucket privado.
    const re = new RegExp(`^${usuario.id}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.mp4$`)
    if (!storagePath || !re.test(storagePath)) return rechazo('archivo_no_permitido')
    const nombre = storagePath.split('/')[1]
    const { data: lista } = await admin.storage.from(BUCKET_VIDEOS).list(usuario.id, { search: nombre, limit: 5 })
    const obj = (lista ?? []).find((o: { name: string }) => o.name === nombre) as
      { name: string; metadata?: { size?: number; mimetype?: string } } | undefined
    const tam = Number(obj?.metadata?.size ?? 0)
    if (!obj) return responder({ ok: false, motivo: 'video_no_encontrado', error: 'No se encontró el video subido.' }, 404)
    if (obj.metadata?.mimetype !== 'video/mp4' || tam <= 0 || tam > TAM_MAX_VIDEO) {
      return responder({ ok: false, motivo: 'video_no_valido', error: 'El video debe ser MP4 de hasta 50 MB.' }, 400)
    }
  }

  // ── Reserva atómica: dueño, Página, idempotencia y límite de 5/hora
  const { data: reserva, error: errReserva } = await admin.rpc('social_reservar_publicacion', {
    p_user: usuario.id, p_social_page_id: socialPageId, p_product_id: productId, p_type: tipo,
    p_idempotency_key: clave, p_message: mensaje || null, p_storage_path: storagePath,
  })
  if (errReserva || !reserva) return responder({ ok: false, motivo: 'error_interno', error: 'No se pudo registrar la publicación.' }, 500)
  if (!reserva.ok) return rechazo(reserva.motivo, reserva.reintentar_despues ? { reintentar_despues: reserva.reintentar_despues } : {})
  if (reserva.reutilizada) return responder({ ok: true, reutilizada: true, publicacion: reserva.publicacion })

  const pubId = String(reserva.publicacion.id)
  const actualizar = (campos: Record<string, unknown>) => admin.from('social_publications').update(campos).eq('id', pubId)
  if (tipo === 'photos') {
    await actualizar({ media: lista.map((f) => ({ product_id: f.productId, foto_indice: f.indice })) })
  }
  await auditar(usuario.id, 'social_publish_started', pubId, {
    tipo, pagina: socialPageId,
    ...(tipo === 'photo' ? { foto_indice: fotoIndice } : {}), ...(tipo === 'photos' ? { fotos: lista.length } : {}),
  })

  try {
    const credencial = await tokenDePagina(usuario.id, socialPageId)
    if (!credencial) throw new ErrorMeta('token', 'sin_token', '', 'La Página ya no tiene autorización')
    const { token, pageId } = credencial

    if (tipo === 'link' || tipo === 'photo') {
      const r = tipo === 'link'
        ? await grafo('publicar_enlace', `${pageId}/feed`, { metodo: 'POST', token, cuerpo: { message: mensaje, link: enlace } })
        : await grafo('publicar_foto', `${pageId}/photos`, { metodo: 'POST', token, cuerpo: { url: imagen, caption: mensaje, published: 'true' } })
      const postId = String(r.post_id ?? r.id ?? '')
      let permalink: string | null = null
      try {
        const d = await grafo('permalink', postId, { token, params: { fields: 'permalink_url' } })
        permalink = typeof d.permalink_url === 'string' ? d.permalink_url : null
      } catch (_e) { /* el enlace es opcional: la publicación ya existe */ }
      await actualizar({ status: 'published', facebook_post_id: postId.slice(0, 100), permalink, published_at: new Date().toISOString() })
      await auditar(usuario.id, 'social_publish_completed', pubId, { tipo })
      return responder({ ok: true, publicacion: { id: pubId, status: 'published', permalink } })
    }

    if (tipo === 'photos') {
      // 1) Meta descarga cada foto (de la base) como NO publicada; 2) un único post
      // en el feed las adjunta. Si algo falla a mitad, se borran las ya subidas.
      const subidas: string[] = []
      try {
        for (const url of imagenes) {
          const f = await grafo('foto_sin_publicar', `${pageId}/photos`, { metodo: 'POST', token, cuerpo: { url, published: 'false' } })
          const id = String(f.id ?? '')
          if (!/^[0-9]{1,32}$/.test(id)) throw new ErrorMeta('foto_sin_publicar', 'sin_id', '', 'Meta no devolvió la foto')
          subidas.push(id)
        }
        const cuerpo: Record<string, string> = { message: mensaje }
        subidas.forEach((id, i) => { cuerpo[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id }) })
        const r = await grafo('publicar_fotos', `${pageId}/feed`, { metodo: 'POST', token, cuerpo })
        const postId = String(r.id ?? '')
        let permalink: string | null = null
        try {
          const d = await grafo('permalink', postId, { token, params: { fields: 'permalink_url' } })
          permalink = typeof d.permalink_url === 'string' ? d.permalink_url : null
        } catch (_e) { /* el enlace es opcional: la publicación ya existe */ }
        await actualizar({
          status: 'published', facebook_post_id: postId.slice(0, 100), permalink, published_at: new Date().toISOString(),
          media: lista.map((f, i) => ({ product_id: f.productId, foto_indice: f.indice, facebook_photo_id: subidas[i] })),
        })
        await auditar(usuario.id, 'social_publish_completed', pubId, { tipo, fotos: subidas.length })
        return responder({ ok: true, publicacion: { id: pubId, status: 'published', permalink } })
      } catch (e) {
        // Las fotos no publicadas no se ven en la Página; se borran igualmente.
        for (const id of subidas) await grafo('borrar_foto', id, { metodo: 'DELETE', token }).catch(() => {})
        throw e
      }
    }

    // Video: URL firmada de duración limitada para que Meta lo descargue.
    const { data: firmada, error: errFirma } = await admin.storage.from(BUCKET_VIDEOS).createSignedUrl(storagePath!, DURACION_URL_FIRMADA)
    if (errFirma || !firmada?.signedUrl) throw new Error('No se pudo preparar el video')

    let videoId = ''
    if (tipo === 'video') {
      const r = await grafo('publicar_video', `${pageId}/videos`, {
        metodo: 'POST', token, cuerpo: { file_url: firmada.signedUrl, description: mensaje, published: 'true' },
      })
      videoId = String(r.id ?? '')
    } else {
      // Reel en 3 pasos: start → subida por file_url a rupload.facebook.com → finish.
      const ini = await grafo('reel_inicio', `${pageId}/video_reels`, { metodo: 'POST', token, cuerpo: { upload_phase: 'start' } })
      videoId = String(ini.video_id ?? '')
      if (!/^[0-9]{1,32}$/.test(videoId)) throw new ErrorMeta('reel_inicio', 'sin_video_id', '', 'Meta no devolvió el video')
      // El token solo se envía a rupload.facebook.com (nunca a otro host).
      let destino = `https://rupload.facebook.com/video-upload/${GRAPH_VERSION}/${videoId}`
      try {
        const u = new URL(String(ini.upload_url ?? ''))
        if (u.protocol === 'https:' && u.hostname === 'rupload.facebook.com') destino = u.toString()
      } catch (_e) { /* se usa la dirección estándar */ }
      let subida: Response
      try {
        subida = await fetch(destino, { method: 'POST', headers: { Authorization: `OAuth ${token}`, file_url: firmada.signedUrl } })
      } catch (_e) {
        throw new ErrorMeta('reel_subida', 'red', '', 'No se pudo contactar con Meta')
      }
      const js = await subida.json().catch(() => null) as Record<string, unknown> | null
      if (!subida.ok || !js || js.error) {
        const err = js?.error as Record<string, unknown> | undefined
        throw new ErrorMeta('reel_subida', String(err?.code ?? subida.status), '', limpiar(err?.message ?? `HTTP ${subida.status}`))
      }
      await grafo('reel_fin', `${pageId}/video_reels`, {
        metodo: 'POST', token, cuerpo: { upload_phase: 'finish', video_id: videoId, video_state: 'PUBLISHED', description: mensaje },
      })
    }
    await actualizar({ status: 'processing', facebook_video_id: videoId.slice(0, 100) })
    await auditar(usuario.id, 'social_publish_processing', pubId, { tipo })
    return responder({ ok: true, publicacion: { id: pubId, status: 'processing' } })
  } catch (e) {
    const det = describirError(e)
    console.error('fb-publish:', det)
    await actualizar({ status: 'failed', error_code: String(det.codigo ?? det.etapa).slice(0, 50), error_message: det.mensaje })
    if (storagePath) await admin.storage.from(BUCKET_VIDEOS).remove([storagePath]).catch(() => {})
    if (e instanceof ErrorMeta) await marcarConexionCaducada(usuario.id, e.codigo)
    await auditar(usuario.id, e instanceof ErrorMeta ? 'social_meta_error' : 'social_publish_failed', pubId, det)
    const reconectar = e instanceof ErrorMeta && (e.codigo === '190' || e.codigo === 'sin_token')
    return responder({
      ok: false, motivo: reconectar ? 'reconectar' : 'error_meta', publicacion: { id: pubId, status: 'failed' },
      error: reconectar ? 'Facebook retiró el permiso. Vuelve a conectar tu Página.' : 'Facebook no aceptó la publicación. Inténtalo más tarde.',
    }, 502)
  }
})
