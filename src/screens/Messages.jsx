import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, memo } from "react";
import { Avatar, AvatarUser, G, Ic, ORDER_FLOW, PullIndicator, Spin, getMyConversations, getSB, getUserName, getProductById, isBlockedPair, isBlockSendError, toggleBlockUser, editMessage, deleteMessage, uploadVoiceNote, voiceNoteSignedUrl, setReaction, getReactionsForMessages, loadMessages, markRead, markDelivered, money, pushBackHandler, sendMessage, supabase, trackEvent, useAt, useR, usePullToRefresh } from "../shared/index.js";

// Fondo del chat: textura de identidad RETADOR — sutil pero SÍ perceptible (un
// patrón de puntos dorados en diagonal), en ambos temas. No compite con las
// burbujas (siguen siendo lo más contrastado de la pantalla) pero ya no es
// invisible como antes.
const chatBgStyle = (isDark) => ({
  backgroundColor: isDark ? "#0a0a0a" : "#f2f3f6",
  backgroundImage: `radial-gradient(${isDark ? "rgba(255,192,30,.16)" : "rgba(180,130,0,.16)"} 1.6px, transparent 1.6px), radial-gradient(${isDark ? "rgba(255,192,30,.09)" : "rgba(180,130,0,.09)"} 1.6px, transparent 1.6px)`,
  backgroundSize: "26px 26px, 26px 26px",
  backgroundPosition: "0 0, 13px 13px",
});

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
// Selector COMPLETO propio (sin librería externa ni picker nativo invocable por
// JS): un grid ampliado, agrupado a ojo por familia, con scroll.
const ALL_EMOJIS = [
  "👍", "👎", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉", "👏",
  "😀", "😁", "😃", "😄", "😅", "😆", "🙂", "🙃", "😉", "😊",
  "😍", "😘", "😜", "🤔", "😐", "😑", "😶", "🙄", "😏", "😒",
  "😞", "😔", "😟", "😕", "🙁", "😩", "😫", "😤", "😠", "😡",
  "🥳", "🥰", "😎", "🤩", "🥺", "😳", "😱", "😴", "🤗", "🤝",
  "👌", "✌️", "🤞", "👊", "✊", "💪", "🙌", "👋", "🤙", "🖐️",
  "💯", "✅", "❌", "⚠️", "❗", "❓", "💡", "⭐", "🌟", "✨",
  "💰", "💵", "🛍️", "📦", "🚚", "⏰", "📌", "📍", "🎁", "🏆",
];
const ORDER_STATUS_ICON = { creada: "🕐", confirmado: "🕐", asignado: "📦", recogido: "📦", en_ruta: "🚚", en_reparto: "🚚", recibido: "📦", preparando: "📦", enviado: "🚚", en_aduana: "🛃", entregado: "✅", completado: "✅", cancelado: "❌", fallido: "❌" };

// ── Gesto de un mensaje: mantener presionado = seleccionar (abre reacciones +
// barra superior); deslizar de izquierda a derecha = responder. Un solo hook
// coordina ambos para que no se disparen a la vez (si detecta arrastre, cancela
// el temporizador de "mantener presionado"; si detecta scroll vertical o hacia
// la izquierda, no hace nada y deja pasar el gesto nativo de la lista).
function useMessageGesture({ onLongPress, onTap, onSwipeReply, disabled }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const st = useRef({ x: 0, y: 0, live: false, mode: null, timer: null });
  const clearTimer = () => { if (st.current.timer) { clearTimeout(st.current.timer); st.current.timer = null; } };
  const onDown = (e) => {
    if (disabled) return;
    const s = st.current;
    s.x = e.clientX; s.y = e.clientY; s.live = true; s.mode = null;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    clearTimer();
    s.timer = setTimeout(() => {
      if (s.live && s.mode == null) { s.mode = "press"; s.live = false; onLongPress(); }
    }, 450);
  };
  const onMove = (e) => {
    const s = st.current;
    if (!s.live || s.mode) return;
    const ddx = e.clientX - s.x, ddy = e.clientY - s.y;
    if (Math.hypot(ddx, ddy) < 8) return;
    if (Math.abs(ddy) > Math.abs(ddx) || ddx < 0) { s.mode = "scroll"; clearTimer(); return; }
    s.mode = "swipe"; clearTimer(); setDragging(true);
  };
  const onContinue = (e) => {
    const s = st.current;
    if (s.mode !== "swipe") return;
    const ddx = e.clientX - s.x;
    setDx(Math.max(0, Math.min(64, ddx)));
  };
  const onUp = () => {
    const s = st.current;
    clearTimer();
    if (s.mode === "swipe" && dx >= 42) onSwipeReply();
    // Toque CORTO (soltó antes de que saltara el temporizador y sin arrastrar):
    // en modo selección, añade/quita este mensaje.
    else if (s.live && s.mode == null && onTap) onTap();
    s.live = false; s.mode = null;
    setDragging(false); setDx(0);
  };
  return {
    dx, dragging,
    handlers: {
      onPointerDown: onDown,
      onPointerMove: (e) => { onMove(e); onContinue(e); },
      onPointerUp: onUp, onPointerCancel: onUp, onPointerLeave: (e) => { if (st.current.mode === "swipe") onUp(); },
      onContextMenu: (e) => e.preventDefault(),
    },
  };
}

