// ═════════════════════════════════════════════════════════════════════════════
// RETADOR MARKETPLACE — Demo Version
// Versión de demostración con datos simulados para visualización
// ═════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { User, Palette, Bell, Shield, MessageCircle, Truck, Gavel, CreditCard, BarChart2, Globe, HardDrive, HelpCircle, Info, ChevronRight, ArrowLeft, Check, Plus, Edit2, Camera, Lock, LogOut, MapPin, Clock, Download, FileText, Award, ShoppingBag, Package, AlertCircle, CheckCircle2, Zap, TrendingUp, Database, Mail, Phone, Fingerprint, Star, Volume2, Smartphone, Calendar, Activity, Send, ArrowDownLeft, ArrowUpRight, PlusCircle, Eye, EyeOff, ShieldCheck, Search, X, Users, QrCode, Landmark, Wallet, Home, History, UserCircle2, Copy, Share2, Loader2, Banknote, Building2, Trash2, KeyRound, BadgeCheck, Receipt, ArrowLeftRight } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ═════════════════════════════════════════════════════════════════════════════
// CIMIENTOS COMPARTIDOS — conexión Supabase, backend, tema, catálogo y UI base.
// Viven en src/shared/ para poder reutilizarlos desde cada pantalla/sección.
// (La configuración de Supabase "EDITAR AQUÍ" está en src/shared/supabase.js)
// ═════════════════════════════════════════════════════════════════════════════
import {
  supabase,
  MOCK_PRODUCTS, MOCK_USER,
  authSignUp, authSignIn, authSignOut, authGetSession,
  getUserById, getUserName, updateUserName,
  mapProduct, loadProducts, getFeed, saveProduct, deleteProduct, getProductsBySeller, uploadImage,
  sendMessage, loadMessages, markRead, getMyConversations,
  addFavorite, removeFavorite, getFavorites,
  getLedgerEntries, createEscrow, releaseEscrow, getSystemStatus,
  CURRENCIES, CURRENCY_CODES, DEFAULT_CURRENCY, money,
  createOrder, estimateDeliveryFee,
  readRatings, aggRating, systemRating, serviceRating, serviceReviews, ratingForName, systemReviews,
  getUserOrders, updateOrderStatus,
  ORDER_FLOW, SHIP_LABELS, MODALIDAD_LABELS,
  CONTACT_PATTERNS, maskContacts, CUBA_PROVINCES,
  getUserTrustStats, trackEvent, blockUser, isBlocked, getSB, convKey,
  G, BG, S, B, RCtx, useR, useResponsive, BC,
  DARK_T, LIGHT_T, AppThCtx, useAt,
  DENSITY_MODES, DENSITY_TOKENS, DENSITY_STORAGE_KEY, DensityContext, DensityProvider, useDensity, densityCols, TEXT_STEPS,
  CATS, SUBCATS, CatalogContext, CatalogProvider, useCatalog, CatIcon,
  useCSS, Ic, Spin, Logo,
  getPageLayout, liveSlot, LiveBlock, LiveSlot,
  useScrollDir,
} from "./shared/index.js";
import WalletApp from "./screens/Wallet.jsx";
import ProductToolsApp from "./screens/ProductTools.jsx";
import IntlShippingApp from "./screens/IntlShipping.jsx";
import OmniPanel from "./screens/AdminPanel.jsx";
import { SubastasScreen } from "./screens/Auctions.jsx";


// OMNIPANEL — panel admin integrado (CSS aislado bajo .omni)

// ═════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  return (
    <DensityProvider defaultMode="pequena">
      <CatalogProvider>
        <AppShell />
      </CatalogProvider>
    </DensityProvider>
  );
}

function AppShell() {
  useCSS();
  const rsp = useResponsive();

  // Estado inicial configurado directamente - sin login, solo visual
  const [scr,       setScr]       = useState("main");
  const [tab,       setTab]       = useState("market");
  const [user,      setUser]      = useState(MOCK_USER); // Usuario ya configurado
  const [toast,     setToast]     = useState(null);
  const [unread,    setUnread]    = useState(0); // contador de no leídos (real)
  // (el contador real de notificaciones es unreadNotif, calculado más abajo)

  // Sub-pantallas
  const [mScr,      setMScr]      = useState("home");
  const [pScr,      setPScr]      = useState("main");
  const [eScr,      setEScr]      = useState("menu");

  // Selección activa
  const [selProd,   setSelProd]   = useState(null);
  const [prodBackTo, setProdBackTo] = useState(null);
  const [editProd,  setEditProd]  = useState(null);
  const [confirmCfg, setConfirmCfg] = useState(null);
  const askConfirm = (msg, onYes) => setConfirmCfg({ msg, onYes });
  const updateProduct = (id, changes) => setProducts(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  const [selChat,   setSelChat]   = useState(null);
  const [selSeller, setSelSeller] = useState(null);

  // Overlays
  const [showCats,   setShowCats]   = useState(false);
  const [pubOpen,    setPubOpen]    = useState(false);
  const [showNotif,  setShowNotif]  = useState(false);
  const [showChats,  setShowChats]  = useState(false);
  const [showAdmin,  setShowAdmin]  = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [toolApp, setToolApp] = useState(false);
  const [showCourier, setShowCourier] = useState(false);
  // Mensajeros: solicitudes y aprobados (persistente). Cada registro guarda toda la info para verificación/seguridad.
  const [couriers, setCouriers] = useState(() => { try { return JSON.parse(localStorage.getItem("retador_couriers") || "[]"); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem("retador_couriers", JSON.stringify(couriers)); } catch {} }, [couriers]);
  const submitCourierApp = (data) => setCouriers(prev => {
    const meName = profileData?.name || user?.name || "Usuario";
    const without = prev.filter(c => c.userName !== meName);
    return [...without, { id: "cou_" + Date.now(), userName: meName, status: "pending", createdAt: Date.now(), ...data }];
  });
  // El mensajero acepta una entrega disponible
  const acceptDelivery = (orderId, fee) => {
    const meName = profileData?.name || user?.name || "Usuario";
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId || o.courierName) return o;
      const baseFee = o.deliveryCost || o.shipPrice || o.shipCost || 0;
      const newFee = (fee != null && fee > 0) ? Math.round(fee) : baseFee;
      if (newFee > baseFee) {
        // El mensajero propone una tarifa mayor → necesita aprobación del comprador.
        pushNotif(o.buyerId || o.buyerName, `Tu mensajero propone un domicilio de ${newFee} CUP (estimado: ${baseFee}). Apruébalo para continuar.`, o.id);
        return { ...o, courierName: meName, courierAcceptedAt: Date.now(), proposedFee: newFee, baseFee, feeApproval: "pending", courierStage: "propuesta", history: [...(o.history || []), { key: "propuesta", label: "Tarifa propuesta", at: Date.now(), note: `${meName} propone ${newFee} CUP de domicilio` }] };
      }
      const idx = (o.flow || []).findIndex(s => s.key === "asignado");
      return { ...o, courierName: meName, courierStage: "aceptado", courierAcceptedAt: Date.now(), deliveryCost: newFee, stepIdx: idx >= 0 ? Math.max(o.stepIdx || 0, idx) : (o.stepIdx || 0), history: [...(o.history || []), { key: "asignado", label: "Mensajero asignado", at: Date.now(), note: `Aceptado por ${meName}` }] };
    }));
  };
  // El mensajero libera una entrega → vuelve a estar disponible para otro.
  const cancelDelivery = (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const idx = (o.flow || []).findIndex(s => s.key === "confirmado");
      return { ...o, courierName: null, courierStage: null, proposedFee: null, baseFee: null, feeApproval: null, stepIdx: idx >= 0 ? Math.min(o.stepIdx || 0, idx) : (o.stepIdx || 0), history: [...(o.history || []), { key: "liberado", label: "Entrega liberada", at: Date.now(), note: "El mensajero liberó la entrega. Disponible de nuevo." }] };
    }));
  };
  // El comprador aprueba o rechaza la tarifa propuesta por el mensajero.
  const buyerApproveFee = (orderId, ok) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      if (ok) {
        const idx = (o.flow || []).findIndex(s => s.key === "asignado");
        pushNotif(o.courierName, "El comprador aprobó tu tarifa. ¡Ya puedes recoger!", o.id);
        return { ...o, deliveryCost: o.proposedFee || o.deliveryCost, feeApproval: "approved", courierStage: "aceptado", stepIdx: idx >= 0 ? Math.max(o.stepIdx || 0, idx) : (o.stepIdx || 0), history: [...(o.history || []), { key: "asignado", label: "Mensajero asignado", at: Date.now(), note: `Tarifa de ${o.proposedFee} CUP aprobada` }] };
      }
      pushNotif(o.courierName, "El comprador rechazó la tarifa propuesta. El pedido volvió a estar disponible.", o.id);
      return { ...o, courierName: null, courierStage: null, proposedFee: null, feeApproval: "rejected", history: [...(o.history || []), { key: "rechazo", label: "Tarifa rechazada", at: Date.now(), note: "El comprador rechazó la tarifa. Disponible de nuevo." }] };
    }));
  };
  // El mensajero avanza su etapa: recogido → en_camino → entregado → cobrado → completado
  const courierStage = (orderId, stage) => {
    const flowKey = { recogido: "recogido", en_camino: "en_ruta", entregado: "entregado", completado: "entregado" }[stage];
    const label = { recogido: "Artículo recogido", en_camino: "En camino", entregado: "Entregado", cobrado: "Pago cobrado", completado: "Entrega completada" }[stage] || stage;
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      let stepIdx = o.stepIdx || 0;
      if (flowKey) { const idx = (o.flow || []).findIndex(s => s.key === flowKey); if (idx >= 0) stepIdx = Math.max(stepIdx, idx); }
      return { ...o, courierStage: stage, stepIdx, status: stage === "completado" ? "completado" : (flowKey || o.status), history: [...(o.history || []), { key: stage, label, at: Date.now(), note: "" }] };
    }));
  };
  // MODO PRUEBA: dueño siempre true para que puedas entrar al panel sin cuentas.
  // En producción: ligado al correo del dueño (o a un permiso/rol del usuario).
  const isOwner = true;
  // Configuración editable de la plataforma (controlada desde el panel admin, persiste)
  const [adminCfg, setAdminCfg] = useState(() => {
    const defaults = {
      commissionPct: 10, commissionActive: true,
      commDeliveryPct: 15, commIntlPct: 10, commServicePct: 12, commVipPct: 10,
      localBase: 150, localPerKm: 25,
      deliveryServiceActive: true,
      deliveryCurrency: "CUP", deliveryMinKm: 1,
      courierAdjustMaxPct: 30,
      surgeActive: false, surgeIntervalMin: 30, surgeStepPct: 15, surgeCapPct: 60,
      rates: { "España": { aereo: 12, maritimo: 5 }, "Estados Unidos": { aereo: 14, maritimo: 6 } },
      fx: { usdToCup: 400, eurToCup: 430 },
      promos: [{ id: 1, text: "Envío gratis en tu primer pedido", active: true }],
      plans: [
        { id: 'basico', name: 'Básico', price: 0, promo: false, promoPrice: 0, features: ['Publicar productos', 'Vender con comisión estándar', 'Chat con compradores'] },
        { id: 'pro', name: 'Pro', price: 5, promo: false, promoPrice: 0, features: ['Todo lo del Básico', 'Menos comisión por venta', 'Insignia Pro', 'Estadísticas de ventas'] },
        { id: 'premium', name: 'Premium', price: 12, promo: false, promoPrice: 0, features: ['Todo lo del Pro', 'Aparecer en Tiendas Premium', 'Soporte prioritario', 'Destacar productos'] },
      ],
      team: [],
    };
    try { const r = localStorage.getItem("retador_admincfg"); if (r) return { ...defaults, ...JSON.parse(r) }; } catch {}
    return defaults;
  });
  useEffect(() => { try { localStorage.setItem("retador_admincfg", JSON.stringify(adminCfg)); } catch {} }, [adminCfg]);
  const [buyModal,   setBuyModal]   = useState(null);
  const [plusMenu,   setPlusMenu]   = useState(null); // { top, right } posición del dropdown
  const [subOpenCreate, setSubOpenCreate] = useState(false); // abre CreateAuction directo
  const [profileData, setProfileData] = useState({ avatar:{ type:"emoji", value:"😊" }, name:"Usuario Demo", username:"usuario_demo", rating:4.9, sales:60 });

  // Productos y búsqueda - Productos ya cargados
  const [products,  setProducts]  = useState([]); // productos REALES del backend
  const [loading,   setLoading]   = useState(true);
  // Cargar productos reales al iniciar (sin login: política pública active+approved).
  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadProducts()
      .then(list => { if (alive) setProducts(list); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  // Cargar TASAS DE CAMBIO reales del backend (lectura pública, sin login) y
  // volcarlas en la config (usdToCup / eurToCup) para que toda la app las use.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("exchange_rates")
          .select("from_currency,to_currency,rate");
        if (error) throw error;
        if (!alive || !data) return;
        const find = (f, t) => data.find(r => r.from_currency === f && r.to_currency === t)?.rate;
        const usdToCup = Number(find("USD", "CUP"));
        const eurToCup = Number(find("EUR", "CUP"));
        if (usdToCup > 0 || eurToCup > 0) {
          setAdminCfg(prev => ({
            ...prev,
            fx: {
              usdToCup: usdToCup > 0 ? usdToCup : (prev.fx?.usdToCup ?? 400),
              eurToCup: eurToCup > 0 ? eurToCup : (prev.fx?.eurToCup ?? 430),
            },
          }));
        }
      } catch (err) {
        console.error("Tasas de cambio:", err?.message || err);
      }
    })();
    return () => { alive = false; };
  }, []);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("TODOS");
  // Navegación desde botones de bloques publicados en el Editor Visual
  const navTo = (dest) => {
    if (!dest) return;
    if (dest === "inicio") { setTab("market"); setMScr("home"); }
    else if (dest === "busqueda") { setTab("search"); }
    else if (dest === "delivery_local") { setTab("envios"); setEScr("local"); }
    else if (dest === "delivery_intl") { setTab("envios"); setEScr("intl"); }
    else if (dest === "subastas") { setTab("subastas"); }
    else if (dest === "ofertas") { setTab("market"); setMScr("home"); setFilter("OFERTAS"); }
    else if (dest === "mas_vendidos") { setTab("market"); setMScr("home"); setFilter("RECOMENDADO"); }
    else if (dest === "nuevos") { setTab("market"); setMScr("home"); setFilter("NUEVO"); }
  };
  const [activeCat, setActiveCat] = useState(null);
  const [favorites, setFavorites] = useState(() => { try { const r = localStorage.getItem("retador_favs"); if (r) return new Set(JSON.parse(r)); } catch {} return new Set(); });
  useEffect(() => { try { localStorage.setItem("retador_favs", JSON.stringify([...favorites])); } catch {} }, [favorites]);

  // App-level appearance — persiste en localStorage
  const [appTheme, setAppTheme] = useState(() => {
    try { return localStorage.getItem("retador_theme") || "auto"; } catch { return "auto"; }
  });
  const [appTextScale, setAppTextScale] = useState(() => {
    try { const v = localStorage.getItem("retador_txt_scale"); return v ? parseFloat(v) : 1; } catch { return 1; }
  });

  // Densidad visual → normalización por ANCHO DE DISEÑO.
  // En móvil la app se maqueta SIEMPRE a un ancho virtual fijo por modo y se escala
  // para caber en cada pantalla, de modo que todo teléfono renderiza el MISMO layout.
  // Esto resuelve que el POCO F7 (menos px CSS) se viera apretado y rectangular,
  // mientras el Note 11 se veía aireado: ahora ambos rinden idéntico.
  const { mode: densMode, tokens: densTok } = useDensity();
  let densZoom = rsp.isMobile
    ? (rsp.w / (densTok.designW || 408))
    : (densTok.fixedZoom || 1);
  // Tamaño del texto: magnifica TODA la app proporcionalmente. Como el 96% de los
  // tamaños de fuente son fijos, escalarlo aquí (sobre el zoom global) es lo que hace
  // que el ajuste de texto funcione en cada pantalla sin romper ningún layout.
  densZoom = densZoom * (appTextScale || 1);
  densZoom = Math.max(0.5, Math.min(2.0, densZoom));

  // Nav inferior estilo Facebook: se oculta al hacer scroll hacia abajo y reaparece
  // al subir. Detecta el scroll de cualquier pantalla via captura.
  const [navHidden, setNavHidden] = useState(false);
  const navScrollRef = useRef(0);
  const handleNavScroll = useCallback((e) => {
    const el = e.target;
    if (!el || typeof el.scrollTop !== "number") return;
    const st = el.scrollTop;
    const last = navScrollRef.current;
    if (st > last + 8 && st > 56) setNavHidden(true);          // bajando → ocultar
    else if (st < last - 8 || st <= 4) setNavHidden(false);    // subiendo → mostrar
    navScrollRef.current = st < 0 ? 0 : st;
  }, []);
  useEffect(() => { setNavHidden(false); navScrollRef.current = 0; }, [tab, mScr, pScr, eScr]);

  const effectiveTheme = appTheme === "auto"
    ? (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : appTheme;
  // ts queda en 1: el escalado de texto se aplica de forma global (arriba), evitando
  // doble escala en los pocos componentes que multiplicaban por ts.
  const appTk = { ...(effectiveTheme === "light" ? LIGHT_T : DARK_T), imgScale: densZoom, ts: 1 };

  const changeTheme = (t) => {
    setAppTheme(t);
    try { localStorage.setItem("retador_theme", t); } catch {}
  };
  const changeTextScale = (s) => {
    setAppTextScale(s);
    try { localStorage.setItem("retador_txt_scale", String(s)); } catch {}
  };

  // Aplica el zoom de densidad a toda la plataforma y lo actualiza al cambiar de modo
  useEffect(() => {
    document.documentElement.style.zoom = String(densZoom);
    document.documentElement.style.setProperty("--img-s", String(densZoom));
    return () => {
      document.documentElement.style.zoom = "1";
      document.documentElement.style.removeProperty("--img-s");
    };
  }, [densZoom]);

  // Config local
  const [cfg, setCfg] = useState({ priceKm: 50, priceKg: 15, adminPass: "", espanaAereo: 15, espanaMaritimo: 10, usaAereo: 18, usaMaritimo: 12 });
  
  // Banners state
  const [banners, setBanners] = useState([
    // { id: 1, title: "Banner ejemplo", image: "url", active: false }
  ]);

  const flash = (msg, dur = 3200) => { setToast(msg); setTimeout(() => setToast(null), dur); };
  const saveCfg = nc => { setCfg(nc); };
  const requireAuth = action => { action(); return true; }; // Siempre autorizado - solo visual
  const refreshUser = () => {}; // No-op en versión visual

  const handleSignOut = () => {
    // En versión visual, solo resetea a la pantalla principal
    flash("👋 Sesión cerrada (demo)");
  };

  const handlePublish = d => {
    const meName = profileData?.name || user?.name || "Usuario";
    const meId = user?.id || meName;
    const newProduct = { ...d, id: Date.now(), seller_id: meId, seller_name: meName, image: d.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" };
    setProducts(prev => [newProduct, ...prev]);
    flash("✅ Producto publicado — visible para todos");
  };

  const handleDelete = id => {
    setProducts(prev => prev.filter(p => p.id !== id));
    flash("🗑️ Eliminado");
  };

  const openChat = (otherId, otherName) => {
    registerPerson(otherId || otherName, otherName);
    setSelChat({ otherId, otherName });
    setShowChats(true); // overlay — no cambia tab, preserva el producto activo
  };

  // Chat libre: cualquiera puede escribir desde cualquier lugar. Capturamos la información igual.
  const [orders, setOrders] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_orders') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_orders', JSON.stringify(orders)); } catch {} }, [orders]);
  const [verifications, setVerifications] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_verifs') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_verifs', JSON.stringify(verifications)); } catch {} }, [verifications]);
  const addVerification = (v) => setVerifications(prev => [{ id: 'ver_' + Date.now(), state: 'pending', at: Date.now(), ...v }, ...prev.filter(x => x.userName !== v.userName || x.state !== 'pending')]);
  const [payments, setPayments] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_payments') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_payments', JSON.stringify(payments)); } catch {} }, [payments]);
  const [verifiedUsers, setVerifiedUsers] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_verified') || '[]'); } catch { return []; } });
  const [accountPassword, setAccountPassword] = useState(() => { try { return localStorage.getItem('retador_password') || ''; } catch { return ''; } });
  useEffect(() => { try { if (accountPassword) localStorage.setItem('retador_password', accountPassword); } catch {} }, [accountPassword]);
  // Equipo y permisos: miembros con secciones delegadas
  const [teamMembers, setTeamMembers] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_team') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_team', JSON.stringify(teamMembers)); } catch {} }, [teamMembers]);
  useEffect(() => { try { localStorage.setItem('retador_verified', JSON.stringify(verifiedUsers)); } catch {} }, [verifiedUsers]);
  const [userPlans, setUserPlans] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_userplans') || '{}'); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem('retador_userplans', JSON.stringify(userPlans)); } catch {} }, [userPlans]);
  const [reports, setReports] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_reports') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_reports', JSON.stringify(reports)); } catch {} }, [reports]);
  const addReport = (rep) => setReports(prev => [{ id: 'rep_' + Date.now(), state: 'pending', at: Date.now(), ...rep }, ...prev]);
  const [planRequests, setPlanRequests] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_planreq') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_planreq', JSON.stringify(planRequests)); } catch {} }, [planRequests]);
  const addPlanRequest = (req) => setPlanRequests(prev => [{ id: 'plq_' + Date.now(), state: 'pending', at: Date.now(), ...req }, ...prev]);
  // Solicitudes de promoción (destacar subasta / acceso VIP) que el dueño aprueba y cobra manual
  const [promoRequests, setPromoRequests] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_promoreq') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_promoreq', JSON.stringify(promoRequests)); } catch {} }, [promoRequests]);
  const addPromoRequest = (req) => setPromoRequests(prev => [{ id: 'prm_' + Date.now(), state: 'pending', at: Date.now(), ...req }, ...prev]);
  const [selOrderId, setSelOrderId] = useState(null);
  const addOrder = (order) => {
    if (!order) return null;
    registerPerson(order.sellerId || order.sellerName, order.sellerName);
    const flow = ORDER_FLOW[order.shipMode] || ORDER_FLOW.local;
    const enriched = {
      ...order,
      shipType: order.shipMode || "local",
      flow,
      stepIdx: 0,
      status: flow[0].key,
      commissionPct: (adminCfg.commissionActive === false ? 0 : (order.cat === "servicios" ? (adminCfg.commServicePct ?? 12) : (adminCfg.commissionPct ?? 10))), // productos vs servicios, configurable y activable desde el panel
      history: [{ key: flow[0].key, label: flow[0].label, at: order.createdAt || Date.now(), note: "Pedido creado correctamente." }],
    };
    setOrders(prev => [enriched, ...prev]);
    return enriched;
  };
  const advanceOrder = (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const last = (o.flow?.length || 1) - 1;
      const next = Math.min(last, (o.stepIdx || 0) + 1);
      if (next === o.stepIdx) return o;
      const step = o.flow[next];
      return { ...o, stepIdx: next, status: step.key, history: [...(o.history || []), { key: step.key, label: step.label, at: Date.now(), note: "" }] };
    }));
  };
  const hasOrderWith = (sellerKey) => !!sellerKey && orders.some(o => o.sellerId === sellerKey || o.sellerName === sellerKey);
  // Avisos/notificaciones (persistentes)
  const [notifs, setNotifs] = useState(() => { try { return JSON.parse(localStorage.getItem("retador_notifs") || "[]"); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem("retador_notifs", JSON.stringify(notifs)); } catch {} }, [notifs]);
  const pushNotif = (to, text, orderId) => setNotifs(prev => [{ id: "n" + Date.now() + Math.random().toString(36).slice(2, 6), to, text, orderId, at: Date.now(), read: false }, ...prev].slice(0, 120));
  useEffect(() => { try { localStorage.setItem("retador_notifs", JSON.stringify(notifs)); } catch (e) {} }, [notifs]);
  const myIds = [user?.id, user?.name, profileData?.name].filter(Boolean);
  const myNotifs = notifs.filter(n => n.to != null && myIds.includes(n.to));
  const unreadNotif = myNotifs.filter(n => !n.read).length;
  const markNotifRead = id => setNotifs(prev => prev.map(n => id == null ? { ...n, read: true } : (n.id === id ? { ...n, read: true } : n)));
  // Coreografía de 3 partes
  const sellerConfirmOrder = (orderId) => {
    setOrders(prev => prev.map(o => { if (o.id !== orderId) return o; const idx = (o.flow || []).findIndex(s => s.key === "confirmado"); return { ...o, sellerConfirmed: true, stepIdx: idx >= 0 ? Math.max(o.stepIdx || 0, idx) : (o.stepIdx || 0), status: "confirmado", history: [...(o.history || []), { key: "confirmado", label: "Confirmado por el vendedor", at: Date.now() }] }; }));
    const o = orders.find(x => x.id === orderId); if (o) pushNotif(o.delivery?.name || o.buyerName, "Tu pedido fue confirmado por el vendedor. Buscando mensajero.", orderId);
    flash("✅ Pedido confirmado — disponible para mensajeros");
  };
  const buyerConfirmReceipt = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, buyerConfirmed: true, history: [...(o.history || []), { key: "recibido", label: "Comprador confirmó recepción", at: Date.now() }] } : o));
    const o = orders.find(x => x.id === orderId); if (o) { pushNotif(o.sellerName, "El comprador confirmó que recibió el producto.", orderId); if (o.courierName) pushNotif(o.courierName, "El comprador confirmó la recepción.", orderId); }
    flash("✅ Confirmaste la recepción");
  };
  const sellerConfirmPayment = (orderId, ok) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      if (!ok) return { ...o, courierStage: "fallido", status: "fallido", history: [...(o.history || []), { key: "fallido", label: "Sin pago — entrega fallida", at: Date.now() }] };
      const idx = (o.flow || []).findIndex(s => s.key === "entregado");
      return { ...o, courierStage: "completado", sellerPaid: true, stepIdx: idx >= 0 ? Math.max(o.stepIdx || 0, idx) : (o.stepIdx || 0), status: "entregado", history: [...(o.history || []), { key: "pago_ok", label: "Vendedor confirmó el pago", at: Date.now() }] };
    }));
    const o = orders.find(x => x.id === orderId);
    if (o && o.courierName) pushNotif(o.courierName, ok ? "El vendedor confirmó el pago. Entrega cerrada ✅" : "El vendedor reportó que no hubo pago. Devuelve el producto.", orderId);
    flash(ok ? "✅ Pago confirmado — entrega cerrada" : "⚠️ Marcado como sin pago");
  };
  const requestChat = (sellerId, sellerName) => openChat(sellerId, sellerName); // sin bloqueo

  // Mensajes de chat reales (persisten en el navegador)
  const [chatMsgs, setChatMsgs] = useState(() => {
    try { const raw = localStorage.getItem("retador_chatmsgs"); if (raw) return JSON.parse(raw); } catch {}
    return {};
  });
  useEffect(() => { try { localStorage.setItem("retador_chatmsgs", JSON.stringify(chatMsgs)); } catch {} }, [chatMsgs]);
  // Registro de nombres por persona, para conversaciones aunque no haya pedido todavía.
  const [chatPeople, setChatPeople] = useState(() => {
    try { const raw = localStorage.getItem("retador_chatpeople"); if (raw) return JSON.parse(raw); } catch {}
    return {};
  });
  useEffect(() => { try { localStorage.setItem("retador_chatpeople", JSON.stringify(chatPeople)); } catch {} }, [chatPeople]);
  // Usuarios bloqueados y conversaciones eliminadas (persistentes)
  const [blockedUsers, setBlockedUsers] = useState(() => { try { return JSON.parse(localStorage.getItem("retador_blocked") || "[]"); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem("retador_blocked", JSON.stringify(blockedUsers)); } catch {} }, [blockedUsers]);
  const [deletedConvs, setDeletedConvs] = useState(() => { try { return JSON.parse(localStorage.getItem("retador_delconvs") || "[]"); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem("retador_delconvs", JSON.stringify(deletedConvs)); } catch {} }, [deletedConvs]);
  const toggleBlock = (key, name) => setBlockedUsers(prev => prev.some(b => b.key === String(key)) ? prev.filter(b => b.key !== String(key)) : [...prev, { key: String(key), name: name || "Usuario" }]);
  const deleteConv = (key) => setDeletedConvs(prev => prev.includes(String(key)) ? prev : [...prev, String(key)]);
  function registerPerson(key, name) {
    if (!key) return;
    const k = String(key);
    setChatPeople(prev => (prev[k] === (name || "Vendedor")) ? prev : ({ ...prev, [k]: name || "Vendedor" }));
  }
  const sendChatMsg = (key, text) => {
    if (!key || !text || !text.trim()) return;
    const m = { id: Date.now(), me: true, text: text.trim(), time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) };
    setChatMsgs(prev => ({ ...prev, [key]: [...(prev[key] || []), m] }));
  };

  const toggleFav = (productId) => {
    const isFav = favorites.has(productId);
    const next = new Set(favorites);
    if (isFav) {
      next.delete(productId);
      flash("💔 Eliminado de favoritos");
    } else {
      next.add(productId);
      flash("❤️ Añadido a favoritos");
    }
    setFavorites(next);
  };

  const handleBuy = (product) => {
    setBuyModal(product);
  };

  const marketVisible = products.filter(p => {
    const q = search.toLowerCase();
    const ms = !q || p.title?.toLowerCase().includes(q) || p.cat?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const mf = filter === "TODOS"
      || (filter === "OFERTAS"      && p.orig_price)
      || (filter === "NUEVO"        && p.badge === "NUEVO")
      || (filter === "RECOMENDADO"  && p.badge === "RECOMENDADO")
      || (filter === "FAVORITOS"    && favorites.has(p.id));
    return ms && mf;
  });

  return (
    <AppThCtx.Provider value={appTk}>
    <RCtx.Provider value={rsp}>
    <div style={{ fontFamily: "'Barlow',sans-serif", background: appTk.BG, color: appTk.T1, height: `calc(100dvh / ${densZoom})`, width: `calc(100vw / ${densZoom})`, overflow: "hidden", position: "relative", display: "flex", flexDirection: rsp.isDesktop ? "row" : "column" }}>

      {/* Sidebar nav – solo desktop */}
      {rsp.isDesktop && (
        <div style={{ width: 220, flexShrink: 0, background: appTk.isDark ? "#060606" : appTk.CARD, borderRight: `1px solid ${appTk.B}`, display: "flex", flexDirection: "column", padding: "28px 0 20px" }}>
          <div style={{ padding: "0 24px 28px" }}><Logo size={20} /></div>
          {[
            { id: "market", ic: "store",  label: "Tienda" },
            { id: "search", ic: "search", label: "Buscar" },
            { id: "envios", ic: "truck",  label: "Envíos" },
            { id: "perfil", ic: "user",   label: "Perfil" },
          ].map(it => {
            const active = tab === it.id;
            return (
              <button key={it.id} onClick={() => { setTab(it.id); if (it.id === "market") setMScr("home"); if (it.id === "envios") setEScr("menu"); if (it.id === "perfil") setPScr("main"); }} className="p"
                style={{ background: active ? `${G}12` : "none", border: "none", borderLeft: `3px solid ${active ? G : "transparent"}`, display: "flex", alignItems: "center", gap: 13, padding: "13px 22px", transition: "all 0.18s", cursor: "pointer" }}>
                {it.ic === "search" ? (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ color: active ? G : appTk.T3, flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="8" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <Ic n={it.ic} c={active ? G : appTk.T3} s={19} />
                )}
                <span style={{ fontSize: 8, fontWeight: active ? 700 : 600, color: active ? G : appTk.T3 }}>{it.label}</span>
                {it.id === "perfil" && unread > 0 && (
                  <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#000" }}>{unread > 9 ? "9+" : unread}</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenido principal */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", maxWidth: rsp.isDesktop ? "none" : rsp.isTablet ? "none" : "100%" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: rsp.isDesktop ? 30 : 90, left: "50%", transform: "translateX(-50%)", background: effectiveTheme === "dark" ? "#191919" : "#ffffff", color: effectiveTheme === "dark" ? "#fff" : "#161616", border: `1px solid ${effectiveTheme === "dark" ? B : "rgba(0,0,0,.08)"}`, borderRadius: 50, padding: "10px 20px", fontSize: 11, fontWeight: 600, zIndex: 800, whiteSpace: "nowrap", boxShadow: effectiveTheme === "dark" ? "0 8px 28px rgba(0,0,0,.9)" : "0 8px 28px rgba(0,0,0,.18)", animation: "tst .26s ease both", maxWidth: "90vw" }}>
          {toast}
        </div>
      )}

      {editProd && <EditProductModal product={editProd} onClose={() => setEditProd(null)} onSave={(changes) => { updateProduct(editProd.id, changes); setEditProd(null); }} flash={flash} />}
      {confirmCfg && (
        <div onClick={() => setConfirmCfg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 5300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: effectiveTheme === "dark" ? "#161618" : "#fff", borderRadius: 18, padding: "22px 20px", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: effectiveTheme === "dark" ? "#f0f0f2" : "#1a1a1a", marginBottom: 18, lineHeight: 1.4 }}>{confirmCfg.msg}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmCfg(null)} style={{ flex: 1, height: 44, borderRadius: 11, border: `1px solid ${effectiveTheme === "dark" ? "#333" : "#e0e0e0"}`, background: "transparent", color: effectiveTheme === "dark" ? "#f0f0f2" : "#1a1a1a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => { confirmCfg.onYes && confirmCfg.onYes(); setConfirmCfg(null); }} style={{ flex: 1, height: 44, borderRadius: 11, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      {showCats   && <CatModal onClose={() => setShowCats(false)} onSelect={cat => { setActiveCat(cat); setShowCats(false); }} active={activeCat} />}
      {pubOpen    && <PubSheet onClose={() => setPubOpen(false)} onPublish={async d => { setPubOpen(false); await handlePublish(d); }} user={user} flash={flash} />}
      {showNotif  && <NotifPanel onClose={() => { markNotifRead(null); setShowNotif(false); }} notifs={myNotifs} onRead={markNotifRead} onOpenOrder={(oid) => { setShowNotif(false); markNotifRead(null); setSelOrderId(oid); setTab("perfil"); setPScr("order-detail"); }} />}
      {showChats  && <ChatsModal onClose={() => setShowChats(false)} initial={selChat} orders={orders} chatMsgs={chatMsgs} chatPeople={chatPeople} onSend={sendChatMsg} user={user} blockedUsers={blockedUsers} onToggleBlock={toggleBlock} deletedConvs={deletedConvs} onDeleteConv={deleteConv} flash={flash} />}
      {showWallet && (() => {
        const meName = profileData?.name || user?.name || "Usuario";
        const meUser = { name: meName, username: "@" + meName.toLowerCase().replace(/[^a-z0-9]/g, ""), omegaId: "RT-" + String(Math.abs([...meName].reduce((a, c) => a + c.charCodeAt(0), 0)) * 7).padStart(6, "0"), phone: profileData?.phone || "—", verifiedSince: verifiedUsers.includes(meName) ? "Cuenta verificada" : "Sin verificar" };
        // Contactos = otros usuarios conocidos (vendedores de productos)
        const seen = new Set([meName]);
        const contacts = [];
        products.forEach(p => { const n = p.seller_name; if (n && !seen.has(n)) { seen.add(n); contacts.push({ id: "u_" + n, name: n, username: "@" + String(n).toLowerCase().replace(/[^a-z0-9]/g, "") }); } });
        // Órdenes por pagar = las mías aún no pagadas por billetera
        const payable = orders.filter(o => !o.paidViaWallet).map(o => ({ id: o.id, vendor: o.sellerName || "Vendedor", item: o.title || "Pedido", amount: (Number(o.amount) || 0) + (Number(o.shipPrice) || 0), currency: o.currency || "CUP" }));
        // Tasas desde el panel de admin (Economía → FX): única fuente de verdad
        const fx = adminCfg.fx || { usdToCup: 400, eurToCup: 430 };
        const usdCup = Number(fx.usdToCup) || 400, eurCup = Number(fx.eurToCup) || 430;
        const walletRates = { base: "USD", updatedAt: Date.now(), rates: { USD: 1, EUR: +(usdCup / eurCup).toFixed(4), CUP: usdCup } };
        return <div style={{ position: "fixed", inset: 0, zIndex: 4000, overflow: "hidden", background: effectiveTheme === "dark" ? "#0a0a0a" : "#f1f5f9" }}>
          <WalletApp user={meUser} contacts={contacts} orders={payable} rates={walletRates} dark={effectiveTheme === "dark"} onClose={() => setShowWallet(false)}
            onOrderPaid={(orderId) => setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paidViaWallet: true, status: o.status === "pendiente" || o.stepIdx === 0 ? (o.flow?.[1]?.key || o.status) : o.status } : o))} />
        </div>;
      })()}
      {showTools && (() => {
        const meName = profileData?.name || user?.name || "Usuario";
        const myPlan = (userPlans || {})[meName];
        const isPremium = isOwner || (myPlan && /prem|pro|vip|plus/i.test(String(myPlan)));
        const dark = effectiveTheme === "dark";
        const onPublish = (prod) => {
          if (!prod) return;
          const parts = String(prod.category || "").split("/").map(s => s.trim());
          const catName = parts[0] || "", subName = parts[1] || "";
          let realCats = []; try { realCats = JSON.parse(localStorage.getItem("retador_cats") || "[]"); } catch {}
          const found = realCats.find(c => (c.name || "").toLowerCase() === catName.toLowerCase());
          const imgs = (prod.userImages && prod.userImages.length) ? prod.userImages : (prod.images || []);
          handlePublish({
            title: prod.title || "Producto importado",
            price: Math.round(prod.suggestedPrice || prod.originPrice || 0),
            description: prod.description || "",
            cat: found ? found.id : "electronica", subcat: subName || undefined,
            image: imgs[0] || undefined, images: imgs,
            cost_price: prod.costPrice ?? prod.originPrice, currency: prod.currency || "EUR",
          });
          setToolApp(false); setShowTools(false);
        };
        if (toolApp) {
          return <div style={{ position: "fixed", top: 0, left: 0, zIndex: 4000, width: `calc(100vw / ${densZoom})`, height: `calc(100dvh / ${densZoom})`, overflowY: "auto", WebkitOverflowScrolling: "touch", background: "#07070A" }}>
            <ProductToolsApp onClose={() => setToolApp(false)} onPublish={onPublish} canUse={isPremium} />
          </div>;
        }
        const bg = dark ? "#0a0a0a" : "#f1f5f9", card = dark ? "#141417" : "#ffffff", t1 = dark ? "#f0f0f2" : "#0f172a", t2 = dark ? "#9494a0" : "#64748b", bd = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
        return <div style={{ position: "fixed", top: 0, left: 0, zIndex: 4000, width: `calc(100vw / ${densZoom})`, height: `calc(100dvh / ${densZoom})`, overflowY: "auto", WebkitOverflowScrolling: "touch", background: bg, padding: "18px 16px 40px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <button onClick={() => setShowTools(false)} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>‹ Volver a RETADOR</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 23, fontWeight: 800, color: t1, letterSpacing: "-.02em" }}>Herramientas</h1>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#6EE7B7", background: "rgba(110,231,183,.13)", border: "1px solid rgba(110,231,183,.3)", borderRadius: 100, padding: "3px 9px" }}>PLATAFORMA</span>
            </div>
            <p style={{ fontSize: 13, color: t2, marginBottom: 20 }}>Herramientas creadas por RETADOR para impulsar tu negocio.</p>

            <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 18, overflow: "hidden" }}>
              <div style={{ height: 90, background: "linear-gradient(135deg,#6EE7B7,#67E8F9)", position: "relative", display: "flex", alignItems: "center", padding: "0 18px", overflow: "hidden" }}>
                <span style={{ position: "absolute", right: 2, bottom: -26, fontSize: 104, fontWeight: 800, color: "rgba(4,35,26,.16)", lineHeight: 1, pointerEvents: "none", fontFamily: "Georgia, serif" }}>Ω</span>
                <span style={{ fontSize: 38, position: "relative" }}>🔗</span>
                <span style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 800, color: "#064e3b", background: "rgba(255,255,255,.85)", borderRadius: 100, padding: "3px 9px" }}>⚡ PREMIUM</span>
              </div>
              <div style={{ padding: "16px 18px 18px" }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: t1, marginBottom: 6 }}>Importador Inteligente</h2>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: t2, marginBottom: 14 }}>
                  Llena tu tienda en segundos. Pega el enlace de un producto de <b style={{ color: t1 }}>AliExpress</b> y se importa solo con fotos, precio y características — o describe tu producto y la <b style={{ color: t1 }}>IA</b> te arma una publicación elegante, lista para vender, con tu margen de ganancia ya calculado.
                </p>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
                  {["Importa por URL", "Crea con IA", "Calcula tu ganancia"].map(f => (
                    <span key={f} style={{ fontSize: 11, fontWeight: 600, color: t2, background: dark ? "#1c1c22" : "#f1f5f9", borderRadius: 8, padding: "5px 10px" }}>✓ {f}</span>
                  ))}
                </div>
                {isPremium ? (
                  <button onClick={() => setToolApp(true)} style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: "#6EE7B7", color: "#04231a", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Abrir herramienta →</button>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, background: dark ? "#1a1410" : "#fff7ed", border: "1px solid rgba(245,182,0,.3)", borderRadius: 12, padding: "11px 13px", marginBottom: 11 }}>
                      <span style={{ fontSize: 18 }}>🔒</span>
                      <span style={{ fontSize: 12, color: dark ? "#fcd34d" : "#92400e", lineHeight: 1.4 }}>Esta herramienta es del <b>Plan Premium</b>. Suscríbete para usarla sin límites.</span>
                    </div>
                    <button onClick={() => setToolApp(true)} style={{ width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${bd}`, background: "transparent", color: t1, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Probar ahora (demo) →</button>
                    <p style={{ fontSize: 10.5, color: t2, textAlign: "center", marginTop: 8 }}>Modo de prueba mientras se habilitan los planes.</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 14, background: card, border: `1px dashed ${bd}`, borderRadius: 16, padding: "18px", textAlign: "center" }}>
              <span style={{ fontSize: 22, opacity: .5 }}>🧩</span>
              <p style={{ fontSize: 12.5, color: t2, marginTop: 6 }}>Más herramientas en camino.</p>
            </div>
          </div>
        </div>;
      })()}
      {showCourier && (() => {
        const meName = profileData?.name || user?.name || "Usuario";
        const myRecord = couriers.find(c => c.userName === meName) || null;
        return <CourierFlow myRecord={myRecord} dark={effectiveTheme === "dark"} onClose={() => setShowCourier(false)} onSubmit={(data) => { submitCourierApp(data); flash("🛵 Solicitud enviada — en revisión"); }}
          meName={meName} orders={orders} localBase={adminCfg.localBase || 150}
          onAccept={(id, fee) => { acceptDelivery(id, fee); flash(fee ? "✅ Aceptada · tarifa propuesta enviada al comprador" : "✅ Entrega aceptada"); }}
          onStage={(id, st) => { courierStage(id, st); }}
          onCancel={(id) => { cancelDelivery(id); flash("Entrega liberada · disponible de nuevo"); }}
          onReport={(rep) => { addReport(rep); flash("Reporte enviado al equipo de RETADOR"); }} />;
      })()}
      {showAdmin  && <OmniPanel onClose={() => setShowAdmin(false)} theme={appTk} zoom={densZoom} data={{
        orders, cfg: adminCfg,
        onCfg: (patch) => setAdminCfg(c => ({ ...c, ...patch })),
        onOrderAction: (id, action) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: action === 'cancel' ? 'cancelado' : action === 'approve' ? 'confirmado' : o.status, flagged: action === 'flag' ? true : (action === 'cancel' || action === 'approve' ? false : o.flagged) } : o)),
        onDisputeAction: (id, action) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: action === 'resolve' ? 'confirmado' : action === 'freeze' ? 'congelado' : action === 'escalate' ? 'escalado' : o.status, disputeState: action } : o)),
        reports, onReportAction: (id, action) => setReports(prev => prev.map(r => r.id === id ? { ...r, state: action } : r)),
        planRequests, onPlanAction: (id, action) => { setPlanRequests(prev => prev.map(r => { if (r.id === id) { if (action === 'approved') setUserPlans(p => ({ ...p, [r.userName]: r.plan })); return { ...r, state: action }; } return r; })); },
        promoRequests, onPromoAction: (id, action) => setPromoRequests(prev => prev.map(r => r.id === id ? { ...r, state: action } : r)),
        teamMembers, onSaveTeam: setTeamMembers,
        couriers, onCourierAction: (id, status) => setCouriers(prev => prev.map(c => c.id === id ? { ...c, status, reviewedAt: Date.now() } : c)),
        knownUsers: [...new Set(products.map(pr => pr.seller_name).filter(Boolean))].filter(n => n !== (profileData?.name || user?.name)),
        verifications, onVerifyAction: (id, action) => { setVerifications(prev => prev.map(v => { if (v.id === id) { if (action === 'approved' && v.userName) setVerifiedUsers(u => u.includes(v.userName) ? u : [...u, v.userName]); return { ...v, state: action }; } return v; })); },
        payments, onMarkPaid: (sellerName, amount) => setPayments(prev => [{ id: 'pay_' + Date.now(), sellerName, amount, at: Date.now() }, ...prev]),
        plans: adminCfg.plans, verifiedUsers, userPlans,
      }} />}
      {buyModal   && <BuyModal product={buyModal} user={user} onClose={() => setBuyModal(null)} flash={flash} onSuccess={(order) => { setBuyModal(null); const eo = addOrder(order); if (eo) { setSelOrderId(eo.id); setTab("perfil"); setPScr("order-detail"); } }} />}

      {/* Pantallas */}
      <div onScrollCapture={handleNavScroll} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <>
          {tab === "market" && <>
            {mScr === "home" && (
              <MarketHome
                loading={loading} products={marketVisible} filter={filter} setFilter={setFilter}
                search={search} setSearch={setSearch} activeCat={activeCat} setActiveCat={cat => { setActiveCat(cat); }}
                onCats={() => setShowCats(true)}
                onProduct={p => { setSelProd(p); setMScr("product"); }}
                user={user} favorites={favorites} onFav={toggleFav}
                notifCount={unreadNotif} onNotif={() => setShowNotif(true)}
                onPublish={() => setPubOpen(true)}
                onPlusMenu={rect => setPlusMenu(rect)}
                onOpenChats={() => { setSelChat(null); setShowChats(true); }}
                banners={banners}
                onNav={navTo}
              />
            )}
            {mScr === "product" && selProd && (
              <ProductDetail
                product={selProd} onBack={() => {
                  if (prodBackTo === "profile-full") { setProdBackTo(null); setMScr("home"); setTab("perfil"); setPScr("profile-full"); }
                  else if (prodBackTo === "sellerProfile") { setProdBackTo(null); setMScr("sellerProfile"); }
                  else setMScr("home");
                }}
                onDelivery={() => { setTab("envios"); setEScr("local"); }}
                onChat={requestChat} onViewProfile={id => { setSelSeller(id); setMScr("sellerProfile"); }}
                onBuy={handleBuy} onFav={toggleFav} isFav={favorites.has(selProd.id)} canChat={hasOrderWith(selProd.seller_id)}
                onDelete={(selProd.seller_id === (user?.id || user?.name) || selProd.seller_name === (profileData?.name || user?.name)) ? (() => askConfirm("¿Eliminar este producto? No se puede deshacer.", () => { handleDelete(selProd.id); if (prodBackTo === "profile-full") { setProdBackTo(null); setMScr("home"); setTab("perfil"); setPScr("profile-full"); } else setMScr("home"); })) : null}
                onEdit={(selProd.seller_id === (user?.id || user?.name) || selProd.seller_name === (profileData?.name || user?.name)) ? (() => setEditProd(selProd)) : null}
                flash={flash} requireAuth={requireAuth} user={user}
              />
            )}
            {mScr === "sellerProfile" && selSeller && (
              <FreeProfileScreen
                onBack={() => setMScr(selProd ? "product" : "home")}
                user={user}
                initialProfile={{ name: selSeller, username: selSeller }}
                onProfileUpdate={() => {}}
                isOwner={false}
                onChat={requestChat}
                isVerified={verifiedUsers.includes(selSeller)}
                onReport={(p) => addReport({ targetName: p.targetName, reason: p.reason, detail: p.detail, reporterName: user?.name || "Usuario" })}
                userProducts={products.filter(p => p.seller_name === selSeller || p.seller_id === selSeller)}
                onProduct={p => { setSelProd(p); setProdBackTo("sellerProfile"); setMScr("product"); }}
              />
            )}
          </>}

          {tab === "search" && (
            <AdvancedSearch
              products={products}
              onProduct={p => {
                setSelProd(p);
                setTab("market");
                setMScr("product");
              }}
              favorites={favorites}
              onFav={toggleFav}
              onNav={navTo}
            />
          )}

          {tab === "envios" && <>
            {eScr === "menu"  && <EnviosMenu onLocal={() => setEScr("local")} onIntl={() => setEScr("intl")} user={user} requireAuth={requireAuth} />}
            {eScr === "local" && <LocalDelivery onBack={() => setEScr("menu")} flash={flash} cfg={adminCfg} user={user} onNav={navTo} />}
            {eScr === "intl"  && <IntlShipping  onBack={() => setEScr("menu")} flash={flash} cfg={cfg} onNav={navTo} />}
          </>}

          {tab === "subastas" && (
            <SubastasScreen forceCreate={subOpenCreate} onForceCreateDone={() => setSubOpenCreate(false)} onNav={navTo} onPromote={addPromoRequest} sellerName={profileData?.name || user?.name || "Usuario"} />
          )}

          {tab === "perfil" && <>
            {pScr === "main"         && <ProfileMain user={user} onMessages={() => { setSelChat(null); setShowChats(true); }} onSettings={() => setPScr("settings")} onOrders={() => setPScr("orders")} onViewProfile={() => setPScr("profile-full")} onAdmin={() => setShowAdmin(true)} onWallet={() => setShowWallet(true)} onTools={() => setShowTools(true)} onCourier={() => setShowCourier(true)} isOwner={isOwner} profileData={profileData} />}
            {pScr === "profile-full" && (() => {
              const me = profileData?.name || user?.name;
              const accrued = orders.filter(o => (o.sellerName || o.sellerId) === me).reduce((a, o) => a + (o.amount || 0) * ((o.commissionPct ?? adminCfg.commissionPct ?? 10) / 100), 0);
              const paid = payments.filter(p => p.sellerName === me).reduce((a, p) => a + (p.amount || 0), 0);
              const myDebt = Math.max(0, accrued - paid);
              return <FreeProfileScreen onBack={() => setPScr("main")} user={user} initialProfile={profileData} onProfileUpdate={setProfileData} onVerify={(p) => addVerification({ userName: me || "Usuario", ...p })} isVerified={verifiedUsers.includes(me)} onRequestPlan={(plan) => addPlanRequest({ userName: me || "Usuario", plan })} currentPlan={userPlans[me] || "Básico"} plans={adminCfg.plans} myDebt={myDebt} commissionActive={adminCfg.commissionActive !== false} userProducts={products.filter(p => (p.seller_name || p.seller_id) === me)} onProduct={p => { setSelProd(p); setProdBackTo("profile-full"); setTab("market"); setMScr("product"); }} onDeleteProduct={(id) => askConfirm("¿Eliminar este producto? No se puede deshacer.", () => handleDelete(id))} onEditProduct={(p) => setEditProd(p)} />;
            })()}
            {pScr === "messages" && <MessagesScreen user={user} onBack={() => setPScr("main")} onChat={c => { setSelChat(c); setPScr("chat"); }} />}
            {pScr === "chat"     && selChat && <ChatScreen chat={selChat} user={user} onBack={() => setPScr("messages")} flash={flash} />}
            {pScr === "settings" && <SettingsScreen user={user} onBack={() => setPScr("main")} onSignOut={handleSignOut} onUpdate={u => setUser(prev => ({ ...prev, ...u }))} flash={flash} appTheme={appTheme} onThemeChange={changeTheme} appTextScale={appTextScale} onTextScaleChange={changeTextScale}
              profileData={profileData} onProfileUpdate={setProfileData}
              isVerified={verifiedUsers.includes(profileData?.name || user?.name)}
              onRequestVerification={() => setPScr("profile-full")}
              accountPassword={accountPassword} onSetPassword={setAccountPassword}
              blockedUsers={blockedUsers} onToggleBlock={toggleBlock}
              onOpenWallet={() => setShowWallet(true)} orders={orders.filter(o => (o.buyerId ? o.buyerId === user?.id : true))} />}
            {pScr === "orders"   && <OrdersScreen user={user} orders={orders} onBack={() => setPScr("main")} flash={flash} onOpen={(o) => { setSelOrderId(o.id); setPScr("order-detail"); }} />}
            {pScr === "order-detail" && (() => { const o = orders.find(x => x.id === selOrderId); const meName = profileData?.name || user?.name; return o ? <OrderDetailScreen order={o} user={user} me={meName} onBack={() => setPScr("orders")} onAdvance={() => advanceOrder(o.id)} onChat={() => requestChat(o.sellerId, o.sellerName)} onSellerConfirm={() => sellerConfirmOrder(o.id)} onBuyerConfirm={() => buyerConfirmReceipt(o.id)} onSellerPayment={(ok) => sellerConfirmPayment(o.id, ok)} onApproveFee={(ok) => buyerApproveFee(o.id, ok)} flash={flash} /> : <OrdersScreen user={user} orders={orders} onBack={() => setPScr("main")} flash={flash} onOpen={(x) => { setSelOrderId(x.id); setPScr("order-detail"); }} />; })()}
          </>}
        </>
      </div>

      {/* Nav inferior – solo móvil/tablet */}
      {!rsp.isDesktop && (
        <BottomNav tab={tab} unread={unread} hidden={navHidden} onTab={t => {
          setTab(t);
          if (t === "market") setMScr("home");
          if (t === "envios") setEScr("menu");
          if (t === "perfil") setPScr("main");
        }} />
      )}
      </div>

      {/* ── Dropdown del + — renderizado en la raíz, fuera de todo overflow ── */}
      {plusMenu && (
        <>
          <div onClick={() => setPlusMenu(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9000 }} />
          <div style={{
            position: "fixed",
            top: plusMenu.top,
            right: plusMenu.right,
            zIndex: 9001,
            background: appTk.isDark ? "#0e0e0e" : appTk.S,
            border: appTk.isDark ? "1px solid #2a1f00" : `1px solid ${appTk.B}`,
            borderRadius: 14,
            minWidth: 206,
            boxShadow: appTk.isDark ? `0 20px 60px rgba(0,0,0,.98), 0 0 0 1px ${G}18` : `0 12px 40px rgba(24,24,44,.18), 0 0 0 1px ${G}28`,
            overflow: "hidden",
            animation: "dropIn .2s cubic-bezier(.22,.68,0,1.2) both",
          }}>
            <div style={{ padding: "11px 14px 8px", borderBottom: appTk.isDark ? "1px solid #181400" : `1px solid ${appTk.B}` }}>
              <p style={{ fontSize: 8, fontWeight: 800, color: appTk.isDark ? "#4a3800" : appTk.T3, letterSpacing: 1, textTransform: "uppercase" }}>Crear nuevo</p>
            </div>
            <button
              onClick={() => { setPlusMenu(null); setPubOpen(true); }}
              className="p"
              style={{ width: "100%", background: "none", border: "none", padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderBottom: appTk.isDark ? "1px solid #141400" : `1px solid ${appTk.B}` }}
              onMouseEnter={e => e.currentTarget.style.background = appTk.isDark ? "#1a1500" : `${G}14`}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <div style={{ width: 29, height: 29, borderRadius: 10, background: `${G}18`, border: `1px solid ${G}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 8, fontWeight: 700, color: appTk.isDark ? "#e8e8e8" : appTk.T1 }}>Publicar</p>
                <p style={{ fontSize: 8, color: appTk.isDark ? "#3a3a3a" : appTk.T2, marginTop: 1 }}>Vender un producto</p>
              </div>
            </button>
            <button className="p" style={{ width: "100%", background: "none", border: "none", padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              onClick={() => { setPlusMenu(null); setTab("subastas"); setSubOpenCreate(true); }}
              onMouseEnter={e => e.currentTarget.style.background = appTk.isDark ? "#140a1a" : "#E879F914"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <div style={{ width: 29, height: 29, borderRadius: 10, background: "#E879F918", border: "1px solid #E879F930", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ fontSize: 8, fontWeight: 700, color: appTk.isDark ? "#e8e8e8" : appTk.T1 }}>Subastar</p>
                  </div>
                <p style={{ fontSize: 8, color: appTk.isDark ? "#3a3a3a" : appTk.T2, marginTop: 1 }}>Subasta en vivo</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
    </RCtx.Provider>
    </AppThCtx.Provider>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SPLASH
// ═════════════════════════════════════════════════════════════════════════════
function Splash() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse at 50% 38%,#18100a 0%,${BG} 65%)` }}>
      <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(ellipse,rgba(245,184,0,.08) 0%,transparent 68%)` }} />
      <div className="glw" style={{ textAlign: "center", position: "relative" }}>
        <div style={{ lineHeight: .8 }}>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 95, letterSpacing: 7, color: "#fff" }}>RETA</span>
          <span className="dor" style={{ fontFamily: "'Bebas Neue'", fontSize: 49, letterSpacing: 7 }}>DOR</span>
        </div>
        <div style={{ fontSize: 9, letterSpacing: 13, color: "#1e1e1e", fontWeight: 700, marginTop: 6 }}>MARKETPLACE</div>
      </div>
      <div style={{ position: "absolute", bottom: 54, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Spin size={18} />
        <span style={{ fontSize: 8, color: "#1e1e1e", fontWeight: 700, letterSpacing: 2.5 }}>CARGANDO</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LANDING
// ═════════════════════════════════════════════════════════════════════════════
function Landing({ onEnter, onBrowse }) {
  const tk = ["AURICULARES BT", "SMARTWATCH PRO", "ZAPATILLAS", "CAFÉ CUBANO", "CHAQUETA BOMBER", "TECLADO RGB", "PERFUME IMPORTADO", "JOYERÍA"].map(t => `${t}  ◆  `).join("");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: "28%", left: "50%", transform: "translate(-50%,-50%)", width: 420, height: 300, background: `radial-gradient(ellipse,rgba(245,184,0,.08) 0%,transparent 64%)`, pointerEvents: "none" }} />
      <div style={{ padding: "16px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 4, color: "#1e1e1e" }}>RETADOR</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="blk" style={{ width: 5, height: 5, borderRadius: "50%", background: G }} />
          <span style={{ fontSize: 9, color: "#1e1e1e" }}>Beta Pública</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 26px 8px", textAlign: "center" }}>
        <div className="f0" style={{ border: `1.5px solid ${G}`, borderRadius: 100, padding: "6px 18px", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: G, marginBottom: 26, background: `${G}09` }}>⚡ AHORA EN BETA PÚBLICA</div>
        <div className="f1 glw" style={{ lineHeight: .8, marginBottom: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 49, letterSpacing: 5, color: "#fff" }}>RETA</span>
          <span className="dor" style={{ fontFamily: "'Bebas Neue'", fontSize: 49, letterSpacing: 5 }}>DOR</span>
        </div>
        <div className="f2" style={{ fontSize: 9, letterSpacing: 10, color: "#252525", fontWeight: 700, marginBottom: 20 }}>MARKETPLACE</div>
        <div className="f3" style={{ fontSize: 12, color: "#363636", marginBottom: 30 }}>
          Compra.&nbsp;<span style={{ color: G }}>•</span>&nbsp;Vende.&nbsp;<span style={{ color: G }}>•</span>&nbsp;Escala.
        </div>
        <div className="f5" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="p" onClick={onEnter} style={{ width: "100%", background: "#fff", color: "#000", border: "none", borderRadius: 50, padding: "15px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Crear cuenta o iniciar sesión →
          </button>
          <button className="p" onClick={onBrowse} style={{ width: "100%", background: "transparent", color: "#484848", border: `1.5px solid ${B}`, borderRadius: 50, padding: "14px", fontSize: 11, fontWeight: 600 }}>
            Explorar sin cuenta
          </button>
        </div>
      </div>
      <div style={{ padding: "12px 26px", borderTop: `1px solid #131313`, display: "flex", justifyContent: "space-around" }}>
        {[["1200+", "PRODUCTOS"], ["340+", "VENDEDORES"], ["98%", "SATISFACCIÓN"]].map(([n, l]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 19, fontWeight: 900 }}>{n}</div>
            <div style={{ fontSize: 7.5, color: "#8a8a8a", fontWeight: 700, letterSpacing: 2, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#0a0a0a", borderTop: `1px solid #141414`, padding: "7px 0", overflow: "hidden" }}>
        <div className="tkr" style={{ fontSize: 9, color: "#1e1e1e", fontWeight: 700, letterSpacing: 2 }}>{tk}{tk}</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH — email + password
// ═════════════════════════════════════════════════════════════════════════════
function Auth({ onDone, flash }) {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const inp = { width: "100%", background: S, border: `1px solid ${B}`, borderRadius: 14, padding: "14px 16px", color: "#fff", fontSize: 13, outline: "none" };

  const submit = async () => {
    if (!email.trim() || !password.trim()) { flash("⚠️ Completa todos los campos"); return; }
    if (mode === "signup" && !name.trim()) { flash("⚠️ Ingresa tu nombre"); return; }
    if (password.length < 6) { flash("⚠️ Contraseña mínimo 6 caracteres"); return; }
    setLoading(true);
    try {
      let authUser;
      if (mode === "signup") {
        authUser = await authSignUp(email.trim(), password, name.trim());
        if (!authUser) { flash("✅ Revisa tu email para confirmar"); setLoading(false); return; }
      } else {
        authUser = await authSignIn(email.trim(), password);
      }
      const ud = await getUserById(authUser.id);
      onDone(ud || { id: authUser.id, email: authUser.email, name: name || authUser.email?.split("@")[0] || "Usuario", points: 0 });
    } catch (e) {
      const m = e.message || "";
      if (m.includes("Invalid login"))       flash("❌ Email o contraseña incorrectos");
      else if (m.includes("already registered")) flash("❌ Email ya registrado — inicia sesión");
      else if (m.includes("Email not confirmed")) flash("⚠️ Confirma tu email primero");
      else flash("❌ " + m);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 26px" }}>
      <div style={{ marginBottom: 30, textAlign: "center" }}>
        <div style={{ lineHeight: .8, marginBottom: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 56, letterSpacing: 3 }}>RETA</span>
          <span className="dor" style={{ fontFamily: "'Bebas Neue'", fontSize: 56, letterSpacing: 3 }}>DOR</span>
        </div>
        <p style={{ color: "#3e3e3e", fontSize: 11 }}>{mode === "login" ? "Bienvenido de vuelta" : "Únete a RETADOR"}</p>
      </div>
      <div style={{ display: "flex", background: "#0e0e0e", border: `1px solid ${B}`, borderRadius: 50, padding: 4, marginBottom: 22, width: "100%" }}>
        {[["login", "Iniciar sesión"], ["signup", "Crear cuenta"]].map(([m, l]) => (
          <button key={m} onClick={() => setMode(m)} className="p" style={{ flex: 1, background: mode === m ? G : "transparent", color: mode === m ? "#000" : "#3e3e3e", border: "none", borderRadius: 50, padding: "10px", fontSize: 11, fontWeight: 700, transition: "all .2s" }}>{l}</button>
        ))}
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {mode === "signup" && <input style={inp} placeholder="Tu nombre o nombre de tienda" value={name} onChange={e => setName(e.target.value)} />}
        <input style={inp} placeholder="tucorreo@email.com" value={email} onChange={e => setEmail(e.target.value)} type="email" autoCapitalize="none" />
        <input style={inp} placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} type="password" onKeyDown={e => { if (e.key === "Enter") submit(); }} />
      </div>
      <button className="p" onClick={submit} disabled={loading} style={{ width: "100%", background: G, color: "#000", border: "none", borderRadius: 50, padding: "15px", fontSize: 13, fontWeight: 800, marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {loading ? <Spin size={18} color="#000" /> : mode === "login" ? "Entrar →" : "Crear cuenta 🚀"}
      </button>
      {mode === "login" && <p style={{ fontSize: 11, color: "#303030", marginTop: 12, textAlign: "center" }}>¿No tienes cuenta? <span onClick={() => setMode("signup")} style={{ color: G, cursor: "pointer", fontWeight: 700 }}>Regístrate</span></p>}
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// CAT MODAL
// ═════════════════════════════════════════════════════════════════════════════
function CatModal({ onClose, onSelect, active }) {
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
function NotifPanel({ onClose, notifs = [], onRead, onOpenOrder }) {
  const { S, B, CARD, T1, T2, T3, isDark } = useAt();
  const tap = n => { onRead && onRead(n.id); if (n.orderId && onOpenOrder) onOpenOrder(n.orderId); };
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
            <div key={n.id} onClick={() => tap(n)} className="cd" style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 14px", marginBottom: 9, borderRadius: 15, background: n.read ? (isDark ? "#141414" : "#f7f8fa") : (isDark ? "#1a1709" : "#FFFBEC"), border: `1px solid ${n.read ? B : G + "55"}`, cursor: n.orderId ? "pointer" : "default" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: n.read ? (isDark ? "#222" : "#eceef1") : G + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🔔</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: T1, lineHeight: 1.45, fontWeight: n.read ? 500 : 700 }}>{n.text}</p>
                <p style={{ fontSize: 10.5, color: T3, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{new Date(n.at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  {n.orderId && <span style={{ color: G, fontWeight: 700 }}>· Ver pedido ›</span>}
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

function BuyModal({ product, user, onClose, flash, onSuccess }) {
  const { S, B, T1, T2, T3, isDark } = useAt();
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
      const liveLocalBase = (() => { try { const r = localStorage.getItem("retador_admincfg"); if (r) return estimateDeliveryFee(JSON.parse(r), null); } catch (e) {} return 150; })();
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
            const liveLocalBase = (() => { try { const r = localStorage.getItem("retador_admincfg"); if (r) return estimateDeliveryFee(JSON.parse(r), null); } catch (e) {} return 150; })();
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
function AdvancedSearch({ products, onProduct, favorites, onFav, onNav }) {
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const { BG, S, B, CARD, T1, T2, T3, isDark, ts } = useAt();
  const { tokens: dt, mode: dMode } = useDensity();
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [quickFilter, setQuickFilter] = useState("TODOS");

  const { cats, subcats: allSubs } = useCatalog();
  const cat = selectedCat ? cats.find(c => c.id === selectedCat) : null;
  const subcats = selectedCat ? (allSubs[selectedCat] || []) : [];

  const filtered = products.filter(p => {
    const matchCat = !selectedCat || p.cat === selectedCat;
    const matchSearch = !searchText || p.title.toLowerCase().includes(searchText.toLowerCase()) || p.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchQuick = quickFilter === "TODOS"
      || (quickFilter === "OFERTAS"     && p.orig_price)
      || (quickFilter === "NUEVO"       && p.badge === "NUEVO")
      || (quickFilter === "RECOMENDADO" && p.badge === "RECOMENDADO")
      || (quickFilter === "MAS_VENDIDO" && !p.badge);
    return matchCat && matchSearch && matchQuick;
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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

          {/* Tramo: anuncios antes de los filtros */}
          <LiveSlot page="busqueda" from={null} to="bq_f" onNav={onNav} pad="10px 14px 2px" />

          {/* QUICK FILTERS */}
          <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${B}`, display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {[
              { id: "TODOS",      label: "Todos"       },
              { id: "OFERTAS",    label: "🔥 Ofertas"  },
              { id: "NUEVO",      label: "✨ Nuevo"    },
              { id: "RECOMENDADO",label: "⭐ Destac."  },
              { id: "MAS_VENDIDO",label: "🏆 + Vendido"},
            ].map(f => (
              <button key={f.id} onClick={() => setQuickFilter(f.id)} className={`chip ${isDark ? "" : "chip-light"}`}
                style={{ flexShrink: 0, background: quickFilter === f.id ? G : isDark ? "#111" : S, color: quickFilter === f.id ? "#000" : T2, border: `1px solid ${quickFilter === f.id ? G : B}`, padding: "5px 10px", fontSize: 9, fontWeight: 700 }}>
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
              <div className="dx" style={{ display: "grid", gridTemplateColumns: `repeat(${densityCols(dMode, isDesktop, isTablet)}, 1fr)`, gap: dt.grid.gap }}>
                {filtered.map(p => <PCard key={p.id} p={p} onClick={() => onProduct(p)} isFav={favorites.has(p.id)} onFav={onFav} />)}
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
function ChatsModal({ onClose, initial, orders = [], chatMsgs = {}, chatPeople = {}, onSend, user, blockedUsers = [], onToggleBlock, deletedConvs = [], onDeleteConv, flash }) {
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

function MarketHome({ loading, products, filter, setFilter, search, setSearch, activeCat, setActiveCat, onCats, onProduct, user, favorites, onFav, notifCount, onNotif, onPublish, onPlusMenu, onOpenChats, banners, onNav }) {
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const { cats } = useCatalog();
  const { BG, S, B, CARD, T1, T2, T3, isDark, ts } = useAt();
  const { tokens: dt, mode: dMode } = useDensity();
  const plusBtnRef = useRef(null);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${isDark ? "#131313" : B}`, padding: isDesktop ? "8px 36px" : "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
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


      {/* Tramo: lo que pusiste antes de los Filtros (sale arriba, bajo el encabezado) */}
      <LiveSlot page="inicio" from={null} to="in_f" onNav={onNav} />

      {/* Banners - Solo se muestra si hay banners activos */}
      {banners.filter(b => b.active).length > 0 && (
        <div style={{ position: "relative", overflow: "hidden", minHeight: 200 }}>
          {banners.filter(b => b.active).map((banner, i) => (
            <div key={banner.id} style={{ position: "relative", overflow: "hidden", minHeight: 200, marginBottom: i < banners.filter(b => b.active).length - 1 ? 12 : 0 }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${banner.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=50"})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.15) saturate(0.4)" }} />
              <div style={{ position: "absolute", inset: 0, background: isDark ? "linear-gradient(to right,rgba(8,8,8,1) 34%,rgba(8,8,8,.35))" : "linear-gradient(to right,rgba(255,255,255,.97) 34%,rgba(255,255,255,.35))" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: isDark ? "linear-gradient(to top,rgba(8,8,8,1),transparent)" : "linear-gradient(to top,rgba(255,255,255,1),transparent)" }} />
              <div style={{ position: "relative", zIndex: 1, padding: "18px 18px 26px" }}>
                <h2 style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.2, marginBottom: 8, color: "#fff" }}>{banner.title || "Promoción Especial"}</h2>
                {banner.description && <p style={{ color: "#888", fontSize: 11, lineHeight: 1.6, marginBottom: 12, maxWidth: 240 }}>{banner.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros - Ahora con sticky */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: isDark ? "rgba(8,8,8,.98)" : "rgba(255,255,255,.98)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${B}`, padding: "12px clamp(18px,3vw,48px)", display: "flex", gap: 7, overflowX: "auto", boxShadow: isDark ? "0 2px 8px rgba(0,0,0,.3)" : "none" }}>
        {[["TODOS", "🏷️"], ["OFERTAS", "🔥"], ["NUEVO", "✨"], ["RECOMENDADO", "⭐"], ["FAVORITOS", "❤️"]].map(([f, ic]) => (
          <button key={f} onClick={() => setFilter(f)} className={`chip ${isDark ? "" : "chip-light"}`} style={{ flexShrink: 0, background: filter === f ? G : isDark ? "#0e0e0e" : S, color: filter === f ? "#000" : T3, border: `1.5px solid ${filter === f ? G : B}`, padding: "7px 12px", fontSize: 10 * ts, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>{ic} {f}</button>
        ))}
      </div>

      {/* Tramo: lo que pusiste entre los Filtros y los Productos */}
      <LiveSlot page="inicio" from="in_f" to="in_p" onNav={onNav} />

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
            : <div className="dx" style={{ display: "grid", gridTemplateColumns: `repeat(${densityCols(dMode, isDesktop, isTablet)}, 1fr)`, gap: dt.grid.gap }}>
              {products.map(p => <PCard key={p.id} p={p} onClick={() => onProduct(p)} isFav={favorites.has(p.id)} onFav={onFav} />)}
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
function PCard({ p, onClick, isFav, onFav }) {
  const { S, B, T1, T2, ts } = useAt();
  const { cats } = useCatalog();
  const bc  = BC[p.badge] || {};
  const cat = cats.find(c => c.id === p.cat);
  const hasDisc = p.orig_price && parseFloat(p.orig_price) > parseFloat(p.price || 0);
  const disc = hasDisc ? Math.round((1 - parseFloat(p.price) / parseFloat(p.orig_price)) * 100) : 0;

  return (
    <div className="cd" onClick={onClick} style={{ background: S, borderRadius: 15, overflow: "hidden", border: `1px solid ${B}` }}>
      <div style={{ position: "relative", aspectRatio: "4 / 3", background: "#161616", overflow: "hidden" }}>
        <img src={p.img || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"} alt={p.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }}
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"; }} />
        <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,.72)", backdropFilter: "blur(6px)", borderRadius: 100, padding: "3px 8px", fontSize: 9, fontWeight: 700, color: cat ? cat.color + "cc" : "#999" }}>
          {cat?.name?.split(" ")[0] || p.cat}
        </div>
        {p.badge && <div style={{ position: "absolute", top: 7, right: 30, background: bc.bg, borderRadius: 100, padding: "3px 7px", fontSize: 9, fontWeight: 700, color: bc.tx }}>{p.badge}</div>}
        {disc > 0 && <div style={{ position: "absolute", bottom: 7, left: 7, background: "#16A34A", borderRadius: 100, padding: "3px 7px", fontSize: 9, fontWeight: 700, color: "#fff" }}>-{disc}%</div>}
        <button className="p" onClick={e => { e.stopPropagation(); onFav(p.id); }} style={{ position: "absolute", top: 5, right: 5, width: 26, height: 26, background: "rgba(0,0,0,.6)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={isFav ? "#F87171" : "none"} stroke={isFav ? "#F87171" : "#888"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
      </div>
      <div style={{ padding: "9px 10px 11px" }}>
        <p style={{ fontSize: 11 * ts, fontWeight: 600, color: T1, marginBottom: 6, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 * ts, fontWeight: 900, color: G }}>{money(p.price, p.currency)}</span>
          {hasDisc && <span style={{ fontSize: 9 * ts, color: T2, textDecoration: "line-through" }}>{(CURRENCIES[p.currency || "USD"] || CURRENCIES.USD).symbol}{parseFloat(p.orig_price).toLocaleString("es-ES")}</span>}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT DETAIL — carga nombre + trust stats del vendedor
// ═════════════════════════════════════════════════════════════════════════════
function EditProductModal({ product, onClose, onSave, flash }) {
  const { T1, T2, T3, B, CARD, BG, isDark, S } = useAt();
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
  const save = () => {
    if (!title.trim()) { flash && flash("Ponle un título"); return; }
    const parts = catLabel.split("/").map(s => s.trim());
    const found = cats.find(c => (c.name || "").toLowerCase() === (parts[0] || "").toLowerCase());
    onSave({ title: title.trim(), price: Number(price) || 0, description: desc, cat: found ? found.id : product.cat, subcat: parts[1] || undefined, image: imgs[0] || product.image, images: imgs });
    flash && flash("✅ Producto actualizado");
  };
  const lbl = { fontSize: 11, fontWeight: 700, color: T2, marginBottom: 5, display: "block" };
  const inp = { width: "100%", background: isDark ? "#1a1a1a" : "#f5f5f7", color: T1, border: `1px solid ${B}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 5200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "18px 16px 28px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: T1 }}>Editar producto</span>
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

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 46, borderRadius: 12, border: `1px solid ${B}`, background: "transparent", color: T1, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: G, color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ product: p, onBack, onDelivery, onChat, onViewProfile, onBuy, onFav, isFav, flash, requireAuth, user, canChat, onDelete, onEdit }) {
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
      {/* Imagen hero */}
      <div style={{ position: "relative", aspectRatio: "1 / 1", background: "#161616", overflow: "hidden" }}>
        <img src={p.img || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"} alt={p.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"; }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(0,0,0,.5) 0%,transparent 35%,rgba(0,0,0,.72) 100%)" }} />
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }}>
          <button className="p" onClick={() => requireAuth(() => onFav(p.id))} style={{ width: 31, height: 31, background: "rgba(0,0,0,.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? "#F87171" : "none"} stroke={isFav ? "#F87171" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        {p.badge && <div style={{ position: "absolute", bottom: 14, left: 14, background: bc.bg, borderRadius: 100, padding: "5px 13px", fontSize: 9, fontWeight: 700, color: bc.tx }}>{p.badge}</div>}
      </div>

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
            <div style={{ width: 33, height: 33, borderRadius: "50%", background: `linear-gradient(135deg,${G},#8a6200)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#000", flexShrink: 0 }}>
              {sellerName ? sellerName[0].toUpperCase() : "?"}
            </div>
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
            onChat(p.seller_id, sellerName || p.seller_name || "Vendedor");
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
function SellerProfile({ userId, currentUser, onBack, onChat, onProduct }) {
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
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: `linear-gradient(135deg,${G},#7a5200)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, fontWeight: 900, color: "#000", flexShrink: 0, boxShadow: `0 0 22px ${G}35` }}>
            {name[0].toUpperCase()}
          </div>
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
function PubSheet({ onClose, onPublish, user, flash }) {
  const { cols } = useR();
  const { cats, subcats } = useCatalog();
  const { S, B, CARD, T1, T2, T3, isDark } = useAt();
  const [form, setForm] = useState({ 
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

  const anyShip = form.shipModes.local || form.shipModes.intl || form.shipModes.persona;
  const needsLoc = form.shipModes.local || form.shipModes.persona;
  const canPublish = form.title && form.price && form.cat && anyShip &&
    (!needsLoc || form.location) &&
    (!form.shipModes.intl || form.shippingPrice);

  return (
    <div className="fi" style={{ position: "fixed", inset: 0, zIndex: 400 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.88)", backdropFilter: "blur(18px)" }} />
      <div className="bs" onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: isDark ? isDark?"#060606":S : S, borderRadius: "24px 24px 0 0", border: `1px solid ${B}`, borderBottom: "none", maxHeight: "96dvh", overflowY: "auto" }}>
        
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, background: B, borderRadius: 2, margin: "14px auto 0" }} />
        
        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: isDark ? "rgba(6,6,6,.98)" : `rgba(220,221,232,.98)`, backdropFilter: "blur(18px)", padding: "14px 20px", borderBottom: `1px solid ${B}`, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -.3, color: T1 }}>Publicar Producto</h2>
            <p style={{ fontSize: 10, color: T3, marginTop: 2 }}>Completa la información · Visible globalmente 🌍</p>
          </div>
          <button onClick={onClose} className="p" style={{ background: isDark?"#111":CARD, border: `1px solid ${B}`, borderRadius: "50%", width: 27, height: 27, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic n="close" c={T2} s={15} />
          </button>
        </div>

        <div style={{ padding: "13px" }}>
          
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
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
                <div>
                  <label style={lbl}>Precio *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: isDark?"#666":T2, fontSize: 12, fontWeight: 700 }}>$</span>
                    <input style={{ ...inp, paddingLeft: 26 }} type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => set("price", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Precio original <span style={{ color: T3 }}>(opcional)</span></label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: isDark?"#444":T3, fontSize: 12, fontWeight: 700 }}>$</span>
                    <input style={{ ...inp, paddingLeft: 26 }} type="number" min="0" step="0.01" placeholder="0.00" value={form.orig} onChange={e => set("orig", e.target.value)} />
                  </div>
                </div>
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
              <span>🏷️</span> Categoría y subcategoría
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
            {!form.cat && <p style={{ fontSize: 9.5, color: T3, marginTop: 5 }}>Obligatorio · ayuda a que tu producto aparezca en la búsqueda correcta.</p>}
          </div>

          {form.shipModes.local && <div style={sectionStyle}>
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
          <div style={sectionStyle}>
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
          </div>

          {/* SECCIÓN 6: ENTREGA */}
          <div style={sectionStyle}>
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
          </div>

          {/* SECCIÓN 8: VISIBILIDAD */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>
              <span>🚀</span> Visibilidad
            </div>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "12px 14px", background: form.promote ? `${G}08` : isDark?"#0e0e0e":CARD, borderRadius: 10, border: `1px solid ${form.promote ? `${G}30` : isDark?"#1a1a1a":B}` }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: form.promote ? G : isDark?"#fff":T1, marginBottom: 2 }}>⭐ Promocionar producto</div>
                <div style={{ fontSize: 9, color: isDark?"#555":T2 }}>Aparece en destacados de su categoría</div>
              </div>
              <div onClick={() => set("promote", !form.promote)} style={{ width: 44, height: 24, borderRadius: 12, background: form.promote ? G : isDark?"#222":B, position: "relative", transition: "background 0.2s", cursor: "pointer" }}>
                <div style={{ position: "absolute", top: 2, left: form.promote ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: form.promote ? "#000" : isDark?"#444":T3, transition: "left 0.2s" }} />
              </div>
            </label>
          </div>

          {/* SECCIÓN 9: ACCIÓN */}
          <button 
            onClick={async () => { 
              if (!canPublish) {
                if (!form.title) flash("⚠️ Escribe un título");
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
            {saving ? <><Spin size={17} color="#000" /> Publicando...</> : "🚀 PUBLICAR PRODUCTO"}
          </button>
        </div>
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

function EnviosMenu({ onLocal, onIntl, user, requireAuth }) {
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const { S, B, T1, T2, T3, CARD, isDark } = useAt();
  const dlOn = (() => { try { const r = localStorage.getItem("retador_admincfg"); if (r) return JSON.parse(r).deliveryServiceActive !== false; } catch (e) {} return true; })();
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


// ═════════════════════════════════════════════════════════════════════════════
// DELIVERY LOCAL — Sistema completo de mensajería urbana
// ═════════════════════════════════════════════════════════════════════════════
const DELIVERY_LOCAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes dl-pulse  {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.42;transform:scale(.75)}}
@keyframes dl-ring   {0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0}}
@keyframes dl-fadeup {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes dl-ticker {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes dl-progress-fill{from{width:0%}to{width:62%}}
@keyframes dl-glow-pulse{0%,100%{box-shadow:0 0 10px 2px rgba(196,152,46,.16)}50%{box-shadow:0 0 20px 5px rgba(196,152,46,.28)}}

@keyframes ne-fadeup   {from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes ne-pulse    {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.72)}}
@keyframes ne-ring     {0%{transform:scale(1);opacity:.55}100%{transform:scale(2.6);opacity:0}}
@keyframes ne-check-in {from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes ne-shake    {0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
@keyframes ne-glow     {0%,100%{box-shadow:0 0 14px 2px rgba(196,152,46,.2)}50%{box-shadow:0 0 24px 6px rgba(196,152,46,.34)}}
@keyframes ne-slide-down{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
@keyframes ne-summary-in{from{opacity:0;transform:translateY(5px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}

@keyframes screen-slide-in {from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes screen-slide-out{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}

@keyframes rt-fadeup      {from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes rt-pulse       {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.72)}}
@keyframes rt-ring        {0%{transform:scale(1);opacity:.55}100%{transform:scale(2.8);opacity:0}}
@keyframes rt-status-glow {0%,100%{box-shadow:0 0 0 0 rgba(44,184,122,0)}50%{box-shadow:0 0 16px 3px rgba(44,184,122,.12)}}
@keyframes rt-map-shimmer {0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
@keyframes rt-courier-in  {from{opacity:0;transform:scale(.84) translateY(5px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes rt-slide-down  {from{opacity:0;max-height:0;transform:translateY(-4px)}to{opacity:1;max-height:600px;transform:translateY(0)}}

@keyframes ch-fadeup  {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes ch-msg-in  {from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes ch-send-in {from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
@keyframes ch-pulse   {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.72)}}
@keyframes ch-ring    {0%{transform:scale(1);opacity:.55}100%{transform:scale(2.8);opacity:0}}

.dl-noscroll::-webkit-scrollbar,.ne-scroll::-webkit-scrollbar,.rt-scroll::-webkit-scrollbar,.ch-scroll::-webkit-scrollbar{display:none}
.dl-noscroll,.ne-scroll,.rt-scroll,.ch-scroll{scrollbar-width:none;-ms-overflow-style:none}

.dl-tap,.ne-tap,.rt-tap,.ch-tap{transition:transform .11s ease,opacity .11s ease;cursor:pointer}
.dl-tap:active,.ne-tap:active,.rt-tap:active,.ch-tap:active{transform:scale(.965);opacity:.82}

.dl-cta-btn{transition:transform .16s ease,box-shadow .16s ease}
.dl-cta-btn:active{transform:scale(.965)}
.dl-progress-bar{animation:dl-progress-fill 1.4s cubic-bezier(.4,0,.2,1) .6s both}
.dl-ticker-track{animation:dl-ticker 24s linear infinite;white-space:nowrap}

.dl-s1{animation:dl-fadeup .48s ease .04s both}
.dl-s2{animation:dl-fadeup .48s ease .11s both}
.dl-s3{animation:dl-fadeup .48s ease .18s both}
.dl-s4{animation:dl-fadeup .48s ease .25s both}
.dl-s5{animation:dl-fadeup .48s ease .32s both}

.ne-field{transition:border-color .16s ease,background .16s ease,box-shadow .16s ease}
.ne-field:focus{outline:none;border-color:rgba(196,152,46,.48)!important;background:rgba(196,152,46,.04)!important;box-shadow:0 0 0 3px rgba(196,152,46,.07)}
.ne-field::placeholder{color:rgba(152,152,166,.4)}
.ne-s1{animation:ne-fadeup .4s ease .04s both}
.ne-s2{animation:ne-fadeup .4s ease .09s both}
.ne-s3{animation:ne-fadeup .4s ease .14s both}
.ne-s4{animation:ne-fadeup .4s ease .19s both}
.ne-s5{animation:ne-fadeup .4s ease .24s both}
.ne-s6{animation:ne-fadeup .4s ease .29s both}
.ne-summary {animation:ne-summary-in .32s cubic-bezier(.34,1.06,.64,1) both}
.ne-check-in{animation:ne-check-in .26s cubic-bezier(.34,1.2,.64,1) both}
.ne-btn-glow{animation:ne-glow 3s ease-in-out infinite}
.ne-shake{animation:ne-shake .33s ease}

.rt-s1{animation:rt-fadeup .42s ease .04s both}
.rt-s2{animation:rt-fadeup .42s ease .10s both}
.rt-s3{animation:rt-fadeup .42s ease .16s both}
.rt-s4{animation:rt-fadeup .42s ease .22s both}
.rt-s5{animation:rt-fadeup .42s ease .28s both}
.rt-s6{animation:rt-fadeup .42s ease .34s both}
.rt-status-card{animation:rt-status-glow 3s ease-in-out infinite}
.rt-courier-card{animation:rt-courier-in .36s cubic-bezier(.34,1.06,.64,1) .2s both}
.rt-details-open{animation:rt-slide-down .28s ease both;overflow:hidden}

.ch-s1{animation:ch-fadeup .4s ease .05s both}
.ch-s2{animation:ch-fadeup .4s ease .12s both}
.ch-s3{animation:ch-fadeup .4s ease .19s both}
.ch-field{transition:border-color .16s ease,background .16s ease}
.ch-field:focus{outline:none;border-color:rgba(196,152,46,.45)!important;background:rgba(196,152,46,.04)!important}
.ch-field::placeholder{color:rgba(152,152,166,.38)}
.ch-send-btn{transition:transform .14s ease,box-shadow .14s ease}
.ch-send-btn:active{transform:scale(.93)}

.screen-forward{animation:screen-slide-in  .26s cubic-bezier(.4,0,.2,1) both}
.screen-back   {animation:screen-slide-out .26s cubic-bezier(.4,0,.2,1) both}
`;

const DL_DARK = {
  bg:'#070709', bg1:'#0E0E11', bg2:'#131316', bg3:'#1A1A1E', bg4:'#212126',
  gold:'#E5A912', goldBright:'#FFC01E',
  goldDim:'rgba(196,152,46,0.07)', goldDim2:'rgba(196,152,46,0.13)',
  goldBorder:'rgba(196,152,46,0.22)', goldText:'#FFC01E',
  text1:'#F0F0F2', text2:'#9898A6', text3:'#50505C',
  border:'rgba(255,255,255,0.058)',
  green:'#2CB87A', greenDim:'rgba(44,184,122,0.08)', greenBdr:'rgba(44,184,122,0.22)',
  blue:'#4A90D9',  blueDim:'rgba(74,144,217,0.09)',  blueBdr:'rgba(74,144,217,0.22)',
  red:'#E05555',   redDim:'rgba(224,85,85,0.07)',     redBdr:'rgba(224,85,85,0.22)',
};
const DL_LIGHT = {
  bg:'#FFFFFF', bg1:'#FFFFFF', bg2:'#FFFFFF', bg3:'#F2F3F5', bg4:'#E4E6EB',
  gold:'#E5A912', goldBright:'#FFC01E',
  goldDim:'rgba(196,152,46,0.09)', goldDim2:'rgba(196,152,46,0.17)',
  goldBorder:'rgba(196,152,46,0.35)', goldText:'#965E00',
  text1:'#050505', text2:'#65676B', text3:'#8A8D91',
  border:'#E4E6EB',
  green:'#2CB87A', greenDim:'rgba(44,184,122,0.08)', greenBdr:'rgba(44,184,122,0.25)',
  blue:'#4A90D9',  blueDim:'rgba(74,144,217,0.09)',  blueBdr:'rgba(74,144,217,0.25)',
  red:'#E05555',   redDim:'rgba(224,85,85,0.08)',     redBdr:'rgba(224,85,85,0.25)',
};
const useC = () => { const { isDark } = useAt(); return isDark ? DL_DARK : DL_LIGHT; };
const C = DL_DARK; // alias de módulo — los componentes lo sobreescriben con useC()

/* ═══════════════════════════════════════════════════════════════════
   LÓGICA OPERATIVA — DELIVERY LOCAL
   Documentación interna para implementación en Blink
   ═══════════════════════════════════════════════════════════════════

   1. ESTADOS FINALES DE UN ENVÍO
   ──────────────────────────────
   delivered        → Entregado correctamente al destinatario.
   cancelled_client → Cancelado por el cliente en cualquier momento
                      antes de la entrega.
   cancelled_system → Cancelado automáticamente por el sistema
                      (timeout sin mensajero, falla operativa crítica,
                      sin cobertura disponible).
   failed           → Entrega intentada pero no completada.
                      Requiere motivo explícito (ver DL_FAILED_REASONS).

   2. REASIGNACIÓN DE MENSAJERO
   ─────────────────────────────
   Si el mensajero cancela ANTES de la recogida del artículo:
     → El envío NO se cancela ni finaliza.
     → El estado vuelve a "Buscando mensajero" (searching).
     → El sistema asigna un nuevo mensajero automáticamente.
     → Se registra en la bitácora del chat: "Mensajero reasignado".
   Si el mensajero cancela DESPUÉS de la recogida:
     → Evaluación operativa manual requerida.
     → Estado transitorio: "Problema operativo" hasta resolución.

   3. TRANSICIONES DE ESTADO
   ──────────────────────────
   created → searching → assigned → picked → in_route → delivered
                  ↑           ↓
              (reasign) ← (cancels before pickup)

   Estados finales: delivered | cancelled_client | cancelled_system | failed
   Desde cualquier estado activo → cancelación es posible.

   4. ARCHIVADO DE CONVERSACIÓN
   ──────────────────────────────
   La conversación se archiva automáticamente al alcanzar
   cualquier estado final: delivered | cancelled_* | failed.
   → Los mensajes permanecen visibles (solo lectura).
   → No se permiten nuevos mensajes tras el archivado.
   → La conversación se mantiene accesible desde el historial.

   5. BITÁCORA AUTOMÁTICA (mensajes de sistema en el chat)
   ────────────────────────────────────────────────────────
   Cada transición genera un mensaje tipo 'system' en la conversación:
     created          → "Solicitud creada"
     assigned         → "Mensajero asignado"
     reassigned       → "Mensajero reasignado · [nombre anterior] canceló"
     picked           → "Artículo recogido"
     delivered        → "Entrega completada"
     cancelled_client → "Envío cancelado por el cliente"
     cancelled_system → "Envío cancelado por el sistema · [motivo]"
     failed           → "Entrega no completada · [motivo]"

   6. HISTORIAL
   ─────────────
   Todos los estados finales aparecen en el historial con:
     - Indicador visual de color por tipo de estado.
     - Motivo visible cuando aplica (failed / cancelled_*).
     - Acceso a detalles completos, línea de progreso,
       conversación archivada e información del mensajero.

   7. RELACIÓN RASTREO ↔ CHAT ↔ HISTORIAL
   ─────────────────────────────────────────
   Rastrear → muestra estado en tiempo real + acceso al chat.
   Chat     → bitácora completa de la operación + mensajería.
   Historial → registro permanente con todos los datos asociados.
   ═══════════════════════════════════════════════════════════════ */

/* Config visual por estado final */
const DL_STATUS_CFG = {
  delivered:        { color:'#2CB87A', dim:'rgba(44,184,122,0.08)',  bdr:'rgba(44,184,122,0.22)',  label:'Entregado',           icon:'check'   },
  cancelled_client: { color:'#F59E0B', dim:'rgba(245,158,11,0.08)', bdr:'rgba(245,158,11,0.24)',  label:'Cancelado · cliente', icon:'x'       },
  cancelled_system: { color:'#E05555', dim:'rgba(224,85,85,0.07)',  bdr:'rgba(224,85,85,0.22)',   label:'Cancelado · sistema', icon:'x'       },
  failed:           { color:'#F97316', dim:'rgba(249,115,22,0.08)', bdr:'rgba(249,115,22,0.22)',  label:'No completada',       icon:'alert'   },
};

const DL_DL_FAILED_REASONS = [
  'Destinatario no responde',
  'Dirección incorrecta',
  'No fue posible localizar el destino',
  'Rechazada por destinatario',
  'Problema operativo',
  'Otro motivo',
];

const T = {
  display: { fontFamily:"'Syne',sans-serif",   fontWeight:800 },
  heading: { fontFamily:"'Syne',sans-serif",   fontWeight:700 },
  subhead: { fontFamily:"'Syne',sans-serif",   fontWeight:600 },
  body:    { fontFamily:"'Outfit',sans-serif", fontWeight:400 },
  medium:  { fontFamily:"'Outfit',sans-serif", fontWeight:500 },
  semibold:{ fontFamily:"'Outfit',sans-serif", fontWeight:600 },
};

/* ── ROOT ───────────────────────────────────────────────────────── */
function LocalDelivery({ onBack, onNav }) {
  const { isDark } = useAt();
  const [screen, setScreen] = useState('home');
  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', background: isDark ? DL_DARK.bg : DL_LIGHT.bg, fontFamily:"'Outfit',sans-serif", color: isDark ? DL_DARK.text1 : DL_LIGHT.text1 }}>
      <style>{DELIVERY_LOCAL_CSS}</style>
      {screen==='home'     && <DLHomeScreen      key="home"     onNew={()=>setScreen('nuevo')} onRastrear={()=>setScreen('rastrear')} onMenuBack={onBack} onNav={onNav}/>}
      {screen==='nuevo'    && <DLNuevoEnvioScreen key="nuevo"   onBack={()=>setScreen('home')}/>}
      {screen==='rastrear' && <DLRastrearScreen   key="rastrear" onBack={()=>setScreen('home')} onChat={()=>setScreen('chat')}/>}
      {screen==='chat'     && <DLChatScreen       key="chat"    onBack={()=>setScreen('rastrear')}/>}
    </div>
  );
}

/* ── NAV HEADER ─────────────────────────────────────────────────── */
function DLNavHeader({ title, showBack, onBack, onMenuBack }) {
  const C = useC();
  if (!showBack) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', height:54, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
        <div style={{ ...T.display, fontSize:22, letterSpacing:'-0.03em', lineHeight:1, background:'linear-gradient(135deg,#FFC01E 0%,#E5A912 55%,#D99A0A 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>RETADOR</div>
        <div style={{ ...T.semibold, fontSize:8, color:C.text3, letterSpacing:'0.22em', textTransform:'uppercase', lineHeight:1 }}>SERVICIO DE ENTREGAS</div>
      </div>
      {onMenuBack && <button className="dl-tap" onClick={onMenuBack} style={{ background:'rgba(255,255,255,0.052)', border:`1px solid ${C.border}`, borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6l5 5" stroke={C.text1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>}
    </div>
  );
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'0 16px', height:48, borderBottom:`1px solid ${C.border}` }}>
      <button className="dl-tap" onClick={onBack} style={{ background:'rgba(255,255,255,0.052)', border:`1px solid ${C.border}`, borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6l5 5" stroke={C.text1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div style={{ flex:1, textAlign:'center' }}><div style={{ ...T.heading, fontSize:14, color:C.text1, letterSpacing:'-0.012em' }}>{title}</div></div>
      <div style={{ width:32 }}/>
    </div>
  );
}

/* ── HOME ───────────────────────────────────────────────────────── */
function DLHomeScreen({ onNew, onRastrear, onMenuBack, onNav }) {
  const C = useC();
  const svcOn = (() => { try { const r = localStorage.getItem("retador_admincfg"); if (r) return JSON.parse(r).deliveryServiceActive !== false; } catch (e) {} return true; })();
  return (
    <div className="screen-back" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <DLNavHeader showBack={false} onMenuBack={onMenuBack}/>
      <DLLiveTicker/>
      <div className="dl-noscroll" style={{ flex:1, overflowY:'auto' }}>
        <LiveSlot page="delivery_local" from={null} to="dl_hero" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s1"><DLHeroSection/></div>
        <LiveSlot page="delivery_local" from="dl_hero" to="dl_cta" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s2"><DLCTASection onNew={onNew}/></div>
        <LiveSlot page="delivery_local" from="dl_cta" to="dl_act" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s3"><DLActiveSection onRastrear={onRastrear}/></div>
        <LiveSlot page="delivery_local" from="dl_act" to="dl_stats" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s4"><DLStatsStrip/></div>
        <LiveSlot page="delivery_local" from="dl_stats" to="dl_hist" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s5"><DLHistorySection/></div>
        <LiveSlot page="delivery_local" from="dl_hist" to={null} onNav={onNav} pad="10px 14px 0" />
        <div style={{ height:40 }}/>
      </div>
    </div>
  );
}

function DLLiveTicker() {
  const C = useC();
  const items=['✦  Alex R. completó entrega en Vedado · hace 3 min','✦  Marco V. en ruta hacia Centro Habana · hace 7 min','✦  Nuevo envío asignado en Miramar · hace 11 min','✦  Laura M. completó entrega en Playa · hace 14 min','✦  Carlos B. disponible en La Habana Vieja · ahora'];
  const text = items.join('     ');
  return (
    <div style={{ height:27, overflow:'hidden', background:'rgba(196,152,46,0.038)', borderBottom:`1px solid rgba(196,152,46,0.08)`, display:'flex', alignItems:'center' }}>
      <div className="dl-ticker-track" style={{ display:'flex' }}>
        {[text,text].map((t,i)=><span key={i} style={{ ...T.medium, fontSize:9.5, color:'rgba(196,152,46,0.52)', letterSpacing:'0.02em', paddingRight:55 }}>{t}</span>)}
      </div>
    </div>
  );
}

function DLHeroSection() {
  const C = useC();
  const svcOn = (() => { try { const r = localStorage.getItem("retador_admincfg"); if (r) return JSON.parse(r).deliveryServiceActive !== false; } catch (e) {} return true; })();
  return (
    <div style={{ margin:'13px 14px 0', borderRadius:22, overflow:'hidden', position:'relative', minHeight:200 }}>
      <div style={{ position:'absolute', inset:0, background:'#0C0C10' }}/>
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 347 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="hg"><stop offset="0%" stopColor="#E5A912" stopOpacity=".13"/><stop offset="100%" stopColor="#E5A912" stopOpacity="0"/></radialGradient>
          <filter id="hf"><feGaussianBlur stdDeviation="1.8" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
        </defs>
        {[44,88,132,176].map(y=><line key={y} x1="0" y1={y} x2="347" y2={y} stroke="white" strokeWidth={y===88?.6:.35} opacity={y===88?.065:.04}/>)}
        {[58,116,174,232,290].map(x=><line key={x} x1={x} y1="0" x2={x} y2="200" stroke="white" strokeWidth={x===174?.6:.35} opacity={x===174?.065:.04}/>)}
        <rect width="347" height="200" fill="url(#hg)"/>
        <path d="M 58 174 L 58 88 L 174 88 L 174 44 L 290 44" stroke="#E5A912" strokeWidth="1.5" fill="none" strokeDasharray="5,3.5" opacity=".52" filter="url(#hf)"/>
        {[[58,88],[174,88],[174,44]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="2.2" fill="#E5A912" opacity=".38"/>)}
        <circle cx="58"  cy="174" r="6.5" fill="#E5A912" opacity=".16"/><circle cx="58"  cy="174" r="4"   fill="#E5A912" opacity=".9"/><circle cx="58"  cy="174" r="1.8" fill="white" opacity=".9"/>
        <circle cx="135" cy="88"  r="7"   fill="#4A90D9" opacity=".11"/><circle cx="135" cy="88"  r="4.5" fill="#4A90D9" opacity=".85"/><circle cx="135" cy="88"  r="1.8" fill="white" opacity=".9"/>
        <circle cx="290" cy="44"  r="6.5" fill="#2CB87A" opacity=".16"/><circle cx="290" cy="44"  r="4"   fill="#2CB87A" opacity=".9"/><circle cx="290" cy="44"  r="1.8" fill="white" opacity=".9"/>
        <circle cx="232" cy="132" r="3.2" fill="#E5A912" opacity=".42"/>
        <circle cx="290" cy="132" r="3.2" fill="#E5A912" opacity=".32"/>
        <circle cx="116" cy="44"  r="3.2" fill="#E5A912" opacity=".38"/>
      </svg>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:60, background:'linear-gradient(to bottom,transparent,rgba(12,12,16,0.94))' }}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:40, background:'linear-gradient(to bottom,rgba(12,12,16,0.48),transparent)' }}/>
      <div style={{ position:'relative', zIndex:2, padding:'15px 17px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div style={{ ...T.medium, fontSize:9, color:'rgba(196,152,46,0.48)', letterSpacing:'0.15em', textTransform:'uppercase' }}>RETADOR · MENSAJERÍA URBANA</div>
          <div style={{ display:'flex', alignItems:'center', gap:5.5, background:C.greenDim, border:`1px solid ${C.greenBdr}`, borderRadius:20, padding:'4px 10px 4px 7px' }}>
            <div style={{ position:'relative', width:7, height:7, flexShrink:0 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:svcOn?C.green:'#ef4444', animation:svcOn?'dl-ring 2.2s ease-out infinite':'none' }}/>
              <div style={{ position:'relative', width:7, height:7, borderRadius:'50%', background:svcOn?C.green:'#ef4444', animation:svcOn?'dl-pulse 2.2s ease-in-out infinite':'none' }}/>
            </div>
            <span style={{ ...T.semibold, fontSize:9.5, color:svcOn?C.green:'#ef4444', letterSpacing:'0.07em' }}>{svcOn?'OPERATIVO':'NO OPERATIVO'}</span>
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ ...T.display, fontSize:27, color:'rgba(240,240,242,0.95)', letterSpacing:'-0.026em', lineHeight:1.06, marginBottom:6 }}>Servicio<br/><span style={{ color:svcOn?C.goldBright:'#ef4444' }}>{svcOn?'Activo':'Inactivo'}</span></div>
          <div style={{ ...T.body, fontSize:11, color:'rgba(240,240,242,0.55)' }}>Mensajería urbana profesional · Ciudad de México</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
          {[{v:'8',l:'Mensajeros',g:false},{v:"22'",l:'Respuesta',g:true},{v:'12km',l:'Cobertura',g:false},{v:'98%',l:'Éxito',g:false}].map(({v,l,g})=>(
            <div key={l} style={{ background:g?C.goldDim:'rgba(255,255,255,0.06)', border:`1px solid ${g?C.goldBorder:'rgba(255,255,255,0.09)'}`, borderRadius:11, padding:'8px 5px', textAlign:'center' }}>
              <div style={{ ...T.heading, fontSize:14, letterSpacing:'-0.015em', lineHeight:1, color:g?C.goldBright:'rgba(240,240,242,0.92)', marginBottom:3.5 }}>{v}</div>
              <div style={{ ...T.body, fontSize:8, color:'rgba(240,240,242,0.48)', letterSpacing:'0.03em', textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DLCTASection({ onNew }) {
  const C = useC();
  return (
    <div style={{ padding:'11px 14px 0' }}>
      <button onClick={onNew} className="dl-cta-btn dl-tap" style={{ width:'100%', border:'none', borderRadius:18, padding:'13px 15px', background:'linear-gradient(135deg,#E5A912 0%,#FFC01E 50%,#E5A912 100%)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', boxShadow:'0 7px 24px rgba(196,152,46,0.25),0 2px 7px rgba(196,152,46,0.13)', animation:'dl-glow-pulse 3.5s ease-in-out infinite' }}>
        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
          <div style={{ width:36, height:36, background:'rgba(0,0,0,0.17)', borderRadius:11, border:'1px solid rgba(0,0,0,0.11)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2.5v10M2.5 7.5h10" stroke="#060608" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ textAlign:'left' }}>
            <div style={{ ...T.heading, fontSize:14, color:'#060608', letterSpacing:'-0.012em', marginBottom:1.5 }}>Crear Nuevo Envío</div>
            <div style={{ ...T.body, fontSize:10.5, color:'rgba(6,6,8,0.48)' }}>Asignación inmediata · Sin esperas</div>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.5 4.5l5 4.5-5 4.5" stroke="#060608" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

function DLActiveSection({ onRastrear }) {
  const C = useC();
  return (
    <div style={{ padding:'19px 14px 0' }}>
      <DLSectionTitle title="En Curso" badge="1 activo" badgeColor={C.green} badgeBg={C.greenDim} badgeBdr={C.greenBdr}/>
      <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden' }}>
        <div style={{ height:2.5, background:'rgba(255,255,255,0.04)' }}>
          <div className="dl-progress-bar" style={{ height:'100%', width:'62%', background:'linear-gradient(90deg,#E5A912,#FFC01E)', borderRadius:2 }}/>
        </div>
        <div style={{ padding:'14px 15px 15px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:5.5, marginBottom:3.5 }}>
                <div style={{ width:6.5, height:6.5, borderRadius:'50%', background:C.green, animation:'dl-pulse 1.9s ease-in-out infinite' }}/>
                <span style={{ ...T.semibold, fontSize:9.5, color:C.green, letterSpacing:'0.07em' }}>EN CAMINO</span>
              </div>
              <div style={{ ...T.subhead, fontSize:12.5, color:C.text1, letterSpacing:'-0.01em' }}>Envío #DL-2847</div>
            </div>
            <div style={{ background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:11, padding:'6px 11px', textAlign:'center' }}>
              <div style={{ ...T.heading, fontSize:19, color:C.goldText, lineHeight:1, letterSpacing:'-0.02em' }}>18<span style={{ fontSize:11, fontWeight:600 }}>'</span></div>
              <div style={{ ...T.body, fontSize:8, color:'rgba(212,168,74,0.5)', marginTop:1.5, letterSpacing:'0.06em', textTransform:'uppercase' }}>ETA</div>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, paddingTop:3.5 }}>
                <div style={{ width:7.5, height:7.5, borderRadius:'50%', background:C.gold, border:'1.5px solid rgba(196,152,46,0.32)' }}/>
                <div style={{ width:1, height:20, background:'linear-gradient(180deg,rgba(196,152,46,0.28),rgba(255,255,255,0.05))' }}/>
              </div>
              <div style={{ paddingBottom:10 }}>
                <div style={{ ...T.body, fontSize:9.5, color:C.text3, marginBottom:1.5, letterSpacing:'0.03em' }}>ORIGEN</div>
                <div style={{ ...T.medium, fontSize:12.5, color:C.text1 }}>Edificio FOCSA</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ flexShrink:0, paddingTop:3.5 }}><div style={{ width:7.5, height:7.5, borderRadius:2.2, background:C.green, border:'1.5px solid rgba(44,184,122,0.32)' }}/></div>
              <div>
                <div style={{ ...T.body, fontSize:9.5, color:C.text3, marginBottom:1.5, letterSpacing:'0.03em' }}>DESTINO</div>
                <div style={{ ...T.medium, fontSize:12.5, color:C.text1 }}>Calle 23, El Vedado</div>
              </div>
            </div>
          </div>
          <div style={{ height:1, background:C.border, marginBottom:11 }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:31, height:31, borderRadius:9, background:C.blueDim, border:`1px solid ${C.blueBdr}`, display:'flex', alignItems:'center', justifyContent:'center', ...T.heading, fontSize:13, color:C.blue }}>A</div>
              <div>
                <div style={{ ...T.medium, fontSize:12, color:C.text1, marginBottom:1.5 }}>Alex Ramírez</div>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1l1.2 2.5L9 3.8l-2.1 2 .5 2.8L5 7.3 2.6 8.6l.5-2.8L1 3.8l2.8-.3z" fill="#E5A912"/></svg>
                  <span style={{ ...T.semibold, fontSize:11, color:C.text2 }}>4.9</span>
                  <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}> · 847 entregas</span>
                </div>
              </div>
            </div>
            <button className="dl-tap" onClick={onRastrear} style={{ height:31, borderRadius:9, padding:'0 11px', background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, ...T.medium, fontSize:11.5, color:C.text1, cursor:'pointer' }}>Rastrear</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DLStatsStrip() {
  const C = useC();
  return (
    <div style={{ padding:'17px 14px 0' }}>
      <DLSectionTitle title="Rendimiento"/>
      <div style={{ display:'flex', gap:7 }}>
        {[{icon:<DLLightningIcon/>,v:'22 min',l:'Entrega promedio',s:'Últimas 72h',g:true},{icon:<DLShieldIcon/>,v:'98.4%',l:'Tasa de éxito',s:'Este mes',g:false},{icon:<DLBoxIcon/>,v:'1,240',l:'Entregas totales',s:'Historial',g:false}].map(({icon,v,l,s,g})=>(
          <div key={l} style={{ flex:1, background:g?'rgba(196,152,46,0.065)':C.bg1, border:`1px solid ${g?C.goldBorder:C.border}`, borderRadius:17, padding:'13px 11px' }}>
            <div style={{ marginBottom:8, color:g?C.goldText:C.text2 }}>{icon}</div>
            <div style={{ ...T.heading, fontSize:17, letterSpacing:'-0.022em', lineHeight:1, color:g?C.goldText:C.text1, marginBottom:3.5 }}>{v}</div>
            <div style={{ ...T.medium, fontSize:10, color:C.text2, lineHeight:1.3, marginBottom:2.5 }}>{l}</div>
            <div style={{ ...T.body, fontSize:9, color:C.text3 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DLHistorySection() {
  const C = useC();
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // all | delivered | cancelled | failed
  const PER = 8;

  const real=[
    {id:'DL-2841',from:'Vedado',       to:'Centro Habana', date:'Ayer · 14:30',   price:'$350', status:'delivered'},
    {id:'DL-2830',from:'Miramar',      to:'Playa',         date:'Hace 2 días',    price:'$500', status:'delivered'},
    {id:'DL-2801',from:'La Habana Vieja',to:'Cerro',       date:'Hace 5 días',    price:'—',    status:'cancelled_client', reason:'Cancelado por el cliente'},
    {id:'DL-2788',from:'Marianao',     to:'Diez de Octubre',date:'Hace 1 semana',  price:'—',    status:'failed',           reason:'Destinatario no responde'},
    {id:'DL-2750',from:'Boyeros',      to:'Regla',         date:'Hace 9 días',    price:'—',    status:'cancelled_system', reason:'Sin mensajeros disponibles'},
  ];

  const full = Array.from({length:20},(_,i) =>
    i < real.length ? real[i]
    : { id:`DL-${2700-i*8}`, from:'—', to:'—', date:`Hace ${Math.floor(i*1.5)+10} días`, price:'—', status:'delivered', empty:true }
  );

  const filtered = filter==='all' ? full
    : filter==='delivered'  ? full.filter(e=>e.status==='delivered')
    : filter==='cancelled'  ? full.filter(e=>e.status?.startsWith('cancelled'))
    : full.filter(e=>e.status==='failed');

  const totalPages = Math.ceil(filtered.length/PER);
  const pageItems  = filtered.slice((page-1)*PER, page*PER);

  const FILTERS = [
    {k:'all',      l:'Todos'},
    {k:'delivered',l:'Entregados'},
    {k:'cancelled',l:'Cancelados'},
    {k:'failed',   l:'No completados'},
  ];

  if (!expanded) return (
    <div style={{ padding:'17px 14px 0' }}>
      <DLSectionTitle title="Historial" linkLabel="Ver todo" onLink={()=>setExpanded(true)}/>
      <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden' }}>
        {real.slice(0,3).map((e,i)=><div key={e.id}><DLHistoryRow e={e}/>{i<2&&<div style={{ height:1, background:C.border, margin:'0 13px' }}/>}</div>)}
        <div style={{ height:1, background:C.border }}/>
        <button className="dl-tap" onClick={()=>setExpanded(true)} style={{ width:'100%', border:'none', background:'transparent', cursor:'pointer', padding:'11px 13px', display:'flex', alignItems:'center', justifyContent:'center', gap:5, ...T.medium, fontSize:12.5, color:C.goldText }}>
          Ver historial completo
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6.5 2.5l3.5 3.5-3.5 3.5" stroke={C.goldText} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'17px 14px 0' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ ...T.heading, fontSize:14.5, color:C.text1, letterSpacing:'-0.012em' }}>Historial</span>
          <span style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:20, padding:'2px 8px', ...T.semibold, fontSize:9.5, color:C.text2 }}>{filtered.length} envíos</span>
        </div>
        <button className="dl-tap" onClick={()=>{setExpanded(false);setPage(1);setFilter('all');}} style={{ background:'none', border:'none', cursor:'pointer', ...T.medium, fontSize:12, color:C.text3, fontFamily:"'Outfit',sans-serif" }}>Cerrar</button>
      </div>

      {/* Filter pills */}
      <div style={{ display:'flex', gap:6, marginBottom:12, overflowX:'auto', paddingBottom:2 }}>
        {FILTERS.map(({k,l})=>(
          <button key={k} className="dl-tap" onClick={()=>{setFilter(k);setPage(1);}} style={{ background:filter===k?C.goldDim2:'rgba(255,255,255,0.04)', border:`1px solid ${filter===k?C.goldBorder:C.border}`, borderRadius:20, padding:'4px 11px', cursor:'pointer', ...T.medium, fontSize:11, color:filter===k?C.goldText:C.text2, flexShrink:0, transition:'all .14s ease', whiteSpace:'nowrap' }}>{l}</button>
        ))}
      </div>

      <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden' }}>
        {pageItems.length===0
          ? <div style={{ padding:'24px 16px', textAlign:'center', ...T.body, fontSize:12, color:C.text3 }}>Sin envíos en esta categoría</div>
          : pageItems.map((e,i)=><div key={e.id}><DLHistoryRow e={e}/>{i<pageItems.length-1&&<div style={{ height:1, background:C.border, margin:'0 13px' }}/>}</div>)
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:12 }}>
          <button className="dl-tap" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ width:32, height:32, borderRadius:10, background:page===1?'transparent':C.bg2, border:`1px solid ${page===1?'transparent':C.border}`, display:'flex', alignItems:'center', justifyContent:'center', opacity:page===1?.3:1 }}>
            <svg width="7" height="11" viewBox="0 0 7 11" fill="none"><path d="M5.5 1.5L1.5 5.5l4 4" stroke={C.text2} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
            <button key={n} className="dl-tap" onClick={()=>setPage(n)} style={{ width:32, height:32, borderRadius:10, background:n===page?C.goldDim2:'transparent', border:`1px solid ${n===page?C.goldBorder:'transparent'}`, ...T.semibold, fontSize:12, color:n===page?C.goldText:C.text3 }}>{n}</button>
          ))}
          <button className="dl-tap" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ width:32, height:32, borderRadius:10, background:page===totalPages?'transparent':C.bg2, border:`1px solid ${page===totalPages?'transparent':C.border}`, display:'flex', alignItems:'center', justifyContent:'center', opacity:page===totalPages?.3:1 }}>
            <svg width="7" height="11" viewBox="0 0 7 11" fill="none"><path d="M1.5 1.5l4 4-4 4" stroke={C.text2} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

function DLHistoryRow({ e }) {
  const C = useC();
  /* skeleton row for padded entries */
  if (e.empty) return (
    <div style={{ display:'flex', alignItems:'center', padding:'11px 13px', gap:11 }}>
      <div style={{ width:34, height:34, borderRadius:11, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`, flexShrink:0 }}/>
      <div style={{ flex:1 }}>
        <div style={{ width:120, height:9, background:'rgba(255,255,255,0.05)', borderRadius:4, marginBottom:6 }}/>
        <div style={{ width:80, height:8, background:'rgba(255,255,255,0.03)', borderRadius:4 }}/>
      </div>
      <div style={{ width:28, height:9, background:'rgba(255,255,255,0.04)', borderRadius:4 }}/>
    </div>
  );

  const cfg = DL_STATUS_CFG[e.status] || DL_STATUS_CFG.delivered;

  const Icon = () => {
    if (cfg.icon==='check') return <svg width="12" height="11" viewBox="0 0 12 11" fill="none"><path d="M2 5.5l3 3 5-6" stroke={cfg.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    if (cfg.icon==='alert') return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5L1 10.5h10L6 1.5z" stroke={cfg.color} strokeWidth="1.4" strokeLinejoin="round"/><path d="M6 5v3M6 9.2v.3" stroke={cfg.color} strokeWidth="1.3" strokeLinecap="round"/></svg>;
    return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2.5 2.5l6 6M8.5 2.5l-6 6" stroke={cfg.color} strokeWidth="1.6" strokeLinecap="round"/></svg>;
  };

  return (
    <div className="dl-tap" style={{ display:'flex', alignItems:'center', padding:'11px 13px', gap:11 }}>
      <div style={{ width:34, height:34, borderRadius:11, flexShrink:0, background:cfg.dim, border:`1px solid ${cfg.bdr}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2.5 }}>
          <div style={{ ...T.medium, fontSize:12, color:C.text1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:162 }}>{e.from} → {e.to}</div>
          <div style={{ ...T.heading, fontSize:12.5, color:C.text1, flexShrink:0, marginLeft:7 }}>{e.price}</div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ ...T.body, fontSize:10.5, color:C.text3 }}>{e.id} · {e.date}</div>
          <div style={{ ...T.semibold, fontSize:10, color:cfg.color }}>{cfg.label}</div>
        </div>
        {e.reason && (
          <div style={{ ...T.body, fontSize:10, color:C.text3, marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:3, height:3, borderRadius:'50%', background:cfg.color, opacity:.6, flexShrink:0 }}/>
            {e.reason}
          </div>
        )}
      </div>
      <svg width="5.5" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink:0 }}><path d="M1 1.5l3.5 3.5L1 8.5" stroke={C.text3} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

/* ── NUEVO ENVÍO ─────────────────────────────────────────────────── */
function DLNuevoEnvioScreen({ onBack }) {
  const C = useC();
  const [form,setForm]=useState({pickAddr:'',pickRef:'',pickName:'',pickPhone:'',dropAddr:'',dropRef:'',dropName:'',dropPhone:'',article:''});
  const [touched,setTouched]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const [shakeTrg,setShakeTrg]=useState(false);
  const btnRef=useRef(null);
  const req=['pickAddr','pickPhone','dropAddr','dropPhone','article'];
  const isValid=req.every(k=>form[k].trim().length>0);
  const missing=req.filter(k=>!form[k].trim()).length;
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));
  const blr=(k)=>setTouched(p=>({...p,[k]:true}));
  const err=(k)=>touched[k]&&!form[k].trim();
  const hasBoth=form.pickAddr.trim()&&form.dropAddr.trim();
  const localRate=(()=>{ try{ const r=localStorage.getItem('retador_admincfg'); if(r){ const c=JSON.parse(r); return { base:c.localBase??150, perKm:c.localPerKm??25 }; } }catch{} return { base:150, perKm:25 }; })();
  const distKm=4.2; // distancia de ejemplo (sin GPS aún)
  const localPrice=Math.round(localRate.base+localRate.perKm*distKm);
  const summary=hasBoth?{dist:distKm+' km',time:'22 min',price:'$'+localPrice.toLocaleString()+' CUP'}:null;
  const submit=()=>{if(!isValid){const t={};req.forEach(k=>t[k]=true);setTouched(t);setShakeTrg(p=>!p);return;}setSubmitted(true);};

  return (
    <div className="screen-forward" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <DLNavHeader title="Delivery Local" showBack onBack={onBack}/>
      <div className="ne-scroll" style={{ flex:1, overflowY:'auto', paddingBottom:28 }}>
        <div className="ne-s1" style={{ padding:'14px 18px 0' }}>
          <div style={{ ...T.heading, fontSize:20, color:C.text1, letterSpacing:'-0.024em', lineHeight:1.1, marginBottom:5 }}>Nuevo envío</div>
          <div style={{ ...T.body, fontSize:11.5, color:'rgba(152,152,166,0.65)', lineHeight:1.55 }}>Solicita un mensajero para recoger y entregar un artículo dentro de tu ciudad.</div>
        </div>
        <div className="ne-s2" style={{ padding:'11px 18px 0' }}><DLAvailabilityStrip/></div>
        <div className="ne-s3" style={{ padding:'11px 18px 0' }}>
          <DLSectionCard icon={<DLOriginDot/>} label="Recoger en" accentKey="gold">
            <DLFieldAddress placeholder="Dirección de recogida" value={form.pickAddr} onChange={v=>upd('pickAddr',v)} onBlur={()=>blr('pickAddr')} error={err('pickAddr')}/>
            <DLFieldRef hint="Casa verde frente al parque" value={form.pickRef} onChange={v=>upd('pickRef',v)}/>
            <div style={{ display:'flex', gap:7, marginTop:7 }}>
              <div style={{ flex:1 }}><DLFieldSmall placeholder="Nombre (opcional)" value={form.pickName} onChange={v=>upd('pickName',v)}/></div>
              <div style={{ flex:1 }}><DLFieldSmall placeholder="Teléfono *" type="tel" value={form.pickPhone} onChange={v=>upd('pickPhone',v)} onBlur={()=>blr('pickPhone')} error={err('pickPhone')}/></div>
            </div>
          </DLSectionCard>
        </div>
        <DLRouteConnector/>
        <div style={{ padding:'0 18px 0' }}>
          <DLSectionCard icon={<DLDestDot/>} label="Entregar en" accentKey="green">
            <DLFieldAddress placeholder="Dirección de entrega" value={form.dropAddr} onChange={v=>upd('dropAddr',v)} onBlur={()=>blr('dropAddr')} error={err('dropAddr')}/>
            <DLFieldRef hint="Edificio amarillo junto a la farmacia" value={form.dropRef} onChange={v=>upd('dropRef',v)}/>
            <div style={{ display:'flex', gap:7, marginTop:7 }}>
              <div style={{ flex:1 }}><DLFieldSmall placeholder="Nombre (opcional)" value={form.dropName} onChange={v=>upd('dropName',v)}/></div>
              <div style={{ flex:1 }}><DLFieldSmall placeholder="Teléfono *" type="tel" value={form.dropPhone} onChange={v=>upd('dropPhone',v)} onBlur={()=>blr('dropPhone')} error={err('dropPhone')}/></div>
            </div>
          </DLSectionCard>
        </div>
        <div className="ne-s4" style={{ padding:'10px 18px 0' }}>
          <DLSectionCard icon={<DLPkgIcon/>} label="¿Qué envías?" accentKey="blue">
            <DLArticleField value={form.article} onChange={v=>upd('article',v)} onBlur={()=>blr('article')} error={err('article')}/>
          </DLSectionCard>
        </div>
        {summary&&<div className="ne-s5 ne-summary" style={{ padding:'10px 18px 0' }}><DLSummaryCard summary={summary}/></div>}
        <div className="ne-s5" style={{ padding:'11px 18px 0' }}><DLValidationStatus isValid={isValid} missing={missing}/></div>
        <div className="ne-s6" style={{ padding:'9px 18px 0' }}><DLCTAButton enabled={isValid} submitted={submitted} onClick={submit} shakeTrg={shakeTrg} btnRef={btnRef}/></div>
      </div>
    </div>
  );
}

function DLAvailabilityStrip() {
  const C = useC();
  return (
    <div style={{ display:'flex', gap:7 }}>
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, background:C.bg2, border:`1px solid ${C.border}`, borderRadius:13, padding:'9px 11px' }}>
        <div style={{ position:'relative', width:8, height:8, flexShrink:0 }}>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:C.green, animation:'ne-ring 2.4s ease-out infinite' }}/>
          <div style={{ position:'relative', width:8, height:8, borderRadius:'50%', background:C.green, animation:'ne-pulse 2.2s ease-in-out infinite' }}/>
        </div>
        <div>
          <div style={{ ...T.heading, fontSize:15, color:C.text1, lineHeight:1, letterSpacing:'-0.015em' }}>8</div>
          <div style={{ ...T.body, fontSize:8.5, color:C.text3, marginTop:1.5, letterSpacing:'0.03em', textTransform:'uppercase' }}>Disponibles</div>
        </div>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:13, padding:'9px 11px' }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink:0 }}><circle cx="6.5" cy="6.5" r="5" stroke={C.goldText} strokeWidth="1.2"/><path d="M6.5 4v2.5l1.7 1.7" stroke={C.goldText} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <div>
          <div style={{ ...T.heading, fontSize:15, color:C.goldText, lineHeight:1, letterSpacing:'-0.015em' }}>~22<span style={{ fontSize:10.5, fontWeight:600 }}>'</span></div>
          <div style={{ ...T.body, fontSize:8.5, color:'rgba(196,152,46,0.46)', marginTop:1.5, letterSpacing:'0.03em', textTransform:'uppercase' }}>Respuesta</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', background:C.greenDim, border:`1px solid ${C.greenBdr}`, borderRadius:13, padding:'9px 11px' }}>
        <div>
          <div style={{ ...T.semibold, fontSize:8.5, color:C.green, letterSpacing:'0.07em', textTransform:'uppercase', lineHeight:1.4 }}>SERVICIO</div>
          <div style={{ ...T.semibold, fontSize:8.5, color:C.green, letterSpacing:'0.07em', textTransform:'uppercase', lineHeight:1.4 }}>ACTIVO</div>
        </div>
      </div>
    </div>
  );
}

function DLSectionCard({ icon, label, accentKey, children }) {
  const C = useC();
  const a={gold:{bg:C.goldDim,border:C.goldBorder},green:{bg:C.greenDim,border:C.greenBdr},blue:{bg:C.blueDim,border:C.blueBdr}}[accentKey]||{bg:C.goldDim,border:C.goldBorder};
  return (
    <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:18, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 13px 9px', borderBottom:`1px solid ${C.border}`, background:`linear-gradient(90deg,${a.bg} 0%,transparent 80%)` }}>
        {icon}<span style={{ ...T.subhead, fontSize:11.5, color:C.text1 }}>{label}</span>
      </div>
      <div style={{ padding:'11px 12px 12px', display:'flex', flexDirection:'column' }}>{children}</div>
    </div>
  );
}

function DLFieldAddress({ placeholder, value, onChange, onBlur, error }) {
  const C = useC();
  return (
    <div>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1A2.7 2.7 0 002.8 3.7c0 2.3 2.7 6.8 2.7 6.8S8.2 6 8.2 3.7A2.7 2.7 0 005.5 1z" stroke={error?C.red:'rgba(152,152,166,0.38)'} strokeWidth="1.1"/><circle cx="5.5" cy="3.7" r="1" fill={error?C.red:'rgba(152,152,166,0.38)'}/></svg>
        </div>
        <input className="ne-field" type="text" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} onBlur={onBlur} style={{ width:'100%', height:36, background:error?C.redDim:'rgba(255,255,255,0.034)', border:`1px solid ${error?C.redBdr:C.border}`, borderRadius:11, paddingLeft:27, paddingRight:10, ...T.medium, fontSize:12, color:C.text1 }}/>
      </div>
      {error&&<div style={{ ...T.body, fontSize:9.5, color:C.red, marginTop:3.5, paddingLeft:3.5, animation:'ne-slide-down .2s ease both' }}>Este campo es requerido</div>}
    </div>
  );
}

function DLFieldRef({ hint, value, onChange }) {
  const C = useC();
  const max=150;
  return (
    <div style={{ position:'relative', marginTop:5.5 }}>
      <input className="ne-field" type="text" placeholder={`Punto de referencia · ${hint}`} value={value} onChange={e=>{if(e.target.value.length<=max)onChange(e.target.value);}} style={{ width:'100%', height:34, background:'rgba(255,255,255,0.024)', border:`1px solid ${C.border}`, borderRadius:10, paddingLeft:10, paddingRight:value.length>0?33:10, ...T.body, fontSize:11.5, color:'rgba(240,240,242,0.7)' }}/>
      {value.length>0&&<div style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', ...T.body, fontSize:8.5, color:C.text3 }}>{max-value.length}</div>}
    </div>
  );
}

function DLFieldSmall({ placeholder, value, onChange, onBlur, type='text', error }) {
  const C = useC();
  return (
    <div>
      <input className="ne-field" type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} onBlur={onBlur} style={{ width:'100%', height:34, background:error?C.redDim:'rgba(255,255,255,0.034)', border:`1px solid ${error?C.redBdr:C.border}`, borderRadius:10, padding:'0 10px', ...T.medium, fontSize:11.5, color:C.text1 }}/>
      {error&&<div style={{ ...T.body, fontSize:9.5, color:C.red, marginTop:3, paddingLeft:3, animation:'ne-slide-down .2s ease both' }}>Requerido</div>}
    </div>
  );
}

function DLArticleField({ value, onChange, onBlur, error }) {
  const C = useC();
  const max=150;
  const hints=['Medicamentos para mi madre','Documentos para una oficina','Regalo de cumpleaños'];
  return (
    <div>
      <div style={{ position:'relative' }}>
        <input className="ne-field" type="text" placeholder={hints[0]} value={value} onChange={e=>{if(e.target.value.length<=max)onChange(e.target.value);}} onBlur={onBlur} style={{ width:'100%', height:36, background:error?C.redDim:'rgba(255,255,255,0.034)', border:`1px solid ${error?C.redBdr:C.border}`, borderRadius:11, padding:'0 36px 0 10px', ...T.medium, fontSize:12, color:C.text1 }}/>
        <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', ...T.body, fontSize:9, color:C.text3 }}>{max-value.length}</div>
      </div>
      {error&&<div style={{ ...T.body, fontSize:9.5, color:C.red, marginTop:3.5, paddingLeft:3.5, animation:'ne-slide-down .2s ease both' }}>Describe brevemente qué envías</div>}
      <div style={{ display:'flex', gap:5, marginTop:7, flexWrap:'wrap' }}>
        {hints.map(h=><button key={h} className="ne-tap" onClick={()=>onChange(h)} style={{ background:value===h?C.goldDim2:'rgba(255,255,255,0.036)', border:`1px solid ${value===h?C.goldBorder:C.border}`, borderRadius:20, padding:'3.5px 9px', cursor:'pointer', ...T.body, fontSize:10.5, color:value===h?C.goldText:C.text3, transition:'all .14s ease' }}>{h}</button>)}
      </div>
    </div>
  );
}

function DLRouteConnector() {
  const C = useC();
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'0 28px', height:22 }}>
      <div style={{ width:1, height:22, background:'linear-gradient(180deg,rgba(196,152,46,0.3),rgba(44,184,122,0.3))', marginLeft:5 }}/>
      <div style={{ ...T.body, fontSize:9.5, color:C.text3, letterSpacing:'0.1em', textTransform:'uppercase', marginLeft:14 }}>ruta de entrega</div>
    </div>
  );
}

function DLSummaryCard({ summary }) {
  const C = useC();
  return (
    <div style={{ background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:18, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 13px 9px', borderBottom:`1px solid rgba(196,152,46,0.10)` }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 5.5h9M5.5 1l4.5 4.5-4.5 4.5" stroke={C.goldText} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ ...T.subhead, fontSize:11.5, color:C.goldText }}>Resumen del servicio</span>
        <div style={{ marginLeft:'auto', ...T.body, fontSize:9.5, color:'rgba(196,152,46,0.4)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Estimado</div>
      </div>
      <div style={{ display:'flex', padding:'12px 13px' }}>
        {[{v:summary.dist,l:'Distancia',m:false},{v:summary.time,l:'Tiempo',m:false},{v:summary.price,l:'Precio',m:true}].map(({v,l,m},i,a)=>(
          <div key={l} style={{ flex:1, textAlign:'center', borderRight:i<a.length-1?'1px solid rgba(196,152,46,0.10)':'none' }}>
            <div style={{ ...T.heading, fontSize:m?18:15, color:m?C.goldText:C.text1, letterSpacing:'-0.02em', lineHeight:1, marginBottom:4 }}>{v}</div>
            <div style={{ ...T.body, fontSize:8.5, color:'rgba(196,152,46,0.42)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DLValidationStatus({ isValid, missing }) {
  const C = useC();
  if (isValid) return (
    <div className="ne-check-in" style={{ display:'flex', alignItems:'center', gap:9, background:C.greenDim, border:`1px solid ${C.greenBdr}`, borderRadius:13, padding:'9px 12px' }}>
      <div style={{ width:20, height:20, borderRadius:6.5, background:C.green, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1.5 4l2.5 2.5 4.5-5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div>
        <div style={{ ...T.semibold, fontSize:11.5, color:C.green, lineHeight:1.25 }}>Envío listo para solicitar</div>
        <div style={{ ...T.body, fontSize:10, color:'rgba(44,184,122,0.5)', marginTop:1 }}>Todos los datos completados</div>
      </div>
    </div>
  );
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, background:'rgba(255,255,255,0.024)', border:`1px solid ${C.border}`, borderRadius:13, padding:'9px 12px' }}>
      <div style={{ width:20, height:20, borderRadius:6.5, background:'rgba(255,255,255,0.055)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" stroke={C.text3} strokeWidth="1.1"/><path d="M4 2.5v2M4 5.8v.3" stroke={C.text3} strokeWidth="1.1" strokeLinecap="round"/></svg>
      </div>
      <div>
        <div style={{ ...T.semibold, fontSize:11.5, color:C.text2, lineHeight:1.25 }}>{missing===1?'Falta 1 campo requerido':`Faltan ${missing} campos requeridos`}</div>
        <div style={{ ...T.body, fontSize:10, color:C.text3, marginTop:1 }}>Completa la información para continuar</div>
      </div>
    </div>
  );
}

function DLCTAButton({ enabled, submitted, onClick, shakeTrg, btnRef }) {
  const C = useC();
  const localRef=useRef(null);
  const ref=btnRef||localRef;
  useEffect(()=>{if(!enabled&&ref.current){ref.current.classList.remove('ne-shake');void ref.current.offsetWidth;ref.current.classList.add('ne-shake');}},[shakeTrg]);
  if (submitted) return (
    <div className="ne-check-in" style={{ borderRadius:18, padding:'13px 15px', background:'linear-gradient(135deg,#1E3A2E 0%,#152E22 100%)', border:`1px solid ${C.greenBdr}`, display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
      <div style={{ width:26, height:26, borderRadius:8.5, background:C.green, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1.5 5l3.5 3.5 5.5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div>
        <div style={{ ...T.heading, fontSize:13.5, color:C.green }}>¡Mensajero solicitado!</div>
        <div style={{ ...T.body, fontSize:10.5, color:'rgba(44,184,122,0.56)', marginTop:1 }}>Asignación en curso · ~3 min</div>
      </div>
    </div>
  );
  return (
    <div ref={ref}>
      <button onClick={onClick} className={enabled?'ne-btn-glow ne-tap':'ne-tap'} style={{ width:'100%', border:'none', borderRadius:18, padding:'13px 15px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:enabled?'pointer':'default', background:enabled?'linear-gradient(135deg,#E5A912 0%,#FFC01E 50%,#E5A912 100%)':C.bg3, borderTop:enabled?'1px solid rgba(196,152,46,0.26)':`1px solid ${C.border}`, opacity:enabled?1:.66, transition:'background .24s ease,opacity .24s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
          <div style={{ width:35, height:35, borderRadius:11, flexShrink:0, background:enabled?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.05)', border:enabled?'1px solid rgba(0,0,0,0.09)':`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v11M3 6l4-4.5L11 6" stroke={enabled?'#060608':C.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div style={{ ...T.heading, fontSize:13.5, color:enabled?'#060608':C.text3, letterSpacing:'-0.012em' }}>Solicitar mensajero</div>
            <div style={{ ...T.body, fontSize:10.5, color:enabled?'rgba(6,6,8,0.46)':C.text3, marginTop:1 }}>{enabled?'Asignación inmediata · sin esperas':'Completa los campos para continuar'}</div>
          </div>
        </div>
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M6 4l5 4.5-5 4.5" stroke={enabled?'#060608':C.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

/* ── RASTREAR ────────────────────────────────────────────────────── */
function DLRastrearScreen({ onBack, onChat }) {
  const C = useC();
  const { isDark } = useAt();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [elapsed,     setElapsed]     = useState(3);
  const [reassigning, setReassigning] = useState(false); // demo reasignación
  useEffect(()=>{const t=setInterval(()=>setElapsed(p=>p+1),60000);return()=>clearInterval(t);},[]);

  /* Steps change when reassigning */
  const steps = reassigning ? [
    {id:'created',  label:'Solicitud creada',   done:true,  time:'09:38'},
    {id:'assigned', label:'Mensajero asignado',  done:true,  time:'09:41'},
    {id:'reassing', label:'Reasignando mensajero',done:false,time:null, current:true, accent:C.blue},
    {id:'picked',   label:'Artículo recogido',   done:false, time:null},
    {id:'delivered',label:'Entregado',           done:false, time:null},
  ] : [
    {id:'created',  label:'Solicitud creada',   done:true,  time:'09:38'},
    {id:'assigned', label:'Mensajero asignado',  done:true,  time:'09:41'},
    {id:'picked',   label:'Artículo recogido',   done:true,  time:'09:52'},
    {id:'route',    label:'En ruta',             done:false, time:null, current:true},
    {id:'delivered',label:'Entregado',           done:false, time:null},
  ];
  return (
    <div className="screen-forward" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <DLNavHeader title="Rastrear envío" showBack onBack={onBack}/>
      <div className="rt-scroll" style={{ flex:1, overflowY:'auto', paddingBottom:32 }}>

        {/* STATUS HERO */}
        <div className="rt-s1" style={{ padding:'13px 14px 0' }}>
          <div className="rt-status-card" style={{ background: isDark ? 'linear-gradient(145deg,#101318 0%,#0E0E11 100%)' : 'linear-gradient(145deg,#FFFFFF 0%,#F2F2F8 100%)', border:`1px solid ${reassigning?C.blueBdr:C.greenBdr}`, borderRadius:22, overflow:'hidden', position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent 0%,${reassigning?C.blue:C.green} 40%,${reassigning?C.blue:C.green} 60%,transparent 100%)`, opacity:.5 }}/>
            <div style={{ padding:'16px 17px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:13 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, background:reassigning?C.blueDim:C.greenDim, border:`1px solid ${reassigning?C.blueBdr:C.greenBdr}`, borderRadius:20, padding:'4px 10px 4px 7px' }}>
                  <div style={{ position:'relative', width:7, height:7, flexShrink:0 }}>
                    <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:reassigning?C.blue:C.green, animation:'rt-ring 2.2s ease-out infinite' }}/>
                    <div style={{ position:'relative', width:7, height:7, borderRadius:'50%', background:reassigning?C.blue:C.green, animation:'rt-pulse 2.2s ease-in-out infinite' }}/>
                  </div>
                  <span style={{ ...T.semibold, fontSize:9.5, color:reassigning?C.blue:C.green, letterSpacing:'0.07em' }}>
                    {reassigning ? 'REASIGNANDO' : 'EN RUTA'}
                  </span>
                </div>
                {!reassigning && (
                  <div style={{ background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:12, padding:'6px 11px', textAlign:'center' }}>
                    <div style={{ ...T.heading, fontSize:20, color:C.goldText, lineHeight:1, letterSpacing:'-0.02em' }}>18<span style={{ fontSize:12, fontWeight:600 }}>'</span></div>
                    <div style={{ ...T.body, fontSize:8, color: isDark ? 'rgba(212,168,74,0.5)' : 'rgba(168,122,14,0.6)', marginTop:1, letterSpacing:'0.07em', textTransform:'uppercase' }}>ETA</div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom:9 }}>
                <div style={{ ...T.display, fontSize:24, color:C.text1, letterSpacing:'-0.028em', lineHeight:1.06, marginBottom:6 }}>
                  {reassigning ? <>Buscando<br/><span style={{ color:C.blue }}>nuevo mensajero</span></> : <>El mensajero<br/><span style={{ color:C.green }}>va en camino</span></>}
                </div>
                <div style={{ ...T.body, fontSize:11.5, color: isDark ? 'rgba(240,240,242,0.42)' : 'rgba(24,24,44,0.55)', lineHeight:1.55 }}>
                  {reassigning
                    ? 'El mensajero anterior canceló. El sistema está buscando uno nuevo automáticamente.'
                    : 'Alex ya recogió el paquete y se dirige al destino en El Vedado.'}
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke={C.text3} strokeWidth="1"/><path d="M5 3v2l1.3 1.3" stroke={C.text3} strokeWidth="1" strokeLinecap="round"/></svg>
                  <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}>Actualizado hace {elapsed} {elapsed===1?'minuto':'minutos'}</span>
                  <div style={{ width:2.5, height:2.5, borderRadius:'50%', background:C.text3, marginLeft:1 }}/>
                  <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}>Envío #DL-2847</span>
                </div>
                {/* Demo toggle */}
                <button className="rt-tap" onClick={()=>setReassigning(p=>!p)} style={{ background:reassigning?C.blueDim:(isDark?'rgba(255,255,255,0.04)':'rgba(24,24,44,0.05)'), border:`1px solid ${reassigning?C.blueBdr:C.border}`, borderRadius:8, padding:'3px 8px', cursor:'pointer' }}>
                  <span style={{ ...T.body, fontSize:9, color:reassigning?C.blue:C.text3, letterSpacing:'0.04em', textTransform:'uppercase' }}>Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="rt-s2" style={{ padding:'11px 14px 0' }}>
          <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, padding:'15px 15px 13px' }}>
            <div style={{ ...T.subhead, fontSize:10.5, color:C.text2, letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:14 }}>Progreso del envío</div>
            {steps.map((step,i)=>{
              const isLast    = i===steps.length-1;
              const accentCol = step.accent || C.green;
              return (
                <div key={step.id} style={{ display:'flex', alignItems:'flex-start', gap:11 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, width:18 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:step.done?C.green:'transparent', border:step.done?'none':step.current?`2px solid ${accentCol}`:`2px solid ${C.text3}`, position:'relative' }}>
                      {step.done   && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {step.current && <>
                        <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:`1.5px solid ${accentCol}44`, animation:'rt-ring 2.4s ease-out infinite' }}/>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:accentCol, animation:'rt-pulse 1.9s ease-in-out infinite' }}/>
                      </>}
                      {!step.done && !step.current && <div style={{ width:5, height:5, borderRadius:'50%', background:C.text3, opacity:.32 }}/>}
                    </div>
                    {!isLast && <div style={{ width:1.5, height:28, marginTop:2.5, background:step.done?`linear-gradient(180deg,${C.green} 0%,rgba(44,184,122,.25) 100%)`:step.current?`linear-gradient(180deg,${accentCol}44 0%,${C.text3} 100%)`:C.bg3, borderRadius:1 }}/>}
                  </div>
                  <div style={{ paddingBottom:isLast?0:10, paddingTop:1, flex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <span style={{ ...T.medium, fontSize:12.5, color:step.done?C.text1:step.current?accentCol:C.text3 }}>{step.label}</span>
                    {step.time   && <span style={{ ...T.body, fontSize:10, color:C.text3, marginTop:1 }}>{step.time}</span>}
                    {step.current && <span style={{ ...T.semibold, fontSize:9.5, color:accentCol, letterSpacing:'0.05em' }}>AHORA</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAP */}
        <div className="rt-s3" style={{ padding:'10px 14px 0' }}>
          <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden', position:'relative', height:172 }}>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 347 172" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="mg"><stop offset="0%" stopColor="#1A1A1E" stopOpacity="1"/><stop offset="100%" stopColor="#0A0A0D" stopOpacity="1"/></radialGradient>
                <radialGradient id="cg"><stop offset="0%" stopColor="#4A90D9" stopOpacity=".3"/><stop offset="100%" stopColor="#4A90D9" stopOpacity="0"/></radialGradient>
                <filter id="mf"><feGaussianBlur stdDeviation="2.2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
              </defs>
              <rect width="347" height="172" fill="url(#mg)"/>
              {[30,60,88,118,148].map(y=><line key={y} x1="0" y1={y} x2="347" y2={y} stroke="white" strokeWidth={y===88?.55:.32} opacity={y===88?.065:.04}/>)}
              {[48,96,144,190,240,290].map(x=><line key={x} x1={x} y1="0" x2={x} y2="172" stroke="white" strokeWidth={x===190?.55:.32} opacity={x===190?.065:.04}/>)}
              <path d="M 64 148 L 64 88 L 144 88 L 190 58 L 294 58" stroke="#E5A912" strokeWidth="1.8" fill="none" strokeDasharray="5.5,3.5" opacity=".6" filter="url(#mf)"/>
              <path d="M 64 148 L 64 88 L 144 88 L 170 76" stroke="#E5A912" strokeWidth="2" fill="none" opacity=".88"/>
              <circle cx="64"  cy="148" r="7"   fill="#E5A912" opacity=".14"/><circle cx="64"  cy="148" r="4.5" fill="#E5A912" opacity=".9"/><circle cx="64"  cy="148" r="2"   fill="white" opacity=".9"/>
              <circle cx="294" cy="58"  r="7"   fill="#2CB87A" opacity=".14"/><circle cx="294" cy="58"  r="4.5" fill="#2CB87A" opacity=".9"/><circle cx="294" cy="58"  r="2"   fill="white" opacity=".9"/>
              <circle cx="170" cy="76"  r="16"  fill="url(#cg)"/>
              <circle cx="170" cy="76"  r="9"   fill="#0E0E11" opacity=".9"/>
              <circle cx="170" cy="76"  r="6.5" fill="#4A90D9"/>
              <circle cx="170" cy="76"  r="2.5" fill="white" opacity=".9"/>
              <circle cx="170" cy="76"  r="12"  fill="none" stroke="#4A90D9" strokeWidth="1" opacity=".32" style={{ animation:'rt-map-shimmer 2s ease-in-out infinite' }}/>
            </svg>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:44, background:'linear-gradient(to bottom,transparent,rgba(14,14,17,.88))' }}/>
            <div style={{ position:'absolute', top:10, left:10, right:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ background:'rgba(7,7,9,0.84)', border:`1px solid ${C.border}`, backdropFilter:'blur(8px)', borderRadius:9, padding:'4px 9px', display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:5.5, height:5.5, borderRadius:'50%', background:C.gold, flexShrink:0 }}/><span style={{ ...T.medium, fontSize:10, color:'rgba(248,248,248,0.75)' }}>El Vedado</span>
              </div>
              <div style={{ background:'rgba(7,7,9,0.84)', border:`1px solid ${C.greenBdr}`, backdropFilter:'blur(8px)', borderRadius:9, padding:'4px 9px', display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:5.5, height:5.5, borderRadius:1.5, background:C.green, flexShrink:0 }}/><span style={{ ...T.medium, fontSize:10, color:'rgba(248,248,248,0.75)' }}>El Vedado</span>
              </div>
            </div>
            <div style={{ position:'absolute', bottom:10, right:10, background:'rgba(7,7,9,0.86)', border:`1px solid ${C.border}`, backdropFilter:'blur(8px)', borderRadius:9, padding:'4px 10px' }}>
              <span style={{ ...T.semibold, fontSize:10.5, color:'#F8F8F8' }}>4.2 km</span><span style={{ ...T.body, fontSize:10, color:'rgba(248,248,248,0.4)' }}> · en ruta</span>
            </div>
          </div>
        </div>

        {/* COURIER */}
        <div className="rt-s4" style={{ padding:'10px 14px 0' }}>
          <div className="rt-courier-card" style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, padding:'13px 14px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:46, height:46, borderRadius:15, background:'linear-gradient(135deg,#1E3248,#172840)', border:`1px solid ${C.blueBdr}`, display:'flex', alignItems:'center', justifyContent:'center', ...T.display, fontSize:18, color:C.blue }}>A</div>
              <div style={{ position:'absolute', bottom:1.5, right:1.5, width:10, height:10, borderRadius:'50%', background:C.green, border:`2px solid ${C.bg1}` }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ ...T.subhead, fontSize:13.5, color:C.text1, letterSpacing:'-0.01em', marginBottom:4 }}>Alex Ramírez</div>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1l1.2 2.5L9 3.8l-2.1 2 .5 2.8L5 7.3 2.6 8.6l.5-2.8L1 3.8l2.8-.3z" fill="#E5A912"/></svg>
                  <span style={{ ...T.semibold, fontSize:11, color:C.text2 }}>4.9</span>
                </div>
                <div style={{ width:2.5, height:2.5, borderRadius:'50%', background:C.text3 }}/>
                <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}>847 entregas</span>
                <div style={{ width:2.5, height:2.5, borderRadius:'50%', background:C.text3 }}/>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 7h10M2 7V5l1.8-2.5h4.4L10 5v2" stroke={C.text3} strokeWidth="1.1" strokeLinejoin="round"/><circle cx="3.2" cy="7.8" r="1.1" fill={C.text3}/><circle cx="8.8" cy="7.8" r="1.1" fill={C.text3}/></svg>
                  <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}>Moto</span>
                </div>
              </div>
            </div>
            <div style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:9, padding:'5px 9px', textAlign:'center', flexShrink:0 }}>
              <div style={{ ...T.semibold, fontSize:11, color:C.text1, letterSpacing:'0.07em' }}>MX-2847</div>
              <div style={{ ...T.body, fontSize:8.5, color:C.text3, marginTop:1, textTransform:'uppercase', letterSpacing:'0.06em' }}>Placa</div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="rt-s5" style={{ padding:'9px 14px 0', display:'flex', gap:7 }}>
          <button className="rt-tap" onClick={onChat} style={{ flex:1, border:`1px solid ${C.border}`, background:C.bg1, borderRadius:17, padding:'12px 14px', display:'flex', alignItems:'center', gap:9, cursor:'pointer' }}>
            <div style={{ width:30, height:30, borderRadius:10, flexShrink:0, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
              <svg width="13" height="12" viewBox="0 0 13 12" fill="none"><path d="M1 9V2.5A1.5 1.5 0 012.5 1h8A1.5 1.5 0 0112 2.5v5A1.5 1.5 0 0110.5 9H5L1 12V9z" stroke={C.text2} strokeWidth="1.2" strokeLinejoin="round"/><path d="M4 4.5h5M4 6.5h3.5" stroke={C.text2} strokeWidth="1.1" strokeLinecap="round"/></svg>
              <div style={{ position:'absolute', top:-2, right:-2, width:7, height:7, borderRadius:'50%', background:C.green, border:`1.5px solid ${C.bg}` }}/>
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ ...T.semibold, fontSize:12, color:C.text1, lineHeight:1.2 }}>Chat</div>
              <div style={{ ...T.body, fontSize:10, color:C.text3, marginTop:1 }}>con el mensajero</div>
            </div>
            <svg width="6" height="11" viewBox="0 0 6 11" fill="none" style={{ marginLeft:'auto', flexShrink:0 }}><path d="M1 1.5l3.5 4L1 9.5" stroke={C.text3} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="rt-tap" onClick={()=>setDetailsOpen(p=>!p)} style={{ flex:1, border:`1px solid ${detailsOpen?C.goldBorder:C.border}`, background:detailsOpen?C.goldDim:C.bg1, borderRadius:17, padding:'12px 14px', display:'flex', alignItems:'center', gap:9, cursor:'pointer' }}>
            <div style={{ width:30, height:30, borderRadius:10, flexShrink:0, background:detailsOpen?C.goldDim2:'rgba(255,255,255,0.05)', border:`1px solid ${detailsOpen?C.goldBorder:C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2.5" stroke={detailsOpen?C.goldText:C.text2} strokeWidth="1.2"/><path d="M3.5 4.5h5M3.5 6.5h5M3.5 8.5h3" stroke={detailsOpen?C.goldText:C.text2} strokeWidth="1.1" strokeLinecap="round"/></svg>
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ ...T.semibold, fontSize:12, color:detailsOpen?C.goldText:C.text1, lineHeight:1.2 }}>Detalles</div>
              <div style={{ ...T.body, fontSize:10, color:detailsOpen?'rgba(212,168,74,0.52)':C.text3, marginTop:1 }}>del envío</div>
            </div>
          </button>
        </div>

        {/* DETAILS */}
        {detailsOpen&&(
          <div className="rt-details-open" style={{ padding:'9px 14px 0' }}>
            <div style={{ background:C.bg1, border:`1px solid ${C.goldBorder}`, borderRadius:18, overflow:'hidden' }}>
              <div style={{ padding:'12px 14px 11px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ ...T.subhead, fontSize:12, color:C.goldText }}>Detalles del envío</span>
                <span style={{ ...T.body, fontSize:10, color:C.text3 }}>#DL-2847</span>
              </div>
              {[
                {label:'Origen',     val:'Edificio FOCSA, El Vedado'},
                {label:'Destino',    val:'Calle 23 e/ L y M, El Vedado'},
                {label:'Referencia', val:'Edificio de cristal, entrada principal'},
                {label:'Contacto',   val:'+52 55 1234 5678'},
                {label:'Artículo',   val:'Documentos para oficina'},
                {label:'Creado',     val:'Hoy 09:38 · hace 20 min'},
                {label:'Precio',     val:'$85 MXN'},
              ].map(({label,val},i,arr)=>(
                <div key={label}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ ...T.body, fontSize:9.5, color:C.text3, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:2.5 }}>{label}</div>
                      <div style={{ ...T.medium, fontSize:12, color:C.text1, lineHeight:1.4 }}>{val}</div>
                    </div>
                  </div>
                  {i<arr.length-1&&<div style={{ height:1, background:C.border, margin:'0 14px' }}/>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── CHAT ────────────────────────────────────────────────────────── */
/*
 * BITÁCORA AUTOMÁTICA — todos los eventos de sistema que pueden
 * aparecer como mensajes tipo 'system' en la conversación:
 *
 * color '#4A90D9' → eventos de asignación / reasignación
 * color '#E5A912' → eventos de recogida / en ruta
 * color '#2CB87A' → eventos positivos (entregado)
 * color '#E05555' → cancelaciones / errores
 * color '#F97316' → entrega no completada / alertas
 * color '#F59E0B' → cancelación por cliente
 */
const INITIAL_MSGS=[
  {id:1, type:'system', text:'Solicitud creada',                             time:'09:38', color:'#9898A6', date:'Hoy'},
  {id:2, type:'system', text:'Mensajero asignado · Rodrigo Pérez',           time:'09:41', color:'#4A90D9', date:'Hoy'},
  {id:3, type:'courier',text:'Hola, soy Rodrigo. Voy en camino a recoger tu paquete 🛵', time:'09:43', date:'Hoy'},
  {id:4, type:'client', text:'Perfecto, te espero. El portón es azul.',      time:'09:44', date:'Hoy'},
  {id:5, type:'system', text:'Mensajero reasignado · Rodrigo canceló antes de la recogida', time:'09:46', color:'#4A90D9', date:'Hoy'},
  {id:6, type:'system', text:'Nuevo mensajero asignado · Alex Ramírez',      time:'09:48', color:'#4A90D9', date:'Hoy'},
  {id:7, type:'courier',text:'Hola, soy Alex. Ya estoy en camino al punto de recogida.',  time:'09:49', date:'Hoy'},
  {id:8, type:'courier',text:'Entendido, ya estoy cerca del punto de recogida.',           time:'09:50', date:'Hoy'},
  {id:9, type:'system', text:'Artículo recogido',                            time:'09:52', color:'#E5A912', date:null},
  {id:10,type:'courier',text:'Ya recogí el paquete, voy para allá 🤝',       time:'09:53', date:null},
  {id:11,type:'client', text:'La casa tiene un portón azul.',                time:'09:54', date:null},
  {id:12,type:'courier',text:'Perfecto, ya estoy en camino.',                time:'09:55', date:null},
  {id:13,type:'client', text:'¿Cuánto tiempo aproximadamente?',              time:'09:56', date:null},
  {id:14,type:'courier',text:'Unos 15 minutos más o menos 🛵',               time:'09:57', date:null},
];

function DLChatScreen({ onBack }) {
  const C = useC();
  const [msg,setMsg]=useState('');
  const [messages,setMessages]=useState(INITIAL_MSGS);
  // finalState: null=active | 'delivered' | 'cancelled_client' | 'cancelled_system' | 'failed'
  const [finalState, setFinalState]=useState(null);
  const scrollRef=useRef(null);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[messages]);

  const archived = finalState !== null;

  /* simulate triggering a final state + auto system message */
  const triggerFinal = (state) => {
    const sysMsg = {
      delivered:        {text:'Entrega completada · El paquete fue entregado exitosamente', color:'#2CB87A'},
      cancelled_client: {text:'Envío cancelado por el cliente',                              color:'#F59E0B'},
      cancelled_system: {text:'Envío cancelado por el sistema · Sin mensajeros disponibles', color:'#E05555'},
      failed:           {text:'Entrega no completada · Destinatario no responde',            color:'#F97316'},
    }[state];
    setMessages(p=>[...p,{id:Date.now(),type:'system',text:sysMsg.text,time:'10:18',color:sysMsg.color,date:null}]);
    setFinalState(state);
  };

  const send=()=>{const t=msg.trim();if(!t)return;setMessages(p=>[...p,{id:Date.now(),type:'client',text:t,time:'10:02'}]);setMsg('');};

  const finalCfg = finalState ? DL_STATUS_CFG[finalState] : null;

  return (
    <div className="screen-forward" style={{ height:'100%', display:'flex', flexDirection:'column', background:C.bg }}>
      <div style={{ flexShrink:0 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 14px', height:48, borderBottom:`1px solid ${C.border}` }}>
          <button className="ch-tap" onClick={onBack} style={{ background:'rgba(255,255,255,0.052)', border:`1px solid ${C.border}`, borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6l5 5" stroke={C.text1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:11, background:'linear-gradient(135deg,#1E3248,#172840)', border:`1px solid ${C.blueBdr}`, display:'flex', alignItems:'center', justifyContent:'center', ...T.heading, fontSize:13, color:C.blue }}>A</div>
            <div style={{ position:'absolute', bottom:1, right:1, width:8, height:8, borderRadius:'50%', background:archived?C.text3:C.green, border:`1.5px solid ${C.bg}` }}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ ...T.heading, fontSize:13.5, color:C.text1, letterSpacing:'-0.014em', lineHeight:1.15 }}>Entrega #DL-45821</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
              <span style={{ ...T.body, fontSize:10.5, color:C.text2 }}>Alex Ramírez</span>
              <div style={{ width:2.5, height:2.5, borderRadius:'50%', background:C.text3 }}/>
              {archived
                ? <span style={{ ...T.semibold, fontSize:10, color:finalCfg?.color, letterSpacing:'0.04em' }}>{finalCfg?.label}</span>
                : <div style={{ display:'flex', alignItems:'center', gap:3.5 }}>
                    <div style={{ width:5.5, height:5.5, borderRadius:'50%', background:C.green, animation:'ch-pulse 2.2s ease-in-out infinite' }}/>
                    <span style={{ ...T.semibold, fontSize:10, color:C.green, letterSpacing:'0.04em' }}>En ruta</span>
                  </div>
              }
            </div>
          </div>
          {/* Demo state selector */}
          {!archived
            ? <button className="ch-tap" onClick={()=>triggerFinal('delivered')} style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, borderRadius:9, padding:'5px 9px', flexShrink:0 }}>
                <span style={{ ...T.body, fontSize:9, color:C.text3, letterSpacing:'0.05em', textTransform:'uppercase' }}>Demo</span>
              </button>
            : <button className="ch-tap" onClick={()=>{setFinalState(null);setMessages(INITIAL_MSGS);}} style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, borderRadius:9, padding:'5px 9px', flexShrink:0 }}>
                <span style={{ ...T.body, fontSize:9, color:C.text3, letterSpacing:'0.05em', textTransform:'uppercase' }}>Reset</span>
              </button>
          }
        </div>

        {/* Demo final state pills — only visible when active */}
        {!archived && (
          <div style={{ display:'flex', gap:5, padding:'8px 14px', borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
            <span style={{ ...T.body, fontSize:9.5, color:C.text3, flexShrink:0, alignSelf:'center', paddingRight:4 }}>Simular:</span>
            {Object.entries(DL_STATUS_CFG).map(([k,v])=>(
              <button key={k} className="ch-tap" onClick={()=>triggerFinal(k)} style={{ background:v.dim, border:`1px solid ${v.bdr}`, borderRadius:20, padding:'3px 9px', cursor:'pointer', ...T.medium, fontSize:9.5, color:v.color, flexShrink:0, whiteSpace:'nowrap' }}>{v.label}</button>
            ))}
          </div>
        )}

        {/* Status card */}
        <div className="ch-s1" style={{ margin:'11px 14px 0' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(20,20,24,0.9),rgba(14,14,17,0.9))', border:`1px solid ${archived?finalCfg?.bdr||C.border:C.greenBdr}`, borderRadius:16, padding:'11px 14px', display:'flex', alignItems:'center', gap:12, backdropFilter:'blur(8px)' }}>
            <div style={{ position:'relative', width:32, height:32, flexShrink:0 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:archived?finalCfg?.dim||C.greenDim:C.greenDim, border:`1px solid ${archived?finalCfg?.bdr||C.border:C.greenBdr}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {archived
                  ?<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 5h8v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5zM1 3h10v2H1V3z" stroke={finalCfg?.color||C.text3} strokeWidth="1.1" strokeLinejoin="round"/></svg>
                  :<><div style={{ position:'absolute', inset:-2, borderRadius:'50%', border:`1px solid rgba(44,184,122,0.2)`, animation:'ch-ring 2.4s ease-out infinite' }}/><div style={{ width:8, height:8, borderRadius:'50%', background:C.green, animation:'ch-pulse 1.9s ease-in-out infinite' }}/></>
                }
              </div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ ...T.semibold, fontSize:11.5, color:archived?finalCfg?.color||C.text2:C.green, lineHeight:1.2, marginBottom:2 }}>
                {archived ? finalCfg?.label||'Finalizado' : 'En ruta · En camino'}
              </div>
              <div style={{ ...T.body, fontSize:10.5, color:C.text3, lineHeight:1.4 }}>
                {archived ? 'Conversación archivada · Solo lectura' : 'Artículo recogido · ETA 18 min'}
              </div>
            </div>
            {!archived&&<div style={{ background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:9, padding:'5px 9px', textAlign:'center', flexShrink:0 }}>
              <div style={{ ...T.heading, fontSize:17, color:C.goldText, lineHeight:1, letterSpacing:'-0.02em' }}>18<span style={{ fontSize:10, fontWeight:600 }}>'</span></div>
              <div style={{ ...T.body, fontSize:7.5, color:'rgba(212,168,74,0.48)', marginTop:1, textTransform:'uppercase', letterSpacing:'0.07em' }}>ETA</div>
            </div>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="ch-scroll ch-s2" style={{ flex:1, overflowY:'auto', padding:'12px 14px 0' }}>
        {messages.map((m,i)=><DLChatMessage key={m.id} m={m} prev={messages[i-1]}/>)}
        <div style={{ height:archived?16:80 }}/>
      </div>

      {/* Footer */}
      <div className="ch-s3" style={{ flexShrink:0, padding:'10px 14px 16px' }}>
        {archived ? (
          <div style={{ background:finalCfg?.dim||'rgba(255,255,255,0.028)', border:`1px solid ${finalCfg?.bdr||C.border}`, borderRadius:16, padding:'13px 15px', display:'flex', alignItems:'flex-start', gap:11 }}>
            <div style={{ width:28, height:28, borderRadius:9, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 5h8v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5zM1 3h10v2H1V3z" stroke={finalCfg?.color||C.text3} strokeWidth="1.1" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ ...T.semibold, fontSize:12, color:finalCfg?.color||C.text2, marginBottom:3 }}>Conversación archivada</div>
              <div style={{ ...T.body, fontSize:11, color:C.text3, lineHeight:1.5 }}>Esta entrega ha finalizado. Los mensajes permanecen disponibles como registro del servicio.</div>
            </div>
          </div>
        ):(
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <div style={{ flex:1, background:'rgba(255,255,255,0.038)', border:`1px solid ${C.border}`, borderRadius:14, display:'flex', alignItems:'center', padding:'0 12px', minHeight:42 }}>
              <input className="ch-field" placeholder="Escribe un mensaje…" value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send();}} style={{ flex:1, background:'transparent', border:'none', ...T.medium, fontSize:12.5, color:C.text1, outline:'none', padding:'10px 0' }}/>
            </div>
            <button className="ch-send-btn ch-tap" onClick={send} style={{ width:42, height:42, borderRadius:13, flexShrink:0, background:msg.trim()?'linear-gradient(135deg,#E5A912,#FFC01E)':'rgba(255,255,255,0.06)', border:`1px solid ${msg.trim()?'rgba(196,152,46,0.3)':C.border}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:msg.trim()?'0 4px 14px rgba(196,152,46,0.28)':'none', transition:'background .18s ease,box-shadow .18s ease,border .18s ease' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 13L13.5 7.5 1.5 2v4.5l9 1-9 1V13z" fill={msg.trim()?'#060608':C.text3}/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DLChatMessage({ m, prev }) {
  const C = useC();
  const showDate=!prev||prev.date!==m.date;
  const showSender=m.type==='courier'&&(!prev||prev.type!=='courier');
  return (
    <>
      {showDate&&m.date&&(
        <div style={{ display:'flex', alignItems:'center', gap:8, margin:'10px 0 8px' }}>
          <div style={{ flex:1, height:1, background:C.border }}/><span style={{ ...T.body, fontSize:9.5, color:C.text3, letterSpacing:'0.06em', textTransform:'uppercase' }}>{m.date}</span><div style={{ flex:1, height:1, background:C.border }}/>
        </div>
      )}
      {m.type==='system'&&(
        <div style={{ display:'flex', justifyContent:'center', margin:'6px 0' }}>
          <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:20, padding:'4px 12px', display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:m.color||C.green, flexShrink:0 }}/>
            <span style={{ ...T.medium, fontSize:10.5, color:C.text2 }}>{m.text}</span>
            <span style={{ ...T.body, fontSize:9.5, color:C.text3 }}>{m.time}</span>
          </div>
        </div>
      )}
      {m.type==='courier'&&(
        <div style={{ display:'flex', alignItems:'flex-end', gap:7, marginBottom:4, animation:'ch-msg-in .22s ease both' }}>
          <div style={{ width:26, height:26, borderRadius:9, background:'linear-gradient(135deg,#1E3248,#172840)', border:`1px solid ${C.blueBdr}`, display:'flex', alignItems:'center', justifyContent:'center', ...T.heading, fontSize:10, color:C.blue, flexShrink:0, opacity:showSender?1:0 }}>R</div>
          <div style={{ maxWidth:'72%' }}>
            {showSender&&<div style={{ ...T.body, fontSize:9.5, color:C.text3, marginBottom:4, paddingLeft:2 }}>Rodrigo · Mensajero</div>}
            <div style={{ background:C.bg2, border:`1px solid rgba(255,255,255,0.065)`, borderRadius:'14px 14px 14px 4px', padding:'9px 12px' }}>
              <div style={{ ...T.body, fontSize:12.5, color:C.text1, lineHeight:1.5 }}>{m.text}</div>
              <div style={{ ...T.body, fontSize:9, color:C.text3, marginTop:4, textAlign:'right' }}>{m.time}</div>
            </div>
          </div>
        </div>
      )}
      {m.type==='client'&&(
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:4, animation:'ch-send-in .2s ease both' }}>
          <div style={{ maxWidth:'72%', background:'linear-gradient(135deg,rgba(196,152,46,0.14),rgba(196,152,46,0.08))', border:`1px solid rgba(196,152,46,0.18)`, borderRadius:'14px 14px 4px 14px', padding:'9px 12px' }}>
            <div style={{ ...T.medium, fontSize:12.5, color:C.text1, lineHeight:1.5 }}>{m.text}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:4 }}>
              <span style={{ ...T.body, fontSize:9, color:'rgba(196,152,46,0.45)' }}>{m.time}</span>
              <svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1 4.5l2.5 3L8 1" stroke="rgba(196,152,46,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 4.5L8 7.5 12.5 1" stroke="rgba(196,152,46,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── SHARED ──────────────────────────────────────────────────────── */
function DLSectionTitle({ title, badge, badgeColor, badgeBg, badgeBdr, linkLabel, onLink }) {
  const C = useC();
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <span style={{ ...T.heading, fontSize:14.5, color:C.text1, letterSpacing:'-0.012em' }}>{title}</span>
        {badge&&<span style={{ background:badgeBg, border:`1px solid ${badgeBdr}`, borderRadius:20, padding:'2px 8px', ...T.semibold, fontSize:9.5, color:badgeColor }}>{badge}</span>}
      </div>
      {linkLabel&&<button onClick={onLink} style={{ background:'none', border:'none', cursor:'pointer', ...T.medium, fontSize:12, color:C.goldText, fontFamily:"'Outfit',sans-serif" }}>{linkLabel}</button>}
    </div>
  );
}

const DLOriginDot=()=>(<div style={{ width:16,height:16,borderRadius:5,flexShrink:0,background:'rgba(196,152,46,0.11)',border:'1px solid rgba(196,152,46,0.26)',display:'flex',alignItems:'center',justifyContent:'center' }}><div style={{ width:5.5,height:5.5,borderRadius:'50%',background:C.gold }}/></div>);
const DLDestDot  =()=>(<div style={{ width:16,height:16,borderRadius:5,flexShrink:0,background:'rgba(44,184,122,0.09)',border:'1px solid rgba(44,184,122,0.26)',display:'flex',alignItems:'center',justifyContent:'center' }}><div style={{ width:5.5,height:5.5,borderRadius:1.8,background:C.green }}/></div>);
const DLPkgIcon  =()=>(<div style={{ width:16,height:16,borderRadius:5,flexShrink:0,background:'rgba(74,144,217,0.08)',border:'1px solid rgba(74,144,217,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 3.2l3.5-1.7 3.5 1.7v3.6l-3.5 1.7-3.5-1.7V3.2z" stroke={C.blue} strokeWidth="1" strokeLinejoin="round"/><path d="M5 1.5v7M1.5 3.2L5 5l3.5-1.8" stroke={C.blue} strokeWidth="1" strokeLinecap="round"/></svg></div>);
const DLLightningIcon=()=>(<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8 1.5L2.5 7.5h5l-.5 5L12 6.5H7L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>);
const DLShieldIcon   =()=>(<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l4 1.6v3c0 2.6-1.6 4.6-4 5.5C4.6 10.7 3 8.7 3 6.1V3.1L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4.8 7l1.7 1.7 2.7-2.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const DLBoxIcon      =()=>(<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4l5-2.5L12 4v6l-5 2.5L2 10V4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 1.5v11M2 4l5 2.5 5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>);

// ═══════════════════════════════════════════════════════════════════
//  ENVÍOS INTERNACIONALES — módulo integrado (encapsulado en closure
//  para que sus nombres internos no colisionen con el resto de la app)
// ═══════════════════════════════════════════════════════════════════

const IS_CSS = `
.isx{
  --is-bg:#F0F4F8; --is-card:#FFFFFF; --is-fill:#F1F5F9; --is-header:#0F172A;
  --is-border:#E2E8F0;
  --is-t1:#0F172A; --is-t2:#64748B; --is-t3:#94A3B8; --is-t4:#CBD5E1;
  --is-accentText:#1E3A8A;
}
.isx-dark{
  --is-bg:#0E0E11; --is-card:#17171B; --is-fill:#23232A; --is-header:#141418;
  --is-border:#2B2B33;
  --is-t1:#ECECF1; --is-t2:#A6A6B4; --is-t3:#7C7C8A; --is-t4:#55555F;
  --is-accentText:#9DB8FF;
}
.isx input::placeholder, .isx textarea::placeholder { color: var(--is-t3); opacity: 1; }
`;
function IntlShipping({ onBack, flash, cfg, onNav }) {
  const { isDark } = useAt();
  return (
    <div className={isDark ? "isx isx-dark" : "isx"} style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column" }}>
      <style>{IS_CSS}</style>
      <IntlShippingApp onBack={onBack} onNav={onNav} />
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// PERFIL PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
function CourierDashboard({ meName, orders, localBase, onAccept, onStage, onCancel, onReport, onClose, dark, record, demo }) {
  const bg = dark ? "#0a0a0a" : "#f1f5f9", card = dark ? "#141417" : "#fff", t1 = dark ? "#f0f0f2" : "#0f172a", t2 = dark ? "#9aa0aa" : "#64748b", t3 = dark ? "#6b7280" : "#94a3b8", bd = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)", AC = "#6366F1";
  const [tab, setTab] = useState("disp");
  const [online, setOnline] = useState(true);
  const [detail, setDetail] = useState(null);
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
  const demoStage = (id, st) => setDemoOrders(prev => prev.map(o => o.id === id ? { ...o, courierStage: st } : o));
  // En demo mezclamos los pedidos REALES locales con los de ejemplo, para que el dueño vea su propio pedido aquí.
  const srcOrders = demo ? [...orders.filter(o => (o.shipMode || o.shipType) === "local"), ...demoOrders] : orders;
  const acceptFn = (id, fee) => { if (String(id).startsWith("demo")) demoAccept(id, fee); else onAccept && onAccept(id, fee); };
  const cancelFn = id => { if (String(id).startsWith("demo")) setDemoOrders(prev => prev.map(o => o.id === id ? { ...o, courierName: null, courierStage: null, proposedFee: null, feeApproval: null } : o)); else onCancel && onCancel(id); setDetail(null); setTab("disp"); };
  const stageFn = (id, st) => { if (String(id).startsWith("demo")) demoStage(id, st); else onStage && onStage(id, st); };
  const money = n => Math.round(n || 0).toLocaleString() + " CUP";
  const mine = srcOrders.filter(o => o.courierName === meName);
  const active = mine.find(o => o.courierStage && o.courierStage !== "completado" && o.courierStage !== "fallido");
  const done = mine.filter(o => o.courierStage === "completado");
  const available = srcOrders.filter(o => o.shipMode === "local" && !o.courierName && o.status !== "entregado" && o.status !== "cancelado");
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
        : <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: t2, padding: "4px 0" }}><span>Valor del producto · lo paga por transferencia al vendedor</span><span style={{ color: t1, fontWeight: 700 }}>{pmoney(prod)}</span></div>}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0 0", marginTop: 4, borderTop: `1px solid ${bd}` }}><span style={{ color: "#22C55E", fontWeight: 800 }}>Tu tarifa de entrega (efectivo)</span><span style={{ color: "#22C55E", fontWeight: 800 }}>{money(fee)}</span></div>
      <div style={{ fontSize: 10.5, color: t3, marginTop: 8, lineHeight: 1.45 }}>{cash
        ? <>Cobras al comprador <b>{pmoney(prod)}</b> del producto (se lo entregas al vendedor) <b>más tu tarifa de {money(fee)} en efectivo</b>, que es tuya.</>
        : <>El producto (<b>{pmoney(prod)}</b>) lo paga el comprador por transferencia al vendedor. Tú solo cobras <b>tu tarifa de {money(fee)} en efectivo</b>. La entrega se cierra cuando el vendedor confirme la transferencia.</>}</div>
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
    if (o.courierStage === "recogido") {
      const next = cash ? "completado" : "esperando_pago";
      const label = cash ? "Entregué y cobré" : "Entregué (cobré mi tarifa)";
      return <button onClick={() => { stageFn(o.id, next); if (next === "completado") setDetail(null); }} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: AC, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>{label}</button>;
    }
    return <button onClick={() => stageFn(o.id, "recogido")} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: AC, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Recogí el producto</button>;
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
        {available.map(o => miniCard(o))}
      </>;

  const histView = () => done.length === 0
    ? <Card style={{ textAlign: "center", padding: "30px 16px" }}><div style={{ fontSize: 13.5, color: t2 }}>Aún no has completado entregas.</div></Card>
    : done.map(o => miniCard(o));

  const detailModal = () => {
    if (!detail) return null;
    const o = srcOrders.find(x => x.id === detail.id) || detail, cash = isCash(o);
    return <div onClick={() => setDetail(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 4200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: bg, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "8px 16px 28px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: bd, margin: "8px auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: t1 }}>{o.title || "Pedido"}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#22C55E", whiteSpace: "nowrap" }}>+{money(feeOf(o))}</span>
        </div>
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

function CourierFlow({ myRecord, onSubmit, onClose, dark, meName, orders = [], localBase = 150, onAccept, onStage, onCancel, onReport }) {
  const bg = dark ? "#0a0a0a" : "#f1f5f9", card = dark ? "#141417" : "#fff", t1 = dark ? "#f0f0f2" : "#0f172a", t2 = dark ? "#9aa0aa" : "#64748b", t3 = dark ? "#6b7280" : "#94a3b8", bd = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)", AC = "#6366F1";
  const [started, setStarted] = useState(false);
  const [preview, setPreview] = useState(false);
  const [f, setF] = useState({ nombre: "", telefono: "", direccion: "", zona: "", experiencia: "", docTipo: "Carnet de identidad", docNumero: "", docFront: null, docBack: null, selfie: null, vehiculo: "Moto", licNumero: "", licFoto: null, chapa: "", acepta: false });
  const [err, setErr] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const readImg = (file, k) => { if (!file) return; const r = new FileReader(); r.onload = () => set(k, r.result); r.readAsDataURL(file); };
  const needsLicense = f.vehiculo === "Moto" || f.vehiculo === "Auto";
  if (preview) return <CourierDashboard demo meName={meName || "Mensajero"} orders={orders} localBase={localBase} onAccept={onAccept} onStage={onStage} onCancel={onCancel} onReport={onReport} onClose={() => setPreview(false)} dark={dark} record={{ nombre: meName }} />;

  const wrap = (children) => <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 4000, overflowY: "auto", WebkitOverflowScrolling: "touch", background: bg }}>{children}</div>;
  const backBtn = <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>‹ Volver a RETADOR</button>;

  // Estado: en revisión
  if (myRecord?.status === "pending") return wrap(
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 40px" }}>
      {backBtn}
      <div style={{ textAlign: "center", padding: "40px 16px" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: AC + "22", border: `1px solid ${AC}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 18px" }}>🛵</div>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: t1, marginBottom: 8 }}>Solicitud en revisión</h1>
        <p style={{ fontSize: 13.5, color: t2, lineHeight: 1.55, maxWidth: 340, margin: "0 auto" }}>Recibimos tu solicitud para ser mensajero de RETADOR. La estamos revisando — te avisaremos cuando esté aprobada. Gracias por querer formar parte del equipo.</p>
        <button onClick={() => setPreview(true)} style={{ marginTop: 22, height: 42, padding: "0 18px", borderRadius: 12, border: `1px solid ${bd}`, background: "transparent", color: t2, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>👁 Ver el tablero (demo)</button>
      </div>
    </div>
  );
  if (myRecord?.status === "approved") return <CourierDashboard meName={meName} orders={orders} localBase={localBase} onAccept={onAccept} onStage={onStage} onCancel={onCancel} onReport={onReport} onClose={onClose} dark={dark} record={myRecord} />;

  // Intro
  if (!started) return wrap(
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 40px" }}>
      {backBtn}
      <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 20, overflow: "hidden" }}>
        <div style={{ height: 120, background: `linear-gradient(135deg,#4F46E5,#7C3AED)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>🛵</div>
        <div style={{ padding: "20px 18px 22px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t1, marginBottom: 8, letterSpacing: "-.02em" }}>¿Quieres trabajar con nosotros?</h1>
          <p style={{ fontSize: 13.5, color: t2, lineHeight: 1.6, marginBottom: 16 }}>Conviértete en mensajero de RETADOR y gana dinero repartiendo pedidos en tu zona. Tú pones el ritmo. Solo necesitamos verificar tu identidad para que vendedores y compradores confíen en ti.</p>
          {[["💸", "Gana por cada entrega", "Cobras tu tarifa de mensajería en cada pedido."], ["📍", "Trabaja en tu zona", "Recibes los pedidos cerca de ti."], ["🛡️", "Identidad verificada", "Construyes confianza con cada cliente."]].map(([ic, tt, ds]) => (
            <div key={tt} style={{ display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 19 }}>{ic}</span>
              <div><div style={{ fontSize: 13.5, fontWeight: 700, color: t1 }}>{tt}</div><div style={{ fontSize: 12, color: t3 }}>{ds}</div></div>
            </div>
          ))}
          <button onClick={() => setStarted(true)} style={{ width: "100%", height: 48, borderRadius: 13, border: "none", background: AC, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", marginTop: 8 }}>Empezar mi solicitud →</button>
          <button onClick={() => setPreview(true)} style={{ width: "100%", height: 42, borderRadius: 12, border: `1px solid ${bd}`, background: "transparent", color: t2, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginTop: 9 }}>👁 Ver el tablero (demo)</button>
        </div>
      </div>
    </div>
  );

  // Formulario
  const lbl = { fontSize: 11.5, fontWeight: 700, color: t2, marginBottom: 6, display: "block" };
  const inp = { width: "100%", background: dark ? "#1c1c20" : "#f5f5f7", color: t1, border: `1px solid ${bd}`, borderRadius: 11, padding: "11px 13px", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box" };
  const sectionTtl = (n, txt) => <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "22px 0 14px" }}><span style={{ width: 24, height: 24, borderRadius: 8, background: AC + "22", color: AC, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span><span style={{ fontSize: 14.5, fontWeight: 800, color: t1 }}>{txt}</span></div>;
  const photoField = (label, k) => (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <label style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", border: `1.5px dashed ${f[k] ? AC : bd}`, borderRadius: 11, cursor: "pointer", background: f[k] ? AC + "0f" : "transparent" }}>
        {f[k] ? <img src={f[k]} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>📷</span>}
        <span style={{ fontSize: 12.5, color: f[k] ? t1 : t2, fontWeight: 600 }}>{f[k] ? "Foto cargada · tocar para cambiar" : "Tocar para tomar/subir foto"}</span>
        <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => readImg(e.target.files?.[0], k)} />
      </label>
    </div>
  );

  const submit = () => {
    if (!f.nombre.trim() || !f.telefono.trim() || !f.direccion.trim() || !f.zona.trim()) return setErr("Completa tus datos personales.");
    if (!f.docNumero.trim() || !f.docFront || !f.docBack || !f.selfie) return setErr("Falta tu documento (número, frente, reverso) o tu selfie de verificación.");
    if (needsLicense && (!f.licNumero.trim() || !f.chapa.trim())) return setErr("Para moto/auto necesitas número de licencia y número de chapa.");
    if (!f.acepta) return setErr("Debes aceptar la cláusula de responsabilidad.");
    setErr(""); onSubmit(f);
  };

  return wrap(
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 44px" }}>
      <button onClick={() => setStarted(false)} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>‹ Atrás</button>
      <h1 style={{ fontSize: 21, fontWeight: 800, color: t1, marginBottom: 4 }}>Solicitud de mensajero</h1>
      <p style={{ fontSize: 12.5, color: t3, marginBottom: 4 }}>Todos los datos son verificados. Sé honesto y preciso.</p>

      {sectionTtl(1, "Datos personales")}
      <label style={lbl}>Nombre completo *</label>
      <input style={inp} value={f.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre y apellidos" />
      <label style={lbl}>Teléfono *</label>
      <input style={inp} value={f.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+53 …" />
      <label style={lbl}>Dirección personal *</label>
      <input style={inp} value={f.direccion} onChange={e => set("direccion", e.target.value)} placeholder="Calle, número, municipio" />
      <label style={lbl}>Zona donde trabajas *</label>
      <input style={inp} value={f.zona} onChange={e => set("zona", e.target.value)} placeholder="Ej: Vedado, Centro Habana…" />
      <label style={lbl}>Experiencia (opcional)</label>
      <textarea style={{ ...inp, resize: "none" }} rows={2} value={f.experiencia} onChange={e => set("experiencia", e.target.value)} placeholder="¿Has hecho mensajería antes? Cuéntanos." />

      {sectionTtl(2, "Identidad")}
      <label style={lbl}>Tipo de documento *</label>
      <select style={inp} value={f.docTipo} onChange={e => set("docTipo", e.target.value)}>
        <option>Carnet de identidad</option><option>Pasaporte</option><option>Licencia de conducir</option>
      </select>
      <label style={lbl}>Número de documento *</label>
      <input style={inp} value={f.docNumero} onChange={e => set("docNumero", e.target.value)} placeholder="Número" />
      {photoField("Foto del documento — frente *", "docFront")}
      {photoField("Foto del documento — reverso *", "docBack")}
      {photoField("Selfie de verificación * (tu cara, buena luz)", "selfie")}
      <div style={{ fontSize: 11, color: t3, background: dark ? "#1c1c20" : "#f1f5f9", borderRadius: 10, padding: "10px 12px", marginBottom: 4, lineHeight: 1.5 }}>🔒 Tu selfie se compara con tu documento para confirmar que eres tú. La revisión final la hace el equipo de RETADOR.</div>

      {sectionTtl(3, "Transporte")}
      <label style={lbl}>Medio de transporte *</label>
      <select style={inp} value={f.vehiculo} onChange={e => set("vehiculo", e.target.value)}>
        <option>A pie</option><option>Bicicleta</option><option>Moto</option><option>Auto</option>
      </select>
      {needsLicense && (
        <>
          <label style={lbl}>Número de licencia de conducir *</label>
          <input style={inp} value={f.licNumero} onChange={e => set("licNumero", e.target.value)} placeholder="Número de licencia" />
          {photoField("Foto de la licencia", "licFoto")}
          <label style={lbl}>Número de chapa (matrícula del vehículo) *</label>
          <input style={inp} value={f.chapa} onChange={e => set("chapa", e.target.value)} placeholder="Chapa / matrícula" />
        </>
      )}

      {sectionTtl(4, "Responsabilidad")}
      <label style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "13px", border: `1px solid ${f.acepta ? AC : bd}`, borderRadius: 12, cursor: "pointer", background: f.acepta ? AC + "0f" : "transparent" }}>
        <input type="checkbox" checked={f.acepta} onChange={e => set("acepta", e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, accentColor: AC, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: t1, lineHeight: 1.55 }}>Declaro que la información es verídica y acepto ser <b>totalmente responsable</b> de los bienes del comprador y del vendedor durante cada entrega, incluyendo el dinero cobrado en efectivo, hasta entregarlo a quien corresponde.</span>
      </label>

      {err && <div style={{ fontSize: 12.5, color: "#fff", background: "#ef4444", borderRadius: 10, padding: "10px 13px", marginTop: 14, fontWeight: 600 }}>{err}</div>}
      <button onClick={submit} style={{ width: "100%", height: 50, borderRadius: 14, border: "none", background: AC, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 18 }}>Enviar solicitud</button>
      <p style={{ fontSize: 10.5, color: t3, textAlign: "center", marginTop: 10 }}>Tu solicitud quedará en revisión hasta que el equipo de RETADOR la apruebe.</p>
    </div>
  );
}

function ProfileMain({ user, onMessages, onSettings, onOrders, onViewProfile, onAdmin, onWallet, onTools, onCourier, isOwner, profileData = {} }) {
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const { BG, S, B, CARD, T1, T2, T3, isDark, ts } = useAt();
  const name     = profileData.name || user?.name || "Usuario";
  const rating   = profileData.rating || 4.9;
  const sales    = profileData.sales || 0;
  const avatar   = profileData.avatar;
  // Render avatar: emoji or first letter
  const AvatarPreview = () => {
    if (avatar?.type === "emoji") return <span style={{ fontSize: 26 }}>{avatar.value}</span>;
    if (avatar?.type === "photo" && avatar.url) return <img src={avatar.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />;
    return <span style={{ fontSize: 22, fontWeight: 900, color: "#000" }}>{name[0]?.toUpperCase()}</span>;
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "22px 18px 110px" }}>

        {/* Avatar/nombre — toca para ver perfil completo */}
        <div onClick={onViewProfile} className="cd" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, background: CARD, border: `1px solid ${B}`, borderRadius: 16, padding: "14px 14px", cursor: "pointer" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${G},#7a5200)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 18px ${G}35`, overflow: "hidden" }}>
            <AvatarPreview />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15 * ts, fontWeight: 800, color: T1 }}>{name}</p>
            <p style={{ fontSize: 10 * ts, color: T2, marginTop: 2 }}>{user?.email || "Ver perfil completo"}</p>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 9 * ts, fontWeight: 700, color: "#9A7C2A", background: "#9A7C2A18", border: "1px solid #9A7C2A30", borderRadius: 4, padding: "2px 7px" }}>FREE</span>
              <span style={{ fontSize: 9 * ts, color: T3 }}>⭐ {rating} · {sales} ventas</span>
            </div>
          </div>
          <span style={{ color: T3, fontSize: 18 }}>›</span>
        </div>

        {[
          { ic: "msg",  label: "Mensajes",       sub: "Chats y conversaciones",     action: onMessages, color: G        },
          { ic: "pkg",  label: "Mis pedidos",     sub: "Historial de compras",       action: onOrders,   color: "#60A5FA" },
          { ic: "wallet", label: "Mi billetera",  sub: "Enviar, recibir, pagar y convertir", action: onWallet, color: "#22C55E" },
          { ic: "tools", label: "Herramientas",  sub: "Importador inteligente y más", action: onTools, color: "#6EE7B7" },
          { ic: "moto", label: "Modo Mensajero",  sub: "Gana dinero repartiendo pedidos", action: onCourier, color: "#6366F1" },
          { ic: "cog",  label: "Configuración",   sub: "Cuenta, privacidad, nombre", action: onSettings, color: "#94A3B8" },
          ...(isOwner ? [{ ic: "shield", label: "Panel de administración", sub: "Control total de la plataforma", action: onAdmin, color: "#F5A623" }] : []),
        ].map((it, i) => (
          <div key={i} className={it.action ? "cd" : ""} onClick={it.action || undefined}
            style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", marginBottom: 7,
              background: isDark ? "#0d0d0d" : S, border: `1px solid ${B}`, borderRadius: 14,
              opacity: it.action ? 1 : 0.6 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12,
              background: isDark ? it.color + "22" : it.color + "18",
              border: `1.5px solid ${it.color}55`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic n={it.ic} c={it.color} s={19} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13 * ts, fontWeight: 700, color: T1 }}>{it.label}</p>
              <p style={{ fontSize: 9 * ts, color: T2, marginTop: 1 }}>{it.sub}</p>
            </div>
            {it.action
              ? <span style={{ color: T3, fontSize: 18, fontWeight: 300 }}>›</span>
              : <span style={{ fontSize: 8 * ts, color: T2, fontWeight: 700, background: isDark ? "#141414" : B, borderRadius: 6, padding: "3px 7px" }}>PRONTO</span>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MENSAJES — usa RPC get_my_conversations (1 sola query)
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// FREE PROFILE — Perfil completo del usuario (Motor de Arranque)
// ═════════════════════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────────
//  INTEGRATION POINT — auth
//  const isOwner = useAuth().currentUser?.id === profile.ownerId
// ─────────────────────────────────────────────────────────────────
const FP_MOCK_IS_OWNER = true;

// ── DESIGN TOKENS — graphite dark, professional ───────────────────
const FP_DARK = {
  bg:          "#080A10",
  surface:     "#0D0F18",
  surfaceHigh: "#12151F",
  surfaceTop:  "#171A26",
  border:      "#1A1E2E",
  borderMid:   "#222638",
  borderHigh:  "#2C3148",
  accent:      "#4E7CF6",
  accentSoft:  "#1A2550",
  accentText:  "#7DA4FF",
  textPrimary:   "#E4E8F4",
  textSecondary: "#5A6480",
  textMuted:     "#2E3448",
  positive: "#19C37D", positiveDim: "#0D2218",
  warning:  "#D4982A", warningDim:  "#261C08",
  danger:   "#E05252", dangerDim:   "#280E0E",
};
const FP_LIGHT = {
  bg:          "#FFFFFF",
  surface:     "#FFFFFF",
  surfaceHigh: "#F2F3F5",
  surfaceTop:  "#F2F3F5",
  border:      "#E4E6EB",
  borderMid:   "#D9DBDF",
  borderHigh:  "#BCC0C4",
  accent:      "#4E7CF6",
  accentSoft:  "#E7F0FE",
  accentText:  "#1558D6",
  textPrimary:   "#050505",
  textSecondary: "#65676B",
  textMuted:     "#BCC0C4",
  positive: "#19C37D", positiveDim: "#E6FAF3",
  warning:  "#D4982A", warningDim:  "#FFF8E6",
  danger:   "#E05252", dangerDim:   "#FFF0F0",
};
const useFP_C = () => { const { isDark } = useAt(); return isDark ? FP_DARK : FP_LIGHT; };
const FP_C = FP_DARK; // backwards compat for module-level use
const FP_FH = "'Outfit', sans-serif";
const FP_FB = "'DM Sans', sans-serif";

// ── SVG ICON SYSTEM ───────────────────────────────────────────────
const FP_Icon = ({ d, size=16, color="currentColor", strokeWidth=1.6, fill="none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={color} strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);

const FP_Icons = {
  back:     "M19 12H5M5 12l7 7M5 12l7-7",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  heart:    "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  message:  "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  plus:     "M12 5v14M5 12h14",
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  chevronR: "M9 18l6-6-6-6",
  chevronD: "M6 9l6 6 6-6",
  camera:   "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z",
  user:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  package:  "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  bell:     "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  lock:     "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  key:      "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  file:     "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  instagram:"M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z",
  facebook: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
  music:    "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z",
  globe:    "M12 22a10 10 0 110-20 10 10 0 010 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  truck:    "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  handshake:"M18 11V6l-3 3M6 11V6l3 3M2 12h20M6 13v5M18 13v5M10 12v6M14 12v6",
  radio:    "M12 22a10 10 0 110-20 10 10 0 010 20zM12 6a6 6 0 110 12A6 6 0 0112 6zM12 10a2 2 0 110 4 2 2 0 010-4z",
};

// Star with fill support
const FP_StarIcon = ({ filled, size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? FP_C.warning : "none"}
    stroke={filled ? FP_C.warning : FP_C.borderMid}
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

function FP_StarRow({ count, size=14, interactive=false, onSet }) {
  const FP_C = useFP_C();
  const [hov, setHov] = useState(0);
  return (
    <span style={{ display:"inline-flex", gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ cursor: interactive ? "pointer" : "default" }}
          onMouseEnter={() => interactive && setHov(i)}
          onMouseLeave={() => interactive && setHov(0)}
          onClick={() => interactive && onSet && onSet(i)}>
          <FP_StarIcon filled={(interactive ? (hov || count) : count) >= i} size={size}/>
        </span>
      ))}
    </span>
  );
}

// ── MOCK DATA ─────────────────────────────────────────────────────
const FP_INITIAL_REVIEWS = [
  { id:1, user:"María G.",  stars:5, text:"Llegó rápido, exactamente como en la foto. Muy recomendado.", date:"hace 2 días" },
  { id:2, user:"Carlos R.", stars:4, text:"Muy buena calidad, responde rápido. Sin problemas.",          date:"hace 1 semana" },
  { id:3, user:"Sofía M.",  stars:5, text:"Vendedor confiable, volvería a comprar sin duda.",            date:"hace 2 semanas" },
  { id:4, user:"Andrés P.", stars:5, text:"Todo perfecto, llegó antes de lo esperado.",                  date:"hace 1 mes" },
];

const FP_PRODUCTS = [
  { id:1, name:"Tenis Nike Air Max",  price:"$1,200", emoji:"👟", sales:14, tag:"Popular"    },
  { id:2, name:"Mochila Urbana",      price:"$580",   emoji:"🎒", sales:7,  tag:null          },
  { id:3, name:"Audífonos Bluetooth", price:"$890",   emoji:"🎧", sales:22, tag:"Más vendido" },
  { id:4, name:"Gorra Streetwear",    price:"$320",   emoji:"🧢", sales:3,  tag:null          },
  { id:5, name:"Camisa Casual",       price:"$450",   emoji:"👕", sales:9,  tag:null          },
  { id:6, name:"Reloj Vintage",       price:"$1,650", emoji:"⌚", sales:5,  tag:"Nuevo"       },
];

const FP_EMOJI_CATS = [
  { label:"😀", emojis:["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😋","😛","😜","🤪","😎","🤓","🧐","😏","😒","🙄","😬","😌","😴","😷","🤒","🤕","🥳","😈","👿","💀","👻","👽","🤖","🥸","😺","😸","😻","😼","😽","🙀","😿"] },
  { label:"🧑", emojis:["🧑","👦","👧","👨","👩","🧓","👴","👵","👶","🧒","👱","🧔","🧕","🎅","🤶","🧙","🧝","🧛","🧟","🧞","🧜","🧚","👼","🤰","🙍","🙅","🙆","💁","🙋","🙇","🤦","🤷","👮","💂","👷","🤴","👸","🦸","🦹","💆","💇","🚶","🏃","💃","🕺"] },
  { label:"🐶", emojis:["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐺","🐴","🦄","🦋","🐢","🐍","🐙","🐟","🐬","🐳","🦈","🐅","🐆","🦓","🐘","🦒","🦘","🐕","🐈","🦊","🦔"] },
  { label:"⚽", emojis:["⚽","🏀","🏈","⚾","🎾","🎱","🏆","🥇","🎸","🎧","🎮","🧩","💎","🔮","🎈","🎉","🎁","💻","📱","⌚","📷","🔑","🏠","🚗","✈️","🚀","🔥","💫","🌈","❄️","🌊","🍕","🎂","☕","🌸","🌺","🌻","🍀","🌴","🌵"] },
  { label:"❤️", emojis:["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","✨","💫","⭐","🌟","💥","💯","✅","❌","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","👑","🎵","🎶"] },
];

const FP_SHIPPING_OPTS = ["Mismo día","1–2 días hábiles","1–3 días hábiles","3–5 días hábiles","Con el comprador"];
const FP_RESPONSE_OPTS = ["Menos de 1 hora","Aprox. 2 horas","Aprox. 4 horas","Mismo día","1–2 días"];

// ── BASE UI COMPONENTS ────────────────────────────────────────────
const fpInputStyle = (FP_C) => ({
  width:"100%", background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
  borderRadius:8, padding:"10px 12px", fontSize:13, color:FP_C.textPrimary,
  fontFamily:FP_FB, outline:"none", boxSizing:"border-box",
  transition:"border-color 0.15s",
});

function FP_Label({ children }) {
  const FP_C = useFP_C();
  return <div style={{ fontSize:10, fontWeight:700, color:FP_C.textSecondary, fontFamily:FP_FH,
    letterSpacing:"0.7px", textTransform:"uppercase", marginBottom:6 }}>{children}</div>;
}
function FP_Field({ label, children }) {
  const FP_C = useFP_C();
  return <div style={{ marginBottom:14 }}><FP_Label>{label}</FP_Label>{children}</div>;
}
function FP_SectionHead({ children }) {
  const FP_C = useFP_C();
  return <div style={{ fontSize:10, fontWeight:700, color:FP_C.textMuted, fontFamily:FP_FH,
    letterSpacing:"0.7px", textTransform:"uppercase", marginBottom:10 }}>{children}</div>;
}
function FP_Divider() {
  const FP_C = useFP_C();
  return <div style={{ height:1, background:FP_C.border }}/>;
}
function FP_Toggle({ on, onChange }) {
  const FP_C = useFP_C();
  return (
    <div onClick={onChange} style={{ width:38, height:20, borderRadius:10, flexShrink:0,
      background: on ? FP_C.accent : FP_C.borderMid,
      position:"relative", transition:"background 0.2s", cursor:"pointer" }}>
      <div style={{ width:14, height:14, borderRadius:"50%", background:"#fff",
        position:"absolute", top:3, left: on ? 21 : 3,
        transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.5)" }}/>
    </div>
  );
}
function FP_Btn({ children, variant="primary", onClick, disabled=false, style={} }) {
  const FP_C = useFP_C();
  const styles = {
    primary:   { background: FP_C.accent,       border:"none",                         color:"#fff" },
    secondary: { background: FP_C.surfaceTop,   border:`1px solid ${FP_C.borderMid}`,     color:FP_C.textSecondary },
    ghost:     { background: "transparent",  border:`1px solid ${FP_C.border}`,        color:FP_C.textSecondary },
    danger:    { background: FP_C.dangerDim,    border:`1px solid ${FP_C.danger}33`,      color:FP_C.danger },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], borderRadius:8, padding:"10px 16px",
      fontSize:13, fontWeight:600, fontFamily:FP_FH, cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?0.4:1, transition:"opacity 0.15s, background 0.15s",
      ...style,
    }}>{children}</button>
  );
}
function FP_Row({ children, border=false, onClick, style={} }) {
  const FP_C = useFP_C();
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center",
      justifyContent:"space-between", padding:"12px 16px",
      borderBottom: border ? `1px solid ${FP_C.border}` : "none",
      cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

// ── AVATAR ────────────────────────────────────────────────────────
function FP_Avatar({ avatar, size=72, fontSize=34 }) {
  const FP_C = useFP_C();
  const isImg = avatar?.type === "image";
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0,
      background: isImg ? "transparent" : FP_C.surfaceTop,
      border:`1px solid ${FP_C.borderMid}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize, overflow:"hidden" }}>
      {isImg
        ? <img src={avatar.value} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        : <span>{avatar?.value || "😊"}</span>
      }
    </div>
  );
}

// ── AVATAR PICKER ─────────────────────────────────────────────────
function FP_AvatarPicker({ current, onSelect, onClose }) {
  const FP_C = useFP_C();
  const [catIdx, setCatIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [mode,   setMode]   = useState("emoji");
  const [fileErr, setFileErr] = useState("");
  const fileRef = useRef();

  const emojis = search
    ? FP_EMOJI_CATS.flatMap(c => c.emojis).filter(e => e.includes(search))
    : FP_EMOJI_CATS[catIdx].emojis;

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFileErr("La imagen supera los 5 MB. Elige una más liviana."); return; }
    setFileErr("");
    const reader = new FileReader();
    reader.onload = ev => onSelect({ type:"image", value:ev.target.result });
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600,
      background:FP_C.bg, display:"flex", flexDirection:"column" }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", height:50, flexShrink:0,
        borderBottom:`1px solid ${FP_C.border}` }}>
        <button onClick={onClose} style={{ background:"none", border:"none",
          cursor:"pointer", display:"flex", alignItems:"center", gap:8,
          color:FP_C.textSecondary, padding:0 }}>
          <FP_Icon d={FP_Icons.back} size={18} color={FP_C.textSecondary}/>
          <span style={{ fontSize:13, fontWeight:600, fontFamily:FP_FB }}>Cancelar</span>
        </button>
        <span style={{ fontFamily:FP_FH, fontWeight:700, fontSize:14, color:FP_C.textPrimary }}>
          Foto de perfil
        </span>
        <div style={{ width:80 }}/>
      </div>

      {/* Mode tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${FP_C.border}`, flexShrink:0 }}>
        {[["emoji","Emoji"],["upload","Subir foto"]].map(([m,l]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, background:"none", border:"none", cursor:"pointer",
            padding:"13px", fontSize:13, fontWeight: mode===m ? 700 : 500,
            color: mode===m ? FP_C.textPrimary : FP_C.textSecondary,
            fontFamily:FP_FB,
            borderBottom: mode===m ? `2px solid ${FP_C.accent}` : "2px solid transparent",
            transition:"all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {mode === "emoji" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Search */}
          <div style={{ padding:"12px 20px 8px", flexShrink:0 }}>
            <input placeholder="Buscar emoji…" value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => e.target.style.borderColor = FP_C.accent}
              onBlur={e => e.target.style.borderColor = FP_C.border}
              style={{ ...fpInputStyle(FP_C) }}/>
          </div>
          {/* Category tabs */}
          {!search && (
            <div style={{ display:"flex", gap:4, padding:"0 20px 10px",
              flexShrink:0, overflowX:"auto" }}>
              {FP_EMOJI_CATS.map((cat, i) => (
                <button key={i} onClick={() => setCatIdx(i)} style={{
                  background: catIdx===i ? FP_C.surfaceTop : "none",
                  border:`1px solid ${catIdx===i ? FP_C.borderMid : "transparent"}`,
                  borderRadius:8, padding:"6px 10px", fontSize:18,
                  cursor:"pointer", flexShrink:0,
                }}>{cat.label}</button>
              ))}
            </div>
          )}
          {/* Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)",
            gap:2, padding:"4px 20px 20px", overflowY:"auto", flex:1 }}>
            {emojis.map((e, i) => (
              <button key={i} onClick={() => onSelect({ type:"emoji", value:e })}
                style={{
                  background: current?.value===e ? FP_C.accentSoft : "none",
                  border:`1px solid ${current?.value===e ? FP_C.accent : "transparent"}`,
                  borderRadius:8, padding:"7px 0", fontSize:24,
                  cursor:"pointer", lineHeight:1.2,
                }}>{e}</button>
            ))}
            {emojis.length === 0 && (
              <div style={{ gridColumn:"1/-1", textAlign:"center",
                color:FP_C.textMuted, fontSize:13, padding:"30px 0" }}>
                Sin resultados
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:20, padding:32 }}>
          <input ref={fileRef} type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display:"none" }} onChange={handleFile}/>

          <div onClick={() => fileRef.current.click()} style={{
            width:120, height:120, borderRadius:"50%",
            background:FP_C.surfaceTop, border:`2px dashed ${FP_C.borderMid}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            overflow:"hidden", cursor:"pointer",
          }}>
            {current?.type==="image"
              ? <img src={current.value} alt="preview"
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <FP_Icon d={FP_Icons.camera} size={32} color={FP_C.textMuted}/>
            }
          </div>

          <div style={{ textAlign:"center" }}>
            <FP_Btn onClick={() => fileRef.current.click()} style={{ marginBottom:10 }}>
              Seleccionar imagen
            </FP_Btn>
            <div style={{ fontSize:11, color:FP_C.textMuted }}>JPG, PNG o WEBP · Máx. 5 MB</div>
            {fileErr && <div style={{ fontSize:11.5, color:"#ef4444", marginTop:8, fontWeight:600 }}>{fileErr}</div>}
          </div>

          {current?.type==="image" && (
            <FP_Btn variant="ghost" onClick={() => onSelect({ type:"emoji", value:"😊" })}>
              Quitar foto
            </FP_Btn>
          )}
        </div>
      )}
    </div>
  );
}

// ── PRODUCT CARD ──────────────────────────────────────────────────
const FP_TAG_STYLE = {
  "Más vendido": { bg:FP_C.warningDim,  color:FP_C.warning,  border:"#3D2D0A" },
  "Popular":     { bg:FP_C.positiveDim, color:FP_C.positive, border:"#0D2218" },
  "Nuevo":       { bg:FP_C.accentSoft,  color:FP_C.accentText, border:"#1A2550" },
};

function FP_ProductCard({ product, onClick, onDelete, onEdit }) {
  const FP_C = useFP_C();
  const [liked, setLiked] = useState(false);
  const tc = FP_TAG_STYLE[product.tag] || {};
  const own = !!(onDelete || onEdit);
  const ownBtn = { background:"rgba(0,0,0,.35)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)", borderRadius:8, width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" };
  return (
    <div onClick={onClick} style={{ background:FP_C.surface, borderRadius:10, overflow:"hidden",
      border:`1px solid ${FP_C.border}`, cursor:"pointer", position:"relative",
      transition:"border-color 0.15s, transform 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=FP_C.borderMid; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=FP_C.border; e.currentTarget.style.transform="none"; }}>

      {(product.tag || product.badge) && (
        <div style={{ position:"absolute", top:8, left:8, zIndex:2,
          background:tc.bg || "rgba(245,166,35,.9)", border:`1px solid ${tc.border || "transparent"}`,
          color:tc.color || "#111", borderRadius:4, padding:"2px 7px",
          fontSize:9, fontWeight:700, fontFamily:FP_FH, letterSpacing:"0.4px" }}>
          {(product.tag || product.badge).toUpperCase()}
        </div>
      )}

      {own ? (
        <div style={{ position:"absolute", top:8, right:8, zIndex:2, display:"flex", gap:6 }}>
          {onEdit && (
            <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ ...ownBtn, border:`1px solid rgba(255,255,255,.28)` }}>
              <Edit2 size={13} color="#fff" />
            </button>
          )}
          {onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ ...ownBtn, border:`1px solid rgba(239,68,68,.55)`, background:"rgba(239,68,68,.12)" }}>
              <Trash2 size={13} color="#ef4444" />
            </button>
          )}
        </div>
      ) : (
      <button onClick={e => { e.stopPropagation(); setLiked(!liked); }} style={{
        position:"absolute", top:8, right:8, zIndex:2,
        background:"rgba(8,10,16,0.7)", backdropFilter:"blur(6px)",
        border:`1px solid ${FP_C.border}`, borderRadius:6,
        width:28, height:28, cursor:"pointer", display:"flex",
        alignItems:"center", justifyContent:"center",
      }}>
        <FP_Icon d={FP_Icons.heart} size={14}
          color={liked ? FP_C.danger : FP_C.textSecondary}
          fill={liked ? FP_C.danger : "none"}/>
      </button>
      )}

      <div style={{ height:110, background:FP_C.surfaceHigh,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, overflow:"hidden" }}>
        {product.image ? <img src={product.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display="none"}/> : (product.emoji || "📦")}
      </div>

      <div style={{ padding:"10px 12px 13px" }}>
        <div style={{ fontSize:12, fontWeight:500, color:FP_C.textSecondary,
          fontFamily:FP_FB, lineHeight:1.3, marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {product.name || product.title}
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:FP_C.textPrimary, fontFamily:FP_FH }}>
          {typeof product.price === "number" ? "$" + product.price.toLocaleString() : product.price}
        </div>
        {product.sales != null && <div style={{ fontSize:10, color:FP_C.textMuted, marginTop:3 }}>
          {product.sales} vendidos
        </div>}
      </div>
    </div>
  );
}

// ── REVIEW FORM (visitors) ────────────────────────────────────────
function FP_ReviewForm({ onSubmit, onCancel }) {
  const FP_C = useFP_C();
  const [stars, setStars] = useState(0);
  const [text,  setText]  = useState("");
  const [name,  setName]  = useState("");
  const ok = stars > 0 && text.trim().length > 5 && name.trim().length > 1;

  const labels = ["","Malo","Regular","Bueno","Muy bueno","Excelente"];

  return (
    <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.borderMid}`,
      borderRadius:10, padding:"18px", marginBottom:12 }}>
      <div style={{ fontSize:14, fontWeight:700, color:FP_C.textPrimary,
        fontFamily:FP_FH, marginBottom:16 }}>
        Escribir reseña
      </div>

      <FP_Field label="Tu nombre">
        <input value={name} placeholder="Nombre"
          onChange={e => setName(e.target.value)}
          onFocus={e => e.target.style.borderColor = FP_C.accent}
          onBlur={e => e.target.style.borderColor = FP_C.border}
          style={fpInputStyle(FP_C)}/>
      </FP_Field>

      <div style={{ marginBottom:14 }}>
        <FP_Label>Calificación</FP_Label>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <FP_StarRow count={stars} size={22} interactive onSet={setStars}/>
          {stars > 0 && (
            <span style={{ fontSize:12, color:FP_C.textSecondary, fontFamily:FP_FB }}>
              {labels[stars]}
            </span>
          )}
        </div>
      </div>

      <FP_Field label="Comentario">
        <textarea value={text} placeholder="Describe tu experiencia con este vendedor…"
          onChange={e => setText(e.target.value)}
          onFocus={e => e.target.style.borderColor = FP_C.accent}
          onBlur={e => e.target.style.borderColor = FP_C.border}
          rows={3} maxLength={300}
          style={{ ...fpInputStyle(FP_C), resize:"none", lineHeight:1.55 }}/>
        <div style={{ fontSize:10, color:FP_C.textMuted, textAlign:"right", marginTop:3 }}>
          {text.length}/300
        </div>
      </FP_Field>

      <div style={{ display:"flex", gap:8 }}>
        <FP_Btn onClick={() => ok && onSubmit({ name, stars, text })}
          disabled={!ok} style={{ flex:1 }}>
          Publicar
        </FP_Btn>
        <FP_Btn variant="secondary" onClick={onCancel} style={{ flex:1 }}>
          Cancelar
        </FP_Btn>
      </div>
    </div>
  );
}

// ── PRO MODAL ─────────────────────────────────────────────────────
function FP_ProModal({ onClose }) {
  const FP_C = useFP_C();
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0,
      background:"rgba(0,0,0,0.85)", backdropFilter:"blur(16px)",
      zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#0A0B14", border:"1px solid #1E1A40",
        borderRadius:16, width:"100%", maxWidth:400,
        overflow:"hidden", boxShadow:"0 40px 100px rgba(0,0,0,0.8)",
      }}>
        <div style={{ background:"linear-gradient(160deg,#0A0A18,#12103A)",
          padding:"28px 24px 24px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-60, right:-30, width:220, height:220,
            borderRadius:"50%", background:"rgba(80,60,200,0.08)", filter:"blur(40px)" }}/>
          <div style={{ position:"relative" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6,
              background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)",
              borderRadius:6, padding:"4px 10px", marginBottom:14 }}>
              <span style={{ fontSize:10, fontWeight:700, color:"#A78BFA",
                fontFamily:FP_FH, letterSpacing:"0.8px" }}>PRO PLAN</span>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:"#fff",
              fontFamily:FP_FH, marginBottom:4 }}>
              Tienda profesional
            </div>
            <div style={{ fontSize:13, color:"#4A5270", marginBottom:20, fontFamily:FP_FB }}>
              Todo lo que necesitas para escalar tus ventas.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                [FP_Icons.package,  "Página de tienda"],
                [FP_Icons.eye,      "Tema de marca"],
                [FP_Icons.zap,      "Analytics en vivo"],
                [FP_Icons.shield,   "Badge verificado"],
                [FP_Icons.plus,     "Productos ilimitados"],
                [FP_Icons.star,     "IA asistente"],
              ].map(([icon, label]) => (
                <div key={label} style={{ background:"rgba(255,255,255,0.03)",
                  border:"1px solid rgba(255,255,255,0.05)",
                  borderRadius:8, padding:"9px 12px",
                  display:"flex", alignItems:"center", gap:8 }}>
                  <FP_Icon d={icon} size={14} color="#5A6480"/>
                  <span style={{ fontSize:12, color:"#5A6480", fontFamily:FP_FB }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding:"20px 24px 24px" }}>
          <FP_Btn style={{ width:"100%", marginBottom:8,
            background:"linear-gradient(135deg,#5B45D4,#7C3AED)",
            boxShadow:"0 4px 20px rgba(91,69,212,0.3)" }}>
            Ver planes Pro
          </FP_Btn>
          <FP_Btn variant="secondary" onClick={onClose} style={{ width:"100%" }}>
            Ahora no
          </FP_Btn>
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS SCREEN ───────────────────────────────────────────────
// ── CHANGE EMAIL SCREEN ──────────────────────────────────────────
function FP_ChangeEmailScreen({ onBack }) {
  const FP_C = useFP_C();
  const [step,        setStep]        = useState("form");   // "form" | "sent"
  const [newEmail,    setNewEmail]    = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  // Basic email validation
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail);
  const canSubmit = emailOk && confirmPass.length >= 1 && !loading;

  function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    // INTEGRATION POINT: POST /api/user/change-email
    // Body: { newEmail, currentPassword: confirmPass }
    // On success: send verification link to both old & new email → setStep("sent")
    // On error:   setError("Contraseña incorrecta") or "Correo ya en uso"
    setTimeout(() => { setLoading(false); setStep("sent"); }, 1200);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600,
      background:FP_C.bg, display:"flex", flexDirection:"column" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", height:50, flexShrink:0, background:FP_C.bg,
        borderBottom:`1px solid ${FP_C.border}`, position:"sticky", top:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none",
          cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:0 }}>
          <FP_Icon d={FP_Icons.back} size={18} color={FP_C.textSecondary}/>
          <span style={{ fontSize:13, fontWeight:600, fontFamily:FP_FB, color:FP_C.textSecondary }}>
            Atrás
          </span>
        </button>
        <span style={{ fontFamily:FP_FH, fontWeight:700, fontSize:14, color:FP_C.textPrimary }}>
          Cambiar correo
        </span>
        <div style={{ width:60 }}/>
      </div>

      <div style={{ flex:1, padding:"32px 24px", display:"flex", flexDirection:"column" }}>
        {step === "form" ? (
          <>
            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:16, fontWeight:700, color:FP_C.textPrimary,
                fontFamily:FP_FH, marginBottom:6 }}>
                Actualiza tu correo electrónico
              </div>
              <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.6 }}>
                Ingresa el nuevo correo y confirma tu contraseña actual.
                Recibirás un enlace de verificación en ambas direcciones.
              </div>
            </div>

            <FP_Field label="Nuevo correo electrónico">
              <input
                type="email"
                value={newEmail}
                placeholder="nuevo@correo.com"
                onChange={e => { setNewEmail(e.target.value); setError(""); }}
                onFocus={e => e.target.style.borderColor = FP_C.accent}
                onBlur={e => e.target.style.borderColor =
                  newEmail && !emailOk ? FP_C.danger : FP_C.border}
                style={{
                  ...fpInputStyle(FP_C),
                  borderColor: newEmail && !emailOk ? FP_C.danger : FP_C.border,
                }}
              />
              {newEmail && !emailOk && (
                <div style={{ fontSize:11, color:FP_C.danger, marginTop:5 }}>
                  Ingresa un correo válido
                </div>
              )}
            </FP_Field>

            <FP_Field label="Confirma tu contraseña actual">
              <div style={{ position:"relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPass}
                  placeholder="Tu contraseña actual"
                  onChange={e => { setConfirmPass(e.target.value); setError(""); }}
                  onFocus={e => e.target.style.borderColor = FP_C.accent}
                  onBlur={e => e.target.style.borderColor = FP_C.border}
                  style={{ ...fpInputStyle(FP_C), paddingRight:44 }}
                />
                <button onClick={() => setShowPass(!showPass)} style={{
                  position:"absolute", right:12, top:"50%",
                  transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", padding:2,
                }}>
                  <FP_Icon d={showPass ? FP_Icons.eye : FP_Icons.lock}
                    size={16} color={FP_C.textMuted}/>
                </button>
              </div>
            </FP_Field>

            {error && (
              <div style={{ background:FP_C.dangerDim, border:`1px solid ${FP_C.danger}33`,
                borderRadius:8, padding:"10px 12px", marginBottom:16,
                fontSize:12, color:FP_C.danger, display:"flex", alignItems:"center", gap:8 }}>
                <FP_Icon d={FP_Icons.x} size={14} color={FP_C.danger}/>
                {error}
              </div>
            )}

            <div style={{ marginTop:"auto", paddingTop:16 }}>
              <FP_Btn onClick={handleSubmit} disabled={!canSubmit}
                style={{ width:"100%", padding:"13px",
                  opacity: loading ? 0.7 : canSubmit ? 1 : 0.4 }}>
                {loading ? "Enviando…" : "Enviar enlace de verificación"}
              </FP_Btn>
            </div>
          </>
        ) : (
          /* ── SENT STATE ── */
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", textAlign:"center", gap:16 }}>
            <div style={{ width:64, height:64, borderRadius:"50%",
              background:FP_C.positiveDim, border:`1px solid #0D2218`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <FP_Icon d={FP_Icons.mail} size={28} color={FP_C.positive}/>
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:FP_C.textPrimary,
                fontFamily:FP_FH, marginBottom:8 }}>
                Revisa tu correo
              </div>
              <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.7, maxWidth:300 }}>
                Enviamos un enlace de verificación a{" "}
                <strong style={{ color:FP_C.textPrimary }}>{newEmail}</strong>.
                El cambio se aplica al confirmar desde ese correo.
              </div>
            </div>
            <FP_Btn variant="secondary" onClick={onBack} style={{ marginTop:8 }}>
              Volver a configuración
            </FP_Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CHANGE PASSWORD SCREEN ────────────────────────────────────────
function FP_ChangePasswordScreen({ hasPassword, onBack }) {
  const FP_C = useFP_C();
  // hasPassword: false = usuario aún no tiene contraseña configurada (entra directo a la app)
  //              true  = tiene contraseña y quiere cambiarla
  // INTEGRATION POINT: GET /api/user → { hasPassword: boolean }

  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);

  // Password strength
  function strength(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)         s++;
    if (/[A-Z]/.test(pw))       s++;
    if (/[0-9]/.test(pw))       s++;
    if (/[^A-Za-z0-9]/.test(pw))s++;
    return s;
  }
  const str = strength(newPw);
  const strLabel = ["","Débil","Regular","Buena","Fuerte"][str];
  const strColor = [FP_C.textMuted, FP_C.danger, FP_C.warning, FP_C.accentText, FP_C.positive][str];

  const mismatch = confirmPw && newPw !== confirmPw;
  const canSubmit =
    (!hasPassword || currentPw.length >= 1) &&
    newPw.length >= 8 && str >= 2 && !mismatch && !loading;

  function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    // INTEGRATION POINT:
    // Si hasPassword:   POST /api/user/change-password  { currentPassword, newPassword }
    // Si !hasPassword:  POST /api/user/set-password     { newPassword }
    // On error: setError("Contraseña actual incorrecta")
    setTimeout(() => { setLoading(false); setDone(true); }, 1200);
  }

  const eyeBtn = (show, setShow) => (
    <button onClick={() => setShow(!show)} style={{
      position:"absolute", right:12, top:"50%",
      transform:"translateY(-50%)",
      background:"none", border:"none", cursor:"pointer", padding:2,
    }}>
      <FP_Icon d={show ? FP_Icons.eye : FP_Icons.lock} size={16} color={FP_C.textMuted}/>
    </button>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600,
      background:FP_C.bg, display:"flex", flexDirection:"column" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", height:50, flexShrink:0, background:FP_C.bg,
        borderBottom:`1px solid ${FP_C.border}`, position:"sticky", top:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none",
          cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:0 }}>
          <FP_Icon d={FP_Icons.back} size={18} color={FP_C.textSecondary}/>
          <span style={{ fontSize:13, fontWeight:600, fontFamily:FP_FB, color:FP_C.textSecondary }}>
            Atrás
          </span>
        </button>
        <span style={{ fontFamily:FP_FH, fontWeight:700, fontSize:14, color:FP_C.textPrimary }}>
          {hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
        </span>
        <div style={{ width:60 }}/>
      </div>

      <div style={{ flex:1, padding:"32px 24px", display:"flex", flexDirection:"column",
        overflowY:"auto" }}>
        {!done ? (
          <>
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:16, fontWeight:700, color:FP_C.textPrimary,
                fontFamily:FP_FH, marginBottom:6 }}>
                {hasPassword ? "Actualiza tu contraseña" : "Protege tu cuenta"}
              </div>
              <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.6 }}>
                {hasPassword
                  ? "Ingresa tu contraseña actual y luego la nueva."
                  : "Si creas una contraseña, se te pedirá cada vez que abras la app."
                }
              </div>
            </div>

            {/* Contraseña actual — solo si ya tiene una */}
            {hasPassword && (
              <FP_Field label="Contraseña actual">
                <div style={{ position:"relative" }}>
                  <input type={showCur ? "text" : "password"}
                    value={currentPw} placeholder="Tu contraseña actual"
                    onChange={e => { setCurrentPw(e.target.value); setError(""); }}
                    onFocus={e => e.target.style.borderColor = FP_C.accent}
                    onBlur={e => e.target.style.borderColor = FP_C.border}
                    style={{ ...fpInputStyle(FP_C), paddingRight:44 }}/>
                  {eyeBtn(showCur, setShowCur)}
                </div>
              </FP_Field>
            )}

            {/* Nueva contraseña */}
            <FP_Field label={hasPassword ? "Nueva contraseña" : "Contraseña"}>
              <div style={{ position:"relative" }}>
                <input type={showNew ? "text" : "password"}
                  value={newPw} placeholder="Mínimo 8 caracteres"
                  onChange={e => { setNewPw(e.target.value); setError(""); }}
                  onFocus={e => e.target.style.borderColor = FP_C.accent}
                  onBlur={e => e.target.style.borderColor = FP_C.border}
                  style={{ ...fpInputStyle(FP_C), paddingRight:44 }}/>
                {eyeBtn(showNew, setShowNew)}
              </div>
              {/* Strength bar */}
              {newPw.length > 0 && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:5 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:3, borderRadius:2,
                        background: str >= i ? strColor : FP_C.borderMid,
                        transition:"background 0.2s" }}/>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:strColor, fontWeight:600 }}>
                    {strLabel}
                    {str < 2 && " · Agrega mayúsculas, números o símbolos"}
                  </div>
                </div>
              )}
            </FP_Field>

            {/* Confirmar contraseña */}
            <FP_Field label="Confirmar contraseña">
              <div style={{ position:"relative" }}>
                <input type={showConf ? "text" : "password"}
                  value={confirmPw} placeholder="Repite la contraseña"
                  onChange={e => setConfirmPw(e.target.value)}
                  onFocus={e => e.target.style.borderColor = FP_C.accent}
                  onBlur={e => e.target.style.borderColor =
                    mismatch ? FP_C.danger : FP_C.border}
                  style={{ ...fpInputStyle(FP_C), paddingRight:44,
                    borderColor: mismatch ? FP_C.danger : FP_C.border }}/>
                {eyeBtn(showConf, setShowConf)}
              </div>
              {mismatch && (
                <div style={{ fontSize:11, color:FP_C.danger, marginTop:5 }}>
                  Las contraseñas no coinciden
                </div>
              )}
            </FP_Field>

            {/* Requisitos */}
            <div style={{ background:FP_C.surfaceHigh, border:`1px solid ${FP_C.border}`,
              borderRadius:8, padding:"12px 14px", marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:700, color:FP_C.textMuted,
                fontFamily:FP_FH, letterSpacing:"0.5px", textTransform:"uppercase",
                marginBottom:8 }}>
                Requisitos
              </div>
              {[
                { ok: newPw.length >= 8,          text:"Mínimo 8 caracteres" },
                { ok: /[A-Z]/.test(newPw),         text:"Al menos una mayúscula" },
                { ok: /[0-9]/.test(newPw),         text:"Al menos un número" },
                { ok: /[^A-Za-z0-9]/.test(newPw), text:"Al menos un símbolo (!@#…)" },
              ].map((r, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
                  marginBottom:i<3?6:0 }}>
                  <FP_Icon d={r.ok ? FP_Icons.check : FP_Icons.x} size={13}
                    color={r.ok ? FP_C.positive : FP_C.textMuted}/>
                  <span style={{ fontSize:12,
                    color: r.ok ? FP_C.textPrimary : FP_C.textSecondary }}>
                    {r.text}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background:FP_C.dangerDim, border:`1px solid ${FP_C.danger}33`,
                borderRadius:8, padding:"10px 12px", marginBottom:16,
                fontSize:12, color:FP_C.danger, display:"flex", alignItems:"center", gap:8 }}>
                <FP_Icon d={FP_Icons.x} size={14} color={FP_C.danger}/>
                {error}
              </div>
            )}

            <div style={{ marginTop:"auto", paddingTop:8 }}>
              <FP_Btn onClick={handleSubmit} disabled={!canSubmit}
                style={{ width:"100%", padding:"13px",
                  opacity: loading ? 0.7 : 1 }}>
                {loading
                  ? "Guardando…"
                  : hasPassword ? "Actualizar contraseña" : "Crear contraseña"
                }
              </FP_Btn>
            </div>
          </>
        ) : (
          /* ── SUCCESS ── */
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            textAlign:"center", gap:16 }}>
            <div style={{ width:64, height:64, borderRadius:"50%",
              background:FP_C.positiveDim, border:`1px solid #0D2218`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <FP_Icon d={FP_Icons.check} size={28} color={FP_C.positive}/>
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:FP_C.textPrimary,
                fontFamily:FP_FH, marginBottom:8 }}>
                {hasPassword ? "Contraseña actualizada" : "Contraseña creada"}
              </div>
              <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.7 }}>
                {hasPassword
                  ? "Tu contraseña fue cambiada correctamente."
                  : "A partir de ahora se te pedirá tu contraseña al abrir la app."
                }
              </div>
            </div>
            <FP_Btn variant="secondary" onClick={onBack} style={{ marginTop:8 }}>
              Volver a configuración
            </FP_Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS SCREEN ───────────────────────────────────────────────
function FP_SettingsScreen({ onClose }) {
  const FP_C = useFP_C();
  const [notif,      setNotif]      = useState({ ventas:true, mensajes:true, reseñas:true, promo:false });
  const [privacy,    setPrivacy]    = useState("public");
  const [subScreen,  setSubScreen]  = useState(null); // null | "email" | "password"

  // INTEGRATION POINT:
  // const { settings, save } = useSettings()   → GET/POST /api/user/settings
  // const { hasPassword }    = useAuth()        → GET /api/user → { hasPassword: bool }
  // onLogout()  → auth.signOut()
  // onDelete()  → DELETE /api/user (con confirmación)
  const hasPassword = false; // INTEGRATION POINT: reemplazar con dato real del backend

  if (subScreen === "email")    return <FP_ChangeEmailScreen    onBack={() => setSubScreen(null)}/>;
  if (subScreen === "password") return <FP_ChangePasswordScreen hasPassword={hasPassword} onBack={() => setSubScreen(null)}/>;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500,
      background:FP_C.bg, overflowY:"auto", display:"flex", flexDirection:"column" }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", height:50, flexShrink:0, background:FP_C.bg,
        borderBottom:`1px solid ${FP_C.border}`, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"none", border:"none",
          cursor:"pointer", display:"flex", alignItems:"center", gap:8,
          color:FP_C.textSecondary, padding:0 }}>
          <FP_Icon d={FP_Icons.back} size={18} color={FP_C.textSecondary}/>
          <span style={{ fontSize:13, fontWeight:600, fontFamily:FP_FB, color:FP_C.textSecondary }}>
            Atrás
          </span>
        </button>
        <span style={{ fontFamily:FP_FH, fontWeight:700, fontSize:14, color:FP_C.textPrimary }}>
          Configuración
        </span>
        <div style={{ width:70 }}/>
      </div>

      <div style={{ padding:"20px 20px 60px" }}>

        {/* Plan banner */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          background:FP_C.accentSoft, border:`1px solid ${FP_C.accent}22`,
          borderRadius:10, padding:"12px 14px", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:FP_C.accentText, fontFamily:FP_FH }}>
              Motor de Arranque
            </div>
            <div style={{ fontSize:11, color:FP_C.textSecondary, marginTop:1 }}>
              Plan gratuito activo
            </div>
          </div>
          <div style={{ fontSize:10, fontWeight:700, color:FP_C.accentText, fontFamily:FP_FH,
            background:FP_C.bg, border:`1px solid ${FP_C.accent}33`,
            borderRadius:4, padding:"3px 8px", letterSpacing:"0.5px" }}>
            FREE
          </div>
        </div>

        {/* Privacidad */}
        <div style={{ marginBottom:6 }}><FP_SectionHead>Privacidad</FP_SectionHead></div>
        <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
          borderRadius:10, overflow:"hidden", marginBottom:16 }}>
          {[
            { v:"public",  l:"Perfil público",  d:"Cualquiera puede ver tu perfil" },
            { v:"private", l:"Perfil privado",  d:"Solo tus seguidores te ven" },
          ].map((opt, i, arr) => (
            <FP_Row key={opt.v} border={i < arr.length-1} onClick={() => setPrivacy(opt.v)}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <FP_Icon d={FP_Icons.lock} size={15} color={FP_C.textSecondary}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:FP_C.textPrimary }}>{opt.l}</div>
                  <div style={{ fontSize:11, color:FP_C.textSecondary, marginTop:1 }}>{opt.d}</div>
                </div>
              </div>
              <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0,
                border:`2px solid ${privacy===opt.v ? FP_C.accent : FP_C.borderMid}`,
                background: privacy===opt.v ? FP_C.accent : "none",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {privacy===opt.v && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
              </div>
            </FP_Row>
          ))}
        </div>

        {/* Notificaciones */}
        <div style={{ marginBottom:6 }}><FP_SectionHead>Notificaciones</FP_SectionHead></div>
        <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
          borderRadius:10, overflow:"hidden", marginBottom:16 }}>
          {[
            { k:"ventas",   l:"Nuevas ventas",       icon:FP_Icons.package },
            { k:"mensajes", l:"Mensajes recibidos",  icon:FP_Icons.message },
            { k:"reseñas",  l:"Nuevas reseñas",      icon:FP_Icons.star    },
            { k:"promo",    l:"Ofertas y novedades", icon:FP_Icons.bell    },
          ].map((n, i, arr) => (
            <FP_Row key={n.k} border={i < arr.length-1}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <FP_Icon d={n.icon} size={15} color={FP_C.textSecondary}/>
                <span style={{ fontSize:13, color:FP_C.textPrimary }}>{n.l}</span>
              </div>
              <FP_Toggle on={notif[n.k]} onChange={() => setNotif(p => ({...p,[n.k]:!p[n.k]}))}/>
            </FP_Row>
          ))}
        </div>

        {/* Cuenta */}
        <div style={{ marginBottom:6 }}><FP_SectionHead>Cuenta</FP_SectionHead></div>
        <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
          borderRadius:10, overflow:"hidden", marginBottom:16 }}>
          <FP_Row border onClick={() => setSubScreen("email")}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <FP_Icon d={FP_Icons.mail} size={15} color={FP_C.textSecondary}/>
              <span style={{ fontSize:13, color:FP_C.textPrimary }}>Cambiar correo</span>
            </div>
            <FP_Icon d={FP_Icons.chevronR} size={15} color={FP_C.textMuted}/>
          </FP_Row>
          <FP_Row border onClick={() => setSubScreen("password")}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <FP_Icon d={FP_Icons.key} size={15} color={FP_C.textSecondary}/>
              <div>
                <div style={{ fontSize:13, color:FP_C.textPrimary }}>
                  {hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
                </div>
                {!hasPassword && (
                  <div style={{ fontSize:10, color:FP_C.textMuted, marginTop:1 }}>
                    Sin contraseña — acceso directo a la app
                  </div>
                )}
              </div>
            </div>
            <FP_Icon d={FP_Icons.chevronR} size={15} color={FP_C.textMuted}/>
          </FP_Row>
          <FP_Row onClick={() => toast_("Términos y privacidad — el texto legal se enlazará aquí antes del lanzamiento")}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <FP_Icon d={FP_Icons.file} size={15} color={FP_C.textSecondary}/>
              <span style={{ fontSize:13, color:FP_C.textPrimary }}>Términos y privacidad</span>
            </div>
            <FP_Icon d={FP_Icons.chevronR} size={15} color={FP_C.textMuted}/>
          </FP_Row>
        </div>

        {/* Zona peligro */}
        <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
          borderRadius:10, overflow:"hidden", marginBottom:24 }}>
          <FP_Row border onClick={() => { /* INTEGRATION POINT: auth.signOut() */ }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <FP_Icon d={FP_Icons.logout} size={15} color={FP_C.warning}/>
              <span style={{ fontSize:13, fontWeight:600, color:FP_C.warning }}>Cerrar sesión</span>
            </div>
          </FP_Row>
          <FP_Row onClick={() => { /* INTEGRATION POINT: DELETE /api/user */ }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <FP_Icon d={FP_Icons.trash} size={15} color={FP_C.danger}/>
              <span style={{ fontSize:13, fontWeight:600, color:FP_C.danger }}>Eliminar cuenta</span>
            </div>
          </FP_Row>
        </div>

        <div style={{ textAlign:"center", fontSize:11, color:FP_C.textMuted, fontFamily:FP_FH }}>
          Motor de Arranque · v1.0.0
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────
function FP_VerifyModal({ name, onClose, onSubmit, C }) {
  const TYPES = ["Carnet de identidad", "Pasaporte", "Licencia de conducir"];
  const [docType, setDocType] = useState("Carnet de identidad");
  const [fullName, setFullName] = useState(name || "");
  const [docNum, setDocNum] = useState("");
  const [photoFront, setPhotoFront] = useState(null);
  const [photoBack, setPhotoBack] = useState(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const pick = (setter) => (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setter(r.result); r.readAsDataURL(f); };
  const valid = fullName.trim() && docNum.trim() && photoFront && photoBack;
  const upBox = (label, photo, refEl) => (
    <button onClick={()=>refEl.current?.click()} style={{ flex:1, height: photo?120:84, borderRadius:10, border:`1.5px dashed ${C.border}`, background:C.surfaceTop, cursor:"pointer", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, color:C.textSecondary, fontSize:11, fontWeight:600 }}>
      {photo ? <img src={photo} alt={label} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <><span style={{fontSize:20}}>📷</span>{label}</>}
    </button>
  );
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:2000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"20px 18px 26px", border:`1px solid ${C.border}`, maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary, marginBottom:4 }}>Verificar mi cuenta</div>
        <div style={{ fontSize:12, color:C.textSecondary, marginBottom:16, lineHeight:1.5 }}>Sube tu documento de identidad por ambos lados. Lo revisamos y, si todo está bien, tu cuenta queda verificada. Tus datos son confidenciales.</div>
        <div style={{ fontSize:11, fontWeight:700, color:C.textSecondary, marginBottom:6 }}>Tipo de documento</div>
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          {TYPES.map(t => <button key={t} onClick={()=>setDocType(t)} style={{ padding:"8px 12px", borderRadius:8, cursor:"pointer", fontSize:11.5, fontWeight:600, background: docType===t ? `${C.accent}1a` : C.surfaceTop, border:`1.5px solid ${docType===t ? C.accent : C.border}`, color: docType===t ? C.accent : C.textPrimary }}>{t}</button>)}
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:C.textSecondary, marginBottom:6 }}>Nombre completo</div>
        <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Como aparece en tu documento" style={{ width:"100%", background:C.surfaceTop, border:`1px solid ${C.border}`, borderRadius:9, padding:"11px 12px", color:C.textPrimary, fontSize:13, marginBottom:13, outline:"none" }}/>
        <div style={{ fontSize:11, fontWeight:700, color:C.textSecondary, marginBottom:6 }}>Número de documento</div>
        <input value={docNum} onChange={e=>setDocNum(e.target.value)} placeholder="Ej. 95010112345" style={{ width:"100%", background:C.surfaceTop, border:`1px solid ${C.border}`, borderRadius:9, padding:"11px 12px", color:C.textPrimary, fontSize:13, marginBottom:13, outline:"none" }}/>
        <div style={{ fontSize:11, fontWeight:700, color:C.textSecondary, marginBottom:6 }}>Foto del documento (frente y reverso)</div>
        <input ref={frontRef} type="file" accept="image/*" onChange={pick(setPhotoFront)} style={{ display:"none" }}/>
        <input ref={backRef} type="file" accept="image/*" onChange={pick(setPhotoBack)} style={{ display:"none" }}/>
        <div style={{ display:"flex", gap:9, marginBottom:18 }}>
          {upBox("Frente", photoFront, frontRef)}
          {upBox("Reverso", photoBack, backRef)}
        </div>
        <div style={{ display:"flex", gap:9 }}>
          <button onClick={onClose} style={{ flex:1, height:44, borderRadius:10, background:C.surfaceTop, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, fontWeight:700, cursor:"pointer" }}>Cancelar</button>
          <button disabled={!valid} onClick={()=>onSubmit({ docType, fullName, docNum, photo: photoFront, photoBack })} style={{ flex:1, height:44, borderRadius:10, background: valid?C.positive:C.surfaceTop, border:"none", color: valid?"#fff":C.textSecondary, fontSize:13, fontWeight:800, cursor: valid?"pointer":"default", opacity: valid?1:.6 }}>Enviar</button>
        </div>
      </div>
    </div>
  );
}
function FP_PlansModal({ plans = [], current, onClose, onRequest, C }) {
  const price = p => p.promo && p.promoPrice >= 0 ? p.promoPrice : p.price;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:2000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, width:"100%", maxWidth:460, borderRadius:"18px 18px 0 0", padding:"20px 18px 26px", border:`1px solid ${C.border}`, maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary, marginBottom:4 }}>Planes</div>
        <div style={{ fontSize:12, color:C.textSecondary, marginBottom:16 }}>Elige un plan. El pago se coordina manualmente; cuando se confirme, se activa.</div>
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          {plans.map(p => {
            const isCur = current === p.name;
            return <div key={p.id} style={{ border:`1.5px solid ${isCur ? C.accent : C.border}`, borderRadius:12, padding:"14px 14px 16px", background: isCur ? `${C.accent}0d` : C.surfaceTop }}>
              <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:15, fontWeight:800, color:C.textPrimary }}>{p.name}{isCur && <span style={{ fontSize:10, fontWeight:700, color:C.accent, marginLeft:7 }}>· actual</span>}</span>
                <span style={{ fontSize:14, fontWeight:800, color:C.textPrimary }}>{price(p) === 0 ? "Gratis" : `$${price(p)}/mes`}{p.promo && p.price !== price(p) && <span style={{ fontSize:11, color:C.textSecondary, textDecoration:"line-through", marginLeft:6 }}>${p.price}</span>}</span>
              </div>
              {(p.features||[]).map((f,i)=><div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}><span style={{ color:C.positive, fontSize:12, flexShrink:0 }}>✓</span><span style={{ fontSize:12, color:C.textPrimary }}>{f}</span></div>)}
              {!isCur && p.name !== "Básico" && <button onClick={()=>onRequest(p.name)} style={{ width:"100%", height:38, marginTop:11, borderRadius:9, background:C.accent, border:"none", color:"#fff", fontSize:12.5, fontWeight:800, cursor:"pointer" }}>Solicitar {p.name}</button>}
            </div>;
          })}
        </div>
        <button onClick={onClose} style={{ width:"100%", height:42, marginTop:14, borderRadius:10, background:C.surfaceTop, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, fontWeight:700, cursor:"pointer" }}>Cerrar</button>
      </div>
    </div>
  );
}
function FP_ReportModal({ targetName, onClose, onSubmit, C }) {
  const REASONS = ["Posible estafa", "No entregó el producto", "Perfil falso o suplantación", "Contenido inapropiado", "Otro"];
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:2000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"20px 18px 26px", border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary, marginBottom:4 }}>Reportar a {targetName}</div>
        <div style={{ fontSize:12, color:C.textSecondary, marginBottom:16 }}>Tu reporte es confidencial y lo revisa el equipo de RETADOR.</div>
        <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
          {REASONS.map(r => (
            <button key={r} onClick={()=>setReason(r)} style={{
              textAlign:"left", padding:"11px 13px", borderRadius:10, cursor:"pointer",
              background: reason===r ? `${C.accent}1a` : C.surfaceTop,
              border:`1.5px solid ${reason===r ? C.accent : C.border}`,
              color:C.textPrimary, fontSize:13, fontWeight:600 }}>
              {r}
            </button>
          ))}
        </div>
        <textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Cuéntanos qué pasó (opcional)…" rows={3} style={{
          width:"100%", background:C.surfaceTop, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px",
          color:C.textPrimary, fontSize:13, resize:"none", marginBottom:16, outline:"none", fontFamily:"inherit" }}/>
        <div style={{ display:"flex", gap:9 }}>
          <button onClick={onClose} style={{ flex:1, height:44, borderRadius:10, background:C.surfaceTop, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, fontWeight:700, cursor:"pointer" }}>Cancelar</button>
          <button disabled={!reason} onClick={()=>onSubmit({ targetName, reason, detail })} style={{ flex:1, height:44, borderRadius:10, background: reason?"#E5484D":C.surfaceTop, border:"none", color: reason?"#fff":C.textSecondary, fontSize:13, fontWeight:800, cursor: reason?"pointer":"default", opacity: reason?1:.6 }}>Enviar reporte</button>
        </div>
      </div>
    </div>
  );
}
function FreeProfileScreen({ onBack, user, initialProfile = {}, onProfileUpdate, isOwner: isOwnerProp, onChat, onReport, onVerify, isVerified, onRequestPlan, currentPlan = "Básico", plans = [], myDebt = 0, commissionActive = true, userProducts = [], onProduct, onDeleteProduct, onEditProduct }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const FP_C = useFP_C();
  const isOwner = isOwnerProp !== undefined ? isOwnerProp : FP_MOCK_IS_OWNER;

  const [tab,          setTab]          = useState("productos");
  const [following,    setFollowing]    = useState(false);
  const [showPro,      setShowPro]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPicker,   setShowPicker]   = useState(false);
  const [editProfile,  setEditProfile]  = useState(false);
  const [editAbout,    setEditAbout]    = useState(false);
  const [showRevForm,  setShowRevForm]  = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [showVerify,   setShowVerify]   = useState(false);
  const [showPlans,    setShowPlans]    = useState(false);
  const [toast,        setToast]        = useState(null);

  const defaultProfile = {
    avatar:   initialProfile.avatar   || { type:"emoji", value:"😊" },
    name:     initialProfile.name     || user?.name || "Usuario Demo",
    username: initialProfile.username || "usuario_demo",
    bio:      "Vendo cosas que ya no uso. Envío rápido y empaque cuidado.",
    isVerified: false,
  };

  const [profile, setProfile] = useState(defaultProfile);
  const [pd, setPd] = useState({ ...defaultProfile });

  const [about, setAbout] = useState({
    city:"Guadalajara", state:"Jalisco", country:"México",
    responseTime:"Aprox. 2 horas", shipping:"1–3 días hábiles",
    instagram:"", facebook:"", tiktok:"",
    acceptsOffers:true, shipsNational:true, shipsLocal:false,
  });
  const [ad, setAd] = useState({ ...about });

  const [reviews, setReviews] = useState(() => {
    try {
      const real = (typeof ratingForName === "function") ? ratingForName(initialProfile?.name, "seller").reviews : [];
      if (real && real.length) return real.sort((a, b) => b.at - a.at).map((r, i) => ({ id: "r" + i, user: "Comprador verificado", stars: r.stars, text: r.msg, date: new Date(r.at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) }));
    } catch (e) {}
    return FP_INITIAL_REVIEWS;
  });

  function toast_(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }
  function saveProfile() {
    const updated = {...pd};
    setProfile(updated);
    setEditProfile(false);
    toast_("Perfil actualizado");
    onProfileUpdate?.({ avatar: updated.avatar, name: updated.name, username: updated.username, rating: 4.9, sales: 60 });
  }
  function saveAbout()   { setAbout({...ad});   setEditAbout(false);   toast_("Información actualizada"); }
  function cancelProfile() { setPd({...profile}); setEditProfile(false); }
  function cancelAbout()   { setAd({...about});   setEditAbout(false);   }

  function submitReview({ name, stars, text }) {
    setReviews(r => [{ id:Date.now(), user:name, stars, text, date:"justo ahora" }, ...r]);
    setShowRevForm(false);
    toast_("Reseña publicada");
  }

  const avgRating = (reviews.reduce((a,r) => a + r.stars, 0) / reviews.length).toFixed(1);
  const ratingDist = [5,4,3,2,1].map(s => ({
    stars:s,
    pct: Math.round(reviews.filter(r => r.stars===s).length / reviews.length * 100),
  }));

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, overflowY:"auto", background:FP_C.bg, fontFamily:FP_FB, color:FP_C.textPrimary }}>
      {/* fonts loaded via @import in useCSS */}

      {/* OVERLAYS */}
      {showPicker   && <FP_AvatarPicker current={pd.avatar} onSelect={a=>{ setPd(d=>({...d,avatar:a})); setShowPicker(false); }} onClose={() => setShowPicker(false)}/>}
      {showPro      && isOwner && <FP_ProModal onClose={() => setShowPro(false)}/>}
      {showSettings && isOwner && <FP_SettingsScreen onClose={() => setShowSettings(false)}/>}
      {showReport && !isOwner && <FP_ReportModal targetName={profile.name} onClose={() => setShowReport(false)} onSubmit={(payload) => { onReport?.(payload); setShowReport(false); toast_("Reporte enviado. Gracias por avisar."); }} C={FP_C}/>}
      {showVerify && isOwner && <FP_VerifyModal name={profile.name} onClose={() => setShowVerify(false)} onSubmit={(payload) => { onVerify?.(payload); setShowVerify(false); toast_("Solicitud de verificación enviada. La revisaremos pronto."); }} C={FP_C}/>}
      {showPlans && isOwner && <FP_PlansModal plans={plans} current={currentPlan} onClose={() => setShowPlans(false)} onRequest={(planName) => { onRequestPlan?.(planName); setShowPlans(false); toast_(`Solicitud enviada: plan ${planName}. Te contactaremos para el pago.`); }} C={FP_C}/>}

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          background:FP_C.surfaceTop, color:FP_C.positive,
          border:`1px solid ${FP_C.positiveDim}`,
          borderRadius:8, padding:"9px 16px", fontSize:12, fontWeight:600,
          fontFamily:FP_FH, zIndex:700, boxShadow:"0 8px 24px rgba(0,0,0,0.6)",
          display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap",
          letterSpacing:"0.2px" }}>
          <FP_Icon d={FP_Icons.check} size={14} color={FP_C.positive}/>
          {toast}
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ background:FP_C.bg, borderBottom:`1px solid ${FP_C.border}`,
        padding:"0 20px", height:50,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100 }}>

        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:0,
          display:"flex", alignItems:"center", gap:8 }}>
          <FP_Icon d={FP_Icons.back} size={18} color={FP_C.textSecondary}/>
          <span style={{ fontSize:13, fontWeight:500, color:FP_C.textSecondary, fontFamily:FP_FB }}>
            Atrás
          </span>
        </button>

        {isOwner ? (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={() => setShowSettings(true)} style={{
              background:"none", border:`1px solid ${FP_C.border}`,
              borderRadius:6, width:32, height:32, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <FP_Icon d={FP_Icons.settings} size={15} color={FP_C.textSecondary}/>
            </button>
            <button onClick={() => setShowPro(true)} style={{
              background:FP_C.accentSoft, border:`1px solid ${FP_C.accent}33`,
              borderRadius:6, padding:"0 12px", height:32, cursor:"pointer",
              color:FP_C.accentText, fontSize:11, fontWeight:700, fontFamily:FP_FH,
              display:"flex", alignItems:"center", gap:5, letterSpacing:"0.3px",
            }}>
              <FP_Icon d={FP_Icons.zap} size={12} color={FP_C.accentText}/>
              Pro
            </button>
          </div>
        ) : <div style={{ width:80 }}/>}
      </div>

      {/* ── PROFILE HEADER ── */}
      {!editProfile ? (
        <div style={{ padding:"24px 20px 0" }}>

          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", marginBottom:16 }}>
            <div style={{ position:"relative" }}>
              <FP_Avatar avatar={profile.avatar} size={72} fontSize={34}/>
              {/* FREE chip */}
              <div style={{ position:"absolute", bottom:-2, left:"50%",
                transform:"translateX(-50%)",
                background:FP_C.bg, border:`1px solid ${FP_C.borderMid}`,
                borderRadius:4, padding:"1px 6px",
                fontSize:8, fontWeight:800, color:FP_C.textMuted,
                fontFamily:FP_FH, letterSpacing:"0.8px", whiteSpace:"nowrap" }}>
                FREE
              </div>
            </div>

            {isOwner ? (
              <button onClick={() => { setPd({...profile}); setEditProfile(true); }}
                style={{ background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                  borderRadius:6, padding:"0 14px", height:32, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6 }}>
                <FP_Icon d={FP_Icons.edit} size={13} color={FP_C.textSecondary}/>
                <span style={{ fontSize:12, fontWeight:600, color:FP_C.textSecondary, fontFamily:FP_FH }}>
                  Editar
                </span>
              </button>
            ) : (
              <div style={{ width:80 }}/>
            )}
          </div>

          {/* Name / handle / location */}
          <div style={{ fontSize:20, fontWeight:700, color:FP_C.textPrimary,
            fontFamily:FP_FH, marginBottom:3 }}>
            {profile.name}
          </div>
          <div style={{ fontSize:12, color:FP_C.textSecondary, marginBottom:8 }}>
            @{profile.username} · {about.city}, {about.country}
          </div>

          {/* Rating */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <FP_StarRow count={Math.round(parseFloat(avgRating))} size={13}/>
            <span style={{ fontSize:13, fontWeight:700, color:FP_C.textPrimary, fontFamily:FP_FH }}>
              {avgRating}
            </span>
            <span style={{ fontSize:12, color:FP_C.textSecondary }}>
              · {reviews.length} reseñas
            </span>
          </div>

          {/* Bio */}
          <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.6, marginBottom:16 }}>
            {profile.bio}
          </div>

          {/* Acciones (visitante): seguir + mensaje, a lo ancho */}
          {!isOwner && (
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <button onClick={() => setFollowing(!following)} style={{
                flex:1, background: following ? FP_C.surfaceTop : FP_C.accent,
                border:`1px solid ${following ? FP_C.border : FP_C.accent}`,
                borderRadius:8, height:38, cursor:"pointer",
                color: following ? FP_C.textPrimary : "#fff",
                fontSize:13, fontWeight:700, fontFamily:FP_FH,
                display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.2s",
              }}>
                {following
                  ? <><FP_Icon d={FP_Icons.check} size={14} color={FP_C.textPrimary}/> Siguiendo</>
                  : <><FP_Icon d={FP_Icons.plus}  size={14} color="#fff"/> Seguir</>
                }
              </button>
              <button onClick={() => onChat?.(profile.username || profile.name, profile.name)} style={{
                flex:1, background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                borderRadius:8, height:38, cursor:"pointer",
                color:FP_C.textPrimary, fontSize:13, fontWeight:700, fontFamily:FP_FH,
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <FP_Icon d={FP_Icons.message} size={15} color={FP_C.textPrimary}/> Mensaje
              </button>
            </div>
          )}
          {!isOwner && (
            <button onClick={() => setShowReport(true)} style={{
              width:"100%", background: isDark ? "rgba(224,82,82,.08)" : "#FFF0F0",
              border:`1px solid ${isDark ? "rgba(224,82,82,.3)" : "#F5C6C6"}`, color:"#E05252",
              borderRadius:8, height:36, cursor:"pointer", marginBottom:14, fontSize:12.5, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              🚩 Reportar usuario
            </button>
          )}
          {isOwner && commissionActive && myDebt > 0 && (
            <div style={{ background: isDark ? "rgba(212,152,42,.1)" : "#FFF8E6", border:`1px solid ${isDark ? "rgba(212,152,42,.35)" : "#F0D98A"}`, borderRadius:10, padding:"12px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:11 }}>
              <span style={{ fontSize:20 }}>💳</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:800, color:FP_C.textPrimary }}>Comisión por pagar: ${Math.round(myDebt).toLocaleString()} CUP</div>
                <div style={{ fontSize:11, color:FP_C.textSecondary, marginTop:1 }}>Es la comisión de tus ventas. Págala para mantener tu cuenta activa.</div>
              </div>
            </div>
          )}
          {isOwner && (
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {!isVerified && (
                <button onClick={() => setShowVerify(true)} style={{
                  flex:1, background: isDark ? "rgba(25,195,125,.1)" : "#E6FAF3",
                  border:`1px solid ${isDark ? "rgba(25,195,125,.35)" : "#9DE9CC"}`, color:FP_C.positive,
                  borderRadius:8, height:38, cursor:"pointer", fontSize:12.5, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <FP_Icon d={FP_Icons.shield} size={14} color={FP_C.positive}/> Verificar mi cuenta
                </button>
              )}
              <button onClick={() => setShowPlans(true)} style={{
                flex:1, background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`, color:FP_C.textPrimary,
                borderRadius:8, height:38, cursor:"pointer", fontSize:12.5, fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                ⭐ {currentPlan === "Básico" ? "Mejorar mi plan" : `Plan ${currentPlan}`}
              </button>
            </div>
          )}

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
            border:`1px solid ${FP_C.border}`, borderRadius:8, overflow:"hidden",
            marginBottom:14 }}>
            {[{v:"60",l:"Ventas"},(()=>{ const sr=(typeof ratingForName==='function')?ratingForName(profile.name,"seller"):{avg:0,count:0}; return {v: sr.count?("⭐"+sr.avg):"—", l: sr.count?(sr.count+" reseñas"):"Sin reseñas"}; })(),{v:"124",l:"Seguidores"}].map((s,i)=>(
              <div key={s.l} style={{ textAlign:"center", padding:"10px 6px",
                borderRight:i<2?`1px solid ${FP_C.border}`:"none",
                background:FP_C.surface }}>
                <div style={{ fontFamily:FP_FH, fontWeight:700, fontSize:17, color:FP_C.textPrimary }}>
                  {s.v}
                </div>
                <div style={{ fontSize:10, color:FP_C.textSecondary, marginTop:2, letterSpacing:"0.3px" }}>
                  {s.l.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {(()=>{ 
            const isCourier=(()=>{ try { const cs=JSON.parse(localStorage.getItem("retador_couriers")||"[]"); return cs.some(c=>c.status==="approved"&&(c.nombre===profile.name||c.name===profile.name||c.username===profile.username)); } catch(e){ return false; } })();
            if(!isCourier) return null;
            const cr=(typeof ratingForName==="function")?ratingForName(profile.name,"courier"):{avg:0,count:0,reviews:[]};
            return <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`, borderRadius:14, padding:"14px", marginTop:14 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:cr.reviews.length?10:2 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:17 }}>🛵</span>
                  <span style={{ fontFamily:FP_FH, fontWeight:700, fontSize:13.5, color:FP_C.textPrimary }}>Reputación como mensajero</span>
                </div>
                <span style={{ fontSize:12.5, fontWeight:800, color: cr.count?FP_C.textPrimary:FP_C.textSecondary }}>{cr.count?`⭐ ${cr.avg} · ${cr.count}`:"Sin reseñas aún"}</span>
              </div>
              {cr.reviews.length>0 && cr.reviews.slice(0,3).sort((a,b)=>b.at-a.at).map((r,i)=>(
                <div key={i} style={{ padding:"9px 0", borderTop:`1px solid ${FP_C.border}` }}>
                  <div style={{ fontSize:11, color:G, marginBottom:2 }}>{"⭐".repeat(Math.max(1,r.stars))}</div>
                  <div style={{ fontSize:12, color:FP_C.textSecondary, lineHeight:1.45 }}>"{r.msg}"</div>
                </div>
              ))}
            </div>;
          })()}

          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>

            {/* INTEGRATION POINT: isVerified viene del backend (proceso KYFP_C).
                Solo mostrar si profile.isVerified === true.
                Nunca activar por defecto ni automáticamente. */}
            {(isVerified || profile.isVerified) && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                background:FP_C.positiveDim, border:"1px solid #0D2218",
                borderRadius:6, padding:"4px 10px" }}>
                <FP_Icon d={FP_Icons.shield} size={12} color={FP_C.positive}/>
                <span style={{ fontSize:11, color:FP_C.positive, fontWeight:600,
                  fontFamily:FP_FH, letterSpacing:"0.2px" }}>
                  Verificado
                </span>
              </div>
            )}

            {/* Resp. rápida — INTEGRATION POINT: mostrar si avgResponseTime < 2h en backend */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:5,
              background:FP_C.warningDim, border:"1px solid #261C08",
              borderRadius:6, padding:"4px 10px" }}>
              <FP_Icon d={FP_Icons.zap} size={12} color={FP_C.warning}/>
              <span style={{ fontSize:11, color:FP_C.warning, fontWeight:600,
                fontFamily:FP_FH, letterSpacing:"0.2px" }}>
                Resp. rápida
              </span>
            </div>

            {/* Ventas — INTEGRATION POINT: mostrar conteo real desde backend */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:5,
              background:FP_C.accentSoft, border:`1px solid ${FP_C.accentSoft}`,
              borderRadius:6, padding:"4px 10px" }}>
              <FP_Icon d={FP_Icons.package} size={12} color={FP_C.accentText}/>
              <span style={{ fontSize:11, color:FP_C.accentText, fontWeight:600,
                fontFamily:FP_FH, letterSpacing:"0.2px" }}>
                60 ventas
              </span>
            </div>

          </div>
        </div>
      ) : (
        /* ── EDIT PROFILE ── */
        <div style={{ padding:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontSize:16, fontWeight:700, color:FP_C.textPrimary, fontFamily:FP_FH }}>
              Editar perfil
            </div>
            <button onClick={cancelProfile} style={{ background:"none", border:"none",
              cursor:"pointer", display:"flex" }}>
              <FP_Icon d={FP_Icons.x} size={20} color={FP_C.textSecondary}/>
            </button>
          </div>

          {/* Avatar edit */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:22 }}>
            <div style={{ position:"relative", cursor:"pointer" }} onClick={() => setShowPicker(true)}>
              <FP_Avatar avatar={pd.avatar} size={80} fontSize={38}/>
              <div style={{ position:"absolute", bottom:0, right:-4,
                background:FP_C.accent, borderRadius:"50%", width:24, height:24,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 2px 8px rgba(0,0,0,0.5)", cursor:"pointer" }}>
                <FP_Icon d={FP_Icons.camera} size={12} color="#fff"/>
              </div>
            </div>
            <button onClick={() => setShowPicker(true)} style={{ marginTop:10,
              background:"none", border:`1px solid ${FP_C.border}`,
              borderRadius:6, padding:"5px 14px", cursor:"pointer",
              color:FP_C.accentText, fontSize:11, fontWeight:600, fontFamily:FP_FH }}>
              Cambiar foto o emoji
            </button>
          </div>

          <FP_Field label="Nombre">
            <input value={pd.name} placeholder="Tu nombre"
              onChange={e => setPd(d => ({...d,name:e.target.value}))}
              onFocus={e => e.target.style.borderColor = FP_C.accent}
              onBlur={e => e.target.style.borderColor = FP_C.border}
              style={fpInputStyle(FP_C)}/>
          </FP_Field>
          <FP_Field label="Usuario">
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:12, top:"50%",
                transform:"translateY(-50%)", color:FP_C.textMuted, fontSize:13 }}>@</span>
              <input value={pd.username} placeholder="tunombre"
                onChange={e => setPd(d => ({...d,username:e.target.value.toLowerCase().replace(/\s/g,"")}))}
                onFocus={e => e.target.style.borderColor = FP_C.accent}
                onBlur={e => e.target.style.borderColor = FP_C.border}
                style={{...fpInputStyle(FP_C), paddingLeft:26}}/>
            </div>
          </FP_Field>
          <FP_Field label="Bio">
            <textarea value={pd.bio} placeholder="Cuéntale a los compradores quién eres…"
              onChange={e => setPd(d => ({...d,bio:e.target.value}))}
              onFocus={e => e.target.style.borderColor = FP_C.accent}
              onBlur={e => e.target.style.borderColor = FP_C.border}
              rows={3} maxLength={160}
              style={{...fpInputStyle(FP_C), resize:"none", lineHeight:1.55}}/>
            <div style={{ fontSize:10, color:FP_C.textMuted, textAlign:"right", marginTop:3 }}>
              {pd.bio.length}/160
            </div>
          </FP_Field>
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <FP_Btn onClick={saveProfile} style={{ flex:1 }}>Guardar</FP_Btn>
            <FP_Btn variant="secondary" onClick={cancelProfile} style={{ flex:1 }}>Cancelar</FP_Btn>
          </div>
        </div>
      )}

      <FP_Divider/>

      {/* ── TABS ── */}
      <div style={{ display:"flex", background:FP_C.bg,
        borderBottom:`1px solid ${FP_C.border}`,
        position:"sticky", top:50, zIndex:90 }}>
        {[
          { k:"productos", l:"Productos", b:String(userProducts.length) },
          { k:"reseñas",   l:"Reseñas",   b:String(reviews.length)  },
          { k:"acerca",    l:"Acerca de", b:null                    },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            background:"none", border:"none", cursor:"pointer",
            padding:"13px 20px", fontSize:13,
            fontWeight: tab===t.k ? 700 : 400,
            color: tab===t.k ? FP_C.textPrimary : FP_C.textSecondary,
            fontFamily:FP_FB,
            borderBottom: tab===t.k ? `2px solid ${FP_C.accent}` : "2px solid transparent",
            transition:"all 0.15s",
            display:"flex", alignItems:"center", gap:7,
            whiteSpace:"nowrap", flexShrink:0,
          }}>
            {t.l}
            {t.b && (
              <span style={{ background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                borderRadius:4, padding:"1px 6px",
                fontSize:10, color:FP_C.textSecondary, fontWeight:600 }}>
                {t.b}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{ padding:"16px 20px 60px" }}>

        {/* PRODUCTOS */}
        {tab === "productos" && (
          <>
            {userProducts.length === 0 ? (
              <div style={{ textAlign:"center", color:FP_C.textSecondary, fontSize:12.5, padding:"28px 10px" }}>
                {isOwner ? "Aún no has publicado productos." : "Este usuario no tiene productos publicados."}
              </div>
            ) : (
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
                gap:10, marginBottom:12 }}>
                {userProducts.map(p => <FP_ProductCard key={p.id} product={p} onClick={() => onProduct && onProduct(p)} onDelete={onDeleteProduct ? (() => onDeleteProduct(p.id)) : null} onEdit={onEditProduct ? (() => onEditProduct(p)) : null}/>)}
              </div>
            )}
            {isOwner && (
              <div onClick={() => setShowPro(true)} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                background:FP_C.surface, border:`1px dashed ${FP_C.border}`,
                borderRadius:8, padding:"12px 14px", cursor:"pointer",
                transition:"border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = FP_C.borderMid}
                onMouseLeave={e => e.currentTarget.style.borderColor = FP_C.border}>
                <span style={{ fontSize:12, color:FP_C.textSecondary }}>
                  Límite de <strong style={{ color:FP_C.textPrimary }}>10 productos</strong> en plan Free
                </span>
                <div style={{ display:"flex", alignItems:"center", gap:5,
                  color:FP_C.accentText, fontSize:12, fontWeight:600, fontFamily:FP_FH }}>
                  Ver Pro
                  <FP_Icon d={FP_Icons.chevronR} size={14} color={FP_C.accentText}/>
                </div>
              </div>
            )}
          </>
        )}

        {/* RESEÑAS */}
        {tab === "reseñas" && (
          <>
            {/* Summary */}
            <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
              borderRadius:10, padding:"16px 18px", marginBottom:12 }}>
              <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                <div style={{ textAlign:"center", minWidth:60 }}>
                  <div style={{ fontFamily:FP_FH, fontWeight:800, fontSize:40,
                    color:FP_C.textPrimary, lineHeight:1 }}>
                    {avgRating}
                  </div>
                  <FP_StarRow count={Math.round(parseFloat(avgRating))} size={13}/>
                  <div style={{ fontSize:10, color:FP_C.textSecondary, marginTop:4 }}>
                    {reviews.length} reseñas
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  {ratingDist.map(({ stars:s, pct }) => (
                    <div key={s} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                      <span style={{ fontSize:11, color:FP_C.textSecondary, width:8 }}>{s}</span>
                      <div style={{ flex:1, height:4, background:FP_C.surfaceTop,
                        borderRadius:4, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%",
                          background:FP_C.warning, borderRadius:4 }}/>
                      </div>
                      <span style={{ fontSize:10, color:FP_C.textMuted, width:22 }}>
                        {pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Write review — visitors only */}
            {!isOwner && !showRevForm && (
              <button onClick={() => setShowRevForm(true)} style={{
                width:"100%", background:FP_C.surface,
                border:`1px solid ${FP_C.borderMid}`,
                borderRadius:8, padding:"12px", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                gap:8, marginBottom:12, transition:"border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = FP_C.borderHigh}
                onMouseLeave={e => e.currentTarget.style.borderColor = FP_C.borderMid}>
                <FP_Icon d={FP_Icons.edit} size={14} color={FP_C.textSecondary}/>
                <span style={{ fontSize:13, color:FP_C.textSecondary, fontWeight:600, fontFamily:FP_FH }}>
                  Escribir reseña
                </span>
              </button>
            )}
            {!isOwner && showRevForm && (
              <FP_ReviewForm onSubmit={submitReview} onCancel={() => setShowRevForm(false)}/>
            )}

            {/* Reviews list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background:FP_C.surface,
                  border:`1px solid ${FP_C.border}`, borderRadius:10, padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center",
                    justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%",
                        background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <FP_Icon d={FP_Icons.user} size={16} color={FP_C.textMuted}/>
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600,
                          color:FP_C.textPrimary, fontFamily:FP_FH }}>{r.user}</div>
                        <FP_StarRow count={r.stars} size={11}/>
                      </div>
                    </div>
                    <span style={{ fontSize:10, color:FP_C.textMuted }}>{r.date}</span>
                  </div>
                  <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.6 }}>
                    {r.text}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ACERCA DE */}
        {tab === "acerca" && (
          <>
            {!editAbout ? (
              <>
                <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
                  borderRadius:10, overflow:"hidden", marginBottom:10 }}>
                  <FP_Row style={{ borderBottom:`1px solid ${FP_C.border}` }}>
                    <span style={{ fontSize:13, fontWeight:600,
                      color:FP_C.textPrimary, fontFamily:FP_FH }}>
                      Información del vendedor
                    </span>
                    {isOwner && (
                      <button onClick={() => { setAd({...about}); setEditAbout(true); }}
                        style={{ background:"none", border:`1px solid ${FP_C.border}`,
                          borderRadius:6, padding:"5px 10px", cursor:"pointer",
                          display:"flex", alignItems:"center", gap:5 }}>
                        <FP_Icon d={FP_Icons.edit} size={12} color={FP_C.textSecondary}/>
                        <span style={{ fontSize:11, color:FP_C.textSecondary,
                          fontWeight:600, fontFamily:FP_FH }}>Editar</span>
                      </button>
                    )}
                  </FP_Row>

                  {[
                    { icon:FP_Icons.globe,    text:`${about.city}, ${about.state} · ${about.country}` },
                    { icon:FP_Icons.calendar, text:"Miembro desde enero 2024" },
                    { icon:FP_Icons.zap,      text:`Respuesta: ${about.responseTime}` },
                    { icon:FP_Icons.truck,    text:`Envío en ${about.shipping}` },
                  ].map((row, i, arr) => (
                    <FP_Row key={i} border={i < arr.length-1} style={{ gap:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <FP_Icon d={row.icon} size={15} color={FP_C.textSecondary}/>
                        <span style={{ fontSize:13, color:FP_C.textSecondary }}>{row.text}</span>
                      </div>
                    </FP_Row>
                  ))}

                  {(about.acceptsOffers || about.shipsNational || about.shipsLocal) && (
                    <div style={{ padding:"10px 16px",
                      borderTop:`1px solid ${FP_C.border}`,
                      display:"flex", gap:6, flexWrap:"wrap" }}>
                      {about.acceptsOffers && (
                        <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                          background:FP_C.positiveDim, border:"1px solid #0D2218",
                          borderRadius:6, padding:"4px 10px" }}>
                          <FP_Icon d={FP_Icons.handshake} size={12} color={FP_C.positive}/>
                          <span style={{ fontSize:11, color:FP_C.positive, fontWeight:600, fontFamily:FP_FH }}>
                            Acepta ofertas
                          </span>
                        </div>
                      )}
                      {about.shipsNational && (
                        <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                          background:FP_C.accentSoft, border:`1px solid ${FP_C.accentSoft}`,
                          borderRadius:6, padding:"4px 10px" }}>
                          <FP_Icon d={FP_Icons.globe} size={12} color={FP_C.accentText}/>
                          <span style={{ fontSize:11, color:FP_C.accentText, fontWeight:600, fontFamily:FP_FH }}>
                            Envío nacional
                          </span>
                        </div>
                      )}
                      {about.shipsLocal && (
                        <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                          background:FP_C.warningDim, border:"1px solid #261C08",
                          borderRadius:6, padding:"4px 10px" }}>
                          <FP_Icon d={FP_Icons.radio} size={12} color={FP_C.warning}/>
                          <span style={{ fontSize:11, color:FP_C.warning, fontWeight:600, fontFamily:FP_FH }}>
                            Entrega local
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Social links */}
                {(about.instagram || about.facebook || about.tiktok) && (
                  <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
                    borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
                    <FP_SectionHead>Redes</FP_SectionHead>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {about.instagram && (
                        <div style={{ display:"flex", alignItems:"center", gap:7,
                          background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                          borderRadius:6, padding:"7px 12px" }}>
                          <FP_Icon d={FP_Icons.instagram} size={14} color={FP_C.textSecondary}/>
                          <span style={{ fontSize:12, color:FP_C.textPrimary, fontWeight:500 }}>
                            @{about.instagram}
                          </span>
                        </div>
                      )}
                      {about.facebook && (
                        <div style={{ display:"flex", alignItems:"center", gap:7,
                          background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                          borderRadius:6, padding:"7px 12px" }}>
                          <FP_Icon d={FP_Icons.facebook} size={14} color={FP_C.textSecondary}/>
                          <span style={{ fontSize:12, color:FP_C.textPrimary, fontWeight:500 }}>
                            {about.facebook}
                          </span>
                        </div>
                      )}
                      {about.tiktok && (
                        <div style={{ display:"flex", alignItems:"center", gap:7,
                          background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                          borderRadius:6, padding:"7px 12px" }}>
                          <FP_Icon d={FP_Icons.music} size={14} color={FP_C.textSecondary}/>
                          <span style={{ fontSize:12, color:FP_C.textPrimary, fontWeight:500 }}>
                            @{about.tiktok}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pro nudge — owner only */}
                {isOwner && (
                  <div onClick={() => setShowPro(true)} style={{
                    background:FP_C.surface, border:`1px solid ${FP_C.border}`,
                    borderRadius:10, padding:"13px 16px", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    transition:"border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = FP_C.borderMid}
                    onMouseLeave={e => e.currentTarget.style.borderColor = FP_C.border}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600,
                        color:FP_C.accentText, fontFamily:FP_FH, marginBottom:2 }}>
                        ¿Vendes con frecuencia?
                      </div>
                      <div style={{ fontSize:11, color:FP_C.textSecondary }}>
                        Actualiza a Pro y crea tu tienda profesional
                      </div>
                    </div>
                    <FP_Icon d={FP_Icons.chevronR} size={16} color={FP_C.textMuted}/>
                  </div>
                )}
              </>
            ) : (
              /* EDIT ABOUT */
              <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
                borderRadius:10, padding:"20px" }}>
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", marginBottom:20 }}>
                  <div style={{ fontSize:15, fontWeight:700,
                    color:FP_C.textPrimary, fontFamily:FP_FH }}>
                    Editar información
                  </div>
                  <button onClick={cancelAbout} style={{ background:"none",
                    border:"none", cursor:"pointer", display:"flex" }}>
                    <FP_Icon d={FP_Icons.x} size={18} color={FP_C.textSecondary}/>
                  </button>
                </div>

                {/* Ubicación */}
                <div style={{ background:FP_C.surfaceTop, borderRadius:8,
                  padding:"14px", marginBottom:14, border:`1px solid ${FP_C.border}` }}>
                  <FP_SectionHead>Ubicación</FP_SectionHead>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                    gap:10, marginBottom:10 }}>
                    <FP_Field label="Ciudad">
                      <input value={ad.city} placeholder="Ciudad"
                        onChange={e => setAd(d => ({...d,city:e.target.value}))}
                        onFocus={e => e.target.style.borderColor = FP_C.accent}
                        onBlur={e => e.target.style.borderColor = FP_C.border}
                        style={{...fpInputStyle(FP_C), padding:"9px 11px",fontSize:13}}/>
                    </FP_Field>
                    <FP_Field label="Estado">
                      <input value={ad.state} placeholder="Estado"
                        onChange={e => setAd(d => ({...d,state:e.target.value}))}
                        onFocus={e => e.target.style.borderColor = FP_C.accent}
                        onBlur={e => e.target.style.borderColor = FP_C.border}
                        style={{...fpInputStyle(FP_C), padding:"9px 11px",fontSize:13}}/>
                    </FP_Field>
                  </div>
                  <FP_Field label="País">
                    <input value={ad.country} placeholder="País"
                      onChange={e => setAd(d => ({...d,country:e.target.value}))}
                      onFocus={e => e.target.style.borderColor = FP_C.accent}
                      onBlur={e => e.target.style.borderColor = FP_C.border}
                      style={{...fpInputStyle(FP_C), padding:"9px 11px",fontSize:13}}/>
                  </FP_Field>
                </div>

                {/* Tiempos */}
                <div style={{ background:FP_C.surfaceTop, borderRadius:8,
                  padding:"14px", marginBottom:14, border:`1px solid ${FP_C.border}` }}>
                  <FP_SectionHead>Tiempos</FP_SectionHead>
                  <FP_Field label="Tiempo de respuesta">
                    <select value={ad.responseTime}
                      onChange={e => setAd(d => ({...d,responseTime:e.target.value}))}
                      style={{...fpInputStyle(FP_C), appearance:"none", cursor:"pointer"}}>
                      {FP_RESPONSE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FP_Field>
                  <FP_Field label="Tiempo de envío">
                    <select value={ad.shipping}
                      onChange={e => setAd(d => ({...d,shipping:e.target.value}))}
                      style={{...fpInputStyle(FP_C), appearance:"none", cursor:"pointer"}}>
                      {FP_SHIPPING_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FP_Field>
                </div>

                {/* Preferencias */}
                <div style={{ background:FP_C.surfaceTop, borderRadius:8,
                  padding:"14px", marginBottom:14, border:`1px solid ${FP_C.border}` }}>
                  <FP_SectionHead>Preferencias de venta</FP_SectionHead>
                  {[
                    { k:"acceptsOffers", l:"Acepto ofertas / negociación", icon:FP_Icons.handshake },
                    { k:"shipsNational", l:"Hago envíos nacionales",       icon:FP_Icons.globe     },
                    { k:"shipsLocal",    l:"Entrega en persona / local",   icon:FP_Icons.radio     },
                  ].map((opt, i, arr) => (
                    <div key={opt.k} style={{ display:"flex", alignItems:"center",
                      justifyContent:"space-between", padding:"11px 0",
                      borderBottom:i<arr.length-1?`1px solid ${FP_C.border}`:"none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <FP_Icon d={opt.icon} size={15} color={FP_C.textSecondary}/>
                        <span style={{ fontSize:13, color:FP_C.textSecondary }}>{opt.l}</span>
                      </div>
                      <FP_Toggle on={ad[opt.k]}
                        onChange={() => setAd(d => ({...d,[opt.k]:!d[opt.k]}))}/>
                    </div>
                  ))}
                </div>

                {/* Redes */}
                <div style={{ background:FP_C.surfaceTop, borderRadius:8,
                  padding:"14px", marginBottom:20, border:`1px solid ${FP_C.border}` }}>
                  <FP_SectionHead>Redes sociales</FP_SectionHead>
                  {[
                    { k:"instagram", label:"Instagram", icon:FP_Icons.instagram, ph:"usuario" },
                    { k:"facebook",  label:"Facebook",  icon:FP_Icons.facebook,  ph:"tu.perfil" },
                    { k:"tiktok",    label:"TikTok",    icon:FP_Icons.music,     ph:"usuario" },
                  ].map(s => (
                    <FP_Field key={s.k} label={s.label}>
                      <div style={{ position:"relative" }}>
                        <span style={{ position:"absolute", left:11, top:"50%",
                          transform:"translateY(-50%)" }}>
                          <FP_Icon d={s.icon} size={14} color={FP_C.textMuted}/>
                        </span>
                        <input value={ad[s.k]} placeholder={s.ph}
                          onChange={e => setAd(d => ({...d,[s.k]:e.target.value.replace("@","")}))}
                          onFocus={e => e.target.style.borderColor = FP_C.accent}
                          onBlur={e => e.target.style.borderColor = FP_C.border}
                          style={{...fpInputStyle(FP_C), paddingLeft:34}}/>
                      </div>
                    </FP_Field>
                  ))}
                </div>

                <div style={{ display:"flex", gap:8 }}>
                  <FP_Btn onClick={saveAbout} style={{ flex:1 }}>Guardar cambios</FP_Btn>
                  <FP_Btn variant="secondary" onClick={cancelAbout} style={{ flex:1 }}>Cancelar</FP_Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MessagesScreen({ user, onBack, onChat }) {
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
function ChatScreen({ chat, user, onBack, flash }) {
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

// ═════════════════════════════════════════════════════════════════════════════
// ORDERS SCREEN
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// ORDER DETAIL — el pedido con su envío precargado y su línea de estados
// ═════════════════════════════════════════════════════════════════════════════
function OrderDetailScreen({ order: o, user, me, onBack, onAdvance, onChat, flash, onSellerConfirm, onBuyerConfirm, onSellerPayment, onApproveFee }) {
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
  const viewerIsSeller = !!me && o.sellerName === me;
  const viewerLooksBuyer = (o.buyerId != null && o.buyerId === user?.id) || (!!o.buyerName && o.buyerName === me) || o.feeApproval === "pending";
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
          const isSeller = !!me && o.sellerName === me;
          const viewerIsBuyer = (o.buyerId != null && o.buyerId === user?.id) || (!!o.buyerName && o.buyerName === me) || !isSeller;
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

function OrdersScreen({ user, onBack, flash, orders: liveOrders = [], onOpen }) {
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const [orders,  setOrders]  = useState(liveOrders);
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    let alive = true;
    getUserOrders(user?.id).then(d => { if (alive) { setOrders([...(liveOrders || []), ...(d || [])]); setLoading(false); } }).catch(() => { if (alive) { setOrders(liveOrders || []); setLoading(false); } });
    return () => { alive = false; };
  }, [user?.id, liveOrders]);

  const statusColors = { pendiente: "#FBBF24", pending: "#FBBF24", confirmed: "#60A5FA", shipped: "#A78BFA", delivered: "#22C55E", cancelled: "#F87171" };
  const statusLabels = { pendiente: "Pendiente", pending: "Pendiente", confirmed: "Confirmado", shipped: "En camino", delivered: "Entregado", cancelled: "Cancelado" };
  const stepLabel = (o) => o.feeApproval === "pending" ? "Confirma la tarifa" : ((o.flow && o.flow[o.stepIdx]) ? o.flow[o.stepIdx].label : (statusLabels[o.status] || o.status));
  const stepColor = (o) => {
    if (o.feeApproval === "pending") return "#F59E0B";
    if (!o.flow) return statusColors[o.status] || "#888";
    if (o.stepIdx >= o.flow.length - 1) return "#22C55E";
    if (o.stepIdx === 0) return "#FBBF24";
    return "#60A5FA";
  };

  const isDone = o => o.courierStage === "completado" || o.status === "fallido" || (o.buyerConfirmed && o.sellerPaid) || (o.flow && (o.stepIdx || 0) > 0 && (o.stepIdx || 0) >= o.flow.length - 1);
  const activeOrders = orders.filter(o => !isDone(o));
  const doneOrders = orders.filter(o => isDone(o));
  const renderCard = (o, i) => {
    const sc = stepColor(o);
    const sl = SHIP_LABELS[o.shipType || o.shipMode] || SHIP_LABELS.local;
    const md = MODALIDAD_LABELS[o.modalidad] || null;
    return (
      <div key={o.id} onClick={() => onOpen?.(o)} className={onOpen ? "cd" : ""} style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: "14px", marginBottom: 10, cursor: onOpen ? "pointer" : "default" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Pedido #{String(o.id).slice(-8).toUpperCase()}</p>
            {o.title && <p style={{ fontSize: 12, fontWeight: 700, color: T1, marginBottom: 3 }}>{o.title}{o.qty > 1 ? ` ×${o.qty}` : ""}</p>}
            <p style={{ fontSize: 18, fontWeight: 900, color: G }}>{money(o.amount, o.currency)}</p>
          </div>
          <div style={{ background: sc + "20", border: `1px solid ${sc}35`, borderRadius: 100, padding: "4px 11px", flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: sc }}>{stepLabel(o)}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
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

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ background: isDark ? "rgba(8,8,8,.95)" : "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${B}`, padding: "13px 18px", display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onBack} className="p" style={{ background: "none", border: "none", display: "flex" }}><Ic n="back" c="#666" s={20} /></button>
        <p style={{ fontSize: 14, fontWeight: 800 }}>Mis pedidos</p>
      </div>
      {loading
        ? <div style={{ display: "flex", justifyContent: "center", padding: "44px 0" }}><Spin size={26} /></div>
        : orders.length === 0
          ? <div style={{ padding: "64px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 50, marginBottom: 16 }}>📦</div>
              <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Sin pedidos aún</p>
              <p style={{ fontSize: 11, color: "#3e3e3e" }}>Tus compras aparecerán aquí.</p>
            </div>
          : <div style={{ padding: "14px 18px 80px" }}>
              {activeOrders.map((o, i) => renderCard(o, i))}
              {activeOrders.length === 0 && <p style={{ fontSize: 11.5, color: T3, textAlign: "center", padding: "20px 0" }}>No tienes pedidos en curso.</p>}
              {doneOrders.length > 0 && (
                <div style={{ marginTop: activeOrders.length ? 18 : 4 }}>
                  <button onClick={() => setShowDone(s => !s)} className="p" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: isDark ? "#111" : "#F2F3F5", border: `1px solid ${B}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: T2 }}>✓ Completados ({doneOrders.length})</span>
                    <span style={{ fontSize: 11, color: T3, transform: showDone ? "rotate(90deg)" : "none", transition: "transform .15s" }}>›</span>
                  </button>
                  {showDone && doneOrders.map((o, i) => renderCard(o, i))}
                </div>
              )}
            </div>
      }
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// SETTINGS — Configuración completa de la plataforma
// ═════════════════════════════════════════════════════════════════════════════
/* ── TEMAS ────────────────────────────────────────────────────── */
const CFG_DARK = {
  P:"#FFC01E", PL:"#FFC01E18",
  BG:"#080808",       // fondo app — muy oscuro
  CARD:"#0d0d0d",     // contenedor del grupo (gap entre botones)
  ROW:"#141414",      // superficie de cada botón/fila ← profundidad
  CARD2:"#1a1a1a",    // inputs y superficies elevadas
  CARD_BD:"#1a1a1a",  // borde sutil del card
  T1:"#f0f0f0", T2:"#666666", T3:"#333333",
  SW_OFF:"#2a2a2a",
  OK_BG:"#0A2218",  OK_T:"#4ADE80",
  ERR_BG:"#28090A", ERR_T:"#FF5F5F",
  WRN_BG:"#2A1C00", WRN_T:"#FBBF24",
};
const CFG_LIGHT = {
  P:"#FFC01E", PL:"#FFC01E18",
  BG:"#FFFFFF",       // fondo app — blanco puro
  CARD:"#FFFFFF",     // contenedor del grupo
  ROW:"#FFFFFF",      // superficie de cada botón/fila
  CARD2:"#F2F3F5",    // inputs
  CARD_BD:"#E4E6EB",  // borde sutil / divisores
  T1:"#050505", T2:"#65676B", T3:"#8A8D91",
  SW_OFF:"#D4D7DC",
  OK_BG:"#E6FAF0",  OK_T:"#16A34A",
  ERR_BG:"#FEE2E2", ERR_T:"#DC2626",
  WRN_BG:"#FEF6E0", WRN_T:"#D97706",
};

const CFG_ThemeCtx = createContext(CFG_DARK);
const CFG_useTk = () => useContext(CFG_ThemeCtx);

/* ── DATA ─────────────────────────────────────────────────────── */
const CFG_INIT_PROFILE = {
  name:"Carlos Rivera", email:"carlos.rivera@gmail.com",
  phone:"+52 999 123 4567", verified:true, initials:"CR", memberSince:"2023",
};
const CFG_INIT = {
  appearance:{ theme:"auto", density:"standard", textSize:"normal", reduceAnimations:false },
  notifications:{
    chat:       { newMessages:true,  sounds:true,  vibration:true  },
    marketplace:{ newSales:true,     newOrders:true                },
    deliveries: { orderStatus:true,  delivered:true, shippingUpdate:false },
    auctions:   { newBid:true,       endingSoon:true, won:true     },
    promotions: { offers:false,      events:false,  news:false     },
  },
  privacy:{
    twoFactor:false, fingerprint:true, publicProfile:true,
    showLastSeen:false, showOnlineStatus:true,
    blockedUsers:[
      { id:1, name:"Miguel Torres", username:"@miguel_t" },
      { id:2, name:"Ana González",  username:"@ana_g"    },
    ],
  },
  chat:{ readReceipts:true, autoDownloadImages:false, autoDownloadVideos:false },
  deliveries:{
    addresses:[
      { id:1, label:"Casa",    address:"Av. Paseo de Montejo 120, Mérida, Yucatán", main:true  },
      { id:2, label:"Trabajo", address:"Calle 62 #456, Centro Histórico, Mérida",   main:false },
    ],
    instructions:"Dejar en la puerta principal. Llamar antes de entregar.",
    searchRadius:15, internationalShipping:false,
  },
  auctions:{ confirmBeforeBid:true, closingReminders:true },
  language:"es",
  payments:{
    methods:[
      { id:1, type:"card",   last4:"4532", brand:"Visa", expires:"12/26", main:true  },
      { id:2, type:"paypal", email:"carlos@paypal.com",                    main:false },
    ],
    transactions:[
      { id:1, desc:"Compra · Nike Air Max",  date:"8 Jun",  amount:"$2,450",  status:"completed", credit:false },
      { id:2, desc:"Venta · Canon EOS R50",  date:"5 Jun",  amount:"+$3,800", status:"completed", credit:true  },
      { id:3, desc:"Subasta · Reloj Seiko",  date:"1 Jun",  amount:"$980",    status:"pending",   credit:false },
      { id:4, desc:"Envío · Paquete #4521",  date:"28 May", amount:"$120",    status:"completed", credit:false },
    ],
  },
  activity:{
    purchases:{ total:24, amount:"$18,450" },
    sales:    { total:12, amount:"$31,200" },
    orders:   { made:24,  completed:22     },
    auctions: { participated:18, won:7, lost:11 },
    history:[
      { label:"Jun", purchases:4, sales:2 },
      { label:"May", purchases:3, sales:1 },
      { label:"Abr", purchases:5, sales:3 },
      { label:"Mar", purchases:2, sales:2 },
      { label:"Feb", purchases:6, sales:1 },
      { label:"Ene", purchases:4, sales:3 },
    ],
  },
  storage:{ cache:47.3, temp:23.1, downloads:128.4 },
};

/* ── ÁTOMOS ───────────────────────────────────────────────────── */
function CFG_Sw({ on, change }) {
  const tk = CFG_useTk();
  return (
    <button onClick={() => change(!on)}
      style={{ background: on ? tk.P : tk.SW_OFF, transition:"background .15s" }}
      className="relative w-11 h-6 rounded-full flex-shrink-0 focus:outline-none">
      <span style={{ transform: on ? "translateX(21px)" : "translateX(2px)", transition:"transform .15s" }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full block" />
    </button>
  );
}

function CFG_Hdr({ title, onBack }) {
  const tk = CFG_useTk();
  return (
    <div style={{ background:tk.CARD, borderBottomColor:tk.CARD_BD }}
      className="flex items-center gap-2.5 px-4 py-3 border-b sticky top-0 z-10">
      {onBack && (
        <button onClick={onBack} style={{ background:tk.ROW, borderColor:tk.CARD_BD }}
          className="w-7 h-7 flex items-center justify-center rounded-lg border">
          <ArrowLeft size={15} style={{ color:tk.T2 }} />
        </button>
      )}
      <h1 style={{ color:tk.T1 }} className="text-[15px] font-semibold flex-1">{title}</h1>
    </div>
  );
}

function CFG_Lbl({ children }) {
  const tk = CFG_useTk();
  return (
    <div className="px-4 pt-3.5 pb-1">
      <span style={{ color:tk.T3 }} className="text-[10px] font-bold uppercase tracking-widest">{children}</span>
    </div>
  );
}

/* Card = contenedor oscuro; los ROW dentro flotan sobre él */
function CFG_Crd({ children }) {
  const tk = CFG_useTk();
  return (
    <div style={{ background:tk.CARD, borderColor:tk.CARD_BD }}
      className="rounded-xl mx-4 overflow-hidden border">
      {children}
    </div>
  );
}

/* Separador = muestra CARD entre los ROW → gap de profundidad */
function CFG_Hr() {
  const tk = CFG_useTk();
  return <div style={{ background:tk.CARD }} className="h-px" />;
}

/* Fila navegable — tiene su propio fondo ROW */
function CFG_Row({ icon:Icon, bg, label, sub, value, onClick, danger }) {
  const tk = CFG_useTk();
  return (
    <button onClick={onClick} style={{ background:tk.ROW }}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:opacity-60">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg||"bg-zinc-700"}`}>
          <Icon size={15} className="text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div style={{ color: danger ? tk.ERR_T : tk.T1 }} className="text-[14px] font-medium leading-tight truncate">{label}</div>
        {sub && <div style={{ color:tk.T2 }} className="text-[11px] mt-0.5 truncate">{sub}</div>}
      </div>
      {value && <span style={{ color:tk.T2, maxWidth:"45%" }} className="text-[12px] flex-shrink-0 mr-0.5 truncate">{value}</span>}
      <ChevronRight size={13} style={{ color: danger ? tk.ERR_T+"66" : tk.T3 }} className="flex-shrink-0" />
    </button>
  );
}

/* Fila toggle — tiene su propio fondo ROW */
function CFG_TRow({ icon:Icon, bg, label, sub, on, change }) {
  const tk = CFG_useTk();
  return (
    <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg||"bg-zinc-700"}`}>
          <Icon size={15} className="text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div style={{ color:tk.T1 }} className="text-[14px] font-medium leading-tight">{label}</div>
        {sub && <div style={{ color:tk.T2 }} className="text-[11px] mt-0.5">{sub}</div>}
      </div>
      <CFG_Sw on={on} change={change} />
    </div>
  );
}

function CFG_Radio({ opts, val, change }) {
  const tk = CFG_useTk();
  return (
    <div>
      {opts.map((o, i) => (
        <div key={o.value}>
          {i > 0 && <CFG_Hr />}
          <button onClick={() => change(o.value)} style={{ background:tk.ROW }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:opacity-60">
            <div style={{ borderColor: val === o.value ? tk.P : tk.T3 }}
              className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0">
              {val === o.value && <div style={{ background:tk.P }} className="w-2 h-2 rounded-full" />}
            </div>
            <div className="flex-1">
              <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{o.label}</div>
              {o.sub && <div style={{ color:tk.T2 }} className="text-[11px]">{o.sub}</div>}
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}

function CFG_Bdg({ s }) {
  const tk = CFG_useTk();
  const m = {
    completed:["Completado",{ background:tk.OK_BG,  color:tk.OK_T  }],
    pending:  ["Pendiente", { background:tk.WRN_BG, color:tk.WRN_T }],
    failed:   ["Fallido",   { background:tk.ERR_BG, color:tk.ERR_T }],
  };
  const [l, st] = m[s] || m.pending;
  return <span style={st} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{l}</span>;
}

/* ── HOME ─────────────────────────────────────────────────────── */
function CFG_HomeScreen({ profile, settings, nav, onBack }) {
  const tk = CFG_useTk();
  const storMB = Math.round(Object.values(settings.storage).reduce((a,b)=>a+b,0));
  const themeLabel = { auto:"Auto", light:"Claro", dark:"Oscuro" };
  const langLabel  = { es:"Español", en:"English", pt:"Português", fr:"Français" };
  const sections = [
    { title:"Cuenta", items:[
      { id:"account",       Icon:User,         label:"Cuenta",              value:profile.name, bg:"bg-violet-600" },
    ]},
    { title:"Personalización", items:[
      { id:"appearance",    Icon:Palette,       label:"Apariencia",          value:themeLabel[settings.appearance.theme]||"Auto", bg:"bg-indigo-600" },
      { id:"language",      Icon:Globe,         label:"Idioma",              value:langLabel[settings.language]||"Español",        bg:"bg-sky-600"    },
    ]},
    { title:"Comunicación", items:[
      { id:"notifications", Icon:Bell,          label:"Notificaciones",      bg:"bg-orange-600" },
      { id:"chat",          Icon:MessageCircle, label:"Chat",                bg:"bg-teal-600"   },
    ]},
    { title:"Marketplace", items:[
      { id:"deliveries",    Icon:Truck,         label:"Entregas y Envíos",   value:`${settings.deliveries.addresses.length} dirs.`,  bg:"bg-blue-600"    },
      { id:"auctions",      Icon:Gavel,         label:"Subastas",            value:`${settings.activity.auctions.won}/${settings.activity.auctions.participated}`, bg:"bg-amber-600" },
      { id:"payments",      Icon:CreditCard,    label:"Pagos",               value:`${settings.payments.methods.length} métodos`,    bg:"bg-emerald-600" },
    ]},
    { title:"Datos y Privacidad", items:[
      { id:"activity",      Icon:BarChart2,     label:"Actividad",           bg:"bg-pink-600"  },
      { id:"privacy",       Icon:Shield,        label:"Privacidad",          value:settings.privacy.twoFactor?"2FA ✓":"2FA", bg:"bg-red-600" },
      { id:"storage",       Icon:HardDrive,     label:"Almacenamiento",      value:`${storMB} MB`, bg:"bg-zinc-600" },
    ]},
    { title:"Soporte", items:[
      { id:"help",          Icon:HelpCircle,    label:"Ayuda",               bg:"bg-cyan-700"  },
      { id:"about",         Icon:Info,          label:"Acerca de",           value:"3.2.1",    bg:"bg-zinc-600" },
    ]},
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Configuración" onBack={onBack} />
      {sections.map(sec => (
        <div key={sec.title}>
          <CFG_Lbl>{sec.title}</CFG_Lbl>
          <CFG_Crd>
            {sec.items.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <CFG_Hr />}
                <CFG_Row icon={item.Icon} bg={item.bg} label={item.label} value={item.value} onClick={() => nav(item.id)} />
              </div>
            ))}
          </CFG_Crd>
        </div>
      ))}
      <div className="h-8" />
    </div>
  );
}

/* ── ACCOUNT ──────────────────────────────────────────────────── */
function CFG_AccountScreen({ profile, setProfile, nav, onSignOut, isVerified=false, onRequestVerification, accountPassword="", onSetPassword, flash }) {
  const tk = CFG_useTk();
  const [editing, setEditing] = useState(null);
  const [val, setVal] = useState("");
  const [pwSheet, setPwSheet] = useState(false);
  const hasPw = !!accountPassword;
  function startEdit(f, v) { setEditing(f); setVal(v); }
  function save() {
    if (editing==="name") { const ini=val.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); setProfile(p=>({...p,name:val.trim(),initials:ini})); }
    else if (editing==="email") setProfile(p=>({...p,email:val.trim()}));
    else if (editing==="phone") setProfile(p=>({...p,phone:val.trim()}));
    setEditing(null);
  }
  const fields = [
    { field:"name",  label:"Nombre",  value:profile.name,  Icon:User  },
    { field:"email", label:"Correo",  value:profile.email, Icon:Mail  },
    { field:"phone", label:"Teléfono", value:profile.phone, Icon:Phone },
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Cuenta" onBack={() => nav("home")} />
      <div className="flex flex-col items-center py-5">
        <div className="relative">
          <div style={{ background:"linear-gradient(135deg,#b8860b,#FFC01E)" }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center">
            <span className="text-white text-xl font-black">{profile.initials}</span>
          </div>
          {profile.verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2" style={{ borderColor:tk.BG }}>
              <Check size={10} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>
        <button style={{ color:tk.P }} className="mt-2.5 flex items-center gap-1 text-[12px] font-medium">
          <Camera size={12} /> Cambiar foto
        </button>
      </div>
      <CFG_Lbl>Información personal</CFG_Lbl>
      <CFG_Crd>
        {fields.map(({ field, label, value, Icon }, i) => (
          <div key={field}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div style={{ background:tk.CARD2 }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} style={{ color:tk.T2 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ color:tk.T3 }} className="text-[10px] font-bold uppercase tracking-wide">{label}</div>
                  {editing===field
                    ? <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
                        style={{ borderColor:tk.P, color:tk.T1, background:"transparent" }}
                        className="text-[14px] font-medium border-b-2 outline-none w-full" />
                    : <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{value}</div>}
                </div>
                {editing===field ? (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => setEditing(null)} style={{ color:tk.T2 }} className="text-[12px]">Cancelar</button>
                    <button onClick={save} style={{ color:tk.P }} className="text-[12px] font-bold">OK</button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(field, value)} style={{ color:tk.T3 }} className="flex-shrink-0"><Edit2 size={14} /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CFG_Crd>
      <CFG_Lbl>Estado</CFG_Lbl>
      <CFG_Crd>
        {isVerified ? (
          <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
            <div style={{ background:tk.OK_BG }} className="w-8 h-8 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={15} style={{ color:tk.OK_T }} />
            </div>
            <div>
              <div style={{ color:tk.T1 }} className="text-[14px] font-medium">Cuenta verificada</div>
              <div style={{ color:tk.T2 }} className="text-[11px]">Miembro desde {profile.memberSince}</div>
            </div>
          </div>
        ) : (
          <CFG_Row icon={Shield} bg="bg-violet-600" label="Solicitar verificación" sub="Sube tu documento y obtén el sello" onClick={() => onRequestVerification && onRequestVerification()} />
        )}
      </CFG_Crd>
      <CFG_Lbl>Seguridad</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={Lock} bg="bg-zinc-600" label={hasPw ? "Cambiar contraseña" : "Crear contraseña"} sub={hasPw ? "Actualiza tu contraseña" : "Aún no tienes contraseña"} onClick={() => setPwSheet(true)} />
      </CFG_Crd>
      <CFG_Lbl>Sesión</CFG_Lbl>
      <CFG_Crd><CFG_Row icon={LogOut} bg="bg-red-700" label="Cerrar sesión" danger onClick={onSignOut || (() => {})} /></CFG_Crd>
      <div className="h-8" />
      {pwSheet && <CFG_PasswordSheet hasPw={hasPw} current={accountPassword} onClose={() => setPwSheet(false)} onSave={(pw) => { onSetPassword && onSetPassword(pw); setPwSheet(false); flash && flash(hasPw ? "🔒 Contraseña actualizada" : "🔒 Contraseña creada"); }} />}
    </div>
  );
}

function CFG_PasswordSheet({ hasPw, current, onClose, onSave }) {
  const tk = CFG_useTk();
  const [cur, setCur] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (hasPw && cur !== current) { setErr("La contraseña actual no es correcta"); return; }
    if (pw1.length < 4) { setErr("Mínimo 4 caracteres"); return; }
    if (pw1 !== pw2) { setErr("Las contraseñas no coinciden"); return; }
    onSave(pw1);
  };
  const inp = { background:tk.CARD2, color:tk.T1, borderColor:"rgba(128,128,128,.25)" };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:5000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:tk.BG, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"20px 18px 26px", maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ color:tk.T1 }} className="text-[16px] font-bold mb-1">{hasPw ? "Cambiar contraseña" : "Crear contraseña"}</div>
        <div style={{ color:tk.T2 }} className="text-[12px] mb-4">{hasPw ? "Introduce tu contraseña actual y la nueva." : "Crea una contraseña para proteger tu cuenta."}</div>
        {hasPw && <input type="password" value={cur} onChange={e=>{setCur(e.target.value);setErr("");}} placeholder="Contraseña actual" style={inp} className="w-full h-11 rounded-xl px-3 text-[14px] border outline-none mb-2.5" />}
        <input type="password" value={pw1} onChange={e=>{setPw1(e.target.value);setErr("");}} placeholder="Nueva contraseña" style={inp} className="w-full h-11 rounded-xl px-3 text-[14px] border outline-none mb-2.5" />
        <input type="password" value={pw2} onChange={e=>{setPw2(e.target.value);setErr("");}} placeholder="Repite la nueva contraseña" style={inp} className="w-full h-11 rounded-xl px-3 text-[14px] border outline-none mb-2.5" />
        {err && <div className="text-[12px] mb-2" style={{ color:"#ef4444" }}>{err}</div>}
        <div className="flex gap-2.5 mt-2">
          <button onClick={onClose} style={{ background:tk.CARD2, color:tk.T1 }} className="flex-1 h-11 rounded-xl text-[13px] font-semibold">Cancelar</button>
          <button onClick={submit} style={{ background:"#FFC01E", color:"#000" }} className="flex-1 h-11 rounded-xl text-[13px] font-bold">{hasPw ? "Actualizar" : "Crear"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── APPEARANCE ───────────────────────────────────────────────── */
// Barrita deslizable con puntos (estilo ajustes de teléfono). Se arrastra y los
// puntos/etiquetas también son tocables. Reutilizable para densidad y tamaño de texto.
function CFG_StepSlider({ index, count, labels, onChange, hint }) {
  const tk = CFG_useTk();
  const safe = Math.max(0, Math.min(count - 1, index));
  return (
    <div style={{ background: tk.ROW }} className="px-4 pt-4 pb-3">
      <input type="range" min={0} max={count - 1} step={1} value={safe}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="dslider" style={{ width: "100%", accentColor: "#FFC01E" }} />
      <div className="flex" style={{ marginTop: 10, gap: 2 }}>
        {labels.map((l, i) => (
          <button key={i} onClick={() => onChange(i)}
            style={{ flex: 1, textAlign: "center", fontSize: 9.5, lineHeight: 1.2,
              fontWeight: i === safe ? 800 : 600, color: i === safe ? "#FFC01E" : tk.T3,
              background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {l}
          </button>
        ))}
      </div>
      {hint && <p style={{ color: tk.T3, fontSize: 9, textAlign: "center", marginTop: 8 }}>{hint}</p>}
    </div>
  );
}

function CFG_DensitySelector() {
  const { mode, setMode, modes } = useDensity();
  const idx = modes.indexOf(mode);
  return (
    <CFG_StepSlider
      index={idx < 0 ? 2 : idx}
      count={modes.length}
      labels={modes.map(m => DENSITY_TOKENS[m].label)}
      onChange={i => setMode(modes[i])}
      hint="Ajusta el tamaño y el aire de toda la app · 2 productos por fila"
    />
  );
}

function CFG_AppearanceScreen({ settings, upd, nav, appScale = 1, onScale, onThemeChange, appTheme="auto", appTextScale=1, onTextScaleChange }) {
  const tk = CFG_useTk();
  const ap = settings.appearance;
  function set(k, v) { upd("appearance", { ...ap, [k]:v }); }
  const sizes = { small:12, normal:14, large:16 };
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Apariencia" onBack={() => nav("home")} />
      <CFG_Lbl>Tema</CFG_Lbl>
      <CFG_Crd>
        <CFG_Radio val={appTheme} change={v => { upd("appearance", { ...ap, theme:v }); onThemeChange?.(v); }} opts={[
          { value:"light", label:"Claro",      sub:"Fondo blanco"     },
          { value:"dark",  label:"Oscuro",     sub:"Fondo negro"      },
          { value:"auto",  label:"Automático", sub:"Sigue el sistema" },
        ]} />
      </CFG_Crd>
      <CFG_Lbl>Densidad visual</CFG_Lbl>
      <CFG_Crd>
        <CFG_DensitySelector />
      </CFG_Crd>
      <CFG_Lbl>Tamaño del texto</CFG_Lbl>
      <CFG_Crd>
        <CFG_StepSlider
          index={(() => { let bi = 0, bd = 9; TEXT_STEPS.forEach((s, i) => { const d = Math.abs(s - (appTextScale || 1)); if (d < bd) { bd = d; bi = i; } }); return bi; })()}
          count={TEXT_STEPS.length}
          labels={["Pequeño", "Normal", "Grande", "Mayor", "Máx"]}
          onChange={i => onTextScaleChange?.(TEXT_STEPS[i])}
          hint="Aplica a todo el texto de la app"
        />
        <CFG_Hr />
        <div style={{ background:tk.ROW }} className="px-3.5 py-3">
          <div style={{ fontSize: 13 * (appTextScale || 1), background:tk.PL, borderRadius:8, color:tk.P }}
            className="px-3 py-2 leading-relaxed">
            Vista previa del tamaño de texto seleccionado.
          </div>
        </div>
      </CFG_Crd>
      <CFG_Lbl>Accesibilidad</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={Zap} bg="bg-amber-600" label="Reducir animaciones" sub="Mejora el rendimiento"
          on={ap.reduceAnimations} change={v => set("reduceAnimations", v)} />
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── NOTIFICATIONS ─────────────────────────────────────────────── */
function CFG_NotificationsScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const n = settings.notifications;
  function set(g, k, v) { upd("notifications", { ...n, [g]:{ ...n[g], [k]:v } }); }
  const groups = [
    { id:"chat", label:"Chat", items:[
      { k:"newMessages", l:"Mensajes nuevos", Icon:MessageCircle, bg:"bg-teal-600"   },
      { k:"sounds",      l:"Sonidos",         Icon:Volume2,       bg:"bg-sky-700"    },
      { k:"vibration",   l:"Vibración",       Icon:Smartphone,    bg:"bg-blue-700"   },
    ]},
    { id:"marketplace", label:"Marketplace", items:[
      { k:"newSales",  l:"Nuevas ventas",  Icon:ShoppingBag, bg:"bg-violet-600" },
      { k:"newOrders", l:"Nuevos pedidos", Icon:Package,     bg:"bg-indigo-600" },
    ]},
    { id:"deliveries", label:"Entregas y Envíos", items:[
      { k:"orderStatus",    l:"Estado del pedido",     Icon:Truck,        bg:"bg-blue-600"    },
      { k:"delivered",      l:"Pedido entregado",      Icon:CheckCircle2, bg:"bg-emerald-600" },
      { k:"shippingUpdate", l:"Actualización de envío", Icon:MapPin,      bg:"bg-cyan-700"    },
    ]},
    { id:"auctions", label:"Subastas", items:[
      { k:"newBid",     l:"Nueva oferta",     Icon:Gavel, bg:"bg-amber-600"  },
      { k:"endingSoon", l:"Próxima a cerrar", Icon:Clock, bg:"bg-orange-600" },
      { k:"won",        l:"Subasta ganada",   Icon:Award, bg:"bg-yellow-600" },
    ]},
    { id:"promotions", label:"Promociones", items:[
      { k:"offers", l:"Ofertas",   Icon:Star,     bg:"bg-pink-600"   },
      { k:"events", l:"Eventos",   Icon:Calendar, bg:"bg-purple-600" },
      { k:"news",   l:"Novedades", Icon:Zap,      bg:"bg-rose-600"   },
    ]},
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Notificaciones" onBack={() => nav("home")} />
      {groups.map(gr => (
        <div key={gr.id}>
          <CFG_Lbl>{gr.label}</CFG_Lbl>
          <CFG_Crd>
            {gr.items.map((item, i) => (
              <div key={item.k}>
                {i > 0 && <CFG_Hr />}
                <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                    <item.Icon size={15} className="text-white" />
                  </div>
                  <div style={{ color:tk.T1 }} className="flex-1 text-[14px] font-medium">{item.l}</div>
                  <CFG_Sw on={n[gr.id][item.k]} change={v => set(gr.id, item.k, v)} />
                </div>
              </div>
            ))}
          </CFG_Crd>
        </div>
      ))}
      <div className="h-8" />
    </div>
  );
}

/* ── PRIVACY ──────────────────────────────────────────────────── */
function CFG_PrivacyScreen({ settings, upd, nav, blockedUsers=[], onToggleBlock }) {
  const tk = CFG_useTk();
  const pv = settings.privacy;
  function set(k, v) { upd("privacy", { ...pv, [k]:v }); }
  function unblock(key, name) { onToggleBlock && onToggleBlock(key, name); }
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Privacidad y Seguridad" onBack={() => nav("home")} />
      <CFG_Lbl>Seguridad</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={Shield}      bg="bg-red-700"    label="Verificación en dos pasos" sub="Capa extra de protección" on={pv.twoFactor}       change={v=>set("twoFactor",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Fingerprint} bg="bg-violet-600" label="Huella digital"            sub="Autenticación biométrica"  on={pv.fingerprint}     change={v=>set("fingerprint",v)} />
      </CFG_Crd>
      <CFG_Lbl>Visibilidad</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={Globe}    bg="bg-sky-600"     label="Perfil público"  sub="Otros pueden ver tu perfil"  on={pv.publicProfile}    change={v=>set("publicProfile",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Clock}    bg="bg-zinc-600"    label="Última conexión" sub="Visible para contactos"       on={pv.showLastSeen}     change={v=>set("showLastSeen",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Activity} bg="bg-emerald-600" label="Estado en línea" sub="Punto verde cuando activo"    on={pv.showOnlineStatus} change={v=>set("showOnlineStatus",v)} />
      </CFG_Crd>
      <CFG_Lbl>Bloqueados · {blockedUsers.length}</CFG_Lbl>
      <CFG_Crd>
        {blockedUsers.length === 0 ? (
          <div style={{ background:tk.ROW }} className="px-3.5 py-5 text-center">
            <p style={{ color:tk.T2 }} className="text-[13px]">Sin usuarios bloqueados</p>
          </div>
        ) : blockedUsers.map((u, i) => (
          <div key={u.key}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <div style={{ background:tk.CARD2 }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <User size={14} style={{ color:tk.T2 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{u.name}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">Bloqueado</div>
              </div>
              <button onClick={() => unblock(u.key, u.name)} style={{ background:tk.ERR_BG, color:tk.ERR_T }}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full">Desbloquear</button>
            </div>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── CHAT ─────────────────────────────────────────────────────── */
function CFG_ChatScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const { chat } = settings;
  const [done, setDone] = useState({ conv:false, temp:false });
  function set(k, v) { upd("chat", { ...chat, [k]:v }); }
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Chat" onBack={() => nav("home")} />
      <CFG_Lbl>Preferencias</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={CheckCircle2} bg="bg-teal-600"   label="Confirmación de lectura"  sub="Muestra cuando lees"   on={chat.readReceipts}       change={v=>set("readReceipts",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Download}     bg="bg-sky-600"    label="Descargar imágenes auto." sub="Solo en Wi-Fi"          on={chat.autoDownloadImages} change={v=>set("autoDownloadImages",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Download}     bg="bg-indigo-600" label="Descargar videos auto."   sub="Consume datos móviles"  on={chat.autoDownloadVideos} change={v=>set("autoDownloadVideos",v)} />
      </CFG_Crd>
      <CFG_Lbl>Limpieza</CFG_Lbl>
      <CFG_Crd>
        {[
          { id:"conv", Icon:MessageCircle, bg:"bg-orange-600", label:"Limpiar conversaciones",  sub:"Mensajes y medios locales" },
          { id:"temp", Icon:Database,      bg:"bg-zinc-600",   label:"Eliminar archivos temp.", sub:"Libera ~23 MB" },
        ].map((item, i) => (
          <div key={item.id}>
            {i > 0 && <CFG_Hr />}
            <button onClick={() => setDone(d=>({...d,[item.id]:true}))} style={{ background:tk.ROW }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:opacity-60">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                <item.Icon size={15} className="text-white" />
              </div>
              <div className="flex-1">
                <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{item.label}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">{item.sub}</div>
              </div>
              {done[item.id]
                ? <span style={{ color:tk.OK_T }} className="text-[11px] font-semibold flex items-center gap-1"><Check size={12} /> Listo</span>
                : <ChevronRight size={13} style={{ color:tk.T3 }} />}
            </button>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── DELIVERIES ───────────────────────────────────────────────── */
function CFG_DeliveriesScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const del = settings.deliveries;
  const [editInstr, setEditInstr] = useState(false);
  const [instr, setInstr] = useState(del.instructions);
  const [adding, setAdding] = useState(false);
  const [newA, setNewA] = useState({ label:"", address:"" });
  function set(k, v) { upd("deliveries", { ...del, [k]:v }); }
  function addAddr() {
    if (!newA.label || !newA.address) return;
    set("addresses", [...del.addresses, { id:Date.now(), ...newA, main:false }]);
    setAdding(false); setNewA({ label:"", address:"" });
  }
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Entregas y Envíos" onBack={() => nav("home")} />
      <CFG_Lbl>Direcciones</CFG_Lbl>
      <CFG_Crd>
        {del.addresses.map((a, i) => (
          <div key={a.id}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-start gap-2.5 px-3.5 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ color:tk.T1 }} className="text-[14px] font-medium">{a.label}</span>
                  {a.main && <span style={{ background:tk.PL, color:tk.P }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full">Principal</span>}
                </div>
                <p style={{ color:tk.T2 }} className="text-[11px] mt-0.5 leading-snug">{a.address}</p>
                <div className="flex gap-3 mt-1.5">
                  {!a.main && <button onClick={() => set("addresses",del.addresses.map(x=>({...x,main:x.id===a.id})))} style={{ color:tk.P }} className="text-[11px] font-semibold">Principal</button>}
                  <button onClick={() => set("addresses",del.addresses.filter(x=>x.id!==a.id))} style={{ color:tk.ERR_T }} className="text-[11px] font-semibold">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {adding ? (
          <div><CFG_Hr />
            <div style={{ background:tk.ROW }} className="px-3.5 py-3">
              <input placeholder="Etiqueta" value={newA.label} onChange={e=>setNewA(n=>({...n,label:e.target.value}))}
                style={{ background:tk.CARD2, borderColor:tk.CARD_BD, color:tk.T1 }} className="w-full text-[13px] border rounded-lg px-2.5 py-2 mb-2 outline-none" />
              <input placeholder="Dirección completa" value={newA.address} onChange={e=>setNewA(n=>({...n,address:e.target.value}))}
                style={{ background:tk.CARD2, borderColor:tk.CARD_BD, color:tk.T1 }} className="w-full text-[13px] border rounded-lg px-2.5 py-2 outline-none" />
              <div className="flex gap-2 mt-2.5">
                <button onClick={() => setAdding(false)} style={{ borderColor:tk.CARD_BD, color:tk.T2 }} className="flex-1 py-2 text-[13px] border rounded-lg">Cancelar</button>
                <button onClick={addAddr} style={{ background:tk.P }} className="flex-1 py-2 text-[13px] text-white rounded-lg font-semibold">Agregar</button>
              </div>
            </div>
          </div>
        ) : (
          <div><CFG_Hr />
            <button onClick={() => setAdding(true)} style={{ background:tk.ROW, color:tk.P }} className="w-full flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold">
              <Plus size={14} /> Agregar dirección
            </button>
          </div>
        )}
      </CFG_Crd>
      <CFG_Lbl>Instrucciones</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 py-2.5">
          {editInstr ? (
            <div>
              <textarea value={instr} onChange={e=>setInstr(e.target.value)} rows={3}
                style={{ background:tk.CARD2, borderColor:tk.P, color:tk.T1 }}
                className="w-full text-[13px] border-2 rounded-lg px-2.5 py-2 outline-none resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setEditInstr(false)} style={{ borderColor:tk.CARD_BD, color:tk.T2 }} className="flex-1 py-1.5 text-[13px] border rounded-lg">Cancelar</button>
                <button onClick={() => { set("instructions",instr); setEditInstr(false); }} style={{ background:tk.P }} className="flex-1 py-1.5 text-[13px] text-white rounded-lg font-semibold">Guardar</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <p style={{ color:tk.T2 }} className="flex-1 text-[13px] leading-snug">{del.instructions||"Sin instrucciones."}</p>
              <button onClick={() => setEditInstr(true)} style={{ color:tk.T3 }}><Edit2 size={14} /></button>
            </div>
          )}
        </div>
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── AUCTIONS ─────────────────────────────────────────────────── */
function CFG_AuctionsScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const { auctions:au, activity } = settings;
  function set(k, v) { upd("auctions", { ...au, [k]:v }); }
  const history = [
    { id:1, title:"Reloj Seiko Presage SARX057",     date:"5 Jun",  bid:"$1,200", won:true  },
    { id:2, title:"Cámara Fujifilm X100VI",           date:"2 Jun",  bid:"$9,500", won:false },
    { id:3, title:"Guitarra Fender Stratocaster '65", date:"28 May", bid:"$4,300", won:true  },
    { id:4, title:"Sneakers Nike SB Dunk Low",        date:"20 May", bid:"$2,100", won:false },
    { id:5, title:"Consola PS5 Edición Specials",     date:"15 May", bid:"$6,800", won:true  },
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Subastas" onBack={() => nav("home")} />
      <CFG_Lbl>Preferencias</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={AlertCircle} bg="bg-amber-600"  label="Confirmar antes de pujar" sub="Confirmación en cada oferta" on={au.confirmBeforeBid}  change={v=>set("confirmBeforeBid",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Clock}       bg="bg-orange-600" label="Recordatorios de cierre"  sub="15 min antes del cierre"    on={au.closingReminders}  change={v=>set("closingReminders",v)} />
      </CFG_Crd>
      <CFG_Lbl>Resumen</CFG_Lbl>
      <div className="mx-4 grid grid-cols-3 gap-2">
        {[
          { l:"Participadas", v:activity.auctions.participated, c:tk.T1   },
          { l:"Ganadas",      v:activity.auctions.won,          c:tk.OK_T },
          { l:"Perdidas",     v:activity.auctions.lost,         c:tk.T3   },
        ].map(s => (
          <div key={s.l} style={{ background:tk.ROW, borderColor:tk.CARD_BD }} className="rounded-xl p-2.5 text-center border">
            <div style={{ color:s.c }} className="text-xl font-black">{s.v}</div>
            <div style={{ color:tk.T2 }} className="text-[10px] mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
      <CFG_Lbl>Historial</CFG_Lbl>
      <CFG_Crd>
        {history.map((item, i) => (
          <div key={item.id}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <div style={{ background: item.won ? tk.OK_BG : tk.CARD2 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award size={14} style={{ color: item.won ? tk.OK_T : tk.T3 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color:tk.T1 }} className="text-[13px] font-medium truncate">{item.title}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">{item.date} · {item.bid}</div>
              </div>
              <span style={item.won ? { background:tk.OK_BG, color:tk.OK_T } : { background:tk.CARD2, color:tk.T3 }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                {item.won ? "Ganada" : "Perdida"}
              </span>
            </div>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── PAYMENTS ─────────────────────────────────────────────────── */
function CFG_PaymentsScreen({ settings, upd, nav, onOpenWallet, orders = [], flash }) {
  const tk = CFG_useTk();
  const [showInvoices, setShowInvoices] = useState(false);

  const downloadInvoice = (o) => {
    const lines = [
      "RETADOR — Factura",
      "================================",
      `Nº de pedido: ${o.id}`,
      `Fecha: ${new Date(o.createdAt || Date.now()).toLocaleDateString("es-ES")}`,
      `Vendedor: ${o.sellerName || "—"}`,
      `Artículo: ${o.title || "—"}`,
      `Cantidad: ${o.qty || 1}`,
      "--------------------------------",
      `Producto: ${money(o.amount || 0, o.currency || "CUP")}`,
      o.shipPrice ? `Envío (${o.shipTo || "envío"}): ${money(o.shipPrice, o.currency || "CUP")}` : "",
      `TOTAL: ${money((Number(o.amount) || 0) + (Number(o.shipPrice) || 0), o.currency || "CUP")}`,
      "================================",
      "Gracias por usar RETADOR.",
    ].filter(Boolean).join("\n");
    try {
      const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `factura-${o.id}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flash && flash("📄 Factura descargada");
    } catch (e) { flash && flash("No se pudo descargar"); }
  };

  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Pagos" onBack={() => nav("home")} />

      <CFG_Lbl>Tu dinero</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 py-3.5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Wallet size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div style={{ color:tk.T1 }} className="text-[14px] font-bold">Billetera RETADOR</div>
              <div style={{ color:tk.T2 }} className="text-[11px]">Saldo, métodos de pago, recargas y conversión de monedas</div>
            </div>
          </div>
          <button onClick={() => onOpenWallet && onOpenWallet()} style={{ background:"#FFC01E", color:"#000" }} className="w-full h-10 rounded-xl text-[13px] font-bold">Abrir billetera</button>
        </div>
      </CFG_Crd>

      <CFG_Lbl>Métodos de pago</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={CreditCard} bg="bg-violet-600" label="Gestionar métodos de pago" sub="Cuentas bancarias y recargas (en la billetera)" onClick={() => onOpenWallet && onOpenWallet()} />
        <CFG_Hr />
        <div style={{ background:tk.ROW }} className="px-3.5 py-2.5">
          <div style={{ color:tk.T3 }} className="text-[11px]">Próximamente: PayPal, Visa y tarjetas internacionales.</div>
        </div>
      </CFG_Crd>

      <CFG_Lbl>Transacciones</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={FileText} bg="bg-blue-600" label="Ver mis transacciones" sub="Historial completo en la billetera" onClick={() => onOpenWallet && onOpenWallet()} />
      </CFG_Crd>

      <CFG_Lbl>Documentos</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={FileText} bg="bg-zinc-600" label="Ver facturas" sub={`${orders.length} pedido${orders.length === 1 ? "" : "s"}`} onClick={() => setShowInvoices(true)} />
      </CFG_Crd>
      <div className="h-8" />

      {showInvoices && (
        <div onClick={() => setShowInvoices(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:5000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:tk.BG, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"18px 16px 26px", maxHeight:"82vh", overflowY:"auto" }}>
            <div style={{ color:tk.T1 }} className="text-[16px] font-bold mb-1">Facturas</div>
            <div style={{ color:tk.T2 }} className="text-[12px] mb-4">Cada pedido genera su factura descargable.</div>
            {orders.length === 0 ? (
              <div style={{ color:tk.T2 }} className="text-[13px] text-center py-8">Aún no tienes pedidos.</div>
            ) : orders.map(o => (
              <div key={o.id} style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-2">
                <div className="flex-1 min-w-0">
                  <div style={{ color:tk.T1 }} className="text-[13px] font-semibold truncate">{o.title || "Pedido"}</div>
                  <div style={{ color:tk.T2 }} className="text-[11px]">{o.id} · {money((Number(o.amount)||0)+(Number(o.shipPrice)||0), o.currency||"CUP")}</div>
                </div>
                <button onClick={() => downloadInvoice(o)} style={{ background:tk.CARD2, color:tk.T1 }} className="flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
                  <Download size={13} /> Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ACTIVITY ─────────────────────────────────────────────────── */
function CFG_ActivityScreen({ settings, nav }) {
  const tk = CFG_useTk();
  const ac = settings.activity;
  const maxH = Math.max(...ac.history.map(h => h.purchases + h.sales));
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Actividad" onBack={() => nav("home")} />
      <CFG_Lbl>Resumen</CFG_Lbl>
      <div className="mx-4 grid grid-cols-2 gap-2">
        {[
          { label:"Compras",  value:ac.purchases.total, sub:ac.purchases.amount, Icon:ShoppingBag, bg:"bg-violet-600" },
          { label:"Ventas",   value:ac.sales.total,     sub:ac.sales.amount,     Icon:TrendingUp,  bg:"bg-emerald-600" },
          { label:"Pedidos",  value:`${ac.orders.completed}/${ac.orders.made}`, sub:"completados", Icon:Package, bg:"bg-blue-600" },
          { label:"Subastas", value:`${ac.auctions.won}/${ac.auctions.participated}`, sub:"ganadas", Icon:Award, bg:"bg-amber-600" },
        ].map(s => (
          <div key={s.label} style={{ background:tk.ROW, borderColor:tk.CARD_BD }} className="rounded-xl p-3 border">
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.Icon size={14} className="text-white" />
            </div>
            <div style={{ color:tk.T1 }} className="text-[22px] font-black leading-none">{s.value}</div>
            <div style={{ color:tk.T2 }} className="text-[10px] mt-1">{s.label}</div>
            <div style={{ color:tk.P  }} className="text-[10px] font-bold">{s.sub}</div>
          </div>
        ))}
      </div>
      <CFG_Lbl>Historial mensual</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 pt-3 pb-2.5">
          <div className="flex items-end gap-1.5 h-20 mb-2">
            {ac.history.map(m => {
              const total = m.purchases + m.sales;
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end gap-px" style={{ height:`${(total/maxH)*100}%` }}>
                    <div style={{ height:`${(m.purchases/total)*100}%`, background:tk.P  }} className="w-full rounded-t min-h-px" />
                    <div style={{ height:`${(m.sales/total)*100}%`, background:"#22C55E" }} className="w-full rounded-b min-h-px" />
                  </div>
                  <div style={{ color:tk.T3 }} className="text-[9px] mt-1">{m.label}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1"><div style={{ background:tk.P      }} className="w-2 h-2 rounded-sm" /><span style={{ color:tk.T2 }} className="text-[10px]">Compras</span></div>
            <div className="flex items-center gap-1"><div style={{ background:"#22C55E" }} className="w-2 h-2 rounded-sm" /><span style={{ color:tk.T2 }} className="text-[10px]">Ventas</span></div>
          </div>
        </div>
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── LANGUAGE ─────────────────────────────────────────────────── */
function CFG_LanguageScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const { language } = settings;
  const langs = [
    { code:"es", label:"Español",   flag:"🇪🇸", sub:"España"        },
    { code:"en", label:"English",   flag:"🇺🇸", sub:"United States" },
    { code:"pt", label:"Português", flag:"🇧🇷", sub:"Brasil"        },
    { code:"fr", label:"Français",  flag:"🇫🇷", sub:"France"        },
    { code:"de", label:"Deutsch",   flag:"🇩🇪", sub:"Deutschland"   },
    { code:"it", label:"Italiano",  flag:"🇮🇹", sub:"Italia"        },
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Idioma" onBack={() => nav("home")} />
      <CFG_Lbl>Seleccionar idioma</CFG_Lbl>
      <CFG_Crd>
        {langs.map((l, i) => (
          <div key={l.code}>
            {i > 0 && <CFG_Hr />}
            <button onClick={() => upd("language", l.code)} style={{ background:tk.ROW }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:opacity-60">
              <span className="text-xl w-8 text-center flex-shrink-0">{l.flag}</span>
              <div className="flex-1">
                <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{l.label}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">{l.sub}</div>
              </div>
              {language === l.code && (
                <div style={{ background:tk.P }} className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── STORAGE ──────────────────────────────────────────────────── */
function CFG_StorageScreen({ settings, upd, nav, flash }) {
  const tk = CFG_useTk();
  const CATS = {
    conversaciones: ["retador_chatmsgs", "retador_chatpeople", "retador_delconvs", "retador_blocked"],
    contenido: ["retador_products", "retador_orders", "retador_auctions", "retador_reports", "retador_verifs", "retador_promoreq", "retador_planreq", "retador_payments", "retador_cats", "retador_subcats"],
    billetera: ["retador_wallet", "retador_wallet_banks", "retador_wallet_sec", "retador_wallet_tx"],
    ajustes: ["retador_settings", "retador_admincfg", "retador_theme", "retador_txt_scale", "retador_favs", "retador_verified", "retador_userplans", "retador_editor"],
  };
  const measure = () => {
    const out = {};
    Object.entries(CATS).forEach(([cat, keys]) => {
      let b = 0;
      keys.forEach(k => { try { const v = localStorage.getItem(k); if (v) b += (k.length + v.length) * 2; } catch {} });
      out[cat] = b;
    });
    return out;
  };
  const [usage, setUsage] = useState(measure);
  const fmtSize = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`;
  const total = Object.values(usage).reduce((a, b) => a + b, 0);

  const clearCat = (cat) => {
    CATS[cat].forEach(k => { try { localStorage.removeItem(k); } catch {} });
    setUsage(measure());
    flash && flash("🧹 Espacio liberado");
  };

  const META = {
    conversaciones: { label: "Conversaciones", sub: "Mensajes y contactos del chat", color: "#F59E0B", Icon: MessageCircle, clearable: true },
    contenido: { label: "Contenido", sub: "Productos, pedidos y subastas", color: tk.P, Icon: Package, clearable: false },
    billetera: { label: "Billetera", sub: "Saldo, movimientos y cuentas", color: "#22C55E", Icon: Wallet, clearable: false },
    ajustes: { label: "Ajustes y diseño", sub: "Preferencias y configuración", color: "#60A5FA", Icon: HardDrive, clearable: false },
  };

  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Almacenamiento" onBack={() => nav("home")} />
      <CFG_Lbl>Uso real en este dispositivo</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 py-3.5">
          <div className="flex items-baseline gap-1 mb-2.5">
            <span style={{ color:tk.T1 }} className="text-[26px] font-black leading-none">{fmtSize(total).split(" ")[0]}</span>
            <span style={{ color:tk.T2 }} className="text-[12px]">{fmtSize(total).split(" ")[1]}</span>
          </div>
          <div style={{ background:tk.CARD2 }} className="h-2 rounded-full overflow-hidden flex">
            {Object.entries(usage).filter(([, b]) => b > 0).map(([cat, b]) => (
              <div key={cat} style={{ width:`${(b/total)*100}%`, background:META[cat].color }} className="h-full" />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(usage).map(([cat, b]) => (
              <div key={cat} className="flex items-center gap-1">
                <div style={{ background:META[cat].color }} className="w-1.5 h-1.5 rounded-full" />
                <span style={{ color:tk.T2 }} className="text-[10px]">{META[cat].label} {fmtSize(b)}</span>
              </div>
            ))}
          </div>
        </div>
      </CFG_Crd>

      <CFG_Lbl>Gestionar</CFG_Lbl>
      <CFG_Crd>
        {Object.entries(META).map(([cat, m], i) => (
          <div key={cat}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <div style={{ background:m.color+"22" }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <m.Icon size={14} style={{ color:m.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{m.label}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">{fmtSize(usage[cat])} · {m.sub}</div>
              </div>
              {m.clearable
                ? <button onClick={() => clearCat(cat)} style={{ background:tk.ERR_BG, color:tk.ERR_T }} className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0">Limpiar</button>
                : <span style={{ color:tk.T3 }} className="text-[10px] flex-shrink-0">Tus datos</span>}
            </div>
          </div>
        ))}
      </CFG_Crd>

      <div style={{ background:tk.OK_BG, borderColor:tk.OK_T+"44" }} className="mx-4 mt-2.5 rounded-xl px-3.5 py-2.5 border">
        <div className="flex items-start gap-2">
          <Info size={13} style={{ color:tk.OK_T, marginTop:1, flexShrink:0 }} />
          <p style={{ color:tk.OK_T }} className="text-[11px] leading-snug">Las fotos de productos y subastas se ven directamente sin descargarse, así que casi no ocupan espacio. Solo se guarda lo que descargas a propósito.</p>
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}

/* ── HELP ─────────────────────────────────────────────────────── */
function CFG_HelpScreen({ nav, flash }) {
  const tk = CFG_useTk();
  const [open, setOpen] = useState(null);
  const [report, setReport] = useState(false);
  const [rtext, setRtext] = useState("");
  const FAQ = [
    { q: "¿Cómo publico un producto?", a: "Ve a tu perfil o al botón de publicar, sube al menos una foto, pon título, precio y categoría, y listo: queda visible para todos al instante." },
    { q: "¿Cómo funciona el pago?", a: "Pagas desde tu Billetera. El dinero del producto va al vendedor y, si hay envío, esa parte va al mensajero o a la empresa de envíos, todo desglosado antes de confirmar." },
    { q: "¿Cómo verifico mi cuenta?", a: "En Configuración → Cuenta → Solicitar verificación. Subes tu documento por delante y por detrás; al aprobarse, tu cuenta queda verificada." },
    { q: "¿Cómo participo en una subasta?", a: "Entra a Subastas, abre la que te interese y puja. En las subastas VIP se paga una cuota de acceso que el organizador aprueba." },
    { q: "¿Cómo cambio el idioma o el tema?", a: "En Configuración → Apariencia (tema claro/oscuro y tamaño de texto) y en Idioma. Se aplica a toda la app al instante." },
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Ayuda" onBack={() => nav("home")} />
      <CFG_Lbl>Preguntas frecuentes</CFG_Lbl>
      <CFG_Crd>
        {FAQ.map((f, i) => (
          <div key={i}>
            {i > 0 && <CFG_Hr />}
            <button onClick={() => setOpen(open === i ? null : i)} style={{ background:tk.ROW }} className="w-full text-left px-3.5 py-3 active:opacity-70">
              <div className="flex items-center justify-between gap-2">
                <span style={{ color:tk.T1 }} className="text-[13.5px] font-medium">{f.q}</span>
                <ChevronRight size={14} style={{ color:tk.T3, transform: open===i ? "rotate(90deg)" : "none", transition:"transform .2s", flexShrink:0 }} />
              </div>
              {open === i && <p style={{ color:tk.T2 }} className="text-[12px] mt-2 leading-relaxed">{f.a}</p>}
            </button>
          </div>
        ))}
      </CFG_Crd>
      <CFG_Lbl>Soporte</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={MessageCircle} bg="bg-teal-600" label="Contactar soporte" sub="Te respondemos por correo"
          onClick={() => { try { window.location.href = "mailto:soporte@retador.app?subject=Soporte%20RETADOR"; } catch(e){} flash && flash("📧 Abriendo tu correo…"); }} />
        <CFG_Hr />
        <CFG_Row icon={AlertCircle} bg="bg-orange-600" label="Reportar un problema" sub="Cuéntanos qué pasó" onClick={() => setReport(true)} />
      </CFG_Crd>
      <div className="h-8" />

      {report && (
        <div onClick={() => setReport(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:5000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:tk.BG, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"18px 16px 26px" }}>
            <div style={{ color:tk.T1 }} className="text-[16px] font-bold mb-1">Reportar un problema</div>
            <div style={{ color:tk.T2 }} className="text-[12px] mb-3">Describe el problema y lo revisamos.</div>
            <textarea value={rtext} onChange={e=>setRtext(e.target.value)} rows={4} placeholder="¿Qué pasó?"
              style={{ background:tk.CARD2, color:tk.T1, borderColor:"rgba(128,128,128,.25)" }} className="w-full rounded-xl px-3 py-2.5 text-[14px] border outline-none resize-none mb-3" />
            <div className="flex gap-2.5">
              <button onClick={() => setReport(false)} style={{ background:tk.CARD2, color:tk.T1 }} className="flex-1 h-11 rounded-xl text-[13px] font-semibold">Cancelar</button>
              <button onClick={() => { setReport(false); setRtext(""); flash && flash("✅ Reporte enviado. ¡Gracias!"); }} disabled={!rtext.trim()}
                style={{ background: rtext.trim() ? "#FFC01E" : tk.CARD2, color: rtext.trim() ? "#000" : tk.T3 }} className="flex-1 h-11 rounded-xl text-[13px] font-bold">Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ABOUT ────────────────────────────────────────────────────── */
function CFG_AboutScreen({ nav }) {
  const tk = CFG_useTk();
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Acerca de" onBack={() => nav("home")} />
      <div className="flex flex-col items-center py-6">
        <div style={{ background:"linear-gradient(135deg,#b8860b,#FFC01E)" }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5">
          <Gavel size={26} className="text-white" />
        </div>
        <h2 style={{ color:tk.T1 }} className="text-[18px] font-black tracking-tight">RETADOR</h2>
        <div style={{ color:tk.T2 }} className="text-[11px] mt-0.5">Marketplace · Cuba</div>
        <div style={{ background:tk.PL, color:tk.P }} className="mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
          v1.0.0 · Beta
        </div>
      </div>
      <CFG_Lbl>Legal</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 py-3 text-center">
          <p style={{ color:tk.T2 }} className="text-[12px]">Política de privacidad, términos y licencias estarán disponibles próximamente.</p>
        </div>
      </CFG_Crd>
      <CFG_Lbl>Información</CFG_Lbl>
      <CFG_Crd>
        {[["Versión","1.0.0"],["Estado","Beta"],["Plataforma","React / Web"],["© 2026","RETADOR"]].map(([k,v],i) => (
          <div key={k}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-center justify-between px-3.5 py-2.5">
              <span style={{ color:tk.T2 }} className="text-[13px]">{k}</span>
              <span style={{ color:tk.T1 }} className="text-[13px] font-medium">{v}</span>
            </div>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── APP ──────────────────────────────────────────────────────── */
function SettingsScreen({ user, onBack, onSignOut, onUpdate, flash, appTheme="auto", onThemeChange, imgScale=1, onImgScaleChange, appTextScale=1, onTextScaleChange, profileData={}, onProfileUpdate, isVerified=false, onRequestVerification, accountPassword="", onSetPassword, blockedUsers=[], onToggleBlock, onOpenWallet, orders=[] }) {
  const [screen, setScreen]     = useState("home");
  const me0 = profileData?.name || user?.name || "Usuario";
  const [profile, setProfile]   = useState({
    name: me0,
    email: profileData?.email || user?.email || "",
    phone: profileData?.phone || "",
    verified: isVerified,
    initials: me0.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
    memberSince: profileData?.memberSince || "2026",
  });
  // refleja cambios externos de verificación
  useEffect(() => { setProfile(p => ({ ...p, verified: isVerified })); }, [isVerified]);
  const [settings, setSettings] = useState(() => {
    try { const r = localStorage.getItem("retador_settings"); if (r) return { ...CFG_INIT, ...JSON.parse(r) }; } catch {}
    return CFG_INIT;
  });
  useEffect(() => { try { localStorage.setItem("retador_settings", JSON.stringify(settings)); } catch {} }, [settings]);
  function nav(s) { setScreen(s); try { window.scrollTo(0,0); } catch(e){} }
  function upd(key, val) { setSettings(prev => ({ ...prev, [key]:val })); }

  const tk = appTheme==="light" ? CFG_LIGHT
           : appTheme==="dark"  ? CFG_DARK
           : (typeof window!=="undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? CFG_DARK : CFG_LIGHT);

  const saveProfile = (updater) => setProfile(prev => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    onProfileUpdate && onProfileUpdate(pd => ({ ...(pd || {}), name: next.name, email: next.email, phone: next.phone, initials: next.initials }));
    return next;
  });

  const p = { profile, setProfile: saveProfile, settings, upd, nav, appScale:imgScale, onScale:onImgScaleChange, onBack, onSignOut, onThemeChange, appTheme, appTextScale, onTextScaleChange, flash, isVerified, onRequestVerification, accountPassword, onSetPassword, blockedUsers, onToggleBlock, onOpenWallet, orders };
  const map = {
    home:          <CFG_HomeScreen          {...p} />,
    account:       <CFG_AccountScreen       {...p} />,
    appearance:    <CFG_AppearanceScreen    {...p} />,
    notifications: <CFG_NotificationsScreen {...p} />,
    privacy:       <CFG_PrivacyScreen       {...p} />,
    chat:          <CFG_ChatScreen          {...p} />,
    deliveries:    <CFG_DeliveriesScreen    {...p} />,
    auctions:      <CFG_AuctionsScreen      {...p} />,
    payments:      <CFG_PaymentsScreen      {...p} />,
    activity:      <CFG_ActivityScreen      {...p} />,
    language:      <CFG_LanguageScreen      {...p} />,
    storage:       <CFG_StorageScreen       {...p} />,
    help:          <CFG_HelpScreen          {...p} />,
    about:         <CFG_AboutScreen         {...p} />,
  };
  return (
    <CFG_ThemeCtx.Provider value={tk}>
      <div style={{
        fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
        position:"fixed", inset:0, zIndex:300, overflowY:"auto", background:tk.BG,
      }}>
        {map[screen] ?? map.home}
      </div>
    </CFG_ThemeCtx.Provider>
  );
}

// ══ SUBASTAS SECTION ══════════════════════════════════════════════════════════
// ─── CONFIG ───────────────────────────────────────────────────────────────────

function BottomNav({ tab, onTab, unread, hidden }) {
  const { BG, B, isDark } = useAt();
  const items = [
    { id: "market",  ic: "store",  label: "Tienda" },
    { id: "search",  ic: "search", label: "Buscar" },
    { id: "envios",   ic: "truck",  label: "Envíos" },
    { id: "subastas", ic: "award",  label: "Subastas" },
    { id: "perfil",   ic: "user",   label: "Perfil" },
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 60, background: isDark ? "rgba(6,6,6,.97)" : "rgba(255,255,255,.97)", backdropFilter: "blur(22px)", borderTop: `1px solid ${B}`, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "8px 4px 20px", transform: hidden ? "translateY(115%)" : "translateY(0)", transition: "transform .28s cubic-bezier(.4,0,.2,1)", willChange: "transform" }}>
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


// ═══════ BILLETERA (OmegaPay) — integrada como módulo aislado ═══════
/* ====== HERRAMIENTAS DE PRODUCTO (Importador Inteligente) — módulo aislado ====== */


