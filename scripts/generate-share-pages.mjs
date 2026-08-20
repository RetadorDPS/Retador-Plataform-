// ─────────────────────────────────────────────────────────────────────────────
// Genera las páginas ESTÁTICAS de vista previa para compartir (Open Graph):
// public/share/producto/<id>.html y public/share/perfil/<id>.html
//
// POR QUÉ EXISTE ESTE SCRIPT (root cause real, confirmado con una petición
// HTTP real vía pg_net contra la Edge Function share-preview): Supabase
// reescribe CUALQUIER respuesta con Content-Type text/html a text/plain —
// tanto en Edge Functions como en Storage (verificado: el archivo subido a
// Storage con mimetype:text/html en sus METADATOS igual llega al navegador
// como text/plain real). No hay forma de servir HTML renderizable desde
// *.supabase.co para este caso. GitHub Pages (donde ya vive toda la app) SÍ
// sirve .html con su Content-Type real, sin restricciones — así que las
// páginas de vista previa se generan aquí, en el build de la propia app, y
// se sirven directo desde el mismo dominio.
//
// Se ejecuta automáticamente antes de "vite build" (ver "prebuild" en
// package.json) usando la red REAL de GitHub Actions — nunca falla el build
// si Supabase no responde (try/catch total, sale con éxito igual).
// Los archivos generados NO se versionan (ver .gitignore): se regeneran
// frescos en cada despliegue, así reflejan los productos/perfiles reales de
// ese momento.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SUPABASE_URL = "https://qsxtjuhueqdxoduyroli.supabase.co";
const SUPABASE_KEY = "sb_publishable_VbX-xBAVLKl_SnrkOTxc2w_oTe5-1Va";
const APP_URL = "https://retadordps.github.io/Retador-Plataform-"; // ⚠️ ajustar si cambia el dominio
const DEFAULT_IMAGE = `${APP_URL}/icons/icon-512.png`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "share");

function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pageHtml({ title, description, image, url, redirectTo }) {
  // BUG REAL encontrado y corregido: el <meta http-equiv="refresh" content="0;...">
  // hacía que rastreadores como el de Facebook (que no ejecutan JavaScript, pero
  // SÍ siguen una redirección de 0 segundos declarada en el propio HTML) saltaran
  // derecho al destino (la app raíz, "/?openProduct=<id>") ANTES de leer las
  // etiquetas Open Graph de ESTA página — y esa app raíz solo tiene el título y
  // logo genéricos de RETADOR (no hay foto/precio: es una SPA, no genera meta
  // tags por producto). Resultado real reportado: la vista previa compartida
  // mostraba solo "RETADOR" y el dominio, sin foto ni precio, aunque el enlace
  // SÍ llevaba al producto correcto al tocarlo (el navegador humano sí sigue la
  // redirección; el rastreador la sigue TAMBIÉN, pero para leer metadatos, no
  // para navegar). Quitando el meta-refresh y dejando SOLO la redirección por
  // JavaScript, los rastreadores (que no ejecutan JS) se quedan leyendo estas
  // etiquetas reales, y las personas reales igual son enviadas al instante.
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace(${JSON.stringify(redirectTo)});</script>
</head>
<body>Redirigiendo a RETADOR…</body>
</html>`;
}

async function fetchJson(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`${query} → HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const prodDir = path.join(OUT_DIR, "producto");
  const profDir = path.join(OUT_DIR, "perfil");
  fs.mkdirSync(prodDir, { recursive: true });
  fs.mkdirSync(profDir, { recursive: true });

  // "hazte-pro.html" — página fija (sin datos por id, no depende de Supabase)
  // del enlace promocional real "Pro gratis por compartir" (ver punto E,
  // Ronda 8): se genera aquí igual que las demás para no versionar a mano
  // nada dentro de public/share (todo ese directorio está en .gitignore).
  const hazteProHtml = pageHtml({
    title: "Hazte Pro GRATIS en RETADOR 🚀",
    description: "Publica sin límites, destaca tu tienda y paga $0 — compartiendo cada mes. Así de simple.",
    image: `${APP_URL}/icons/icon-512.png`,
    url: `${APP_URL}/share/hazte-pro.html`,
    redirectTo: `${APP_URL}/?openProPromo=1`,
  });
  fs.writeFileSync(path.join(OUT_DIR, "hazte-pro.html"), hazteProHtml);

  let products = [];
  try {
    products = await fetchJson(
      "products?select=id,title,description,images,price,currency,kind&status=eq.active&moderation_status=eq.approved&order=created_at.desc&limit=3000"
    );
  } catch (e) {
    console.error("⚠️ generate-share-pages: no se pudieron traer productos —", e.message);
  }
  for (const p of products) {
    const precio = p.kind === "service"
      ? (Number(p.price) > 0 ? `Desde ${p.price} ${p.currency}` : "Precio a consultar")
      : `${p.price} ${p.currency}`;
    const description = (p.description ? p.description.slice(0, 150) : "") || `Disponible en RETADOR — ${precio}`;
    const image = (Array.isArray(p.images) && p.images[0]) || DEFAULT_IMAGE;
    const html = pageHtml({
      title: p.title || "RETADOR Marketplace",
      description,
      image,
      url: `${APP_URL}/share/producto/${encodeURIComponent(p.id)}.html`,
      redirectTo: `${APP_URL}/?openProduct=${encodeURIComponent(p.id)}`,
    });
    fs.writeFileSync(path.join(prodDir, `${p.id}.html`), html);
  }

  let profiles = [];
  try {
    profiles = await fetchJson("profiles?select=id,full_name,avatar_url,bio&limit=5000");
  } catch (e) {
    console.error("⚠️ generate-share-pages: no se pudieron traer perfiles —", e.message);
  }
  for (const u of profiles) {
    const html = pageHtml({
      title: u.full_name || "RETADOR Marketplace",
      description: u.bio || "Mira mi tienda en RETADOR.",
      image: u.avatar_url || DEFAULT_IMAGE,
      url: `${APP_URL}/share/perfil/${encodeURIComponent(u.id)}.html`,
      redirectTo: `${APP_URL}/?openProfile=${encodeURIComponent(u.id)}`,
    });
    fs.writeFileSync(path.join(profDir, `${u.id}.html`), html);
  }

  console.log(`✅ generate-share-pages: ${products.length} producto(s), ${profiles.length} perfil(es)`);
}

main().catch((e) => {
  // Nunca rompe el despliegue por esto — sin páginas de vista previa la app
  // sigue funcionando igual, solo se pierde la vista previa rica.
  console.error("⚠️ generate-share-pages falló por completo:", e?.message || e);
  process.exit(0);
});
