import { useState } from "react";
import { PackageX } from "lucide-react";

import { Corona, IconoComida, type TipoIcono } from "./efectos/IconosComida";
import LluviaDeIconos from "./efectos/LluviaDeIconos";
import { useCelebracion } from "./efectos/useCelebracion";
import { iconoPorCategoria } from "./efectos/iconoPorCategoria";

/* =========================================================
   RANKING ANIMADO
   Reemplaza al gráfico de barras dentro de TarjetaRanking.
   Cada fila muestra una tira de íconos proporcional a su valor.
   Si se pasa "etiquetaPrimero", el 1.º puesto lleva corona,
   brillo dorado y al tocarlo se celebra dentro de la tarjeta.
   Si se pasa "onSeleccionar", cada fila se puede tocar para
   elegirla (por ejemplo, para mostrar su ticket).
   ========================================================= */

export type FilaRankingAnimado = {
  id: number | string;
  nombre: string;
  imagen: string | null;      // URL ya armada
  valor: number;              // número crudo, SIN formatear
  categoria: string | null;
};

type Props = {
  filas: FilaRankingAnimado[];
  formatearValor: (valor: number) => string;
  textoUnidad: string;        // ej: "unidades vendidas"
  etiquetaPrimero?: string;   // ej: "MÁS VENDIDO". Sin esto, no hay corona.
  limite?: number;
  seleccionadoId?: number | string;                // fila marcada como elegida
  onSeleccionar?: (id: number | string) => void;   // al tocar una fila
};

const MAXIMO_ICONOS = 10;

/* Redondea la escala a 1, 2, 5, 10, 20, 50, 100... para que la leyenda sea legible */
function escalaRedonda(valor: number): number {
  if (valor <= 1) return 1;
  const potencia = 10 ** Math.floor(Math.log10(valor));
  const base = valor / potencia;
  const redondeo = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return redondeo * potencia;
}

/* Cuántos íconos llenos y si va uno "por la mitad" */
function calcularIconos(valor: number, unidad: number) {
  const exacto = valor / unidad;
  const llenos = Math.min(Math.floor(exacto), MAXIMO_ICONOS);
  const medio = llenos < MAXIMO_ICONOS && exacto - Math.floor(exacto) >= 0.5;
  // Si vendió algo pero no llega a un ícono, mostramos uno tenue
  const minimo = valor > 0 && llenos === 0 && !medio;
  return { llenos, medio: medio || minimo };
}

/* Posiciones de la montañita: 3 abajo, 2 al medio, 1 arriba */
const MONTANIA = [
  { x: 0, y: 22 }, { x: 20, y: 22 }, { x: 40, y: 22 },
  { x: 10, y: 8 }, { x: 30, y: 8 },
  { x: 20, y: -6 },
];

