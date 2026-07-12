import { supabase } from "./supabase.js";

// ═════════════════════════════════════════════════════════════════════════════
// MOCK BACKEND FUNCTIONS - Datos de demostración
// ═════════════════════════════════════════════════════════════════════════════
export const MOCK_PRODUCTS = [
  { id: 1, title: "iPhone 14 Pro Max", price: 8999, orig_price: 10500, cat: "electronica", badge: "OFERTA", description: "256GB, estado impecable", seller_id: "seller1", seller_name: "TechStore MX", image: "https://images.unsplash.com/photo-1678652197831-a2ab987b9e4e?w=400" },
  { id: 2, title: "MacBook Air M2", price: 15999, cat: "electronica", badge: "NUEVO", description: "13 pulgadas, 8GB RAM, 256GB SSD", seller_id: "seller2", seller_name: "Apple Premium", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400" },
  { id: 3, title: "AirPods Pro", price: 3499, orig_price: 4299, cat: "electronica", badge: "OFERTA", description: "Cancelación de ruido activa", seller_id: "seller1", seller_name: "TechStore MX", image: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400" },
  { id: 4, title: "Vestido elegante", price: 899, cat: "moda", badge: "RECOMENDADO", description: "Talla M, color negro", seller_id: "seller3", seller_name: "Moda Fina", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400" },
  { id: 5, title: "Zapatillas Nike", price: 1299, cat: "deportes", description: "Talla 9 US, nuevas", seller_id: "seller4", seller_name: "Sports Pro", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
  { id: 6, title: "Cafetera espresso", price: 2499, cat: "hogar", badge: "NUEVO", description: "Automática, 15 bares", seller_id: "seller2", seller_name: "Casa & Hogar", image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400" },
];

export const MOCK_USER = { id: "user123", email: "demo@retador.mx", name: "Usuario Demo" };

// Auth functions
export const authSignUp = async (email, password, name) => ({ user: { ...MOCK_USER, email, name } });
export const authSignIn = async (email, password) => ({ user: MOCK_USER });
export const authSignOut = async () => {};
export const authGetSession = async () => ({ user: MOCK_USER });

// User functions — leen la tabla `profiles` del backend (nombre/avatar reales).
// Con caché en memoria para no repetir consultas por el mismo usuario.
const _profileCache = new Map();
export const getUserById = async (id) => {
  if (!id) return null;
  if (_profileCache.has(id)) return _profileCache.get(id);
  try {
    const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", id).single();
    if (error || !data) { _profileCache.set(id, null); return null; }
    const p = { id: data.id, name: data.full_name || "Usuario", avatar: data.avatar_url || null };
    _profileCache.set(id, p);
    return p;
  } catch (e) { return null; }
};
export const getUserName = async (id) => {
  const p = await getUserById(id);
  return p?.name || "Vendedor";
};
export const updateUserName = async (id, name) => {
  try { await supabase.from("profiles").update({ full_name: name }).eq("id", id); _profileCache.delete(id); } catch (e) {}
  return { id, name };
};

// Product functions
// ── Productos REALES del backend ─────────────────────────────────────────────
// Mapea las columnas del backend al formato que espera la app.
// La foto vive en `images` (lista); la tarjeta usa una sola → image = images[0].
export const mapProduct = (p) => ({
  ...p,
  image: Array.isArray(p.images) ? (p.images[0] || null) : (p.images || null),
  shipModes: p.ship_modes || { local: true },
  shippingPrice: p.ship_price ?? 0,
  // Dirección/teléfono de recogida que escribió el vendedor al publicar.
  pickupAddress: p.pickup_address || "",
  pickupPhone: p.pickup_phone || "",
});
// Un solo producto por id (para leer la dirección de recogida en el detalle del
// mensajero cuando el producto no está cargado en memoria).
export const getProductById = async (id) => {
  if (!id) return null;
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error || !data) return null;
  return mapProduct(data);
};
// Listado público del marketplace (sin login): solo activos y aprobados.
export const loadProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false });
  if (error) { console.error("loadProducts:", error.message); return []; }
  return (data || []).map(mapProduct);
};
export const getFeed = async (ctx) => loadProducts();
export const saveProduct = async (data, userId) => ({ ...data, id: Date.now(), seller_id: userId, seller_name: MOCK_USER.name });
export const deleteProduct = async (id) => {};
export const getProductsBySeller = async (id) => {
  const { data, error } = await supabase.from("products").select("*").eq("seller_id", id).neq("status", "deleted").order("created_at", { ascending: false });
  if (error) { console.error("getProductsBySeller:", error.message); return []; }
  return (data || []).map(mapProduct);
};
// ── Subida REAL de imágenes de producto ──────────────────────────────────────
// 1) Comprime la foto en el teléfono (máx. 1280px, JPEG) para que pese poco.
// 2) La sube al almacenamiento de Supabase (bucket público "product-images") y
//    devuelve su URL pública — visible para todos y permanente.
// 3) Si el bucket no existe o falla la subida, devuelve la foto comprimida en
//    formato incrustado (data URL): se guarda dentro del producto y también se
//    ve en todos lados. (Antes se usaba URL.createObjectURL, una dirección
//    temporal que moría al recargar — por eso las fotos "desaparecían".)
const compressImage = (file, maxSide = 1280, quality = 0.82) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
  reader.onload = () => {
    const img = new window.Image();
    img.onerror = () => reject(new Error("Imagen no válida"));
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo comprimir")), "image/jpeg", quality);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
export const uploadImage = async (file, userId) => {
  // Comprime en el teléfono y sube al bucket público "product-images".
  // Devuelve el enlace público PERSISTENTE que se guarda en products.images.
  // Si falla, lanza el error para que se vea un mensaje claro al publicar.
  const blob = await compressImage(file);
  const path = `${userId || "anon"}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from("product-images").upload(path, blob, {
    cacheControl: "3600", upsert: false, contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
};
// Sube la FOTO DE PERFIL al bucket público "avatars" y devuelve su URL pública
// persistente (se guarda en profiles.avatar_url). Comprime en el teléfono.
export const uploadAvatar = async (file, userId) => {
  const blob = await compressImage(file, 512, 0.85);
  const path = `${userId || "anon"}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, {
    cacheControl: "3600", upsert: true, contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
};

// ── CHAT REAL (conversations / messages, con realtime) ───────────────────────
// La columna del texto en `messages` es "text" (NO "content").
// Obtiene (o crea) la conversación con la otra persona y devuelve su id.
const _getOrCreateConversation = async (otherId) => {
  const { data, error } = await supabase.rpc("get_or_create_conversation", { p_other: otherId });
  if (error) throw error;
  return typeof data === "string" ? data : (data?.id || data);
};
// Envía un mensaje: asegura la conversación y lo inserta. Devuelve conversation_id.
export const sendMessage = async (senderId, otherId, text) => {
  if (!senderId || !otherId || !text || !text.trim()) throw new Error("Faltan datos del mensaje");
  const cid = await _getOrCreateConversation(otherId);
  const { error } = await supabase.from("messages").insert({ conversation_id: cid, sender_id: senderId, text: text.trim() });
  if (error) throw error;
  return cid;
};
// Carga los mensajes NO borrados de una conversación, en orden.
export const loadMessages = async (convId) => {
  if (!convId) return [];
  const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", convId).is("deleted_at", null).order("created_at", { ascending: true });
  if (error) { console.error("loadMessages:", error.message); return []; }
  return data || [];
};
// Marca la conversación como leída (read_at) vía la función del backend.
export const markRead = async (convId, userId) => {
  if (!convId) return;
  try { await supabase.rpc("mark_conversation_read", { p_conversation_id: convId }); } catch (e) {}
};
// Total de mensajes SIN LEER — usa la RPC OFICIAL del backend (misma fuente de
// verdad para toda la app). Alimenta el botón "Mensajes" y la barra inferior.
export const getUnreadCount = async (userId) => {
  if (!userId) return 0;
  const { data, error } = await supabase.rpc("get_unread_total");
  if (error) { console.error("get_unread_total:", error.message); return 0; }
  return Number(data) || 0;
};
// No leídos POR conversación (RPC oficial). Devuelve { [conversation_id]: n }.
// Tolerante con el nombre exacto de las columnas que devuelva la función.
export const getUnreadByConversation = async () => {
  const { data, error } = await supabase.rpc("get_unread_by_conversation");
  if (error) { console.error("get_unread_by_conversation:", error.message); return {}; }
  const map = {};
  (data || []).forEach(r => {
    if (!r || typeof r !== "object") return;
    const id = r.conversation_id ?? r.conv_id ?? r.id;
    const n = Number(r.unread ?? r.unread_count ?? r.count ?? r.total ?? 0) || 0;
    if (id) map[id] = n;
  });
  return map;
};
// Lista mis conversaciones con el nombre y foto reales de la otra persona, último
// mensaje y no leídos. El RLS ya limita conversations a las MÍAS, así que buscamos
// en la fila el id (uuid) que no es el mío para saber quién es la otra persona.
export const getMyConversations = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase.from("conversations").select("*");
  if (error) { console.error("getMyConversations:", error.message); return []; }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const mine = (data || []).filter(c => Object.values(c).some(v => v === userId));
  // No leídos de TODAS las conversaciones en UNA llamada (RPC oficial).
  const unreadMap = await getUnreadByConversation().catch(() => ({}));
  const convs = await Promise.all(mine.map(async (c) => {
    const otherId = Object.entries(c).find(([k, v]) => typeof v === "string" && v !== userId && v !== c.id && uuid.test(v))?.[1] || null;
    const prof = otherId ? await getUserById(otherId).catch(() => null) : null;
    const { data: last } = await supabase.from("messages").select("text, created_at").eq("conversation_id", c.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1);
    const lm = last && last[0];
    const name = prof?.name || "Usuario";
    return { id: c.id, key: String(otherId || c.id), otherId, name, otherName: name, otherAvatar: prof?.avatar || null, lastMsg: lm?.text || "", lastTime: lm?.created_at || c.created_at || null, unread: unreadMap[c.id] || 0 };
  }));
  return convs.sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));
};


