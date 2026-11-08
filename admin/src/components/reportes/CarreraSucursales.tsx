import { useEffect, useRef, useState } from "react";
import type { PedidoPorSucursal } from "../../types/reporte.types";
import MotoReparto from "./efectos/MotoReparto";

/* =========================================================
   LA CARRERA DE MOTOS
   Cada sucursal tiene un carril y su moto avanza según la
   cantidad de pedidos. La que más tiene llega a la bandera.
   Al tocar un carril, la moto hace un wheelie y toca bocina.
   Si hay una sucursal elegida en el filtro, se resalta su carril.
   ========================================================= */

type Props = {
  sucursales: PedidoPorSucursal[];
  sucursalSeleccionada?: number;
};

const DURACION_LARGADA = 2800; // ms que las motos largan humo
const DURACION_BIP = 1600;

const formatearNumero = (valor: number) => valor.toLocaleString("es-AR");

function Corona() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} role="img" aria-label="Primer puesto">
      <path
        d="M3 18l-1-11 6 4 4-7 4 7 6-4-1 11z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <rect x="3" y="18.5" width="18" height="2.6" rx="1" fill="#d97706" />
    </svg>
  );
}

export default function CarreraSucursales({ sucursales, sucursalSeleccionada }: Props) {
  /* Largada: las motos arrancan en 0 y avanzan hasta su lugar */
  const [largaron, setLargaron] = useState(false);
  const [andando, setAndando] = useState(true);

  /* Bocina: qué carril se tocó y un contador para repetir el wheelie */
  const [bocina, setBocina] = useState<{ id: number; vuelta: number } | null>(null);
  const temporizador = useRef<number | undefined>(undefined);

  useEffect(() => {
    const largada = window.setTimeout(() => setLargaron(true), 80);
    const frenada = window.setTimeout(() => setAndando(false), DURACION_LARGADA);
    return () => {
      window.clearTimeout(largada);
      window.clearTimeout(frenada);
      window.clearTimeout(temporizador.current);
    };
  }, []);

  const tocarBocina = (id: number) => {
    setBocina((anterior) => ({ id, vuelta: (anterior?.vuelta ?? 0) + 1 }));
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setBocina(null), DURACION_BIP);
  };

  const ordenadas = [...sucursales].sort((a, b) => b.cantidad - a.cantidad);
  const maximo = Math.max(1, ...ordenadas.map((sucursal) => sucursal.cantidad));

  return (
    <div className="flex flex-col gap-1.5 px-3 pt-4 pb-6 sm:px-6">
      {ordenadas.map((sucursal, indice) => {
        const lider = indice === 0 && sucursal.cantidad > 0;
        const tocada = bocina?.id === sucursal.sucursalId;
        const filtrada = sucursalSeleccionada === sucursal.sucursalId;
        const avance = largaron ? sucursal.cantidad / maximo : 0;

        const fondo = tocada || filtrada
          ? "bg-orange-50 shadow-[inset_0_0_0_2px_#fdba74]"
          : lider
            ? "bg-amber-50 shadow-[inset_0_0_0_1px_#fcd34d]"
            : "bg-transparent hover:bg-orange-50";

        return (
          <button
            key={sucursal.sucursalId}
            type="button"
            onClick={() => tocarBocina(sucursal.sucursalId)}
            aria-label={`${sucursal.nombre}: ${formatearNumero(sucursal.cantidad)} pedidos, puesto ${indice + 1}`}
            className={`rep-subir grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-xl px-2.5 py-1.5 text-left transition-colors sm:grid-cols-[30px_minmax(90px,160px)_minmax(0,1fr)_100px] ${fondo}`}
            style={{ animationDelay: `${indice * 0.05}s` }}
          >
            {/* Puesto */}
            <span className="flex justify-center">
              {lider ? (
                <span className="rep-corona">
                  <Corona />
                </span>
              ) : (
                <span className="text-sm font-bold text-orange-700">{indice + 1}</span>
              )}
            </span>

            {/* Sucursal */}
            <span className="truncate text-sm font-semibold text-gray-800">
              {sucursal.nombre}
              {filtrada && (
                <span className="ml-1.5 text-xs font-bold text-orange-700">· filtrada</span>
              )}
            </span>

            {/* Carril (en celular baja a una segunda fila a lo ancho) */}
            <span className="relative order-last col-span-full h-10 rounded-[10px] bg-gray-100 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] sm:order-none sm:col-span-1">
              <span
                aria-hidden="true"
                className="absolute inset-x-2 top-1/2 h-0.5 bg-[repeating-linear-gradient(90deg,#d1d5db_0_10px,transparent_10px_20px)]"
              />
              <span
                aria-hidden="true"
                className="rep-bandera absolute top-[3px] right-0.5 h-[34px] w-3.5 rounded-sm border border-gray-900"
              />

              <span
                className="rep-moto"
                style={{
                  left: `calc((100% - 64px) * ${avance})`,
                  transitionDelay: `${indice * 0.08}s`,
                }}
              >
                <span
                  key={tocada ? bocina?.vuelta : 0}
                  className={`relative inline-block ${tocada ? "rep-wheelie" : ""}`}
                >
                  {andando && (
                    <>
                      <span aria-hidden="true" className="rep-humo" />
                      <span aria-hidden="true" className="rep-humo [animation-delay:0.35s]" />
                    </>
                  )}
                  <MotoReparto ancho={46} />
                  {tocada && (
                    <span className="rep-bip absolute -top-5 left-8 rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap text-orange-700 shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_0_0_1px_#fed7aa]">
                      {lider ? "¡Llegué primero!" : "¡Bip bip!"}
                    </span>
                  )}
                </span>
              </span>
            </span>

            {/* Pedidos */}
            <strong className="text-right text-sm whitespace-nowrap text-orange-700">
              {formatearNumero(sucursal.cantidad)} pedidos
            </strong>
          </button>
        );
      })}
    </div>
  );
}