import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Scale, Scissors, Store, TicketPercent } from "lucide-react";

import {
  obtenerImpactoPromociones,
  obtenerPromocionesMasUtilizadas,
} from "../../services/reporteService";
import { useSucursalesReporte } from "../../hooks/useSucursalesReporte";
import { useAuth } from "../../context/AuthContext";
import type { ImpactoPromociones, PromocionMasUtilizada } from "../../types/reporte.types";
import CuponesPromo from "./CuponesPromo";
import BalanzaPromo from "./BalanzaPromo";

/* =========================================================
   ESTILOS COMPARTIDOS (los mismos que en las otras secciones)
   ========================================================= */

const ESTILO_TARJETA =
  "rounded-2xl border border-gray-300/80 bg-white shadow-[0_2px_6px_rgba(17,24,39,0.08),0_16px_36px_rgba(17,24,39,0.10)]";

const ESTILO_CONTROL =
  "min-h-11 rounded-xl border border-gray-300 bg-white shadow-[0_1px_3px_rgba(17,24,39,0.12)]";

/* =========================================================
   SUBMENÚ
   ========================================================= */

type PestaniaPromociones = "utilizadas" | "impacto";

const PESTANIAS: {
  id: PestaniaPromociones;
  nombre: string;
  icono: typeof Store;
}[] = [
  { id: "utilizadas", nombre: "Más utilizadas", icono: Scissors },
  { id: "impacto", nombre: "Impacto en ventas", icono: Scale },
];

/* =========================================================
   CARGA DE DATOS
   Recibe la función que pide los datos (armada con useCallback):
   cada vez que cambia (otra sucursal, otro rango…) vuelve a pedirlos.
   ========================================================= */

function useDato<T>(obtenerDatos: () => Promise<T>, inicial: T) {
  const [datos, setDatos] = useState<T>(inicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      setDatos(await obtenerDatos());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los datos.",
      );
    } finally {
      setCargando(false);
    }
  }, [obtenerDatos]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { datos, cargando, error, cargar };
}

/* =========================================================
   TARJETA (encabezado + cargando / error / vacío / contenido)
   ========================================================= */

type TarjetaProps = {
  titulo: string;
  descripcion: string;
  icono: typeof Store;
  acciones?: ReactNode;
  cargando: boolean;
  error: string;
  vacio: boolean;
  textoVacio: string;
  onReintentar: () => void;
  children: ReactNode;
};