// ── Ícono de micrófono PROPIO (no literal): cápsula dorada con detalle propio,
// dentro de un círculo con borde — distinto del botón de enviar (relleno G).
function MicGlyph({ isDark }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="2.5" width="8" height="12.5" rx="4" fill={G} />
      <circle cx="12" cy="7" r="1.15" fill={isDark ? "#000" : "#fff"} opacity=".85" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" stroke={G} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M12 17.5v3.2" stroke={G} strokeWidth="2" strokeLinecap="round" />
      <path d="M8.6 20.7h6.8" stroke={G} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── TARJETA DE PEDIDO EN EL CHAT ─────────────────────────────────────────────
// Mensaje con meta {type:'order', order_id, title, image}: tarjeta centrada con
// el ESTADO ACTUAL del pedido EN VIVO (lo busca en los pedidos ya cargados, que
// el realtime de orders mantiene frescos; si no está, lo trae puntual). Tocarla
// abre el detalle del pedido.
function OrderChatCard({ meta, orders = [], onOpenOrder, B, T1, T3, soft }) {
  const oid = meta.order_id || meta.id;
  const live = orders.find(o => o.id === oid) || null;
  const [fetched, setFetched] = useState(null);
  useEffect(() => {
    if (live || !oid) return;
    let a = true;
    supabase.from("orders").select("id, status, ship_mode").eq("id", oid).single()
      .then(({ data }) => { if (a && data) setFetched(data); }).catch(() => {});
    return () => { a = false; };
  }, [oid, live?.status]);
  const status = live?.status || fetched?.status || null;
  const shipMode = live?.shipMode || live?.ship_mode || fetched?.ship_mode || meta.ship_mode || "local";
  const flow = ORDER_FLOW[shipMode] || ORDER_FLOW.local;
  const label = status ? ((flow.find(s => s.key === status) || {}).label || status) : "Pedido";
  const dot = ["entregado", "completado"].includes(status) ? "#22C55E" : ["fallido", "cancelado"].includes(status) ? "#EF4444" : "#FBBF24";
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
      <div onClick={() => onOpenOrder && onOpenOrder(oid)} className="p"
        style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: "88%", background: soft, border: `1px solid ${B}`, borderRadius: 14, padding: "10px 13px", cursor: "pointer" }}>
        {meta.image && <img src={meta.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📦 {meta.title || "Pedido"}</p>
          <p style={{ fontSize: 10.5, color: T3, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />{label}<span style={{ color: G, fontWeight: 700 }}> · Ver pedido ›</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Tarjeta de REFERENCIA (producto o pedido) que acompaña a un mensaje con texto.
// Foto más grande, título a dos líneas, precio, y el ESTADO actual si está ligada
// a un pedido/envío (ej. "🚚 En camino"). Si el producto ya no existe o está
// agotado, se reduce a una versión chica sin precio ni acción — el mensaje y el
// historial NUNCA se pierden, solo se opaca la tarjeta.
function RefChatCard({ meta, onOpen, onStartOrder, orders = [], B, T1, T3, soft }) {
  const price = Number(meta.price) > 0 ? money(Number(meta.price) || 0, meta.currency || "USD") : null;
  const isAdminReq = meta.type === "admin_request";
  const isOrder = meta.type === "order";
  const isProduct = meta.type === "product";
  const isService = meta.type === "service";
  // product_id es el nombre real del campo (mismo patrón que order_id en las
  // tarjetas de pedido); meta.id se mantiene solo como compatibilidad con
  // mensajes viejos ya guardados antes de este cambio.
  const pid = meta.product_id ?? meta.id;

  const oid = isOrder ? (meta.order_id || meta.id) : null;
  const liveOrder = oid ? orders.find(o => o.id === oid) : null;
  const [fetchedOrder, setFetchedOrder] = useState(null);
  useEffect(() => {
    if (!isOrder || liveOrder || !oid) return;
    let a = true;
    supabase.from("orders").select("id, status, ship_mode").eq("id", oid).single().then(({ data }) => { if (a && data) setFetchedOrder(data); }).catch(() => {});
    return () => { a = false; };
  }, [isOrder, oid, liveOrder?.status]);
  const status = liveOrder?.status || fetchedOrder?.status || null;
  const shipMode = liveOrder?.shipMode || liveOrder?.ship_mode || fetchedOrder?.ship_mode || meta.ship_mode || "local";
  const flow = ORDER_FLOW[shipMode] || ORDER_FLOW.local;
  const statusLabel = status ? ((flow.find(s => s.key === status) || {}).label || status) : null;
  const statusIcon = status ? (ORDER_STATUS_ICON[status] || "📦") : null;

  const isListing = isProduct || isService; // ambos viven en `products` (kind='product'|'service')
  const [avail, setAvail] = useState(isListing ? "checking" : "ok"); // checking | ok | gone
  useEffect(() => {
    if (!isListing || !pid) { setAvail("ok"); return; }
    let a = true;
    getProductById(pid).then(p => {
      if (!a) return;
      // Un servicio no tiene stock: solo se apaga si dejó de estar activo.
      const unavailable = !p || (p.status && p.status !== "active") || (!isService && p.stock != null && Number(p.stock) <= 0);
      setAvail(unavailable ? "gone" : "ok");
    }).catch(() => { if (a) setAvail("ok"); });
    return () => { a = false; };
  }, [isListing, isService, pid]);

  if (isListing && avail === "gone") {
    return (
      <div className="p" style={{ display: "flex", alignItems: "center", gap: 9, background: soft, border: `1px solid ${B}`, borderRadius: 12, padding: "7px 10px", marginBottom: 7, opacity: .55, maxWidth: 240, cursor: "default" }}>
        {meta.image
          ? <img src={meta.image} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0, filter: "grayscale(1)" }} />
          : <div style={{ width: 34, height: 34, borderRadius: 8, background: "#8884", flexShrink: 0 }} />}
        <p style={{ fontSize: 11, color: T3, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.title || (isService ? "Servicio" : "Producto")} · ya no disponible</p>
      </div>
    );
  }

  return (
    <div className="p" style={{ background: soft, border: `1px solid ${B}`, borderRadius: 15, padding: "11px 13px", marginBottom: 7, minWidth: 230, maxWidth: 300 }}>
      {/* onPointerDown con stopPropagation en toda la tarjeta y sus botones: el
          gesto de la burbuja (useMessageGesture) captura el puntero en cuanto
          detecta un pointerdown en CUALQUIER descendiente — sin cortar la
          propagación aquí, el "up" se redirige al div de la burbuja y el click
          real de estos botones nunca llega a dispararse (mismo problema que ya
          se arregló para el control de audio). */}
      <div onClick={onOpen} onPointerDown={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 12, cursor: onOpen ? "pointer" : "default" }}>
        {meta.image
          ? <img src={meta.image} alt="" style={{ width: 68, height: 68, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
          : <div style={{ width: 68, height: 68, borderRadius: 12, background: "#8884", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{isOrder ? "📦" : isAdminReq ? "🪪" : isService ? "🛠️" : "🛍️"}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 800, color: T1, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{meta.title || (isOrder ? "Pedido" : isService ? "Servicio" : "Producto")}</p>
          {isAdminReq
            ? <p style={{ fontSize: 11.5, color: T3, marginTop: 4, fontWeight: 700 }}>{meta.subtitle || "Coordinando por chat"}</p>
            : <p style={{ fontSize: 11.5, color: T3, marginTop: 4, fontWeight: 700 }}>
                {price ? <span style={{ color: "#22C55E" }}>{isService ? "Desde " : ""}{price}</span> : (isOrder ? "Pedido" : isService ? "💬 Precio a consultar" : "Producto")}
                {!isOrder && !isProduct && !isService && <span style={{ fontWeight: 600 }}> · Ver detalle ›</span>}
              </p>}
          {isOrder && statusLabel && (
            <p style={{ fontSize: 11.5, color: T1, marginTop: 5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              {statusIcon} {statusLabel}<span style={{ color: G, fontWeight: 700 }}> · Ver ›</span>
            </p>
          )}
        </div>
      </div>
      {/* Botones REALES de RETADOR — nada inventado: "Ver ficha completa" abre el
          detalle real; "Iniciar pedido" (solo productos) es el mismo flujo de
          compra de siempre (handleBuy). Los servicios no tienen flujo de pedido
          propio y el chat YA ES el contacto, así que no llevan botón extra. */}
      {(isProduct || isService) && (
        <div onPointerDown={e => e.stopPropagation()} style={{ display: "flex", gap: 7, marginTop: 10 }}>
          <button onClick={onOpen} className="p" style={{ flex: 1, background: "none", border: `1px solid ${B}`, borderRadius: 50, padding: "7px 10px", fontSize: 10.5, fontWeight: 700, color: T1, cursor: "pointer" }}>Ver ficha completa</button>
          {isProduct && onStartOrder && (
            <button onClick={() => onStartOrder(pid)} className="p" style={{ flex: 1, background: G, border: "none", borderRadius: 50, padding: "7px 10px", fontSize: 10.5, fontWeight: 800, color: "#000", cursor: "pointer" }}>Iniciar pedido</button>
          )}
        </div>
      )}
    </div>
  );
}

// Solo un audio puede sonar a la vez en TODO el chat: guarda el elemento
// <audio> activo. Al empezar otro, el que sonaba se PAUSA (nunca se reinicia
// — pause() nunca toca currentTime, así que queda listo para retomar donde iba).
let _activeVoiceAudio = null;

// ── Azul FIJO de palomitas/leído — NUNCA cambia con el "Estilo de chat" que
// elige cada usuario, así nunca se pierde contra ningún color de burbuja.
export const READ_BLUE = "#0EA5E9";

// ── 8 colores del "Estilo de chat" (profiles.chat_theme) — se aplican SOLO al
// fondo de mis propias burbujas. Texto calculado por luminancia real para que
// se siga leyendo bien con cualquiera de los 8 (oscuro sobre los claros,
// blanco sobre los más saturados/oscuros) — nunca queda a ojo.
export const CHAT_THEMES = [
  { key: "dorado",    label: "Dorado",         hex: "#FFC01E" },
  { key: "esmeralda", label: "Verde esmeralda", hex: "#10B981" },
  { key: "azul",      label: "Azul cielo",     hex: READ_BLUE },
  { key: "morado",    label: "Morado intenso", hex: "#7C3AED" },
  { key: "rosa",      label: "Rosa/Fucsia",    hex: "#EC4899" },
  { key: "naranja",   label: "Naranja",        hex: "#F97316" },
  { key: "turquesa",  label: "Turquesa",       hex: "#14B8A6" },
  { key: "coral",     label: "Rojo coral",     hex: "#F43F5E" },
];
export function textColorFor(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "#000" : "#fff";
}

// ── Reproductor de nota de voz — onda REAL (decodificada del audio de verdad,
// no inventada) + avance real (scrubbing) + insignia de "escuchado". ────────
function VoiceMessage({ meta, mine, isDark, T1, T3, accentBg, autoPlay, onEnded, onFirstPlay }) {
  const [url, setUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [rate, setRate] = useState(1);
  const [bars, setBars] = useState(null); // null=aún calculando; luego array de niveles 0..1 REALES
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  useEffect(() => { let a = true; voiceNoteSignedUrl(meta.audio_path).then(u => { if (a) setUrl(u); }).catch(() => {}); return () => { a = false; }; }, [meta.audio_path]);
  // Reproducción en cadena: si el mensaje anterior (un audio) acaba de terminar
  // y este es el siguiente, arranca solo en cuanto la URL esté lista.
  useEffect(() => {
    if (autoPlay && url && audioRef.current) audioRef.current.play().catch(() => {});
  }, [autoPlay, url]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = rate; }, [rate, url]);
  // Onda REAL: decodifica el audio de verdad (Web Audio API, igual espíritu que
  // el AnalyserNode al grabar) y calcula el volumen real por tramo — nunca una
  // forma inventada. Si el navegador no puede decodificar (formato/CORS), cae
  // a una barra plana en vez de romper el reproductor.
  useEffect(() => {
    if (!url) return;
    let alive = true;
    (async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const actx = new AudioCtx();
        const audioBuf = await actx.decodeAudioData(buf);
        const data = audioBuf.getChannelData(0);
        const N = 34;
        const step = Math.max(1, Math.floor(data.length / N));
        const levels = [];
        for (let i = 0; i < N; i++) {
          let sum = 0, count = 0;
          for (let j = i * step; j < Math.min(data.length, (i + 1) * step); j++) { sum += data[j] * data[j]; count++; }
          levels.push(count ? Math.sqrt(sum / count) : 0);
        }
        const max = Math.max(...levels, 0.0001);
        actx.close().catch(() => {});
        if (alive) setBars(levels.map(l => Math.max(0.12, l / max)));
      } catch (e) { if (alive) setBars(Array(24).fill(0.5)); } // respaldo: barra pareja, nunca se rompe
    })();
    return () => { alive = false; };
  }, [url]);
  const total = Number(meta.duration) || 0;
  const fmt = (s) => { const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, "0")}`; };
  // "Escuchado" — insignia local (persistida) + reutiliza mark_conversation_read
  // real la primera vez que se escucha un mensaje recibido, para que el remitente
  // vea sus palomitas en azul aunque el receptor no haya vuelto a abrir el chat.
  const heardKey = `retador_voice_heard_${meta.audio_path || ""}`;
  const [heard, setHeard] = useState(() => { try { return localStorage.getItem(heardKey) === "1"; } catch { return false; } });
  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); } else {
      el.play().catch(() => {});
      if (!heard) { try { localStorage.setItem(heardKey, "1"); } catch (e) {} setHeard(true); onFirstPlay && onFirstPlay(); }
    }
  };
  // Salta al punto real tocado/arrastrado — mueve el currentTime del <audio> de
  // verdad (nunca solo la barra visual), así el punto arrastrable SIEMPRE
  // refleja dónde vas a seguir escuchando.
  const seekToClientX = (clientX) => {
    const track = trackRef.current, audio = audioRef.current;
    if (!track || !audio || !total) return;
    const r = track.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const t = frac * total;
    audio.currentTime = t;
    setCur(t);
  };
  // stopPropagation en las tres: el control de audio captura el toque para sí
  // solo — sin esto, el mismo gesto burbujeaba hasta la burbuja del mensaje y
  // el arrastre horizontal se confundía con "deslizar para responder".
  const onTrackDown = (e) => {
    e.stopPropagation();
    if (!total) return;
    setDragging(true);
    seekToClientX(e.clientX);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  };
  const onTrackMove = (e) => { e.stopPropagation(); if (dragging) seekToClientX(e.clientX); };
  const endDrag = (e) => { e.stopPropagation(); setDragging(false); };
  const pct = total ? Math.min(100, (cur / total) * 100) : 0;
  const dot = mine ? "#000" : G;
  const barsList = bars || Array(24).fill(0.35);
  const playedIdx = Math.floor((pct / 100) * barsList.length);

  const badge = (
    <div title={heard ? "Escuchado" : "Sin escuchar"} style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: heard ? READ_BLUE : (isDark ? "#3a3a3a" : "#c8c8cc"), transition: "background .2s" }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <rect x="8" y="2.5" width="8" height="12.5" rx="4" fill="#fff" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M12 17.5v3.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 200, padding: "3px 2px" }}>
      {!mine && badge}
      {url && <audio ref={audioRef} src={url} preload="none"
        onPlay={() => {
          setPlaying(true);
          if (_activeVoiceAudio && _activeVoiceAudio !== audioRef.current) _activeVoiceAudio.pause();
          _activeVoiceAudio = audioRef.current;
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCur(0); if (_activeVoiceAudio === audioRef.current) _activeVoiceAudio = null; onEnded?.(); }}
        onTimeUpdate={e => { if (!dragging) setCur(e.target.currentTime); }} />}
      <button onClick={toggle} onPointerDown={e => e.stopPropagation()} disabled={!url} className="p" style={{ width: 34, height: 34, borderRadius: "50%", background: accentBg, border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: url ? "pointer" : "default" }}>
        <span style={{ fontSize: 13, color: mine ? "#000" : "#fff", marginLeft: playing ? 0 : 1 }}>{playing ? "⏸" : "▶"}</span>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div ref={trackRef} onPointerDown={onTrackDown} onPointerMove={onTrackMove} onPointerUp={endDrag} onPointerCancel={endDrag}
          style={{ position: "relative", height: 22, display: "flex", alignItems: "center", gap: 1.5, cursor: total ? "pointer" : "default", touchAction: "none" }}>
          {barsList.map((lv, i) => (
            <span key={i} style={{ flex: 1, minWidth: 2, borderRadius: 2, height: `${Math.max(3, Math.round(lv * 20))}px`, background: i <= playedIdx ? dot : (mine ? "#00000030" : (isDark ? "#ffffff30" : "#00000022")), transition: dragging ? "none" : "background .1s" }} />
          ))}
          {total > 0 && <div style={{ position: "absolute", left: `${pct}%`, top: "50%", width: 3, height: 22, borderRadius: 2, background: dot, transform: `translate(-50%,-50%) scaleY(${dragging ? 1.15 : 1})`, boxShadow: "0 0 3px rgba(0,0,0,.3)" }} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
          <p style={{ fontSize: 9.5, color: mine ? "#00000088" : (T3 || "rgba(255,255,255,.6)") }}>{fmt(playing || dragging || cur ? cur : total)}</p>
          {total > 0 && (
            <button onClick={() => setRate(r => (r === 1 ? 1.5 : r === 1.5 ? 2 : 1))} onPointerDown={e => e.stopPropagation()} className="p"
              style={{ background: mine ? "#00000022" : (isDark ? "#ffffff22" : "#00000018"), border: "none", borderRadius: 20, padding: "1px 6px", fontSize: 9, fontWeight: 800, color: mine ? "#000" : T1, cursor: "pointer" }}>
              {rate}×
            </button>
          )}
        </div>
      </div>
      {mine && badge}
    </div>
  );
}

// ── Franja "respondiendo a" dentro de una burbuja — tocarla salta al original.
function ReplyStrip({ meta, onJump, mine, isDark }) {
  const tint = mine ? "#00000014" : (isDark ? "#ffffff14" : "#00000010");
  const barColor = mine ? "#00000055" : G;
  const textColor = mine ? "#00000099" : (isDark ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.62)");
  return (
    <div onClick={onJump} onPointerDown={e => e.stopPropagation()} className="p" style={{ display: "flex", gap: 7, alignItems: "stretch", marginBottom: 6, cursor: "pointer", background: tint, borderRadius: 8, padding: "5px 8px" }}>
      <div style={{ width: 3, borderRadius: 2, background: barColor, flexShrink: 0 }} />
      <p style={{ fontSize: 11, color: textColor, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{meta.reply_preview || "Mensaje"}</p>
    </div>
  );
}

// ── Fila de reacciones bajo un mensaje (emoji + contador; toca para alternar) ─
function ReactionsRow({ list = [], meId, onToggle, mine }) {
  if (!list.length) return null;
  const groups = {};
  list.forEach(r => { (groups[r.emoji] ||= []).push(r); });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, justifyContent: mine ? "flex-end" : "flex-start" }}>
      {Object.entries(groups).map(([emoji, rs]) => {
        const mineReacted = rs.some(r => r.user_id === meId);
        return (
          <button key={emoji} onClick={() => onToggle(emoji)} className="p"
            style={{ display: "flex", alignItems: "center", gap: 3, background: mineReacted ? `${G}26` : "rgba(128,128,128,.16)", border: `1px solid ${mineReacted ? G : "transparent"}`, borderRadius: 100, padding: "2px 7px", fontSize: 11, cursor: "pointer" }}>
            <span>{emoji}</span>{rs.length > 1 && <span style={{ fontWeight: 700, color: mineReacted ? G : "inherit" }}>{rs.length}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Tira de reacciones rápidas (WhatsApp-style): aparece SIEMPRE al mantener
// presionado, muestre o no ya una reacción tuya — si ya reaccionaste, tu emoji
// aparece resaltado entre los rápidos. Tocar otro reemplaza; tocar el mismo la
// quita (mismo toggle de siempre). El "+" abre el selector completo.
function QuickReactionBar({ current, onPick, onOpenFull, mine, CARD, B, isDark }) {
  return (
    <div style={{ display: "flex", alignSelf: mine ? "flex-end" : "flex-start", alignItems: "center", gap: 3, background: CARD, border: `1px solid ${B}`, borderRadius: 100, padding: "5px 6px", marginBottom: 5, boxShadow: isDark ? "0 4px 14px rgba(0,0,0,.35)" : "0 4px 14px rgba(0,0,0,.12)" }}>
      {QUICK_EMOJIS.map(e => {
        const active = current === e;
        return (
          <button key={e} onClick={() => onPick(e)} className="p"
            style={{ fontSize: 19, width: 30, height: 30, borderRadius: "50%", background: active ? `${G}33` : "transparent", border: active ? `1.5px solid ${G}` : "1.5px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transform: active ? "scale(1.08)" : "scale(1)" }}>
            {e}
          </button>
        );
      })}
      <button onClick={onOpenFull} className="p" style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(128,128,128,.14)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: G }}>+</button>
    </div>
  );
}

// ── Selector COMPLETO de emojis (grid propio, sin dependencias externas). ────
function EmojiPickerModal({ onPick, onClose, CARD, B, T1, T2, isDark }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 5100, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: CARD, width: "100%", maxWidth: 440, maxHeight: "62vh", borderRadius: "18px 18px 0 0", padding: "14px 14px 20px", border: `1px solid ${B}`, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: T1 }}>Elegir emoji</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T2, fontSize: 19, cursor: "pointer", padding: 4 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
          {ALL_EMOJIS.map((e, i) => (
            <button key={e + i} onClick={() => onPick(e)} className="p" style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 10 }}>{e}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Selector de "Estilo de chat" — 8 colores reales, persistentes (profiles.
// chat_theme). Se aplican SOLO al fondo de mis propias burbujas; las palomitas
// siempre quedan en el azul fijo (READ_BLUE), nunca en este color.
function ChatThemePickerModal({ current, onPick, onClose, CARD, B, T1, T2, isDark }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 5100, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: CARD, width: "100%", maxWidth: 440, borderRadius: "18px 18px 0 0", padding: "14px 14px 24px", border: `1px solid ${B}`, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "0 4px" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: T1 }}>🎨 Estilo de chat</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T2, fontSize: 19, cursor: "pointer", padding: 4 }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, padding: "0 4px" }}>
          {CHAT_THEMES.map(t => {
            const on = current === t.key;
            return (
              <button key={t.key} onClick={() => onPick(t.key)} className="p" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: t.hex, display: "flex", alignItems: "center", justifyContent: "center", border: on ? `3px solid ${T1}` : "3px solid transparent", boxShadow: on ? `0 0 0 2px ${t.hex}55` : "none" }}>
                  {on && <span style={{ color: textColorFor(t.hex), fontSize: 16, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 9.5, color: T2, fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Barra superior de SELECCIÓN (reemplaza el encabezado normal del chat
// mientras hay un mensaje elegido con "mantener presionado"): Responder,
// Reenviar, Editar (solo mío y de texto), Eliminar. Sin "anclar" — esa función
// no existe aún en el backend, no se inventa.
// Responder y Editar solo tienen sentido con UN mensaje elegido (igual que
// WhatsApp); Reenviar y Eliminar funcionan en lote. Las acciones que no aplican
// llegan como null y no se pintan.
function SelectionTopBar({ count = 1, allMine, isTextMsg, onClose, onReply, onForward, onEdit, onDelete, S, B, T1, isDark }) {
  const btnStyle = { background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: T1, fontSize: 9.5, fontWeight: 600, padding: "4px 10px" };
  return (
    <div style={{ background: isDark ? "rgba(8,8,8,.97)" : "rgba(255,255,255,.98)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "9px 12px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <button onClick={onClose} style={{ background: "none", border: "none", color: T1, fontSize: 20, cursor: "pointer", padding: "0 8px 0 2px", lineHeight: 1 }}>×</button>
      <p style={{ fontSize: 14, fontWeight: 800, color: T1 }}>{count}</p>
      <div style={{ flex: 1 }} />
      {onReply && <button onClick={onReply} style={btnStyle}><span style={{ fontSize: 17 }}>↩️</span>Responder</button>}
      {onForward && <button onClick={onForward} style={btnStyle}><span style={{ fontSize: 17 }}>↪️</span>Reenviar</button>}
      {onEdit && <button onClick={onEdit} style={btnStyle}><span style={{ fontSize: 17 }}>✏️</span>Editar</button>}
      {onDelete && <button onClick={onDelete} style={{ ...btnStyle, color: "#EF4444" }}><span style={{ fontSize: 17 }}>🗑️</span>Eliminar</button>}
    </div>
  );
}

// ── Selector de conversaciones para REENVIAR un mensaje (mismo listado que la
// pantalla de Mensajes). Multi-selección con casillas; "Enviar" crea un
// mensaje nuevo por cada conversación elegida con el mismo contenido.
function ForwardPickerModal({ user, count = 1, onClose, onConfirm, CARD, B, T1, T2, T3, isDark }) {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState({});
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    getMyConversations(user.id).then(d => { setConvs(d); setLoading(false); }).catch(() => setLoading(false));
  }, [user?.id]);
  const toggle = (otherId) => setPicked(p => ({ ...p, [otherId]: !p[otherId] }));
  const chosen = Object.keys(picked).filter(k => picked[k]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 5200, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: CARD, width: "100%", maxWidth: 440, maxHeight: "72vh", borderRadius: "18px 18px 0 0", padding: "14px 14px 16px", border: `1px solid ${B}`, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: T1 }}>Reenviar{count > 1 ? ` ${count} mensajes` : ""} a…</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T2, fontSize: 19, cursor: "pointer", padding: 4 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, minHeight: 60 }}>
          {loading
            ? <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Spin size={20} /></div>
            : convs.length === 0
              ? <p style={{ fontSize: 12, color: T3, textAlign: "center", padding: 20 }}>Sin conversaciones</p>
              : convs.map(c => (
                  <div key={c.id} onClick={() => toggle(c.otherId)} className="cd" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 6px", borderRadius: 12, cursor: "pointer" }}>
                    <AvatarUser userId={c.otherId} name={c.name} size={38} />
                    <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${picked[c.otherId] ? G : B}`, background: picked[c.otherId] ? G : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", fontWeight: 800, flexShrink: 0 }}>{picked[c.otherId] ? "✓" : ""}</div>
                  </div>
                ))}
        </div>
        <button disabled={!chosen.length} onClick={() => onConfirm(chosen)} className="p" style={{ marginTop: 10, height: 44, borderRadius: 10, background: chosen.length ? G : "rgba(128,128,128,.25)", border: "none", color: chosen.length ? "#000" : T3, fontWeight: 800, fontSize: 13, cursor: chosen.length ? "pointer" : "default", flexShrink: 0 }}>
          Enviar{chosen.length ? ` (${chosen.length})` : ""}
        </button>
      </div>
    </div>
  );
}

export function MessagesScreen({ user, onBack, onChat, chatOpen = false }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const [convs,   setConvs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  const reload = useCallback(() => { if (user?.id) getMyConversations(user.id).then(setConvs).catch(() => {}); }, [user?.id]);
  // Pull-to-refresh REAL: sin esto, deslizar hacia abajo en el tope disparaba el
  // pull-to-refresh NATIVO del navegador (recarga completa, perdía el scroll).
  const ptr = usePullToRefresh(listRef, reload);
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    getMyConversations(user.id).then(d => { setConvs(d); setLoading(false); });
    // Al volver a la app / a esta pantalla, refresca los no leídos (no se quedan pegados).
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [user?.id]);

  // TIEMPO REAL: cualquier mensaje nuevo (o marcado como leído) refresca la lista
  // al instante — mirando los chats ves llegar el mensaje sin salir ni recargar.
  useEffect(() => {
    if (!user?.id) return;
    let ch = null, alive = true;
    getSB().then(c => {
      if (!c || !alive) return;
      ch = c.channel("msgs_list")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => reload())
        .subscribe();
    });
    return () => { alive = false; if (ch) getSB().then(c => c?.removeChannel(ch)).catch(() => {}); };
  }, [user?.id, reload]);

  // Al VOLVER del chat (se cierra el overlay), refresca al momento: la conversación
  // que acabas de leer deja de marcar "no leído" sin tener que salir y entrar.
  useEffect(() => { if (!chatOpen) reload(); }, [chatOpen, reload]);

  const totalUnread = convs.reduce((a, c) => a + (c.unread || 0), 0);

  // Hora/fecha corta estilo WhatsApp: "14:30" hoy, "Ayer", "lun", o "3 mar".
  const shortTime = (t) => {
    if (!t) return "";
    const d = new Date(t), now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Ayer";
    if ((now - d) < 7 * 864e5) return d.toLocaleDateString("es-ES", { weekday: "short" });
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  };

  return (
    <div ref={listRef} {...ptr.handlers} style={{ flex: 1, overflowY: "auto", overscrollBehaviorY: "contain" }}>
      <PullIndicator pull={ptr.pull} refreshing={ptr.refreshing} />
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "13px 18px", display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, zIndex: 2 }}>
        <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c={T2} s={20} /></button>
        <p style={{ fontSize: 15, fontWeight: 800, color: T1 }}>Mensajes</p>
        {totalUnread > 0 && <div style={{ marginLeft: "auto", background: G, borderRadius: 100, minWidth: 22, height: 20, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#000" }}>{totalUnread}</div>}
      </div>
      {!user
        ? <div style={{ padding: "44px 18px", textAlign: "center" }}><p style={{ color: T2, fontSize: 12 }}>Inicia sesión para ver tus mensajes</p></div>
        : loading
          ? <div style={{ display: "flex", justifyContent: "center", padding: "44px 0" }}><Spin size={26} /></div>
          : convs.length === 0
            ? <div style={{ padding: "64px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 50, marginBottom: 16 }}>💬</div>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: T1 }}>Sin mensajes aún</p>
                <p style={{ fontSize: 11, color: T2, lineHeight: 1.6 }}>Contacta a un vendedor desde el detalle de un producto.</p>
              </div>
            : <div style={{ padding: "4px 10px 24px" }}>
                {convs.map(c => {
                  const unread = c.unread || 0;
                  return (
                    <div key={c.id} className="cd" onClick={() => onChat(c)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 10px", borderRadius: 14, cursor: "pointer" }}>
                      <AvatarUser userId={c.otherId} name={c.name} size={50} verified={c.otherVerified} />
                      <div style={{ flex: 1, minWidth: 0, borderBottom: `1px solid ${B}`, paddingBottom: 11 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                          <p style={{ fontSize: 11, color: unread ? G : T3, fontWeight: unread ? 700 : 500, flexShrink: 0, whiteSpace: "nowrap" }}>{shortTime(c.lastTime)}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <p style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: unread ? T1 : T2, fontWeight: unread ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastMsg || "Sin mensajes"}</p>
                          {unread > 0 && <div style={{ flexShrink: 0, background: G, borderRadius: 100, minWidth: 20, height: 20, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800, color: "#000" }}>{unread > 99 ? "99+" : unread}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
      }
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CHAT — Realtime con conversation_id
// ═════════════════════════════════════════════════════════════════════════════
// Input AISLADO: guarda su propio borrador, así los mensajes que llegan por
// realtime (que re-renderizan el chat) NO le roban el foco ni borran las letras.
const ChatInput = memo(function ChatInput({ onSend, onSendVoice, blocked, S, B, T1, T3, isDark, initialDraft = "", replyTo, onCancelReply, editing, onSaveEdit, onCancelEdit, attachment, onCancelAttachment }) {
  // initialDraft: mensaje predefinido EDITABLE (ej. el cobro de deuda del admin).
  const [draft, setDraft] = useState(initialDraft || "");
  const inputRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [recBars, setRecBars] = useState([]); // niveles reales del micrófono (0..1), estilo WhatsApp
  const recRef = useRef(null); // { recorder, chunks, stream, timer, startedAt, actx, waveTimer, analyser, data }

  // Al entrar en modo edición, precarga el texto original.
  useEffect(() => { if (editing) setDraft(editing.text || ""); }, [editing]);

  // Al enviar NO se hace blur: se limpia el texto y el input CONSERVA el foco,
  // así el teclado se queda abierto (con botón y con Enter). Al CONFIRMAR una
  // edición el campo también se vacía (antes se quedaba con el texto editado
  // dentro, con riesgo de reenviarlo por accidente como mensaje nuevo). Con un
  // adjunto pendiente se puede enviar SIN escribir nada (el producto ES el mensaje).
  const send = () => {
    const t = draft.trim();
    if (!t && !attachment) return;
    if (editing) { onSaveEdit(t); setDraft(""); return; }
    setDraft(""); onSend(t); inputRef.current?.focus();
  };

  const sampleWave = (r) => {
    r.analyser.getByteTimeDomainData(r.data);
    let sum = 0;
    for (let i = 0; i < r.data.length; i++) { const v = (r.data[i] - 128) / 128; sum += v * v; }
    const level = Math.min(1, Math.sqrt(sum / r.data.length) * 4); // amplificado: la voz normal no debe saturar
    setRecBars(b => (b.length >= 32 ? [...b.slice(1), level] : [...b, level]));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start();
      const startedAt = Date.now();
      const timer = setInterval(() => setRecSecs(Math.floor((Date.now() - startedAt) / 1000)), 250);

      // Onda EN VIVO real (no una animación falsa): AnalyserNode de la Web Audio
      // API sobre el MISMO stream del micrófono que está grabando. Cada 90ms se
      // mide el volumen real (RMS de la forma de onda) y se agrega como una
      // barra nueva a la cola — estilo WhatsApp, crece y se desplaza.
      let actx = null, waveTimer = null, analyser = null, data = null;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        actx = new AudioCtx();
        const source = actx.createMediaStreamSource(stream);
        analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
        const r0 = { analyser, data };
        waveTimer = setInterval(() => sampleWave(r0), 90);
      } catch (e) { /* Web Audio no disponible: se graba igual, solo sin la onda visual */ }

      recRef.current = { recorder, chunks, stream, timer, startedAt, actx, waveTimer, analyser, data };
      setRecSecs(0); setRecBars([]); setPaused(false); setRecording(true);
    } catch (e) { /* sin permiso de micrófono: no se puede grabar */ }
  };
  // Pausar/reanudar SIN perder lo grabado — estilo WhatsApp: el cronómetro y la
  // onda se congelan mientras está en pausa, y siguen exactos al reanudar
  // (startedAt se corre hacia adelante el tiempo que estuvo en pausa).
  const togglePause = () => {
    const r = recRef.current;
    if (!r || r.recorder.state === "inactive") return;
    if (r.recorder.state === "recording") {
      r.recorder.pause();
      clearInterval(r.timer);
      if (r.waveTimer) clearInterval(r.waveTimer);
      setPaused(true);
    } else if (r.recorder.state === "paused") {
      r.recorder.resume();
      const pausedElapsedMs = recSecs * 1000;
      r.startedAt = Date.now() - pausedElapsedMs;
      r.timer = setInterval(() => setRecSecs(Math.floor((Date.now() - r.startedAt) / 1000)), 250);
      if (r.analyser) r.waveTimer = setInterval(() => sampleWave(r), 90);
      setPaused(false);
    }
  };
  const stopRecording = (send) => new Promise((resolve) => {
    const r = recRef.current;
    if (!r) return resolve(null);
    clearInterval(r.timer);
    if (r.waveTimer) clearInterval(r.waveTimer);
    if (r.actx) r.actx.close().catch(() => {});
    r.recorder.onstop = () => {
      r.stream.getTracks().forEach(t => t.stop());
      const duration = Math.max(1, Math.round((Date.now() - r.startedAt) / 1000));
      resolve(send ? { blob: new Blob(r.chunks, { type: r.recorder.mimeType || "audio/webm" }), duration } : null);
    };
    // pausado no se puede detener directo en todos los navegadores sin antes
    // reanudar — reanuda un instante (silencioso, ya no se usa esa onda) y detiene.
    if (r.recorder.state === "paused") r.recorder.resume();
    r.recorder.stop();
  });
  const cancelRecording = async () => { await stopRecording(false); setRecording(false); setPaused(false); recRef.current = null; };
  const finishRecording = async () => {
    const res = await stopRecording(true);
    setRecording(false); setPaused(false); recRef.current = null;
    if (res && res.blob.size > 0) onSendVoice(res.blob, res.duration);
  };
  const fmtRec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (blocked) return (
    <div style={{ padding: "10px 14px calc(10px + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid ${B}`, flexShrink: 0 }}>
      <input disabled placeholder="Mensajes no disponibles" style={{ width: "100%", background: S, border: `1px solid ${B}`, borderRadius: 50, padding: "10px 15px", color: T3, fontSize: 13, outline: "none", opacity: .6 }} />
    </div>
  );

  return (
    <div style={{ borderTop: `1px solid ${B}`, flexShrink: 0 }}>
      {/* Adjunto PENDIENTE (estilo WhatsApp: la miniatura antes de mandarla) — se
          pierde sin problema si se sale sin enviar; al enviar viaja DENTRO del
          único mensaje real (meta:{type,product_id,...}), nunca un panel aparte. */}
      {attachment && !editing && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: S }}>
          {attachment.image
            ? <img src={attachment.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
            : <div style={{ width: 40, height: 40, borderRadius: 9, background: "#8884", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{attachment.type === "service" ? "🛠️" : "🛍️"}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11.5, fontWeight: 800, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.title || "Producto"}</p>
            <p style={{ fontSize: 9.5, color: T3, marginTop: 1 }}>Se enviará con tu mensaje</p>
          </div>
          <button onClick={onCancelAttachment} style={{ background: "none", border: "none", color: T3, fontSize: 17, cursor: "pointer", padding: 4, flexShrink: 0 }}>×</button>
        </div>
      )}
      {replyTo && !editing && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 14px", background: S }}>
          <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: G }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10.5, fontWeight: 800, color: G }}>Respondiendo</p>
            <p style={{ fontSize: 11.5, color: T3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.preview}</p>
          </div>
          <button onClick={onCancelReply} style={{ background: "none", border: "none", color: T3, fontSize: 17, cursor: "pointer", padding: 4 }}>×</button>
        </div>
      )}
      {editing && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 14px", background: S }}>
          <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: G }} />
          <p style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: G }}>Editando mensaje</p>
          <button onClick={() => { onCancelEdit(); setDraft(""); }} style={{ background: "none", border: "none", color: T3, fontSize: 17, cursor: "pointer", padding: 4 }}>×</button>
        </div>
      )}
      {recording ? (
        <div style={{ padding: "8px 12px calc(8px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: S, border: `1px solid ${B}`, borderRadius: 50, padding: "8px 13px", height: 22 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: paused ? "none" : "blk 1.1s ease-in-out infinite", opacity: paused ? .4 : 1 }} />
            <span style={{ fontSize: 12.5, color: T1, fontWeight: 800, fontFamily: "var(--mo)", flexShrink: 0 }}>{fmtRec(recSecs)}</span>
            {/* Onda real del volumen del micrófono (AnalyserNode) — cada barra es
                una muestra real tomada mientras se graba, no una animación de relleno. */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 2, height: 24, overflow: "hidden" }}>
              {recBars.length === 0
                ? <span style={{ fontSize: 10.5, color: T3 }}>{paused ? "En pausa…" : "Grabando…"}</span>
                : recBars.map((lv, i) => <span key={i} style={{ width: 2.5, minWidth: 2.5, borderRadius: 2, background: G, height: `${Math.max(3, Math.round(lv * 22))}px`, flexShrink: 0, transition: "height .07s linear" }} />)}
            </div>
          </div>
          {/* Tres controles, nuestros colores (dorado/negro) — nunca verde. */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 9 }}>
            <button onClick={cancelRecording} className="p" title="Cancelar" style={{ width: 44, height: 44, borderRadius: "50%", background: "none", border: `1px solid ${B}`, color: "#ef4444", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🗑️</button>
            <button onClick={togglePause} className="p" title={paused ? "Reanudar" : "Pausar"} style={{ width: 44, height: 44, borderRadius: "50%", background: S, border: `2px solid ${G}`, color: T1, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{paused ? "▶" : "⏸"}</button>
            <button onClick={finishRecording} className="p" title="Enviar" style={{ width: 44, height: 44, background: G, border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic n="send" c="#000" s={18} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: "8px 12px calc(8px + env(safe-area-inset-bottom, 0px))", display: "flex", gap: 9, alignItems: "center" }}>
          <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Escribe un mensaje..."
            style={{ flex: 1, minWidth: 0, background: S, border: `1px solid ${B}`, borderRadius: 50, padding: "10px 15px", color: T1, fontSize: 13, outline: "none" }} />
          {(draft.trim() || attachment)
            ? <button onClick={send} className="p" onPointerDown={e => e.preventDefault()}
                style={{ width: 42, height: 42, background: G, border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 10px rgba(255,192,30,.35)" }}>
                <Ic n="send" c="#000" s={20} />
              </button>
            : <button onClick={startRecording} disabled={!!editing} title="Grabar nota de voz" className="p" onPointerDown={e => e.preventDefault()}
                style={{ width: 42, height: 42, background: S, border: `2px solid ${editing ? T3 : G}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: editing ? .4 : 1, cursor: editing ? "default" : "pointer" }}>
                <MicGlyph isDark={isDark} />
              </button>}
        </div>
      )}
    </div>
  );
});

// ── Burbuja de un mensaje individual — componente propio para que los hooks de
// gesto se llamen en su propio nivel superior, NUNCA dentro de un .map().
function MessageBubble({ m, mine, isDark, B, T1, T3, CARD, orders, onOpenOrder, onOpenProduct, onStartOrder, themeHex, themeText, msgReactions, meId, isHighlighted, selected, selectionMode, showQuickBar, onLongPress, onTap, onSwipeReply, onJumpTo, onReact, onRetry, autoPlayVoice, onVoiceEnded, onVoiceFirstPlay }) {
  const soft = isDark ? "#141417" : "#f1f5f9";
  const meta = m.meta && typeof m.meta === "object" ? m.meta : null;
  const isVoice = meta?.type === "voice";
  const isReply = meta?.reply_to;
  // Estando en modo selección, un toque corto añade/quita este mensaje de la
  // selección (WhatsApp). Fuera del modo, el toque corto no hace nada especial
  // (los enlaces/tarjetas internas siguen funcionando como siempre).
  const gesture = useMessageGesture({
    onLongPress,
    onTap: selectionMode ? onTap : null,
    onSwipeReply,
    disabled: !!meta && meta.type === "order" && !(m.text || "").trim(),
  });
  const myReaction = (msgReactions.find(r => r.user_id === meId) || {}).emoji || null;

  // Tarjeta de PEDIDO automática (sin texto del usuario): centrada, en vivo — sin
  // gestos (no es un mensaje de texto que se pueda responder/reaccionar así).
  if (meta?.type === "order" && !(m.text || "").trim()) {
    return <div id={`msg-${m.id}`}><OrderChatCard meta={meta} orders={orders} onOpenOrder={onOpenOrder} B={B} T1={T1} T3={T3} soft={soft} /></div>;
  }
  const openRef = (meta && (meta.type === "order" || meta.type === "product" || meta.type === "service")) ? () => {
    if (meta.type === "order") onOpenOrder && onOpenOrder(meta.order_id || meta.id);
    else onOpenProduct && onOpenProduct(meta.product_id ?? meta.id);
  } : null;
  const bubbleBg = mine ? themeHex : CARD;
  const bubbleText = mine ? themeText : T1;
  const bubbleTx2 = mine ? (themeText === "#000" ? "#00000066" : "#ffffffaa") : T3; // hora/ticks, subdued
  // Quita el menú NATIVO del navegador (selección de texto / "buscar con
  // Google...") al mantener presionado, en toda la burbuja — el gesto propio
  // (useMessageGesture) ya maneja pointerdown/up y previene el contextmenu;
  // esto además evita que el SO dispare su propia selección de texto encima.
  const noNativeSelect = { userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" };
  // Palomitas — SIEMPRE azul fijo (READ_BLUE) en "leído", nunca el color de
  // chat elegido: así no se pierden contra ningún tema. Enviando/fallido tienen
  // su propio ícono en vez de palomita.
  const ticks = mine ? (
    m._sending ? <span style={{ opacity: .7 }}> 🕓</span>
    : m._failed ? null
    : m.read_at ? <span style={{ color: READ_BLUE, fontWeight: 800 }}> ✓✓</span>
    : m.delivered_at ? <span> ✓✓</span>
    : <span> ✓</span>
  ) : null;
  return (
    <div id={`msg-${m.id}`} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", padding: "3px 4px", margin: "-3px -4px", paddingRight: selectionMode ? 28 : 4, borderRadius: 12, background: selected ? `${G}26` : "transparent", position: "relative", zIndex: selectionMode ? 15 : "auto", transition: "background .15s, padding-right .15s", ...noNativeSelect }}>
      {/* Marca de selección: pegada al borde derecho de la FILA (no de la burbuja),
          para que nunca quede cortada fuera de la pantalla. La fila reserva el
          espacio con paddingRight mientras dura el modo selección. */}
      {selectionMode && (
        <div style={{ position: "absolute", top: "50%", right: 2, transform: "translateY(-50%)", width: 19, height: 19, borderRadius: "50%", border: `2px solid ${selected ? G : (isDark ? "#555" : "#bbb")}`, background: selected ? G : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#000", zIndex: 2 }}>
          {selected ? "✓" : ""}
        </div>
      )}
      {/* La tira de reacciones solo aparece con UN mensaje elegido — con varios
          seleccionados se ofrecen únicamente las acciones en lote (como WhatsApp). */}
      {showQuickBar && (
        <QuickReactionBar current={myReaction} onPick={(e) => onReact(m.id, e)} onOpenFull={() => onReact(m.id, "__FULL__")} mine={mine} CARD={CARD} B={B} isDark={isDark} />
      )}
      <div style={{ position: "relative", maxWidth: "78%" }}>
        {gesture.dx > 4 && (
          <div style={{ position: "absolute", top: "50%", left: -34, transform: "translateY(-50%)", opacity: Math.min(1, gesture.dx / 42), fontSize: 17 }}>↩️</div>
        )}
        {/* display:inline-block — la burbuja se ajusta al ANCHO real del
            contenido (nunca estirada de más), y crea su propio contexto de
            bloque para que la hora "flotada" adentro se recorte bien. */}
        <div {...gesture.handlers} style={{ touchAction: "pan-y", display: "inline-block", maxWidth: "100%", background: bubbleBg, opacity: m._sending ? .75 : 1, border: mine ? "none" : `1px solid ${B}`, borderRadius: mine ? "20px 20px 6px 20px" : "20px 20px 20px 6px", padding: "10px 13px", transform: gesture.dx ? `translateX(${gesture.dx}px)` : "none", transition: gesture.dragging ? "none" : "transform .25s cubic-bezier(.34,1.56,.64,1), outline .3s, box-shadow .3s, opacity .2s", outline: isHighlighted ? `2px solid ${G}` : "none", outlineOffset: 2, boxShadow: isHighlighted ? `0 0 0 5px ${G}22` : "none" }}>
          {isReply && <ReplyStrip meta={meta} mine={mine} isDark={isDark} onJump={() => onJumpTo(meta.reply_to)} />}
          {meta && (meta.type === "product" || meta.type === "service" || meta.type === "order" || meta.type === "admin_request") && <RefChatCard meta={meta} onOpen={openRef} onStartOrder={onStartOrder} orders={orders} B={mine ? "#00000022" : B} T1={mine ? bubbleText : T1} T3={mine ? bubbleTx2 : T3} soft={mine ? "#ffffff40" : soft} />}
          {isVoice ? (
            <>
              <VoiceMessage meta={meta} mine={mine} isDark={isDark} T1={bubbleText} T3={T3} accentBg={mine ? "#00000022" : `${G}33`} autoPlay={autoPlayVoice} onEnded={onVoiceEnded} onFirstPlay={onVoiceFirstPlay} />
              <p style={{ fontSize: 9, color: bubbleTx2, marginTop: 4, textAlign: "right" }}>
                {new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                {ticks}
              </p>
            </>
          ) : (
            // Hora dentro de la MISMA burbuja, en la esquina inferior derecha del
            // texto (no una línea aparte) — el span "flota" a la derecha dentro del
            // párrafo, así el texto se acomoda alrededor en vez de dejarla suelta.
            <p style={{ fontSize: 12, color: bubbleText, lineHeight: 1.5, wordBreak: "break-word", margin: 0, ...noNativeSelect }}>
              {m.text}
              <span style={{ float: "right", clear: "both", marginLeft: 8, marginTop: 4, fontSize: 9, color: bubbleTx2, whiteSpace: "nowrap" }}>
                {m.edited_at && <span style={{ fontStyle: "italic" }}>Editado · </span>}
                {new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                {ticks}
              </span>
            </p>
          )}
        </div>
        {/* Envío optimista: aparece YA al tocar enviar; si falla, aviso claro
            con reintento — nunca se pierde en silencio. */}
        {m._failed && (
          <button onClick={() => onRetry && onRetry(m)} className="p" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, background: "none", border: "none", padding: 0, cursor: "pointer", alignSelf: mine ? "flex-end" : "flex-start" }}>
            <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>⚠️ No se pudo enviar · Reintentar</span>
          </button>
        )}
      </div>
      <ReactionsRow list={msgReactions} meId={meId} mine={mine} onToggle={(emoji) => onReact(m.id, emoji)} />
    </div>
  );
}

export function ChatScreen({ chat, user, onBack, flash, onViewProfile, orders = [], onOpenOrder, onOpenProduct, onStartOrder, onConvId }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const [convId,    setConvId]    = useState(chat.id || chat.key || null);
  // Avisa al padre qué conversación está EN PANTALLA ahora mismo (para que, si llega
  // una notificación de mensaje de esta MISMA conversación, no sume ruido extra: el
  // usuario ya la está viendo).
  useEffect(() => { onConvId && onConvId(convId || null); }, [convId, onConvId]);
  const [msgs,      setMsgs]      = useState([]);
  const [reactions, setReactions] = useState({}); // { [messageId]: [{id,user_id,emoji}] }
  // Reproducción en cadena de audios: cuando un mensaje de voz termina, si el
  // SIGUIENTE mensaje también es un audio, se reproduce solo. Este id le dice
  // a ESE VoiceMessage puntual que le toca arrancar.
  const [autoPlayId, setAutoPlayId] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [otherName, setOtherName] = useState(chat.otherName || chat.name || null);
  const [blocked,   setBlocked]   = useState(false);
  const [chatOpts,  setChatOpts]  = useState(false);
  // MODO SELECCIÓN (estilo WhatsApp): mantener presionado entra al modo con ese
  // mensaje marcado; estando dentro, tocar otros los añade/quita. Lista vacía =
  // fuera del modo. (Se declara aquí arriba, junto a su estado, porque varios
  // manejadores de más abajo dependen de clearSelection.)
  const [selectedIds, setSelectedIds] = useState([]);
  const selectionMode = selectedIds.length > 0;
  const clearSelection = useCallback(() => setSelectedIds([]), []);
  const enterSelection = useCallback((id) => setSelectedIds([id]), []);
  // Tocar un mensaje ESTANDO en modo selección lo añade/quita. Si se quita el
  // último, la lista queda vacía y se sale del modo solo (forma "b" de salir).
  const toggleSelected = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  // Forma "c" de salir: el botón ATRÁS del teléfono cancela la selección en vez
  // de cerrar el chat. Se registra como una capa más del back-stack de la app
  // (mismo mecanismo que el visor de fotos o el perfil flotante), así que solo
  // intercepta el atrás mientras hay algo seleccionado; sin selección, el atrás
  // cierra el chat como siempre.
  useEffect(() => {
    if (!selectionMode) return;
    return pushBackHandler(() => clearSelection());
  }, [selectionMode, clearSelection]);
  const [emojiPickerFor, setEmojiPickerFor] = useState(null); // id de mensaje con selector completo abierto
  const [replyTo,   setReplyTo]   = useState(null);   // { id, preview }
  const [forwardMsgs, setForwardMsgs] = useState([]); // mensajes a reenviar (abre el picker de conversaciones)
  const [editing,   setEditing]   = useState(null);   // mensaje que se está editando
  const [highlightId, setHighlightId] = useState(null);
  // ADJUNTO pendiente (estilo WhatsApp: la miniatura antes de mandarla): si el
  // chat se abrió desde "Mensaje" en un producto/servicio, esto es lo que se
  // ve sobre el campo de escribir. Se limpia al enviar (viaja DENTRO del único
  // mensaje real, meta:{type,product_id,...}) o se pierde sin problema si se
  // sale sin enviar. CAMBIO DE ARQUITECTURA: ya NO existe ningún panel fijo
  // que se re-derive del historial al reabrir el chat — esa era la causa raíz
  // de las tarjetas fantasma. Reabrir un chat viejo solo muestra mensajes ya
  // enviados, como cualquier otro; no hace falta ninguna comprobación extra.
  const [ctx, setCtx] = useState(chat.context || null);
  const [showTrust, setShowTrust] = useState(false);
  // "Estilo de chat" — color real y persistente (profiles.chat_theme), se
  // aplica SOLO al fondo de MIS burbujas. Se carga una vez al abrir el chat.
  const [chatTheme, setChatTheme] = useState("dorado");
  const [themePicker, setThemePicker] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    supabase.from("profiles").select("chat_theme").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (alive && data?.chat_theme && CHAT_THEMES.some(t => t.key === data.chat_theme)) setChatTheme(data.chat_theme); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user?.id]);
  const themeHex = (CHAT_THEMES.find(t => t.key === chatTheme) || CHAT_THEMES[0]).hex;
  const themeText = textColorFor(themeHex);
  const changeChatTheme = useCallback(async (key) => {
    setChatTheme(key); setThemePicker(false); setChatOpts(false);
    try { await supabase.rpc("save_profile_all", { p_chat_theme: key }); flash("🎨 Estilo de chat guardado"); }
    catch (e) { flash("⚠️ No se pudo guardar el estilo"); }
  }, [flash]);
  const scrollRef = useRef(null);
  const subRef = useRef(null);
  const convIdRef = useRef(convId);
  const msgsRef = useRef(msgs);
  useEffect(() => { msgsRef.current = msgs; }, [msgs]);
  // Teclado: NADA de visualViewport ni cálculos por dispositivo. Con el meta
  // viewport interactive-widget=resizes-content (estándar), el navegador encoge
  // el área visible al abrir el teclado y este flex-column (altura 100%) se
  // adapta solo: el input, al final del flujo, queda justo encima del teclado.
  // Solo bajamos el scroll al último mensaje cuando cambia el tamaño visible.
  useEffect(() => {
    const onResize = () => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Baja el scroll al final SIN mover el foco del input (no usamos scrollIntoView).
  const scrollToEnd = useCallback(() => {
    setTimeout(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, 40);
  }, []);

  // Salta a un mensaje del historial (respuesta citada, o el más nuevo si se
  // abrió desde una notificación) y lo resalta brevemente.
  const jumpToMessage = useCallback((id) => {
    setTimeout(() => {
      const el = document.getElementById("msg-" + id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(id);
      setTimeout(() => setHighlightId(cur => cur === id ? null : cur), 1600);
    }, 60);
  }, []);

  // Nombre real de la otra persona (profiles.full_name) — SIEMPRE se resuelve
  // por id, sin importar qué nombre haya llegado por props (podía ser un texto
  // escrito a mano en un formulario, o un genérico tipo "Vendedor"/"Comprador").
  // Antes solo se buscaba si NO había llegado ningún nombre, así que un nombre
  // erróneo pasado por props se quedaba pegado para siempre.
  useEffect(() => {
    if (chat.otherId) getUserName(chat.otherId).then(n => n && setOtherName(n)).catch(() => {});
  }, [chat.otherId]);

  // Estado de bloqueo REAL (mutuo): consulta best-effort al abrir el chat, para
  // deshabilitar el input sin esperar a que falle un envío.
  useEffect(() => {
    if (!user?.id || !chat.otherId) return;
    let a = true;
    isBlockedPair(user.id, chat.otherId).then(b => { if (a) setBlocked(b); }).catch(() => {});
    return () => { a = false; };
  }, [user?.id, chat.otherId]);

  // HISTORIAL SIEMPRE: si el chat se abrió sin id de conversación (desde un
  // producto, una entrega…), resolvemos la conversación por la otra persona
  // (get_or_create_conversation devuelve la existente si ya hay) y cargamos los
  // mensajes DE INMEDIATO — nunca un chat "en blanco" si ya había conversación.
  useEffect(() => {
    if (convId || !chat.otherId || !user?.id) { if (!convId) setLoading(false); return; }
    let a = true;
    supabase.rpc("get_or_create_conversation", { p_other: chat.otherId }).then(({ data, error }) => {
      if (!a) return;
      if (error || !data) { setLoading(false); return; }
      const cid = typeof data === "string" ? data : (data?.id || data);
      convIdRef.current = cid; setConvId(cid);
    }).catch(() => { if (a) setLoading(false); });
    return () => { a = false; };
  }, []);

  // Carga INICIAL de reacciones (solo lectura, al abrir la conversación o al
  // recargar la lista de mensajes). Después de ESCRIBIR nunca se recarga: el
  // estado se actualiza con lo que devuelve la RPC (ver handleReact). El número
  // de pedido evita que una carga inicial lenta pise datos más nuevos.
  const reactionsReqRef = useRef(0);
  const loadReactions = useCallback((ids) => {
    const myReq = ++reactionsReqRef.current;
    if (!ids.length) { if (myReq === reactionsReqRef.current) setReactions({}); return; }
    getReactionsForMessages(ids).then(rows => {
      if (myReq !== reactionsReqRef.current) return; // pedido viejo: se descarta
      const grouped = {};
      rows.forEach(r => { (grouped[r.message_id] ||= []).push(r); });
      setReactions(grouped);
    }).catch(() => {});
  }, []);

  // Aplica UNA reacción concreta al estado local, sin tocar la red: una persona
  // tiene como máximo una reacción por mensaje (así lo garantiza la clave
  // primaria de message_reactions), así que se reemplaza la suya y ya.
  // emoji = null → se le quita.
  const applyReaction = useCallback((messageId, userId, emoji) => {
    setReactions(prev => {
      const list = (prev[messageId] || []).filter(r => r.user_id !== userId);
      if (emoji) list.push({ message_id: messageId, user_id: userId, emoji });
      const next = { ...prev };
      if (list.length) next[messageId] = list; else delete next[messageId];
      return next;
    });
  }, []);

  const subscribe = useCallback(async (cid) => {
    const c = await getSB();
    if (!c) return;
    const sub = c.channel(`conv_${cid}`)
      // Mensaje NUEVO: si ya estaba (envío OPTIMISTA propio) lo reconcilia con
      // la fila real del servidor; si no, lo agrega. Si NO es mío y el chat
      // está abierto, marca "entregado" (mark_delivered, palomita ✓✓ gris) Y
      // "leído" (mark_conversation_read, ✓✓ azul) — ya lo estoy viendo en vivo.
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, payload => {
        const m = payload.new;
        setMsgs(prev => prev.some(x => x.id === m.id) ? prev.map(x => x.id === m.id ? { ...x, ...m, _sending: false, _failed: false } : x) : [...prev, m]);
        scrollToEnd();
        if (user?.id && m.sender_id !== user.id) { markDelivered(m.id).catch(() => {}); markRead(cid, user.id).catch(() => {}); }
      })
      // UPDATE (p.ej. read_at, text editado, o eliminado — deleted_at): actualizo
      // el mensaje en vivo, o lo quito de la lista si acaba de borrarse.
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, payload => {
        const m = payload.new;
        if (m.deleted_at) { setMsgs(prev => prev.filter(x => x.id !== m.id)); return; }
        setMsgs(prev => prev.map(x => x.id === m.id ? { ...x, ...m } : x));
      })
      // Reacciones de la OTRA persona — la tabla no tiene conversation_id, así
      // que se filtra en el cliente contra los mensajes YA cargados de este chat.
      // MIS propias reacciones NO se aplican aquí: ya quedaron en pantalla con lo
      // que devolvió la RPC. Reaccionar al eco de mi propia escritura era lo que
      // provocaba que la reacción "volviera atrás" sola.
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, payload => {
        const fresh = payload.new && Object.keys(payload.new).length ? payload.new : null;
        const row = fresh || payload.old;
        if (!row || !row.message_id) return;
        if (!msgsRef.current.some(m => m.id === row.message_id)) return;
        if (row.user_id === user?.id) return;                 // eco de lo mío: ignorar
        applyReaction(row.message_id, row.user_id, fresh ? fresh.emoji : null);
      })
      .subscribe();
    subRef.current = sub;
  }, [scrollToEnd, user?.id, applyReaction]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!convId) { setLoading(false); return; }
      const data = await loadMessages(convId);
      if (!alive) return;
      setMsgs(data); setLoading(false); scrollToEnd();
      loadReactions(data.map(m => m.id));
      if (user?.id) markRead(convId, user.id).catch(() => {});
      subscribe(convId);
      // Abierto desde una notificación de mensaje: resalta el más nuevo (es,
      // en la inmensa mayoría de los casos, justo el que la generó).
      if (chat.focusLatest && data.length) jumpToMessage(data[data.length - 1].id);
    })();
    return () => { alive = false; if (subRef.current) getSB().then(c => c?.removeChannel(subRef.current)).catch(() => {}); };
  }, [convId]);

  // Aviso de confianza — UNA sola vez por conversación (marcado en localStorage
  // por otherId+producto, estable aunque el convId todavía no exista al abrir
  // el chat por primera vez). Es un mensaje de SISTEMA, no de ninguna de las
  // dos personas — nunca se guarda en `messages`, solo se pinta. Depende del
  // adjunto FRESCO (ctx) — nunca se re-deriva del historial al reabrir.
  useEffect(() => {
    if (loading || !ctx || !chat.otherId) return;
    const key = `retador_trust_${chat.otherId}_${ctx.type}_${ctx.id}`;
    try {
      if (!localStorage.getItem(key)) { localStorage.setItem(key, "1"); setShowTrust(true); }
    } catch (e) { setShowTrust(true); }
  }, [loading, ctx, chat.otherId]);

  // Envío OPTIMISTA de verdad: el mensaje aparece YA (con un id generado en el
  // cliente) antes de que el servidor confirme nada — estado sutil "enviando"
  // (🕓) mientras tanto. Si falla, se marca como fallido con un aviso claro y
  // reintentable (ver MessageBubble); si el realtime trae la fila real con el
  // MISMO id, se reconcilia en vez de duplicarse.
  const doSend = useCallback(async (text, meta, existingId = null) => {
    if (!text || !user?.id || blocked) return;
    const localId = existingId || crypto.randomUUID();
    setMsgs(prev => {
      const optimistic = { id: localId, conversation_id: convIdRef.current || "pending", sender_id: user.id, text, meta, created_at: new Date().toISOString(), read_at: null, delivered_at: null, _sending: true, _failed: false };
      return prev.some(x => x.id === localId) ? prev.map(x => x.id === localId ? optimistic : x) : [...prev, optimistic];
    });
    scrollToEnd();
    try {
      const cid = await sendMessage(user.id, chat.otherId, text, meta, localId);
      setMsgs(prev => prev.map(x => x.id === localId ? { ...x, _sending: false } : x));
      if (!convIdRef.current) { convIdRef.current = cid; setConvId(cid); }
      trackEvent(user.id, null, "chat").catch(() => {});
    } catch (e) {
      setMsgs(prev => prev.map(x => x.id === localId ? { ...x, _sending: false, _failed: true } : x));
      if (isBlockSendError(e)) { setBlocked(true); flash("🚫 No puedes enviar mensajes a este usuario"); }
      else if (e.message?.includes("rate limit")) flash("⚠️ Estás enviando demasiados mensajes");
    }
  }, [user?.id, blocked, chat.otherId, flash]);

  // onSend estable: no depende del borrador (lo maneja ChatInput), así el input
  // no se recrea. El adjunto pendiente (ctx) viaja DENTRO de este único mensaje
  // — meta:{type,product_id,...}, mismo patrón que las tarjetas de pedido.
  const handleSend = useCallback((text) => {
    const meta = ctx ? { type: ctx.type, product_id: ctx.id, title: ctx.title || "", image: ctx.image || null, price: ctx.price ?? null, currency: ctx.currency || null }
      : replyTo ? { reply_to: replyTo.id, reply_preview: replyTo.preview } : null;
    // Sin texto escrito pero CON adjunto: el producto ES el mensaje.
    const finalText = (text && text.trim()) ? text.trim() : (ctx ? `🛍️ ${ctx.title || "Producto"}` : text);
    if (ctx) setCtx(null);
    if (replyTo) setReplyTo(null);
    doSend(finalText, meta);
  }, [ctx, replyTo, doSend]);

  const retrySend = useCallback((m) => { doSend(m.text, m.meta, m.id); }, [doSend]);

  const handleSendVoice = useCallback(async (blob, duration) => {
    if (!user?.id || blocked) return;
    try {
      const path = await uploadVoiceNote(blob, user.id);
      const cid = await sendMessage(user.id, chat.otherId, "🎤 Mensaje de voz", { type: "voice", audio_path: path, duration });
      if (!convIdRef.current) { convIdRef.current = cid; setConvId(cid); }
      else { loadMessages(cid).then(d => { setMsgs(d); scrollToEnd(); loadReactions(d.map(m => m.id)); }).catch(() => {}); }
    } catch (e) {
      if (isBlockSendError(e)) { setBlocked(true); flash("🚫 No puedes enviar mensajes a este usuario"); }
      else flash("❌ No se pudo enviar la nota de voz");
    }
  }, [user?.id, blocked, chat.otherId, flash]);

  const handleSaveEdit = useCallback(async (text) => {
    if (!editing) return;
    try {
      const updated = await editMessage(editing.id, text);
      setMsgs(prev => prev.map(x => x.id === editing.id ? { ...x, ...updated } : x));
      setEditing(null);
    } catch (e) { flash("❌ No se pudo editar el mensaje"); }
  }, [editing, flash]);

  // Reenviar: crea un mensaje NUEVO con el mismo contenido (texto, o el mismo
  // audio_path si es nota de voz) en cada conversación elegida — un insert
  // normal a messages, igual que enviar cualquier mensaje. Se quita reply_to
  // del meta copiado (esa cita no existe/no aplica en la conversación destino).
  // Admite VARIOS mensajes a la vez (selección múltiple), en su orden original.
  const handleForwardTo = useCallback(async (otherIds) => {
    if (!forwardMsgs.length || !user?.id || !otherIds.length) return;
    const lote = forwardMsgs;
    setForwardMsgs([]);
    let ok = 0;
    for (const otherId of otherIds) {
      for (const fm of lote) {
        const meta = fm.meta && typeof fm.meta === "object" ? fm.meta : null;
        const cleanMeta = meta ? { ...meta } : null;
        if (cleanMeta) { delete cleanMeta.reply_to; delete cleanMeta.reply_preview; }
        const text = (fm.text && fm.text.trim())
          ? fm.text
          : (meta?.type === "voice" ? "🎤 Mensaje de voz" : (meta?.title ? "🛍️ " + meta.title : "Mensaje reenviado"));
        try { await sendMessage(user.id, otherId, text, cleanMeta); ok++; } catch (e) {}
      }
    }
    flash(ok ? `↪️ Reenviado (${ok})` : "❌ No se pudo reenviar");
  }, [forwardMsgs, user?.id, flash]);

  // Eliminar: admite varios a la vez (solo los MÍOS — el backend igual rechaza
  // los ajenos, pero la barra ya solo ofrece Eliminar si toda la selección es mía).
  const handleDelete = useCallback(async (msgList) => {
    const lote = Array.isArray(msgList) ? msgList : [msgList];
    clearSelection();
    let ok = 0;
    for (const m of lote) {
      try { await deleteMessage(m.id); setMsgs(prev => prev.filter(x => x.id !== m.id)); ok++; } catch (e) {}
    }
    if (ok < lote.length) flash("❌ No se pudieron eliminar todos los mensajes");
  }, [flash, clearSelection]);

  const handleToggleBlock = useCallback(async () => {
    if (!chat.otherId) return;
    setChatOpts(false);
    try {
      const nowBlocked = await toggleBlockUser(chat.otherId);
      setBlocked(prev => (typeof nowBlocked === "boolean" ? nowBlocked : !prev));
      flash((typeof nowBlocked === "boolean" ? nowBlocked : !blocked) ? "🚫 Usuario bloqueado" : "Usuario desbloqueado");
    } catch (e) { flash("❌ No se pudo actualizar el bloqueo"); }
  }, [chat.otherId, blocked, flash]);

  // Reaccionar: UNA sola llamada atómica al backend (set_reaction). El backend
  // decide poner / cambiar / quitar y devuelve el emoji resultante (o null). El
  // estado local se actualiza con ESA respuesta — nunca se recarga la lista
  // después de escribir. "__FULL__" abre el selector completo en vez de
  // reaccionar directo.
  const handleReact = useCallback(async (messageId, emoji) => {
    if (!user?.id) return;
    if (emoji === "__FULL__") { setEmojiPickerFor(messageId); return; }
    setSelectedIds([]); setEmojiPickerFor(null);
    try {
      const result = await setReaction(messageId, emoji); // emoji nuevo o null
      applyReaction(messageId, user.id, result);
    } catch (e) { flash("❌ No se pudo reaccionar"); }
  }, [user?.id, applyReaction, flash]);

  const displayName = otherName || "Usuario";
  const openProfile = () => { if (onViewProfile && chat.otherId) onViewProfile(chat.otherId); };
  const previewOf = (m) => {
    const meta = m.meta && typeof m.meta === "object" ? m.meta : null;
    if (meta?.type === "voice") return "🎤 Mensaje de voz";
    if (meta?.type === "product" || meta?.type === "order") return (meta.title ? "🛍️ " + meta.title : (m.text || "").slice(0, 50));
    if (meta?.type === "service") return (meta.title ? "🛠️ " + meta.title : (m.text || "").slice(0, 50));
    return (m.text || "").slice(0, 50);
  };
  // Mensajes seleccionados, en el ORDEN en que están en el chat (no en el que se
  // fueron tocando) — importa al reenviar y al eliminar en lote.
  const selectedMsgs = selectedIds.length ? msgs.filter(m => selectedIds.includes(m.id)) : [];
  const oneSelected = selectedMsgs.length === 1 ? selectedMsgs[0] : null;
  const allMine = selectedMsgs.length > 0 && selectedMsgs.every(m => m.sender_id === user?.id);
  const isSelectedTextMsg = oneSelected ? !(oneSelected.meta && typeof oneSelected.meta === "object" && (oneSelected.meta.type === "voice" || oneSelected.meta.type === "admin_request")) : false;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {selectionMode ? (
        <SelectionTopBar
          count={selectedMsgs.length}
          allMine={allMine}
          isTextMsg={isSelectedTextMsg}
          onClose={clearSelection}
          onReply={oneSelected ? () => { setReplyTo({ id: oneSelected.id, preview: previewOf(oneSelected) }); setEditing(null); clearSelection(); } : null}
          onForward={() => { setForwardMsgs(selectedMsgs); clearSelection(); }}
          onEdit={oneSelected && allMine && isSelectedTextMsg ? () => { setEditing(oneSelected); setReplyTo(null); clearSelection(); } : null}
          onDelete={allMine ? () => handleDelete(selectedMsgs) : null}
          S={S} B={B} T1={T1} isDark={isDark}
        />
      ) : (
        <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c={T2} s={20} /></button>
          <div onClick={openProfile} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: onViewProfile && chat.otherId ? "pointer" : "default" }}>
            <AvatarUser userId={chat.otherId} name={displayName} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 800, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
              <p style={{ fontSize: 10, color: blocked ? "#F87171" : (onViewProfile && chat.otherId ? G : "#22C55E"), marginTop: 1, fontWeight: 600 }}>{blocked ? "🚫 Bloqueado" : (onViewProfile && chat.otherId ? "Ver perfil ›" : "● Activo")}</p>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setChatOpts(o => !o)} style={{ background: "none", border: "none", color: T2, fontSize: 19, cursor: "pointer", lineHeight: 1 }}>⋯</button>
          </div>
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px clamp(18px,3vw,48px)", display: "flex", flexDirection: "column", gap: 7, position: "relative", ...chatBgStyle(isDark) }}>
        {/* Forma "a" de salir del modo selección: tocar en cualquier parte fuera
            de los mensajes cancela la selección (sin forzar a elegir reacción).
            Los mensajes SELECCIONADOS quedan por encima de este velo (z-index
            propio en MessageBubble); los no seleccionados quedan debajo, así que
            tocarlos también cancela — salvo que se toquen "a través" del modo
            selección, que es justo lo que hace onTap más abajo. */}
        {selectionMode && (
          <div onClick={clearSelection} style={{ position: "absolute", inset: 0, background: isDark ? "rgba(0,0,0,.45)" : "rgba(0,0,0,.25)", zIndex: 10 }} />
        )}
        {/* Aviso de confianza — mensaje de SISTEMA (no de ninguna de las dos
            personas), una sola vez por conversación originada en un producto/servicio. */}
        {showTrust && (
          <div style={{ display: "flex", justifyContent: "center", margin: "2px 0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: "92%", background: isDark ? "rgba(255,192,30,.09)" : "rgba(180,130,0,.09)", border: `1px solid ${G}40`, borderRadius: 13, padding: "9px 14px" }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>🛡️</span>
              <p style={{ fontSize: 10.5, color: T2, lineHeight: 1.4 }}>Coordina y compra dentro de RETADOR — así quedas respaldado. Evita acordar fuera de la plataforma.</p>
            </div>
          </div>
        )}
        {loading
          ? <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}><Spin size={22} /></div>
          : msgs.length === 0
            ? <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ fontSize: 11, color: T3 }}>Sé el primero en escribir</p>
              </div>
            : msgs.map((m, i) => {
                const next = msgs[i + 1];
                const nextIsVoice = next?.meta && typeof next.meta === "object" && next.meta.type === "voice";
                return (
                  <MessageBubble key={m.id} m={m} mine={m.sender_id === user?.id} isDark={isDark} B={B} T1={T1} T3={T3} CARD={CARD}
                    orders={orders} onOpenOrder={onOpenOrder} onOpenProduct={onOpenProduct} onStartOrder={onStartOrder}
                    themeHex={themeHex} themeText={themeText}
                    msgReactions={reactions[m.id] || []} meId={user?.id} isHighlighted={highlightId === m.id}
                    selected={selectedIds.includes(m.id)} selectionMode={selectionMode} showQuickBar={oneSelected?.id === m.id}
                    onLongPress={() => enterSelection(m.id)} onTap={() => toggleSelected(m.id)}
                    onSwipeReply={() => setReplyTo({ id: m.id, preview: previewOf(m) })}
                    onJumpTo={jumpToMessage} onReact={handleReact} onRetry={retrySend}
                    autoPlayVoice={autoPlayId === m.id}
                    onVoiceEnded={() => { if (nextIsVoice) setAutoPlayId(next.id); }}
                    onVoiceFirstPlay={() => { if (m.sender_id !== user?.id && convIdRef.current && user?.id) markRead(convIdRef.current, user.id).catch(() => {}); }} />
                );
              })
        }
      </div>

      <ChatInput
        onSend={handleSend} onSendVoice={handleSendVoice} blocked={blocked} S={S} B={B} T1={T1} T3={T3} isDark={isDark} initialDraft={chat.draft || ""}
        replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
        editing={editing} onSaveEdit={handleSaveEdit} onCancelEdit={() => setEditing(null)}
        attachment={ctx} onCancelAttachment={() => setCtx(null)}
      />

      {emojiPickerFor && (
        <EmojiPickerModal
          CARD={CARD} B={B} T1={T1} T2={T2} isDark={isDark}
          onClose={() => setEmojiPickerFor(null)}
          onPick={(e) => handleReact(emojiPickerFor, e)}
        />
      )}

      {forwardMsgs.length > 0 && (
        <ForwardPickerModal
          count={forwardMsgs.length}
          user={user} CARD={CARD} B={B} T1={T1} T2={T2} T3={T3} isDark={isDark}
          onClose={() => setForwardMsgs([])}
          onConfirm={handleForwardTo}
        />
      )}

      {/* Menú "⋮" (Bloquear/Reportar) — renderizado como HERMANO DE TOPE, fuera de
          cualquier envoltura intermedia: un bug real encontrado en verificación
          mostraba los mensajes pintándose POR ENCIMA del menú al desplazar el
          chat, aunque el menú tuviera z-index mayor — un div de un mensaje
          (position:relative, z-index:auto) dentro del contenedor con scroll
          terminaba compitiendo por encima de un position:fixed anidado más
          adentro del árbol. Sacarlo a este nivel (mismo nivel que los otros
          modales) lo deja sin ambigüedad, siempre arriba de todo. Un overlay
          invisible a pantalla completa cierra el menú al tocar CUALQUIER parte
          fuera de él (no solo re-tocando "⋯"). */}
      {chatOpts && <>
        <div onClick={() => setChatOpts(false)} style={{ position: "fixed", inset: 0, zIndex: 5150 }} />
        <div style={{ position: "fixed", top: "calc(11px + env(safe-area-inset-top, 0px) + 46px)", right: 14, background: CARD, border: `1px solid ${B}`, borderRadius: 12, boxShadow: isDark ? "0 8px 24px rgba(0,0,0,.35)" : "0 8px 24px rgba(0,0,0,.18)", overflow: "hidden", zIndex: 5151, minWidth: 170 }}>
          <button onClick={() => { setChatOpts(false); setThemePicker(true); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: T1, cursor: "pointer" }}>🎨 Estilo de chat</button>
          <button onClick={handleToggleBlock} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${B}`, padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: T1, cursor: "pointer" }}>{blocked ? "Desbloquear usuario" : "Bloquear usuario"}</button>
          <button onClick={() => { setChatOpts(false); flash("Reporte enviado al equipo de RETADOR"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${B}`, padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>Reportar usuario</button>
        </div>
      </>}

      {themePicker && (
        <ChatThemePickerModal current={chatTheme} onPick={changeChatTheme} onClose={() => setThemePicker(false)} CARD={CARD} B={B} T1={T1} T2={T2} isDark={isDark} />
      )}
    </div>
  );
}
