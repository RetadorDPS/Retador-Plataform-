import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { G, Ic, MODALIDAD_LABELS, SHIP_LABELS, money, useAt, useR } from "../shared/index.js";

export function OrderDetailScreen({ order: o, user, me, onBack, onAdvance, onChat, flash, onSellerConfirm, onBuyerConfirm, onSellerPayment, onApproveFee }) {
  const { S, B, T1, T2, T3, isDark } = useAt();
  const [rated, setRated] = useState(() => { try { return !!(JSON.parse(localStorage.getItem("retador_ratings") || "{}")[o?.id]); } catch (e) { return false; } });
  const [rate, setRate] = useState({ sys: 0, courier: 0, seller: 0 });
  const [rateMsg, setRateMsg] = useState({ sys: "", courier: "", seller: "" });
  if (!o) return null;
  const sl = SHIP_LABELS[o.shipType || o.shipMode] || SHIP_LABELS.local;
  const md = MODALIDAD_LABELS[o.modalidad] || MODALIDAD_LABELS.local;
  const flow = o.flow || [];
  const idx = o.stepIdx || 0;
  const done = idx >= flow.length - 1;
  const cur = o.currency;
  const histAt = (key) => { const h = (o.history || []).find(x => x.key === key); return h ? h.at : null; };
  const fmtT = (t) => t ? new Date(t).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null;
  const card = isDark ? "#0d0d0d" : S;
  const soft = isDark ? "#111" : "#F5F6F7";
  const commission = o.commissionPct ? (o.amount * o.commissionPct / 100) : 0;
  const viewerIsSeller = (!!user?.id && (o.seller_id === user.id || o.sellerId === user.id)) || (!!me && o.sellerName === me);
  const viewerLooksBuyer = (!!user?.id && (o.buyer_id === user.id || o.buyerId === user.id)) || (!!o.buyerName && o.buyerName === me) || o.feeApproval === "pending";
  const isCompleted = done || o.courierStage === "completado" || o.status === "completado" || o.status === "entregado" || (o.buyerConfirmed && o.sellerPaid);
  const submitRatings = () => {
    try {
      const all = JSON.parse(localStorage.getItem("retador_ratings") || "{}");
      all[o.id] = { sys: rate.sys, sysMsg: rateMsg.sys, courier: rate.courier, courierMsg: rateMsg.courier, seller: rate.seller, sellerMsg: rateMsg.seller, courierName: o.courierName || "", sellerName: o.sellerName || "", at: Date.now() };
      localStorage.setItem("retador_ratings", JSON.stringify(all));
    } catch (e) {}
    setRated(true);
    flash && flash("¡Gracias por tu calificación!");
  };
  const stars = (val, set) => <div style={{ display: "flex", gap: 5 }}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" onClick={() => set(n)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 28, lineHeight: 1, padding: 0, color: n <= val ? "#FFC01E" : (isDark ? "#333" : "#dcdcdc") }}>★</button>)}</div>;

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "13px 18px", display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, zIndex: 5 }}>
        <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c="#666" s={20} /></button>
        <p style={{ fontSize: 14, fontWeight: 800, color: T1 }}>Seguimiento del pedido</p>
      </div>

      <div style={{ padding: "14px 18px 90px" }}>
        {/* Producto */}
        <div style={{ display: "flex", gap: 12, background: card, border: `1px solid ${B}`, borderRadius: 16, padding: "13px", marginBottom: 12 }}>
          <div style={{ width: 58, height: 58, borderRadius: 13, background: "#1a1a1a", overflow: "hidden", flexShrink: 0 }}>
            {o.image && <img src={o.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: T3, marginBottom: 2 }}>Pedido #{String(o.id).slice(-8).toUpperCase()}</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: T1 }}>{o.title}{o.qty > 1 ? ` ×${o.qty}` : ""}</p>
            <p style={{ fontSize: 16, fontWeight: 900, color: G, marginTop: 3 }}>{money(o.amount, cur)}</p>
            {o.sellerName && <p style={{ fontSize: 10, color: T2, marginTop: 3 }}>Vendedor: {o.sellerName}</p>}
          </div>
        </div>

        {/* Entrega + modalidad */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, background: card, border: `1px solid ${B}`, borderRadius: 13, padding: "11px 12px" }}>
            <p style={{ fontSize: 9, color: T3, fontWeight: 700, marginBottom: 4, letterSpacing: .3 }}>ENTREGA</p>
            <p style={{ fontSize: 12, fontWeight: 800, color: T1 }}>{sl.icon} {sl.label}</p>
          </div>
          <div style={{ flex: 1, background: card, border: `1px solid ${B}`, borderRadius: 13, padding: "11px 12px" }}>
            <p style={{ fontSize: 9, color: T3, fontWeight: 700, marginBottom: 4, letterSpacing: .3 }}>MODALIDAD</p>
            <p style={{ fontSize: 12, fontWeight: 800, color: G }}>{md.label}</p>
          </div>
        </div>

        {/* Datos de entrega (precargados al comprar) */}
        {o.delivery && o.delivery.mode !== "persona" && (
          <div style={{ background: card, border: `1px solid ${B}`, borderRadius: 13, padding: "12px 13px", marginBottom: 14 }}>
            <p style={{ fontSize: 9, color: T3, fontWeight: 700, marginBottom: 7, letterSpacing: .3 }}>{o.delivery.mode === "intl" ? "DESTINATARIO" : "ENTREGA"}</p>
            {o.delivery.mode === "local" ? <>
              <p style={{ fontSize: 12, fontWeight: 700, color: T1 }}>{o.delivery.name} · {o.delivery.phone}</p>
              <p style={{ fontSize: 11, color: T2, marginTop: 2 }}>{o.delivery.address}{o.delivery.ref ? ` (${o.delivery.ref})` : ""}</p>
              <p style={{ fontSize: 10, color: T3, marginTop: 3 }}>Recogida: {o.delivery.pickup}</p>
            </> : <>
              <p style={{ fontSize: 12, fontWeight: 700, color: T1 }}>{o.delivery.recipient?.name} · {o.delivery.recipient?.phone}</p>
              <p style={{ fontSize: 11, color: T2, marginTop: 2 }}>{o.delivery.recipient?.address}</p>
              <p style={{ fontSize: 10, color: T3, marginTop: 3 }}>{o.delivery.recipient?.city}, {o.delivery.recipient?.province}</p>
            </>}
          </div>
        )}
        {o.delivery && o.delivery.mode === "persona" && (
          <div style={{ background: soft, border: `1px solid ${B}`, borderRadius: 13, padding: "12px 13px", marginBottom: 14 }}>
            <p style={{ fontSize: 10.5, color: T2, lineHeight: 1.5 }}>🤝 Entrega en persona — coordina el punto de encuentro con el vendedor por el chat.</p>
          </div>
        )}

        {/* Pago / comisión */}
        <div style={{ background: soft, border: `1px solid ${B}`, borderRadius: 13, padding: "12px 13px", marginBottom: 14 }}>
          <p style={{ fontSize: 10.5, color: T2, lineHeight: 1.5 }}>{md.desc}.</p>
          {o.shipType === "intl" && o.shipPrice ? <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}><span style={{ fontSize: 11, color: T2 }}>Envío internacional</span><span style={{ fontSize: 11, fontWeight: 700, color: T1 }}>{money(o.shipPrice, cur)}</span></div> : null}
          {viewerIsSeller && !viewerLooksBuyer && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}><span style={{ fontSize: 11, color: T2 }}>Comisión plataforma ({o.commissionPct || 0}%)</span><span style={{ fontSize: 11, fontWeight: 700, color: T1 }}>{money(commission, cur)}</span></div>}
        </div>

        {/* Línea de estados */}
        <p style={{ fontSize: 10, fontWeight: 700, color: T2, letterSpacing: .4, marginBottom: 12, textTransform: "uppercase" }}>Progreso</p>
        <div style={{ background: card, border: `1px solid ${B}`, borderRadius: 16, padding: "15px 15px 6px", marginBottom: 16 }}>
          {flow.map((st, i) => {
            const isDone = i <= idx, isNext = i === idx + 1, isLast = i === flow.length - 1;
            const col = isDone ? "#22C55E" : isNext ? G : T3;
            const t = fmtT(histAt(st.key));
            return (
              <div key={st.key} style={{ display: "flex", gap: 11 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18, flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: isDone ? "#22C55E" : "transparent", border: isDone ? "none" : `2px solid ${col}` }}>
                    {isDone && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    {isNext && <div style={{ width: 7, height: 7, borderRadius: "50%", background: G }} />}
                  </div>
                  {!isLast && <div style={{ width: 2, flex: 1, minHeight: 24, background: i < idx ? "#22C55E" : B, marginTop: 2, marginBottom: 2, borderRadius: 2 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 14 }}>
                  <p style={{ fontSize: 12.5, fontWeight: isNext ? 800 : 600, color: isDone ? T1 : isNext ? G : T3 }}>{st.label}</p>
                  {t && <p style={{ fontSize: 9.5, color: T3, marginTop: 1 }}>{t}</p>}
                  {isNext && <p style={{ fontSize: 9.5, color: G, marginTop: 1, fontWeight: 700 }}>SIGUIENTE</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coreografía 3 partes: confirmaciones por rol + aviso */}
        {(() => {
          const isSeller = (!!user?.id && (o.seller_id === user.id || o.sellerId === user.id)) || (!!me && o.sellerName === me);
          const viewerIsBuyer = (!!user?.id && (o.buyer_id === user.id || o.buyerId === user.id)) || (o.buyerId != null && o.buyerId === user?.id) || (!!o.buyerName && o.buyerName === me) || !isSeller;
          const isLocal = (o.shipType || o.shipMode) === "local";
          const cash = (o.payMethod || o.payment || "efectivo").toString().toLowerCase().includes("efect") || !o.payMethod;
          const notConfirmed = (o.stepIdx || 0) < 1 && !o.sellerConfirmed;
          const courierDelivered = ["entregado", "esperando_pago", "completado"].includes(o.courierStage);
          const delivered = done || courierDelivered;
          const fullyDone = o.courierStage === "completado" || (o.buyerConfirmed && o.sellerPaid);
          const btn = (txt, fn, kind) => <button key={txt} className="p" onClick={fn} style={{ width: "100%", background: kind === "danger" ? "transparent" : kind === "ghost" ? soft : G, color: kind === "danger" ? "#ef4444" : kind === "ghost" ? T1 : "#000", border: kind === "danger" ? "1px solid #ef444455" : kind === "ghost" ? `1px solid ${B}` : "none", borderRadius: 13, padding: "14px", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{txt}</button>;

          let nudge = null, actions = [];
          if (o.feeApproval === "pending") {
            nudge = `Tu mensajero propone un domicilio de ${Math.round(o.proposedFee || 0)} CUP (estimado: ${Math.round(o.baseFee || 0)} CUP). ¿Lo apruebas?`;
            actions.push(btn(`Aprobar — domicilio ${Math.round(o.proposedFee || 0)} CUP`, () => onApproveFee && onApproveFee(true)));
            actions.push(btn("Rechazar y buscar otro mensajero", () => onApproveFee && onApproveFee(false), "danger"));
          }
          else if (o.status === "fallido") nudge = "❌ Entrega marcada como fallida (sin pago). El producto fue devuelto.";
          else if (fullyDone) nudge = "✅ Entrega completada. ¡Gracias!";
          else if (notConfirmed) {
            nudge = isSeller ? "Confirma el pedido para que un mensajero pueda recogerlo." : "Esperando que el vendedor confirme tu pedido.";
            if (isSeller) actions.push(btn("Confirmar pedido — tengo el producto listo", onSellerConfirm));
          } else if (delivered) {
            if (!o.buyerConfirmed) {
              if (!isSeller) { nudge = "Tu pedido fue entregado. Confírmalo para cerrar."; actions.push(btn("Confirmar que recibí el producto", onBuyerConfirm)); }
              else nudge = "Entregado. Esperando que el comprador confirme la recepción.";
            } else if (!o.sellerPaid) {
              if (isSeller && cash) { nudge = "El mensajero te entregó el efectivo. Confírmalo para cerrar."; actions.push(btn("Confirmar que recibí mi pago", () => onSellerPayment(true))); }
              else if (isSeller) { nudge = "El comprador recibió el producto. ¿Recibiste la transferencia?"; actions.push(btn("Confirmar que recibí la transferencia", () => onSellerPayment(true))); actions.push(btn("No recibí el pago", () => onSellerPayment(false), "danger")); }
              else nudge = "Recibido. Esperando que el vendedor confirme el pago para cerrar la entrega.";
            }
          } else {
            if (o.courierName) nudge = isSeller ? `${o.courierName} está gestionando la entrega.` : `Tu mensajero (${o.courierName}) está en camino.`;
            else nudge = isSeller ? "Pedido confirmado. Esperando que un mensajero acepte la entrega." : "Buscando mensajero para tu entrega.";
          }

          return <>
            {nudge && <div style={{ background: soft, border: `1px solid ${B}`, borderRadius: 13, padding: "12px 14px", marginBottom: 12, fontSize: 12, color: T1, fontWeight: 600, lineHeight: 1.5 }}>{nudge}</div>}
            {actions}
          </>;
        })()}

        {/* Calificaciones al completar */}
        {isCompleted && (viewerLooksBuyer || !viewerIsSeller) && (rated
          ? <div style={{ background: "#22C55E12", border: "1px solid #22C55E35", borderRadius: 16, padding: "16px", marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>⭐</div>
              <p style={{ fontSize: 13, fontWeight: 800, color: T1 }}>¡Gracias por tu calificación!</p>
              <p style={{ fontSize: 11, color: T3, marginTop: 3 }}>Puedes cambiarla luego desde el perfil del mensajero o del vendedor.</p>
            </div>
          : <div style={{ background: card, border: `1px solid ${B}`, borderRadius: 16, padding: "16px", marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 900, color: T1, marginBottom: 3 }}>Califica tu experiencia</p>
              <p style={{ fontSize: 11, color: T3, marginBottom: 14 }}>Tu opinión ayuda a otros a confiar en el servicio. No es obligatorio.</p>

              <div style={{ background: `${G}10`, border: `1px solid ${G}30`, borderRadius: 13, padding: "13px", marginBottom: 11 }}>
                <p style={{ fontSize: 12.5, fontWeight: 800, color: T1 }}>🛵 RETADOR · Servicio de entregas</p>
                <p style={{ fontSize: 10.5, color: T3, marginBottom: 9 }}>¿Cómo estuvo el servicio en general?</p>
                {stars(rate.sys, n => setRate(r => ({ ...r, sys: n })))}
                {rate.sys > 0 && <textarea value={rateMsg.sys} onChange={e => setRateMsg(m => ({ ...m, sys: e.target.value }))} placeholder="Cuéntale a otros cómo fue el servicio de entrega en general (opcional)…" style={{ width: "100%", marginTop: 10, background: soft, border: `1px solid ${B}`, borderRadius: 10, padding: "9px 11px", fontSize: 12, color: T1, minHeight: 48, resize: "vertical", fontFamily: "inherit" }} />}
              </div>

              {o.courierName && <div style={{ borderTop: `1px solid ${B}`, paddingTop: 12, marginBottom: 11 }}>
                <p style={{ fontSize: 12.5, fontWeight: 800, color: T1 }}>Tu mensajero · {o.courierName}</p>
                <p style={{ fontSize: 10.5, color: T3, marginBottom: 9 }}>¿Qué tal la entrega?</p>
                {stars(rate.courier, n => setRate(r => ({ ...r, courier: n })))}
                {rate.courier > 0 && <textarea value={rateMsg.courier} onChange={e => setRateMsg(m => ({ ...m, courier: e.target.value }))} placeholder="Cuéntale a otros cómo fue el servicio del mensajero: ¿rápido?, ¿buen trato?, ¿cuidó el producto?…" style={{ width: "100%", marginTop: 10, background: soft, border: `1px solid ${B}`, borderRadius: 10, padding: "9px 11px", fontSize: 12, color: T1, minHeight: 48, resize: "vertical", fontFamily: "inherit" }} />}
              </div>}

              <div style={{ borderTop: `1px solid ${B}`, paddingTop: 12, marginBottom: 4 }}>
                <p style={{ fontSize: 12.5, fontWeight: 800, color: T1 }}>Vendedor · {o.sellerName || "—"}</p>
                <p style={{ fontSize: 10.5, color: T3, marginBottom: 9 }}>¿Cómo fue el producto y la atención?</p>
                {stars(rate.seller, n => setRate(r => ({ ...r, seller: n })))}
                {rate.seller > 0 && <textarea value={rateMsg.seller} onChange={e => setRateMsg(m => ({ ...m, seller: e.target.value }))} placeholder="Cuéntale a otros cómo llegó el producto y el trato del vendedor: ¿llegó bien?, ¿era como lo describía?…" style={{ width: "100%", marginTop: 10, background: soft, border: `1px solid ${B}`, borderRadius: 10, padding: "9px 11px", fontSize: 12, color: T1, minHeight: 48, resize: "vertical", fontFamily: "inherit" }} />}
              </div>

              <button type="button" disabled={!rate.sys && !rate.courier && !rate.seller} onClick={submitRatings} style={{ width: "100%", marginTop: 11, background: (rate.sys || rate.courier || rate.seller) ? G : soft, color: (rate.sys || rate.courier || rate.seller) ? "#000" : T3, border: "none", borderRadius: 13, padding: "14px", fontSize: 13.5, fontWeight: 800, cursor: (rate.sys || rate.courier || rate.seller) ? "pointer" : "default" }}>Enviar calificación</button>
            </div>)}

        {/* Chat + avanzar demo */}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="p" onClick={onAdvance} style={{ flex: 1, background: "transparent", color: T3, border: `1px dashed ${B}`, borderRadius: 50, padding: "12px", fontSize: 11, fontWeight: 700 }}>Avanzar estado (demo)</button>
          <button className="p" onClick={onChat} style={{ width: 48, height: 48, borderRadius: "50%", border: `1px solid ${B}`, background: soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic n="msg" c={T2} s={19} /></button>
        </div>
        <p style={{ fontSize: 9, color: T3, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>Cada confirmación la marca quien corresponde (vendedor, comprador o mensajero). El botón "demo" es solo para probar el avance.</p>
      </div>
    </div>
  );
}

export function OrdersScreen({ user, me, onBack, flash, orders = [], lastSeen = {}, onSeen, onOpen }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const [tab, setTab] = useState("compras");   // "compras" | "ventas"

  // Rol de cada pedido según quién soy (por id de comprador/vendedor).
  const roleOf = (o) => o.role || (((o.buyerId ?? o.buyer_id) === user?.id) ? "compra" : "venta");
  const compras = orders.filter(o => roleOf(o) === "compra");
  const ventas  = orders.filter(o => roleOf(o) === "venta");
  const countNew = (list, ts) => list.filter(o => (o.createdAt || 0) > (ts || 0)).length;
  const comprasNew = countNew(compras, lastSeen.compras);
  const ventasNew  = countNew(ventas, lastSeen.ventas);

  // "Base" = cuándo se vio por última vez cada pestaña, capturada al abrirla ESTA
  // sesión (antes de marcarla vista). Con ella el "NUEVO" de las tarjetas se
  // mantiene mientras miras y desaparece la próxima vez, en vez de parpadear.
  const baselineRef = useRef({});
  useEffect(() => {
    if (baselineRef.current[tab] === undefined) baselineRef.current[tab] = lastSeen[tab] || 0;
    onSeen && onSeen(tab);   // al abrir/cambiar de pestaña, márcala vista (limpia su badge)
  }, [tab]);

  const statusColors = { pendiente: "#FBBF24", pending: "#FBBF24", creada: "#FBBF24", confirmed: "#60A5FA", confirmado: "#60A5FA", shipped: "#A78BFA", delivered: "#22C55E", entregado: "#22C55E", cancelled: "#F87171", fallido: "#F87171" };
  const statusLabels = { pendiente: "Pendiente", pending: "Pendiente", creada: "Creado", confirmed: "Confirmado", confirmado: "Confirmado", shipped: "En camino", delivered: "Entregado", entregado: "Entregado", cancelled: "Cancelado", fallido: "Fallido" };
  const stepLabel = (o) => o.feeApproval === "pending" ? "Confirma la tarifa" : ((o.flow && o.flow[o.stepIdx]) ? o.flow[o.stepIdx].label : (statusLabels[o.status] || o.status));
  const stepColor = (o) => {
    if (o.feeApproval === "pending") return "#F59E0B";
    if (!o.flow) return statusColors[o.status] || "#888";
    if (o.stepIdx >= o.flow.length - 1) return "#22C55E";
    if (o.stepIdx === 0) return "#FBBF24";
    return "#60A5FA";
  };

  const isNew = (o) => (o.createdAt || 0) > (baselineRef.current[tab] ?? (lastSeen[tab] || 0));
  const renderCard = (o) => {
    const sc = stepColor(o);
    const sl = SHIP_LABELS[o.shipType || o.shipMode] || SHIP_LABELS.local;
    const md = MODALIDAD_LABELS[o.modalidad] || null;
    return (
      <div key={o.id} onClick={() => onOpen?.(o)} className={onOpen ? "cd" : ""} style={{ position: "relative", background: S, border: `1px solid ${isNew(o) ? G + "66" : B}`, borderRadius: 14, padding: "14px", marginBottom: 10, cursor: onOpen ? "pointer" : "default" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: "#1a1a1a", overflow: "hidden", flexShrink: 0 }}>
            {o.image && <img src={o.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <p style={{ fontSize: 11, color: "#888" }}>Pedido #{String(o.id).slice(-8).toUpperCase()}{isNew(o) ? <span style={{ marginLeft: 6, fontSize: 8.5, fontWeight: 800, color: "#fff", background: G, borderRadius: 5, padding: "1px 5px", verticalAlign: "middle" }}>NUEVO</span> : null}</p>
              <div style={{ background: sc + "20", border: `1px solid ${sc}35`, borderRadius: 100, padding: "3px 10px", flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: sc }}>{stepLabel(o)}</span>
              </div>
            </div>
            {o.title && <p style={{ fontSize: 12.5, fontWeight: 700, color: T1, margin: "2px 0 3px" }}>{o.title}{o.qty > 1 ? ` ×${o.qty}` : ""}</p>}
            <p style={{ fontSize: 17, fontWeight: 900, color: G }}>{money(o.amount, o.currency)}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", margin: "9px 0 8px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: isDark ? "#111" : "#F2F3F5", border: `1px solid ${B}`, borderRadius: 50, padding: "3px 9px", fontSize: 9.5, fontWeight: 700, color: T2 }}>{sl.icon} {sl.label}</span>
          {md && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${G}12`, border: `1px solid ${G}28`, borderRadius: 50, padding: "3px 9px", fontSize: 9.5, fontWeight: 700, color: G }}>{md.label}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 10, color: T3 }}>{new Date(o.createdAt || o.created_at || Date.now()).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</p>
          {onOpen && <span style={{ fontSize: 10, fontWeight: 700, color: G }}>Ver seguimiento ›</span>}
        </div>
      </div>
    );
  };

  const TabBtn = ({ id, label, nuevos }) => {
    const on = tab === id;
    return (
      <button onClick={() => setTab(id)} className="p" style={{ flex: 1, position: "relative", background: "transparent", border: "none", borderBottom: `2px solid ${on ? G : "transparent"}`, padding: "12px 4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
        <span style={{ fontSize: 13, fontWeight: on ? 800 : 600, color: on ? T1 : T2 }}>{label}</span>
        {nuevos > 0 && <span style={{ minWidth: 17, height: 17, borderRadius: 999, background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{nuevos > 99 ? "99+" : nuevos}</span>}
      </button>
    );
  };

  const list = tab === "compras" ? compras : ventas;
  const empty = tab === "compras"
    ? { icon: "🛍️", title: "Aún no has comprado nada.", sub: "Cuando compres, tus pedidos aparecerán aquí." }
    : { icon: "🏷️", title: "Aún no te han comprado nada.", sub: "Publica productos para empezar a vender." };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, position: "sticky", top: 0, zIndex: 5 }}>
        <div style={{ padding: "13px 18px", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c="#666" s={20} /></button>
          <p style={{ fontSize: 14, fontWeight: 800, color: T1 }}>Pedidos</p>
        </div>
        <div style={{ display: "flex", padding: "0 10px" }}>
          <TabBtn id="compras" label="Compras" nuevos={comprasNew} />
          <TabBtn id="ventas"  label="Ventas"  nuevos={ventasNew} />
        </div>
      </div>

      {list.length === 0
        ? <div style={{ padding: "60px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 46, marginBottom: 14 }}>{empty.icon}</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T1, marginBottom: 7 }}>{empty.title}</p>
            <p style={{ fontSize: 11.5, color: T3, lineHeight: 1.5 }}>{empty.sub}</p>
          </div>
        : <div style={{ padding: "14px 18px 90px" }}>
            {list.map(o => renderCard(o))}
          </div>
      }
    </div>
  );
}
