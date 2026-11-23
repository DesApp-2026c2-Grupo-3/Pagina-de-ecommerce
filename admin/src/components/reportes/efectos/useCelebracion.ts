import { useCallback, useEffect, useRef, useState } from "react";
import type { TipoIcono } from "./IconosComida";

/* =========================================================
   HOOK DE CELEBRACIÓN
   Uso:  const { celebracion, celebrar } = useCelebracion();
         celebrar("papas", "¡Morón lidera las ventas!");
   ========================================================= */

export type Celebracion = {
  id: number;        // cambia en cada celebración para reiniciar la animación
  tipo: TipoIcono;   // qué ícono llueve
  mensaje: string;   // texto del cartel
};

const DURACION_MS = 4200;

export function useCelebracion() {
  const [celebracion, setCelebracion] = useState<Celebracion | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrar = useCallback((tipo: TipoIcono, mensaje: string) => {
    // Si había una celebración en curso, la cortamos y arrancamos la nueva
    if (temporizador.current) clearTimeout(temporizador.current);

    setCelebracion({ id: Date.now(), tipo, mensaje });

    temporizador.current = setTimeout(() => setCelebracion(null), DURACION_MS);
  }, []);

  // Si el usuario se va de la página en plena lluvia, limpiamos el temporizador
  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  return { celebracion, celebrar };
}