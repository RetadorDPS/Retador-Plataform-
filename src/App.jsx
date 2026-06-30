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
import { LocalDelivery, IntlShipping } from "./screens/Delivery.jsx";
import { CourierFlow } from "./screens/Courier.jsx";
import OmniPanel from "./screens/AdminPanel.jsx";
import { SubastasScreen } from "./screens/Auctions.jsx";
import { SettingsScreen } from "./screens/Settings.jsx";
import { ProfileMain, FreeProfileScreen } from "./screens/Profile.jsx";
import { MessagesScreen, ChatScreen } from "./screens/Messages.jsx";
import { OrderDetailScreen, OrdersScreen } from "./screens/Orders.jsx";


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


