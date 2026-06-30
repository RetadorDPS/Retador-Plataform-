import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./supabase.js";

export const CATS = [
  { id: "hogar",        name: "Hogar",            color: "#A78BFA" },
  { id: "electronica",  name: "Electrónica",      color: "#60A5FA" },
  { id: "moda",         name: "Moda",             color: "#E879F9" },
  { id: "alimentos",    name: "Alimentos",        color: "#4ADE80" },
  { id: "belleza",      name: "Belleza",          color: "#FBBF24" },
  { id: "vehiculos",    name: "Vehículos",        color: "#F87171" },
  { id: "bebes",        name: "Bebés",            color: "#F472B6" },
  { id: "educacion",    name: "Educación",        color: "#38BDF8" },
  { id: "servicios",    name: "Servicios",        color: "#2DD4BF" },
  { id: "mascotas",     name: "Mascotas",         color: "#FB7185" },
  { id: "salud",        name: "Salud & Fitness",  color: "#22C55E" },
  { id: "eventos",      name: "Eventos",          color: "#F59E0B" },
  { id: "casas",        name: "Casas & Rentas",   color: "#8B5CF6" },
  { id: "arte",         name: "Arte",             color: "#FB923C" },
  { id: "deportes",     name: "Deportes",         color: "#34D399" },
  { id: "herramientas", name: "Herramientas",     color: "#94A3B8" },
];

export const SUBCATS = {
  hogar: ["Muebles", "Decoración", "Electrodomésticos", "Cocina", "Iluminación", "Organización", "Jardín", "Herramientas hogar", "Ropa de cama"],
  electronica: ["Teléfonos", "Tablets", "Laptops", "Audífonos", "Smartwatches", "Cargadores", "Gaming", "Cámaras", "TV", "Accesorios tech"],
  moda: ["Mujer", "Hombre", "Niños", "Zapatos", "Bolsos", "Accesorios", "Relojes", "Joyas", "Perfumes", "Gorras", "Deportiva", "Lencería"],
  alimentos: ["Combos", "Carnes", "Bebidas", "Repostería", "Frutas", "Verduras", "Granos", "Productos básicos", "Comida rápida"],
  belleza: ["Maquillaje", "Skincare", "Cabello", "Uñas", "Perfumes", "Barbería", "Naturales", "Herramientas"],
  vehiculos: ["Autos", "Motos", "Bicicletas", "Eléctricos", "Piezas", "Mecánica", "Lavado", "Rentas"],
  bebes: ["Ropa bebé", "Juguetes", "Coches", "Alimentación", "Aseo", "Maternales", "Seguridad"],
  educacion: ["Libros", "Papelería", "Útiles", "Cursos presenciales", "Cursos online", "Idiomas", "Tecnología"],
  servicios: ["Electricidad", "Plomería", "Reparaciones", "Albañilería", "Carpintería", "Jardinería", "Limpieza", "Diseño", "Programación", "Marketing", "Fotografía", "Transporte", "Clases"],
  mascotas: ["Alimentos", "Accesorios", "Veterinaria", "Juguetes", "Paseo", "Adopción"],
  salud: ["Fitness", "Suplementos", "Equipos médicos", "Ejercicio", "Nutrición", "Terapias"],
  eventos: ["DJs", "Decoración", "Fotografía", "Catering", "Renta equipos", "Locales", "Animación", "Organización"],
  casas: ["Venta casas", "Alquiler casas", "Habitaciones", "Terrenos", "Oficinas", "Vacacional", "Vehículos"],
  arte: ["Pinturas", "Manualidades", "Artesanías", "Cuadros", "Instrumentos", "Coleccionables"],
  deportes: ["Fútbol", "Béisbol", "Ciclismo", "Gimnasio", "Extremos", "Ropa", "Equipos", "Accesorios"],
  herramientas: ["Eléctricas", "Manuales", "Construcción", "Pintura", "Soldadura", "Ferretería", "Equipos trabajo", "Materiales"],
};

