// ═════════════════════════════════════════════════════════════════════════════
// Texto sugerido para "Crear publicación" (Marketing y publicidad).
//
// Función pura: sin red, sin Supabase y sin dependencias. Solo usa datos REALES
// del producto (title, price, currency, description, id) y nunca inventa nada:
// si un dato falta o no es válido, su línea no aparece. El vendedor puede
// editar el resultado antes de publicar.
//
//   const texto = textoPublicacion(producto);
//
// Formato (cada bloque solo si hay datos):
//   {title}
//   💰 {precio}
//
//   {resumen de la descripción}
//
//   👉 Pídelo en RETADOR: {enlace}
// ═════════════════════════════════════════════════════════════════════════════

// Límite de fb-publish para el texto de una publicación.
export const LIMITE_TEXTO = 5000;
const MAX_TITULO = 250;
const MAX_RESUMEN = 280;

// Copia EXACTA de money() y CURRENCIES de src/shared/backend.js. No se importa
// backend.js porque arrastra el cliente de Supabase (que al cargarse ya hace una
// consulta) y este módulo debe ser puro y liviano. Las pruebas comparan esta
// copia con la original. Diferencia a propósito: aquí una moneda desconocida o
// ausente NO se convierte en USD; la línea de precio simplemente no aparece.
const MONEDAS = {
  USD: { code: "USD", symbol: "$" },
  EUR: { code: "EUR", symbol: "€" },
  CUP: { code: "CUP", symbol: "$" },
};
function formatoPrecio(importe, moneda) {
  const c = MONEDAS[moneda];
  const s = Number(importe).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${c.symbol}${s} ${c.code}`;
}

// Mismo formato que shareLink("product", id) de src/shared/backend.js y que
// enlaceProducto() de fb-publish.
const BASE_ENLACE = "https://retadormarketplace.es/share/producto/";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function enlacePublicoProducto(id) {
  const s = typeof id === "string" ? id.trim() : "";
  return UUID.test(s) ? `${BASE_ENLACE}${encodeURIComponent(s)}.html` : null;
}

// Texto plano seguro: sin etiquetas HTML, sin entidades, sin caracteres de
// control ni < >, y con los espacios (incluidos los saltos de línea) reducidos a
// uno. Así la descripción nunca puede añadir líneas ni cambiar la estructura.
const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function textoPlano(valor) {
  if (typeof valor !== "string") return "";
  return valor
    .replace(/<\s*(script|style)\b[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, " ")
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (todo, e) => {
      if (e[0] === "#") {
        const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) && n > 31 && n < 0x110000 ? String.fromCodePoint(n) : " ";
      }
      return ENTIDADES[e.toLowerCase()] ?? " ";
    })
    .replace(/<[^>]*>/g, " ")          // etiquetas que venían escritas como entidades
    .replace(/[<>]/g, " ")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\u2028\u2029\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Recorta sin inventar palabras: primero intenta acabar en un final de frase;
// si no hay uno razonable, corta en el último espacio y pone "…".
function recortar(texto, max, { frase = false } = {}) {
  if (texto.length <= max) return texto;
  const trozo = texto.slice(0, max);
  if (frase) {
    let fin = -1;
    for (const m of trozo.matchAll(/[.!?…](?=\s|$)/g)) fin = m.index;
    if (fin >= Math.floor(max * 0.4)) return trozo.slice(0, fin + 1).trim();
  }
  const espacio = trozo.slice(0, max - 1).lastIndexOf(" ");
  const base = espacio >= Math.floor(max * 0.4) ? trozo.slice(0, espacio) : trozo.slice(0, max - 1);
  return base.replace(/[\s,;:.\-–—]+$/, "") + "…";
}

export function textoPublicacion(producto, opciones = {}) {
  const p = producto && typeof producto === "object" ? producto : {};
  const maxResumen = Number.isInteger(opciones.maxResumen) && opciones.maxResumen > 0 ? opciones.maxResumen : MAX_RESUMEN;

  const titulo = recortar(textoPlano(p.title), MAX_TITULO);

  // Precio: solo si es un número real mayor que 0 y la moneda es de RETADOR.
  const importe = typeof p.price === "number" ? p.price
    : typeof p.price === "string" && p.price.trim() !== "" ? Number(p.price.trim()) : NaN;
  const moneda = typeof p.currency === "string" ? p.currency.trim().toUpperCase() : "";
  const precio = Number.isFinite(importe) && importe > 0 && MONEDAS[moneda] ? `💰 ${formatoPrecio(importe, moneda)}` : "";

  const enlace = enlacePublicoProducto(p.id);
  const cierre = enlace ? `👉 Pídelo en RETADOR: ${enlace}` : "";

  let resumen = recortar(textoPlano(p.description), maxResumen, { frase: true });

  const unir = () => [[titulo, precio].filter(Boolean).join("\n"), resumen, cierre].filter(Boolean).join("\n\n");
  let texto = unir();

  // Límite de 5000: se recorta primero la descripción y nunca el enlace.
  if (texto.length > LIMITE_TEXTO && resumen) {
    const sobra = texto.length - LIMITE_TEXTO;
    resumen = resumen.length - sobra > 20 ? recortar(resumen, resumen.length - sobra, { frase: true }) : "";
    texto = unir();
  }
  if (texto.length > LIMITE_TEXTO) {
    // Solo sería posible con límites anormales: se conserva el cierre entero.
    const resto = cierre ? LIMITE_TEXTO - cierre.length - 2 : LIMITE_TEXTO;
    const cuerpo = [[titulo, precio].filter(Boolean).join("\n"), resumen].filter(Boolean).join("\n\n");
    texto = [recortar(cuerpo, Math.max(resto, 1)), cierre].filter(Boolean).join("\n\n");
  }
  return texto;
}

export default textoPublicacion;
