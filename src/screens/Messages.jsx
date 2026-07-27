import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, memo } from "react";
import { Avatar, AvatarUser, G, Ic, ORDER_FLOW, Spin, getMyConversations, getSB, getUserName, getProductById, isBlockedPair, isBlockSendError, toggleBlockUser, editMessage, sendReply, uploadVoiceNote, voiceNoteSignedUrl, toggleReaction, getReactionsForMessages, loadMessages, markRead, money, sendMessage, supabase, trackEvent, useAt, useR } from "../shared/index.js";

// Fondo del chat: textura MUY discreta con la identidad RETADOR (puntos dorados
// finísimos sobre el tono oscuro/claro de siempre) — nunca compite con las burbujas.
const chatBgStyle = (isDark) => ({
  backgroundColor: isDark ? "#0a0a0a" : "#f4f5f7",
  backgroundImage: `radial-gradient(${isDark ? "rgba(255,192,30,.05)" : "rgba(180,130,0,.07)"} 1px, transparent 1px)`,
  backgroundSize: "18px 18px",
});

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const ORDER_STATUS_ICON = { creada: "🕐", confirmado: "🕐", asignado: "📦", recogido: "📦", en_ruta: "🚚", en_reparto: "🚚", recibido: "📦", preparando: "📦", enviado: "🚚", en_aduana: "🛃", entregado: "✅", completado: "✅", cancelado: "❌", fallido: "❌" };

