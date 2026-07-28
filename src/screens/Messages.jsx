import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, memo } from "react";
import { Avatar, AvatarUser, G, Ic, ORDER_FLOW, Spin, getMyConversations, getSB, getUserName, getProductById, isBlockedPair, isBlockSendError, toggleBlockUser, editMessage, deleteMessage, uploadVoiceNote, voiceNoteSignedUrl, toggleReaction, getReactionsForMessages, loadMessages, markRead, money, sendMessage, supabase, trackEvent, useAt, useR } from "../shared/index.js";

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
function useMessageGesture({ onLongPress, onSwipeReply, disabled }) {
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
function RefChatCard({ meta, onOpen, orders = [], B, T1, T3, soft }) {
  const price = meta.price != null && meta.price !== "" ? money(Number(meta.price) || 0, meta.currency || "USD") : null;
  const isAdminReq = meta.type === "admin_request";
  const isOrder = meta.type === "order";
  const isProduct = meta.type === "product";

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

  const [avail, setAvail] = useState(isProduct ? "checking" : "ok"); // checking | ok | gone
  useEffect(() => {
    if (!isProduct || !meta.id) { setAvail("ok"); return; }
    let a = true;
    getProductById(meta.id).then(p => {
      if (!a) return;
      const unavailable = !p || (p.status && p.status !== "active") || (p.stock != null && Number(p.stock) <= 0);
      setAvail(unavailable ? "gone" : "ok");
    }).catch(() => { if (a) setAvail("ok"); });
    return () => { a = false; };
  }, [isProduct, meta.id]);

  if (isProduct && avail === "gone") {
    return (
      <div className="p" style={{ display: "flex", alignItems: "center", gap: 9, background: soft, border: `1px solid ${B}`, borderRadius: 12, padding: "7px 10px", marginBottom: 7, opacity: .55, maxWidth: 240, cursor: "default" }}>
        {meta.image
          ? <img src={meta.image} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0, filter: "grayscale(1)" }} />
          : <div style={{ width: 34, height: 34, borderRadius: 8, background: "#8884", flexShrink: 0 }} />}
        <p style={{ fontSize: 11, color: T3, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.title || "Producto"} · ya no disponible</p>
      </div>
    );
  }

  return (
    <div onClick={onOpen} className="p" style={{ display: "flex", alignItems: "center", gap: 12, background: soft, border: `1px solid ${B}`, borderRadius: 15, padding: "11px 13px", marginBottom: 7, cursor: onOpen ? "pointer" : "default", minWidth: 230, maxWidth: 300 }}>
      {meta.image
        ? <img src={meta.image} alt="" style={{ width: 68, height: 68, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
        : <div style={{ width: 68, height: 68, borderRadius: 12, background: "#8884", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{isOrder ? "📦" : isAdminReq ? "🪪" : "🛍️"}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 800, color: T1, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{meta.title || (isOrder ? "Pedido" : "Producto")}</p>
        {isAdminReq
          ? <p style={{ fontSize: 11.5, color: T3, marginTop: 4, fontWeight: 700 }}>{meta.subtitle || "Coordinando por chat"}</p>
          : <p style={{ fontSize: 11.5, color: T3, marginTop: 4, fontWeight: 700 }}>
              {price ? <span style={{ color: "#22C55E" }}>{price}</span> : (isOrder ? "Pedido" : "Producto")}
              {!isOrder && <span style={{ fontWeight: 600 }}> · Ver detalle ›</span>}
            </p>}
        {isOrder && statusLabel && (
          <p style={{ fontSize: 11.5, color: T1, marginTop: 5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            {statusIcon} {statusLabel}<span style={{ color: G, fontWeight: 700 }}> · Ver ›</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Reproductor de nota de voz ───────────────────────────────────────────────
function VoiceMessage({ meta, mine, isDark, T1, T3, accentBg }) {
  const [url, setUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const audioRef = useRef(null);
  useEffect(() => { let a = true; voiceNoteSignedUrl(meta.audio_path).then(u => { if (a) setUrl(u); }).catch(() => {}); return () => { a = false; }; }, [meta.audio_path]);
  const total = Number(meta.duration) || 0;
  const fmt = (s) => { const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, "0")}`; };
  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); } else { el.play().catch(() => {}); }
  };
  const trackBg = mine ? "#00000022" : (isDark ? "#ffffff22" : "#00000018");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190, padding: "3px 2px" }}>
      {url && <audio ref={audioRef} src={url} preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setCur(0); }}
        onTimeUpdate={e => setCur(e.target.currentTime)} />}
      <button onClick={toggle} disabled={!url} className="p" style={{ width: 34, height: 34, borderRadius: "50%", background: accentBg, border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: url ? "pointer" : "default" }}>
        <span style={{ fontSize: 14, color: mine ? "#000" : "#fff" }}>{playing ? "⏸" : "▶️"}</span>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 3, borderRadius: 2, background: trackBg, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${total ? Math.min(100, (cur / total) * 100) : 0}%`, background: mine ? "#000" : G, transition: "width .1s linear" }} />
        </div>
        <p style={{ fontSize: 9.5, color: mine ? "#00000088" : (T3 || "rgba(255,255,255,.6)"), marginTop: 3 }}>🎤 {fmt(playing || cur ? cur : total)}</p>
      </div>
    </div>
  );
}

// ── Franja "respondiendo a" dentro de una burbuja — tocarla salta al original.
function ReplyStrip({ meta, onJump, mine, isDark }) {
  const tint = mine ? "#00000014" : (isDark ? "#ffffff14" : "#00000010");
  const barColor = mine ? "#00000055" : G;
  const textColor = mine ? "#00000099" : (isDark ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.62)");
  return (
    <div onClick={onJump} className="p" style={{ display: "flex", gap: 7, alignItems: "stretch", marginBottom: 6, cursor: "pointer", background: tint, borderRadius: 8, padding: "5px 8px" }}>
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

// ── Barra superior de SELECCIÓN (reemplaza el encabezado normal del chat
// mientras hay un mensaje elegido con "mantener presionado"): Responder,
// Editar (solo mío y de texto), Eliminar. Nada inventado (sin "reenviar" ni
// "anclar" — esas funciones no existen aún en el backend).
function SelectionTopBar({ mine, isTextMsg, onClose, onReply, onEdit, onDelete, S, B, T1, isDark }) {
  const btnStyle = { background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: T1, fontSize: 9.5, fontWeight: 600, padding: "4px 10px" };
  return (
    <div style={{ background: isDark ? "rgba(8,8,8,.97)" : "rgba(255,255,255,.98)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "9px 12px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <button onClick={onClose} style={{ background: "none", border: "none", color: T1, fontSize: 20, cursor: "pointer", padding: "0 8px 0 2px", lineHeight: 1 }}>×</button>
      <div style={{ flex: 1 }} />
      <button onClick={onReply} style={btnStyle}><span style={{ fontSize: 17 }}>↩️</span>Responder</button>
      {mine && isTextMsg && <button onClick={onEdit} style={btnStyle}><span style={{ fontSize: 17 }}>✏️</span>Editar</button>}
      {mine && <button onClick={onDelete} style={{ ...btnStyle, color: "#EF4444" }}><span style={{ fontSize: 17 }}>🗑️</span>Eliminar</button>}
    </div>
  );
}

export function MessagesScreen({ user, onBack, onChat, chatOpen = false }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const [convs,   setConvs]   = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => { if (user?.id) getMyConversations(user.id).then(setConvs).catch(() => {}); }, [user?.id]);
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
    <div style={{ flex: 1, overflowY: "auto" }}>
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
const ChatInput = memo(function ChatInput({ onSend, onSendVoice, blocked, S, B, T1, T3, isDark, initialDraft = "", replyTo, onCancelReply, editing, onSaveEdit, onCancelEdit }) {
  // initialDraft: mensaje predefinido EDITABLE (ej. el cobro de deuda del admin).
  const [draft, setDraft] = useState(initialDraft || "");
  const inputRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const recRef = useRef(null); // { recorder, chunks, stream, timer, startedAt }

  // Al entrar en modo edición, precarga el texto original.
  useEffect(() => { if (editing) setDraft(editing.text || ""); }, [editing]);

  // Al enviar NO se hace blur: se limpia el texto y el input CONSERVA el foco,
  // así el teclado se queda abierto (con botón y con Enter). Al CONFIRMAR una
  // edición el campo también se vacía (antes se quedaba con el texto editado
  // dentro, con riesgo de reenviarlo por accidente como mensaje nuevo).
  const send = () => {
    const t = draft.trim(); if (!t) return;
    if (editing) { onSaveEdit(t); setDraft(""); return; }
    setDraft(""); onSend(t); inputRef.current?.focus();
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
      recRef.current = { recorder, chunks, stream, timer, startedAt };
      setRecSecs(0); setRecording(true);
    } catch (e) { /* sin permiso de micrófono: no se puede grabar */ }
  };
  const stopRecording = (send) => new Promise((resolve) => {
    const r = recRef.current;
    if (!r) return resolve(null);
    clearInterval(r.timer);
    r.recorder.onstop = () => {
      r.stream.getTracks().forEach(t => t.stop());
      const duration = Math.max(1, Math.round((Date.now() - r.startedAt) / 1000));
      resolve(send ? { blob: new Blob(r.chunks, { type: r.recorder.mimeType || "audio/webm" }), duration } : null);
    };
    r.recorder.stop();
  });
  const cancelRecording = async () => { await stopRecording(false); setRecording(false); recRef.current = null; };
  const finishRecording = async () => {
    const res = await stopRecording(true);
    setRecording(false); recRef.current = null;
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
        <div style={{ padding: "8px 12px calc(8px + env(safe-area-inset-bottom, 0px))", display: "flex", gap: 9, alignItems: "center" }}>
          <button onClick={cancelRecording} className="p" style={{ width: 38, height: 38, borderRadius: "50%", background: "none", border: `1px solid ${B}`, color: T3, fontSize: 16, cursor: "pointer" }}>×</button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "blk 1.1s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, color: T1, fontWeight: 700 }}>{fmtRec(recSecs)}</span>
            <span style={{ fontSize: 11.5, color: T3 }}>Grabando nota de voz…</span>
          </div>
          <button onClick={finishRecording} className="p" style={{ width: 42, height: 42, background: G, border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic n="send" c="#000" s={18} />
          </button>
        </div>
      ) : (
        <div style={{ padding: "8px 12px calc(8px + env(safe-area-inset-bottom, 0px))", display: "flex", gap: 9, alignItems: "center" }}>
          <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Escribe un mensaje..."
            style={{ flex: 1, minWidth: 0, background: S, border: `1px solid ${B}`, borderRadius: 50, padding: "10px 15px", color: T1, fontSize: 13, outline: "none" }} />
          {draft.trim()
            ? <button onClick={send} className="p" onPointerDown={e => e.preventDefault()}
                style={{ width: 42, height: 42, background: G, border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 10px rgba(255,192,30,.35)" }}>
                <Ic n="send" c="#000" s={20} />
              </button>
            : <button onClick={startRecording} disabled={!!editing} className="p" onPointerDown={e => e.preventDefault()}
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
function MessageBubble({ m, mine, isDark, B, T1, T3, CARD, orders, onOpenOrder, onOpenProduct, msgReactions, meId, isHighlighted, selected, onLongPress, onSwipeReply, onJumpTo, onReact }) {
  const soft = isDark ? "#141417" : "#f1f5f9";
  const meta = m.meta && typeof m.meta === "object" ? m.meta : null;
  const isVoice = meta?.type === "voice";
  const isReply = meta?.reply_to;
  const gesture = useMessageGesture({ onLongPress, onSwipeReply, disabled: !!meta && meta.type === "order" && !(m.text || "").trim() });
  const myReaction = (msgReactions.find(r => r.user_id === meId) || {}).emoji || null;

  // Tarjeta de PEDIDO automática (sin texto del usuario): centrada, en vivo — sin
  // gestos (no es un mensaje de texto que se pueda responder/reaccionar así).
  if (meta?.type === "order" && !(m.text || "").trim()) {
    return <div id={`msg-${m.id}`}><OrderChatCard meta={meta} orders={orders} onOpenOrder={onOpenOrder} B={B} T1={T1} T3={T3} soft={soft} /></div>;
  }
  const openRef = (meta && (meta.type === "order" || meta.type === "product")) ? () => {
    if (meta.type === "order") onOpenOrder && onOpenOrder(meta.order_id || meta.id);
    else onOpenProduct && onOpenProduct(meta.id);
  } : null;
  const bubbleBg = mine ? G : CARD;
  const bubbleText = mine ? "#000" : T1;
  return (
    <div id={`msg-${m.id}`} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", padding: "3px 4px", margin: "-3px -4px", borderRadius: 12, background: selected ? (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)") : "transparent", transition: "background .15s" }}>
      {selected && (
        <QuickReactionBar current={myReaction} onPick={(e) => onReact(m.id, e)} onOpenFull={() => onReact(m.id, "__FULL__")} mine={mine} CARD={CARD} B={B} isDark={isDark} />
      )}
      <div style={{ position: "relative", maxWidth: "78%" }}>
        {gesture.dx > 4 && (
          <div style={{ position: "absolute", top: "50%", left: -34, transform: "translateY(-50%)", opacity: Math.min(1, gesture.dx / 42), fontSize: 17 }}>↩️</div>
        )}
        <div {...gesture.handlers} style={{ touchAction: "pan-y", maxWidth: "100%", background: bubbleBg, border: mine ? "none" : `1px solid ${B}`, borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 13px", transform: gesture.dx ? `translateX(${gesture.dx}px)` : "none", transition: gesture.dragging ? "none" : "transform .25s cubic-bezier(.34,1.56,.64,1), outline .3s, box-shadow .3s", outline: isHighlighted ? `2px solid ${G}` : "none", outlineOffset: 2, boxShadow: isHighlighted ? `0 0 0 5px ${G}22` : "none" }}>
          {isReply && <ReplyStrip meta={meta} mine={mine} isDark={isDark} onJump={() => onJumpTo(meta.reply_to)} />}
          {meta && (meta.type === "product" || meta.type === "order" || meta.type === "admin_request") && <RefChatCard meta={meta} onOpen={openRef} orders={orders} B={mine ? "#00000022" : B} T1={mine ? "#000" : T1} T3={mine ? "#00000088" : T3} soft={mine ? "#ffffff55" : soft} />}
          {isVoice
            ? <VoiceMessage meta={meta} mine={mine} isDark={isDark} T1={bubbleText} T3={T3} accentBg={mine ? "#00000022" : `${G}33`} />
            : <p style={{ fontSize: 12, color: bubbleText, lineHeight: 1.5, wordBreak: "break-word" }}>{m.text}</p>}
          <p style={{ fontSize: 9, color: mine ? "#00000066" : T3, marginTop: 4, textAlign: "right" }}>
            {m.edited_at && <span style={{ fontStyle: "italic" }}>Editado · </span>}
            {new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            {mine && (m.read_at ? " ✓✓" : " ✓")}
          </p>
        </div>
      </div>
      <ReactionsRow list={msgReactions} meId={meId} mine={mine} onToggle={(emoji) => onReact(m.id, emoji)} />
    </div>
  );
}

export function ChatScreen({ chat, user, onBack, flash, onViewProfile, orders = [], onOpenOrder, onOpenProduct, onConvId }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const [convId,    setConvId]    = useState(chat.id || chat.key || null);
  // Avisa al padre qué conversación está EN PANTALLA ahora mismo (para que, si llega
  // una notificación de mensaje de esta MISMA conversación, no sume ruido extra: el
  // usuario ya la está viendo).
  useEffect(() => { onConvId && onConvId(convId || null); }, [convId, onConvId]);
  const [msgs,      setMsgs]      = useState([]);
  const [reactions, setReactions] = useState({}); // { [messageId]: [{id,user_id,emoji}] }
  const [loading,   setLoading]   = useState(true);
  const [otherName, setOtherName] = useState(chat.otherName || chat.name || null);
  const [blocked,   setBlocked]   = useState(false);
  const [chatOpts,  setChatOpts]  = useState(false);
  const [selectedId, setSelectedId] = useState(null); // mensaje SELECCIONADO (mantener presionado)
  const [emojiPickerFor, setEmojiPickerFor] = useState(null); // id de mensaje con selector completo abierto
  const [replyTo,   setReplyTo]   = useState(null);   // { id, preview }
  const [editing,   setEditing]   = useState(null);   // mensaje que se está editando
  const [highlightId, setHighlightId] = useState(null);
  // CONTEXTO (estilo AliExpress): si el chat se abrió desde un producto/pedido,
  // una franja sobre el input lo recuerda; el PRIMER mensaje enviado lleva esa
  // referencia (meta) y se pinta como tarjetica tocable. Luego se limpia.
  const [ctx, setCtx] = useState(chat.context || null);
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

  // Nombre real de la otra persona (nunca "Vendedor" genérico).
  useEffect(() => {
    if (!otherName && chat.otherId) getUserName(chat.otherId).then(n => n && setOtherName(n)).catch(() => {});
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

  const loadReactions = useCallback((ids) => {
    if (!ids.length) { setReactions({}); return; }
    getReactionsForMessages(ids).then(rows => {
      const grouped = {};
      rows.forEach(r => { (grouped[r.message_id] ||= []).push(r); });
      setReactions(grouped);
    }).catch(() => {});
  }, []);

  const subscribe = useCallback(async (cid) => {
    const c = await getSB();
    if (!c) return;
    const sub = c.channel(`conv_${cid}`)
      // Mensaje NUEVO: lo agrego y, si NO es mío y el chat está abierto, lo marco
      // leído al instante (esto dispara un UPDATE que el que envió verá como ✓✓).
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, payload => {
        const m = payload.new;
        setMsgs(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
        scrollToEnd();
        if (user?.id && m.sender_id !== user.id) markRead(cid, user.id).catch(() => {});
      })
      // UPDATE (p.ej. read_at, text editado, o eliminado — deleted_at): actualizo
      // el mensaje en vivo, o lo quito de la lista si acaba de borrarse.
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, payload => {
        const m = payload.new;
        if (m.deleted_at) { setMsgs(prev => prev.filter(x => x.id !== m.id)); return; }
        setMsgs(prev => prev.map(x => x.id === m.id ? { ...x, ...m } : x));
      })
      // Reacciones — la tabla no tiene conversation_id, así que se filtra en el
      // cliente contra los mensajes YA cargados de este chat (igual que el resto
      // de canales "amplios" que ya usa la app, p.ej. la lista de mensajes).
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, payload => {
        const row = payload.new || payload.old;
        if (!row || !msgsRef.current.some(m => m.id === row.message_id)) return;
        loadReactions(msgsRef.current.map(m => m.id));
      })
      .subscribe();
    subRef.current = sub;
  }, [scrollToEnd, user?.id, loadReactions]);

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

  // onSend estable: no depende del borrador (lo maneja ChatInput), así el input
  // no se recrea. Crea la conversación la primera vez y se suscribe.
  const handleSend = useCallback(async (text) => {
    if (!text || !user?.id || blocked) return;
    try {
      // El primer mensaje con la franja de contexto lleva la referencia (meta),
      // incluyendo el precio del producto para que la tarjeta informe bien.
      const meta = ctx ? { type: ctx.type, id: ctx.id, title: ctx.title || "", image: ctx.image || null, price: ctx.price ?? null, currency: ctx.currency || null }
        : replyTo ? { reply_to: replyTo.id, reply_preview: replyTo.preview } : null;
      const cid = meta ? await sendMessage(user.id, chat.otherId, text, meta) : await sendMessage(user.id, chat.otherId, text);
      if (ctx) setCtx(null);
      if (replyTo) setReplyTo(null);
      if (!convIdRef.current) { convIdRef.current = cid; setConvId(cid); }
      else { loadMessages(cid).then(d => { setMsgs(d); scrollToEnd(); loadReactions(d.map(m => m.id)); }).catch(() => {}); } // por si el realtime tarda
      trackEvent(user.id, null, "chat").catch(() => {});
    } catch (e) {
      if (isBlockSendError(e)) { setBlocked(true); flash("🚫 No puedes enviar mensajes a este usuario"); }
      else if (e.message?.includes("rate limit")) flash("⚠️ Estás enviando demasiados mensajes");
      else flash("❌ Error al enviar");
    }
  }, [user?.id, blocked, chat.otherId, flash, ctx, replyTo]);

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

  const handleDelete = useCallback(async (msg) => {
    setSelectedId(null);
    try {
      await deleteMessage(msg.id);
      setMsgs(prev => prev.filter(x => x.id !== msg.id));
    } catch (e) { flash("❌ No se pudo eliminar el mensaje"); }
  }, [flash]);

  const handleToggleBlock = useCallback(async () => {
    if (!chat.otherId) return;
    setChatOpts(false);
    try {
      const nowBlocked = await toggleBlockUser(chat.otherId);
      setBlocked(prev => (typeof nowBlocked === "boolean" ? nowBlocked : !prev));
      flash((typeof nowBlocked === "boolean" ? nowBlocked : !blocked) ? "🚫 Usuario bloqueado" : "Usuario desbloqueado");
    } catch (e) { flash("❌ No se pudo actualizar el bloqueo"); }
  }, [chat.otherId, blocked, flash]);

  // Reaccionar: SIEMPRE disponible (se reabre cada vez que se mantiene presionado,
  // muestre ya una reacción tuya o no). "__FULL__" abre el selector completo en
  // vez de reaccionar directo.
  const handleReact = useCallback(async (messageId, emoji) => {
    if (!user?.id) return;
    if (emoji === "__FULL__") { setEmojiPickerFor(messageId); return; }
    setSelectedId(null); setEmojiPickerFor(null);
    try {
      await toggleReaction(messageId, user.id, emoji);
      loadReactions(msgsRef.current.map(m => m.id));
    } catch (e) { flash("❌ No se pudo reaccionar"); }
  }, [user?.id, loadReactions, flash]);

  const displayName = otherName || "Usuario";
  const openProfile = () => { if (onViewProfile && chat.otherId) onViewProfile(chat.otherId); };
  const previewOf = (m) => {
    const meta = m.meta && typeof m.meta === "object" ? m.meta : null;
    if (meta?.type === "voice") return "🎤 Mensaje de voz";
    if (meta?.type === "product" || meta?.type === "order") return (meta.title ? "🛍️ " + meta.title : (m.text || "").slice(0, 50));
    return (m.text || "").slice(0, 50);
  };
  const selectedMsg = selectedId ? msgs.find(m => m.id === selectedId) || null : null;
  const isSelectedTextMsg = selectedMsg ? !(selectedMsg.meta && typeof selectedMsg.meta === "object" && (selectedMsg.meta.type === "voice" || selectedMsg.meta.type === "admin_request")) : false;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {selectedMsg ? (
        <SelectionTopBar
          mine={selectedMsg.sender_id === user?.id}
          isTextMsg={isSelectedTextMsg}
          onClose={() => setSelectedId(null)}
          onReply={() => { setReplyTo({ id: selectedMsg.id, preview: previewOf(selectedMsg) }); setEditing(null); setSelectedId(null); }}
          onEdit={() => { setEditing(selectedMsg); setReplyTo(null); setSelectedId(null); }}
          onDelete={() => handleDelete(selectedMsg)}
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
            {chatOpts && <>
              <div onClick={() => setChatOpts(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div style={{ position: "absolute", top: 28, right: 0, background: CARD, border: `1px solid ${B}`, borderRadius: 12, boxShadow: isDark ? "0 8px 24px rgba(0,0,0,.35)" : "0 8px 24px rgba(0,0,0,.18)", overflow: "hidden", zIndex: 41, minWidth: 170 }}>
                <button onClick={handleToggleBlock} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: T1, cursor: "pointer" }}>{blocked ? "Desbloquear usuario" : "Bloquear usuario"}</button>
                <button onClick={() => { setChatOpts(false); flash("Reporte enviado al equipo de RETADOR"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${B}`, padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>Reportar usuario</button>
              </div>
            </>}
          </div>
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px clamp(18px,3vw,48px)", display: "flex", flexDirection: "column", gap: 7, ...chatBgStyle(isDark) }}>
        {loading
          ? <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}><Spin size={22} /></div>
          : msgs.length === 0
            ? <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ fontSize: 11, color: T3 }}>Sé el primero en escribir</p>
              </div>
            : msgs.map(m => (
                <MessageBubble key={m.id} m={m} mine={m.sender_id === user?.id} isDark={isDark} B={B} T1={T1} T3={T3} CARD={CARD}
                  orders={orders} onOpenOrder={onOpenOrder} onOpenProduct={onOpenProduct}
                  msgReactions={reactions[m.id] || []} meId={user?.id} isHighlighted={highlightId === m.id} selected={selectedId === m.id}
                  onLongPress={() => setSelectedId(m.id)} onSwipeReply={() => setReplyTo({ id: m.id, preview: previewOf(m) })}
                  onJumpTo={jumpToMessage} onReact={handleReact} />
              ))
        }
      </div>

      {/* Franja de contexto: "estás consultando sobre esto" (se limpia al enviar o con la X) */}
      {ctx && !blocked && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", borderTop: `1px solid ${B}`, background: S, flexShrink: 0 }}>
          {ctx.image && <img src={ctx.image} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ctx.type === "order" ? "📦 " : "🛍️ "}{ctx.title || ""}{ctx.price != null && ctx.price !== "" ? <span style={{ color: "#22C55E", fontWeight: 800 }}> · {money(Number(ctx.price) || 0, ctx.currency || "USD")}</span> : null}</p>
            <p style={{ fontSize: 9.5, color: T3, marginTop: 1 }}>Estás consultando sobre esto</p>
          </div>
          <button onClick={() => setCtx(null)} style={{ background: "none", border: "none", color: T3, fontSize: 17, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
        </div>
      )}
      <ChatInput
        onSend={handleSend} onSendVoice={handleSendVoice} blocked={blocked} S={S} B={B} T1={T1} T3={T3} isDark={isDark} initialDraft={chat.draft || ""}
        replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
        editing={editing} onSaveEdit={handleSaveEdit} onCancelEdit={() => setEditing(null)}
      />

      {emojiPickerFor && (
        <EmojiPickerModal
          CARD={CARD} B={B} T1={T1} T2={T2} isDark={isDark}
          onClose={() => setEmojiPickerFor(null)}
          onPick={(e) => handleReact(emojiPickerFor, e)}
        />
      )}
    </div>
  );
}