function TarjetaPromociones({
  titulo,
  descripcion,
  icono: Icono,
  acciones,
  cargando,
  error,
  vacio,
  textoVacio,
  onReintentar,
  children,
}: TarjetaProps) {
  return (
    <section className={`min-w-0 overflow-hidden ${ESTILO_TARJETA}`}>
      <header className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50/60 p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-200">
          <Icono size={22} />
        </div>

        <div className="min-w-0 flex-1 basis-56">
          <h3 className="font-bold text-gray-900">{titulo}</h3>
          <p className="mt-1 text-sm leading-5 text-gray-500">{descripcion}</p>
        </div>

        {/* En celular el selector baja a su propia línea */}
        {acciones && <div className="w-full sm:w-auto">{acciones}</div>}
      </header>

      {cargando ? (
        <div className="space-y-4 p-5">
          {[1, 2, 3].map((numero) => (
            <div key={numero} className="h-12 animate-pulse rounded-xl bg-gray-100" />
          ))}
          <p className="text-center text-xs text-gray-400">Cargando reporte...</p>
        </div>
      ) : error ? (
        <div className="p-5">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={onReintentar}
            className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Reintentar
          </button>
        </div>
      ) : vacio ? (
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <TicketPercent size={30} className="text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-600">{textoVacio}</p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function ReportesPromociones() {
  const { administrador } = useAuth();

  const [pestania, setPestania] = useState<PestaniaPromociones>("utilizadas");

  // Filtro de sucursal (solo MASTER): el admin de sucursal no pide la lista
  const { sucursales, cargandoSucursales, errorSucursales } = useSucursalesReporte();

  // undefined significa que se seleccionaron todas las sucursales.
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<
    number | undefined
  >(undefined);

  const pedirUtilizadas = useCallback(
    () => obtenerPromocionesMasUtilizadas(sucursalSeleccionada),
    [sucursalSeleccionada],
  );
  const pedirImpacto = useCallback(
    () => obtenerImpactoPromociones(sucursalSeleccionada),
    [sucursalSeleccionada],
  );

  const utilizadas = useDato<PromocionMasUtilizada[]>(pedirUtilizadas, []);
  const impacto = useDato<ImpactoPromociones | null>(pedirImpacto, null);

  const cargandoTodo = utilizadas.cargando || impacto.cargando;

  const actualizarTodo = async () => {
    await Promise.all([utilizadas.cargar(), impacto.cargar()]);
  };

  return (
    <section className="space-y-5">
      {/* Título + filtro de sucursal + Actualizar, en una sola línea */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rendimiento de promociones</h2>
          <p className="mt-1 text-sm text-gray-500">
            Qué promos se usan más y si de verdad mueven las ventas.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {administrador?.rol === "MASTER" && (
            <>
              <label
                htmlFor="filtro-sucursal-promociones"
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
              >
                <Store size={17} className="text-orange-600" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Sucursal</span>
              </label>

              <select
                id="filtro-sucursal-promociones"
                value={sucursalSeleccionada ?? ""}
                onChange={(evento) => {
                  const valor = evento.target.value;
                  setSucursalSeleccionada(valor === "" ? undefined : Number(valor));
                }}
                disabled={cargandoSucursales}
                className={`${ESTILO_CONTROL} min-w-0 flex-1 px-3 text-sm text-gray-800 outline-none transition lg:flex-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50`}
              >
                <option value="">
                  {cargandoSucursales ? "Cargando..." : "Todas las sucursales"}
                </option>

                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            type="button"
            onClick={() => void actualizarTodo()}
            disabled={cargandoTodo}
            className={`${ESTILO_CONTROL} inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <RefreshCw size={16} className={cargandoTodo ? "animate-spin" : ""} />
            {cargandoTodo ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {errorSucursales && (
        <p role="alert" className="text-sm text-red-600">
          {errorSucursales}
        </p>
      )}

      {/* Submenú: 2 pestañas (en celular, a lo ancho y sin íconos) */}
      <div
        role="tablist"
        aria-label="Reportes de promociones"
        className="grid grid-cols-2 gap-1 rounded-2xl border border-gray-300 bg-gray-100 p-1.5 shadow-inner sm:inline-flex"
      >
        {PESTANIAS.map(({ id, nombre, icono: Icono }) => {
          const activa = pestania === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`pestania-promociones-${id}`}
              aria-selected={activa}
              aria-controls="panel-promociones"
              onClick={() => setPestania(id)}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold transition sm:gap-2 sm:px-4 sm:text-sm ${
                activa
                  ? "bg-white text-orange-700 shadow-[0_2px_6px_rgba(17,24,39,0.15)] ring-1 ring-orange-300"
                  : "text-gray-600 hover:bg-white/60 hover:text-orange-700"
              }`}
            >
              <Icono size={17} className="hidden shrink-0 sm:block" />
              <span className="truncate">{nombre}</span>
            </button>
          );
        })}
      </div>

      {/* Panel de la pestaña activa. La "key" repite la animación de entrada. */}
      <div
        key={pestania}
        id="panel-promociones"
        role="tabpanel"
        aria-labelledby={`pestania-promociones-${pestania}`}
        className="rep-subir"
      >
        {pestania === "utilizadas" && (
          <TarjetaPromociones
            titulo="Los cupones recortados"
            descripcion="Cuántas veces se usó cada promo en pedidos entregados. Tocá una para ver su detalle."
            icono={Scissors}
            cargando={utilizadas.cargando}
            error={utilizadas.error}
            vacio={utilizadas.datos.length === 0}
            textoVacio="Todavía no hay pedidos entregados con promo. Desde ahora, cada pedido con promo queda registrado."
            onReintentar={() => void utilizadas.cargar()}
          >
            <CuponesPromo promos={utilizadas.datos} />
          </TarjetaPromociones>
        )}

        {pestania === "impacto" && (
          <TarjetaPromociones
            titulo="La balanza"
            descripcion="El ticket promedio de los pedidos con promo contra los que no usaron ninguna. Pesa más el que gasta más."
            icono={Scale}
            cargando={impacto.cargando}
            error={impacto.error}
            vacio={!impacto.datos || impacto.datos.pedidosConPromo === 0}
            textoVacio="Todavía no hay pedidos entregados con promo para comparar."
            onReintentar={() => void impacto.cargar()}
          >
            {impacto.datos && <BalanzaPromo datos={impacto.datos} />}
          </TarjetaPromociones>
        )}
      </div>
    </section>
  );
}