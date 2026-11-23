import { useState } from "react";
import type { CSSProperties } from "react";
import type { PromocionMasUtilizada } from "../../types/reporte.types";

/* =========================================================
   LOS CUPONES RECORTADOS
   Cada promo es un cupón con su "2×1" o "20%" en grande.
   Al lado se apilan cuponcitos recortados en proporción a las
   veces que se usó, con el número exacto. Al tocar una promo
   se imprime su detalle al costado.
   ========================================================= */

type Props = {
  promos: PromocionMasUtilizada[];
};

const LIMITE = 8;

/* Largo de la pila más larga según el ancho de pantalla */
const MAXIMO_CELULAR = 8;
const MAXIMO_TABLET = 14;
const MAXIMO_ESCRITORIO = 24;

const TIPOS: Record<string, string> = {
  SEMANA: "Producto de la semana",
  REGALO: "Regalo de la semana",
  DIA: "Promo del día",
};

const formatearNumero = (valor: number) => valor.toLocaleString("es-AR");

const formatearDinero = (valor: number) =>
  valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

function Corona() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} role="img" aria-label="La más usada">
      <path
        d="M3 18l-1-11 6 4 4-7 4 7 6-4-1 11z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Una línea "concepto ........ valor" */
function Renglon({ concepto, valor }: { concepto: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2 text-[13px]">
      <span className="shrink-0">{concepto}</span>
      <span className="flex-1 border-b border-dotted border-amber-300" />
      <strong className="text-right text-gray-900">{valor}</strong>
    </div>
  );
}

export default function CuponesPromo({ promos }: Props) {
  const [elegidaId, setElegidaId] = useState<number | null>(null);

  const ranking = promos.slice(0, LIMITE);
  const maximo = Math.max(1, ...ranking.map((promo) => promo.veces));

  const indiceElegido = Math.max(
    0,
    ranking.findIndex((promo) => promo.promocionId === elegidaId),
  );
  const elegida = ranking[indiceElegido];

  return (
    <div className="flex flex-wrap items-start gap-6 p-4 sm:p-6">
      <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-2.5">
        <p className="text-xs text-gray-500">
          Cuantos más cupones recortados, más veces se usó la promo. El número exacto está a la
          derecha.
        </p>

        {ranking.map((promo, indice) => {
          const activa = indice === indiceElegido;
          const proporcion = promo.veces / maximo;

          // Cuántos cuponcitos se apilan en cada ancho (mínimo 1 si se usó)
          const cuantos = (maximoPila: number) =>
            promo.veces > 0 ? Math.max(1, Math.round(proporcion * maximoPila)) : 0;
          const enCelular = cuantos(MAXIMO_CELULAR);
          const enTablet = cuantos(MAXIMO_TABLET);
          const enEscritorio = cuantos(MAXIMO_ESCRITORIO);

          return (
            <button
              key={promo.promocionId}
              type="button"
              aria-pressed={activa}
              aria-label={`${promo.titulo}: ${formatearNumero(promo.veces)} veces`}
              onClick={() => setElegidaId(promo.promocionId)}
              className={`rep-fila-cupon rep-subir grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2 rounded-2xl py-2 pr-3 pl-3 text-left sm:grid-cols-[210px_minmax(0,1fr)_90px] sm:pl-2 ${
                activa ? "bg-orange-50 shadow-[inset_0_0_0_2px_#fdba74]" : "hover:bg-orange-50/50"
              }`}
              style={{ animationDelay: `${indice * 0.05}s` }}
            >
              {/* El cupón (en celular ocupa toda la primera fila) */}
              <span className="relative col-span-full flex items-center gap-2.5 rounded-[10px] border-2 border-dashed border-amber-500 bg-amber-50 px-2.5 py-2 sm:col-span-1">
                <span aria-hidden="true" className="absolute top-1/2 -left-[11px] -mt-[9px] -rotate-90 text-[15px] text-gray-500">
                  ✂
                </span>
                <strong className="min-w-[54px] shrink-0 text-center text-xl leading-none text-orange-700">
                  {promo.destacado}
                </strong>
                <span className="min-w-0 text-[13px] leading-tight font-bold text-gray-800">
                  {promo.titulo}
                  {!promo.activa && (
                    <span className="block text-[11px] font-semibold text-gray-500">desactivada</span>
                  )}
                </span>
                {indice === 0 && (
                  <span className="rep-corona absolute -top-3.5 -right-2">
                    <Corona />
                  </span>
                )}
              </span>

              {/* La pila de cuponcitos */}
              <span aria-hidden="true" className="flex min-h-[30px] items-center overflow-hidden pl-1.5">
                {Array.from({ length: enEscritorio }, (_, posicion) => {
                  const estilo = {
                    animationDelay: `${(0.1 + indice * 0.1 + posicion * 0.04).toFixed(2)}s`,
                    "--giro": `${((posicion * 17 + indice * 5) % 13) - 6}deg`,
                    zIndex: posicion,
                  } as CSSProperties;

                  return (
                    // En pantallas angostas se ocultan los que sobran (sigue siendo proporcional)
                    <span
                      key={posicion}
                      className={`-ml-1 ${
                        posicion < enCelular
                          ? "block"
                          : posicion < enTablet
                            ? "hidden sm:block"
                            : "hidden lg:block"
                      }`}
                    >
                      <span className="rep-mini-cupon" style={estilo} />
                    </span>
                  );
                })}
              </span>

              {/* Veces */}
              <strong className="text-right text-base whitespace-nowrap text-gray-900">
                {formatearNumero(promo.veces)}{" "}
                <span className="text-xs font-semibold text-gray-500">
                  {promo.veces === 1 ? "vez" : "veces"}
                </span>
              </strong>
            </button>
          );
        })}
      </div>

      {/* Detalle de la promo elegida */}
      <aside
        aria-label="Detalle de la promo"
        aria-live="polite"
        className="min-w-0 flex-[1_1_260px] py-2.5"
      >
        <div className="rep-ticket border-x border-amber-300 px-5 py-6 font-mono text-gray-700 shadow-[0_2px_4px_rgba(146,64,14,0.12),0_14px_32px_rgba(146,64,14,0.18)]">
          <div key={elegida.promocionId} className="rep-imprimir flex flex-col gap-2.5">
            <div className="text-center">
              <p className="text-xs font-bold tracking-[0.2em] text-amber-800">BURGERFAST</p>
              <p className="text-[11px] tracking-[0.12em] text-amber-800">DETALLE DE LA PROMO</p>
            </div>

            <div className="border-t-2 border-dashed border-amber-300" />

            <div>
              <p className="font-sans text-xl leading-tight font-extrabold text-gray-900">
                {elegida.titulo}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {elegida.destacado} · {TIPOS[elegida.tipo] ?? elegida.tipo} · Puesto{" "}
                {indiceElegido + 1} de {ranking.length}
              </p>
            </div>

            <Renglon concepto="Veces usada" valor={formatearNumero(elegida.veces)} />
            <Renglon concepto="Unidades" valor={formatearNumero(elegida.unidades)} />
            <Renglon concepto="Facturó" valor={formatearDinero(elegida.facturacion)} />
            <Renglon concepto="Ahorro clientes" valor={formatearDinero(elegida.ahorro)} />

            <div className="border-t-2 border-dashed border-amber-300" />

            {elegida.diaMasUsado && (
              <p className="text-xs">
                Se usa más los <strong className="text-gray-900">{elegida.diaMasUsado}</strong>
              </p>
            )}
            {!elegida.activa && (
              <p className="text-[11px] text-gray-500">
                Esta promo está desactivada: los números son de cuando estaba vigente.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}