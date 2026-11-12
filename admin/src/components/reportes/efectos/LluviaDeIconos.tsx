import type { CSSProperties } from "react";
import { Corona, IconoComida } from "./IconosComida";
import type { Celebracion } from "./useCelebracion";

/* =========================================================
   LLUVIA DE ÍCONOS + CARTEL DE CELEBRACIÓN (dentro de un recuadro)
   Uso: poner <LluviaDeIconos /> adentro de un contenedor con
        las clases "relative overflow-hidden".
   ========================================================= */

const CANTIDAD_GOTAS = 18;

/* Posiciones "pseudoaleatorias" pero fijas: se calculan una sola vez */
const GOTAS = Array.from({ length: CANTIDAD_GOTAS }, (_, i) => ({
  izquierda: `${(i * 37 + 5) % 92}%`,           // entre 0% y 92%, para que no se salgan
  tamanio: 20 + ((i * 7) % 14),                  // entre 20 y 33 px
  retraso: ((i * 0.13) % 1.1).toFixed(2),        // hasta 1,1 s
  duracion: (1.4 + (i % 4) * 0.25).toFixed(2),   // entre 1,4 y 2,15 s
  giro: (i % 2 ? 1 : -1) * (120 + ((i * 29) % 260)),
}));

function prefiereMenosMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Props = {
  celebracion: Celebracion | null;
};

export default function LluviaDeIconos({ celebracion }: Props) {
  if (!celebracion) return null;

  const sinMovimiento = prefiereMenosMovimiento();

  return (
    <>
      {!sinMovimiento && (
        <div key={celebracion.id} className="rep-lluvia" aria-hidden="true">
          {GOTAS.map((gota, i) => (
            <span
              key={i}
              className="rep-gota"
              style={
                {
                  left: gota.izquierda,
                  width: gota.tamanio,
                  height: gota.tamanio,
                  animationDelay: `${gota.retraso}s`,
                  animationDuration: `${gota.duracion}s`,
                  "--giro": `${gota.giro}deg`,
                } as CSSProperties
              }
            >
              <IconoComida tipo={celebracion.tipo} tamanio={gota.tamanio} />
            </span>
          ))}
        </div>
      )}

      <div
        key={`cartel-${celebracion.id}`}
        role="status"
        className="rep-cartel flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-md"
      >
        <span className="rep-corona">
          <Corona tamanio={22} />
        </span>
        <span>{celebracion.mensaje}</span>
      </div>
    </>
  );
}