import { useState } from "react";
import type { CSSProperties } from "react";
import type {
  ClientesNuevosPorPeriodo,
  PeriodoClientes,
} from "../../types/reporte.types";

/* =========================================================
   LOS QUE LLEGARON
   Cada período es una fila de stickmen esperando en el mostrador.
   La fila es proporcional a los clientes nuevos (el mejor período
   tiene la fila más larga) y el número exacto va a la derecha.
   En el período en curso, el último sigue llegando.
   ========================================================= */

type Props = {
  periodos: ClientesNuevosPorPeriodo[];
  periodo: PeriodoClientes;
};

/* Largo de la fila más larga según el ancho de pantalla */
const MAXIMO_CELULAR = 7;
const MAXIMO_TABLET = 14;
const MAXIMO_ESCRITORIO = 26;

const COLORES = ["#1f2937", "#374151", "#c2410c", "#1f2937", "#4b5563", "#9a3412"];

const aFecha = (inicio: string) => new Date(`${inicio}T12:00:00`);

function etiquetaCorta(inicio: string, periodo: PeriodoClientes) {
  const fecha = aFecha(inicio);
  if (periodo === "semana") return `${fecha.getDate()}/${fecha.getMonth() + 1}`;
  const mes = fecha.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");
  return mes.charAt(0).toUpperCase() + mes.slice(1);
}

function nombreLargo(inicio: string, periodo: PeriodoClientes) {
  const fecha = aFecha(inicio);
  if (periodo === "semana") return `la semana del ${fecha.getDate()}/${fecha.getMonth() + 1}`;
  return fecha.toLocaleDateString("es-AR", { month: "long" });
}

function Stickman({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 32" width={16} height={32} aria-hidden="true" className="overflow-visible">
      <circle cx="8" cy="5" r="3.6" fill="#ffffff" stroke={color} strokeWidth="1.6" />
      <path d="M8 8.6V19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 11.5l-4 4.5M8 11.5l3.5 5" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path className="rep-pierna rep-pierna-a" d="M8 19l-3 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path className="rep-pierna rep-pierna-b" d="M8 19l3 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Corona() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} role="img" aria-label="Mejor período">
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

export default function FilaClientesNuevos({ periodos, periodo }: Props) {
  const ultimo = periodos.length - 1;

  /* Arranca marcado el último período completo (el anterior al actual) */
  const [elegido, setElegido] = useState<number | null>(null);
  const indiceElegido = elegido ?? Math.max(0, ultimo - 1);

  const maximo = Math.max(0, ...periodos.map((item) => item.cantidad));

  const actual = periodos[indiceElegido];
  const anterior = indiceElegido > 0 ? periodos[indiceElegido - 1] : null;
  const diferencia = anterior ? actual.cantidad - anterior.cantidad : 0;
  const enCurso = indiceElegido === ultimo;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Resumen del período elegido */}
      <div aria-live="polite" className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <strong className="text-4xl leading-none text-gray-900 sm:text-[44px]">
          +{actual.cantidad.toLocaleString("es-AR")}
        </strong>
        <span className="text-base text-gray-700">
          clientes nuevos en{" "}
          <strong>
            {nombreLargo(actual.inicio, periodo)}
            {enCurso && " (en curso)"}
          </strong>
        </span>
        {anterior && (
          <span
            className={`text-sm font-bold ${diferencia >= 0 ? "text-green-700" : "text-amber-700"}`}
          >
            {diferencia >= 0
              ? `${diferencia} más que ${nombreLargo(anterior.inicio, periodo)}`
              : `${Math.abs(diferencia)} menos que ${nombreLargo(anterior.inicio, periodo)}`}
          </span>
        )}
      </div>

      {/* Las filas */}
      <div className="flex flex-col gap-1 rounded-2xl bg-orange-50 p-2 shadow-[inset_0_0_0_1px_#fed7aa] sm:p-3.5">
        {periodos.map((item, indice) => {
          const activo = indice === indiceElegido;
          const esElUltimo = indice === ultimo;
          const proporcion = maximo > 0 ? item.cantidad / maximo : 0;

          // Cuánta gente se dibuja en cada ancho (mínimo 1 si hubo al menos un cliente)
          const cuantos = (maximoFila: number) =>
            item.cantidad > 0 ? Math.max(1, Math.round(proporcion * maximoFila)) : 0;
          const enCelular = cuantos(MAXIMO_CELULAR);
          const enTablet = cuantos(MAXIMO_TABLET);
          const enEscritorio = cuantos(MAXIMO_ESCRITORIO);

          return (
            <button
              key={item.inicio}
              type="button"
              aria-pressed={activo}
              aria-label={`${item.cantidad} clientes nuevos en ${nombreLargo(item.inicio, periodo)}`}
              onClick={() => setElegido(indice)}
              className={`grid w-full grid-cols-[44px_minmax(0,1fr)_44px] items-end gap-2 rounded-xl px-2 pt-1.5 pb-1 text-left transition-colors sm:grid-cols-[54px_minmax(0,1fr)_70px] sm:gap-2.5 sm:px-2.5 ${
                activo
                  ? "bg-white shadow-[0_0_0_2px_#fdba74,0_6px_14px_rgba(234,88,12,0.15)]"
                  : "hover:bg-white"
              }`}
            >
              {/* Período */}
              <span className="flex flex-col self-center">
                <strong className={`text-[13px] ${activo ? "text-orange-700" : "text-gray-700"}`}>
                  {etiquetaCorta(item.inicio, periodo)}
                </strong>
                {esElUltimo && (
                  <span className="text-[10px] font-semibold text-gray-400">en curso</span>
                )}
              </span>

              {/* La fila frente al mostrador */}
              <span className="relative flex min-h-9 items-end gap-[3px] overflow-hidden border-b-2 border-orange-300 pl-[30px]">
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[22px] w-6 rounded-t bg-orange-700 shadow-[inset_0_4px_0_#9a3412]"
                >
                  <span className="absolute -top-[9px] left-[5px] h-2 w-3 rounded-sm bg-gray-700" />
                </span>

                {Array.from({ length: enEscritorio }, (_, posicion) => {
                  const llegando = esElUltimo && posicion === enEscritorio - 1;
                  const estilo = {
                    "--demora": `${(indice * 0.12 + posicion * 0.09).toFixed(2)}s`,
                    "--respiro": `${((posicion * 0.37 + indice * 0.21) % 1.3).toFixed(2)}s`,
                  } as CSSProperties;

                  return (
                    // En pantallas angostas se ocultan los que sobran
                    // (la fila sigue siendo proporcional)
                    <span
                      key={posicion}
                      className={
                        posicion < enCelular || llegando
                          ? "flex"
                          : posicion < enTablet
                            ? "hidden sm:flex"
                            : "hidden lg:flex"
                      }
                    >
                      <span
                        className={llegando ? "rep-stick rep-stick-llegando" : "rep-stick"}
                        style={estilo}
                      >
                        <Stickman color={COLORES[(posicion * 5 + indice * 2) % COLORES.length]} />
                      </span>
                    </span>
                  );
                })}
              </span>

              {/* Número exacto */}
              <span className="relative self-center text-right">
                {item.cantidad === maximo && maximo > 0 && (
                  <span className="rep-corona absolute -top-4 right-0">
                    <Corona />
                  </span>
                )}
                <strong className="text-lg text-gray-900 sm:text-xl">
                  {item.cantidad.toLocaleString("es-AR")}
                </strong>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        Cada fila es más larga cuantos más clientes nuevos llegaron; el número exacto
        está a la derecha. El último período todavía está en curso: siguen llegando.
      </p>
    </div>
  );
}