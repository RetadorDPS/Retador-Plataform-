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
const DEFAULT_IMAGE = `${APP_URL}/icon-512.png`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "share");

function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pageHtml({ title, description, image, redirectTo }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${esc(redirectTo)}">
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
