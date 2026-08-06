import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, memo } from "react";
import { getAvailableDeliveries, getCourierEarnings, getCourierDebt, getUserById, getProductById, getMyCourierApplication, submitCourierApplication, supabase, usePlatformCfg, uploadKyc, KycSelfieSample, PullIndicator, usePullToRefresh } from "../shared/index.js";

// Botón "Recogí"/"Entregué" — el botón MÁS crítico de la app, y el que ya ha
// fallado dos veces por la misma causa: un re-render del árbol ocurrido ENTRE el
// pointerdown y el pointerup de un toque real impide que el navegador sintetice
// el evento "click", así que el dedo cae justo encima y aun así no pasa nada
// (la pantalla "parpadea" y el estado no avanza).
//
// Blindaje en tres capas, para que no vuelva a pasar por una tercera causa nueva:
//   1. Se dispara en onPointerUp, NO en onClick. pointerup llega al elemento aunque
//      haya habido re-renders por medio — es inmune a esta clase de bug.
//   2. memo() + props estables: los refrescos de ganancias/deuda/realtime del
//      resto de la pantalla no llegan a re-renderizar este botón.
//   3. Guarda anti-doble-disparo: si un navegador emite pointerup Y click, el
//      segundo se ignora (misma entrega + misma etapa).
const CourierStageButton = memo(function CourierStageButton({ orderId, status, onStage, mutedColor }) {
  const firedRef = useRef("");
  const [pressed, setPressed] = useState(false);

  const stage = status === "asignado" ? "recogido" : status === "en_ruta" ? "entregado" : null;

  const fire = (e) => {
    // Solo el botón principal / el dedo: ignora clic derecho y similares.
    if (e && e.button != null && e.button !== 0) return;
    const key = `${orderId}:${stage}`;
    if (firedRef.current === key) return;   // ya disparado por el otro evento
    firedRef.current = key;
    setPressed(false);
    onStage(orderId, stage);
  };

  if (!stage) {
    return <div style={{ textAlign: "center", color: mutedColor, fontSize: 12.5, fontWeight: 700, padding: "10px" }}>Estado: {status}</div>;
  }

  const isPickup = stage === "recogido";
  return (
    <button
      onPointerUp={fire}
      onClick={fire}                                  /* respaldo: la guarda evita el doble disparo */
      onPointerDown={() => setPressed(true)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        width: "100%", height: 52, borderRadius: 14, border: "none",
        background: isPickup ? "#6366F1" : "#22C55E",
        color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
        // Señal táctil clara al presionar: se hunde un poco y baja algo de
        // opacidad. No cambia el color ni el comportamiento.
        transform: pressed ? "scale(0.97)" : "scale(1)",
        opacity: pressed ? 0.88 : 1,
        transition: "transform .09s ease, opacity .09s ease",
        touchAction: "manipulation",                  /* sin retardo de 300 ms ni doble-tap-zoom */
        WebkitTapHighlightColor: "transparent",
      }}
    >{isPickup ? "📦 Recogí el pedido" : "✅ Entregué"}</button>
  );
});

