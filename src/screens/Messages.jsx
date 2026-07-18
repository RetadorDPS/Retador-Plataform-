import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, memo } from "react";
import { Avatar, AvatarUser, G, Ic, ORDER_FLOW, Spin, getMyConversations, getSB, getUserName, isBlocked, loadMessages, markRead, money, sendMessage, supabase, trackEvent, useAt, useR } from "../shared/index.js";

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
// Grande y clara: foto visible, título a dos líneas y el precio del producto,
// para que ambas partes sepan de qué se habla. Tocar → abre el detalle.
function RefChatCard({ meta, onOpen, B, T1, T3, soft }) {
  const price = meta.price != null && meta.price !== "" ? money(Number(meta.price) || 0, meta.currency || "USD") : null;
  return (
    <div onClick={onOpen} className="p" style={{ display: "flex", alignItems: "center", gap: 11, background: soft, border: `1px solid ${B}`, borderRadius: 13, padding: "9px 11px", marginBottom: 7, cursor: onOpen ? "pointer" : "default", minWidth: 200, maxWidth: 280 }}>
      {meta.image
        ? <img src={meta.image} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
        : <div style={{ width: 56, height: 56, borderRadius: 10, background: "#8884", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{meta.type === "order" ? "📦" : "🛍️"}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 800, color: T1, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{meta.title || (meta.type === "order" ? "Pedido" : "Producto")}</p>
        <p style={{ fontSize: 11, color: T3, marginTop: 3, fontWeight: 700 }}>
          {price ? <span style={{ color: "#22C55E" }}>{price}</span> : (meta.type === "order" ? "Pedido" : "Producto")}
          <span style={{ fontWeight: 600 }}> · Ver detalle ›</span>
        </p>
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
                      <Avatar url={c.otherAvatar} name={c.name} size={50} />
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
const ChatInput = memo(function ChatInput({ onSend, blocked, S, B, T1, initialDraft = "" }) {
  // initialDraft: mensaje predefinido EDITABLE (ej. el cobro de deuda del admin).
  const [draft, setDraft] = useState(initialDraft || "");
  const inputRef = useRef(null);
  // Al enviar NO se hace blur: se limpia el texto y el input CONSERVA el foco,
  // así el teclado se queda abierto (con botón y con Enter).
  const send = () => { const t = draft.trim(); if (!t) return; setDraft(""); onSend(t); inputRef.current?.focus(); };
  if (blocked) return <div style={{ padding: "10px 14px calc(10px + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid ${B}`, flexShrink: 0 }}><p style={{ textAlign: "center", fontSize: 11, color: "#F87171" }}>🚫 No puedes enviar mensajes</p></div>;
  return (
    <div style={{ padding: "8px 12px calc(8px + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid ${B}`, display: "flex", gap: 9, alignItems: "center", flexShrink: 0 }}>
      <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder="Escribe un mensaje..."
        style={{ flex: 1, minWidth: 0, background: S, border: `1px solid ${B}`, borderRadius: 50, padding: "10px 15px", color: T1, fontSize: 13, outline: "none" }} />
      <button onClick={send} disabled={!draft.trim()} className="p"
        onPointerDown={e => e.preventDefault()} /* que tocar el botón no le quite el foco al input (teclado abierto) */
        style={{ width: 42, height: 42, background: draft.trim() ? G : "#141414", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s", boxShadow: draft.trim() ? "0 2px 10px rgba(255,192,30,.35)" : "none" }}>
        <Ic n="send" c={draft.trim() ? "#000" : "#2a2a2a"} s={20} />
      </button>
    </div>
  );
});

export function ChatScreen({ chat, user, onBack, flash, onViewProfile, orders = [], onOpenOrder, onOpenProduct }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const [convId,    setConvId]    = useState(chat.id || chat.key || null);
  const [msgs,      setMsgs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [otherName, setOtherName] = useState(chat.otherName || chat.name || null);
  const [blocked,   setBlocked]   = useState(false);
  const [chatOpts,  setChatOpts]  = useState(false);
  // CONTEXTO (estilo AliExpress): si el chat se abrió desde un producto/pedido,
  // una franja sobre el input lo recuerda; el PRIMER mensaje enviado lleva esa
  // referencia (meta) y se pinta como tarjetica tocable. Luego se limpia.
  const [ctx, setCtx] = useState(chat.context || null);
  const scrollRef = useRef(null);
  const subRef = useRef(null);
  const convIdRef = useRef(convId);
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

  // Nombre real de la otra persona (nunca "Vendedor" genérico).
  useEffect(() => {
    if (!otherName && chat.otherId) getUserName(chat.otherId).then(n => n && setOtherName(n)).catch(() => {});
  }, [chat.otherId]);

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
      // UPDATE (p.ej. read_at): actualizo el mensaje → el ✓✓ aparece en tiempo real.
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, payload => {
        const m = payload.new;
        setMsgs(prev => prev.map(x => x.id === m.id ? { ...x, ...m } : x));
      })
      .subscribe();
    subRef.current = sub;
  }, [scrollToEnd, user?.id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!convId) { setLoading(false); return; }
      const data = await loadMessages(convId);
      if (!alive) return;
      setMsgs(data); setLoading(false); scrollToEnd();
      if (user?.id) markRead(convId, user.id).catch(() => {});
      subscribe(convId);
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
      const meta = ctx ? { type: ctx.type, id: ctx.id, title: ctx.title || "", image: ctx.image || null, price: ctx.price ?? null, currency: ctx.currency || null } : null;
      const cid = await sendMessage(user.id, chat.otherId, text, meta);
      if (meta) setCtx(null);
      if (!convIdRef.current) { convIdRef.current = cid; setConvId(cid); }
      else { loadMessages(cid).then(d => { setMsgs(d); scrollToEnd(); }).catch(() => {}); } // por si el realtime tarda
      trackEvent(user.id, null, "chat").catch(() => {});
    } catch (e) {
      if (e.message?.includes("blocked")) { setBlocked(true); flash("🚫 No puedes enviar mensajes a este usuario"); }
      else if (e.message?.includes("rate limit")) flash("⚠️ Estás enviando demasiados mensajes");
      else flash("❌ Error al enviar");
    }
  }, [user?.id, blocked, chat.otherId, flash, ctx]);

  const displayName = otherName || "Usuario";
  const openProfile = () => { if (onViewProfile && chat.otherId) onViewProfile(chat.otherId); };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c="#666" s={20} /></button>
        <div onClick={openProfile} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: onViewProfile && chat.otherId ? "pointer" : "default" }}>
          <AvatarUser userId={chat.otherId} name={displayName} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 800, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
            <p style={{ fontSize: 10, color: onViewProfile && chat.otherId ? G : (blocked ? "#F87171" : "#22C55E"), marginTop: 1, fontWeight: 600 }}>{onViewProfile && chat.otherId ? "Ver perfil ›" : (blocked ? "🚫 Bloqueado" : "● Activo")}</p>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setChatOpts(o => !o)} style={{ background: "none", border: "none", color: "var(--t2,#8a8a8a)", fontSize: 19, cursor: "pointer", lineHeight: 1 }}>⋯</button>
          {chatOpts && <>
            <div onClick={() => setChatOpts(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
            <div style={{ position: "absolute", top: 28, right: 0, background: "var(--card,#fff)", border: "1px solid rgba(128,128,128,.25)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.18)", overflow: "hidden", zIndex: 41, minWidth: 170 }}>
              <button onClick={() => { setBlocked(b => !b); setChatOpts(false); flash(blocked ? "Usuario desbloqueado" : "🚫 Usuario bloqueado"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--tx,#111)", cursor: "pointer" }}>{blocked ? "Desbloquear usuario" : "Bloquear usuario"}</button>
              <button onClick={() => { setChatOpts(false); flash("Reporte enviado al equipo de RETADOR"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: "1px solid rgba(128,128,128,.18)", padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>Reportar usuario</button>
            </div>
          </>}
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px clamp(18px,3vw,48px)", display: "flex", flexDirection: "column", gap: 7 }}>
        {loading
          ? <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}><Spin size={22} /></div>
          : msgs.length === 0
            ? <div style={{ textAlign: "center", padding: "32px 0", color: "#1e1e1e" }}>
                <p style={{ fontSize: 11 }}>Sé el primero en escribir</p>
              </div>
            : msgs.map(m => {
                const mine = m.sender_id === user?.id;
                const soft = isDark ? "#141417" : "#f1f5f9";
                const meta = m.meta && typeof m.meta === "object" ? m.meta : null;
                // Tarjeta de PEDIDO automática (sin texto del usuario): centrada, en vivo.
                if (meta?.type === "order" && !(m.text || "").trim()) {
                  return <OrderChatCard key={m.id} meta={meta} orders={orders} onOpenOrder={onOpenOrder} B={B} T1={T1} T3={T3} soft={soft} />;
                }
                const openRef = meta ? () => {
                  if (meta.type === "order") onOpenOrder && onOpenOrder(meta.order_id || meta.id);
                  else if (meta.type === "product") onOpenProduct && onOpenProduct(meta.id);
                } : null;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "78%", background: mine ? G : "#171717", border: mine ? "none" : `1px solid ${B}`, borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 13px" }}>
                      {meta && (meta.type === "product" || meta.type === "order") && <RefChatCard meta={meta} onOpen={openRef} B={mine ? "#00000022" : B} T1={mine ? "#000" : T1} T3={mine ? "#00000088" : T3} soft={mine ? "#ffffff55" : soft} />}
                      <p style={{ fontSize: 12, color: mine ? "#000" : "#eee", lineHeight: 1.5, wordBreak: "break-word" }}>{m.text}</p>
                      <p style={{ fontSize: 9, color: mine ? "#00000066" : "rgba(255,255,255,.55)", marginTop: 4, textAlign: "right" }}>
                        {new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        {mine && (m.read_at ? " ✓✓" : " ✓")}
                      </p>
                    </div>
                  </div>
                );
              })
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
      <ChatInput onSend={handleSend} blocked={blocked} S={S} B={B} T1={T1} initialDraft={chat.draft || ""} />
    </div>
  );
}
