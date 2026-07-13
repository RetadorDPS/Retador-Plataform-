import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { getAvailableDeliveries, getUserById, getProductById, getMyCourierApplication, submitCourierApplication, supabase } from "../shared/index.js";

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

function CourierDashboard({ meName, meId, orders, localBase, onAccept, onStage, onCancel, onReport, onClose, dark, record, demo, onViewProfile, onChat }) {
  const bg = dark ? "#0a0a0a" : "#f1f5f9", card = dark ? "#141417" : "#fff", t1 = dark ? "#f0f0f2" : "#0f172a", t2 = dark ? "#9aa0aa" : "#64748b", t3 = dark ? "#6b7280" : "#94a3b8", bd = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)", AC = "#6366F1";
  const [tab, setTab] = useState("disp");
  const [online, setOnline] = useState(true);
  const [detail, setDetail] = useState(null);
  // Producto del pedido abierto en detalle: de ahí salen la dirección y el teléfono
  // de RECOGIDA que escribió el vendedor. Se busca por product_id cuando hace falta.
  const [detailProduct, setDetailProduct] = useState(null);
  useEffect(() => {
    setDetailProduct(null);
    const pid = detail && (detail.product_id || detail.productId);
    if (!pid || String(detail.id).startsWith("demo")) return;
    let a = true; getProductById(pid).then(p => { if (a) setDetailProduct(p); }).catch(() => {});
    return () => { a = false; };
  }, [detail]);
  const [reportFor, setReportFor] = useState(null);
  const [reportSent, setReportSent] = useState({});
  const [adjustFor, setAdjustFor] = useState(null);
  const [adjustVal, setAdjustVal] = useState("");
  const [actionMode, setActionMode] = useState(null);
  const [reportTarget, setReportTarget] = useState("");
  const [reportOther, setReportOther] = useState(false);
  const [reportText, setReportText] = useState("");
  const [demoOrders, setDemoOrders] = useState([
    { id: "demo1", shipMode: "local", title: "Auriculares TWS Baseus", amount: 600, deliveryCost: 400, payMethod: "efectivo", sellerName: "Tienda TechHabana", delivery: { pickup: "Tienda TechHabana", pickupAddress: "Calle Línea #58 e/ M y N, Vedado", pickupPhone: "+53 5 111 2233", address: "Calle 23 #456 e/ G y H, Vedado", name: "Laura Pérez", phone: "+53 5 234 5678", ref: "Edificio azul de la esquina, apto 4B. Tocar al portero." }, status: "confirmado" },
    { id: "demo2", shipMode: "local", title: "Perfume 100ml", amount: 1200, deliveryCost: 350, payMethod: "transferencia", sellerName: "Boutique Lux", delivery: { pickup: "Boutique Lux", pickupAddress: "San Rafael #112 e/ Industria y Consulado, Centro Habana", pickupPhone: "+53 5 444 5566", address: "Ave. Salvador Allende #210, Centro Habana", name: "Carlos M.", phone: "+53 5 876 1234", ref: "Casa con reja blanca, entre Belascoaín y Lucena." }, status: "confirmado" },
  ]);
  const demoAccept = (id, fee) => setDemoOrders(prev => prev.map(o => { if (o.id !== id) return o; const base = o.deliveryCost || o.shipPrice || localBase; const nf = (fee != null && fee > 0) ? Math.round(fee) : base; if (nf > base) return { ...o, courierName: meName, courierStage: "propuesta", proposedFee: nf, baseFee: base, feeApproval: "pending" }; return { ...o, courierName: meName, courierStage: "aceptado", deliveryCost: nf }; }));
  const demoStage = (id, st) => { const cs = st === "entregado" ? "completado" : st; setDemoOrders(prev => prev.map(o => o.id === id ? { ...o, courierStage: cs, status: cs === "completado" ? "entregado" : o.status } : o)); };
  // POOL de entregas disponibles: viene del backend (get_available_deliveries),
  // que solo expone categoría, tarifa e ids de comprador/vendedor. En demo usamos
  // los pedidos de ejemplo. Se recarga al abrir y tras aceptar/liberar.
  const [pool, setPool] = useState([]);
  const reloadPool = useCallback(async () => {
    if (demo) return;
    const rows = await getAvailableDeliveries();
    setPool((rows || []).map(r => ({
      ...r,
      shipPrice: r.ship_price ?? r.shipPrice ?? 0,
      deliveryCost: r.ship_price ?? r.shipPrice ?? 0,
      buyerId: r.buyer_id ?? r.buyerId ?? null,
      sellerId: r.seller_id ?? r.sellerId ?? null,
      cat: r.cat ?? r.category ?? r.categoria ?? null,
      shipMode: "local", status: "confirmado", __pool: true,
    })));
  }, [demo]);
  useEffect(() => { reloadPool(); }, [reloadPool]);
  // EN VIVO: cualquier cambio en pedidos refresca el pool solo (una entrega nueva
  // aparece al instante; una tomada por otro mensajero desaparece). El canal se
  // limpia al cerrar el modo mensajero.
  useEffect(() => {
    if (demo) return;
    const ch = supabase.channel("rt-courier-pool")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => reloadPool())
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch (e) {} };
  }, [demo, reloadPool]);

  // En demo mezclamos los pedidos REALES locales con los de ejemplo, para que el dueño vea su propio pedido aquí.
  const srcOrders = demo ? [...orders.filter(o => (o.shipMode || o.shipType) === "local"), ...demoOrders] : orders;
  const isMineOrder = o => o.courierName === meName || (meId && (o.courierId === meId || o.courier_id === meId));
  const acceptFn = (id, fee) => { if (String(id).startsWith("demo")) demoAccept(id, fee); else { onAccept && onAccept(id, fee); setTimeout(reloadPool, 800); } };
  const cancelFn = id => { if (String(id).startsWith("demo")) setDemoOrders(prev => prev.map(o => o.id === id ? { ...o, courierName: null, courierStage: null, proposedFee: null, feeApproval: null } : o)); else { onCancel && onCancel(id); setTimeout(reloadPool, 800); } setDetail(null); setTab("disp"); };
  const stageFn = (id, st) => { if (String(id).startsWith("demo")) demoStage(id, st); else onStage && onStage(id, st); };
  const money = n => Math.round(n || 0).toLocaleString() + " CUP";
  const mine = srcOrders.filter(isMineOrder);
  const active = mine.find(o => o.courierStage && o.courierStage !== "completado" && o.courierStage !== "fallido");
  const done = mine.filter(o => o.courierStage === "completado" || o.status === "entregado" || o.status === "completado");
  // Entregas disponibles: en demo, los de ejemplo sin mensajero; en real, el pool del backend.
  const available = demo
    ? demoOrders.filter(o => o.shipMode === "local" && !o.courierName && o.status === "confirmado")
    : pool;
  const baseFeeOf = o => o.deliveryCost || o.shipCost || o.shipPrice || localBase;
  const surgeCfg = (() => { try { const r = localStorage.getItem("retador_admincfg"); if (r) { const c = JSON.parse(r); return { on: c.surgeActive === true, every: Number(c.surgeIntervalMin) || 30, step: Number(c.surgeStepPct) || 15, cap: Number(c.surgeCapPct) || 60 }; } } catch (e) {} return { on: false, every: 30, step: 15, cap: 60 }; })();
  const surgePct = o => { if (!surgeCfg.on || o.courierName) return 0; const mins = (Date.now() - (o.createdAt || o.created_at || Date.now())) / 60000; const steps = Math.floor(mins / surgeCfg.every); return Math.min(surgeCfg.cap, steps * surgeCfg.step); };
  const feeOf = o => { const b = baseFeeOf(o); const p = surgePct(o); return Math.round(b * (1 + p / 100)); };
  const isCash = o => (o.payMethod || o.payment || "efectivo").toString().toLowerCase().includes("efect") || (o.payMethod || "").toLowerCase() === "cash" || !o.payMethod;
  const earnedTotal = done.reduce((s, o) => s + feeOf(o), 0);
  const pickupOf = o => o.delivery?.pickup || o.sellerName || "Vendedor";
  const pickupAddrOf = o => o.delivery?.pickupAddress || "";
  const pickupPhoneOf = o => o.delivery?.pickupPhone || "";
  const etaOf = o => { const n = Math.abs(String(o.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0)); const km = (1 + (n % 80) / 10).toFixed(1); const min = 6 + (n % 22); return { km, min }; };
  const dropOf = o => o.delivery?.address || o.address || "Dirección del comprador";
  const dropNameOf = o => o.delivery?.name || o.buyerName || "Comprador";
  const buyerOf = o => o.delivery?.name || o.buyerName || "Comprador";
  const phoneOf = o => o.delivery?.phone || o.buyerPhone || "";
  const refOf = o => o.delivery?.ref || o.delivery?.note || o.reference || "";
  // El mensajero SIEMPRE cobra su tarifa en EFECTIVO. El producto puede ir por transferencia (en ese caso el mensajero solo cobra su tarifa).
  const prodCashOf = o => isCash(o) ? (o.amount || 0) : 0;
  const collectOf = o => feeOf(o) + prodCashOf(o);
  const stageOf = o => {
    if (!o.courierName) return "available";
    if (o.courierStage === "completado") return "done";
    return "active";
  };

  const Card = ({ children, style }) => <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 16, padding: 15, ...style }}>{children}</div>;
  const addrRow = (icon, label, val, sub) => (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "9px 0" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: AC + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 10, color: t3, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
        <div style={{ fontSize: 13, color: t1, fontWeight: 600 }}>{val}</div>
        {sub && <div style={{ fontSize: 11, color: t2 }}>{sub}</div>}
      </div>
    </div>
  );

  // Solo 2 toques esenciales para el mensajero
  const STAGES = [
    { key: "aceptado", label: "Aceptada", action: "Recogí el producto", next: "recogido" },
    { key: "recogido", label: "En camino", action: "Entregué y cobré", next: "completado" },
  ];
  const payCard = o => {
    const fee = feeOf(o), cash = isCash(o), prod = o.amount || 0;
    const sym = { EUR: "€", USD: "$" };
    const c = o.currency || "USD";
    const pmoney = n => (sym[c] || "") + Math.round(n || 0).toLocaleString() + (sym[c] ? "" : " " + c);
    return <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 9 }}>Dinero</div>
      {cash
        ? <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: t2, padding: "4px 0" }}><span>Valor del producto · cobras al comprador</span><span style={{ color: t1, fontWeight: 700 }}>{pmoney(prod)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: t2, padding: "4px 0" }}><span>Se lo entregas al vendedor</span><span style={{ color: t1, fontWeight: 700 }}>{pmoney(prod)}</span></div>
          </>
        : <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: t2, padding: "4px 0" }}><span>El producto lo paga el comprador por transferencia al vendedor</span><span style={{ color: t3, fontWeight: 700 }}>—</span></div>}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0 0", marginTop: 4, borderTop: `1px solid ${bd}` }}><span style={{ color: "#22C55E", fontWeight: 800 }}>Tu tarifa de entrega (efectivo)</span><span style={{ color: "#22C55E", fontWeight: 800 }}>{money(fee)}</span></div>
      <div style={{ fontSize: 10.5, color: t3, marginTop: 8, lineHeight: 1.45 }}>{cash
        ? <>Cobras al comprador <b>{pmoney(prod)}</b> del producto (se lo entregas al vendedor) <b>más tu tarifa de {money(fee)} en efectivo</b>, que es tuya.</>
        : <>El producto lo paga el comprador por transferencia al vendedor. Tú solo cobras <b>tu tarifa de {money(fee)} en efectivo</b>. La entrega se cierra cuando el vendedor confirme la transferencia.</>}</div>
    </div>;
  };
  const actionBtn = o => {
    const cash = isCash(o);
    if (o.courierStage === "completado") return <div style={{ textAlign: "center", color: "#22C55E", fontWeight: 700, fontSize: 14, padding: "12px" }}>✅ Entrega completada</div>;
    if (stageOf(o) === "available") return <button onClick={() => { const ord = o; setDetail(null); setAdjustVal(String(feeOf(ord))); setAdjustFor(ord); }} disabled={!online} style={{ width: "100%", height: 50, borderRadius: 13, border: "none", background: !online ? (dark ? "#26262b" : "#e2e8f0") : AC, color: !online ? t3 : "#fff", fontSize: 14.5, fontWeight: 800, cursor: !online ? "default" : "pointer" }}>{!online ? "Conéctate para aceptar" : "Aceptar entrega"}</button>;
    if (o.courierStage === "propuesta") return <div style={{ width: "100%", padding: "13px", borderRadius: 13, background: AC + "12", border: `1px solid ${AC}30`, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: AC }}>Esperando que el comprador apruebe tu tarifa de {money(o.proposedFee || feeOf(o))}…</div>;
    if (o.courierStage === "esperando_pago") return <div>
      <div style={{ background: "#F59E0B14", border: "1px solid #F59E0B55", borderRadius: 12, padding: "12px 13px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", marginBottom: 3 }}>⏳ Entregado · esperando pago</div>
        <div style={{ fontSize: 11.5, color: t2, lineHeight: 1.5 }}>La entrega se cierra cuando el <b>vendedor confirme</b> que recibió la transferencia. Si no hay pago, no te retires con el producto entregado: el vendedor marcará la entrega como fallida y devuelves el producto.</div>
      </div>
      {demo && <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => stageFn(o.id, "fallido")} style={{ flex: 1, height: 44, borderRadius: 12, border: `1px solid ${bd}`, background: "transparent", color: t2, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>(Demo) Sin pago</button>
        <button onClick={() => stageFn(o.id, "completado")} style={{ flex: 1.4, height: 44, borderRadius: 12, border: "none", background: "#22C55E", color: "#fff", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>(Demo) Vendedor confirmó</button>
      </div>}
    </div>;
    if (o.courierStage === "fallido") return <div style={{ textAlign: "center", color: "#ef4444", fontWeight: 700, fontSize: 13.5, padding: "12px", background: "#ef444414", borderRadius: 12 }}>❌ Sin pago · producto devuelto al vendedor</div>;
    if (o.courierStage === "recogido" || o.status === "en_ruta") {
      // "Entregué" cierra el pedido (el backend marca entregado y termina).
      return <button onClick={() => { stageFn(o.id, "entregado"); setDetail(null); }} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: AC, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Entregué</button>;
    }
    return <button onClick={() => stageFn(o.id, "recogido")} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: AC, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Recogí</button>;
  };
  const miniCard = o => {
    const cash = isCash(o);
    return <div key={o.id} onClick={() => setDetail(o)} style={{ background: card, border: `1px solid ${bd}`, borderRadius: 16, padding: 14, marginBottom: 11, cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: t1, flex: 1, minWidth: 0 }}>{o.title || "Pedido"}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#22C55E", whiteSpace: "nowrap", marginLeft: 8 }}>+{money(feeOf(o))}</span>
      </div>
      <div style={{ borderTop: `1px solid ${bd}`, marginTop: 4 }}>
        {addrRow("🏪", "Recoger", pickupOf(o))}
        {addrRow("📍", "Entregar", dropOf(o))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: cash ? "#F59E0B" : AC, background: (cash ? "#F59E0B" : AC) + "1a", borderRadius: 100, padding: "3px 9px" }}>{cash ? "💵 Producto en efectivo" : "💳 Producto por transferencia"}</span>
        <span style={{ fontSize: 11, color: AC, fontWeight: 700 }}>Ver detalle ›</span>
      </div>
    </div>;
  };
  // Tarjeta del POOL (ANTES de aceptar): solo categoría + tarifa + perfiles públicos
  // tocables del comprador y del vendedor. Sin monto, sin ganancia, sin dirección.
  const poolCard = o => (
    <div key={o.id} style={{ background: card, border: `1px solid ${bd}`, borderRadius: 16, padding: 14, marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: AC, background: AC + "16", borderRadius: 100, padding: "4px 11px" }}>{o.cat || o.category || o.title || "Pedido"}</span>
        <span style={{ fontSize: 16, fontWeight: 900, color: "#22C55E", whiteSpace: "nowrap" }}>+{money(feeOf(o))}</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <ProfileChip id={o.buyerId} fallback="Comprador" role="Comprador" onOpen={onViewProfile} dark={dark} />
        <ProfileChip id={o.sellerId} fallback="Vendedor" role="Vendedor" onOpen={onViewProfile} dark={dark} />
      </div>
      <button onClick={() => { setAdjustVal(String(feeOf(o))); setAdjustFor(o); }} disabled={!online} style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: !online ? (dark ? "#26262b" : "#e2e8f0") : AC, color: !online ? t3 : "#fff", fontSize: 14, fontWeight: 800, cursor: !online ? "default" : "pointer" }}>{!online ? "Conéctate para aceptar" : "Aceptar entrega"}</button>
      <div style={{ fontSize: 10, color: t3, textAlign: "center", marginTop: 8, lineHeight: 1.4 }}>Al aceptar verás las direcciones exactas de recogida y entrega y los contactos.</div>
    </div>
  );

  const activeView = () => {
    const actives = mine.filter(o => o.courierStage && o.courierStage !== "completado" && o.courierStage !== "fallido");
    if (!actives.length) return <Card style={{ textAlign: "center", padding: "34px 16px" }}>
      <div style={{ fontSize: 30, marginBottom: 8, opacity: .6 }}>🛵</div>
      <div style={{ fontSize: 13.5, color: t2 }}>No tienes ninguna entrega activa.</div>
      <div style={{ fontSize: 12, color: t3, marginTop: 4 }}>Acepta una de "Disponibles" para empezar. Puedes llevar varias a la vez.</div>
    </Card>;
    return <>
      <div style={{ fontSize: 11.5, color: t3, fontWeight: 600, margin: "0 4px 10px" }}>{actives.length === 1 ? "Tu entrega activa · tócala para gestionarla" : `${actives.length} entregas activas · tócalas para gestionarlas`}</div>
      {actives.map(o => miniCard(o))}
    </>;
  };

  const dispView = () => available.length === 0
    ? <Card style={{ textAlign: "center", padding: "34px 16px" }}><div style={{ fontSize: 30, marginBottom: 8, opacity: .6 }}>📭</div><div style={{ fontSize: 13.5, color: t2 }}>No hay entregas disponibles ahora.</div><div style={{ fontSize: 12, color: t3, marginTop: 4 }}>Te avisaremos cuando haya pedidos en tu zona.</div></Card>
    : <>
        {online && <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#22C55E14", border: "1px solid #22C55E40", borderRadius: 13, padding: "11px 14px", marginBottom: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#16a34a" }}>{available.length === 1 ? "¡Tienes 1 entrega disponible!" : `¡Tienes ${available.length} entregas disponibles!`}</span>
        </div>}
        {!online && <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 13, padding: "11px 14px", marginBottom: 12, fontSize: 12, color: t3, fontWeight: 600 }}>Estás desconectado. Ponte <b style={{ color: t2 }}>En línea</b> arriba para recibir entregas.</div>}
        {available.map(o => poolCard(o))}
      </>;

  const histView = () => done.length === 0
    ? <Card style={{ textAlign: "center", padding: "30px 16px" }}><div style={{ fontSize: 13.5, color: t2 }}>Aún no has completado entregas.</div></Card>
    : done.map(o => miniCard(o));

  const detailModal = () => {
    if (!detail) return null;
    const base = srcOrders.find(x => x.id === detail.id) || detail;
    // Al aceptar, el mensajero SÍ ve los datos exactos para cumplir: recogida (del
    // producto), entrega (del pedido) y contactos. Los números del negocio no.
    const o = { ...base,
      delivery: { ...(base.delivery || {}),
        pickupAddress: base.delivery?.pickupAddress || detailProduct?.pickupAddress || "",
        pickupPhone: base.delivery?.pickupPhone || detailProduct?.pickupPhone || "",
        address: base.delivery?.address || base.ship_to || base.shipTo || "",
        name: base.delivery?.name || base.buyerName || "",
      },
      sellerName: base.sellerName || detailProduct?.seller_name || "",
    };
    const cash = isCash(o);
    const buyerId = o.buyerId || o.buyer_id || null, sellerId = o.sellerId || o.seller_id || null;
    return <div onClick={() => setDetail(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 4200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: bg, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "8px 16px 28px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: bd, margin: "8px auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: t1 }}>{o.title || "Pedido"}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#22C55E", whiteSpace: "nowrap" }}>+{money(feeOf(o))}</span>
        </div>
        {(buyerId || sellerId) && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {sellerId && <ProfileChip id={sellerId} fallback={o.sellerName || "Vendedor"} role="Vendedor" onOpen={onViewProfile} dark={dark} />}
          {buyerId && <ProfileChip id={buyerId} fallback={o.delivery?.name || "Comprador"} role="Comprador" onOpen={onViewProfile} dark={dark} />}
        </div>}
        <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 14, padding: "2px 14px", marginBottom: 12 }}>
          {addrRow("🏪", "Recoger en", pickupAddrOf(o) || pickupOf(o), pickupAddrOf(o) ? (pickupOf(o) + (pickupPhoneOf(o) ? " · " + pickupPhoneOf(o) : "")) : "Dirección exacta: coordínala con el vendedor")}
          <div style={{ height: 1, background: bd }} />
          {addrRow("📍", "Entregar a", dropOf(o), buyerOf(o))}
          {phoneOf(o) && <><div style={{ height: 1, background: bd }} />{addrRow("📞", "Contacto", phoneOf(o))}</>}
          {refOf(o) && <><div style={{ height: 1, background: bd }} />{addrRow("📝", "Referencia / indicaciones", refOf(o))}</>}
        </div>
        {(() => { const e = etaOf(o); return <div style={{ display: "flex", alignItems: "center", gap: 8, background: AC + "12", border: `1px solid ${AC}30`, borderRadius: 12, padding: "9px 13px", marginBottom: 12 }}><span style={{ fontSize: 15 }}>🛵</span><span style={{ fontSize: 12.5, color: t1, fontWeight: 700 }}>~{e.km} km · ~{e.min} min</span><span style={{ fontSize: 10.5, color: t3 }}>estimado hasta la entrega</span></div>; })()}
        <div style={{ display: "flex", gap: 8, marginBottom: actionMode ? 8 : 12 }}>
          <button onClick={() => setActionMode(actionMode === "call" ? null : "call")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: actionMode === "call" ? "#22C55E22" : "#22C55E18", border: "1px solid #22C55E45", color: "#16a34a", borderRadius: 12, padding: "11px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>📞 Llamar</button>
          <button onClick={() => setActionMode(actionMode === "map" ? null : "map")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: actionMode === "map" ? AC + "1e" : card, border: `1px solid ${actionMode === "map" ? AC + "55" : bd}`, color: t1, borderRadius: 12, padding: "11px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>🗺️ Mapa</button>
          {!demo && buyerId && onChat && <button onClick={() => onChat(buyerId, o.delivery?.name || o.buyerName || "Comprador")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: card, border: `1px solid ${bd}`, color: t1, borderRadius: 12, padding: "11px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>💬 Mensaje</button>}
          <button onClick={() => { setActionMode(actionMode === "report" ? null : "report"); setReportTarget(""); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: actionMode === "report" ? "#ef444418" : card, border: `1px solid ${actionMode === "report" ? "#ef444455" : bd}`, color: actionMode === "report" ? "#ef4444" : t1, borderRadius: 12, padding: "11px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>⚠️ Reportar</button>
        </div>
        {actionMode === "call" && <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <a href={`tel:${(phoneOf(o) || "").replace(/\s/g, "")}`} onClick={e => { if (!phoneOf(o)) e.preventDefault(); }} style={{ flex: 1, textAlign: "center", textDecoration: "none", background: phoneOf(o) ? "#22C55E18" : (dark ? "#1a1a1e" : "#f1f5f9"), border: `1px solid ${phoneOf(o) ? "#22C55E45" : bd}`, color: phoneOf(o) ? "#16a34a" : t3, borderRadius: 11, padding: "10px 8px", fontSize: 12, fontWeight: 700 }}>📞 Comprador<br /><span style={{ fontSize: 11, fontWeight: 600 }}>{phoneOf(o) || "sin teléfono"}</span></a>
          <a href={`tel:${(pickupPhoneOf(o) || "").replace(/\s/g, "")}`} onClick={e => { if (!pickupPhoneOf(o)) e.preventDefault(); }} style={{ flex: 1, textAlign: "center", textDecoration: "none", background: pickupPhoneOf(o) ? "#22C55E18" : (dark ? "#1a1a1e" : "#f1f5f9"), border: `1px solid ${pickupPhoneOf(o) ? "#22C55E45" : bd}`, color: pickupPhoneOf(o) ? "#16a34a" : t3, borderRadius: 11, padding: "10px 8px", fontSize: 12, fontWeight: 700 }}>📞 Vendedor<br /><span style={{ fontSize: 11, fontWeight: 600 }}>{pickupPhoneOf(o) || "sin teléfono"}</span></a>
        </div>}
        {actionMode === "map" && <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddrOf(o) || pickupOf(o) || "")}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", textDecoration: "none", background: card, border: `1px solid ${bd}`, color: t1, borderRadius: 11, padding: "10px 8px", fontSize: 12, fontWeight: 700 }}>🏪 Recogida<br /><span style={{ fontSize: 10, fontWeight: 500, color: t3 }}>{pickupAddrOf(o) || pickupOf(o) || "—"}</span></a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dropOf(o) || "")}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", textDecoration: "none", background: card, border: `1px solid ${bd}`, color: t1, borderRadius: 11, padding: "10px 8px", fontSize: 12, fontWeight: 700 }}>📍 Entrega<br /><span style={{ fontSize: 10, fontWeight: 500, color: t3 }}>{dropOf(o) || "—"}</span></a>
        </div>}
        {actionMode === "report" && !reportSent[o.id] && <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 14, padding: 13, marginBottom: 12 }}>
          {!reportTarget
            ? <><div style={{ fontSize: 11.5, fontWeight: 800, color: t2, marginBottom: 9 }}>¿A quién quieres reportar?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setReportTarget("comprador")} style={{ flex: 1, background: "transparent", border: `1px solid ${bd}`, color: t1, borderRadius: 10, padding: "11px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Al comprador</button>
                  <button onClick={() => setReportTarget("vendedor")} style={{ flex: 1, background: "transparent", border: `1px solid ${bd}`, color: t1, borderRadius: 10, padding: "11px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Al vendedor</button>
                </div></>
            : <><div style={{ fontSize: 11.5, fontWeight: 800, color: t2, marginBottom: 9 }}>Reportar al {reportTarget} · ¿qué pasó?</div>
                {(() => {
                  const targetName = reportTarget === "comprador" ? (dropNameOf(o) || "Comprador") : (o.sellerName || pickupOf(o) || "Vendedor");
                  const targetId = reportTarget === "comprador" ? (o.buyerId || o.delivery?.buyerId || null) : (o.sellerId || null);
                  const send = (reasonText) => {
                    onReport && onReport({ targetName, targetId, targetRole: reportTarget, reason: reasonText, detail: `Reportado por el mensajero durante la entrega de "${o.title || "pedido"}".`, reporterName: meName, reporterId: record?.id || record?.userId || meName, orderId: o.id });
                    setReportSent(s => ({ ...s, [o.id]: `${reportTarget}: ${reasonText}` })); setActionMode(null); setReportTarget(""); setReportOther(false); setReportText("");
                  };
                  if (reportOther) return <>
                    <textarea value={reportText} maxLength={150} onChange={e => setReportText(e.target.value)} placeholder="Describe qué pasó (máx. 150 caracteres)…" autoFocus style={{ width: "100%", background: dark ? "#1a1a1e" : "#fff", border: `1px solid ${bd}`, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: t1, minHeight: 64, resize: "vertical", fontFamily: "inherit", marginBottom: 6 }} />
                    <div style={{ fontSize: 10, color: t3, textAlign: "right", marginBottom: 8 }}>{reportText.length}/150</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setReportOther(false); setReportText(""); }} style={{ flex: 1, background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Atrás</button>
                      <button disabled={!reportText.trim()} onClick={() => send(reportText.trim())} style={{ flex: 2, background: reportText.trim() ? "#ef4444" : (dark ? "#26262b" : "#e2e8f0"), border: "none", color: reportText.trim() ? "#fff" : t3, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 800, cursor: reportText.trim() ? "pointer" : "default" }}>Enviar reporte</button>
                    </div>
                  </>;
                  return ["No encuentro la dirección", "No responde / no aparece", "Producto dañado o incorrecto", "No me dejaron cobrar", "Trato irrespetuoso", "Otro (escribir)"].map(r => <button key={r} onClick={() => { if (r === "Otro (escribir)") setReportOther(true); else send(r); }} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${bd}`, color: t1, borderRadius: 10, padding: "10px 12px", fontSize: 12, fontWeight: 600, marginBottom: 7, cursor: "pointer" }}>{r}</button>);
                })()}</>}
        </div>}
        {reportSent[o.id] && <div style={{ background: "#22C55E14", border: "1px solid #22C55E40", borderRadius: 12, padding: "11px 13px", marginBottom: 12, fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✓ Reporte enviado ({reportSent[o.id]}). El equipo de RETADOR lo revisará.</div>}
        {payCard(o)}
        {actionBtn(o)}
        {o.courierName === meName && o.courierStage && ["propuesta", "aceptado", "recogido"].includes(o.courierStage) && <button onClick={() => cancelFn(o.id)} style={{ width: "100%", marginTop: 8, background: "transparent", border: `1px solid #ef444455`, color: "#ef4444", borderRadius: 13, padding: "12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Liberar esta entrega (que la tome otro)</button>}
      </div>
    </div>;
  };

  return <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 4000, overflowY: "auto", WebkitOverflowScrolling: "touch", background: bg }}>
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 44px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>‹ Volver a RETADOR</button>
        <button onClick={() => setOnline(v => !v)} style={{ display: "flex", alignItems: "center", gap: 7, background: online ? "#22C55E1a" : (dark ? "#1c1c20" : "#fff"), border: `1px solid ${online ? "#22C55E55" : bd}`, borderRadius: 100, padding: "6px 13px", cursor: "pointer" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: online ? "#22C55E" : t3 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: online ? "#22C55E" : t2 }}>{online ? "En línea" : "Desconectado"}</span>
        </button>
      </div>

      <div style={{ background: `linear-gradient(135deg,#4F46E5,#7C3AED)`, borderRadius: 18, padding: "18px 18px 20px", marginBottom: 16, color: "#fff" }}>
        <div style={{ fontSize: 13, opacity: .85 }}>Hola, {(record?.nombre || meName || "").split(" ")[0]} 👋</div>
        <div style={{ fontSize: 12, opacity: .75, marginTop: 2 }}>Ganado en entregas completadas</div>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 2 }}>{money(earnedTotal)}</div>
        <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12 }}>
          <div><b style={{ fontSize: 16 }}>{done.length}</b> <span style={{ opacity: .8 }}>completadas</span></div>
          <div><b style={{ fontSize: 16 }}>{available.length}</b> <span style={{ opacity: .8 }}>disponibles</span></div>
        </div>
      </div>

      <div style={{ display: "flex", background: dark ? "#141417" : "#fff", border: `1px solid ${bd}`, borderRadius: 12, padding: 3, marginBottom: 16 }}>
        {[["disp", "Disponibles"], ["activa", "Mi entrega"], ["hist", "Historial"]].map(([k, lb]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, height: 38, borderRadius: 9, border: "none", background: tab === k ? AC : "transparent", color: tab === k ? "#fff" : t2, fontSize: 12.5, fontWeight: 700, cursor: "pointer", position: "relative" }}>
            {lb}{k === "activa" && active && <span style={{ position: "absolute", top: 5, right: 8, width: 7, height: 7, borderRadius: "50%", background: tab === k ? "#fff" : "#22C55E" }} />}
          </button>
        ))}
      </div>

      {tab === "disp" && dispView()}
      {tab === "activa" && activeView()}
      {tab === "hist" && histView()}
    </div>
    {detailModal()}
    {adjustFor && (() => {
      const o = adjustFor, base = feeOf(o);
      const soft = dark ? "#1a1a1e" : "#f1f5f9";
      const val = Math.max(0, Number(adjustVal) || 0);
      const raised = val > base;
      const stepBtn = { width: 46, height: 46, borderRadius: 13, border: `1px solid ${bd}`, background: soft, color: t1, fontSize: 22, fontWeight: 800, cursor: "pointer", flexShrink: 0 };
      return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 4300 }} onClick={() => setAdjustFor(null)}>
        <div onClick={e => e.stopPropagation()} style={{ background: card, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "20px 18px 26px" }}>
          <div style={{ width: 38, height: 4, borderRadius: 4, background: bd, margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 900, color: t1, marginBottom: 4 }}>Tu tarifa de entrega</p>
          <p style={{ fontSize: 11.5, color: t3, marginBottom: 16, lineHeight: 1.5 }}>Estimada por distancia: <b style={{ color: t2 }}>{money(base)}</b>. Pon el precio que quieras según la distancia real. Si te pasas, el comprador puede rechazarlo.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setAdjustVal(String(Math.max(0, val - 25)))} style={stepBtn}>−</button>
            <div style={{ flex: 1, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 5, background: soft, border: `1px solid ${bd}`, borderRadius: 13, padding: "8px 12px" }}>
              <input type="number" inputMode="numeric" value={adjustVal} onChange={e => setAdjustVal(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 24, fontWeight: 900, color: t1 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: t2 }}>CUP</span>
            </div>
            <button onClick={() => setAdjustVal(String(val + 25))} style={stepBtn}>+</button>
          </div>
          {raised && <div style={{ fontSize: 11, color: "#b45309", background: "#f59e0b18", border: "1px solid #f59e0b40", borderRadius: 11, padding: "10px 12px", marginBottom: 12, lineHeight: 1.45 }}>Subiste la tarifa (+{money(val - base)}). El comprador deberá <b>aprobar</b> el nuevo total antes de que puedas recoger.</div>}
          <button disabled={val <= 0} onClick={() => { acceptFn(o.id, val); setAdjustFor(null); setDetail(null); setTab("activa"); }} style={{ width: "100%", height: 50, borderRadius: 13, border: "none", background: val <= 0 ? soft : AC, color: val <= 0 ? t3 : "#fff", fontSize: 14.5, fontWeight: 800, cursor: val <= 0 ? "default" : "pointer" }}>{raised ? "Proponer tarifa y aceptar" : "Aceptar a la tarifa estimada"}</button>
          <button onClick={() => setAdjustFor(null)} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: t3, fontSize: 12.5, fontWeight: 600, padding: "8px", cursor: "pointer" }}>Cancelar</button>
        </div>
      </div>;
    })()}
  </div>;
}