// ── Long-press (touca o mouse mantenido) para abrir el menú de un mensaje ────
function useLongPress(onLongPress, ms = 450) {
  const timer = useRef(null);
  const fired = useRef(false);
  const start = (e) => {
    fired.current = false;
    timer.current = setTimeout(() => { fired.current = true; onLongPress(e); }, ms);
  };
  const clear = () => { if (timer.current) clearTimeout(timer.current); };
  return {
    onMouseDown: start, onMouseUp: clear, onMouseLeave: clear,
    onTouchStart: start, onTouchEnd: clear, onTouchCancel: clear,
    onContextMenu: (e) => { e.preventDefault(); },
  };
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
// AGRANDADA (punto 7): foto más grande, título a dos líneas, precio, y el ESTADO
// actual si está ligada a un pedido/envío (ej. "🚚 En camino"). Si el producto ya
// no existe o está agotado (punto 8), se reduce a una versión chica sin precio ni
// acción — el mensaje y el historial NUNCA se pierden, solo se opaca la tarjeta.
function RefChatCard({ meta, onOpen, orders = [], B, T1, T3, soft }) {
  const price = meta.price != null && meta.price !== "" ? money(Number(meta.price) || 0, meta.currency || "USD") : null;
  const isAdminReq = meta.type === "admin_request";
  const isOrder = meta.type === "order";
  const isProduct = meta.type === "product";

  // Estado del pedido/envío ligado (si aplica) — misma fuente que OrderChatCard.
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

  // Disponibilidad del producto (si aplica) — se trae una vez; si ya no existe o
  // está agotado, la tarjeta se reduce (sin precio ni "Ver detalle").
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
function VoiceMessage({ meta, mine, T1, T3, accentBg }) {
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
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190, padding: "3px 2px" }}>
      {url && <audio ref={audioRef} src={url} preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setCur(0); }}
        onTimeUpdate={e => setCur(e.target.currentTime)} />}
      <button onClick={toggle} disabled={!url} className="p" style={{ width: 34, height: 34, borderRadius: "50%", background: accentBg, border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: url ? "pointer" : "default" }}>
        <span style={{ fontSize: 14, color: mine ? "#000" : "#fff" }}>{playing ? "⏸" : "▶️"}</span>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 3, borderRadius: 2, background: mine ? "#00000022" : "#ffffff22", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${total ? Math.min(100, (cur / total) * 100) : 0}%`, background: mine ? "#000" : G, transition: "width .1s linear" }} />
        </div>
        <p style={{ fontSize: 9.5, color: mine ? "#00000088" : (T3 || "rgba(255,255,255,.6)"), marginTop: 3 }}>🎤 {fmt(playing || cur ? cur : total)}</p>
      </div>
    </div>
  );
}

// ── Franja "respondiendo a" dentro de una burbuja — tocarla salta al original.
function ReplyStrip({ meta, onJump, mine }) {
  return (
    <div onClick={onJump} className="p" style={{ display: "flex", gap: 7, alignItems: "stretch", marginBottom: 6, cursor: "pointer", background: mine ? "#00000014" : "#ffffff0f", borderRadius: 8, padding: "5px 8px" }}>
      <div style={{ width: 3, borderRadius: 2, background: mine ? "#00000055" : G, flexShrink: 0 }} />
      <p style={{ fontSize: 11, color: mine ? "#00000099" : "rgba(255,255,255,.72)", lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{meta.reply_preview || "Mensaje"}</p>
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

// ── Hoja de acción de un mensaje: reaccionar / responder / editar (si es mío) ─
function MessageActionSheet({ mine, isTextMsg, onClose, onReact, onReply, onEdit }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--card,#141414)", width: "100%", maxWidth: 440, borderRadius: "18px 18px 0 0", padding: "14px 16px 24px", border: "1px solid rgba(128,128,128,.2)" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {QUICK_EMOJIS.map(e => (
            <button key={e} onClick={() => onReact(e)} className="p" style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer", padding: 4 }}>{e}</button>
          ))}
        </div>
        <button onClick={onReply} style={{ width: "100%", height: 46, borderRadius: 10, background: "rgba(128,128,128,.1)", border: "none", color: "var(--tx,#eee)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>↩️ Responder</button>
        {mine && isTextMsg && (
          <button onClick={onEdit} style={{ width: "100%", height: 46, borderRadius: 10, background: "rgba(128,128,128,.1)", border: "none", color: "var(--tx,#eee)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>✏️ Editar</button>
        )}
      </div>
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
const ChatInput = memo(function ChatInput({ onSend, onSendVoice, blocked, S, B, T1, T3, initialDraft = "", replyTo, onCancelReply, editing, onSaveEdit, onCancelEdit }) {
  // initialDraft: mensaje predefinido EDITABLE (ej. el cobro de deuda del admin).
  const [draft, setDraft] = useState(initialDraft || "");
  const inputRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const recRef = useRef(null); // { recorder, chunks, stream, timer, startedAt }

  // Al entrar en modo edición, precarga el texto original.
  useEffect(() => { if (editing) setDraft(editing.text || ""); }, [editing]);

  // Al enviar NO se hace blur: se limpia el texto y el input CONSERVA el foco,
  // así el teclado se queda abierto (con botón y con Enter).
  const send = () => {
    const t = draft.trim(); if (!t) return;
    if (editing) { onSaveEdit(t); return; }
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
                style={{ width: 42, height: 42, background: editing ? "#141414" : S, border: `1px solid ${B}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: editing ? .4 : 1, cursor: editing ? "default" : "pointer" }}>
                <span style={{ fontSize: 18 }}>🎤</span>
              </button>}
        </div>
      )}
    </div>
  );
});