export default function RankingAnimado({
  filas,
  formatearValor,
  textoUnidad,
  etiquetaPrimero,
  limite = 5,
  seleccionadoId,
  onSeleccionar,
}: Props) {
  const { celebracion, celebrar } = useCelebracion();
  const [montaniaVisible, setMontaniaVisible] = useState(false);

  const visibles = filas.slice(0, limite);
  const maximo = Math.max(...visibles.map((fila) => fila.valor), 0);
  const unidad = escalaRedonda(maximo / MAXIMO_ICONOS);
  const conCorona = Boolean(etiquetaPrimero) && maximo > 0;

  const tipoPrimero: TipoIcono = iconoPorCategoria(visibles[0]?.categoria);

  const tocarFila = (fila: FilaRankingAnimado, esPrimero: boolean) => {
    onSeleccionar?.(fila.id);

    // Solo el 1.º puesto celebra
    if (esPrimero) {
      setMontaniaVisible(true);
      celebrar(tipoPrimero, `¡${fila.nombre} es el número 1!`);
    }
  };
  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-50 p-2 ring-1 ring-gray-200 sm:p-3">
      <LluviaDeIconos celebracion={celebracion} />

      {/* Leyenda de la escala */}
      <p className="mb-2 flex items-center gap-1.5 px-2 text-xs text-gray-500">
        Cada
        <IconoComida tipo={tipoPrimero} tamanio={16} />
        equivale a{" "}
        <strong className="font-semibold text-gray-700">
          {formatearValor(unidad)} {textoUnidad}
        </strong>
      </p>

      <ol className="space-y-2">
        {visibles.map((fila, indice) => {
          const esPrimero = indice === 0 && conCorona;
          const elegida = fila.id === seleccionadoId;
          const sePuedeTocar = esPrimero || Boolean(onSeleccionar);

          // Estilo de la fila según sea la ganadora, la elegida o una común
          const estiloFila = esPrimero
            ? `rep-ganador border-amber-300 ${elegida ? "bg-amber-100 ring-2 ring-amber-300" : "bg-amber-50"}`
            : elegida
              ? "border-orange-300 bg-orange-50 ring-2 ring-orange-200"
              : "border-gray-200 bg-white hover:border-gray-300";
          const tipo = iconoPorCategoria(fila.categoria);
          const { llenos, medio } = calcularIconos(fila.valor, unidad);

          const contenidoFila = (
            <>
              {/* Posición o corona */}
              <span className="flex w-7 shrink-0 justify-center">
                {esPrimero ? (
                  <span className="rep-corona">
                    <Corona tamanio={26} titulo="Primer puesto" />
                  </span>
                ) : (
                  <span className="text-sm font-bold text-orange-700">
                    {indice + 1}
                  </span>
                )}
              </span>

              {/* Imagen del producto (se oculta en celular para ganar espacio) */}
              {fila.imagen ? (
                <img
                  src={fila.imagen}
                  alt=""
                  loading="lazy"
                  className="hidden h-11 w-11 shrink-0 rounded-lg border border-gray-200 bg-white object-cover sm:block"
                  onError={(evento) => {
                    evento.currentTarget.style.visibility = "hidden";
                  }}
                />
              ) : (
                <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 sm:flex">
                  <PackageX size={19} />
                </span>
              )}

              {/* Columna principal: dos renglones */}
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                {/* Renglón 1: nombre, categoría, montañita y valor */}
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="min-w-0 truncate text-sm font-semibold text-gray-800"
                    title={fila.nombre}
                  >
                    {fila.nombre}
                  </span>

                  {fila.categoria && (
                    <span className="hidden shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200 md:inline">
                      {fila.categoria}
                    </span>
                  )}

                  {/* Montañita: aparece al tocar al 1.º */}
                  {esPrimero && montaniaVisible && (
                    <span
                      key={celebracion?.id}
                      aria-hidden="true"
                      className="relative h-9 w-[54px] shrink-0"
                    >
                      {MONTANIA.map((punto, i) => (
                        <span
                          key={i}
                          className="rep-aterrizar absolute"
                          style={{
                            left: punto.x * 0.9,
                            top: punto.y * 0.9,
                            animationDelay: `${0.4 + i * 0.12}s`,
                          }}
                        >
                          <IconoComida tipo={tipo} tamanio={18} />
                        </span>
                      ))}
                    </span>
                  )}

                  <span className="ml-auto shrink-0 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-200">
                    {formatearValor(fila.valor)}
                  </span>
                </span>

                {/* Renglón 2: tira de íconos y etiqueta dorada */}
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5">
                    {Array.from({ length: llenos }, (_, i) => (
                      <span
                        key={i}
                        className="rep-pop inline-flex"
                        style={{ animationDelay: `${0.25 + indice * 0.07 + i * 0.04}s` }}
                      >
                        <IconoComida tipo={tipo} tamanio={18} />
                      </span>
                    ))}
                    {medio && (
                      <span
                        className="rep-pop inline-flex opacity-35"
                        style={{ animationDelay: `${0.25 + indice * 0.07 + llenos * 0.04}s` }}
                      >
                        <IconoComida tipo={tipo} tamanio={18} />
                      </span>
                    )}
                    {fila.valor === 0 && (
                      <span className="text-xs text-gray-400">Sin ventas</span>
                    )}
                  </span>

                  {esPrimero && (
                    <span className="rep-etiqueta-oro shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide">
                      {etiquetaPrimero}
                    </span>
                  )}
                </span>
              </span>
            </>
          );

          return (
            <li
              key={fila.id}
              className="rep-subir"
              style={{ animationDelay: `${indice * 0.07}s` }}
            >
              {sePuedeTocar ? (
                <button
                  type="button"
                  onClick={() => tocarFila(fila, esPrimero)}
                  aria-pressed={elegida}
                  aria-label={`${fila.nombre}, puesto ${indice + 1}, ${formatearValor(fila.valor)} ${textoUnidad}.${esPrimero ? " Tocá para celebrar." : ""}`}
                  className={`flex w-full items-center gap-2 rounded-xl border px-2 py-2.5 text-left shadow-[0_1px_3px_rgba(17,24,39,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(17,24,39,0.10)] sm:gap-3 ${estiloFila}`}
                >
                  {contenidoFila}
                </button>
              ) : (
                <div
                  className={`flex items-center gap-2 rounded-xl border px-2 py-2.5 shadow-[0_1px_3px_rgba(17,24,39,0.08)] sm:gap-3 ${estiloFila}`}
                >
                  {contenidoFila}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}