export function CourierFlow({ myRecord, user, flash, onClose, dark, meName, meId, orders = [], localBase = 150, onAccept, onStage, onCancel, onReport, onViewProfile, onChat }) {
  const bg = dark ? "#0a0a0a" : "#f1f5f9", card = dark ? "#141417" : "#fff", t1 = dark ? "#f0f0f2" : "#0f172a", t2 = dark ? "#9aa0aa" : "#64748b", t3 = dark ? "#6b7280" : "#94a3b8", bd = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)", AC = "#6366F1";
  const [started, setStarted] = useState(false);
  const [preview, setPreview] = useState(false);
  // Solicitud REAL en courier_applications: undefined = cargando, null = no tiene.
  const [app, setApp] = useState(undefined);
  const [f, setF] = useState({ nombre: meName || "", telefono: "", zona: "", vehiculo: "A pie", acepta: false });
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const approved = myRecord?.status === "approved";
  useEffect(() => {
    if (approved || !user?.id) { setApp(null); return; }
    let a = true;
    // Red lenta o sin respuesta: a los 6s mostramos el formulario igual (si ya
    // tenía solicitud, el propio insert único lo detecta y muestra su estado).
    const t = setTimeout(() => { if (a) setApp(cur => cur === undefined ? null : cur); }, 6000);
    getMyCourierApplication(user.id).then(d => { if (a) setApp(d); }).catch(() => { if (a) setApp(null); });
    return () => { a = false; clearTimeout(t); };
  }, [user?.id, approved]);

  if (preview) return <CourierDashboard demo meName={meName || "Mensajero"} meId={meId} orders={orders} localBase={localBase} onAccept={onAccept} onStage={onStage} onCancel={onCancel} onReport={onReport} onViewProfile={onViewProfile} onChat={onChat} onClose={() => setPreview(false)} dark={dark} record={{ nombre: meName }} />;
  if (approved) return <CourierDashboard meName={meName} meId={meId} orders={orders} localBase={localBase} onAccept={onAccept} onStage={onStage} onCancel={onCancel} onReport={onReport} onViewProfile={onViewProfile} onChat={onChat} onClose={onClose} dark={dark} record={myRecord} />;

  const wrap = (children) => <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 4000, overflowY: "auto", WebkitOverflowScrolling: "touch", background: bg }}>{children}</div>;
  const backBtn = <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>‹ Volver a RETADOR</button>;

  // Cargando su solicitud
  if (app === undefined) return wrap(
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 16px", textAlign: "center", color: t2, fontSize: 13 }}>Cargando…</div>
  );
  // Ya tiene solicitud: mostrar su ESTADO (la tabla es única por usuario).
  if (app && app.status !== "approved") {
    const rejected = app.status === "rejected";
    return wrap(
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 40px" }}>
        {backBtn}
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: (rejected ? "#ef4444" : AC) + "22", border: `1px solid ${(rejected ? "#ef4444" : AC)}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 18px" }}>{rejected ? "😕" : "🛵"}</div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: t1, marginBottom: 8 }}>{rejected ? "Solicitud rechazada" : "Pendiente de revisión"}</h1>
          <p style={{ fontSize: 13.5, color: t2, lineHeight: 1.55, maxWidth: 340, margin: "0 auto" }}>
            {rejected
              ? "Tu solicitud para ser mensajero no fue aprobada esta vez. Si crees que fue un error, contacta al equipo de RETADOR."
              : "Recibimos tu solicitud para ser mensajero de RETADOR. La estamos revisando — te avisaremos cuando esté aprobada."}
          </p>
          <button onClick={() => setPreview(true)} style={{ marginTop: 22, height: 42, padding: "0 18px", borderRadius: 12, border: `1px solid ${bd}`, background: "transparent", color: t2, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>👁 Ver el tablero (demo)</button>
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
          <button onClick={() => setPreview(true)} style={{ width: "100%", height: 42, borderRadius: 12, border: `1px solid ${bd}`, background: "transparent", color: t2, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginTop: 9 }}>👁 Ver el tablero (demo)</button>
        </div>
      </div>
    </div>
  );

  // Formulario LIMPIO — se guarda de verdad en courier_applications.
  const lbl = { fontSize: 11.5, fontWeight: 700, color: t2, marginBottom: 6, display: "block" };
  const inp = { width: "100%", background: dark ? "#1c1c20" : "#f5f5f7", color: t1, border: `1px solid ${bd}`, borderRadius: 11, padding: "11px 13px", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box" };
  const submit = async () => {
    if (!f.nombre.trim() || !f.telefono.trim() || !f.zona.trim()) return setErr("Completa tu nombre, teléfono y zona.");
    if (!f.acepta) return setErr("Debes aceptar la cláusula de responsabilidad.");
    setErr(""); setSending(true);
    try {
      await submitCourierApplication({ userId: user?.id, name: f.nombre.trim(), phone: f.telefono.trim(), zone: f.zona.trim(), vehicle: f.vehiculo });
      setApp({ status: "pending" });
      flash && flash("🛵 Solicitud enviada — en revisión");
    } catch (e) {
      // Si ya existe una (única por usuario), traemos su estado en vez de fallar.
      if (/duplicate|unique/i.test(e?.message || "")) {
        const d = await getMyCourierApplication(user?.id).catch(() => null);
        setApp(d || { status: "pending" });
      } else setErr("No se pudo enviar: " + (e?.message || "intenta de nuevo"));
    } finally { setSending(false); }
  };

  return wrap(
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 44px" }}>
      <button onClick={() => setStarted(false)} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>‹ Atrás</button>
      <h1 style={{ fontSize: 21, fontWeight: 800, color: t1, marginBottom: 4 }}>Quiero ser mensajero</h1>
      <p style={{ fontSize: 12.5, color: t3, marginBottom: 18 }}>El equipo de RETADOR revisa cada solicitud. Te avisamos al aprobarla.</p>

      <label style={lbl}>Nombre completo *</label>
      <input style={inp} value={f.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre y apellidos" />
      <label style={lbl}>Teléfono *</label>
      <input style={inp} value={f.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+53 …" />
      <label style={lbl}>Zona donde repartes *</label>
      <input style={inp} value={f.zona} onChange={e => set("zona", e.target.value)} placeholder="Ej: Vedado, Centro Habana…" />
      <label style={lbl}>Vehículo *</label>
      <select style={inp} value={f.vehiculo} onChange={e => set("vehiculo", e.target.value)}>
        <option>A pie</option><option>Bicicleta</option><option>Moto</option><option>Carro</option>
      </select>

      <label style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "13px", border: `1px solid ${f.acepta ? AC : bd}`, borderRadius: 12, cursor: "pointer", background: f.acepta ? AC + "0f" : "transparent" }}>
        <input type="checkbox" checked={f.acepta} onChange={e => set("acepta", e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, accentColor: AC, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: t1, lineHeight: 1.55 }}>Declaro que la información es verídica y acepto ser <b>totalmente responsable</b> de los bienes del comprador y del vendedor durante cada entrega, incluyendo el dinero cobrado en efectivo, hasta entregarlo a quien corresponde.</span>
      </label>

      {err && <div style={{ fontSize: 12.5, color: "#fff", background: "#ef4444", borderRadius: 10, padding: "10px 13px", marginTop: 14, fontWeight: 600 }}>{err}</div>}
      <button onClick={submit} disabled={sending} style={{ width: "100%", height: 50, borderRadius: 14, border: "none", background: sending ? (dark ? "#26262b" : "#e2e8f0") : AC, color: sending ? t3 : "#fff", fontSize: 15, fontWeight: 800, cursor: sending ? "default" : "pointer", marginTop: 18 }}>{sending ? "Enviando…" : "Enviar solicitud"}</button>
      <p style={{ fontSize: 10.5, color: t3, textAlign: "center", marginTop: 10 }}>Tu solicitud quedará en revisión hasta que el equipo de RETADOR la apruebe.</p>
    </div>
  );
}
