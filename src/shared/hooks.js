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
