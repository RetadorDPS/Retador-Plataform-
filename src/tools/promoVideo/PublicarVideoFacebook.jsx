// ═════════════════════════════════════════════════════════════════════════════
// 🎬 Publicar en Facebook — el VIDEO REAL que acaba de generar "Crear vídeo".
//
// Se abre desde el botón Facebook del generador, junto a Compartir, con el MISMO
// archivo (Blob) que usan Descargar y Compartir: no se vuelve a generar ni se
// descarga de ningún sitio. Pantalla de revisión antes de publicar:
//   · vista previa <video> del archivo que se va a enviar;
//   · texto editable (el mismo que arma Compartir con buildCaption);
//   · Página (la predeterminada primero; se puede cambiar);
//   · tipo: Reel si el video es vertical, video normal si es feed o cuadrado
//     (lo decide FORMATS[].fb del generador, no esta pantalla).
//
// Publicar reutiliza el backend existente, sin nada nuevo:
//   Blob → social-videos (fbSubirVideo) → fb-publish tipo 'reel'|'video' →
//   Meta procesa → fb-publish-status (fbEsperarProcesado) → publicado.
// Una sola clave de idempotencia y una sola ruta en el bucket por borrador: un
// reintento tras un corte no sube ni publica dos veces.
//
// Conectar Facebook: OAuth de siempre con volverA "herramienta-video"; antes de
// salir el video se guarda en IndexedDB (videoPendiente.js) y al volver esta
// pantalla se rehace desde ahí (props.restaurar), no el editor.
//
// Props: video { blob, nombre, ext, fb, formato, ancho, alto, duracion, ruta },
//        texto, productos (ids), restaurar, usuarioId, dark, onBack.
// ═════════════════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import { fbSubirVideo, fbPublicar, fbEsperarProcesado, fbBorrarVideoSubido } from "./v8/facebook.js";
import { LIMITE_TEXTO } from "../creadorPublicaciones/textoPublicacion.js";
import { useConexionFacebook, AvisoFacebook, SelectorPaginas, coloresDe } from "../creadorPublicaciones/conexionFacebook.jsx";
import { guardarVideoPendiente, recuperarVideoPendiente, borrarVideoPendiente } from "./videoPendiente.js";

const TAM_MAX = 50 * 1024 * 1024; // límite del bucket social-videos y de fb-publish
// Estados cuyo resultado no está cerrado: mientras dure, la clave no cambia.
const INCIERTOS = ["red", "procesando", "pendiente"];
const RUTAS_SEGURAS = /^MP4 · (AAC|sin sonido)/; // H.264 + AAC (o mudo): lo que pide Meta

