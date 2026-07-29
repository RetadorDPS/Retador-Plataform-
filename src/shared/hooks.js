import { useState, useRef, useEffect } from "react";

// Hooks reutilizables compartidos por varias pantallas.

// Devuelve "up"/"down" según la dirección de scroll de un contenedor (ref).
// Lo usan el marketplace (ocultar barras al bajar) y la pantalla de subastas.
export function useScrollDir(ref) {
  const [dir, setDir] = useState("up");
  const prev = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fn = () => {
      const cur = el.scrollTop;
      if (cur > prev.current + 5) setDir("down");
      else if (cur < prev.current - 5) setDir("up");
      prev.current = cur;
    };
    el.addEventListener("scroll", fn, { passive: true });
    return () => el.removeEventListener("scroll", fn);
  }, []);
  return dir;
}

// ── PULL-TO-REFRESH real (in-app, no navega) ─────────────────────────────────
// El gesto de "deslizar hacia abajo para refrescar" en una PWA, sin tocar nada,
// dispara el PULL-TO-REFRESH NATIVO del navegador: una recarga COMPLETA de la
// página — por eso "mandaba al usuario al inicio de la pantalla" (perdía el
// scroll y todo el estado). Este hook reemplaza ese gesto por uno propio: solo
// vuelve a pedir los datos (onRefresh) y mantiene el scroll donde estaba.
// Uso: const { pull, refreshing, handlers } = usePullToRefresh(scrollRef, reload);
//      <div ref={scrollRef} {...handlers} style={{overscrollBehaviorY:"contain",...}}>
//        <PullIndicator pull={pull} refreshing={refreshing} /* ver ui.jsx */ />
//        ...contenido...
//      </div>
export function usePullToRefresh(ref, onRefresh, { threshold = 64, disabled = false } = {}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const st = useRef({ startY: 0, active: false });

  const onTouchStart = (e) => {
    if (disabled || refreshing) return;
    const el = ref.current;
    if (!el || el.scrollTop > 0) { st.current.active = false; return; }
    st.current.startY = e.touches[0].clientY;
    st.current.active = true;
  };
  const onTouchMove = (e) => {
    const s = st.current;
    if (!s.active) return;
    const el = ref.current;
    if (el && el.scrollTop > 0) { s.active = false; setPull(0); return; }
    const dy = e.touches[0].clientY - s.startY;
    if (dy <= 0) { setPull(0); return; }
    setPull(Math.min(threshold * 1.4, dy * 0.5));
  };
  const onTouchEnd = async () => {
    const s = st.current;
    if (!s.active) return;
    s.active = false;
    if (pull >= threshold) {
      setRefreshing(true);
      setPull(threshold * 0.85);
      try { await onRefresh?.(); } catch (e) {}
      setRefreshing(false);
    }
    setPull(0);
  };
  const onTouchCancel = () => { st.current.active = false; setPull(0); };

  return { pull, refreshing, handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel } };
}
