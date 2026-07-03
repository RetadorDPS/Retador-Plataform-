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
  signInWithGoogle, signOutUser, loadSessionUser,
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
import { CatModal, NotifPanel, BuyModal, AdvancedSearch, ChatsModal, MarketHome, EditProductModal, ProductDetail, PubSheet, EnviosMenu, BottomNav } from "./screens/Marketplace.jsx";
import OmniPanel from "./screens/AdminPanel.jsx";
import { SubastasScreen } from "./screens/Auctions.jsx";
import { SettingsScreen } from "./screens/Settings.jsx";
import { ProfileMain, FreeProfileScreen } from "./screens/Profile.jsx";
import { MessagesScreen, ChatScreen } from "./screens/Messages.jsx";
import { OrderDetailScreen, OrdersScreen } from "./screens/Orders.jsx";
import { RetadorInicio, PantallaCargando } from "./screens/Inicio.jsx";
import InstallPrompt from "./pwa/InstallPrompt.jsx";
import { setThemeColor } from "./pwa/themeColor.js";

// Color de fondo (y de las barras del sistema) que corresponde a un tema dado.
// "auto" sigue el modo claro/oscuro del teléfono.
function bgForTheme(t) {
  const eff = t === "auto"
    ? (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : t;
  return eff === "light" ? LIGHT_T.BG : DARK_T.BG;
}


// OMNIPANEL — panel admin integrado (CSS aislado bajo .omni)

// ═════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  // Control de sesión: undefined = comprobando, null = sin sesión, objeto = logueado.
  const [sessionUser, setSessionUser] = useState(undefined);

  useEffect(() => {
    let alive = true;
    loadSessionUser().then(u => { if (alive) setSessionUser(u); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { setSessionUser(null); return; }
      loadSessionUser().then(u => { if (alive) setSessionUser(u); });
    });
    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // Pantalla de inicio y de carga son SIEMPRE oscuras: cuando no hay sesión, las
  // barras del sistema van del mismo tono (#080808). Al entrar, AppShell toma el
  // control y las sincroniza con el tema elegido (claro/oscuro).
  useEffect(() => { if (!sessionUser) setThemeColor("#080808"); }, [sessionUser]);

  return (
    <>
      {sessionUser === undefined
        ? <PantallaCargando />
        : (
          <DensityProvider defaultMode="pequena">
            <CatalogProvider>
              {sessionUser
                ? <AppShell sessionUser={sessionUser} />
                : <RetadorInicio onGoogle={signInWithGoogle} />}
            </CatalogProvider>
          </DensityProvider>
        )}
      {/* Cartel de instalación PWA propio — montado siempre, decide solo si se muestra */}
      <InstallPrompt />
    </>
  );
}

function AppShell({ sessionUser }) {
  useCSS();
  const rsp = useResponsive();

  // Estado inicial configurado directamente - sin login, solo visual
  const [scr,       setScr]       = useState("main");
  const [tab,       setTab]       = useState("market");
  const [user,      setUser]      = useState(sessionUser); // usuario REAL logueado (Supabase)
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
  const [profileData, setProfileData] = useState({
    avatar: { type:"emoji", value:"😊" },
    name: sessionUser?.name || "Usuario",
    username: (sessionUser?.email ? sessionUser.email.split("@")[0] : (sessionUser?.name || "usuario")).toLowerCase().replace(/[^a-z0-9._]/g, ""),
    email: sessionUser?.email || "",
    rating: 0,
    sales: 0,
  });

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
    // Pinta la barra del sistema del color del NUEVO tema en el MISMO instante
    // (síncrono), antes de que React repinte. Así barra y fondo cambian juntos en
    // el mismo frame y no queda la raya/filito bajo la barra de estado.
    setThemeColor(bgForTheme(t));
    setAppTheme(t);
    try { localStorage.setItem("retador_theme", t); } catch {}
  };

  // Pintado inicial: al montar (y si el sistema cambia de modo estando en "auto"),
  // deja la barra del color del tema efectivo. Es un único ajuste, no un cambio en
  // caliente, así que no genera ninguna raya.
  useEffect(() => {
    setThemeColor(appTk.BG);
    if (appTheme !== "auto" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSys = () => setThemeColor(bgForTheme("auto"));
    mq.addEventListener?.("change", onSys);
    return () => mq.removeEventListener?.("change", onSys);
  }, [appTheme]);

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
    <div style={{ fontFamily: "'Barlow',sans-serif", background: appTk.BG, color: appTk.T1, height: `calc(100dvh / ${densZoom})`, width: `calc(100vw / ${densZoom})`, overflow: "hidden", position: "relative", display: "flex", flexDirection: rsp.isDesktop ? "row" : "column", paddingTop: "calc(env(safe-area-inset-top, 0px) / var(--img-s, 1))" }}>

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