const enlaceEnTexto = (t) => (String(t || "").match(/(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/[^\s]*/i) || [])[0] || "";
const esHttps = (u) => typeof u === "string" && /^https:\/\//.test(u);
const mb = (n) => (n / 1048576).toFixed(1).replace(".", ",") + " MB";

export default function PublicarVideoFacebook({ video: videoInicial = null, texto: textoInicial = "", productos: idsInicial = [], restaurar = false, usuarioId = null, dark = true, onBack }) {
  const c = coloresDe(dark);
  const ORO = "#FFC01E", FB = "#1877F2";

  // Datos de la publicación: los que llegan del generador o, al volver de Meta, los guardados.
  const [datos, setDatos] = useState(() => (restaurar ? null : { video: videoInicial, texto: textoInicial, productos: idsInicial, paginaId: null }));
  const [recuperando, setRecuperando] = useState(restaurar);
  const [texto, setTexto] = useState(textoInicial || "");
  const [pub, setPub] = useState({ estado: "inactivo" });
  const clave = useRef(null);      // idempotency_key del borrador
  const ruta = useRef(null);       // ruta en social-videos (la misma en cada reintento)
  const subido = useRef(false);    // el archivo ya está en el bucket
  const pubId = useRef(null);      // publicación en curso (para consultar su estado)
  const enviando = useRef(false);  // freno síncrono contra doble toque

  useEffect(() => {
    if (!restaurar) return;
    recuperarVideoPendiente(usuarioId).then((r) => {
      if (r) { setDatos({ video: r.video, texto: r.texto, productos: r.productos || [], paginaId: r.paginaId || null }); setTexto(r.textoEditado ?? r.texto ?? ""); }
      setRecuperando(false);
    });
  }, []);

  const video = datos?.video || null;
  const url = useMemo(() => (video?.blob instanceof Blob ? URL.createObjectURL(video.blob) : null), [video]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const con = useConexionFacebook({
    volverA: "herramienta-video",
    paginaInicial: datos?.paginaId,
    antesDeSalir: async () => {
      const ok = await guardarVideoPendiente(usuarioId, { video, texto: datos.texto, textoEditado: texto, productos: datos.productos, paginaId: con.paginaId });
      if (!ok && !window.confirm("Este navegador no deja guardar el vídeo mientras conectas Facebook. Al volver tendrás que generarlo otra vez. ¿Continuar?")) {
        throw new Error("Conexión cancelada. Tu vídeo sigue aquí.");
      }
    },
    alQuedarse: borrarVideoPendiente,
  });
  const { pagina, puedePublicar } = con;
  // Al volver de Meta: la Página que había elegido, si sigue conectada (una sola vez).
  const paginaAplicada = useRef(false);
  useEffect(() => {
    const g = datos?.paginaId;
    if (paginaAplicada.current || !g || !con.paginas.some((p) => p.id === g)) return;
    paginaAplicada.current = true;
    con.setPaginaId(g);
  }, [datos, con.paginas]);

  // ¿Se puede enviar este archivo? Se comprueba ANTES de subir nada.
  const tipoFb = video?.fb === "reel" ? "reel" : "video";
  const problema = !video ? "" :
    video.ext !== "mp4" || video.blob?.type !== "video/mp4"
      ? "Este navegador generó el vídeo en formato " + (video.ext || "desconocido").toUpperCase() + " y Facebook necesita MP4. Descárgalo y súbelo desde la app de Facebook, o genéralo desde Chrome actualizado."
      : video.blob.size > TAM_MAX
        ? `El vídeo pesa ${mb(video.blob.size)} y el máximo es 50 MB. Genéralo en calidad Ligera.`
        : "";
  const avisoRuta = video && !problema && video.ruta && !RUTAS_SEGURAS.test(video.ruta)
    ? `Este vídeo se generó por una ruta alternativa (${video.ruta}). Facebook podría no aceptarlo; si lo rechaza, genéralo desde Chrome actualizado.` : "";

  const tocarBorrador = () => {
    if (!INCIERTOS.includes(pub.estado)) {
      clave.current = null;
      if (pub.estado !== "inactivo") setPub({ estado: "inactivo" });
    }
  };
  const cambiarTexto = (v) => { tocarBorrador(); setTexto(v.slice(0, LIMITE_TEXTO)); };
  // Tras un fallo definitivo el backend ya borró el archivo: el próximo intento empieza de cero.
  const reiniciarEnvio = () => { clave.current = null; ruta.current = null; subido.current = false; pubId.current = null; };

  const esperar = async () => {
    setPub({ estado: "procesando" });
    try {
      const fin = await fbEsperarProcesado(pubId.current);
      setPub({ estado: "publicado", enlace: fin.enlace });
    } catch (e) {
      if (e?.motivo === "procesado_fallido") { reiniciarEnvio(); setPub({ estado: "rechazado" }); }
      else if (e?.motivo === "sigue_procesando") setPub({ estado: "pendiente" });
      else setPub({ estado: "red" }); // corte al consultar: no se sabe el resultado
    }
  };

  const publicar = async () => {
    if (enviando.current || !video || problema || !pagina || !puedePublicar) return;
    enviando.current = true;
    if (!clave.current) clave.current = crypto.randomUUID();
    if (!ruta.current && usuarioId) ruta.current = `${usuarioId}/${crypto.randomUUID()}.mp4`;
    let etapa = "subida";
    try {
      if (pubId.current && INCIERTOS.includes(pub.estado)) { etapa = "estado"; await esperar(); return; }
      if (!subido.current) {
        setPub({ estado: "subiendo" });
        await fbSubirVideo(video.blob, { ext: "mp4", ruta: ruta.current });
        subido.current = true;
      }
      etapa = "publicar";
      setPub({ estado: "publicando" });
      // Exactamente lo que muestra la vista previa: este archivo, este texto y esta Página.
      const r = await fbPublicar({ subidaId: ruta.current, paginaId: pagina.id, texto, tipo: tipoFb, idempotencyKey: clave.current });
      pubId.current = r.id;
      if (r.status === "published") setPub({ estado: "publicado", enlace: r.enlace, reutilizada: r.reutilizada });
      else if (r.status === "failed") { reiniciarEnvio(); setPub({ estado: "error", mensaje: "Facebook no aceptó el vídeo. Puedes intentarlo de nuevo más tarde." }); }
      else { etapa = "estado"; await esperar(); }
    } catch (e) {
      if (etapa === "subida") setPub({ estado: "error_subida", mensaje: e?.message || "No se pudo subir el vídeo." });
      else if (e?.red) setPub({ estado: "red" });
      else if (e?.motivo === "limite_por_hora") setPub({ estado: "limite", mensaje: e.message });
      else if (e?.motivo === "publicacion_en_curso") setPub({ estado: "error", mensaje: e.message });
      else if (e?.motivo === "reconectar") { reiniciarEnvio(); setPub({ estado: "reconectar", mensaje: e.message }); }
      else if (e?.motivo === "video_no_encontrado") { subido.current = false; setPub({ estado: "error", mensaje: "No encontramos el vídeo subido. Vuelve a intentarlo." }); }
      else {
        if (e?.motivo === "error_meta") reiniciarEnvio(); // quedó "failed" y el archivo ya se borró
        setPub({ estado: "error", mensaje: e?.message || "No se pudo completar la acción con Facebook." });
      }
    } finally {
      enviando.current = false;
    }
  };

  // Salir sin publicar: si el archivo quedó subido y no hay nada en curso, se borra del bucket.
  const volver = () => {
    if (["subiendo", "publicando"].includes(pub.estado)) return;
    if (subido.current && ruta.current && !pubId.current) fbBorrarVideoSubido(ruta.current);
    onBack && onBack();
  };

  // ── Piezas de interfaz ───────────────────────────────────────────────────
  const tarjeta = { background: c.card, border: `1px solid ${c.bd}`, borderRadius: 16 };
  const boton = (fondo, color, extra = {}) => ({ width: "100%", height: 46, borderRadius: 12, border: "none", background: fondo, color, fontSize: 14, fontWeight: 800, cursor: "pointer", ...extra });
  const secundario = boton("transparent", c.t1, { border: `1.5px solid ${c.bd}`, fontWeight: 700 });
  const nota = (t, color = c.t2) => <p style={{ fontSize: 12.5, color, lineHeight: 1.5, margin: "8px 0 0" }}>{t}</p>;
  const subtitulo = (t) => <h3 style={{ fontSize: 13, fontWeight: 800, color: c.t2, textTransform: "uppercase", letterSpacing: ".04em", margin: "20px 0 8px" }}>{t}</h3>;
  const ocupado = ["subiendo", "publicando"].includes(pub.estado);
  const cerrado = pub.estado === "publicado";

  const PROGRESO = { subiendo: "Subiendo vídeo…", publicando: "Publicando en Facebook…", procesando: "Procesando vídeo… Facebook lo está preparando; puede tardar unos minutos." };
  const resultado = () => {
    const e = pub.estado;
    if (e === "inactivo") return null;
    if (PROGRESO[e]) return <div role="status" style={{ ...tarjeta, padding: 16, marginTop: 14, fontSize: 14, fontWeight: 700, color: c.t1 }}>⏳ {PROGRESO[e]}</div>;
    const caja = (icono, tituloTxt, cuerpo, acciones) => (
      <div role="status" style={{ ...tarjeta, padding: 16, marginTop: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: c.t1, margin: 0 }}>{icono} {tituloTxt}</p>
        {cuerpo && nota(cuerpo)}
        {acciones && <div style={{ display: "grid", gap: 8, marginTop: 12 }}>{acciones}</div>}
      </div>
    );
    if (e === "publicado") return caja("✅", "Publicado correctamente", pub.reutilizada ? "Esta publicación ya estaba hecha." : "", <>
      {esHttps(pub.enlace) && <a href={pub.enlace} target="_blank" rel="noopener noreferrer" style={{ ...boton(FB, "#fff"), display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>Ver en Facebook</a>}
      <button onClick={onBack} style={secundario}>Volver al vídeo</button>
    </>);
    if (e === "error_subida") return caja("📶", "No se pudo subir el vídeo.", `${pub.mensaje} Tu vídeo sigue aquí y no se ha publicado nada.`, <>
      <button onClick={publicar} style={boton(ORO, "#1a1200")}>Reintentar</button>
    </>);
    if (e === "red") return caja("📶", "No sabemos si el vídeo llegó a Facebook.", "Reintentar es seguro: si ya llegó, no se publica dos veces.", <>
      <button onClick={publicar} style={boton(ORO, "#1a1200")}>Reintentar</button>
    </>);
    if (e === "pendiente") return caja("⏳", "Facebook sigue procesando el vídeo", "No hace falta volver a publicarlo. Puedes comprobarlo de nuevo en unos minutos.", <>
      <button onClick={publicar} style={secundario}>Comprobar de nuevo</button>
    </>);
    if (e === "rechazado") return caja("⚠️", "Facebook no pudo procesar el vídeo.", "No se publicó nada. Puedes intentarlo de nuevo o generar el vídeo en otra calidad.", <>
      <button onClick={publicar} style={secundario}>Intentar de nuevo</button>
    </>);
    if (e === "limite") return caja("⏱️", pub.mensaje, "", null);
    if (e === "reconectar") return caja("⚠️", pub.mensaje, "", <>
      <button onClick={() => con.conectar(true)} disabled={con.yendoAFacebook} style={{ ...boton(FB, "#fff"), opacity: con.yendoAFacebook ? .6 : 1 }}>{con.yendoAFacebook ? "Abriendo Facebook…" : "Volver a conectar Facebook"}</button>
    </>);
    return caja("⚠️", pub.mensaje, "", <>
      <button onClick={publicar} style={secundario}>Intentar de nuevo</button>
    </>);
  };

  const enlace = enlaceEnTexto(texto);
  return (
    <div style={{ minHeight: "100%", background: c.bg, color: c.t1, padding: "18px 16px 40px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <button onClick={volver} disabled={ocupado} style={{ background: "transparent", border: `1px solid ${c.bd}`, color: c.t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, opacity: ocupado ? .5 : 1 }}>‹ Volver al vídeo</button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: c.t1, letterSpacing: "-.02em", margin: 0 }}>Publicar en Facebook</h1>
        {nota("Revisa la publicación antes de enviarla. Se publica el vídeo que acabas de crear.")}

        {recuperando ? nota("Recuperando tu vídeo…") : !video ? (
          <div style={{ ...tarjeta, padding: 16, marginTop: 14 }}>{nota("No pudimos recuperar el vídeo en este navegador. Vuelve a Crear vídeo, genéralo de nuevo y toca «Publicar en Facebook».", c.t1)}</div>
        ) : (<>
          <div style={{ marginTop: 14 }}><AvisoFacebook con={con} c={c} /></div>

          {subtitulo("Vista previa de la publicación")}
          <div style={{ ...tarjeta, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: FB, color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>f</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.t1 }}>{pagina ? pagina.page_name : "Tu Página de Facebook"}</div>
                <div style={{ fontSize: 11.5, color: c.t2 }}>{tipoFb === "reel" ? "Reel" : "Vídeo en tu Página"} · así se verá</div>
              </div>
            </div>
            {texto && <p style={{ fontSize: 14, color: c.t1, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0, padding: "0 14px 12px" }}>{texto}</p>}
            {url && <video src={url} controls playsInline preload="metadata" aria-label="Vídeo que se va a publicar"
              style={{ display: "block", width: "100%", maxHeight: 520, background: "#000", aspectRatio: video.ancho && video.alto ? `${video.ancho} / ${video.alto}` : undefined }} />}
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${c.bd}`, fontSize: 12, color: c.t2, lineHeight: 1.5, overflowWrap: "anywhere" }}>
              <div>{tipoFb === "reel" ? "Se publicará como Reel (vertical)." : "Se publicará como vídeo en tu Página."} {video.ancho && video.alto ? `${video.ancho}×${video.alto}` : ""}{video.duracion ? ` · ${Math.round(video.duracion)} s` : ""} · {mb(video.blob.size)} · MP4</div>
              <div>{enlace ? <>Enlace dentro del texto: <span style={{ color: FB }}>{enlace}</span> (Facebook no muestra tarjeta de enlace en los vídeos).</> : "El texto no incluye ningún enlace."}</div>
            </div>
          </div>
          {problema && <div style={{ ...tarjeta, padding: 14, marginTop: 10, background: c.aviso, borderColor: "rgba(239,68,68,.35)" }}>{nota(problema, c.t1)}</div>}
          {avisoRuta && nota(avisoRuta)}

          {con.paginas.length > 1 && (<>{subtitulo("Página")}<SelectorPaginas con={con} c={c} bloqueado={ocupado} alElegir={tocarBorrador} /></>)}

          {subtitulo("Texto")}
          <textarea value={texto} onChange={(ev) => cambiarTexto(ev.target.value)} maxLength={LIMITE_TEXTO} rows={8} disabled={ocupado} aria-label="Texto de la publicación"
            style={{ width: "100%", boxSizing: "border-box", background: c.card, color: c.t1, border: `1px solid ${c.bd}`, borderRadius: 14, padding: 12, fontSize: 14, lineHeight: 1.5, fontFamily: "inherit", resize: "vertical" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <button onClick={() => cambiarTexto(datos.texto || "")} disabled={texto === (datos.texto || "") || ocupado}
              style={{ background: "transparent", border: "none", color: texto === (datos.texto || "") ? c.t2 : ORO, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>
              Restaurar texto sugerido
            </button>
            <span style={{ fontSize: 12, color: texto.length >= LIMITE_TEXTO ? "#ef4444" : c.t2 }}>{texto.length} / {LIMITE_TEXTO}</span>
          </div>

          {!cerrado && (
            <button onClick={publicar} disabled={ocupado || pub.estado === "procesando" || !puedePublicar || !!problema}
              style={{ ...boton(FB, "#fff"), marginTop: 16, opacity: ocupado || pub.estado === "procesando" || !puedePublicar || problema ? .55 : 1 }}>
              {ocupado || pub.estado === "procesando" ? "Publicando…" : "Publicar en Facebook"}
            </button>
          )}
          {resultado()}
          {nota("RETADOR publica solo cuando tú lo pides, como máximo 5 veces por hora en cada Página.")}
        </>)}
      </div>
    </div>
  );
}
