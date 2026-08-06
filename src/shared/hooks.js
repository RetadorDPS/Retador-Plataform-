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
// Zona muerta antes de considerar que el gesto ES un "tirar para refrescar".
// Por debajo de esto NO se toca el estado de React: un toque normal (que siempre
// mueve el dedo 2-3 px) no provoca ni un solo re-render. Esto es CRÍTICO: un
// re-render entre el pointerdown y el pointerup de un toque real impide que el
// navegador sintetice el "click", y el botón parece no responder aunque el dedo
// haya caído justo encima (es el bug del botón "Entregué", visto ya dos veces).
const START_SLOP = 12;

export function usePullToRefresh(ref, onRefresh, { threshold = 64, disabled = false } = {}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // Todo el estado del gesto vive en un ref: se lee y escribe sin re-renderizar.
  const st = useRef({ startY: 0, tracking: false, armed: false, pull: 0 });
  // Los callbacks se leen desde refs para que el efecto de abajo se monte UNA vez
  // (si dependiera de ellos, cada render re-registraría los listeners nativos).
  const cbRef = useRef({ onRefresh, disabled, threshold, refreshing });
  cbRef.current = { onRefresh, disabled, threshold, refreshing };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setPullBoth = (v) => { st.current.pull = v; setPull(v); };

    const onStart = (e) => {
      const { disabled: dis, refreshing: ref2 } = cbRef.current;
      const s = st.current;
      s.tracking = false; s.armed = false;
      if (dis || ref2 || e.touches.length !== 1) return;
      // Un toque que nace sobre algo interactivo NUNCA arma el gesto: tocar un
      // botón no debe poder convertirse en un "tirar para refrescar".
      if (e.target?.closest?.("button, a, input, textarea, select, [role='button']")) return;
      if (el.scrollTop > 0) return;
      s.startY = e.touches[0].clientY;
      s.tracking = true;
    };

    const onMove = (e) => {
      const s = st.current;
      if (!s.tracking) return;
      if (el.scrollTop > 0) { s.tracking = false; if (s.armed) { s.armed = false; setPullBoth(0); } return; }
      const dy = e.touches[0].clientY - s.startY;
      // Antes de superar la zona muerta: ni estado, ni preventDefault. El gesto
      // todavía puede ser un toque normal o un scroll.
      if (!s.armed) {
        if (dy < START_SLOP) return;
        s.armed = true;
      }
      // Ya es un tirón deliberado: bloqueamos el gesto NATIVO del navegador (que
      // recargaría la página entera y devolvería al usuario a la bienvenida).
      // Esto solo funciona porque el listener se registra con { passive: false }.
      if (e.cancelable) e.preventDefault();
      const eff = dy - START_SLOP;
      setPullBoth(Math.min(cbRef.current.threshold * 1.4, eff * 0.5));
    };

    const onEnd = async () => {
      const s = st.current;
      const wasArmed = s.armed;
      s.tracking = false; s.armed = false;
      if (!wasArmed) return;                 // fue un toque/scroll: no hay nada que hacer
      const { threshold: th, onRefresh: fn } = cbRef.current;
      if (s.pull >= th) {
        setRefreshing(true);
        setPullBoth(th * 0.85);
        try { await fn?.(); } catch (e) {}
        setRefreshing(false);
      }
      setPullBoth(0);
    };

    const onCancel = () => {
      const s = st.current;
      const wasArmed = s.armed;
      s.tracking = false; s.armed = false;
      if (wasArmed) setPullBoth(0);
    };

    // NO pasivos: es la única forma de que preventDefault() surta efecto. React
    // registra sus onTouchMove como PASIVOS en la raíz, así que el preventDefault
    // de un handler JSX se ignora en silencio — por eso el gesto nativo ganaba.
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, [ref]);

  // `handlers` se mantiene (vacío) para no romper las pantallas que ya lo
  // esparcen sobre su contenedor: ahora los listeners son nativos.
  return { pull, refreshing, handlers: {} };
}