// ═════════════════════════════════════════════════════════════════════════════
// CATÁLOGO EDITABLE — categorías/subcategorías controladas desde el panel admin
// ═════════════════════════════════════════════════════════════════════════════
export const CatalogContext = createContext(null);
export function CatalogProvider({ children }) {
  const [cats, setCats] = useState(() => { try { const r = localStorage.getItem("retador_cats"); if (r) return JSON.parse(r); } catch {} return CATS; });
  const [subcats, setSubcats] = useState(() => { try { const r = localStorage.getItem("retador_subcats"); if (r) return JSON.parse(r); } catch {} return SUBCATS; });
  // Cargar categorías/subcategorías REALES del backend (lectura pública, sin login).
  // Las de fábrica quedan como respaldo instantáneo; si falla la carga, se mantienen.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ data: cs, error: e1 }, { data: ss, error: e2 }] = await Promise.all([
          supabase.from("categories").select("id,name,color,sort_order").order("sort_order", { ascending: true }),
          supabase.from("subcategories").select("category_id,name,sort_order").order("sort_order", { ascending: true }),
        ]);
        if (e1 || e2) throw (e1 || e2);
        if (!alive) return;
        if (cs && cs.length) setCats(cs.map(c => ({ id: c.id, name: c.name, color: c.color })));
        if (ss && ss.length) {
          const grouped = {};
          ss.forEach(s => { (grouped[s.category_id] = grouped[s.category_id] || []).push(s.name); });
          setSubcats(grouped);
        }
      } catch (err) {
        console.error("Catálogo (categorías):", err?.message || err);
      }
    })();
    return () => { alive = false; };
  }, []);
  // Restauración única: devuelve categorías/subcategorías de fábrica borradas por error.
  useEffect(() => {
    try {
      if (localStorage.getItem("retador_cats_restored_v1")) return;
      setCats(prev => { const ids = new Set(prev.map(c => c.id)); const miss = CATS.filter(fc => !ids.has(fc.id)); return miss.length ? [...prev, ...miss] : prev; });
      setSubcats(prev => { const m = { ...prev }; Object.keys(SUBCATS).forEach(k => { if (!m[k] || m[k].length === 0) m[k] = SUBCATS[k]; }); return m; });
      localStorage.setItem("retador_cats_restored_v1", "1");
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("retador_cats", JSON.stringify(cats)); } catch {} }, [cats]);
  useEffect(() => { try { localStorage.setItem("retador_subcats", JSON.stringify(subcats)); } catch {} }, [subcats]);
  const addCat = (name, color) => {
    const id = (name || "").toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, "-").replace(/^-|-$/g, "") || ("cat" + Date.now());
    if (!name || cats.some(c => c.id === id)) return;
    setCats(p => [...p, { id, name, color: color || "#94A3B8" }]);
    setSubcats(p => ({ ...p, [id]: [] }));
  };
  const removeCat = (id) => { setCats(p => p.filter(c => c.id !== id)); setSubcats(p => { const n = { ...p }; delete n[id]; return n; }); };
  const renameCat = (id, name) => setCats(p => p.map(c => c.id === id ? { ...c, name } : c));
  const setCatColor = (id, color) => setCats(p => p.map(c => c.id === id ? { ...c, color } : c));
  const addSub = (catId, sub) => { if (!sub) return; setSubcats(p => ({ ...p, [catId]: [...(p[catId] || []), sub] })); };
  const removeSub = (catId, sub) => setSubcats(p => ({ ...p, [catId]: (p[catId] || []).filter(s => s !== sub) }));
  const renameSub = (catId, oldSub, newSub) => { if (!newSub || !newSub.trim()) return; setSubcats(p => ({ ...p, [catId]: (p[catId] || []).map(s => s === oldSub ? newSub.trim() : s) })); };
  const reorderCats = (from, to) => setCats(p => { if (from == null || to == null || from === to) return p; const a = [...p]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return a; });
  const resetCatalog = () => { setCats(CATS); setSubcats(SUBCATS); };
  return <CatalogContext.Provider value={{ cats, subcats, addCat, removeCat, renameCat, setCatColor, addSub, removeSub, renameSub, reorderCats, resetCatalog }}>{children}</CatalogContext.Provider>;
}
export const useCatalog = () => useContext(CatalogContext) || { cats: CATS, subcats: SUBCATS, addCat: () => {}, removeCat: () => {}, renameCat: () => {}, setCatColor: () => {}, addSub: () => {}, removeSub: () => {}, renameSub: () => {}, reorderCats: () => {}, resetCatalog: () => {} };

// ═════════════════════════════════════════════════════════════════════════════
// ICONOS DE CATEGORÍA
// ═════════════════════════════════════════════════════════════════════════════
export const CatIcon = ({ id, color, size = 22 }) => {
  const icons = {
    electronica:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    moda:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>,
    alimentos:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    belleza:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" fill={color} fillOpacity=".3"/><path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>,
    hogar:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    vehiculos:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1L2 11v5h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
    bebes:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    educacion:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
    servicios:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
    arte:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="1" fill={color}/><circle cx="17.5" cy="10.5" r="1" fill={color}/><circle cx="8.5" cy="7.5" r="1" fill={color}/><circle cx="6.5" cy="12.5" r="1" fill={color}/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
    herramientas: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    deportes:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 9.17l4.24-4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M9.17 14.83l-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>,
  };
  return icons[id] || icons.servicios;
};
