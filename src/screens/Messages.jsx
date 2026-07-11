import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, memo } from "react";
import { Avatar, AvatarUser, G, Ic, Spin, getMyConversations, getSB, getUserName, isBlocked, loadMessages, markRead, sendMessage, trackEvent, useAt, useR } from "../shared/index.js";

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
                        <Avatar url={c.otherAvatar} name={c.name} size={42} />
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
// Input AISLADO: guarda su propio borrador, así los mensajes que llegan por
// realtime (que re-renderizan el chat) NO le roban el foco ni borran las letras.
const ChatInput = memo(function ChatInput({ onSend, blocked, S, B, T1 }) {
  const [draft, setDraft] = useState("");
  const send = () => { const t = draft.trim(); if (!t) return; setDraft(""); onSend(t); };
  if (blocked) return <div style={{ padding: "10px 14px", borderTop: `1px solid ${B}`, flexShrink: 0 }}><p style={{ textAlign: "center", fontSize: 11, color: "#F87171" }}>🚫 No puedes enviar mensajes</p></div>;
  return (
    <div style={{ padding: "10px 14px", borderTop: `1px solid ${B}`, display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
      <input value={draft} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder="Escribe un mensaje..."
        style={{ flex: 1, background: S, border: `1px solid ${B}`, borderRadius: 50, padding: "11px 16px", color: T1, fontSize: 12, outline: "none" }} />
      <button onClick={send} disabled={!draft.trim()} className="p"
        style={{ width: 31, height: 31, background: draft.trim() ? G : "#141414", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
        <Ic n="send" c={draft.trim() ? "#000" : "#2a2a2a"} s={17} />
      </button>
    </div>
  );
});

export function ChatScreen({ chat, user, onBack, flash, onViewProfile }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const [convId,    setConvId]    = useState(chat.id || chat.key || null);
  const [msgs,      setMsgs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [otherName, setOtherName] = useState(chat.otherName || chat.name || null);
  const [blocked,   setBlocked]   = useState(false);
  const [chatOpts,  setChatOpts]  = useState(false);
  const scrollRef = useRef(null);
  const subRef = useRef(null);
  const convIdRef = useRef(convId);

  // Baja el scroll al final SIN mover el foco del input (no usamos scrollIntoView).
  const scrollToEnd = useCallback(() => {
    setTimeout(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, 40);
  }, []);

  // Nombre real de la otra persona (nunca "Vendedor" genérico).
  useEffect(() => {
    if (!otherName && chat.otherId) getUserName(chat.otherId).then(n => n && setOtherName(n)).catch(() => {});
  }, [chat.otherId]);

  const subscribe = useCallback(async (cid) => {
    const c = await getSB();
    if (!c) return;
    const sub = c.channel(`conv_${cid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, payload => {
        setMsgs(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
        scrollToEnd();
        if (user?.id) markRead(cid, user.id).catch(() => {});
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
      const cid = await sendMessage(user.id, chat.otherId, text);
      if (!convIdRef.current) { convIdRef.current = cid; setConvId(cid); }
      else { loadMessages(cid).then(d => { setMsgs(d); scrollToEnd(); }).catch(() => {}); } // por si el realtime tarda
      trackEvent(user.id, null, "chat").catch(() => {});
    } catch (e) {
      if (e.message?.includes("blocked")) { setBlocked(true); flash("🚫 No puedes enviar mensajes a este usuario"); }
      else if (e.message?.includes("rate limit")) flash("⚠️ Estás enviando demasiados mensajes");
      else flash("❌ Error al enviar");
    }
  }, [user?.id, blocked, chat.otherId, flash]);

  const displayName = otherName || "Usuario";
  const openProfile = () => { if (onViewProfile && chat.otherId) onViewProfile(chat.otherId); };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "78%", background: mine ? G : "#171717", border: mine ? "none" : `1px solid ${B}`, borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 13px" }}>
                      <p style={{ fontSize: 12, color: mine ? "#000" : "#ddd", lineHeight: 1.5, wordBreak: "break-word" }}>{m.text}</p>
                      <p style={{ fontSize: 9, color: mine ? "#00000055" : "#3e3e3e", marginTop: 4, textAlign: "right" }}>
                        {new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        {mine && m.read_at && " ✓✓"}
                      </p>
                    </div>
                  </div>
                );
              })
        }
      </div>

      <ChatInput onSend={handleSend} blocked={blocked} S={S} B={B} T1={T1} />
    </div>
  );
}
