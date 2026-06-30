import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { G, Ic, Spin, getMyConversations, getSB, getUserName, isBlocked, loadMessages, markRead, sendMessage, trackEvent, useAt, useR } from "../shared/index.js";

export function MessagesScreen({ user, onBack, onChat }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const [convs,   setConvs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const colors = ["#60A5FA","#E879F9","#4ADE80","#FBBF24","#F87171",G];

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    getMyConversations(user.id).then(d => { setConvs(d); setLoading(false); });
  }, [user?.id]);

  const totalUnread = convs.reduce((a, c) => a + (c.unread || 0), 0);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "13px 18px", display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c={T2} s={20} /></button>
        <p style={{ fontSize: 14, fontWeight: 800, color: T1 }}>Mensajes</p>
        {totalUnread > 0 && <div style={{ marginLeft: "auto", background: G, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#000" }}>{totalUnread}</div>}
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
            : <div style={{ padding: "0 18px" }}>
                {convs.map(c => {
                  const color = colors[c.key?.charCodeAt(0) % colors.length] || G;
                  return (
                    <div key={c.id} className="cd" onClick={() => onChat(c)} style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 0", borderBottom: `1px solid ${B}` }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${color}22`, border: `1.5px solid ${color}38`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color }}>
                          {(c.name || "?")[0].toUpperCase()}
                        </div>
                        {(c.unread || 0) > 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: G, border: `2px solid ${BG}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#000" }}>{c.unread}</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: T1 }}>{c.name}</p>
                          <p style={{ fontSize: 10, color: T3 }}>{c.lastTime ? new Date(c.lastTime).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : ""}</p>
                        </div>
                        <p style={{ fontSize: 11, color: T2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastMsg || "Sin mensajes"}</p>
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
export function ChatScreen({ chat, user, onBack, flash }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const [convId,    setConvId]    = useState(chat.id || chat.key || null);
  const [msgs,      setMsgs]      = useState([]);
  const [draft,     setDraft]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [otherName, setOtherName] = useState(chat.otherName || chat.name || null);
  const [blocked,   setBlocked]   = useState(false);
  const [chatOpts,  setChatOpts]  = useState(false);
  const endRef = useRef(null);
  const subRef = useRef(null);

  useEffect(() => {
    if (!otherName && chat.otherId) getUserName(chat.otherId).then(setOtherName);

    // Comprobar bloqueo
    if (user?.id && chat.otherId) {
      isBlocked(user.id, chat.otherId).then(setBlocked).catch(() => {});
    }

    // Si tenemos convId, cargar mensajes; si no, la primera vez que se mande mensaje se creará
    const loadAndSubscribe = async (cid) => {
      if (!cid) { setLoading(false); return; }
      const data = await loadMessages(cid);
      setMsgs(data); setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      if (user?.id) markRead(cid, user.id).catch(() => {});

      // Realtime — filtro por conversation_id
      const c = await getSB();
      if (!c) return;
      const sub = c.channel(`conv_${cid}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
          filter: `conversation_id=eq.${cid}`,
        }, payload => {
          setMsgs(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        })
        .subscribe();
      subRef.current = sub;
    };

    loadAndSubscribe(convId);

    return () => {
      if (subRef.current) getSB().then(c => c?.removeChannel(subRef.current)).catch(() => {});
    };
  }, [convId]);

  const handleSend = async () => {
    if (!draft.trim() || !user?.id || blocked) return;
    const content = draft.trim();
    setDraft(""); setSending(true);
    try {
      const cid = await sendMessage(user.id, chat.otherId, content, crypto.randomUUID());
      if (!convId) {
        setConvId(cid);
        // Suscribir al nuevo canal
        const c = await getSB();
        if (c) {
          const sub = c.channel(`conv_${cid}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, payload => {
              setMsgs(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
              setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            }).subscribe();
          subRef.current = sub;
        }
      }
      trackEvent(user.id, null, "chat").catch(() => {});
    } catch (e) {
      setDraft(content);
      if (e.message?.includes("blocked")) { setBlocked(true); flash("🚫 No puedes enviar mensajes a este usuario"); }
      else if (e.message?.includes("rate limit")) flash("⚠️ Estás enviando demasiados mensajes");
      else flash("❌ Error al enviar");
    } finally { setSending(false); }
  };

  const displayName = otherName || "Usuario";
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "13px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c="#666" s={20} /></button>
        <div style={{ width: 31, height: 31, borderRadius: "50%", background: `${G}22`, border: `1.5px solid ${G}38`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: G }}>
          {displayName[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700 }}>{displayName}</p>
          <p style={{ fontSize: 10, color: blocked ? "#F87171" : "#22C55E", marginTop: 1 }}>{blocked ? "🚫 Bloqueado" : "● Activo"}</p>
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

      <div style={{ flex: 1, overflowY: "auto", padding: "12px clamp(18px,3vw,48px)", display: "flex", flexDirection: "column", gap: 7 }}>
        {loading
          ? <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}><Spin size={22} /></div>
          : msgs.length === 0
            ? <div style={{ textAlign: "center", padding: "32px 0", color: "#1e1e1e" }}>
                <p style={{ fontSize: 11 }}>Sé el primero en escribir</p>
              </div>
            : msgs.map(m => {
                const mine = m.sender_id === user?.id;
                const showTime = true;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "78%", background: mine ? G : "#171717", border: mine ? "none" : `1px solid ${B}`, borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 13px" }}>
                      {m.deleted_at
                        ? <p style={{ fontSize: 11, color: mine ? "#0008" : "#3e3e3e", fontStyle: "italic" }}>Mensaje eliminado</p>
                        : <p style={{ fontSize: 12, color: mine ? "#000" : "#ddd", lineHeight: 1.5, wordBreak: "break-word" }}>{m.content}</p>
                      }
                      {showTime && <p style={{ fontSize: 9, color: mine ? "#00000055" : "#3e3e3e", marginTop: 4, textAlign: "right" }}>
                        {new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        {mine && m.read_at && " ✓✓"}
                      </p>}
                    </div>
                  </div>
                );
              })
        }
        <div ref={endRef} />
      </div>

      <div style={{ padding: "10px 14px", borderTop: `1px solid ${B}`, display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {blocked
          ? <p style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#F87171" }}>🚫 No puedes enviar mensajes</p>
          : <>
            <input value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escribe un mensaje..."
              style={{ flex: 1, background: S, border: `1px solid ${B}`, borderRadius: 50, padding: "11px 16px", color: T1, fontSize: 12, outline: "none" }} />
            <button onClick={handleSend} disabled={sending || !draft.trim()} className="p"
              style={{ width: 31, height: 31, background: draft.trim() ? G : "#141414", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
              {sending ? <Spin size={16} color={G} /> : <Ic n="send" c={draft.trim() ? "#000" : "#2a2a2a"} s={17} />}
            </button>
          </>
        }
      </div>
    </div>
  );
}
