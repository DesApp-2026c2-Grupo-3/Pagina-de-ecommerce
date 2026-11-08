import type { CSSProperties } from "react";
import type { PedidosAtendidosSucursal } from "../../types/reporte.types";

/* =========================================================
   EL RIEL DE COMANDAS
   Cada sucursal tiene su riel de cocina con comandas colgadas:
   cada comanda son N pedidos entregados (en proporción) y al
   lado va el número exacto. El relojito muestra el tiempo
   promedio de entrega; la más rápida lleva corona.
   ========================================================= */

type Props = {
  filas: PedidosAtendidosSucursal[];
};

/* Largo del riel más largo según el ancho de pantalla */
const MAXIMO_CELULAR = 9;
const MAXIMO_TABLET = 16;
const MAXIMO_ESCRITORIO = 28;

const formatearNumero = (valor: number) => valor.toLocaleString("es-AR");

/* Verde hasta 30 min, amarillo hasta 40, rojo más de 40 */
function colorReloj(minutos: number | null) {
  if (minutos === null) return "bg-gray-50 text-gray-500 ring-gray-200";
  if (minutos <= 30) return "bg-green-50 text-green-700 ring-green-300";
  if (minutos <= 40) return "bg-yellow-50 text-yellow-700 ring-yellow-300";
  return "bg-red-50 text-red-700 ring-red-200";
}

function Corona() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} role="img" aria-label="La más rápida">
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

function Comanda() {
  return (
    <>
      {/* Broche */}
      <span aria-hidden="true" className="mx-auto -mb-px block h-[5px] w-1.5 rounded-[1px] bg-gray-400" />
      {/* Papel con renglones */}
      <span
        aria-hidden="true"
        className="block h-[30px] w-4 rounded-[1px_1px_3px_3px] bg-white bg-[linear-gradient(180deg,#fb923c_0_4px,transparent_4px),repeating-linear-gradient(180deg,transparent_0_7px,#d1d5db_7px_8px)] shadow-[0_2px_4px_rgba(0,0,0,0.22),inset_0_0_0_1px_#d1d5db]"
      />
    </>
  );
}