// ── Burbuja de un mensaje individual — componente propio para que useLongPress
// (un hook) se llame en su propio nivel superior, NUNCA dentro de un .map().
function MessageBubble({ m, mine, isDark, B, T1, T3, orders, onOpenOrder, onOpenProduct, msgReactions, meId, isHighlighted, onLongPress, onJumpTo, onReact }) {
  const soft = isDark ? "#141417" : "#f1f5f9";
  const meta = m.meta && typeof m.meta === "object" ? m.meta : null;
  const isVoice = meta?.type === "voice";
  const isReply = meta?.reply_to;
  const longPress = useLongPress(onLongPress);
  // Tarjeta de PEDIDO automática (sin texto del usuario): centrada, en vivo.
  if (meta?.type === "order" && !(m.text || "").trim()) {
    return <div id={`msg-${m.id}`}><OrderChatCard meta={meta} orders={orders} onOpenOrder={onOpenOrder} B={B} T1={T1} T3={T3} soft={soft} /></div>;
  }
  const openRef = (meta && (meta.type === "order" || meta.type === "product")) ? () => {
    if (meta.type === "order") onOpenOrder && onOpenOrder(meta.order_id || meta.id);
    else onOpenProduct && onOpenProduct(meta.id);
  } : null;
  return (
    <div id={`msg-${m.id}`} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
      <div {...longPress} style={{ maxWidth: "78%", background: mine ? G : "#171717", border: mine ? "none" : `1px solid ${B}`, borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 13px", transition: "box-shadow .3s, outline .3s", outline: isHighlighted ? `2px solid ${G}` : "none", outlineOffset: 2, boxShadow: isHighlighted ? `0 0 0 5px ${G}22` : "none" }}>
        {isReply && <ReplyStrip meta={meta} mine={mine} onJump={() => onJumpTo(meta.reply_to)} />}
        {meta && (meta.type === "product" || meta.type === "order" || meta.type === "admin_request") && <RefChatCard meta={meta} onOpen={openRef} orders={orders} B={mine ? "#00000022" : B} T1={mine ? "#000" : T1} T3={mine ? "#00000088" : T3} soft={mine ? "#ffffff55" : soft} />}
        {isVoice
          ? <VoiceMessage meta={meta} mine={mine} T1={T1} T3={T3} accentBg={mine ? "#00000022" : `${G}33`} />
          : <p style={{ fontSize: 12, color: mine ? "#000" : "#eee", lineHeight: 1.5, wordBreak: "break-word" }}>{m.text}</p>}
        <p style={{ fontSize: 9, color: mine ? "#00000066" : "rgba(255,255,255,.55)", marginTop: 4, textAlign: "right" }}>
          {m.edited_at && <span style={{ fontStyle: "italic" }}>Editado · </span>}
          {new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          {mine && (m.read_at ? " ✓✓" : " ✓")}
        </p>
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
  const [actionFor, setActionFor] = useState(null);   // mensaje sobre el que se abrió la hoja de acción
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
      // UPDATE (p.ej. read_at, text editado): actualizo el mensaje en vivo.
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, payload => {
        const m = payload.new;
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

  const handleToggleBlock = useCallback(async () => {
    if (!chat.otherId) return;
    setChatOpts(false);
    try {
      const nowBlocked = await toggleBlockUser(chat.otherId);
      setBlocked(prev => (typeof nowBlocked === "boolean" ? nowBlocked : !prev));
      flash((typeof nowBlocked === "boolean" ? nowBlocked : !blocked) ? "🚫 Usuario bloqueado" : "Usuario desbloqueado");
    } catch (e) { flash("❌ No se pudo actualizar el bloqueo"); }
  }, [chat.otherId, blocked, flash]);

  const handleReact = useCallback(async (messageId, emoji) => {
    if (!user?.id) return;
    setActionFor(null);
    try {
      await toggleReaction(messageId, user.id, emoji);
      loadReactions(msgsRef.current.map(m => m.id));
    } catch (e) {}
  }, [user?.id, loadReactions]);

  const displayName = otherName || "Usuario";
  const openProfile = () => { if (onViewProfile && chat.otherId) onViewProfile(chat.otherId); };
  const previewOf = (m) => {
    const meta = m.meta && typeof m.meta === "object" ? m.meta : null;
    if (meta?.type === "voice") return "🎤 Mensaje de voz";
    if (meta?.type === "product" || meta?.type === "order") return (meta.title ? "🛍️ " + meta.title : (m.text || "").slice(0, 50));
    return (m.text || "").slice(0, 50);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c="#666" s={20} /></button>
        <div onClick={openProfile} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: onViewProfile && chat.otherId ? "pointer" : "default" }}>
          <AvatarUser userId={chat.otherId} name={displayName} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 800, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
            <p style={{ fontSize: 10, color: blocked ? "#F87171" : (onViewProfile && chat.otherId ? G : "#22C55E"), marginTop: 1, fontWeight: 600 }}>{blocked ? "🚫 Bloqueado" : (onViewProfile && chat.otherId ? "Ver perfil ›" : "● Activo")}</p>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setChatOpts(o => !o)} style={{ background: "none", border: "none", color: "var(--t2,#8a8a8a)", fontSize: 19, cursor: "pointer", lineHeight: 1 }}>⋯</button>
          {chatOpts && <>
            <div onClick={() => setChatOpts(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
            <div style={{ position: "absolute", top: 28, right: 0, background: "var(--card,#fff)", border: "1px solid rgba(128,128,128,.25)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.18)", overflow: "hidden", zIndex: 41, minWidth: 170 }}>
              <button onClick={handleToggleBlock} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--tx,#111)", cursor: "pointer" }}>{blocked ? "Desbloquear usuario" : "Bloquear usuario"}</button>
              <button onClick={() => { setChatOpts(false); flash("Reporte enviado al equipo de RETADOR"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: "1px solid rgba(128,128,128,.18)", padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>Reportar usuario</button>
            </div>
          </>}
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px clamp(18px,3vw,48px)", display: "flex", flexDirection: "column", gap: 7, ...chatBgStyle(isDark) }}>
        {loading
          ? <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}><Spin size={22} /></div>
          : msgs.length === 0
            ? <div style={{ textAlign: "center", padding: "32px 0", color: "#1e1e1e" }}>
                <p style={{ fontSize: 11 }}>Sé el primero en escribir</p>
              </div>
            : msgs.map(m => (
                <MessageBubble key={m.id} m={m} mine={m.sender_id === user?.id} isDark={isDark} B={B} T1={T1} T3={T3}
                  orders={orders} onOpenOrder={onOpenOrder} onOpenProduct={onOpenProduct}
                  msgReactions={reactions[m.id] || []} meId={user?.id} isHighlighted={highlightId === m.id}
                  onLongPress={() => setActionFor(m)} onJumpTo={jumpToMessage} onReact={handleReact} />
              ))
        }
      </div>

      {/* Franja de contexto: "estás consultando sobre esto" (se limpia al enviar o con la X) */}
      {ctx && !blocked && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", borderTop: `1px solid ${B}`, background: isDark ? "#101012" : "#f8fafc", flexShrink: 0 }}>
          {ctx.image && <img src={ctx.image} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ctx.type === "order" ? "📦 " : "🛍️ "}{ctx.title || ""}{ctx.price != null && ctx.price !== "" ? <span style={{ color: "#22C55E", fontWeight: 800 }}> · {money(Number(ctx.price) || 0, ctx.currency || "USD")}</span> : null}</p>
            <p style={{ fontSize: 9.5, color: T3, marginTop: 1 }}>Estás consultando sobre esto</p>
          </div>
          <button onClick={() => setCtx(null)} style={{ background: "none", border: "none", color: T3, fontSize: 17, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
        </div>
      )}
      <ChatInput
        onSend={handleSend} onSendVoice={handleSendVoice} blocked={blocked} S={S} B={B} T1={T1} T3={T3} initialDraft={chat.draft || ""}
        replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
        editing={editing} onSaveEdit={handleSaveEdit} onCancelEdit={() => setEditing(null)}
      />

      {actionFor && (
        <MessageActionSheet
          mine={actionFor.sender_id === user?.id}
          isTextMsg={!(actionFor.meta && typeof actionFor.meta === "object" && (actionFor.meta.type === "voice" || actionFor.meta.type === "admin_request"))}
          onClose={() => setActionFor(null)}
          onReact={(e) => handleReact(actionFor.id, e)}
          onReply={() => { setReplyTo({ id: actionFor.id, preview: previewOf(actionFor) }); setEditing(null); setActionFor(null); }}
          onEdit={() => { setEditing(actionFor); setReplyTo(null); setActionFor(null); }}
        />
      )}
    </div>
  );
}
