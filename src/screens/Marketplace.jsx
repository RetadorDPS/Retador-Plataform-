import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { Edit2, MapPin, Trash2 } from "lucide-react";
import { Avatar, AvatarUser, BC, CUBA_PROVINCES, CURRENCIES, CURRENCY_CODES, CatIcon, DEFAULT_CURRENCY, G, Ic, LiveSlot, BlockView, useFeedAds, feedRows, Logo, MarketBanners, Spin, createOrder, densityCols, estimateDeliveryFee, getProductsBySeller, getUserById, getUserName, getUserTrustStats, money, pushBackHandler, serviceRating, serviceReviews, systemRating, trackEvent, uploadImage, useAt, useCatalog, useDensity, usePlatformCfg, useR, useScrollDir } from "../shared/index.js";

export function CatModal({ onClose, onSelect, active }) {
  const { cats, subcats: allSubs } = useCatalog();
  const [selectedCat, setSelectedCat] = useState(active || cats[0].id);
  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const cat = cats.find(c => c.id === selectedCat);
  const subcats = allSubs[selectedCat] || [];

  return (
    <div className="fi" style={{ position: "fixed", inset: 0, zIndex: 400, background: "#080808" }}>
      {/* Header */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "14px clamp(18px,3vw,48px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onClose} className="p" style={{ background: "none", border: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 900 }}>{cat.name}</h2>
            {selectedSubcat && <p style={{ fontSize: 9, color: cat.color, marginTop: 2 }}>{selectedSubcat}</p>}
          </div>
        </div>
        {selectedSubcat ? (
          <button onClick={() => setSelectedSubcat(null)} className="p" style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}30`, borderRadius: 100, padding: "6px 14px", fontSize: 10, fontWeight: 800, color: cat.color }}>
            Ver todas
          </button>
        ) : active && (
          <button onClick={() => { onSelect(null); onClose(); }} className="p" style={{ background: `${G}18`, border: `1px solid ${G}30`, borderRadius: 100, padding: "6px 14px", fontSize: 10, fontWeight: 800, color: G }}>
            Todo
          </button>
        )}
      </div>

      {/* Main Content: Sidebar + Subcategories + Products */}
      <div style={{ display: "flex", height: "calc(100dvh - 60px)" }}>
        
        {/* LEFT SIDEBAR: Categories */}
        <div style={{ width: 100, background: "#0a0a0a", borderRight: "1px solid #1a1a1a", overflowY: "auto", scrollbarWidth: "none" }}>
          {cats.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCat(c.id);
                setSelectedSubcat(null);
              }}
              className="p"
              style={{
                width: "100%",
                background: selectedCat === c.id ? "#0d0d0d" : "transparent",
                border: "none",
                borderLeft: `3px solid ${selectedCat === c.id ? c.color : "transparent"}`,
                padding: "16px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s"
              }}>
              <CatIcon id={c.id} color={selectedCat === c.id ? c.color : "#555"} size={24} />
              <span style={{ fontSize: 9, fontWeight: 700, color: selectedCat === c.id ? c.color : "#555", textAlign: "center", lineHeight: 1.2 }}>
                {c.name}
              </span>
            </button>
          ))}
        </div>

        {/* RIGHT: Subcategories + Products */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          
          {/* Subcategories Grid - ALWAYS FIRST */}
          {subcats.length > 0 && (
            <div style={{ padding: "16px clamp(18px,3vw,48px)", paddingBottom: 24, borderBottom: "1px solid #1a1a1a", background: "#0a0a0a" }}>
              <h3 style={{ fontSize: 10, fontWeight: 800, color: "#888", marginBottom: 14, letterSpacing: .5 }}>SUBCATEGORÍAS</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 8 }}>
                {subcats.map((sub, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSubcat(selectedSubcat === sub ? null : sub)}
                    className="p"
                    style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      gap: 6,
                      opacity: selectedSubcat && selectedSubcat !== sub ? 0.4 : 1,
                      transition: "all 0.2s"
                    }}>
                    <div style={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: "50%", 
                      background: selectedSubcat === sub ? `${cat.color}30` : `${cat.color}15`, 
                      border: `${selectedSubcat === sub ? 2 : 1.5}px solid ${selectedSubcat === sub ? cat.color : `${cat.color}30`}`, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      transition: "all 0.2s",
                      boxShadow: selectedSubcat === sub ? `0 0 16px ${cat.color}40` : "none"
                    }}>
                      <span style={{ fontSize: 16 }}>
                        {sub === "Muebles" && "🛋️"}
                        {sub === "Decoración" && "🖼️"}
                        {sub === "Electrodomésticos" && "🏠"}
                        {sub === "Cocina" && "🍳"}
                        {sub === "Iluminación" && "💡"}
                        {sub === "Organización" && "📦"}
                        {sub === "Jardín" && "🌱"}
                        {sub === "Teléfonos" && "📱"}
                        {sub === "Laptops" && "💻"}
                        {sub === "Tablets" && "📱"}
                        {sub === "Audífonos" && "🎧"}
                        {sub === "Gaming" && "🎮"}
                        {sub === "Smartwatches" && "⌚"}
                        {sub === "Cámaras" && "📷"}
                        {sub === "TV" && "📺"}
                        {sub === "Mujer" && "👗"}
                        {sub === "Hombre" && "👔"}
                        {sub === "Niños" && "👶"}
                        {sub === "Zapatos" && "👟"}
                        {sub === "Bolsos" && "👜"}
                        {sub === "Relojes" && "⌚"}
                        {sub === "Joyas" && "💎"}
                        {sub === "Combos" && "🍱"}
                        {sub === "Bebidas" && "🥤"}
                        {sub === "Frutas" && "🍎"}
                        {sub === "Carnes" && "🥩"}
                        {sub === "Verduras" && "🥬"}
                        {sub === "Maquillaje" && "💄"}
                        {sub === "Skincare" && "🧴"}
                        {sub === "Perfumes" && "💐"}
                        {sub === "Cabello" && "💇"}
                        {sub === "Barbería" && "💈"}
                        {sub === "Autos" && "🚗"}
                        {sub === "Motos" && "🏍️"}
                        {sub === "Bicicletas" && "🚴"}
                        {sub === "Juguetes" && "🧸"}
                        {sub === "Ropa bebé" && "👶"}
                        {sub === "Libros" && "📚"}
                        {sub === "Papelería" && "📝"}
                        {sub === "Cursos online" && "💻"}
                        {sub === "Idiomas" && "🗣️"}
                        {sub === "Electricidad" && "⚡"}
                        {sub === "Plomería" && "🔧"}
                        {sub === "Diseño" && "🎨"}
                        {sub === "Programación" && "💻"}
                        {sub === "Marketing" && "📱"}
                        {sub === "Alimentos" && "🐾"}
                        {sub === "Veterinaria" && "🏥"}
                        {sub === "Accesorios" && "🦴"}
                        {sub === "Fitness" && "💪"}
                        {sub === "Suplementos" && "💊"}
                        {sub === "Ejercicio" && "🏋️"}
                        {sub === "DJs" && "🎧"}
                        {sub === "Catering" && "🍽️"}
                        {sub === "Fotografía" && "📸"}
                        {sub === "Venta casas" && "🏡"}
                        {sub === "Terrenos" && "🏞️"}
                        {sub === "Oficinas" && "🏢"}
                        {sub === "Pinturas" && "🎨"}
                        {sub === "Instrumentos" && "🎸"}
                        {sub === "Manualidades" && "✂️"}
                        {sub === "Fútbol" && "⚽"}
                        {sub === "Gimnasio" && "🏋️"}
                        {sub === "Ciclismo" && "🚴"}
                        {sub === "Eléctricas" && "🔌"}
                        {sub === "Construcción" && "🏗️"}
                        {sub === "Manuales" && "🔨"}
                        {!["Muebles", "Decoración", "Electrodomésticos", "Cocina", "Iluminación", "Organización", "Jardín", "Teléfonos", "Laptops", "Tablets", "Audífonos", "Gaming", "Smartwatches", "Cámaras", "TV", "Mujer", "Hombre", "Niños", "Zapatos", "Bolsos", "Relojes", "Joyas", "Combos", "Bebidas", "Frutas", "Carnes", "Verduras", "Maquillaje", "Skincare", "Perfumes", "Cabello", "Barbería", "Autos", "Motos", "Bicicletas", "Juguetes", "Ropa bebé", "Libros", "Papelería", "Cursos online", "Idiomas", "Electricidad", "Plomería", "Diseño", "Programación", "Marketing", "Alimentos", "Veterinaria", "Accesorios", "Fitness", "Suplementos", "Ejercicio", "DJs", "Catering", "Fotografía", "Venta casas", "Terrenos", "Oficinas", "Pinturas", "Instrumentos", "Manualidades", "Fútbol", "Gimnasio", "Ciclismo", "Eléctricas", "Construcción", "Manuales"].includes(sub) && "📦"}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: selectedSubcat === sub ? cat.color : "#888", textAlign: "center", lineHeight: 1.2, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Section - ALWAYS BELOW SUBCATEGORIES */}
          <div style={{ padding: "16px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#888", letterSpacing: .5 }}>
                {selectedSubcat ? selectedSubcat.toUpperCase() : "PRODUCTOS"}
              </h3>
              <button
                onClick={() => {
                  onSelect(selectedCat);
                  onClose();
                }}
                className="p"
                style={{ fontSize: 10, fontWeight: 700, color: cat.color }}>
                Ver todos →
              </button>
            </div>
            
            {/* Product Grid - Show message for now, will be connected to real products */}
            <div style={{ textAlign: "center", padding: "60px 20px", background: "#0d0d0d", borderRadius: 14, border: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                <CatIcon id={selectedCat} color={cat.color} size={48} />
              </div>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
                {selectedSubcat ? `Productos de ${selectedSubcat}` : `Productos de ${cat.name}`}
              </p>
              <p style={{ fontSize: 10, color: "#888" }}>
                Próximamente productos reales aquí
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES PANEL
// ═════════════════════════════════════════════════════════════════════════════
export function NotifPanel({ onClose, notifs = [], onRead, onOpenOrder, onOpenConversation }) {
  const { S, B, CARD, T1, T2, T3, isDark } = useAt();
  const tap = n => {
    onRead && onRead(n.id);
    if (n.orderId && onOpenOrder) onOpenOrder(n.orderId);
    else if (n.conversationId && onOpenConversation) { onOpenConversation(n.conversationId); onClose && onClose(); }
  };
  return (
    <div className="fi" style={{ position: "fixed", inset: 0, zIndex: 4400 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.76)", backdropFilter: "blur(14px)" }} />
      <div className="bs" onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: S, borderRadius: "22px 22px 0 0", border: `1px solid ${B}`, borderBottom: "none", maxHeight: "70dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 34, height: 4, background: B, borderRadius: 2, margin: "12px auto 14px", flexShrink: 0 }} />
        <div style={{ padding: "0 18px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: T1 }}>Notificaciones</span>
          <button onClick={onClose} style={{ background: isDark ? "#1e1e1e" : CARD, border: "none", color: T2, width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 32px" }}>
          {notifs.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: T3 }}><div style={{ fontSize: 40, marginBottom: 10, opacity: .7 }}>🔔</div><p style={{ fontSize: 13 }}>Sin notificaciones por ahora</p></div>
          : notifs.map(n => (
            <div key={n.id} onClick={() => tap(n)} className="cd" style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 14px", marginBottom: 9, borderRadius: 15, background: n.read ? (isDark ? "#141414" : "#f7f8fa") : (isDark ? "#1a1709" : "#FFFBEC"), border: `1px solid ${n.read ? B : G + "55"}`, cursor: (n.orderId || n.conversationId) ? "pointer" : "default" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: n.read ? (isDark ? "#222" : "#eceef1") : G + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🔔</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: T1, lineHeight: 1.45, fontWeight: n.read ? 500 : 700 }}>{n.text}</p>
                <p style={{ fontSize: 10.5, color: T3, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{new Date(n.at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  {n.orderId && <span style={{ color: G, fontWeight: 700 }}>· Ver pedido ›</span>}
                  {n.conversationId && <span style={{ color: G, fontWeight: 700 }}>· Ver conversación ›</span>}
                </p>
              </div>
              {!n.read && <div style={{ width: 9, height: 9, borderRadius: "50%", background: G, flexShrink: 0, marginTop: 5 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BUY MODAL — escrow o pago directo
// ═════════════════════════════════════════════════════════════════════════════
// Lee las direcciones que el usuario guardó en Configuración → Entregas
function getSavedAddresses() {
  try { const r = localStorage.getItem("retador_settings"); if (r) { const s = JSON.parse(r); return (s.deliveries && s.deliveries.addresses) || []; } } catch {}
  return [];
}
function getSavedInstructions() {
  try { const r = localStorage.getItem("retador_settings"); if (r) { const s = JSON.parse(r); return (s.deliveries && s.deliveries.instructions) || ""; } } catch {}
  return "";
}

export function BuyModal({ product, user, onClose, flash, onSuccess }) {
  const { S, B, T1, T2, T3, isDark } = useAt();
  const platformCfg = usePlatformCfg(); // tarifa local desde la config GLOBAL del backend
  const liveLocalBase = estimateDeliveryFee(platformCfg, null) || 150;
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState("resumen");
  const cur = product.currency || DEFAULT_CURRENCY;
  const price = parseFloat(product.price || 0);
  const total = price * qty;

  const SHIP_META = {
    local:   { icon: "🛵", label: "Delivery local",      desc: "Un mensajero te lo lleva" },
    intl:    { icon: "✈️", label: "Envío internacional", desc: "Cargo a toda Cuba" },
    persona: { icon: "🤝", label: "Entrega en persona",  desc: "Lo recoges tú mismo" },
  };
  const sm = product.shipModes || { local: true };
  const availModes = ["local", "intl", "persona"].filter(k => sm[k]);
  const [shipMode, setShipMode] = useState(availModes[0] || "local");

  // Datos de entrega — vienen precargados con lo que ya sabemos; el usuario completa el resto.
  const savedAddrs = getSavedAddresses();
  const mainAddr = savedAddrs.find(a => a.main) || savedAddrs[0];
  const [del, setDel] = useState({ name: user?.name || "", phone: user?.phone || "", addr: mainAddr?.address || "", ref: getSavedInstructions() || "", prov: "La Habana", city: "" });
  const setD = (k, v) => setDel(d => ({ ...d, [k]: v }));
  const pickSaved = (a) => setDel(d => ({ ...d, addr: a.address }));

  const needData = shipMode === "local" || shipMode === "intl";
  const dataValid = shipMode === "local" ? (del.name && del.phone && del.addr)
    : shipMode === "intl" ? (del.name && del.phone && del.prov && del.city && del.addr)
    : true;

  const handle = async () => {
    setLoading(true);
    try {
      const modalidad = shipMode === "intl" ? "cargo" : "local"; // exterior(cargo) vs local; el dueño afina conectado/cargo después
      let delivery;
      if (shipMode === "persona") delivery = { mode: "persona" };
      else if (shipMode === "local") delivery = { mode: "local", name: del.name, phone: del.phone, address: del.addr, ref: del.ref, pickup: product.seller_name || "Vendedor", pickupAddress: product.pickupAddress || product.sellerAddress || product.location || "", pickupPhone: product.pickupPhone || product.sellerPhone || product.seller_phone || "" };
      else delivery = { mode: "intl", recipient: { name: del.name, phone: del.phone, province: del.prov, city: del.city, address: del.addr }, origin: product.origin || "Exterior", transport: product.shippingType || "standard" };
      const shipPrice = shipMode === "intl" ? parseFloat(product.shippingPrice || 0) : shipMode === "local" ? liveLocalBase : 0;
      const shipTo = shipMode === "intl" ? "empresa de envíos" : shipMode === "local" ? "mensajero" : null;
      const order = await createOrder({
        productId: product.id, title: product.title, image: product.img || product.image, cat: product.cat,
        sellerId: product.seller_id, sellerName: product.seller_name,
        buyerId: user?.id, buyerName: user?.name, qty, unitPrice: price, amount: total, currency: cur,
        shipMode, modalidad,
        shipPrice, shipTo,
        delivery,
      });
      flash("✅ Pedido creado — ya puedes coordinar con el vendedor");
      onSuccess?.(order);
    } catch (e) {
      flash("❌ " + (e.message || "No se pudo crear el pedido"));
    } finally { setLoading(false); }
  };

  const card = isDark ? "#0f0f0f" : S;
  const soft = isDark ? "#111" : "#F5F6F7";
  const inp = { width: "100%", background: isDark ? "#0a0a0a" : "#fff", border: `1px solid ${B}`, borderRadius: 10, padding: "11px 13px", fontSize: 12.5, color: T1, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const lbl = { fontSize: 10, fontWeight: 700, color: T2, marginBottom: 5, display: "block" };
  const primaryAction = () => { if (availModes.length === 0) return; if (needData) setStep("datos"); else handle(); };

  return (
    <div className="fi" style={{ position: "fixed", inset: 0, zIndex: 500 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(10px)" }} />
      <div className="bs" onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "92vh", overflowY: "auto", background: card, borderRadius: "22px 22px 0 0", padding: "0 18px 36px", border: `1px solid ${B}`, borderBottom: "none" }}>
        <div style={{ width: 34, height: 4, background: isDark ? "#222" : "#ddd", borderRadius: 2, margin: "12px auto 16px" }} />

        {step === "resumen" ? <>
          <p style={{ fontSize: 15, fontWeight: 800, color: T1, marginBottom: 16 }}>Crear pedido</p>

          <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: "#1a1a1a", overflow: "hidden", flexShrink: 0 }}>
              {(product.img || product.image) && <img src={product.img || product.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{product.title}</p>
              <p style={{ fontSize: 16, fontWeight: 900, color: G, marginTop: 4 }}>{money(price, cur)}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: soft, border: `1px solid ${B}`, borderRadius: 13, padding: "12px 14px", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T1 }}>Cantidad</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button className="p" onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${B}`, background: "none", color: T1, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>−</button>
              <span style={{ fontSize: 15, fontWeight: 800, color: T1, minWidth: 18, textAlign: "center" }}>{qty}</span>
              <button className="p" onClick={() => setQty(q => q + 1)} style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${B}`, background: "none", color: T1, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>+</button>
            </div>
          </div>

          {(() => {
            const isIntl = shipMode === "intl", isLocal = shipMode === "local";
            const shipCost = isIntl ? parseFloat(product.shippingPrice || 0) : isLocal ? liveLocalBase : 0;
            const shipLabel = isIntl ? "Envío internacional" : isLocal ? "Delivery local" : "";
            const shipWho = isIntl ? "empresa de envíos" : isLocal ? "mensajero" : "";
            const cupFmt = v => Math.round(v || 0).toLocaleString() + " CUP";
            const row = (label, who, val, strong, cup) => (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: strong ? 0 : 7 }}>
                <span style={{ fontSize: strong ? 12 : 11.5, color: strong ? T2 : T1, fontWeight: strong ? 500 : 600 }}>
                  {label}{who && <span style={{ fontSize: 9.5, color: T3, fontWeight: 500 }}>  · {who}</span>}
                </span>
                <span style={{ fontSize: strong ? 18 : 12.5, fontWeight: strong ? 900 : 700, color: T1 }}>{cup ? cupFmt(val) : money(val, cur)}</span>
              </div>
            );
            return <div style={{ background: soft, border: `1px solid ${B}`, borderRadius: 12, padding: "12px 13px", marginBottom: 14 }}>
              {row(qty > 1 ? `Producto · ×${qty}` : "Producto", "al vendedor", total)}
              {shipCost > 0 && row(isLocal ? "Domicilio (estimado)" : shipLabel, isLocal ? "al mensajero" : shipWho, shipCost, false, isLocal)}
              <div style={{ height: 1, background: B, margin: "3px 0 9px" }} />
              {isLocal
                ? <>
                    {row("Total del producto", "", total, true)}
                    <div style={{ fontSize: 10, color: T3, marginTop: 8, lineHeight: 1.5 }}>+ <b>{cupFmt(shipCost)}</b> de domicilio (estimado), que pagas <b>al mensajero en efectivo (CUP)</b> al recibir. Si la distancia resulta mayor, te avisaremos para <b>aprobar el nuevo total antes</b> de que el mensajero salga.</div>
                  </>
                : row("Total a pagar", "", total + shipCost, true)}
            </div>;
          })()}

          {availModes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T2, marginBottom: 8 }}>¿Cómo quieres recibirlo?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {availModes.map(k => {
                  const m = SHIP_META[k]; const on = shipMode === k;
                  const extra = k === "intl" && product.shippingPrice ? ` · +${money(parseFloat(product.shippingPrice), cur)} envío` : "";
                  return (
                    <button key={k} className="p" onClick={() => setShipMode(k)}
                      style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", width: "100%",
                        background: on ? `${G}12` : soft, border: `1.5px solid ${on ? G : B}`, borderRadius: 11, padding: "10px 11px" }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: on ? G : T1 }}>{m.label}</div>
                        <div style={{ fontSize: 9, color: T2, marginTop: 1 }}>{m.desc}{extra}</div>
                      </div>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${on ? G : B}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {on && <div style={{ width: 8, height: 8, borderRadius: "50%", background: G }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ background: isDark ? "#0d0d0d" : soft, border: `1px solid ${B}`, borderRadius: 12, padding: "11px 13px", marginBottom: 16 }}>
            <p style={{ fontSize: 10.5, color: T2, lineHeight: 1.5 }}>{needData ? "En el siguiente paso completas los datos de entrega; el resto ya viene precargado." : "Coordinarás el encuentro con el vendedor por el chat al crear el pedido."}</p>
          </div>

          <button className="p" onClick={primaryAction} disabled={availModes.length === 0} style={{ width: "100%", background: G, color: "#000", border: "none", borderRadius: 50, padding: "15px", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: availModes.length === 0 ? .5 : 1 }}>
            {needData ? "Continuar →" : `Crear pedido · ${money(total, cur)}`}
          </button>
        </> : <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button className="p" onClick={() => setStep("resumen")} style={{ background: "none", border: "none", display: "flex", padding: 0 }}><Ic n="back" c={T2} s={18} /></button>
            <p style={{ fontSize: 15, fontWeight: 800, color: T1 }}>{shipMode === "intl" ? "Datos del destinatario" : "Datos de entrega"}</p>
          </div>

          <div style={{ background: soft, border: `1px solid ${B}`, borderRadius: 12, padding: "10px 13px", marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: T3, fontWeight: 700, marginBottom: 3 }}>{SHIP_META[shipMode].icon} {SHIP_META[shipMode].label} · {money(total, cur)}</p>
            <p style={{ fontSize: 11.5, color: T1, fontWeight: 700 }}>{product.title}{qty > 1 ? ` ×${qty}` : ""}</p>
            {shipMode === "local" && <p style={{ fontSize: 10, color: T2, marginTop: 2 }}>Recogida (vendedor): {product.location || product.seller_name || "Vendedor"}</p>}
            {shipMode === "intl" && <p style={{ fontSize: 10, color: T2, marginTop: 2 }}>Envío {product.shippingType || "standard"} · destino Cuba</p>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 18 }}>
            <div>
              <label style={lbl}>{shipMode === "intl" ? "Nombre del destinatario *" : "Tu nombre *"}</label>
              <input style={inp} value={del.name} onChange={e => setD("name", e.target.value)} placeholder="Nombre y apellidos" />
            </div>
            <div>
              <label style={lbl}>Teléfono *</label>
              <input style={inp} value={del.phone} onChange={e => setD("phone", e.target.value)} placeholder="Ej: +53 5 234 5678" />
            </div>
            {shipMode === "intl" && (
              <div style={{ display: "flex", gap: 9 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Provincia *</label>
                  <select style={{ ...inp, appearance: "none", cursor: "pointer" }} value={del.prov} onChange={e => setD("prov", e.target.value)}>
                    {CUBA_PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Ciudad / Municipio *</label>
                  <input style={inp} value={del.city} onChange={e => setD("city", e.target.value)} placeholder="Ej: Centro" />
                </div>
              </div>
            )}
            <div>
              <label style={lbl}>{shipMode === "intl" ? "Dirección de entrega *" : "Dirección de entrega *"}</label>
              {savedAddrs.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
                  {savedAddrs.map(a => (
                    <button key={a.id} type="button" onClick={() => pickSaved(a)}
                      style={{ fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 999, cursor: "pointer", border: `1px solid ${del.addr === a.address ? G : B}`, background: del.addr === a.address ? G + "22" : "transparent", color: del.addr === a.address ? (T1) : T2, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={11} /> {a.label}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ position: "relative" }}>
                <input style={{ ...inp, paddingRight: del.addr ? 34 : 13 }} value={del.addr} onChange={e => setD("addr", e.target.value)} placeholder="Calle, número, entre calles" />
                {del.addr && <button type="button" onClick={() => setD("addr", "")} aria-label="Borrar" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", border: "none", background: isDark ? "#2a2a2a" : "#e5e5e5", color: T2, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>}
              </div>
            </div>
            {shipMode === "local" && (
              <div>
                <label style={lbl}>Referencia (opcional)</label>
                <input style={inp} value={del.ref} onChange={e => setD("ref", e.target.value)} placeholder="Edificio, piso, punto de referencia" />
              </div>
            )}
          </div>

          <button className="p" onClick={handle} disabled={loading || !dataValid} style={{ width: "100%", background: dataValid ? G : (isDark ? "#1a1a1a" : "#ddd"), color: dataValid ? "#000" : T3, border: "none", borderRadius: 50, padding: "15px", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <Spin size={18} color="#000" /> : `Crear pedido · ${money(total, cur)}`}
          </button>
        </>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ADVANCED SEARCH
// ═════════════════════════════════════════════════════════════════════════════
export function AdvancedSearch({ products, onProduct, favorites, onFav, onNav, view = "grid" }) {
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const { BG, S, B, CARD, T1, T2, T3, isDark, ts } = useAt();
  const { tokens: dt, mode: dMode } = useDensity();
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [quickFilter, setQuickFilter] = useState("TODOS");
  const feedAds = useFeedAds("busqueda"); // anuncios intercalados cada N productos

  const { cats, subcats: allSubs } = useCatalog();
  const cat = selectedCat ? cats.find(c => c.id === selectedCat) : null;
  const subcats = selectedCat ? (allSubs[selectedCat] || []) : [];

  const _disc = p => p.orig_price && parseFloat(p.orig_price) > parseFloat(p.price || 0);
  const _sold = p => Number(p.sold_count ?? p.soldCount) || 0;
  const _created = p => p.created_at ? new Date(p.created_at).getTime() : 0;
  let filtered = products.filter(p => {
    const matchCat = (!selectedCat || p.cat === selectedCat) && (!selectedSubcat || p.subcat === selectedSubcat);
    const matchSearch = !searchText || p.title.toLowerCase().includes(searchText.toLowerCase()) || p.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchQuick = quickFilter === "TODOS"
      || (quickFilter === "OFERTAS"     && _disc(p))
      || (quickFilter === "NUEVO"       && (p.badge === "NUEVO" || !!p.created_at))
      || (quickFilter === "RECOMENDADO" && (p.promoted || p.featured || p.badge === "RECOMENDADO"))
      || (quickFilter === "MAS_VENDIDO" && _sold(p) > 0);
    return matchCat && matchSearch && matchQuick;
  });
  if (quickFilter === "NUEVO")            filtered = [...filtered].sort((a, b) => _created(b) - _created(a));
  else if (quickFilter === "MAS_VENDIDO") filtered = [...filtered].sort((a, b) => _sold(b) - _sold(a));
  else if (quickFilter === "OFERTAS")     filtered = [...filtered].sort((a, b) => (parseFloat(b.orig_price || 0) - parseFloat(b.price || 0)) - (parseFloat(a.orig_price || 0) - parseFloat(a.price || 0)));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Tramo: antes de la barra de búsqueda (arriba del todo) */}
      <LiveSlot page="busqueda" from={null} to="bq_s" onNav={onNav} pad="8px 14px 0" />
      {/* Header con búsqueda — compacto */}
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${B}`, padding: "8px clamp(14px,2.5vw,40px)" }}>
        <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 50, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Ic n="search" c={T3} s={15} />
          <input 
            value={searchText} 
            onChange={e => setSearchText(e.target.value)} 
            placeholder="Buscar productos..." 
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: T1, fontSize: 12, fontWeight: 500 }} 
          />
          {searchText && <button onClick={() => setSearchText("")} className="p" style={{ background: isDark ? "#232323" : B, border: "none", color: T2, width: 20, height: 20, borderRadius: "50%", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>}
        </div>
      </div>

      {/* Layout: Sidebar + Contenido */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar de categorías — más angosto */}
        <div style={{ width: 70, flexShrink: 0, background: isDark ? "#060606" : CARD, borderRight: `1px solid ${B}`, overflowY: "auto", padding: "10px 0", scrollbarWidth: "none" }}>
          <button 
            onClick={() => { setSelectedCat(null); setSelectedSubcat(null); }} 
            className="p"
            style={{ width: "100%", background: !selectedCat ? `${G}15` : "transparent", border: "none", borderLeft: `3px solid ${!selectedCat ? G : "transparent"}`, padding: "10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
            <div style={{ fontSize: 17 }}>🏠</div>
            <span style={{ fontSize: 8, fontWeight: !selectedCat ? 700 : 500, color: !selectedCat ? G : T3, textAlign: "center", lineHeight: 1.2 }}>Todo</span>
          </button>
          {cats.map(c => (
            <button 
              key={c.id}
              onClick={() => { setSelectedCat(c.id); setSelectedSubcat(null); }} 
              className="p"
              style={{ width: "100%", background: selectedCat === c.id ? `${c.color}15` : "transparent", border: "none", borderLeft: `3px solid ${selectedCat === c.id ? c.color : "transparent"}`, padding: "10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
              <CatIcon id={c.id} color={selectedCat === c.id ? c.color : T3} size={20} />
              <span style={{ fontSize: 8, fontWeight: selectedCat === c.id ? 700 : 500, color: selectedCat === c.id ? c.color : T3, textAlign: "center", lineHeight: 1.2 }}>{c.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Área principal */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* SUBCATEGORÍAS */}
          {selectedCat && subcats.length > 0 && (
            <div style={{ padding: "12px 14px 18px", borderBottom: `1px solid ${B}`, background: isDark ? "#080808" : CARD }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 9, fontWeight: 800, color: T2, letterSpacing: .5 }}>SUBCATEGORÍAS</h3>
                {selectedSubcat && (
                  <button onClick={() => setSelectedSubcat(null)} className="p" style={{ fontSize: 9, fontWeight: 700, color: cat.color, background: "none", border: "none" }}>Ver todas</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 6 }}>
                {subcats.map((sub, i) => (
                  <button key={i} onClick={() => setSelectedSubcat(selectedSubcat === sub ? null : sub)} className="p"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, opacity: selectedSubcat && selectedSubcat !== sub ? 0.35 : 1, transition: "all 0.2s", background: "none", border: "none" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: selectedSubcat === sub ? `linear-gradient(145deg, ${cat.color}3D, ${cat.color}22)` : `linear-gradient(145deg, ${cat.color}1A, ${cat.color}0D)`, border: `${selectedSubcat === sub ? 1.5 : 1}px solid ${selectedSubcat === sub ? cat.color : `${cat.color}33`}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", boxShadow: selectedSubcat === sub ? `0 4px 14px ${cat.color}33` : "none" }}>
                      <span style={{ fontSize: 22 }}>
                        {sub === "Muebles" && "🛋️"}{sub === "Decoración" && "🖼️"}{sub === "Electrodomésticos" && "🏠"}{sub === "Cocina" && "🍳"}{sub === "Iluminación" && "💡"}{sub === "Organización" && "📦"}{sub === "Jardín" && "🌱"}{sub === "Teléfonos" && "📱"}{sub === "Laptops" && "💻"}{sub === "Tablets" && "📱"}{sub === "Audífonos" && "🎧"}{sub === "Gaming" && "🎮"}{sub === "Smartwatches" && "⌚"}{sub === "Cámaras" && "📷"}{sub === "TV" && "📺"}{sub === "Mujer" && "👗"}{sub === "Hombre" && "👔"}{sub === "Niños" && "👶"}{sub === "Zapatos" && "👟"}{sub === "Bolsos" && "👜"}{sub === "Relojes" && "⌚"}{sub === "Joyas" && "💎"}{sub === "Combos" && "🍱"}{sub === "Bebidas" && "🥤"}{sub === "Frutas" && "🍎"}{sub === "Carnes" && "🥩"}{sub === "Verduras" && "🥬"}{sub === "Maquillaje" && "💄"}{sub === "Skincare" && "🧴"}{sub === "Perfumes" && "💐"}{sub === "Cabello" && "💇"}{sub === "Barbería" && "💈"}{sub === "Autos" && "🚗"}{sub === "Motos" && "🏍️"}{sub === "Bicicletas" && "🚴"}{sub === "Juguetes" && "🧸"}{sub === "Ropa bebé" && "👶"}{sub === "Libros" && "📚"}{sub === "Papelería" && "📝"}{sub === "Cursos online" && "💻"}{sub === "Idiomas" && "🗣️"}{sub === "Electricidad" && "⚡"}{sub === "Plomería" && "🔧"}{sub === "Diseño" && "🎨"}{sub === "Programación" && "💻"}{sub === "Marketing" && "📱"}{sub === "Alimentos" && "🐾"}{sub === "Veterinaria" && "🏥"}{sub === "Accesorios" && "🦴"}{sub === "Fitness" && "💪"}{sub === "Suplementos" && "💊"}{sub === "Ejercicio" && "🏋️"}{sub === "DJs" && "🎧"}{sub === "Catering" && "🍽️"}{sub === "Fotografía" && "📸"}{sub === "Venta casas" && "🏡"}{sub === "Terrenos" && "🏞️"}{sub === "Oficinas" && "🏢"}{sub === "Pinturas" && "🎨"}{sub === "Instrumentos" && "🎸"}{sub === "Manualidades" && "✂️"}{sub === "Fútbol" && "⚽"}{sub === "Gimnasio" && "🏋️"}{sub === "Ciclismo" && "🚴"}{sub === "Eléctricas" && "🔌"}{sub === "Construcción" && "🏗️"}{sub === "Manuales" && "🔨"}{"📦"}
                      </span>
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 600, color: selectedSubcat === sub ? cat.color : T2, textAlign: "center", lineHeight: 1.2, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tramo: entre la barra de búsqueda y los filtros */}
          <LiveSlot page="busqueda" from="bq_s" to="bq_f" onNav={onNav} pad="10px 14px 2px" />

          {/* QUICK FILTERS */}
          <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${B}`, display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {[
              { id: "TODOS",      label: "🏷️ Todos"      },
              { id: "OFERTAS",    label: "🔥 Ofertas"    },
              { id: "NUEVO",      label: "✨ Nuevo"      },
              { id: "RECOMENDADO",label: "⭐ Destacado"  },
              { id: "MAS_VENDIDO",label: "🏆 Más vendido"},
            ].map(f => (
              <button key={f.id} onClick={() => setQuickFilter(f.id)} className={`chip ${isDark ? "" : "chip-light"}`}
                style={{ flexShrink: 0, background: quickFilter === f.id ? G : isDark ? "#111" : S, color: quickFilter === f.id ? "#000" : T2, border: `1px solid ${quickFilter === f.id ? G : B}`, borderRadius: 999, padding: "6px 12px", fontSize: 9.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Tramo: anuncios entre los filtros y los resultados */}
          <LiveSlot page="busqueda" from="bq_f" to="bq_p" onNav={onNav} pad="10px 14px 2px" />

          {/* PRODUCTOS */}
          <div style={{ padding: "12px 14px 80px" }}>
            <div style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 13 * ts, fontWeight: 800, marginBottom: 2, color: T1 }}>
                {selectedSubcat ? selectedSubcat : selectedCat ? cat.name : "Todos los productos"}
              </h2>
              <p style={{ color: T2, fontSize: 9 * ts }}>{filtered.length} resultados</p>
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: T2 }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>🔍</div>
                <p style={{ fontSize: 11 }}>No se encontraron productos</p>
              </div>
            ) : (
              view === "muro"
                ? <div style={{ columnCount: densityCols(dMode, isDesktop, isTablet), columnGap: dt.grid.gap }}>
                    {feedRows(filtered, feedAds).map(it => it.t === "p"
                      ? <PCard key={it.p.id} p={it.p} view="muro" onClick={() => onProduct(it.p)} isFav={favorites.has(it.p.id)} onFav={onFav} />
                      : <div key={it.key} style={{ breakInside: "avoid", columnSpan: "all", margin: "6px 0" }}><BlockView m={it.m} onNav={onNav} /></div>)}
                  </div>
                : <div className="dx" style={{ display: "grid", gridTemplateColumns: `repeat(${densityCols(dMode, isDesktop, isTablet)}, 1fr)`, gap: dt.grid.gap }}>
                    {feedRows(filtered, feedAds).map(it => it.t === "p"
                      ? <PCard key={it.p.id} p={it.p} view="grid" onClick={() => onProduct(it.p)} isFav={favorites.has(it.p.id)} onFav={onFav} />
                      : <div key={it.key} style={{ gridColumn: "1 / -1" }}><BlockView m={it.m} onNav={onNav} /></div>)}
                  </div>
            )}
            {/* Tramo: anuncios después de los resultados */}
            <LiveSlot page="busqueda" from="bq_p" to={null} onNav={onNav} pad="14px 0 0" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CHATS MODAL — Split panel: lista izquierda + conversación derecha
// ═════════════════════════════════════════════════════════════════════════════
export function ChatsModal({ onClose, initial, orders = [], chatMsgs = {}, chatPeople = {}, onSend, user, blockedUsers = [], onToggleBlock, deletedConvs = [], onDeleteConv, flash }) {
  const { isMobile } = useR();
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const [menuOpen, setMenuOpen] = useState(false);
  const isBlocked = (key) => blockedUsers.some(b => b.key === String(key));

  const PALETTE = ["#E879F9", "#60A5FA", "#34D399", "#F59E0B", "#F87171", "#A78BFA", "#22D3EE", "#FB7185"];
  const colorFor = (s) => { let h = 0; const str = String(s || ""); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return PALETTE[h % PALETTE.length]; };
  const nameFor = (key, fallback) => chatPeople[String(key)] || fallback || "Vendedor";

  // Chat libre: una conversación por persona. Se arma desde los pedidos, desde el
  // historial de mensajes y desde la persona que se acaba de abrir (aunque no haya pedido).
  const convs = useMemo(() => {
    const map = new Map();
    (orders || []).forEach(o => {
      const key = String(o.sellerId || o.sellerName || "vendedor");
      if (!map.has(key)) map.set(key, { key, name: nameFor(key, o.sellerName), orders: [] });
      map.get(key).orders.push(o);
    });
    Object.keys(chatMsgs || {}).forEach(key => {
      if (!map.has(key)) map.set(key, { key, name: nameFor(key), orders: [] });
    });
    if (initial && (initial.otherId || initial.otherName)) {
      const key = String(initial.otherId || initial.otherName);
      if (!map.has(key)) map.set(key, { key, name: nameFor(key, initial.otherName), orders: [] });
    }
    return [...map.values()].map(c => {
      const hasActiveOrder = c.orders.some(o => (o.stepIdx || 0) < ((o.flow?.length || 1) - 1));
      const lastOrder = c.orders.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
      const msgs = chatMsgs[c.key] || [];
      const lastMsg = msgs.length ? msgs[msgs.length - 1].text : (lastOrder ? "Pedido: " + lastOrder.title : "Inicia la conversación");
      const lastAt = Math.max(lastOrder?.createdAt || 0, msgs.length ? msgs[msgs.length - 1].id : 0);
      return { ...c, hasActiveOrder, lastOrder, avatar: (c.name || "V").charAt(0).toUpperCase(), color: colorFor(c.key), lastMsg, lastAt };
    }).sort((a, b) => b.lastAt - a.lastAt).filter(c => !deletedConvs.includes(String(c.key)) && !blockedUsers.some(bl => bl.key === String(c.key)));
  }, [orders, chatMsgs, chatPeople, initial, deletedConvs, blockedUsers]);

  const findConv = (key, name) => convs.find(c => c.key === String(key) || c.name === name);

  const [selKey, setSelKey] = useState(() => {
    if (initial && (initial.otherId || initial.otherName)) {
      const m = findConv(initial.otherId, initial.otherName);
      if (m) return m.key;
    }
    return isMobile ? null : (convs[0]?.key || null);
  });
  const sel = selKey ? convs.find(c => c.key === selKey) : null;

  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const msgEnd = useRef(null);

  const convMsgs = sel ? (chatMsgs[sel.key] || []) : [];

  const send = () => {
    if (!input.trim() || !sel) return;
    onSend?.(sel.key, input.trim());
    setInput("");
    setTimeout(() => msgEnd.current?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  const showList  = !isMobile || !sel;
  const showChat  = !isMobile || !!sel;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: BG, display: "flex", flexDirection: "column" }}>
      {/* Header global */}
      <div style={{ background: isDark ? "#0a0a0a" : S, borderBottom: `1px solid ${B}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {(isMobile && sel)
          ? <button onClick={() => setSelKey(null)} className="p" style={{ background:"none",border:"none",display:"flex",padding:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
          : <button onClick={onClose} className="p" style={{ background:"none",border:"none",display:"flex",padding:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
        }
        <div style={{ flex: 1, display:"flex", alignItems:"center", gap:10 }}>
          {sel && isMobile
            ? <>
                <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${sel.color},${sel.color}88)`, display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#000",flexShrink:0 }}>{sel.avatar}</div>
                <div>
                  <p style={{ fontSize:15, fontWeight:800, color: T1 }}>{sel.name}</p>
                  <p style={{ fontSize: 10, color: sel.hasActiveOrder ? "#34D399" : T2 }}>{sel.hasActiveOrder ? "Pedido en curso" : "Disponible"}</p>
                </div>
              </>
            : <h2 style={{ fontSize:17, fontWeight:900, color: T1 }}>Mensajes</h2>
          }
        </div>
        {sel && (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setMenuOpen(o => !o)} className="p" style={{ background: "none", border: "none", display: "flex", padding: 4 }} aria-label="Opciones">
              <svg width="18" height="18" viewBox="0 0 24 24" fill={T2}><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                <div style={{ position: "absolute", top: 30, right: 0, zIndex: 11, background: isDark ? "#15151a" : "#fff", border: `1px solid ${B}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.25)", overflow: "hidden", minWidth: 190 }}>
                  <button onClick={() => { onToggleBlock && onToggleBlock(sel.key, sel.name); setMenuOpen(false); if (!isBlocked(sel.key)) { setSelKey(null); flash && flash("🚫 Usuario bloqueado"); } else flash && flash("Usuario desbloqueado"); }}
                    style={{ width: "100%", textAlign: "left", padding: "11px 14px", background: "none", border: "none", fontSize: 13, color: T1, cursor: "pointer", display: "flex", alignItems: "center", gap: 9 }}>
                    🚫 {isBlocked(sel.key) ? "Desbloquear usuario" : "Bloquear usuario"}
                  </button>
                  <div style={{ height: 1, background: B }} />
                  <button onClick={() => { onDeleteConv && onDeleteConv(sel.key); setMenuOpen(false); setSelKey(null); flash && flash("🗑️ Conversación eliminada"); }}
                    style={{ width: "100%", textAlign: "left", padding: "11px 14px", background: "none", border: "none", fontSize: 13, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: 9 }}>
                    🗑️ Eliminar conversación
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {!isMobile && <button onClick={onClose} className="p" style={{ background: isDark ? "#111" : CARD, border:`1px solid ${B}`, borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>}
      </div>

      {/* Body — split panel */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── Columna izquierda: lista de conversaciones ── */}
        {showList && (
          <div style={{ width: isMobile ? "100%" : 260, flexShrink:0, borderRight: isMobile ? "none" : `1px solid ${B}`, display:"flex", flexDirection:"column", background: isDark ? "#070707" : CARD }}>
            {/* Buscador */}
            <div style={{ padding:"12px 14px", borderBottom: `1px solid ${B}` }}>
              <div style={{ background: S, border:`1px solid ${B}`, borderRadius:50, padding:"8px 13px", display:"flex", alignItems:"center", gap:8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2"><circle cx="11" cy="11" r="6"/><line x1="15.5" y1="15.5" x2="20" y2="20" strokeLinecap="round"/></svg>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar conversación…"
                  style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:12, color:T1, fontFamily:"inherit" }} />
                {q && <button onClick={() => setQ("")} className="p" style={{ background:"none", border:"none", color:T3, display:"flex", padding:0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>}
              </div>
            </div>
            {/* Lista */}
            <div style={{ flex:1, overflowY:"auto" }}>
              {convs.length === 0 && (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 38, marginBottom: 12 }}>💬</div>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: T2, marginBottom: 5 }}>Sin conversaciones</p>
                  <p style={{ fontSize: 11, color: T3, lineHeight: 1.5 }}>Escríbele a un vendedor desde cualquier producto y la conversación aparecerá aquí.</p>
                </div>
              )}
              {convs.filter(c => c.name.toLowerCase().includes(q.trim().toLowerCase())).map(c => {
                const active = sel?.key === c.key;
                return (
                  <button key={c.key} onClick={() => setSelKey(c.key)} className="p"
                    style={{ width:"100%", background: active ? `${G}0d` : "none", border:"none", borderBottom:`1px solid ${B}`, padding:"12px 14px", display:"flex", alignItems:"center", gap:11, transition:"background 0.15s", cursor:"pointer" }}
                    onMouseEnter={e=>{ if(!active) e.currentTarget.style.background = isDark ? "#0f0f0f" : "#F5F4F0"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background = active ? `${G}0d` : "none"; }}>
                    {/* Avatar */}
                    <div style={{ position:"relative", flexShrink:0 }}>
                      <div style={{ width:42, height:42, borderRadius:"50%", background:`linear-gradient(135deg,${c.color},${c.color}70)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#000", border: active ? `2px solid ${G}` : "2px solid transparent", transition:"border 0.15s" }}>{c.avatar}</div>
                      {c.hasActiveOrder && <div style={{ position:"absolute", bottom:1, right:1, width:10, height:10, borderRadius:"50%", background:"#34D399", border:`2px solid ${isDark ? "#070707" : "#FFFFFF"}` }} />}
                    </div>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                        <p style={{ fontSize:13, fontWeight: c.hasActiveOrder ? 800 : 600, color: active ? G : T1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:130 }}>{c.name}</p>
                        {c.hasActiveOrder && <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399", flexShrink:0, background: "#34D39915", borderRadius: 50, padding: "2px 7px" }}>Pedido activo</span>}
                      </div>
                      <p style={{ fontSize:11.5, color: T3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.lastMsg}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Columna derecha: conversación ── */}
        {showChat && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", background: BG, overflow:"hidden" }}>
            {sel ? <>
              {/* Sub-header del chat (solo desktop) */}
              {!isMobile && (
                <div style={{ padding:"12px 18px", borderBottom:`1px solid ${B}`, display:"flex", alignItems:"center", gap:11, flexShrink:0 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${sel.color},${sel.color}77)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"#000" }}>{sel.avatar}</div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:800, color: T1 }}>{sel.name}</p>
                    <p style={{ fontSize: 10, color: sel.hasActiveOrder ? "#34D399" : T2 }}>{sel.hasActiveOrder ? "● Pedido en curso" : "● Disponible"}</p>
                  </div>
                </div>
              )}

              {/* Mensajes */}
              <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 8px", display:"flex", flexDirection:"column", gap:8 }}>
                {sel.lastOrder && (
                  <div style={{ alignSelf:"center", background: isDark ? "#0f0f0f" : CARD, border:`1px solid ${B}`, borderRadius:12, padding:"8px 13px", marginBottom:6, maxWidth:"92%", textAlign:"center" }}>
                    <p style={{ fontSize:9, color:T3, fontWeight:700, letterSpacing:.3 }}>PEDIDO VINCULADO</p>
                    <p style={{ fontSize:11.5, color:T1, fontWeight:700, marginTop:2 }}>{sel.lastOrder.title}{sel.lastOrder.qty>1?` ×${sel.lastOrder.qty}`:""}</p>
                    <p style={{ fontSize:10, color: sel.hasActiveOrder ? "#34D399" : T2, marginTop:1 }}>{sel.hasActiveOrder ? "En curso" : "Completado"}</p>
                  </div>
                )}
                {convMsgs.length === 0 && (
                  <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
                    <div style={{ width:56, height:56, borderRadius:"50%", background:`${sel.color}18`, border:`1px solid ${sel.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:900, color:sel.color }}>{sel.avatar}</div>
                    <p style={{ fontSize:13, fontWeight:700, color: T2 }}>Sé el primero en escribir</p>
                  </div>
                )}
                {convMsgs.map(m => (
                  <div key={m.id} style={{ display:"flex", justifyContent: m.me ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth:"72%", padding:"9px 13px", borderRadius: m.me ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: m.me ? `linear-gradient(135deg,${G},#c8a020)` : (isDark ? "#111" : CARD),
                      border: m.me ? "none" : `1px solid ${B}`,
                    }}>
                      <p style={{ fontSize:13.5, color: m.me ? "#000" : T1, fontWeight: m.me ? 600 : 400, lineHeight:1.45 }}>{m.text}</p>
                      <p style={{ fontSize: 9.5, color: m.me ? "#00000070" : T3, marginTop:4, textAlign:"right" }}>{m.time}</p>
                    </div>
                  </div>
                ))}
                <div ref={msgEnd} />
              </div>

              {/* Input — chat libre, siempre disponible */}
              <div style={{ borderTop:`1px solid ${B}`, flexShrink:0, background: isDark ? "#070707" : S }}>
                <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ flex:1, background: isDark ? "#111" : CARD, border:`1px solid ${B}`, borderRadius:50, padding:"9px 16px", display:"flex", alignItems:"center" }}>
                    <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); }}} placeholder="Escribe un mensaje…" style={{ flex:1, background:"none", border:"none", outline:"none", color: T1, fontSize:13.5 }} />
                  </div>
                  <button onClick={send} className="p" disabled={!input.trim()}
                    style={{ width:38, height:38, borderRadius:"50%", background: input.trim() ? G : (isDark ? "#111" : CARD), border: input.trim() ? "none" : `1px solid ${B}`, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.18s", flexShrink:0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim()?"#000":T3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </> : (
              /* Estado vacío en desktop */
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
                <div style={{ width:72, height:72, borderRadius:"50%", background: isDark ? "#0f0f0f" : CARD, border:`1px solid ${B}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ fontSize:15, fontWeight:700, color: T2, marginBottom:6 }}>Selecciona una conversación</p>
                  <p style={{ fontSize:12, color: T3 }}>Elige un chat de la lista para comenzar</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MARKET HOME
// ═════════════════════════════════════════════════════════════════════════════
/* ── CONEXIÓN EDITOR → PLATAFORMA ───────────────────────────────────────────────
   Lee los bloques del Editor Visual (localStorage) y los muestra en las pantallas
   reales RESPETANDO la posición: cada anuncio se renderiza en el tramo donde el
   usuario lo colocó, entre las partes fijas del sistema. Botones que navegan. */

export function MarketHome({ loading, products, filter, setFilter, search, setSearch, activeCat, setActiveCat, onCats, onProduct, user, favorites, onFav, notifCount, onNotif, onPublish, onPlusMenu, onOpenChats, onServices, onNav, hidden = false, scrollKeeper = null, view = "grid" }) {
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const { cats } = useCatalog();
  const { BG, S, B, CARD, T1, T2, T3, isDark, ts } = useAt();
  const { tokens: dt, mode: dMode } = useDensity();
  const plusBtnRef = useRef(null);
  const feedAds = useFeedAds("inicio"); // anuncios intercalados cada N productos
  // Conserva la posición del scroll del feed: se guarda al scrollear y se
  // restaura al volver (entrar a un producto y regresar no salta al inicio).
  const feedRef = useRef(null);
  useEffect(() => {
    if (feedRef.current && scrollKeeper && scrollKeeper.current > 0) feedRef.current.scrollTop = scrollKeeper.current;
  }, []);

  return (
    <div ref={feedRef} onScroll={e => { if (scrollKeeper) scrollKeeper.current = e.currentTarget.scrollTop; }} style={{ flex: 1, overflowY: "auto" }}>
      {/* Tramo: lo que pusiste ANTES del Encabezado (arriba del todo) */}
      <LiveSlot page="inicio" from={null} to="in_h" onNav={onNav} pad="12px 16px 0" />
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 52, background: isDark ? "rgba(8,8,8,.78)" : "rgba(255,255,255,.8)", backdropFilter: "blur(14px) saturate(1.4)", WebkitBackdropFilter: "blur(14px) saturate(1.4)", borderBottom: "none", padding: isDesktop ? "8px 36px" : "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, transform: hidden ? "translateY(-115%)" : "translateY(0)", transition: "transform .28s cubic-bezier(.4,0,.2,1)", willChange: "transform" }}>
        {!isDesktop && <Logo size={19} />}
        {isDesktop && (
          <div style={{ flex: 1, maxWidth: 520 }}>
            <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 50, padding: "9px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Ic n="search" c={T3} s={16} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en RETADOR..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: T1, fontSize: 12, fontWeight: 500 }} />
              {search && <button onClick={() => setSearch("")} className="p" style={{ background: isDark ? "#232323" : B, border: "none", color: T2, width: 20, height: 20, borderRadius: "50%", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 7, alignItems: "center", marginLeft: "auto" }}>
          {!user && <div style={{ background: "#F8717112", border: "1px solid #F8717122", borderRadius: 100, padding: "4px 10px", fontSize: 9, fontWeight: 700, color: "#F87171" }}>Invitado</div>}

          {/* Botón + — abre dropdown en App root */}
          <div style={{ position: "relative" }}>
            <button
              ref={plusBtnRef}
              onClick={() => {
                const r = plusBtnRef.current.getBoundingClientRect();
                onPlusMenu({ top: r.bottom + 8, right: window.innerWidth - r.right });
              }}
              className="p"
              style={{ width: 29, height: 29, background: isDark ? "#0d0d0d" : CARD, border: `1px solid ${isDark ? "#B8860B66" : "#D4A82066"}`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#D4A820" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          {/* Botón Notificaciones */}
          <button onClick={onNotif} className="p" style={{ position: "relative", width: 29, height: 29, background: isDark ? "#0d0d0d" : CARD, border: `1px solid ${isDark ? "#B8860B66" : "#D4A82066"}`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A820" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifCount > 0 && (
              <div style={{ position: "absolute", top: -3, right: -3, minWidth: 15, height: 15, borderRadius: 100, background: "#D4A820", border: `1.5px solid ${BG}`, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", fontSize: 7.5, fontWeight: 800, color: "#000" }}>
                {notifCount > 9 ? "9+" : notifCount}
              </div>
            )}
          </button>

          {/* Botón Mensajes */}
          <button onClick={() => onOpenChats?.()} className="p" style={{ position: "relative", width: 29, height: 29, background: isDark ? "#0d0d0d" : CARD, border: `1px solid ${isDark ? "#B8860B66" : "#D4A82066"}`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A820" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>


      {/* Hueco SUPERIOR (entre Encabezado y Filtros): banners de inicio en ese hueco
          + páginas Banners/Promociones. Config global, en vivo. El CTA navega. */}
      <MarketBanners onNav={onNav} />

      {/* Filtros - Ahora con sticky */}
      <div style={{ position: "sticky", top: hidden ? 0 : 45, zIndex: 50, background: isDark ? BG : "#fff", borderBottom: "none", padding: "12px clamp(18px,3vw,48px)", display: "flex", gap: 7, overflowX: "auto", transition: "top .28s cubic-bezier(.4,0,.2,1)" }}>
        {[["TODOS", "🏷️", "Todos"], ["OFERTAS", "🔥", "Ofertas"], ["NUEVO", "✨", "Nuevo"], ["RECOMENDADO", "⭐", "Destacado"], ["MAS_VENDIDO", "🏆", "Más vendido"]].map(([f, ic, lbl]) => (
          <button key={f} onClick={() => setFilter(f)} className={`chip ${isDark ? "" : "chip-light"}`} style={{ flexShrink: 0, background: filter === f ? G : isDark ? "#0e0e0e" : S, color: filter === f ? "#000" : T3, border: `1.5px solid ${filter === f ? G : B}`, borderRadius: 999, padding: "7px 13px", fontSize: 10 * ts, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{ic} {lbl}</button>
        ))}
        {/* Entrada a SERVICIOS (mundo aparte) */}
        {onServices && <button onClick={onServices} className={`chip ${isDark ? "" : "chip-light"}`} style={{ flexShrink: 0, background: isDark ? "#0e0e0e" : S, color: G, border: `1.5px solid ${G}55`, borderRadius: 999, padding: "7px 13px", fontSize: 10 * ts, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>🛠️ Servicios</button>}
      </div>

      {/* Tramo: lo que pusiste entre los Filtros y la Zona de productos */}
      <LiveSlot page="inicio" from="in_f" to="in_p" onNav={onNav} pad="12px 16px 0" />

      {/* Grid de productos */}
      <div style={{ padding: "0 18px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 17 * ts, fontWeight: 800, color: T1 }}>
              {activeCat ? cats.find(c => c.id === activeCat)?.name : "Todos los productos"}
            </h2>
            <p style={{ color: T2, fontSize: 11 * ts, marginTop: 2 }}>{products.length} disponibles · ordenados por relevancia</p>
          </div>
          {activeCat && <button className="p" onClick={() => setActiveCat(null)} style={{ fontSize: 10, color: G, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Limpiar ×</button>}
        </div>
        {loading
          ? <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}><Spin size={28} /></div>
          : products.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: "#232323" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{filter === "FAVORITOS" ? "❤️" : "🔍"}</div>
                <p style={{ fontSize: 12 }}>{filter === "FAVORITOS" ? "Aún no tienes favoritos" : "No se encontraron productos"}</p>
              </div>
            : view === "muro"
              ? <div style={{ columnCount: densityCols(dMode, isDesktop, isTablet), columnGap: dt.grid.gap }}>
                  {feedRows(products, feedAds).map(it => it.t === "p"
                    ? <PCard key={it.p.id} p={it.p} view="muro" onClick={() => onProduct(it.p)} isFav={favorites.has(it.p.id)} onFav={onFav} />
                    : <div key={it.key} style={{ breakInside: "avoid", columnSpan: "all", margin: "6px 0" }}><BlockView m={it.m} onNav={onNav} /></div>)}
                </div>
              : <div className="dx" style={{ display: "grid", gridTemplateColumns: `repeat(${densityCols(dMode, isDesktop, isTablet)}, 1fr)`, gap: dt.grid.gap }}>
                  {feedRows(products, feedAds).map(it => it.t === "p"
                    ? <PCard key={it.p.id} p={it.p} view="grid" onClick={() => onProduct(it.p)} isFav={favorites.has(it.p.id)} onFav={onFav} />
                    : <div key={it.key} style={{ gridColumn: "1 / -1" }}><BlockView m={it.m} onNav={onNav} /></div>)}
                </div>
        }
      </div>

      {/* Tramo: lo que pusiste después de los Productos */}
      <LiveSlot page="inicio" from="in_p" to={null} onNav={onNav} pad="4px 16px 80px" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT CARD
// ═════════════════════════════════════════════════════════════════════════════
// Bandera/emoji de origen a partir del país (si existe). Sin país → nada.
const ORIGIN_FLAG = { cuba: "🇨🇺", "estados unidos": "🇺🇸", usa: "🇺🇸", eeuu: "🇺🇸", "españa": "🇪🇸", espana: "🇪🇸", china: "🇨🇳", méxico: "🇲🇽", mexico: "🇲🇽", panamá: "🇵🇦", panama: "🇵🇦", colombia: "🇨🇴", rusia: "🇷🇺" };
const flagOf = (o) => { if (!o) return null; const k = String(o).trim().toLowerCase(); return ORIGIN_FLAG[k] || (k.length ? "🌍" : null); };

// TARJETA DE PRODUCTO estilo AliExpress con la identidad RETADOR (dorado/gris/negro).
// view: "grid" (foto cuadrada, alturas parejas) | "muro" (foto en su proporción real).
// SIN nombre ni ubicación del vendedor (privacidad): eso vive en el detalle.
function PCard({ p, onClick, isFav, onFav, view = "grid", verified = false }) {
  const { S, B, T1, T2, T3, ts } = useAt();
  const img = p.img || p.image || (p.images && p.images[0]) || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400";
  const hasDisc = p.orig_price && parseFloat(p.orig_price) > parseFloat(p.price || 0);
  const disc = hasDisc ? Math.round((1 - parseFloat(p.price) / parseFloat(p.orig_price)) * 100) : 0;
  const rating = Number(p.rating) || 0;
  const reviews = Number(p.reviews ?? p.reviews_count ?? p.rating_count) || 0;
  const sold = Number(p.sold_count ?? p.soldCount) || 0;
  const stock = (p.stock ?? p.qty_available);
  const lowStock = stock != null && Number(stock) > 0 && Number(stock) <= 5;
  const flag = flagOf(p.origin || p.country);
  const isVerified = verified || p.seller_verified || p.verified;
  const isPromo = !!(p.promoted || p.featured);
  const isOffer = !!(p.on_sale || p.oferta || p.promo);

  // ── Línea de métricas: "[X] vendidos  ·  ⭐ rating (reviews)" — cada parte
  //    solo si existe; si no hay ni ventas ni rating, muestra "Nuevo".
  const metricParts = [];
  if (sold > 0) metricParts.push(`${sold} vendido${sold === 1 ? "" : "s"}`);
  if (rating > 0) metricParts.push(`⭐ ${rating.toFixed(1)}${reviews > 0 ? ` (${reviews})` : ""}`);
  const metricsText = metricParts.length ? metricParts.join("  ·  ") : "Nuevo";

  // ── Chips (solo los que apliquen). La fila se omite entera si no hay ninguno.
  const chips = [];
  if (disc > 0) chips.push({ k: "disc", t: `-${disc}%`, bg: "#ef4444", fg: "#fff", bd: "transparent" });
  else if (isOffer) chips.push({ k: "offer", t: "Oferta", bg: "rgba(239,68,68,.14)", fg: "#ef4444", bd: "transparent" });
  if (isPromo) chips.push({ k: "promo", t: "Destacado", bg: G, fg: "#000", bd: "transparent" });
  if (isVerified) chips.push({ k: "ver", t: "✓ Verificado", bg: "transparent", fg: G, bd: G });
  if (lowStock) chips.push({ k: "stock", t: `¡Últimas ${Number(stock)}!`, bg: "rgba(255,192,30,.12)", fg: G, bd: "transparent" });

  return (
    <div className="cd" onClick={onClick} style={{ background: S, borderRadius: 16, overflow: "hidden", border: `1px solid ${B}`, breakInside: "avoid", marginBottom: view === "muro" ? 12 : 0 }}>
      <div style={{ position: "relative", ...(view === "muro" ? {} : { aspectRatio: "1 / 1" }), background: "#161616", overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
        <img src={img} alt={p.title}
          style={{ width: "100%", ...(view === "muro" ? { height: "auto", display: "block" } : { height: "100%", objectFit: "cover" }), transition: "transform .3s" }}
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"; }} />
        {flag && <div style={{ position: "absolute", bottom: 7, left: 7, fontSize: 14, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))" }}>{flag}</div>}
        <button className="p" onClick={e => { e.stopPropagation(); onFav(p.id); }} style={{ position: "absolute", top: 6, right: 6, width: 27, height: 27, background: "rgba(0,0,0,.55)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={isFav ? G : "none"} stroke={isFav ? G : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
      </div>
      {/* Info bajo la foto: apilada, alineada a la IZQUIERDA, jerarquía + aire.
          Orden AliExpress: título → métricas → chips → PRECIO (lo más pesado, abajo).
          Cada dato solo si existe → alturas naturales distintas por tarjeta. */}
      <div style={{ padding: "10px 11px 12px", display: "flex", flexDirection: "column", gap: 6 * ts, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11.5 * ts, fontWeight: 600, color: T1, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: view === "muro" ? undefined : `${2 * 1.35 * 11.5 * ts}px` }}>{p.title}</p>
        <div style={{ fontSize: 9.5 * ts, color: T2, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{metricsText}</div>
        {chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 * ts }}>
            {chips.map(c => (
              <span key={c.k} style={{ fontSize: 8.5 * ts, fontWeight: 800, lineHeight: 1.4, padding: "1.5px 6px", borderRadius: 999, background: c.bg, color: c.fg, border: c.bd === "transparent" ? "none" : `1px solid ${c.bd}`, whiteSpace: "nowrap" }}>{c.t}</span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap", marginTop: 1 }}>
          <span style={{ fontSize: 17 * ts, fontWeight: 900, color: G, lineHeight: 1.1 }}>{money(p.price, p.currency)}</span>
          {hasDisc && <span style={{ fontSize: 10 * ts, color: T3, textDecoration: "line-through" }}>{(CURRENCIES[p.currency || "USD"] || CURRENCIES.USD).symbol}{parseFloat(p.orig_price).toLocaleString("es-ES")}</span>}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT DETAIL — carga nombre + trust stats del vendedor
// ═════════════════════════════════════════════════════════════════════════════
export function EditProductModal({ product, onClose, onSave, flash, onPromote }) {
  const { T1, T2, T3, B, CARD, BG, isDark, S } = useAt();
  // ⭐ Destacar desde editar: solo si el admin tiene la función encendida y el
  // producto aún no está destacado. (La confirmación con tarifa la maneja App.)
  const pCfg = usePlatformCfg();
  const canPromote = pCfg.promoActive === true && !product.promoted && product.kind !== "service" && !!onPromote;
  const [title, setTitle] = useState(product.title || "");
  const [price, setPrice] = useState(product.price ?? "");
  const [desc, setDesc]   = useState(product.description || "");
  const initImgs = (product.images && product.images.length) ? product.images : (product.image ? [product.image] : []);
  const [imgs, setImgs]   = useState(initImgs);
  const cats = (() => { try { return JSON.parse(localStorage.getItem("retador_cats") || "[]"); } catch { return []; } })();
  const subs = (() => { try { return JSON.parse(localStorage.getItem("retador_subcats") || "{}"); } catch { return {}; } })();
  const catObj = cats.find(c => c.id === product.cat);
  const [catLabel, setCatLabel] = useState(catObj ? (product.subcat ? `${catObj.name} / ${product.subcat}` : catObj.name) : "");
  const options = []; cats.forEach(c => { const sc = subs[c.id] || []; if (sc.length) sc.forEach(s => options.push(`${c.name} / ${s}`)); else options.push(c.name); });
  const addImgs = (files) => { Array.from(files || []).slice(0, 8).forEach(f => { const r = new FileReader(); r.onload = () => setImgs(prev => prev.length >= 8 ? prev : [...prev, r.result]); r.readAsDataURL(f); }); };
  // FORMAS DE ENTREGA — mismas opciones que al publicar, precargadas con lo que
  // el producto ya tiene (ship_modes + recogida + precio de envío intl).
  const [shipModes, setShipModes] = useState(() => ({ local: false, persona: false, intl: false, ...(product.shipModes || product.ship_modes || { local: true }) }));
  const toggleMode = (k) => setShipModes(m => ({ ...m, [k]: !m[k] }));
  const [pickupAddress, setPickupAddress] = useState(product.pickupAddress || product.pickup_address || "");
  const [pickupPhone, setPickupPhone] = useState(product.pickupPhone || product.pickup_phone || "");
  const [shipPrice, setShipPrice] = useState(product.shippingPrice ?? product.ship_price ?? "");
  const [location, setLocation] = useState(product.location || "");
  const isService = product.kind === "service";   // el kind NO se puede cambiar al editar
  const save = () => {
    if (!title.trim()) { flash && flash("Ponle un título"); return; }
    if (!isService && !shipModes.local && !shipModes.persona && !shipModes.intl) { flash && flash("⚠️ Marca al menos una forma de entrega"); return; }
    if (!isService && shipModes.intl && !Number(shipPrice)) { flash && flash("⚠️ Define el precio del envío internacional"); return; }
    const parts = catLabel.split("/").map(s => s.trim());
    const found = cats.find(c => (c.name || "").toLowerCase() === (parts[0] || "").toLowerCase());
    onSave({
      title: title.trim(), price: Number(price) || 0, description: desc,
      cat: found ? found.id : product.cat, subcat: parts[1] || undefined,
      image: imgs[0] || product.image, images: imgs,
      location,
      ...(isService ? {} : { shipModes, shippingPrice: Number(shipPrice) || 0, pickupAddress, pickupPhone }),
    });
    flash && flash(isService ? "✅ Servicio actualizado" : "✅ Producto actualizado");
  };
  const lbl = { fontSize: 11, fontWeight: 700, color: T2, marginBottom: 5, display: "block" };
  const inp = { width: "100%", background: isDark ? "#1a1a1a" : "#f5f5f7", color: T1, border: `1px solid ${B}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 5200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "18px 16px 28px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: T1 }}>{isService ? "Editar servicio" : "Editar producto"}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: G, background: `${G}18`, border: `1px solid ${G}40`, borderRadius: 999, padding: "2px 8px" }}>{isService ? "🛠️ Servicio" : "📦 Producto"}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T2, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <label style={lbl}>Imágenes</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {imgs.map((src, i) => (
            <div key={i} style={{ position: "relative", width: 76, height: 76, borderRadius: 10, overflow: "hidden", border: `1px solid ${B}` }}>
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => setImgs(prev => prev.filter((_, j) => j !== i))} style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.7)", color: "#fff", fontSize: 12, cursor: "pointer", lineHeight: 1 }}>×</button>
              {i === 0 && <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 8, textAlign: "center", padding: "1px 0" }}>Principal</span>}
            </div>
          ))}
          {imgs.length < 8 && (
            <label style={{ width: 76, height: 76, borderRadius: 10, border: `1.5px dashed ${B}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer", color: T2, fontSize: 10 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>Foto
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => addImgs(e.target.files)} />
            </label>
          )}
        </div>

        <label style={lbl}>Título</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{ ...inp, marginBottom: 13 }} />
        <label style={lbl}>Precio</label>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inp, marginBottom: 13 }} />
        <label style={lbl}>Categoría</label>
        <select value={catLabel} onChange={e => setCatLabel(e.target.value)} style={{ ...inp, marginBottom: 13 }}>
          <option value="">Selecciona…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <label style={lbl}>Descripción</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} style={{ ...inp, resize: "none", marginBottom: 18 }} />

        {/* Zona (servicio): dónde ofrece el servicio */}
        {isService && (
          <div style={{ marginBottom: 8 }}>
            <label style={lbl}>Zona donde ofreces el servicio</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ej: La Habana (o «toda Cuba», «en línea»…)" style={inp} />
          </div>
        )}

        {/* FORMAS DE ENTREGA (combinables) — solo productos */}
        {!isService && <>
        <label style={lbl}>Formas de entrega</label>
        {[
          { k: "local",   ic: "🛵", t: "Delivery local",       d: "Un mensajero lo recoge y lo entrega" },
          { k: "persona", ic: "🤝", t: "Entrega en persona",   d: "Coordinan el encuentro por el chat" },
          { k: "intl",    ic: "✈️", t: "Envío internacional",  d: "Con transportista, precio de envío aparte" },
        ].map(m => (
          <div key={m.k} onClick={() => toggleMode(m.k)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, border: `1.5px solid ${shipModes[m.k] ? G : B}`, background: shipModes[m.k] ? (isDark ? "#1a160a" : "#fdf6e3") : "transparent", marginBottom: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>{m.ic}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: T1 }}>{m.t}</p>
              <p style={{ fontSize: 10, color: T3 }}>{m.d}</p>
            </div>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${shipModes[m.k] ? G : B}`, background: shipModes[m.k] ? G : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{shipModes[m.k] ? "✓" : ""}</div>
          </div>
        ))}
        {shipModes.local && (
          <div style={{ marginTop: 4, marginBottom: 8 }}>
            <label style={lbl}>Dirección de recogida (para el mensajero)</label>
            <input value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} placeholder="Calle, número, entre calles, municipio" style={{ ...inp, marginBottom: 8 }} />
            <input value={pickupPhone} onChange={e => setPickupPhone(e.target.value)} placeholder="Teléfono de contacto para la recogida" style={inp} />
          </div>
        )}
        {(shipModes.local || shipModes.persona) && (
          <div style={{ marginTop: 4, marginBottom: 8 }}>
            <label style={lbl}>Ubicación / zona</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ej: Vedado, La Habana" style={inp} />
          </div>
        )}
        {shipModes.intl && (
          <div style={{ marginTop: 4, marginBottom: 8 }}>
            <label style={lbl}>Precio del envío internacional</label>
            <input type="number" value={shipPrice} onChange={e => setShipPrice(e.target.value)} placeholder="Precio del envío" style={inp} />
          </div>
        )}
        </>}

        {canPromote && (
          <button onClick={onPromote} style={{ width: "100%", height: 44, borderRadius: 12, border: `1.5px solid ${G}`, background: `${G}12`, color: G, fontSize: 13.5, fontWeight: 800, cursor: "pointer", marginTop: 12 }}>
            ⭐ Destacar este producto · {Number(pCfg.promoCost) || 0} CUP
          </button>
        )}
        {product.promoted && <div style={{ marginTop: 12, textAlign: "center", fontSize: 11.5, fontWeight: 700, color: G }}>⭐ Este producto ya está destacado</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={onClose} style={{ flex: 1, height: 46, borderRadius: 12, border: `1px solid ${B}`, background: "transparent", color: T1, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: G, color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

const CAROUSEL_FALLBACK = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800";

// Carrusel controlado por índice (no depende del scroll nativo, que fallaba en
// algunos teléfonos). Se desliza con el dedo izq/der en círculo. Un TOQUE simple
// (sin arrastrar) llama a onOpen para abrir el visor a pantalla completa. Los
// puntos van SOBRE la foto. El índice lo controla el padre (para las miniaturas).
function ImageCarousel({ images = [], index = 0, setIndex, onOpen }) {
  const list = (images && images.length) ? images : [null];
  const n = list.length;
  const t = useRef({ x0: 0, dx: 0, moved: false, active: false });
  const go = (to) => setIndex && setIndex((to + n) % n);
  const onStart = (e) => { const p = e.touches[0]; t.current = { x0: p.clientX, dx: 0, moved: false, active: true }; };
  const onMove = (e) => { if (!t.current.active) return; t.current.dx = e.touches[0].clientX - t.current.x0; if (Math.abs(t.current.dx) > 10) t.current.moved = true; };
  const onEnd = () => {
    const { dx, moved, active } = t.current;
    t.current.active = false;
    if (!active) return;
    if (!moved) { onOpen && onOpen(); return; }           // toque simple → visor
    if (dx <= -40) go(index + 1);
    else if (dx >= 40) go(index - 1);
  };
  return (
    <div
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      onClick={() => { if (typeof window !== "undefined" && !("ontouchstart" in window)) onOpen && onOpen(); }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden", touchAction: "pan-y", cursor: "pointer" }}>
      <div style={{ display: "flex", height: "100%", width: `${n * 100}%`, transform: `translateX(-${index * (100 / n)}%)`, transition: "transform .28s ease" }}>
        {list.map((src, idx) => (
          <img key={idx} src={src || CAROUSEL_FALLBACK} alt="" draggable={false}
            onError={(e) => { e.target.src = CAROUSEL_FALLBACK; }}
            style={{ width: `${100 / n}%`, height: "100%", objectFit: "cover", flexShrink: 0, background: "#161616", pointerEvents: "none" }} />
        ))}
      </div>
      {n > 1 && (
        <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, pointerEvents: "none" }}>
          {list.map((_, idx) => (
            <span key={idx} style={{ height: 6, width: idx === index ? 18 : 6, borderRadius: 999, background: idx === index ? "#fff" : "rgba(255,255,255,.5)", transition: "all .2s", boxShadow: "0 0 4px rgba(0,0,0,.4)" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// Visor a pantalla completa (solo producto): fondo negro, solo las imágenes.
// Deslizar entre fotos, doble toque para acercar y PELLIZCAR (dos dedos) para
// zoom; con zoom se puede arrastrar para mover. Botón atrás normalito arriba.
function ProductImageViewer({ images = [], index = 0, setIndex, onClose }) {
  const list = (images && images.length) ? images : [null];
  const n = list.length;
  const [z, setZ] = useState({ scale: 1, tx: 0, ty: 0 });
  const g = useRef({ mode: null, x0: 0, y0: 0, dx: 0, moved: false, startDist: 1, startScale: 1, startTx: 0, startTy: 0, lastTap: 0 });
  const reset = () => setZ({ scale: 1, tx: 0, ty: 0 });
  const go = (to) => { reset(); setIndex && setIndex((to + n) % n); };
  const dist = (tt) => Math.hypot(tt[0].clientX - tt[1].clientX, tt[0].clientY - tt[1].clientY);
  const onStart = (e) => {
    if (e.touches.length === 2) {
      g.current.mode = "pinch"; g.current.startDist = dist(e.touches) || 1; g.current.startScale = z.scale;
    } else {
      const p = e.touches[0];
      g.current = { ...g.current, mode: "pan", x0: p.clientX, y0: p.clientY, dx: 0, moved: false, startTx: z.tx, startTy: z.ty };
    }
  };
  const onMove = (e) => {
    if (g.current.mode === "pinch" && e.touches.length === 2) {
      const s = Math.min(4, Math.max(1, g.current.startScale * (dist(e.touches) / g.current.startDist)));
      setZ((prev) => ({ ...prev, scale: s }));
    } else if (g.current.mode === "pan") {
      const p = e.touches[0];
      g.current.dx = p.clientX - g.current.x0;
      const dy = p.clientY - g.current.y0;
      if (Math.abs(g.current.dx) > 8 || Math.abs(dy) > 8) g.current.moved = true;
      if (z.scale > 1) setZ((prev) => ({ ...prev, tx: g.current.startTx + g.current.dx, ty: g.current.startTy + dy }));
    }
  };
  const onEnd = () => {
    const mode = g.current.mode; g.current.mode = null;
    if (mode === "pinch") { if (z.scale <= 1.05) reset(); return; }
    if (!g.current.moved) {                               // toque simple → doble toque ALTERNA zoom
      const now = Date.now();
      if (now - g.current.lastTap < 300) {
        g.current.lastTap = 0;
        setZ((prev) => (prev.scale > 1 ? { scale: 1, tx: 0, ty: 0 } : { scale: 2.4, tx: 0, ty: 0 }));
      } else { g.current.lastTap = now; }
      return;
    }
    if (z.scale > 1) return;                              // con zoom, arrastrar mueve la foto (no cambia)
    if (g.current.dx <= -50) go(index + 1);
    else if (g.current.dx >= 50) go(index - 1);
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "#000", overflow: "hidden", touchAction: "none" }}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
      <img src={list[index] || CAROUSEL_FALLBACK} alt="" draggable={false}
        onError={(e) => { e.target.src = CAROUSEL_FALLBACK; }}
        style={{ position: "absolute", inset: 0, margin: "auto", maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
          transform: `translate(${z.tx}px, ${z.ty}px) scale(${z.scale})`, transition: g.current.mode ? "none" : "transform .2s ease", pointerEvents: "none", userSelect: "none" }} />
      <button onClick={onClose} aria-label="Cerrar" style={{ position: "absolute", top: "calc(env(safe-area-inset-top, 0px) / var(--img-s, 1) + 12px)", left: 14, width: 42, height: 42, borderRadius: 12, background: "rgba(20,20,22,.62)", WebkitBackdropFilter: "blur(14px)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, cursor: "pointer" }}>
        <Ic n="back" c="#fff" s={20} />
      </button>
      {n > 1 && (
        <div style={{ position: "absolute", bottom: "calc(env(safe-area-inset-bottom, 0px) / var(--img-s, 1) + 18px)", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, pointerEvents: "none" }}>
          {list.map((_, idx) => (
            <span key={idx} style={{ height: 7, width: idx === index ? 20 : 7, borderRadius: 999, background: idx === index ? "#fff" : "rgba(255,255,255,.45)", transition: "all .2s" }} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail({ product: p, onBack, onDelivery, onChat, onViewProfile, onBuy, onFav, isFav, flash, requireAuth, user, canChat, onDelete, onEdit }) {
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const { S, B, T1, T2, T3, isDark, ts } = useAt();
  const { cats } = useCatalog();
  const [sellerName,  setSellerName]  = useState(null);
  const [trustStats,  setTrustStats]  = useState(null);
  const bc   = BC[p.badge] || {};
  const cat  = cats.find(c => c.id === p.cat);
  const disc = p.orig_price ? Math.round((1 - parseFloat(p.price) / parseFloat(p.orig_price)) * 100) : 0;
  const scrollRef = useRef(null);
  const scrollDir = useScrollDir(scrollRef);
  const backHidden = scrollDir === "down";
  // Fotos del producto (todas), índice actual y visor a pantalla completa.
  const imgs = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : (p.img ? [p.img] : []));
  const [imgIdx, setImgIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  useEffect(() => { setImgIdx(0); setViewerOpen(false); }, [p.id]);
  // Mientras el visor esté abierto, el botón ATRÁS del teléfono lo cierra primero.
  useEffect(() => {
    if (!viewerOpen) return;
    return pushBackHandler(() => setViewerOpen(false));
  }, [viewerOpen]);

  useEffect(() => {
    if (!p.seller_id) { setSellerName("Vendedor"); return; }
    getUserName(p.seller_id).then(setSellerName);
    getUserTrustStats(p.seller_id).then(setTrustStats).catch(() => {});
    // Track view
    if (user?.id) trackEvent(user.id, p.id, "view").catch(() => {});
  }, [p.seller_id]);

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", position: "relative" }}>
      {/* Botón volver — sticky, SIEMPRE visible (no depende de position:fixed) */}
      <div style={{ position: "sticky", top: 0, zIndex: 600, height: 0, overflow: "visible" }}>
        <button onClick={onBack} aria-label="Volver" style={{ position: "absolute", top: 12, left: 12, width: 40, height: 40, borderRadius: 12, background: "rgba(15,15,16,.62)", WebkitBackdropFilter: "blur(16px)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.22)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.35)" }}>
          <Ic n="back" c="#fff" s={18} />
        </button>
        {(onEdit || onDelete) && (
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
            {onEdit && (
              <button onClick={onEdit} aria-label="Editar" style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(15,15,16,.55)", WebkitBackdropFilter: "blur(16px)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.28)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
                <Edit2 size={16} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} aria-label="Eliminar" style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239,68,68,.14)", WebkitBackdropFilter: "blur(16px)", backdropFilter: "blur(16px)", border: "1px solid rgba(239,68,68,.55)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
      {/* Imagen hero — carrusel deslizable entre todas las fotos del producto */}
      <div style={{ position: "relative", aspectRatio: "1 / 1", background: "#161616", overflow: "hidden" }}>
        <ImageCarousel images={imgs} index={imgIdx} setIndex={setImgIdx} onOpen={() => setViewerOpen(true)} />
        {/* pointerEvents:none → deja pasar el dedo al carrusel (antes lo bloqueaba) */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to bottom,rgba(0,0,0,.5) 0%,transparent 35%,rgba(0,0,0,.72) 100%)" }} />
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }}>
          <button className="p" onClick={() => requireAuth(() => onFav(p.id))} style={{ width: 31, height: 31, background: "rgba(0,0,0,.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? "#F87171" : "none"} stroke={isFav ? "#F87171" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        {p.badge && <div style={{ position: "absolute", bottom: 14, left: 14, pointerEvents: "none", background: bc.bg, borderRadius: 100, padding: "5px 13px", fontSize: 9, fontWeight: 700, color: bc.tx }}>{p.badge}</div>}
      </div>

      {/* Miniaturas: una por foto; tocar una salta a esa. Van pegadas al borde de
          la foto, justo antes de la categoría. Solo si hay 2 o más fotos. */}
      {imgs.length > 1 && (
        <div style={{ display: "flex", gap: 8, padding: "10px 16px 0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {imgs.map((src, idx) => (
            <button key={idx} onClick={() => setImgIdx(idx)} aria-label={`Foto ${idx + 1}`}
              style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 10, overflow: "hidden", padding: 0, cursor: "pointer", background: "#161616", border: idx === imgIdx ? `2px solid ${G}` : `1px solid ${B}`, opacity: idx === imgIdx ? 1 : 0.72, transition: "opacity .2s, border-color .2s" }}>
              <img src={src || CAROUSEL_FALLBACK} alt="" onError={(e) => { e.target.src = CAROUSEL_FALLBACK; }} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>
      )}

      {viewerOpen && <ProductImageViewer images={imgs} index={imgIdx} setIndex={setImgIdx} onClose={() => setViewerOpen(false)} />}

      <div style={{ padding: "16px 18px 10px" }}>
        {cat && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cat.color + "10", border: `1px solid ${cat.color}25`, borderRadius: 100, padding: "4px 11px", fontSize: 9, fontWeight: 700, color: cat.color, marginBottom: 10 }}>
            <CatIcon id={cat.id} color={cat.color} size={11} /> {cat.name}
          </div>
        )}
        <h1 style={{ fontSize: 19 * ts, fontWeight: 800, lineHeight: 1.2, marginBottom: 10, color: T1 }}>{p.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 21 * ts, fontWeight: 900, color: G }}>{money(p.price, p.currency)}</span>
          {p.orig_price && <>
            <span style={{ fontSize: 13 * ts, color: T2, textDecoration: "line-through" }}>{(CURRENCIES[p.currency || "USD"] || CURRENCIES.USD).symbol}{parseFloat(p.orig_price).toLocaleString("es-ES")}</span>
            <span style={{ background: "#16A34A1a", borderRadius: 100, padding: "3px 9px", fontSize: 10 * ts, fontWeight: 700, color: "#22C55E" }}>-{disc}%</span>
          </>}
        </div>

        {p.description && (
          <>
            <p style={{ fontSize: 10 * ts, fontWeight: 700, color: T3, marginBottom: 5, letterSpacing: .5, textTransform: "uppercase" }}>Descripción</p>
            <p style={{ fontSize: 12 * ts, color: T2, lineHeight: 1.65, marginBottom: 16 }}>{p.description}</p>
          </>
        )}

        {/* Vendedor con trust stats */}
        <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: "13px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AvatarUser userId={p.seller_id} name={sellerName || p.seller_name} size={33} />
            <div style={{ flex: 1 }}>
              {sellerName === null
                ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Spin size={13} /><span style={{ fontSize: 11, color: "#3e3e3e" }}>Cargando...</span></div>
                : <p style={{ fontSize: 12, fontWeight: 700 }}>{sellerName}</p>
              }
              {trustStats && (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 8, color: "#22C55E" }}>✅ {trustStats.verified_sales || 0} ventas</span>
                  <span style={{ fontSize: 10, color: "#484848" }}>⭐ {((trustStats.success_rate || 0)).toFixed(0)}% éxito</span>
                </div>
              )}
            </div>
            {p.seller_id && sellerName && (
              <button className="p" onClick={() => onViewProfile(p.seller_id || p.seller_name)} style={{ background: `${G}16`, border: `1px solid ${G}28`, borderRadius: 50, padding: "6px 12px", fontSize: 10, fontWeight: 700, color: G }}>Perfil</button>
            )}
          </div>
        </div>

        {/* Formas de entrega que ofrece el vendedor (definidas al publicar) */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: T2, marginBottom: 7, letterSpacing: .3 }}>FORMAS DE ENTREGA</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {(() => {
              const sm = p.shipModes || { local: true };
              const META = { local: ["🛵", "Delivery local"], intl: ["✈️", "Envío internacional"], persona: ["🤝", "Entrega en persona"] };
              const avail = ["local", "intl", "persona"].filter(k => sm[k]);
              return avail.length ? avail.map(k => (
                <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${G}10`, border: `1px solid ${G}28`, borderRadius: 50, padding: "6px 11px", fontSize: 10, fontWeight: 700, color: G }}>
                  <span style={{ fontSize: 12 }}>{META[k][0]}</span>{META[k][1]}
                </span>
              )) : <span style={{ fontSize: 10, color: T2 }}>El vendedor coordinará la entrega contigo.</span>;
            })()}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ padding: "0 18px 32px", display: "flex", gap: 8 }}>
        <button className="btn btn-gold" onClick={() => requireAuth(() => onBuy(p))}
          style={{ flex: 1, border: "none", borderRadius: 50, padding: "15px", fontSize: 13, fontWeight: 800 }}>
          Comprar ahora
        </button>
        <button className={`btn ${isDark ? "btn-dark" : "btn-light"}`} onClick={() => requireAuth(() => {
          if (p.seller_id) {
            // Abre el chat CON CONTEXTO del producto (franja "estás consultando sobre esto").
            onChat(p.seller_id, sellerName || p.seller_name || "Vendedor", { type: "product", id: p.id, title: p.title || "", image: p.image || null, price: p.price ?? null, currency: p.currency || "USD" });
            trackEvent(user?.id, p.id, "chat").catch(() => {});
          } else flash("ℹ️ Vendedor no disponible");
        })} title="Chatear con el vendedor"
          style={{ width: 50, height: 50, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <Ic n="msg" c={T2} s={19} />
        </button>
        <button className={`btn ${isDark ? "btn-dark" : "btn-light"}`} onClick={async () => {
          const txt = `${p.title} — en RETADOR`;
          try {
            if (navigator.share) { await navigator.share({ title: p.title, text: txt }); return; }
            if (navigator.clipboard) { await navigator.clipboard.writeText(txt); flash("📋 Copiado para compartir"); return; }
            flash("Compartir no disponible en este dispositivo");
          } catch (e) { /* el usuario canceló o no se permitió */ }
        }} title="Compartir producto" style={{ width: 50, height: 50, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic n="share" c={T2} s={17} />
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SELLER PROFILE — getUserById + trust stats + productos
// ═════════════════════════════════════════════════════════════════════════════
export function SellerProfile({ userId, currentUser, onBack, onChat, onProduct }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const [profile,  setProfile]  = useState(null);
  const [products, setProducts] = useState([]);
  const [trust,    setTrust]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      const [ud, prods, ts] = await Promise.all([
        getUserById(userId),
        getProductsBySeller(userId),
        getUserTrustStats(userId).catch(() => null),
      ]);
      setProfile(ud); setProducts(prods); setTrust(ts); setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Spin size={28} /></div>;

  const name   = profile?.name || "Usuario";
  const isMe   = currentUser?.id === userId;

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "13px 18px", display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c="#666" s={20} /></button>
        <p style={{ fontSize: 14, fontWeight: 800 }}>Perfil del vendedor</p>
      </div>
      <div style={{ padding: "22px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <Avatar url={profile?.avatar} name={name} size={70} verified={!!(profile?.is_verified || profile?.verified)} style={{ boxShadow: `0 0 22px ${G}35` }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 800 }}>{name}</p>
            {profile?.bio && <p style={{ fontSize: 11, color: "#484848", marginTop: 6, lineHeight: 1.5 }}>{profile.bio}</p>}
          </div>
          {!isMe && currentUser && (
            <button className="p" onClick={() => onChat(userId, name)} style={{ background: G, color: "#000", border: "none", borderRadius: 50, padding: "9px 16px", fontSize: 11, fontWeight: 800 }}>Chat</button>
          )}
        </div>

        {/* Trust stats */}
        {trust && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(cols, 3)},1fr)`, gap: 8, marginBottom: 18 }}>
            {[
              { label: "Ventas", value: trust.verified_sales || trust.completed_orders || 0, color: G },
              { label: "Éxito", value: `${((trust.success_rate || 0)).toFixed(0)}%`, color: "#22C55E" },
              { label: "Trust", value: trust.trust_score || 0, color: "#60A5FA" },
            ].map(s => (
              <div key={s.label} style={{ background: S, border: `1px solid ${s.color}18`, borderRadius: 12, padding: "10px", textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: 9, color: "#484848", fontWeight: 600, marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "0 18px 80px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "#777" }}>Productos de {name}</p>
        {products.length === 0
          ? <p style={{ fontSize: 11, color: "#3e3e3e", textAlign: "center", padding: "24px 0" }}>Sin productos publicados aún</p>
          : <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
            {products.map(p => <PCard key={p.id} p={p} onClick={() => onProduct(p)} isFav={false} onFav={() => {}} />)}
          </div>
        }
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLISH SHEET
// ═════════════════════════════════════════════════════════════════════════════
export function PubSheet({ onClose, onPublish, user, flash }) {
  const { cols } = useR();
  const { cats, subcats } = useCatalog();
  const { S, B, CARD, T1, T2, T3, isDark } = useAt();
  // ⭐ Destacar: controlado por el admin (config global en vivo). Apagado → oculto.
  const platformCfg = usePlatformCfg();
  const promoOn = platformCfg.promoActive === true;
  const promoCost = Number(platformCfg.promoCost) || 0;
  const [promoAsk, setPromoAsk] = useState(false);
  const [form, setForm] = useState({
    kind: "",   // FASE 3: 'product' | 'service' — OBLIGATORIO elegir antes de publicar
    title: "",
    price: "",
    currency: "USD",
    orig: "",
    cat: "",
    subcat: "",
    desc: "",
    images: [], // Array de URLs
    badge: "",
    shipModes: { local: true, intl: false, persona: false }, // combinables: el vendedor marca las que quiera
    location: "",
    pickupAddress: (() => { try { return JSON.parse(localStorage.getItem("retador_pickup") || "{}").address || ""; } catch (e) { return ""; } })(),
    pickupPhone: (() => { try { return JSON.parse(localStorage.getItem("retador_pickup") || "{}").phone || ""; } catch (e) { return ""; } })(),
    shippingPrice: "",
    shippingType: "standard",
    promote: false
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  const inp = { 
    width: "100%", 
    background: isDark?"#0e0e0e":CARD, 
    border: `1px solid ${B}`, 
    borderRadius: 10, 
    padding: "11px 13px", 
    color: isDark?"#fff":T1, 
    fontSize: 11, 
    outline: "none",
    fontFamily: "'Inter', sans-serif"
  };
  
  const lbl = { 
    fontSize: 10, 
    fontWeight: 700, 
    color: isDark?"#888":T2, 
    letterSpacing: .3, 
    display: "block", 
    marginBottom: 7 
  };

  const sectionStyle = {
    background: isDark?"#0a0a0a":CARD,
    border: `1px solid ${B}`,
    borderRadius: 14,
    padding: "13px",
    marginBottom: 12
  };

  const sectionTitle = {
    fontSize: 11,
    fontWeight: 800,
    color: isDark?"#fff":T1,
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8
  };

  const handleFile = async e => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > 5) {
      flash("⚠️ Máximo 5 imágenes");
      return;
    }
    
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(file => uploadImage(file, user?.id))
      );
      set("images", [...form.images, ...urls]);
      flash("✅ Imagen(es) subida(s)");
    } catch (e) {
      flash("⚠️ " + (e.message || "Error subiendo"));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    set("images", form.images.filter((_, i) => i !== idx));
  };

  const kindChosen = form.kind === "product" || form.kind === "service";
  const isService = form.kind === "service";
  const anyShip = form.shipModes.local || form.shipModes.intl || form.shipModes.persona;
  const needsLoc = form.shipModes.local || form.shipModes.persona;
  // Servicio: título + categoría (precio y zona opcionales). Producto: regla completa.
  const canPublish = kindChosen && form.title && form.cat && (
    isService
      ? true
      : (form.price && anyShip && (!needsLoc || form.location) && (!form.shipModes.intl || form.shippingPrice))
  );

  return (
    <div className="fi" style={{ position: "fixed", inset: 0, zIndex: 400 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.88)", backdropFilter: "blur(18px)" }} />
      <div className="bs" onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: isDark ? isDark?"#060606":S : S, borderRadius: "24px 24px 0 0", border: `1px solid ${B}`, borderBottom: "none", maxHeight: "96dvh", overflowY: "auto" }}>
        
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, background: B, borderRadius: 2, margin: "14px auto 0" }} />
        
        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: isDark ? "rgba(6,6,6,.98)" : `rgba(220,221,232,.98)`, backdropFilter: "blur(18px)", padding: "14px 20px", borderBottom: `1px solid ${B}`, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -.3, color: T1 }}>{isService ? "Publicar Servicio" : "Publicar Producto"}</h2>
            <p style={{ fontSize: 10, color: T3, marginTop: 2 }}>Publicación libre e instantánea · Visible globalmente 🌍</p>
          </div>
          <button onClick={onClose} className="p" style={{ background: isDark?"#111":CARD, border: `1px solid ${B}`, borderRadius: "50%", width: 27, height: 27, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic n="close" c={T2} s={15} />
          </button>
        </div>

        <div style={{ padding: "13px" }}>

          {/* SELECTOR OBLIGATORIO: ¿Producto o Servicio? */}
          <div style={sectionStyle}>
            <div style={sectionTitle}><span>❓</span> ¿Qué vas a publicar?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { k: "product", ic: "📦", t: "Producto", d: "Algo físico que vendes y se entrega" },
                { k: "service", ic: "🛠️", t: "Servicio", d: "Un trabajo o servicio que ofreces" },
              ].map(o => {
                const on = form.kind === o.k;
                return (
                  <button key={o.k} type="button" className="p" onClick={() => set("kind", o.k)}
                    style={{ textAlign: "center", padding: "16px 10px", borderRadius: 14, cursor: "pointer",
                      background: on ? `${G}14` : (isDark ? "#0e0e0e" : CARD),
                      border: `2px solid ${on ? G : (isDark ? "#1a1a1a" : B)}` }}>
                    <div style={{ fontSize: 26, marginBottom: 4 }}>{o.ic}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: on ? G : (isDark ? "#fff" : T1) }}>{o.t}</div>
                    <div style={{ fontSize: 9, color: isDark ? "#777" : T2, marginTop: 3, lineHeight: 1.35 }}>{o.d}</div>
                  </button>
                );
              })}
            </div>
            {!kindChosen && <p style={{ fontSize: 9.5, color: G, marginTop: 8, textAlign: "center" }}>Elige una opción para continuar.</p>}
          </div>

          {kindChosen && <>
          {/* SECCIÓN 1: IMÁGENES */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>
              <span>📷</span> Imágenes del producto
            </div>
            <input type="file" accept="image/*" multiple ref={fileRef} onChange={handleFile} style={{ display: "none" }} />
            
            {form.images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(cols, 3)},1fr)`, gap: 8, marginBottom: 12 }}>
                {form.images.map((img, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: isDark?"#141414":CARD }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => removeImage(i)} className="p" style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,.85)", border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: isDark?"#fff":T1, fontSize: 12, fontWeight: 700 }}>×</button>
                    {i === 0 && <div style={{ position: "absolute", bottom: 4, left: 4, background: G, color: "#000", fontSize: 9, fontWeight: 800, padding: "3px 7px", borderRadius: 4 }}>PRINCIPAL</div>}
                  </div>
                ))}
              </div>
            )}
            
            {form.images.length < 5 && (
              <button className="p" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: "100%", background: isDark?"#0e0e0e":CARD, border: `1.5px dashed #222`, borderRadius: 10, padding: "13px", fontSize: 8, color: form.images.length === 0 ? G : isDark?"#555":T2, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {uploading ? <><Spin size={15} /> Subiendo...</> : `${form.images.length === 0 ? "📸 Subir primera imagen (obligatorio)" : `+ Agregar más (${form.images.length}/5)`}`}
              </button>
            )}
          </div>

          {/* SECCIÓN 2: INFORMACIÓN BÁSICA */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>
              <span>📝</span> Información básica
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <label style={lbl}>Título del producto *</label>
                <input style={inp} placeholder="Ej: iPhone 14 Pro Max 256GB" value={form.title} onChange={e => set("title", e.target.value)} maxLength={80} />
                <p style={{ fontSize: 9, color: T3, marginTop: 4, textAlign: "right" }}>{form.title.length}/80</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isService ? "1fr" : `repeat(${cols},1fr)`, gap: 8 }}>
                <div>
                  <label style={lbl}>{isService ? <>Precio <span style={{ color: T3 }}>(desde · opcional)</span></> : "Precio *"}</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: isDark?"#666":T2, fontSize: 12, fontWeight: 700 }}>$</span>
                    <input style={{ ...inp, paddingLeft: 26 }} type="number" min="0" step="0.01" placeholder={isService ? "Desde… (opcional)" : "0.00"} value={form.price} onChange={e => set("price", e.target.value)} />
                  </div>
                </div>
                {!isService && <div>
                  <label style={lbl}>Precio original <span style={{ color: T3 }}>(opcional)</span></label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: isDark?"#444":T3, fontSize: 12, fontWeight: 700 }}>$</span>
                    <input style={{ ...inp, paddingLeft: 26 }} type="number" min="0" step="0.01" placeholder="0.00" value={form.orig} onChange={e => set("orig", e.target.value)} />
                  </div>
                </div>}
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={lbl}>Moneda *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {CURRENCY_CODES.map(code => {
                    const active = form.currency === code;
                    return (
                      <button key={code} type="button" onClick={() => set("currency", code)}
                        style={{ flex: 1, padding: "11px 4px", borderRadius: 11, cursor: "pointer",
                          background: active ? `${G}14` : (isDark ? "#111" : "#F5F6F7"),
                          border: `1.5px solid ${active ? G : (isDark ? "#222" : "#E4E6EB")}`,
                          color: active ? G : (isDark ? "#aaa" : T2), fontSize: 12, fontWeight: 800 }}>
                        {CURRENCIES[code].symbol} {code}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CATEGORÍA */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>
              <span>🏷️</span> {isService ? "Categoría del servicio" : "Categoría y subcategoría"}
            </div>
            <select style={{ ...inp, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 13px center", paddingRight: 40, cursor: "pointer", color: form.cat ? T1 : T3 }} value={form.cat ? `${form.cat}|${form.subcat || ""}` : ""} onChange={e => { const [cid, sub] = e.target.value.split("|"); set("cat", cid || ""); set("subcat", sub || ""); }}>
              <option value="">Selecciona categoría…</option>
              {cats.map(c => {
                const sc = subcats[c.id] || [];
                return sc.length
                  ? sc.map(s => <option key={c.id + "|" + s} value={`${c.id}|${s}`}>{c.name} / {s}</option>)
                  : <option key={c.id} value={`${c.id}|`}>{c.name}</option>;
              })}
            </select>
            {!form.cat && <p style={{ fontSize: 9.5, color: T3, marginTop: 5 }}>Obligatorio · ayuda a que aparezca en la búsqueda correcta.</p>}
          </div>

          {/* ZONA (servicio): dónde ofrece el servicio */}
          {isService && <div style={sectionStyle}>
            <div style={sectionTitle}><span>📍</span> Zona donde ofreces el servicio</div>
            <input style={inp} placeholder="Ej: La Habana, Vedado (o «toda Cuba», «en línea»…)" value={form.location} onChange={e => set("location", e.target.value)} />
          </div>}

          {!isService && form.shipModes.local && <div style={sectionStyle}>
            <div style={sectionTitle}>
              <span>🏪</span> Dirección de recogida
            </div>
            <p style={{ fontSize: 9.5, color: T3, marginBottom: 8 }}>Desde dónde el mensajero recoge el producto. Se usa para calcular el domicilio y guiarlo. No se muestra públicamente.</p>
            <input style={inp} value={form.pickupAddress} onChange={e => set("pickupAddress", e.target.value)} placeholder="Calle, número, entre calles, municipio" />
            <input style={{ ...inp, marginTop: 8 }} value={form.pickupPhone} onChange={e => set("pickupPhone", e.target.value)} placeholder="Teléfono de contacto para la recogida" />
          </div>}

          {/* SECCIÓN 4: DESCRIPCIÓN */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>
              <span>📄</span> Descripción
            </div>
            <textarea style={{ ...inp, resize: "none", minHeight: 100, lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }} placeholder="Describe tu producto con detalle: estado, características, incluye..." value={form.desc} onChange={e => set("desc", e.target.value)} maxLength={500} />
            <p style={{ fontSize: 9, color: T3, marginTop: 6, textAlign: "right" }}>{form.desc.length}/500</p>
          </div>

          {/* SECCIÓN 5: ETIQUETA */}
          {!isService && <div style={sectionStyle}>
            <div style={sectionTitle}>
              <span>⭐</span> Etiqueta destacada
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(cols, 4)},1fr)`, gap: 7 }}>
              {["", "NUEVO", "OFERTA", "RECOMENDADO"].map(b => (
                <button key={b} onClick={() => set("badge", b)} className="p" style={{ background: form.badge === b ? (BC[b]?.bg || isDark?"#1a1a1a":B) : isDark?"#0e0e0e":CARD, color: form.badge === b ? (BC[b]?.tx || isDark?"#fff":T1) : isDark?"#444":T3, border: `1.5px solid ${form.badge === b ? (BC[b]?.bg || "#333") : isDark?"#1a1a1a":B}`, borderRadius: 8, padding: "10px 4px", fontSize: 9, fontWeight: 700, textAlign: "center" }}>
                  {b || "Sin etiqueta"}
                </button>
              ))}
            </div>
          </div>}

          {/* SECCIÓN 6: ENTREGA (solo productos) */}
          {!isService && <div style={sectionStyle}>
            <div style={sectionTitle}>
              <span>🚚</span> Opciones de entrega
            </div>
            <p style={{ fontSize: 9.5, color: isDark?"#777":T2, marginTop: -8, marginBottom: 12, lineHeight: 1.5 }}>
              Marca todas las formas en que puedes entregar este producto. El comprador elegirá entre las que actives.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { key: "local",   icon: "🛵", title: "Delivery local",      desc: "Un mensajero lo entrega en tu zona o provincia." },
                { key: "intl",    icon: "✈️", title: "Envío internacional", desc: "Cargo a toda Cuba, con seguimiento." },
                { key: "persona", icon: "🤝", title: "Entrega en persona",  desc: "El comprador te lo recoge donde estás." },
              ].map(opt => {
                const on = form.shipModes[opt.key];
                return (
                  <button key={opt.key} className="p" onClick={() => set("shipModes", { ...form.shipModes, [opt.key]: !on })}
                    style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", width: "100%",
                      background: on ? `${G}12` : isDark?"#0e0e0e":CARD,
                      border: `1.5px solid ${on ? G : isDark?"#1a1a1a":B}`, borderRadius: 12, padding: "11px 12px" }}>
                    <span style={{ fontSize: 17, flexShrink: 0 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: on ? G : isDark?"#fff":T1 }}>{opt.title}</div>
                      <div style={{ fontSize: 9, color: isDark?"#777":T2, marginTop: 2, lineHeight: 1.4 }}>{opt.desc}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: on ? G : "transparent", border: `1.5px solid ${on ? G : isDark?"#333":B}` }}>
                      {on && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5l3 3 6-6.5" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </button>
                );
              })}
            </div>

            {(form.shipModes.local || form.shipModes.persona) && (
              <div style={{ marginTop: 12 }}>
                <label style={lbl}>📍 Tu ubicación / zona *</label>
                <input style={inp} placeholder="Ej: La Habana, Vedado" value={form.location} onChange={e => set("location", e.target.value)} />
              </div>
            )}

            {form.shipModes.intl && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
                  <div>
                    <label style={lbl}>💵 Precio de envío *</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: isDark?"#666":T2, fontSize: 12, fontWeight: 700 }}>$</span>
                      <input style={{ ...inp, paddingLeft: 26 }} type="number" min="0" step="0.01" placeholder="0.00" value={form.shippingPrice} onChange={e => set("shippingPrice", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>📦 Tipo de envío</label>
                    <select style={{ ...inp, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 13px center", paddingRight: 40, cursor: "pointer" }} value={form.shippingType} onChange={e => set("shippingType", e.target.value)}>
                      <option value="standard">Standard (7-14 días)</option>
                      <option value="express">Express (3-5 días)</option>
                      <option value="priority">Priority (24-48h)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>}

          {/* SECCIÓN 8: DESTACAR (⭐) — solo si el admin tiene la función ENCENDIDA.
              Apagada → oculta del todo (ni gris ni nada). La tarifa es la REAL de
              la config en vivo; se confirma ANTES de marcar. */}
          {!isService && promoOn && (
          <div style={sectionStyle}>
            <div style={sectionTitle}>
              <span>⭐</span> Destacar
            </div>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "12px 14px", background: form.promote ? `${G}08` : isDark?"#0e0e0e":CARD, borderRadius: 10, border: `1px solid ${form.promote ? `${G}30` : isDark?"#1a1a1a":B}` }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: form.promote ? G : isDark?"#fff":T1, marginBottom: 2 }}>⭐ Destacar este producto · {promoCost} CUP</div>
                <div style={{ fontSize: 9, color: isDark?"#555":T2 }}>Aparece en el filtro Destacado. Se cobra a tu deuda al publicar.</div>
              </div>
              <div onClick={() => { if (form.promote) { set("promote", false); } else { setPromoAsk(true); } }} style={{ width: 44, height: 24, borderRadius: 12, background: form.promote ? G : isDark?"#222":B, position: "relative", transition: "background 0.2s", cursor: "pointer" }}>
                <div style={{ position: "absolute", top: 2, left: form.promote ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: form.promote ? "#000" : isDark?"#444":T3, transition: "left 0.2s" }} />
              </div>
            </label>
          </div>
          )}

          {/* Confirmación de la tarifa de destacar (antes de marcar) */}
          {promoAsk && (
            <div onClick={() => setPromoAsk(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 6000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ background: isDark ? "#141414" : "#fff", borderRadius: 16, padding: "20px 18px", maxWidth: 340, width: "100%" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T1, marginBottom: 8 }}>⭐ Destacar producto</div>
                <p style={{ fontSize: 12.5, color: T2, lineHeight: 1.55, margin: "0 0 14px" }}>Destacar cuesta <b style={{ color: G }}>{promoCost} CUP</b>. Se suma a tu deuda con RETADOR y se cobra después. El impago puede llevar a sanciones. ¿Confirmas?</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="p" onClick={() => setPromoAsk(false)} style={{ flex: 1, height: 42, borderRadius: 10, border: `1px solid ${B}`, background: "transparent", color: T1, fontSize: 13, fontWeight: 700 }}>Cancelar</button>
                  <button className="p" onClick={() => { set("promote", true); setPromoAsk(false); }} style={{ flex: 1, height: 42, borderRadius: 10, border: "none", background: G, color: "#000", fontSize: 13, fontWeight: 800 }}>Confirmar</button>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 9: ACCIÓN */}
          <button 
            onClick={async () => {
              if (!canPublish) {
                if (!kindChosen) flash("⚠️ Elige Producto o Servicio");
                else if (!form.title) flash("⚠️ Escribe un título");
                else if (!form.cat) flash("⚠️ Elige una categoría");
                else if (isService) { /* servicio: resto opcional */ }
                else if (!form.price) flash("⚠️ Define el precio");
                else if (!anyShip) flash("⚠️ Marca al menos una forma de entrega");
                else if (needsLoc && !form.location) flash("⚠️ Indica tu ubicación / zona");
                else if (form.shipModes.intl && !form.shippingPrice) flash("⚠️ Define precio de envío internacional");
                return;
              }
              setSaving(true); 
              try { if (form.pickupAddress || form.pickupPhone) localStorage.setItem("retador_pickup", JSON.stringify({ address: form.pickupAddress, phone: form.pickupPhone })); } catch (e) {}
              await onPublish({ ...form, img: form.images[0] }); // Pasamos primera imagen como principal
              setSaving(false); 
            }} 
            className="p" 
            disabled={saving}
            style={{ 
              width: "100%", 
              background: canPublish ? `linear-gradient(135deg, ${G} 0%, #D4A800 100%)` : "#151515", 
              color: canPublish ? "#000" : "#2e2e2e", 
              border: "none", 
              borderRadius: 50, 
              padding: "13px", 
              fontSize: 8, 
              fontWeight: 900, 
              letterSpacing: .5,
              marginTop: 8,
              marginBottom: 20,
              boxShadow: canPublish ? `0 8px 24px ${G}40` : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}>
            {saving ? <><Spin size={17} color="#000" /> Publicando...</> : (isService ? "🚀 PUBLICAR SERVICIO" : "🚀 PUBLICAR PRODUCTO")}
          </button>
          </>}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SERVICIOS — mundo aparte (kind='service'): tarjeta simple + "Contactar".
// Sin comprar, sin flujo de pedido, sin comisión. Se monetiza distinto (después).
// ═════════════════════════════════════════════════════════════════════════════
function ServiceCard({ s, onContact }) {
  const { S, B, CARD, T1, T2, T3, isDark, ts } = useAt();
  const img = s.img || s.image || (s.images && s.images[0]) || null;
  const price = Number(s.price) || 0;
  return (
    <div style={{ background: isDark ? "#0d0d0d" : CARD, border: `1px solid ${B}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", aspectRatio: "16 / 10", background: "#161616", overflow: "hidden" }}>
        {img
          ? <img src={img} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>🛠️</div>}
        <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", color: G, fontSize: 9 * ts, fontWeight: 800, padding: "3px 8px", borderRadius: 999 }}>🛠️ Servicio</div>
      </div>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 12.5 * ts, fontWeight: 700, color: T1, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.title}</p>
        {s.location && <div style={{ fontSize: 10 * ts, color: T2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {s.location}</div>}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 4 }}>
          {price > 0
            ? <span style={{ fontSize: 13 * ts, fontWeight: 900, color: G }}><span style={{ fontSize: 9 * ts, color: T3, fontWeight: 600 }}>desde </span>{money(price, s.currency)}</span>
            : <span style={{ fontSize: 10 * ts, color: T3 }}>Precio a consultar</span>}
          <button className="p" onClick={() => onContact(s)} style={{ background: G, color: "#000", border: "none", borderRadius: 999, padding: "7px 12px", fontSize: 10.5 * ts, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>💬 Contactar</button>
        </div>
      </div>
    </div>
  );
}

export function ServicesScreen({ services = [], loading = false, onBack, onContact, onPublish }) {
  const { BG, S, B, T1, T2, T3, isDark } = useAt();
  const { cols } = useR();
  const ncols = Math.max(cols, 2);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: BG }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${B}`, flexShrink: 0 }}>
        {onBack && <button className="p" onClick={onBack} style={{ background: isDark ? "#111" : "#f0f0f0", border: `1px solid ${B}`, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: T1 }}><Ic n="back" c={T1} s={16} /></button>}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: T1 }}>🛠️ Servicios</h2>
          <p style={{ margin: 0, fontSize: 10, color: T3, marginTop: 1 }}>Contacta directo con quien ofrece el servicio</p>
        </div>
        {onPublish && <button className="p" onClick={onPublish} style={{ background: `${G}18`, color: G, border: `1px solid ${G}40`, borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 800 }}>+ Ofrecer</button>}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 100px" }}>
        {loading
          ? <div style={{ textAlign: "center", color: T3, fontSize: 12, padding: "40px 0" }}>Cargando servicios…</div>
          : services.length === 0
            ? <div style={{ textAlign: "center", color: T3, padding: "48px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🛠️</div>
                <p style={{ fontSize: 13, color: T2, fontWeight: 600 }}>Aún no hay servicios publicados</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>¿Ofreces un servicio? Publícalo y aparecerá aquí.</p>
              </div>
            : <div style={{ display: "grid", gridTemplateColumns: `repeat(${ncols}, 1fr)`, gap: 12 }}>
                {services.map(s => <ServiceCard key={s.id} s={s} onContact={onContact} />)}
              </div>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ENVÍOS
// ═════════════════════════════════════════════════════════════════════════════
function ServiceReviewsModal({ onClose, onSubmitted, field = "sys", title = "Servicio de entregas RETADOR" }) {
  const { S, B, CARD, T1, T2, T3, isDark } = useAt();
  const [stars, setStars] = useState(0);
  const [msg, setMsg] = useState("");
  const [, force] = useState(0);
  const agg = serviceRating(field);
  const reviews = serviceReviews(field);
  const submit = () => {
    if (!stars) return;
    try {
      const all = JSON.parse(localStorage.getItem("retador_ratings") || "{}");
      all["svc" + Date.now()] = { [field]: stars, [field + "Msg"]: msg.trim(), at: Date.now() };
      localStorage.setItem("retador_ratings", JSON.stringify(all));
    } catch (e) {}
    setStars(0); setMsg(""); force(x => x + 1); onSubmitted && onSubmitted();
  };
  const starRow = (val, onPick, size) => <div style={{ display: "flex", gap: 4 }}>{[1, 2, 3, 4, 5].map(n => <span key={n} onClick={onPick ? () => onPick(n) : undefined} style={{ fontSize: size || 20, cursor: onPick ? "pointer" : "default", filter: n <= val ? "none" : "grayscale(1) opacity(0.35)" }}>⭐</span>)}</div>;
  return (
    <div className="fi" style={{ position: "fixed", inset: 0, zIndex: 4500 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.78)", backdropFilter: "blur(14px)" }} />
      <div className="bs" onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: S, borderRadius: "22px 22px 0 0", border: `1px solid ${B}`, borderBottom: "none", maxHeight: "86dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 34, height: 4, background: B, borderRadius: 2, margin: "12px auto 8px", flexShrink: 0 }} />
        <div style={{ padding: "0 18px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontWeight: 900, fontSize: 15, color: T1 }}>Valoraciones y reseñas</span>
          <button onClick={onClose} style={{ background: isDark ? "#1e1e1e" : CARD, border: "none", color: T2, width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 15 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: isDark ? "#141414" : CARD, border: `1px solid ${B}`, borderRadius: 16, padding: "18px", marginBottom: 16 }}>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: T1, lineHeight: 1 }}>{agg.count ? agg.avg : "—"}</div>
              <div style={{ marginTop: 6 }}>{starRow(Math.round(agg.avg), null, 13)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T1 }}>{title}</div>
              <div style={{ fontSize: 11.5, color: T3, marginTop: 3 }}>{agg.count ? `Basado en ${agg.count} ${agg.count === 1 ? "valoración" : "valoraciones"} de la gente` : "Aún no hay valoraciones. Sé el primero."}</div>
            </div>
          </div>

          <div style={{ background: `${G}10`, border: `1px solid ${G}30`, borderRadius: 14, padding: "14px", marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T1, marginBottom: 8 }}>Deja tu valoración del servicio</div>
            {starRow(stars, setStars, 26)}
            {stars > 0 && <>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Cuéntale a otros cómo fue tu experiencia con este servicio (opcional)…" style={{ width: "100%", marginTop: 11, background: isDark ? "#141414" : "#fff", border: `1px solid ${B}`, borderRadius: 11, padding: "10px 12px", fontSize: 12.5, color: T1, minHeight: 56, resize: "vertical", fontFamily: "inherit" }} />
              <button onClick={submit} style={{ width: "100%", marginTop: 10, background: G, color: "#000", border: "none", borderRadius: 12, padding: "13px", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>Publicar mi reseña</button>
            </>}
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 800, color: T1, marginBottom: 10 }}>Lo que dice la gente {reviews.length ? `(${reviews.length})` : ""}</div>
          {reviews.length === 0 ? <div style={{ textAlign: "center", padding: "24px 0", color: T3, fontSize: 12.5 }}>Todavía no hay reseñas escritas.</div>
          : reviews.map((r, i) => (
            <div key={i} style={{ padding: "12px 0", borderTop: i ? `1px solid ${B}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                {starRow(r.stars, null, 12)}
                <span style={{ fontSize: 10, color: T3 }}>{new Date(r.at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</span>
              </div>
              <div style={{ fontSize: 12.5, color: T2, lineHeight: 1.5 }}>"{r.msg}"</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EnviosMenu({ onLocal, onIntl, user, requireAuth }) {
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const { S, B, T1, T2, T3, CARD, isDark } = useAt();
  const dlOn = usePlatformCfg().deliveryServiceActive !== false;
  const [revOpen, setRevOpen] = useState(null);
  const [, refreshRev] = useState(0);
  const sysR = systemRating();
  const intlR = serviceRating("intl");
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 18px" }}>
      <div style={{ padding: "18px 0 14px" }}><Logo size={21} sub="Envíos" /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { onClick: onLocal, revField: "sys", tag: dlOn ? "🛵 DISPONIBLE AHORA" : "🛵 SERVICIO NO DISPONIBLE", tagC: dlOn ? "#22C55E" : "#ef4444", title: "Delivery Local", desc: dlOn ? "Mensajeros en tu ciudad. Entrega en 30–90 min." : "El servicio de entregas no está operativo por ahora.", stats: [["50","CUP/KM",G],["12","ACTIVOS","#22C55E"],[sysR.count ? "⭐" + sysR.avg : "Nuevo", sysR.count ? sysR.count + " RESEÑAS ›" : "VALORAR ›", isDark ? "#fff" : T1]], img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=60" },
          { onClick: onIntl,  revField: "intl", tag: "✈️ ESPAÑA → CUBA",   tagC: "#60A5FA", title: "Envíos Int'l",   desc: "Envía paquetes a Cuba desde cualquier parte.",  stats: [["15€","DESDE/KG","#60A5FA"],["7-14","DÍAS", isDark ? "#fff" : T1],[intlR.count ? "⭐" + intlR.avg : "Nuevo", intlR.count ? intlR.count + " RESEÑAS ›" : "VALORAR ›", isDark ? "#fff" : T1]],  img: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&q=60" },
        ].map((card, i) => (
          <div key={i} className="cd" onClick={card.onClick} style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${card.img})`, backgroundSize: "cover", backgroundPosition: "center", filter: isDark ? "brightness(0.12) saturate(0.3)" : "brightness(0.18) saturate(0.4)" }} />
            <div style={{ position: "absolute", inset: 0, background: isDark ? "linear-gradient(to right,rgba(8,8,8,.96) 38%,rgba(8,8,8,.4))" : "linear-gradient(to right,rgba(245,244,240,.97) 38%,rgba(245,244,240,.6))" }} />
            <div style={{ position: "relative", zIndex: 1, padding: "22px 18px" }}>
              <div style={{ display: "inline-flex", background: card.tagC + "20", border: `1px solid ${card.tagC}28`, borderRadius: 100, padding: "4px 11px", fontSize: 9, fontWeight: 700, color: card.tagC, marginBottom: 12 }}>{card.tag}</div>
              <h2 style={{ fontSize: 19, fontWeight: 900, marginBottom: 6, color: T1 }}>{card.title}</h2>
              <p style={{ color: T2, fontSize: 11, lineHeight: 1.5, marginBottom: 16 }}>{card.desc}</p>
              <div style={{ display: "flex", gap: 8 }}>
                {card.stats.map(([v, l, c]) => {
                  const isRev = typeof l === "string" && (l.includes("RESEÑAS") || l.includes("VALORAR"));
                  return (
                  <div key={l} onClick={isRev ? (e) => { e.stopPropagation(); setRevOpen(card.revField); } : undefined} style={{ background: isDark ? "#1a1a1a" : CARD, border: `1px solid ${isRev ? G + "55" : B}`, borderRadius: 10, padding: "8px 11px", textAlign: "center", cursor: isRev ? "pointer" : "inherit" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: isRev ? G : c }}>{v}</div>
                    <div style={{ fontSize: 9, color: isRev ? G : T3, fontWeight: 700 }}>{l}</div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      {revOpen && <ServiceReviewsModal field={revOpen} title={revOpen === "intl" ? "Envíos Internacionales" : "Servicio de entregas RETADOR"} onClose={() => setRevOpen(null)} onSubmitted={() => refreshRev(x => x + 1)} />}
    </div>
  );
}

export function BottomNav({ tab, onTab, unread, hidden }) {
  const { BG, B, isDark } = useAt();
  const items = [
    { id: "market",  ic: "store",  label: "Tienda" },
    { id: "search",  ic: "search", label: "Buscar" },
    { id: "envios",   ic: "truck",  label: "Envíos" },
    { id: "subastas", ic: "award",  label: "Subastas" },
    { id: "perfil",   ic: "user",   label: "Perfil" },
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 60, background: isDark ? "rgba(8,8,8,.78)" : "rgba(255,255,255,.8)", backdropFilter: "blur(14px) saturate(1.4)", WebkitBackdropFilter: "blur(14px) saturate(1.4)", borderTop: `1px solid ${isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"}`, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "8px 4px calc(20px + env(safe-area-inset-bottom, 0px) / var(--img-s, 1))", transform: hidden ? "translateY(115%)" : "translateY(0)", transition: "transform .28s cubic-bezier(.4,0,.2,1)", willChange: "transform" }}>
      {items.map(it => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => onTab(it.id)} className="p"
            style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "2px 10px", minWidth: 44, position: "relative" }}>
            {it.ic === "search" ? (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" style={{ color: active ? G : "#383838" }}>
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <Ic n={it.ic} c={active ? G : "#383838"} s={21} />
            )}
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 600, color: active ? G : "#383838", letterSpacing: .2 }}>{it.label}</span>
            {active && <div style={{ position: "absolute", bottom: -4, width: 20, height: 2, background: G, borderRadius: 1 }} />}
            {it.id === "perfil" && unread > 0 && (
              <div style={{ position: "absolute", top: 0, right: 7, width: 16, height: 16, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#000", border: `2px solid ${BG}` }}>
                {unread > 9 ? "9+" : unread}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