// Favorite functions
export const addFavorite = async (userId, productId) => {};
export const removeFavorite = async (userId, productId) => {};
export const getFavorites = async (userId) => [];

// Financial functions
export const getLedgerEntries = async (userId) => [];
export const createEscrow = async (orderId, amount) => {};
export const releaseEscrow = async (escrowId) => {};
export const getSystemStatus = async () => ({ healthy: true });

// ── Monedas soportadas por la plataforma: solo USD, EUR y CUP ──
export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", name: "Dólar estadounidense" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  CUP: { code: "CUP", symbol: "$", name: "Peso cubano" },
};
export const CURRENCY_CODES = ["USD", "EUR", "CUP"];
export const DEFAULT_CURRENCY = "USD";
// Formatea un importe con su moneda, p. ej. "$1,299 USD" · "€899 EUR" · "$1,200 CUP"
export function money(amount, cur = DEFAULT_CURRENCY) {
  const c = CURRENCIES[cur] || CURRENCIES[DEFAULT_CURRENCY];
  const n = Number(amount || 0);
  const s = n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${c.symbol}${s} ${c.code}`;
}

// Order functions
export const createOrder = async (data) => {
  const row = {
    buyer_id:   data.buyerId,
    seller_id:  data.sellerId,
    product_id: data.productId || null,
    title:      data.title || null,
    image:      data.image || null,
    cat:        data.cat || null,
    qty:        data.qty || 1,
    unit_price: Number(data.unitPrice) || 0,
    amount:     Number(data.amount) || 0,
    currency:   data.currency || "USD",
    ship_mode:  data.shipMode,
    modalidad:  data.modalidad || null,
    ship_price: Number(data.shipPrice) || 0,
    ship_to:    data.shipTo || null,
    delivery:   data.delivery || null,
    payment_method: "coordinado",
  };
  const { data: created, error } = await supabase.from("orders").insert(row).select().single();
  if (error) throw error;
  return { ...data, id: created.id, status: created.status || "creada", createdAt: Date.now() };
};
// Cálculo del domicilio local. km = null mientras no haya mapa/backend → usa tarifa base (estimado plano).
// Cuando entre el backend, se pasa la distancia real y NO hay que tocar la interfaz.
export const estimateDeliveryFee = (cfg, km) => {
  const base = (cfg && cfg.localBase) ?? 150;
  const perKm = (cfg && cfg.localPerKm) ?? 25;
  const minKm = (cfg && cfg.deliveryMinKm) ?? 1;
  const extra = (km == null) ? 0 : Math.max(0, km - minKm) * perKm;
  return Math.round(base + extra);
};
// ── Reseñas: lectura y agregación desde retador_ratings ──
// Cada entrada (por pedido) guarda { sys, courier, seller, msg, courierName, sellerName, at }.
export const readRatings = () => { try { return Object.values(JSON.parse(localStorage.getItem("retador_ratings") || "{}")); } catch (e) { return []; } };
export const aggRating = (scores) => { const v = scores.filter(s => s > 0); if (!v.length) return { avg: 0, count: 0 }; return { avg: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10, count: v.length }; };
export const systemRating = () => aggRating(readRatings().map(r => r.sys));
export const serviceRating = (field) => aggRating(readRatings().map(r => r[field]));
export const serviceReviews = (field) => readRatings().filter(r => r[field + "Msg"] && r[field] > 0).map(r => ({ stars: r[field], msg: r[field + "Msg"], at: r.at })).sort((a, b) => b.at - a.at);
export const ratingForName = (name, kind) => { if (!name) return { avg: 0, count: 0, reviews: [] }; const all = readRatings(); const key = kind === "courier" ? "courierName" : "sellerName"; const sc = kind === "courier" ? "courier" : "seller"; const mk = kind === "courier" ? "courierMsg" : "sellerMsg"; const mine = all.filter(r => r[key] === name && r[sc] > 0); return { ...aggRating(mine.map(r => r[sc])), reviews: mine.filter(r => r[mk]).map(r => ({ stars: r[sc], msg: r[mk], at: r.at })) }; };
export const systemReviews = () => readRatings().filter(r => r.sysMsg && r.sys > 0).map(r => ({ stars: r.sys, msg: r.sysMsg, at: r.at })).sort((a, b) => b.at - a.at);
// Trae los pedidos donde el usuario es COMPRADOR o VENDEDOR (el RLS del backend
// ya limita a lo suyo). Etiqueta cada uno con role "compra"/"venta" y lo mapea a
// la MISMA forma que usan OrdersScreen y OrderDetailScreen (flujo por ship_mode,
// stepIdx según el estado, alias camelCase), para no romper el detalle.
export const getUserOrders = async (userId) => {
  if (!userId) return [];
  // Trae lo del usuario como COMPRADOR, VENDEDOR o MENSAJERO asignado (nunca ajeno).
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId},courier_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) { console.error("getUserOrders:", error.message); return []; }
  return (data || []).map(o => {
    const shipMode = o.ship_mode || "local";
    const flow = ORDER_FLOW[shipMode] || ORDER_FLOW.local;
    let stepIdx = flow.findIndex(s => s.key === o.status);
    if (stepIdx < 0) stepIdx = 0;
    const createdAt = o.created_at ? new Date(o.created_at).getTime() : Date.now();
    const role = o.buyer_id === userId ? "compra" : (o.seller_id === userId ? "venta" : "entrega");
    return {
      ...o,
      role,
      buyerId: o.buyer_id, sellerId: o.seller_id, courierId: o.courier_id, productId: o.product_id,
      unitPrice: o.unit_price, shipMode, shipType: shipMode, shipPrice: o.ship_price ?? 0, shipTo: o.ship_to,
      flow, stepIdx,
      status: o.status || (flow[0] && flow[0].key),
      buyerConfirmed: o.buyer_confirmed, sellerPaid: o.seller_paid,
      sellerConfirmed: o.status !== "creada",
      courierStage: o.courier_stage, commissionPct: o.commission_pct,
      history: [{ key: flow[0].key, label: flow[0].label, at: createdAt, note: "Pedido creado." }],
      createdAt,
      updatedAt: o.updated_at ? new Date(o.updated_at).getTime() : createdAt,
    };
  });
};
// Pool PÚBLICO de entregas disponibles para el mensajero (el backend decide qué
// exponer: categoría, tarifa, ids de comprador/vendedor — NUNCA monto ni ganancia).
export const getAvailableDeliveries = async () => {
  try {
    const { data, error } = await supabase.rpc("get_available_deliveries");
    if (error) { console.error("get_available_deliveries:", error.message); return []; }
    return data || [];
  } catch (e) { console.error("get_available_deliveries:", e?.message || e); return []; }
};
export const updateOrderStatus = async (orderId, status) => {
  try { await supabase.from("orders").update({ status }).eq("id", orderId); } catch (e) { console.error("updateOrderStatus:", e?.message || e); }
};

// Plantillas de estados del pedido según la forma de entrega elegida.
// Cada pedido recorre uno de estos flujos; el envío "cuelga" del pedido y hereda sus datos.
export const ORDER_FLOW = {
  local: [
    { key: "creada",     label: "Pedido creado",             actor: "comprador" },
    { key: "confirmado", label: "Confirmado por el vendedor", actor: "vendedor" },
    { key: "asignado",   label: "Mensajero asignado",         actor: "sistema" },
    { key: "recogido",   label: "Artículo recogido",          actor: "mensajero" },
    { key: "en_ruta",    label: "En ruta hacia el comprador", actor: "mensajero" },
    { key: "entregado",  label: "Entregado",                  actor: "mensajero" },
  ],
  intl: [
    { key: "creada",     label: "Solicitud creada",            actor: "comprador" },
    { key: "recibido",   label: "Recibido por transportista",  actor: "operador" },
    { key: "preparando", label: "Preparando envío",            actor: "sistema" },
    { key: "enviado",    label: "Paquete enviado",             actor: "sistema" },
    { key: "en_aduana",  label: "En aduana",                   actor: "sistema" },
    { key: "en_reparto", label: "En reparto",                  actor: "mensajero" },
    { key: "entregado",  label: "Entregado",                   actor: "mensajero" },
  ],
  persona: [
    { key: "creada",     label: "Pedido creado",               actor: "comprador" },
    { key: "confirmado", label: "Confirmado por el vendedor",   actor: "vendedor" },
    { key: "coordinado", label: "Encuentro coordinado",        actor: "ambos" },
    { key: "entregado",  label: "Entregado en persona",        actor: "vendedor" },
  ],
};
export const SHIP_LABELS = {
  local:   { icon: "🛵", label: "Delivery local" },
  intl:    { icon: "✈️", label: "Envío internacional" },
  persona: { icon: "🤝", label: "Entrega en persona" },
};
export const MODALIDAD_LABELS = {
  local:     { label: "Local",       desc: "Pago coordinado por fuera" },
  conectado: { label: "Conectado",   desc: "Pago por la plataforma · solo enlace" },
  cargo:     { label: "Garantizado", desc: "Pago por la plataforma · envío garantizado" },
};

// Chat vigilado (solo pedidos locales): oculta teléfonos, correos y enlaces para que
// el trato no se escape de la plataforma. Devuelve el texto saneado y si bloqueó algo.
export const CONTACT_PATTERNS = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/g,                                                                       // correos
  /\b(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|net|org|io|me|app|co|cu|es|info|gg|link|tv|online|store|xyz)\b[^\s]*/gi, // enlaces
  /(?:\+?\d[\d\s().\-]{6,}\d)/g,                                                                      // teléfonos (8+ caracteres)
];
export function maskContacts(text) {
  let clean = text, blocked = false;
  CONTACT_PATTERNS.forEach(re => { clean = clean.replace(re, () => { blocked = true; return "•••"; }); });
  return { clean, blocked };
}

export const CUBA_PROVINCES = ["Pinar del Río", "Artemisa", "La Habana", "Mayabeque", "Matanzas", "Cienfuegos", "Villa Clara", "Sancti Spíritus", "Ciego de Ávila", "Camagüey", "Las Tunas", "Holguín", "Granma", "Santiago de Cuba", "Guantánamo", "Isla de la Juventud"];

// Trust functions
export const getUserTrustStats = async (userId) => ({ score: 85, reviews: 12 });

// Event functions
export const trackEvent = async (userId, event, data) => {};

// Block functions
export const blockUser = async (userId, blockedId) => {};
export const isBlocked = async (userId, otherId) => false;

// Helper functions
// Devuelve el cliente de Supabase (lo usa el chat para el realtime por canal).
export const getSB = async () => supabase;
export const convKey = (id1, id2) => [id1, id2].sort().join("_");