export default function RielComandas({ filas }: Props) {
  const maximo = Math.max(1, ...filas.map((fila) => fila.entregados));

  const total = filas.reduce((suma, fila) => suma + fila.entregados, 0);

  /* Promedio general, pesado por la cantidad de entregas de cada sucursal */
  const conTiempo = filas.filter((fila) => fila.promedioMinutos !== null);
  const entregasConTiempo = conTiempo.reduce((suma, fila) => suma + fila.entregados, 0);
  const promedioGeneral =
    entregasConTiempo > 0
      ? Math.round(
          conTiempo.reduce((suma, fila) => suma + (fila.promedioMinutos ?? 0) * fila.entregados, 0) /
            entregasConTiempo,
        )
      : null;

  /* % a tiempo general, pesado por los pedidos con tiempo estimado de cada sucursal */
  const conEstimado = filas.reduce((suma, fila) => suma + (fila.conEstimado ?? 0), 0);
  const aTiempoGeneral =
    conEstimado > 0
      ? Math.round(
          filas.reduce((suma, fila) => suma + ((fila.porcentajeATiempo ?? 0) / 100) * (fila.conEstimado ?? 0), 0) /
            conEstimado *
            100,
        )
      : null;
  const masRapida =
    filas.length > 1 && conTiempo.length > 0
      ? Math.min(...conTiempo.map((fila) => fila.promedioMinutos ?? Infinity))
      : null;

  return (
    <div className="flex flex-col gap-1.5 px-3 pt-4 pb-6 sm:px-6">
      <p className="mb-2 text-[15px] text-gray-700">
        <strong className="text-[22px] text-gray-900">{formatearNumero(total)}</strong> pedidos
        entregados en los últimos 30 días
        {promedioGeneral !== null && (
          <>
            {" "}· promedio general <strong>{promedioGeneral} min</strong>
          </>
        )}
        {aTiempoGeneral !== null && (
          <>
            {" "}· <strong>{aTiempoGeneral}%</strong> a tiempo
          </>
        )}
      </p>
      <p className="mb-1 text-xs text-gray-500">
        Cuantas más comandas colgadas, más pedidos entregó la sucursal. El número exacto está a
        la derecha.
      </p>

      {filas.map((fila, indice) => {
        const proporcion = fila.entregados / maximo;
        const rapida = masRapida !== null && fila.promedioMinutos === masRapida;

        // Cuántas comandas se cuelgan en cada ancho (mínimo 1 si entregó algo)
        const cuantas = (maximoFila: number) =>
          fila.entregados > 0 ? Math.max(1, Math.round(proporcion * maximoFila)) : 0;
        const enCelular = cuantas(MAXIMO_CELULAR);
        const enTablet = cuantas(MAXIMO_TABLET);
        const enEscritorio = cuantas(MAXIMO_ESCRITORIO);

        return (
          <div
            key={fila.sucursalId}
            className={`rep-subir grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 rounded-xl px-2.5 py-1.5 sm:grid-cols-[minmax(90px,130px)_minmax(0,1fr)_64px_84px] ${
              rapida ? "bg-amber-50 shadow-[inset_0_0_0_1px_#fcd34d]" : ""
            }`}
            style={{ animationDelay: `${indice * 0.05}s` }}
          >
            {/* Sucursal */}
            <strong className="truncate text-sm text-gray-800">{fila.nombre}</strong>

            {/* El riel con las comandas (en celular baja a una fila propia) */}
            <span className="relative order-last col-span-full h-[46px] sm:order-none sm:col-span-1">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-1 h-1.5 rounded-[3px] bg-[linear-gradient(180deg,#d1d5db,#6b7280)] shadow-[0_2px_2px_rgba(0,0,0,0.15)]"
              />
              <span className="absolute top-1.5 right-0 left-1.5 flex h-10 gap-[3px] overflow-hidden">
                {Array.from({ length: enEscritorio }, (_, posicion) => {
                  const estilo = {
                    animationDelay: `${(indice * 0.1 + posicion * 0.05).toFixed(2)}s`,
                    "--giro": `${((posicion * 13 + indice * 7) % 9) - 4}deg`,
                  } as CSSProperties;

                  return (
                    // En pantallas angostas se ocultan las que sobran (sigue siendo proporcional)
                    <span
                      key={posicion}
                      className={
                        posicion < enCelular
                          ? "block"
                          : posicion < enTablet
                            ? "hidden sm:block"
                            : "hidden lg:block"
                      }
                    >
                      <span className="rep-comanda" style={estilo}>
                        <Comanda />
                      </span>
                    </span>
                  );
                })}
              </span>
            </span>

            {/* Número exacto */}
            <strong className="text-right text-[17px] text-gray-900">
              {formatearNumero(fila.entregados)}
            </strong>

            {/* Relojito con el tiempo promedio y, debajo, la comparación con lo prometido */}
            <span className="flex flex-col items-center gap-0.5">            
              <span
              className={`relative flex items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-extrabold whitespace-nowrap ring-1 ${colorReloj(fila.promedioMinutos)}`}
              aria-label={
                fila.promedioMinutos === null
                  ? "Sin tiempo de entrega"
                  : `Tiempo promedio de entrega: ${fila.promedioMinutos} minutos`
              }
            >
              {rapida && (
                <span className="rep-corona absolute -top-[17px] left-1/2 -ml-[9px]">
                  <Corona />
                </span>
              )}
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path className="rep-aguja-reloj" d="M12 12V7" />
              </svg>
              {fila.promedioMinutos === null ? "—" : `${fila.promedioMinutos} min`}
            </span>
                        {/* Comparación con lo prometido al cliente: rojo si en promedio llega tarde */}
            {fila.demoraPromedioMinutos != null && (
              <span
                className={`text-[10px] font-bold whitespace-nowrap ${
                  fila.demoraPromedioMinutos > 0 ? "text-red-600" : "text-green-700"
                }`}
                title={`${fila.porcentajeATiempo}% de los pedidos llegó a tiempo`}
              >
                {fila.demoraPromedioMinutos > 0
                  ? `+${fila.demoraPromedioMinutos} min`
                  : `${fila.porcentajeATiempo}% a tiempo`}
              </span>
            )}
            </span>
          </div>
        );
      })}

      <p className="mt-2 text-xs text-gray-500">
        El reloj es el tiempo promedio de entrega: verde hasta 30 min, amarillo hasta 40, rojo
        más de 40.{filas.length > 1 && " La corona es para la más rápida."} Debajo: si en promedio
        llega tarde respecto del tiempo prometido (en rojo, cuántos minutos) o qué % llegó a tiempo (en verde).
      </p>
    </div>
  );
}