// Chip de PERFIL PÚBLICO: foto + nombre reales (tabla profiles). Al tocarlo abre
// el perfil público de esa persona. No expone nada privado, solo reputación.
function ProfileChip({ id, fallback = "Usuario", role, onOpen, dark }) {
  const [p, setP] = useState(null);
  useEffect(() => { let a = true; if (id) getUserById(id).then(x => { if (a) setP(x); }).catch(() => {}); return () => { a = false; }; }, [id]);
  const t1 = dark ? "#f0f0f2" : "#0f172a", t3 = dark ? "#6b7280" : "#94a3b8", bd = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const name = p?.name || fallback;
  return (
    <button onClick={(e) => { e.stopPropagation(); id && onOpen && onOpen(id); }} disabled={!id}
      style={{ display: "flex", alignItems: "center", gap: 7, background: "transparent", border: `1px solid ${bd}`, borderRadius: 100, padding: "5px 10px 5px 5px", cursor: id ? "pointer" : "default" }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", background: dark ? "#26262b" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: t1, flexShrink: 0 }}>
        {p?.avatar ? <img src={p.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : name[0]?.toUpperCase()}
      </span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
        {role && <span style={{ fontSize: 8.5, color: t3, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{role}</span>}
        <span style={{ fontSize: 12, color: t1, fontWeight: 700, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      </span>
    </button>
  );
}

// Nombre REAL (profiles.full_name) resuelto por id — nunca el nombre que el
// comprador escribió a mano en el formulario de envío, ni un genérico tipo
// "Vendedor"/"Comprador" tratado como si fuera el nombre de la persona.
function RealName({ id, fallback }) {
  const [name, setName] = useState(fallback);
  useEffect(() => { let a = true; if (id) getUserById(id).then(p => { if (a && p?.name) setName(p.name); }).catch(() => {}); return () => { a = false; }; }, [id]);
  return name;
}

// ═════════════════════════════════════════════════════════════════════════════
// TABLERO DEL MENSAJERO — solo datos REALES (sin demo).
// · Disponibles: pool del backend (get_available_deliveries) con la información
//   COMPLETA para decidir (el pool solo lo ven mensajeros aprobados).
// · Mi entrega: SOLO entregas donde yo soy el mensajero (courier_id), con
//   progreso Aceptada → Recogido → En reparto → Entregado y los 2 botones reales.
// · Historial: mis entregas terminadas.
// ═════════════════════════════════════════════════════════════════════════════
function CourierDashboard({ meName, meId, orders, localBase, onAccept, onStage, onCancel, onReport, onClose, dark, record, onViewProfile, onChat }) {
  const platformCfg = usePlatformCfg(); // config GLOBAL del backend (surge, tarifas…)
  const bg = dark ? "#0a0a0a" : "#f1f5f9", card = dark ? "#141417" : "#fff", t1 = dark ? "#f0f0f2" : "#0f172a", t2 = dark ? "#9aa0aa" : "#64748b", t3 = dark ? "#6b7280" : "#94a3b8", bd = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)", AC = "#6366F1";
  const [tab, setTab] = useState("disp");
  const [online, setOnline] = useState(true);
  const [adjustFor, setAdjustFor] = useState(null);
  const [adjustVal, setAdjustVal] = useState("");
  const [activaSeen, setActivaSeen] = useState(false);
  const [reportFor, setReportFor] = useState(null);   // pedido que se está reportando
  const [reportTarget, setReportTarget] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportOther, setReportOther] = useState(false);
  const [reportSent, setReportSent] = useState({});
  // Al tocar Llamar/Mapa/Mensaje se elige primero SOBRE QUIÉN: recoger (vendedor) o
  // entregar (comprador). { orderId, kind:'call'|'map'|'chat' } | null.
  const [actionPick, setActionPick] = useState(null);

  // POOL de entregas disponibles: viene del backend con TODO (título, foto,
  // recogida, entrega, tarifa, pago). Se refresca en vivo con el realtime.
  const [pool, setPool] = useState([]);
  const reloadPool = useCallback(async () => {
    const rows = await getAvailableDeliveries();
    setPool((rows || []).map(r => ({
      ...r,
      shipPrice: r.ship_price ?? 0,
      deliveryCost: r.ship_price ?? 0,
      buyerId: r.buyer_id ?? null,
      sellerId: r.seller_id ?? null,
      payMethod: r.payment_method || r.pay_method || "efectivo",
      createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      shipMode: "local", status: "confirmado", __pool: true,
    })));
  }, []);
  useEffect(() => { reloadPool(); }, [reloadPool]);

  // GANANCIAS reales (courier_earnings): hoy por defecto, con opción de ver el
  // TOTAL acumulado — todo desde la RPC, nunca sumado a mano de los pedidos
  // ya cargados en el frontend (esos no garantizan estar completos ni
  // acotados a "hoy").
  const [earnings, setEarnings] = useState(null);
  const [earnView, setEarnView] = useState("hoy"); // "hoy" | "total"
  const reloadEarnings = useCallback(async () => {
    const e = await getCourierEarnings();
    setEarnings(e);
  }, []);
  useEffect(() => { reloadEarnings(); }, [reloadEarnings]);

  // DEUDA real (courier_debt): comisión de entrega (commDeliveryPct) que se
  // registra sola en el mismo ledger de los vendedores al completarse cada
  // entrega. Nunca calculada aquí — solo mostrada tal cual llega del backend.
  const [debt, setDebt] = useState(null);
  const reloadDebt = useCallback(async () => {
    const d = await getCourierDebt();
    setDebt(d);
  }, []);
  useEffect(() => { reloadDebt(); }, [reloadDebt]);

  // PULL-TO-REFRESH real (no navega): antes, deslizar hacia abajo en esta
  // pantalla disparaba el gesto NATIVO del navegador, que recarga la página
  // entera y manda de vuelta a la pantalla de inicio. Con el gesto propio
  // solo se piden de nuevo los datos (pool + ganancias + deuda) sin navegar.
  const scrollRef = useRef(null);
  const reloadAll = useCallback(async () => { await Promise.all([reloadPool(), reloadEarnings(), reloadDebt()]); }, [reloadPool, reloadEarnings, reloadDebt]);
  const ptr = usePullToRefresh(scrollRef, reloadAll);

  useEffect(() => {
    // Nombre ÚNICO por montaje: supabase.channel() reutiliza el canal si el
    // nombre se repite (p.ej. al salir y volver a entrar a "Modo Mensajero" en
    // la misma sesión) y al re-suscribir revienta en silencio — el pool parecía
    // "parpadear" (se veía el toque de refresco) pero nunca llegaban los
    // pedidos nuevos, porque el canal reciclado ya no entregaba eventos.
    const ch = supabase.channel(`rt-courier-pool-${meId || "anon"}-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { reloadPool(); reloadEarnings(); reloadDebt(); })
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch (e) {} };
  }, [meId, reloadPool, reloadEarnings, reloadDebt]);

  // MIS entregas: solo donde yo soy el mensajero (courier_id real).
  const mine = (orders || []).filter(o => meId && (o.courierId === meId || o.courier_id === meId));
  const actives = mine.filter(o => !["entregado", "completado", "fallido", "cancelado"].includes(o.status));
  const done = mine.filter(o => ["entregado", "completado"].includes(o.status));
  useEffect(() => { if (tab === "activa") setActivaSeen(true); }, [tab]);
  useEffect(() => { setActivaSeen(false); }, [actives.length]);

  const money = n => Math.round(n || 0).toLocaleString() + " CUP";
  const surgeCfg = (() => { const c = platformCfg || {}; return { on: c.surgeActive === true, every: Number(c.surgeIntervalMin) || 30, step: Number(c.surgeStepPct) || 15, cap: Number(c.surgeCapPct) || 60 }; })();
  const baseFeeOf = o => o.deliveryCost || o.shipPrice || o.ship_price || localBase;
  const surgePct = o => { if (!surgeCfg.on || o.courierId || o.courier_id) return 0; const mins = (Date.now() - (o.createdAt || 0)) / 60000; const steps = Math.floor(mins / surgeCfg.every); return Math.min(surgeCfg.cap, steps * surgeCfg.step); };
  const feeOf = o => { const b = baseFeeOf(o); return Math.round(b * (1 + surgePct(o) / 100)); };
  const isCash = o => (o.payMethod || o.payment_method || "efectivo").toString().toLowerCase().includes("efect") || !(o.payMethod || o.payment_method);
  const dropOf = o => o.delivery?.address || o.ship_to || o.shipTo || "";
  // Nombre REAL de quien recibe (profiles.full_name, ya resuelto en getUserOrders),
  // con el apodo elegido como complemento discreto — nunca el texto libre solo.
  const dropNameOf = o => {
    const real = o.buyerName || o.delivery?.name || "Comprador";
    const nick = o.deliveryNick || o.delivery?.nick;
    return nick ? `${real} (${nick})` : real;
  };
  const dropPhoneOf = o => o.delivery?.phone || "";
  const refOf = o => o.delivery?.ref || o.delivery?.note || "";
  const fmtDate = t => t ? new Date(t).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

  const Card = ({ children, style }) => <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 16, padding: 15, ...style }}>{children}</div>;
  const row = (icon, label, val, sub) => (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: AC + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 9.5, color: t3, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
        <div style={{ fontSize: 12.5, color: t1, fontWeight: 600, lineHeight: 1.4 }}>{val || "—"}</div>
        {sub && <div style={{ fontSize: 11, color: t2, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
  const payBadge = o => {
    const cash = isCash(o);
    return <span style={{ fontSize: 10, fontWeight: 700, color: cash ? "#F59E0B" : AC, background: (cash ? "#F59E0B" : AC) + "1a", borderRadius: 100, padding: "3px 9px" }}>{cash ? "💵 Efectivo" : "💳 Transferencia"}</span>;
  };

  // ── Tarjeta del POOL: información COMPLETA para decidir ──────────────────────
  const poolCard = o => (
    <Card key={o.id} style={{ marginBottom: 12, padding: 14 }}>
      <div style={{ display: "flex", gap: 11, alignItems: "center", marginBottom: 10 }}>
        {o.image
          ? <img src={o.image} alt="" style={{ width: 52, height: 52, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
          : <div style={{ width: 52, height: 52, borderRadius: 11, background: AC + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📦</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title || "Pedido"}{o.qty > 1 ? ` ×${o.qty}` : ""}</div>
          <div style={{ fontSize: 10.5, color: t3, marginTop: 2 }}>{o.cat || (o.sellerId ? "Producto" : "Paquete")} · {fmtDate(o.createdAt)}</div>
        </div>
        <span style={{ fontSize: 16, fontWeight: 900, color: "#22C55E", whiteSpace: "nowrap" }}>+{money(feeOf(o))}</span>
      </div>
      <div style={{ borderTop: `1px solid ${bd}`, borderBottom: `1px solid ${bd}`, margin: "2px 0 10px" }}>
        {/* Sin vendedor (paquete suelto): la recogida viene en o.delivery.pickupAddress
            en vez de la columna del producto — mismo dato que ya usa la tarjeta
            "Mi entrega" tras aceptar. */}
        {row("🏪", "Recoger en", o.pickup_address || o.delivery?.pickupAddress || "Coordinar con el vendedor", (o.pickup_phone || o.delivery?.pickupPhone) ? "Tel: " + (o.pickup_phone || o.delivery?.pickupPhone) : null)}
        <div style={{ height: 1, background: bd }} />
        {row("📍", "Entregar en", dropOf(o) || "Ver con el comprador", dropNameOf(o))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 11 }}>
        {o.sellerId && <ProfileChip id={o.sellerId} fallback="Vendedor" role="Vendedor" onOpen={onViewProfile} dark={dark} />}
        <ProfileChip id={o.buyerId} fallback="Comprador" role="Comprador" onOpen={onViewProfile} dark={dark} />
        <span style={{ marginLeft: "auto" }}>{payBadge(o)}</span>
      </div>
      <button onClick={() => { setAdjustVal(String(feeOf(o))); setAdjustFor(o); }} disabled={!online} style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: !online ? (dark ? "#26262b" : "#e2e8f0") : AC, color: !online ? t3 : "#fff", fontSize: 14, fontWeight: 800, cursor: !online ? "default" : "pointer" }}>{!online ? "Conéctate para aceptar" : "Aceptar entrega"}</button>
    </Card>
  );

  // ── MI ENTREGA: tarjeta completa con progreso y acciones reales ─────────────
  const STEPS = [
    { key: "asignado", label: "Aceptada" },
    { key: "recogido", label: "Recogido" },
    { key: "en_ruta", label: "En reparto" },
    { key: "entregado", label: "Entregado" },
  ];
  const stepIdxOf = o => {
    const i = STEPS.findIndex(s => s.key === o.status);
    if (i >= 0) return i;
    if (["entregado", "completado"].includes(o.status)) return 3;
    return 0;
  };
  const [prodCache, setProdCache] = useState({});
  useEffect(() => {
    actives.forEach(o => {
      const pid = o.product_id || o.productId;
      if (!pid || prodCache[pid] !== undefined) return;
      setProdCache(prev => ({ ...prev, [pid]: null }));
      getProductById(pid).then(p => setProdCache(prev => ({ ...prev, [pid]: p }))).catch(() => {});
    });
  }, [actives.map(o => o.product_id || o.productId).join("|")]);

  const activeCard = o => {
    const pid = o.product_id || o.productId;
    const prod = prodCache[pid] || null;
    const pickupAddr = o.delivery?.pickupAddress || prod?.pickupAddress || "";
    const pickupPhone = o.delivery?.pickupPhone || prod?.pickupPhone || "";
    const idx = stepIdxOf(o);
    const feePending = o.feeApproval === "pending" || (o.status === "confirmado" && o.proposedFee);
    const cash = isCash(o);
    const canPickup = o.status === "asignado";
    const mapUrl = a => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a || "")}`;
    return (
      <Card key={o.id} style={{ marginBottom: 14, padding: 14 }}>
        {/* Producto */}
        <div style={{ display: "flex", gap: 11, alignItems: "center", marginBottom: 10 }}>
          {(o.image || prod?.image)
            ? <img src={o.image || prod?.image} alt="" style={{ width: 52, height: 52, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
            : <div style={{ width: 52, height: 52, borderRadius: 11, background: AC + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📦</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title || prod?.title || "Pedido"}{o.qty > 1 ? ` ×${o.qty}` : ""}</div>
            <div style={{ fontSize: 10.5, color: t3, marginTop: 2 }}>{fmtDate(o.createdAt)}</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#22C55E", whiteSpace: "nowrap" }}>+{money(feeOf(o))}</span>
        </div>

        {/* Progreso del mensajero */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "4px 0 12px" }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 4, borderRadius: 2, background: i <= idx ? "#22C55E" : (dark ? "#26262b" : "#e2e8f0"), marginBottom: 4 }} />
              <span style={{ fontSize: 8.5, fontWeight: 700, color: i <= idx ? "#22C55E" : t3, textTransform: "uppercase", letterSpacing: ".02em" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Recogida y entrega con perfiles tocables */}
        <div style={{ borderTop: `1px solid ${bd}`, borderBottom: `1px solid ${bd}`, marginBottom: 10 }}>
          {row("🏪", "Recoger en", pickupAddr || "Coordinar con el vendedor", pickupPhone ? "Tel: " + pickupPhone : null)}
          {(o.sellerId || o.seller_id) && (
            <div style={{ display: "flex", gap: 8, padding: "0 0 8px 38px" }}>
              <ProfileChip id={o.sellerId || o.seller_id} fallback={o.sellerName || "Vendedor"} role="Vendedor" onOpen={onViewProfile} dark={dark} />
            </div>
          )}
          <div style={{ height: 1, background: bd }} />
          {row("📍", "Entregar en", dropOf(o) || "Ver con el comprador", dropNameOf(o) + (dropPhoneOf(o) ? " · " + dropPhoneOf(o) : ""))}
          {refOf(o) && row("📝", "Referencia", refOf(o))}
          <div style={{ display: "flex", gap: 8, padding: "0 0 10px 38px" }}>
            <ProfileChip id={o.buyerId || o.buyer_id} fallback={dropNameOf(o)} role="Comprador" onOpen={onViewProfile} dark={dark} />
          </div>
        </div>

        {/* Dinero */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
          {payBadge(o)}
          <span style={{ fontSize: 11, color: t2, fontWeight: 600 }}>{cash ? <>Cobras <b style={{ color: t1 }}>{money((o.amount || 0) + feeOf(o))}</b> (producto + tu tarifa)</> : <>Solo cobras <b style={{ color: "#22C55E" }}>{money(feeOf(o))}</b> en efectivo</>}</span>
        </div>

        {/* Acciones: llamar / mapa / chat — cada una pregunta primero SOBRE QUIÉN */}
        <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
          <button onClick={() => setActionPick({ orderId: o.id, kind: "call" })} style={{ flex: 1, textAlign: "center", background: "#22C55E18", border: "1px solid #22C55E45", color: "#16a34a", borderRadius: 11, padding: "10px 6px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>📞 Llamar</button>
          <button onClick={() => setActionPick({ orderId: o.id, kind: "map" })} style={{ flex: 1, textAlign: "center", background: card, border: `1px solid ${bd}`, color: t1, borderRadius: 11, padding: "10px 6px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>🗺️ Mapa</button>
          <button onClick={() => setActionPick({ orderId: o.id, kind: "chat" })} style={{ flex: 1, background: card, border: `1px solid ${bd}`, color: t1, borderRadius: 11, padding: "10px 6px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>💬 Mensaje</button>
        </div>

        {/* Selector Recoger (vendedor) vs Entregar (comprador) para la acción elegida */}
        {actionPick?.orderId === o.id && (() => {
          const kind = actionPick.kind;
          const kLabel = kind === "call" ? "Llamar" : kind === "map" ? "Ver en el mapa" : "Enviar mensaje";
          const sellerId = o.sellerId || o.seller_id || null;
          const buyerId = o.buyerId || o.buyer_id || null;
          const parts = [
            { role: "recoger", icon: "📍", head: "Recoger en", name: o.sellerName || "Vendedor", phone: pickupPhone, addr: pickupAddr, id: sellerId },
            { role: "entregar", icon: "🏠", head: "Entregar a", name: dropNameOf(o), phone: dropPhoneOf(o), addr: dropOf(o), id: buyerId },
          ];
          const run = (part) => {
            if (kind === "call") { if (part.phone) window.location.href = `tel:${String(part.phone).replace(/\s/g, "")}`; }
            else if (kind === "map") { if (part.addr) window.open(mapUrl(part.addr), "_blank", "noopener,noreferrer"); }
            else if (kind === "chat") { if (part.id && onChat) onChat(part.id, part.name, { type: "order", id: o.id, title: o.title || "Pedido", image: o.image || prod?.image || null }); }
            setActionPick(null);
          };
          const avail = (part) => kind === "call" ? !!part.phone : kind === "map" ? !!part.addr : !!part.id;
          return (
            <div style={{ background: dark ? "#1a1a1e" : "#f8fafc", border: `1px solid ${bd}`, borderRadius: 12, padding: 12, marginBottom: 11 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: t2, marginBottom: 8 }}>{kLabel} — ¿a quién?</div>
              {parts.map(part => {
                const ok = avail(part);
                const detail = kind === "call" ? (part.phone || "Sin teléfono") : kind === "map" ? (part.addr || "Sin dirección") : (part.id ? "Abrir chat" : "Sin usuario");
                return (
                  <button key={part.role} onClick={() => ok && run(part)} disabled={!ok}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${bd}`, color: t1, borderRadius: 10, padding: "10px 12px", marginBottom: 7, cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.5 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{part.icon}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 9.5, color: t3, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{part.head}</span>
                      <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: t1 }}><RealName id={part.id} fallback={part.name} /></span>
                      <span style={{ display: "block", fontSize: 11, color: t2, marginTop: 1 }}>{detail}</span>
                    </span>
                  </button>
                );
              })}
              <button onClick={() => setActionPick(null)} style={{ width: "100%", background: "transparent", border: "none", color: t3, fontSize: 12, fontWeight: 700, padding: "6px", cursor: "pointer" }}>Cancelar</button>
            </div>
          );
        })()}

        {/* Reporte compacto */}
        {reportFor === o.id && !reportSent[o.id] && (
          <div style={{ background: dark ? "#1a1a1e" : "#f8fafc", border: `1px solid ${bd}`, borderRadius: 12, padding: 12, marginBottom: 11 }}>
            {!reportTarget
              ? <><div style={{ fontSize: 11.5, fontWeight: 800, color: t2, marginBottom: 8 }}>¿A quién quieres reportar?</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setReportTarget("comprador")} style={{ flex: 1, background: "transparent", border: `1px solid ${bd}`, color: t1, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Al comprador</button>
                    <button onClick={() => setReportTarget("vendedor")} style={{ flex: 1, background: "transparent", border: `1px solid ${bd}`, color: t1, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Al vendedor</button>
                  </div></>
              : (() => {
                  const targetName = reportTarget === "comprador" ? dropNameOf(o) : (o.sellerName || "Vendedor");
                  const targetId = reportTarget === "comprador" ? (o.buyerId || o.buyer_id || null) : (o.sellerId || o.seller_id || null);
                  const send = (reasonText) => {
                    onReport && onReport({ targetName, targetId, targetRole: reportTarget, reason: reasonText, detail: `Reportado por el mensajero durante la entrega de "${o.title || "pedido"}".`, reporterName: meName, reporterId: meId, orderId: o.id });
                    setReportSent(s => ({ ...s, [o.id]: `${reportTarget}: ${reasonText}` })); setReportFor(null); setReportTarget(""); setReportOther(false); setReportText("");
                  };
                  if (reportOther) return <>
                    <textarea value={reportText} maxLength={150} onChange={e => setReportText(e.target.value)} placeholder="Describe qué pasó (máx. 150 caracteres)…" autoFocus style={{ width: "100%", background: dark ? "#111" : "#fff", border: `1px solid ${bd}`, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: t1, minHeight: 60, resize: "vertical", fontFamily: "inherit", marginBottom: 8, boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setReportOther(false); setReportText(""); }} style={{ flex: 1, background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Atrás</button>
                      <button disabled={!reportText.trim()} onClick={() => send(reportText.trim())} style={{ flex: 2, background: reportText.trim() ? "#ef4444" : (dark ? "#26262b" : "#e2e8f0"), border: "none", color: reportText.trim() ? "#fff" : t3, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 800, cursor: reportText.trim() ? "pointer" : "default" }}>Enviar reporte</button>
                    </div>
                  </>;
                  return ["No encuentro la dirección", "No responde / no aparece", "Producto dañado o incorrecto", "No me dejaron cobrar", "Trato irrespetuoso", "Otro (escribir)"].map(r => <button key={r} onClick={() => { if (r === "Otro (escribir)") setReportOther(true); else send(r); }} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${bd}`, color: t1, borderRadius: 10, padding: "9px 12px", fontSize: 12, fontWeight: 600, marginBottom: 6, cursor: "pointer" }}>{r}</button>);
                })()}
          </div>
        )}
        {reportSent[o.id] && <div style={{ background: "#22C55E14", border: "1px solid #22C55E40", borderRadius: 12, padding: "10px 12px", marginBottom: 11, fontSize: 11.5, color: "#16a34a", fontWeight: 700 }}>✓ Reporte enviado ({reportSent[o.id]}).</div>}

        {/* Estado / botón real — aislado en CourierStageButton (ver arriba) */}
        {feePending
          ? <div style={{ width: "100%", padding: "13px", borderRadius: 13, background: AC + "12", border: `1px solid ${AC}30`, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: AC }}>Esperando que el comprador apruebe tu tarifa de {money(o.proposedFee || feeOf(o))}…</div>
          : <CourierStageButton orderId={o.id} status={o.status} onStage={onStage} mutedColor={t2} />}

        <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
          {!reportSent[o.id] && <button onClick={() => { setReportFor(reportFor === o.id ? null : o.id); setReportTarget(""); setReportOther(false); }} style={{ flex: 1, background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 11, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>⚠️ Reportar</button>}
          {["asignado", "recogido"].includes(o.status) && <button onClick={() => onCancel(o.id)} style={{ flex: 1, background: "transparent", border: "1px solid #ef444455", color: "#ef4444", borderRadius: 11, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Liberar entrega</button>}
        </div>
      </Card>
    );
  };

  const dispView = () => pool.length === 0
    ? <Card style={{ textAlign: "center", padding: "34px 16px" }}><div style={{ fontSize: 30, marginBottom: 8, opacity: .6 }}>📭</div><div style={{ fontSize: 13.5, color: t2 }}>No hay entregas disponibles ahora.</div><div style={{ fontSize: 12, color: t3, marginTop: 4 }}>Te avisaremos cuando haya pedidos en tu zona.</div></Card>
    : <>
        {online && <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#22C55E14", border: "1px solid #22C55E40", borderRadius: 13, padding: "11px 14px", marginBottom: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#16a34a" }}>{pool.length === 1 ? "¡Tienes 1 entrega disponible!" : `¡Tienes ${pool.length} entregas disponibles!`}</span>
        </div>}
        {!online && <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 13, padding: "11px 14px", marginBottom: 12, fontSize: 12, color: t3, fontWeight: 600 }}>Estás desconectado. Ponte <b style={{ color: t2 }}>En línea</b> arriba para recibir entregas.</div>}
        {pool.map(o => poolCard(o))}
      </>;

  const activeView = () => actives.length === 0
    ? <Card style={{ textAlign: "center", padding: "34px 16px" }}>
        <div style={{ fontSize: 30, marginBottom: 8, opacity: .6 }}>🛵</div>
        <div style={{ fontSize: 13.5, color: t2 }}>No tienes ninguna entrega activa.</div>
        <div style={{ fontSize: 12, color: t3, marginTop: 4 }}>Acepta una de "Disponibles" para empezar.</div>
      </Card>
    : <>{actives.map(o => activeCard(o))}</>;

  const histView = () => done.length === 0
    ? <Card style={{ textAlign: "center", padding: "30px 16px" }}><div style={{ fontSize: 13.5, color: t2 }}>Aún no has completado entregas.</div></Card>
    : done.map(o => (
        <Card key={o.id} style={{ marginBottom: 10, padding: 13, display: "flex", alignItems: "center", gap: 11 }}>
          {o.image ? <img src={o.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display = "none"} /> : <span style={{ fontSize: 20 }}>✅</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title || "Pedido"}</div>
            <div style={{ fontSize: 10, color: t3 }}>{fmtDate(o.createdAt)}</div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#22C55E" }}>+{money(feeOf(o))}</span>
        </Card>
      ));

  return <div ref={scrollRef} {...ptr.handlers} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 4000, overflowY: "auto", overscrollBehaviorY: "contain", WebkitOverflowScrolling: "touch", background: bg, paddingTop: "env(safe-area-inset-top, 0px)" }}>
    <PullIndicator pull={ptr.pull} refreshing={ptr.refreshing} />
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 44px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>‹ Volver a RETADOR</button>
        <button onClick={() => setOnline(v => !v)} style={{ display: "flex", alignItems: "center", gap: 7, background: online ? "#22C55E1a" : (dark ? "#1c1c20" : "#fff"), border: `1px solid ${online ? "#22C55E55" : bd}`, borderRadius: 100, padding: "6px 13px", cursor: "pointer" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: online ? "#22C55E" : t3 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: online ? "#22C55E" : t2 }}>{online ? "En línea" : "Desconectado"}</span>
        </button>
      </div>

      <div style={{ background: `linear-gradient(135deg,#4F46E5,#7C3AED)`, borderRadius: 18, padding: "18px 18px 20px", marginBottom: 16, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, opacity: .85 }}>Hola, {(record?.nombre || meName || "").split(" ")[0]} 👋</div>
          {/* Hoy por defecto, con la opción de ver el TOTAL acumulado — ambos
              vienen de courier_earnings, nunca sumados a mano de los pedidos
              cargados en el frontend. */}
          <div style={{ display: "flex", background: "rgba(255,255,255,.14)", borderRadius: 100, padding: 2 }}>
            {[["hoy", "Hoy"], ["total", "Total"]].map(([k, lb]) => (
              <button key={k} onClick={() => setEarnView(k)} style={{ border: "none", borderRadius: 100, padding: "4px 11px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", background: earnView === k ? "#fff" : "transparent", color: earnView === k ? "#4F46E5" : "#fff" }}>{lb}</button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: .75, marginTop: 8 }}>{earnView === "hoy" ? "Ganado hoy" : "Ganado en total"}</div>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 2 }}>{money(earnView === "hoy" ? (earnings?.hoyMonto || 0) : (earnings?.totalMonto || 0))}</div>
        <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12 }}>
          <div><b style={{ fontSize: 16 }}>{earnView === "hoy" ? (earnings?.hoyEntregas || 0) : (earnings?.totalEntregas || 0)}</b> <span style={{ opacity: .8 }}>{earnView === "hoy" ? "entregas hoy" : "entregas en total"}</span></div>
          <div><b style={{ fontSize: 16 }}>{earnings?.enCurso || 0}</b> <span style={{ opacity: .8 }}>en curso</span></div>
          <div><b style={{ fontSize: 16 }}>{pool.length}</b> <span style={{ opacity: .8 }}>disponibles</span></div>
        </div>

        {/* COMISIÓN (courier_debt) — integrada en el MISMO panel de ganancias, como
            una línea discreta, no como una tarjeta aparte que grite. Es un dato de
            servicio ("cuánto le corresponde a la plataforma de lo que ya ganaste"),
            no un cobro: por eso el tono neutro y el mismo lenguaje visual del panel.
            Se muestra siempre, también en cero, para que el mensajero sepa que la
            cuenta se lleva sola y no le va a caer una sorpresa. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.16)" }}>
          <span style={{ fontSize: 13, opacity: .9, flexShrink: 0 }}>🧾</span>
          <span style={{ fontSize: 11.5, lineHeight: 1.45, opacity: .9 }}>
            {debt && debt.debe > 0
              ? <>Comisión por uso de la plataforma: <b style={{ fontWeight: 800 }}>{money(debt.debe)}</b>{debt.pctComision > 0 ? <span style={{ opacity: .8 }}> · {debt.pctComision}% por entrega</span> : null}</>
              : <>Sin comisión pendiente{debt?.pctComision > 0 ? <span style={{ opacity: .8 }}> · {debt.pctComision}% por entrega</span> : null}</>}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", background: dark ? "#141417" : "#fff", border: `1px solid ${bd}`, borderRadius: 12, padding: 3, marginBottom: 16 }}>
        {[["disp", "Disponibles"], ["activa", "Mi entrega"], ["hist", "Historial"]].map(([k, lb]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, height: 38, borderRadius: 9, border: "none", background: tab === k ? AC : "transparent", color: tab === k ? "#fff" : t2, fontSize: 12.5, fontWeight: 700, cursor: "pointer", position: "relative" }}>
            {lb}{k === "activa" && actives.length > 0 && !activaSeen && tab !== "activa" && <span style={{ position: "absolute", top: 5, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />}
          </button>
        ))}
      </div>

      {tab === "disp" && dispView()}
      {tab === "activa" && activeView()}
      {tab === "hist" && histView()}
    </div>

    {/* Aceptar con opción de proponer tarifa mayor */}
    {adjustFor && (() => {
      const o = adjustFor, base = feeOf(o);
      const soft = dark ? "#1a1a1e" : "#f1f5f9";
      const val = Math.max(0, Number(adjustVal) || 0);
      const raised = val > base;
      // El backend valida el TOPE: máximo el DOBLE de la base (si base=0, libre).
      const maxFee = base > 0 ? base * 2 : Infinity;
      const overMax = val > maxFee;
      const stepBtn = { width: 46, height: 46, borderRadius: 13, border: `1px solid ${bd}`, background: soft, color: t1, fontSize: 22, fontWeight: 800, cursor: "pointer", flexShrink: 0 };
      return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 4300 }} onClick={() => setAdjustFor(null)}>
        <div onClick={e => e.stopPropagation()} style={{ background: card, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "20px 18px calc(26px + env(safe-area-inset-bottom, 0px))" }}>
          <div style={{ width: 38, height: 4, borderRadius: 4, background: bd, margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 900, color: t1, marginBottom: 4 }}>Tu tarifa de entrega</p>
          <p style={{ fontSize: 11.5, color: t3, marginBottom: 16, lineHeight: 1.5 }}>Estimada: <b style={{ color: t2 }}>{money(base)}</b>{base > 0 && <> · Máximo: <b style={{ color: t2 }}>{money(maxFee)}</b></>}. Puedes ajustarla según la distancia real. Si la subes, el comprador debe aprobarla.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setAdjustVal(String(Math.max(0, val - 25)))} style={stepBtn}>−</button>
            <div style={{ flex: 1, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 5, background: soft, border: `1px solid ${bd}`, borderRadius: 13, padding: "8px 12px" }}>
              <input type="number" inputMode="numeric" value={adjustVal} onChange={e => setAdjustVal(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 24, fontWeight: 900, color: t1 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: t2 }}>CUP</span>
            </div>
            <button onClick={() => setAdjustVal(String(val + 25))} style={stepBtn}>+</button>
          </div>
          {raised && !overMax && <div style={{ fontSize: 11, color: "#b45309", background: "#f59e0b18", border: "1px solid #f59e0b40", borderRadius: 11, padding: "10px 12px", marginBottom: 12, lineHeight: 1.45 }}>Subiste la tarifa (+{money(val - base)}). El comprador deberá <b>aprobar</b> el nuevo total antes de que puedas recoger.</div>}
          {overMax && <div style={{ fontSize: 11, color: "#fff", background: "#ef4444", borderRadius: 11, padding: "10px 12px", marginBottom: 12, lineHeight: 1.45 }}>El máximo permitido es <b>{money(maxFee)}</b> (el doble de la tarifa base). Baja tu propuesta para poder aceptar.</div>}
          <button disabled={val <= 0 || overMax} onClick={() => { onAccept(o.id, val); setAdjustFor(null); setTab("activa"); }} style={{ width: "100%", height: 50, borderRadius: 13, border: "none", background: (val <= 0 || overMax) ? soft : AC, color: (val <= 0 || overMax) ? t3 : "#fff", fontSize: 14.5, fontWeight: 800, cursor: (val <= 0 || overMax) ? "default" : "pointer" }}>{raised ? "Proponer tarifa y aceptar" : "Aceptar a la tarifa estimada"}</button>
          <button onClick={() => setAdjustFor(null)} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: t3, fontSize: 12.5, fontWeight: 600, padding: "8px", cursor: "pointer" }}>Cancelar</button>
        </div>
      </div>;
    })()}
  </div>;
}

export function CourierFlow({ myRecord, user, flash, onClose, dark, meName, meId, orders = [], localBase = 150, onAccept, onStage, onCancel, onReport, onViewProfile, onChat }) {
  const bg = dark ? "#0a0a0a" : "#f1f5f9", card = dark ? "#141417" : "#fff", t1 = dark ? "#f0f0f2" : "#0f172a", t2 = dark ? "#9aa0aa" : "#64748b", t3 = dark ? "#6b7280" : "#94a3b8", bd = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)", AC = "#6366F1";
  const [started, setStarted] = useState(false);
  const [app, setApp] = useState(undefined); // undefined = cargando
  // Nombre SIEMPRE vacío al abrir (nunca el nombre de usuario/display) — la
  // persona debe escribir a propósito su nombre legal, igual que en verificación.
  const [f, setF] = useState({ nombre: "", docType: "Carnet de identidad", docNumber: "", telefono: "", zona: "", vehiculo: "A pie", acepta: false });
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  // KYC completo: mismas 3 fotos que verificar perfil (documento delante/detrás
  // + selfie sosteniéndolo), con la misma hoja "Tomar foto / Elegir de galería".
  const DOC_TYPES = ["Carnet de identidad", "Pasaporte", "Licencia de conducir"];
  const [docFront, setDocFront] = useState(null);   // { file, url }
  const [docBack,  setDocBack]  = useState(null);
  const [selfie,   setSelfie]   = useState(null);
  const [pickerFor, setPickerFor] = useState(null); // 'front' | 'back' | 'selfie' | null
  const camRef = useRef(null), libRef = useRef(null);
  const photoFor = (slot) => (slot === "front" ? docFront : slot === "back" ? docBack : selfie);
  const setterFor = (slot) => (slot === "front" ? setDocFront : slot === "back" ? setDocBack : setSelfie);
  const onPicked = (e) => {
    const file = e.target.files?.[0]; const slot = pickerFor;
    e.target.value = "";
    setPickerFor(null);
    if (!file || !slot) return;
    setterFor(slot)({ file, url: URL.createObjectURL(file) });
  };
  const missingSlots = [!docFront && "delantera", !docBack && "trasera", !selfie && "selfie con tu cara"].filter(Boolean);
  const approved = myRecord?.status === "approved";
  // BIENVENIDA: la primera vez que un aprobado entra, breve explicación y
  // responsabilidades (se guarda visto por usuario en localStorage).
  const welcomeKey = "retador_courier_welcome_" + (user?.id || "x");
  const [welcomed, setWelcomed] = useState(() => { try { return localStorage.getItem(welcomeKey) === "1"; } catch (e) { return true; } });
  useEffect(() => {
    if (approved || !user?.id) { setApp(null); return; }
    let a = true;
    const t = setTimeout(() => { if (a) setApp(cur => cur === undefined ? null : cur); }, 6000);
    getMyCourierApplication(user.id).then(d => { if (a) setApp(d); }).catch(() => { if (a) setApp(null); });
    return () => { a = false; clearTimeout(t); };
  }, [user?.id, approved]);

  const wrap = (children) => <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 4000, overflowY: "auto", WebkitOverflowScrolling: "touch", background: bg, paddingTop: "env(safe-area-inset-top, 0px)" }}>{children}</div>;
  const backBtn = <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>‹ Volver a RETADOR</button>;

  if (approved && !welcomed) return wrap(
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 40px" }}>
      {backBtn}
      <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 20, overflow: "hidden" }}>
        <div style={{ height: 110, background: `linear-gradient(135deg,#16a34a,#22C55E)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46 }}>🎉</div>
        <div style={{ padding: "20px 18px 22px" }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: t1, marginBottom: 8 }}>¡Bienvenido al equipo de mensajeros!</h1>
          <p style={{ fontSize: 13, color: t2, lineHeight: 1.6, marginBottom: 14 }}>Así funciona: en <b>Disponibles</b> ves las entregas con toda la información; aceptas una y pasa a <b>Mi entrega</b>, donde marcas <b>Recogí</b> al recoger y <b>Entregué</b> al entregar de verdad.</p>
          {[["📦", "Recoge con cuidado", "Eres responsable del producto (y del efectivo) hasta entregarlo."], ["✅", "Confirma solo al entregar", "Marca 'Entregué' únicamente cuando el comprador tenga el producto."], ["🤝", "Trato respetuoso", "Representas a RETADOR: puntualidad y respeto con todos."]].map(([ic, tt, ds]) => (
            <div key={tt} style={{ display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 11 }}>
              <span style={{ fontSize: 19 }}>{ic}</span>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: t1 }}>{tt}</div><div style={{ fontSize: 11.5, color: t3 }}>{ds}</div></div>
            </div>
          ))}
          <button onClick={() => { try { localStorage.setItem(welcomeKey, "1"); } catch (e) {} setWelcomed(true); }} style={{ width: "100%", height: 48, borderRadius: 13, border: "none", background: "#22C55E", color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", marginTop: 6 }}>Entendido, empezar →</button>
        </div>
      </div>
    </div>
  );
  if (approved) return <CourierDashboard meName={meName} meId={meId} orders={orders} localBase={localBase} onAccept={onAccept} onStage={onStage} onCancel={onCancel} onReport={onReport} onViewProfile={onViewProfile} onChat={onChat} onClose={onClose} dark={dark} record={myRecord} />;

  // Cargando su solicitud
  if (app === undefined) return wrap(
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 16px", textAlign: "center", color: t2, fontSize: 13 }}>Cargando…</div>
  );
  // Ya tiene solicitud: mostrar su ESTADO. Solo bloquea si está 'pending'; si
  // está 'rejected' puede intentarlo de nuevo (mismo patrón que verificación).
  if (app && app.status === "pending") {
    return wrap(
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 40px" }}>
        {backBtn}
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: AC + "22", border: `1px solid ${AC}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 18px" }}>🛵</div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: t1, marginBottom: 8 }}>🕐 En revisión</h1>
          <p style={{ fontSize: 13.5, color: t2, lineHeight: 1.55, maxWidth: 340, margin: "0 auto" }}>Recibimos tu solicitud para ser mensajero de RETADOR. La estamos revisando — te avisaremos cuando esté aprobada.</p>
        </div>
      </div>
    );
  }
  if (app && app.status === "rejected" && !started) {
    return wrap(
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 40px" }}>
        {backBtn}
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "#ef4444" + "22", border: "1px solid #ef444455", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 18px" }}>😕</div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: t1, marginBottom: 8 }}>🚫 No aprobada — puedes intentarlo de nuevo</h1>
          <p style={{ fontSize: 13.5, color: t2, lineHeight: 1.55, maxWidth: 340, margin: "0 auto", marginBottom: 20 }}>Tu solicitud para ser mensajero no fue aprobada esta vez. Puedes revisar tus datos y enviarla de nuevo cuando quieras.</p>
          <button onClick={() => setStarted(true)} style={{ background: AC, border: "none", color: "#fff", borderRadius: 12, padding: "12px 22px", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>Intentarlo de nuevo →</button>
        </div>
      </div>
    );
  }

  // Intro
  if (!started) return wrap(
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 40px" }}>
      {backBtn}
      <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 20, overflow: "hidden" }}>
        <div style={{ height: 120, background: `linear-gradient(135deg,#4F46E5,#7C3AED)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>🛵</div>
        <div style={{ padding: "20px 18px 22px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t1, marginBottom: 8, letterSpacing: "-.02em" }}>¿Quieres ser mensajero?</h1>
          <p style={{ fontSize: 13.5, color: t2, lineHeight: 1.6, marginBottom: 16 }}>Gana dinero repartiendo pedidos en tu zona. Tú pones el ritmo. Envía tu solicitud y el equipo de RETADOR la revisa; al aprobarla, tu cuenta entra al modo mensajero.</p>
          {[["💸", "Gana por cada entrega", "Cobras tu tarifa de mensajería en cada pedido."], ["📍", "Trabaja en tu zona", "Recibes los pedidos cerca de ti."], ["🛡️", "Cuenta aprobada", "El equipo revisa cada solicitud para que todos confíen."]].map(([ic, tt, ds]) => (
            <div key={tt} style={{ display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 19 }}>{ic}</span>
              <div><div style={{ fontSize: 13.5, fontWeight: 700, color: t1 }}>{tt}</div><div style={{ fontSize: 12, color: t3 }}>{ds}</div></div>
            </div>
          ))}
          <button onClick={() => setStarted(true)} style={{ width: "100%", height: 48, borderRadius: 13, border: "none", background: AC, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", marginTop: 8 }}>Quiero ser mensajero →</button>
        </div>
      </div>
    </div>
  );

  // Formulario LIMPIO — se guarda de verdad en courier_applications.
  const lbl = { fontSize: 11.5, fontWeight: 700, color: t2, marginBottom: 6, display: "block" };
  const inp = { width: "100%", background: dark ? "#1c1c20" : "#f5f5f7", color: t1, border: `1px solid ${bd}`, borderRadius: 11, padding: "11px 13px", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box" };
  const submit = async () => {
    if (!f.nombre.trim() || !f.docNumber.trim() || !f.telefono.trim() || !f.zona.trim()) return setErr("Completa tu nombre, documento, teléfono y zona.");
    if (!docFront || !docBack || !selfie) return setErr("Faltan fotos: " + missingSlots.join(", ") + ".");
    if (!f.acepta) return setErr("Debes aceptar la cláusula de responsabilidad.");
    setErr(""); setSending(true);
    // Rutas: ${user.id}/courier_front.jpg, ${user.id}/courier_back.jpg,
    // ${user.id}/courier_selfie.jpg (bucket privado 'kyc', vía uploadKyc).
    let pf, pb, ps;
    try {
      [pf, pb, ps] = await Promise.all([
        uploadKyc(docFront.file, user.id, "courier_front"),
        uploadKyc(docBack.file, user.id, "courier_back"),
        uploadKyc(selfie.file, user.id, "courier_selfie"),
      ]);
    } catch (e) {
      setErr("No se pudo subir una foto: " + (e?.message || "intenta de nuevo"));
      setSending(false);
      return;
    }
    try {
      // La RPC resuelve la fila única y la reactivación de solicitudes
      // rechazadas por dentro — ya no hace falta manejar "duplicate/unique" aquí.
      await submitCourierApplication({
        name: f.nombre.trim(), phone: f.telefono.trim(), zone: f.zona.trim(), vehicle: f.vehiculo,
        full_name: f.nombre.trim(), doc_type: f.docType, doc_number: f.docNumber.trim(), doc_front: pf, doc_back: pb, selfie: ps,
      });
      setApp({ status: "pending" });
      flash && flash("🛵 Solicitud enviada — en revisión");
    } catch (e) {
      setErr("No se pudo enviar la solicitud: " + (e?.message || "intenta de nuevo"));
    } finally { setSending(false); }
  };
  const upBox = (label, slot, hint) => {
    const photo = photoFor(slot);
    return (
      <button onClick={() => setPickerFor(slot)} style={{ flex: 1, height: photo ? 128 : 112, borderRadius: 10, border: `1.5px dashed ${photo ? "#22C55E" : bd}`, background: dark ? "#1c1c20" : "#f5f5f7", cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, color: t2, fontSize: 10.5, fontWeight: 700, textAlign: "center", padding: "6px 6px" }}>
        {photo
          ? <img src={photo.url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          : <><span style={{ fontSize: 22 }}>{hint}</span><span style={{ lineHeight: 1.3 }}>{label}</span></>}
      </button>
    );
  };

  return wrap(
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 44px" }}>
      <button onClick={() => setStarted(false)} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>‹ Atrás</button>
      <h1 style={{ fontSize: 21, fontWeight: 800, color: t1, marginBottom: 4 }}>Quiero ser mensajero</h1>
      <p style={{ fontSize: 12.5, color: t3, marginBottom: 18 }}>El equipo de RETADOR revisa cada solicitud. Te avisamos al aprobarla.</p>

      <label style={lbl}>Nombre completo *</label>
      <input style={inp} value={f.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre completo, como en tu documento" />
      <div style={{ fontSize: 10.5, color: "#f59e0b", fontWeight: 700, margin: "-8px 0 14px", lineHeight: 1.4 }}>⚠️ Nombre COMPLETO, exactamente como aparece en tu documento de identidad. Puede ser diferente a tu nombre de usuario.</div>

      <label style={lbl}>Tipo de documento *</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {DOC_TYPES.map(t => <button key={t} onClick={() => set("docType", t)} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11.5, fontWeight: 600, background: f.docType === t ? AC + "1a" : (dark ? "#1c1c20" : "#f5f5f7"), border: `1.5px solid ${f.docType === t ? AC : bd}`, color: f.docType === t ? AC : t1 }}>{t}</button>)}
      </div>
      <label style={lbl}>Número de documento *</label>
      <input style={inp} value={f.docNumber} onChange={e => set("docNumber", e.target.value)} placeholder="Ej. 95010112345" />

      <label style={lbl}>Teléfono *</label>
      <input style={inp} value={f.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+53 …" />
      <label style={lbl}>Zona donde repartes *</label>
      <input style={inp} value={f.zona} onChange={e => set("zona", e.target.value)} placeholder="Ej: Vedado, Centro Habana…" />
      <label style={lbl}>Vehículo *</label>
      <select style={inp} value={f.vehiculo} onChange={e => set("vehiculo", e.target.value)}>
        <option>A pie</option><option>Bicicleta</option><option>Moto</option><option>Carro</option>
      </select>

      <label style={lbl}>Fotos <span style={{ color: "#ef4444", fontWeight: 800 }}>· las 3 son obligatorias</span></label>
      <input ref={camRef} type="file" accept="image/*" capture={pickerFor === "selfie" ? "user" : "environment"} onChange={onPicked} style={{ display: "none" }}/>
      <input ref={libRef} type="file" accept="image/*" onChange={onPicked} style={{ display: "none" }}/>
      <div style={{ display: "flex", gap: 9, marginBottom: 9 }}>
        {upBox("Documento por DELANTE", "front", "📄")}
        {upBox("Documento por DETRÁS", "back", "📄")}
      </div>
      <div style={{ display: "flex", gap: 9, alignItems: "stretch", marginBottom: 8 }}>
        {upBox("Tú sosteniendo el documento junto a tu cara", "selfie", "🤳")}
        {!selfie && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: AC + "0a", border: `1px dashed ${AC}44`, borderRadius: 10, padding: "8px 6px" }}>
            <KycSelfieSample accent={AC} surface={card}/>
            <span style={{ fontSize: 9, color: t2, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>Así, con el documento a un lado de tu cara</span>
          </div>
        )}
      </div>
      {missingSlots.length > 0 && <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 14 }}>Falta: {missingSlots.join(", ")}</div>}
      {missingSlots.length === 0 && <div style={{ marginBottom: 14 }}/>}
      <div style={{ fontSize: 11.5, color: t3, marginBottom: 14, lineHeight: 1.5 }}>Tus documentos son privados: solo el equipo de RETADOR los ve para confirmar tu identidad.</div>

      <label style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "13px", border: `1px solid ${f.acepta ? AC : bd}`, borderRadius: 12, cursor: "pointer", background: f.acepta ? AC + "0f" : "transparent" }}>
        <input type="checkbox" checked={f.acepta} onChange={e => set("acepta", e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, accentColor: AC, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: t1, lineHeight: 1.55 }}>Declaro que la información es verídica y acepto ser <b>totalmente responsable</b> de los bienes del comprador y del vendedor durante cada entrega, incluyendo el dinero cobrado en efectivo, hasta entregarlo a quien corresponde.</span>
      </label>

      {err && <div style={{ fontSize: 12.5, color: "#fff", background: "#ef4444", borderRadius: 10, padding: "10px 13px", marginTop: 14, fontWeight: 600 }}>{err}</div>}
      <button onClick={submit} disabled={sending} style={{ width: "100%", height: 50, borderRadius: 14, border: "none", background: sending ? (dark ? "#26262b" : "#e2e8f0") : AC, color: sending ? t3 : "#fff", fontSize: 15, fontWeight: 800, cursor: sending ? "default" : "pointer", marginTop: 18 }}>{sending ? "Enviando…" : "Enviar solicitud"}</button>
      <p style={{ fontSize: 10.5, color: t3, textAlign: "center", marginTop: 10 }}>Tu solicitud quedará en revisión hasta que el equipo de RETADOR la apruebe.</p>

      {pickerFor && (
        <div onClick={() => setPickerFor(null)} style={{ position: "fixed", inset: 0, zIndex: 4100, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, width: "100%", maxWidth: 480, borderRadius: "16px 16px 0 0", padding: "10px 16px 24px", border: `1px solid ${bd}` }}>
            <div style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: t2, padding: "8px 0 14px" }}>Añadir foto</div>
            <button onClick={() => camRef.current?.click()} style={{ width: "100%", height: 48, borderRadius: 10, background: AC, border: "none", color: "#fff", fontSize: 13.5, fontWeight: 800, cursor: "pointer", marginBottom: 9 }}>📷 Tomar foto</button>
            <button onClick={() => libRef.current?.click()} style={{ width: "100%", height: 48, borderRadius: 10, background: dark ? "#1c1c20" : "#f5f5f7", border: `1px solid ${bd}`, color: t1, fontSize: 13.5, fontWeight: 800, cursor: "pointer", marginBottom: 9 }}>🖼️ Elegir de galería</button>
            <button onClick={() => setPickerFor(null)} style={{ width: "100%", height: 44, borderRadius: 10, background: "none", border: "none", color: t2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
