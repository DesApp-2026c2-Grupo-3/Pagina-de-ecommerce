import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Flame,
  RefreshCw,
  ShoppingBag,
  Store,
  Trash2,
  Bike,
} from "lucide-react";

import {
  obtenerCancelacionesPorDia,
  obtenerPedidosPorDia,
  obtenerPedidosPorEstado,
  obtenerPedidosPorSucursal,
  obtenerTiempoPromedioEntrega,
} from "../../services/reporteService";
import { useSucursalesReporte } from "../../hooks/useSucursalesReporte";
import { useAuth } from "../../context/AuthContext";
import type { PeriodoReporte, TiempoPromedioEntrega } from "../../types/reporte.types";
import CintaPedidos from "./CintaPedidos";
import PlanchaPedidos from "./PlanchaPedidos";
import CarreraSucursales from "./CarreraSucursales";
import TachoCancelados from "./TachoCancelados";
import BotonesPeriodo from "./BotonesPeriodo";

/* =========================================================
   ESTILOS COMPARTIDOS (los mismos que en Productos)
   ========================================================= */

const ESTILO_TARJETA =
  "rounded-2xl border border-gray-300/80 bg-white shadow-[0_2px_6px_rgba(17,24,39,0.08),0_16px_36px_rgba(17,24,39,0.10)]";

const ESTILO_CONTROL =
  "min-h-11 rounded-xl border border-gray-300 bg-white shadow-[0_1px_3px_rgba(17,24,39,0.12)]";

/* =========================================================
   SUBMENÚ
   ========================================================= */

type PestaniaPedidos = "estados" | "dia" | "sucursal" | "cancelados";

const PESTANIAS: {
  id: PestaniaPedidos;
  nombre: string;
  icono: typeof ClipboardList;
}[] = [
  { id: "estados", nombre: "Estados", icono: ClipboardList },
  { id: "dia", nombre: "Por día", icono: CalendarDays },
  { id: "sucursal", nombre: "Por sucursal", icono: Store },
  { id: "cancelados", nombre: "Cancelados", icono: Trash2 },
];

/* =========================================================
   CARGA DE DATOS
   Un hook por reporte: datos, cargando, error y recargar.
   Si cambia la sucursal elegida, vuelve a pedir los datos.
   ========================================================= */

type EstadoDato<T> = {
  datos: T;
  cargando: boolean;
  error: string;
  cargar: () => Promise<void>;
};

function useDato<T>(
  obtenerDatos: (sucursalId?: number) => Promise<T>,
  inicial: T,
  sucursalId?: number,
): EstadoDato<T> {
  const [datos, setDatos] = useState<T>(inicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      setDatos(await obtenerDatos(sucursalId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los datos.",
      );
    } finally {
      setCargando(false);
    }
  }, [obtenerDatos, sucursalId]);

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
  icono: typeof ClipboardList;
  rojo?: boolean;
  acciones?: ReactNode; // botones de período (en las tarjetas que los usan)
  cargando: boolean;
  error: string;
  vacio: boolean;
  textoVacio: string;
  onReintentar: () => void;
  children: ReactNode;
};

function TarjetaPedidos({
  titulo,
  descripcion,
  icono: Icono,
  rojo = false,
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
      <header className="flex flex-wrap items-start gap-3 border-b border-gray-200 bg-gray-50/60 p-4 sm:p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${
            rojo ? "bg-red-50 text-red-600 ring-red-200" : "bg-orange-50 text-orange-600 ring-orange-200"
          }`}
        >
          <Icono size={22} />
        </div>

        <div className="min-w-0 flex-1 basis-56">
          <h3 className="font-bold text-gray-900">{titulo}</h3>
          <p className="mt-1 text-sm leading-5 text-gray-500">{descripcion}</p>
        </div>

        {/* En celular los botones bajan a su propia línea */}
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
          <ShoppingBag size={30} className="text-gray-300" />
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

export default function ReportesPedidos() {
  const { administrador } = useAuth();

  const [pestania, setPestania] = useState<PestaniaPedidos>("estados");

  // Filtro de sucursal (solo MASTER): el admin de sucursal no pide la lista
  const { sucursales, cargandoSucursales, errorSucursales } = useSucursalesReporte();

  // undefined significa que se seleccionaron todas las sucursales.
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<
    number | undefined
  >(undefined);

  // Período de la carrera de motos (últimos 30 días al entrar)
  const [periodoCarrera, setPeriodoCarrera] = useState<PeriodoReporte>(30);

  const pedirPorSucursal = useCallback(
    () => obtenerPedidosPorSucursal(periodoCarrera),
    [periodoCarrera],
  );

  const porEstado = useDato(obtenerPedidosPorEstado, [], sucursalSeleccionada);
  const porDia = useDato(obtenerPedidosPorDia, [], sucursalSeleccionada);
  const porSucursal = useDato(pedirPorSucursal, []);
  const cancelaciones = useDato(obtenerCancelacionesPorDia, [], sucursalSeleccionada);
  const tiempoEntrega = useDato<TiempoPromedioEntrega | null>(
    obtenerTiempoPromedioEntrega,
    null,
    sucursalSeleccionada,
  );

  const cargandoTodo =
    porEstado.cargando ||
    porDia.cargando ||
    porSucursal.cargando ||
    cancelaciones.cargando ||
    tiempoEntrega.cargando;

  const actualizarTodo = async () => {
    await Promise.all([
      porEstado.cargar(),
      porDia.cargar(),
      porSucursal.cargar(),
      cancelaciones.cargar(),
      tiempoEntrega.cargar(),
    ]);
  };

  const totalPedidos = porEstado.datos.reduce(
    (total, pedido) => total + pedido.cantidad,
    0,
  );

  return (
    <section className="space-y-5">
      {/* Título + filtro de sucursal + Actualizar, en una sola línea */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rendimiento de pedidos</h2>
          <p className="mt-1 text-sm text-gray-500">
            Cómo se mueven los pedidos: estados, días, sucursales y cancelaciones.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {administrador?.rol === "MASTER" && (
            <>
              <label
                htmlFor="filtro-sucursal-pedidos"
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
              >
                <Store size={17} className="text-orange-600" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Sucursal</span>
              </label>

              <select
                id="filtro-sucursal-pedidos"
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

      {/* Submenú: una tarjeta por vez (grilla 2x2 en celular, fila en pantallas anchas) */}
      <div
        role="tablist"
        aria-label="Reportes de pedidos"
        className="grid grid-cols-2 gap-1 rounded-2xl border border-gray-300 bg-gray-100 p-1.5 shadow-inner sm:inline-flex sm:flex-wrap"
      >
        {PESTANIAS.map(({ id, nombre, icono: Icono }) => {
          const activa = pestania === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`pestania-pedidos-${id}`}
              aria-selected={activa}
              aria-controls="panel-pedidos"
              onClick={() => setPestania(id)}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold transition sm:gap-2 sm:px-4 sm:text-sm ${
                activa
                  ? "bg-white text-orange-700 shadow-[0_2px_6px_rgba(17,24,39,0.15)] ring-1 ring-orange-300"
                  : "text-gray-600 hover:bg-white/60 hover:text-orange-700"
              }`}
            >
              <Icono size={17} className="shrink-0" />
              <span className="truncate">{nombre}</span>
            </button>
          );
        })}
      </div>

      {/* Panel de la pestaña activa. La "key" hace que las animaciones
          de entrada se repitan cada vez que se cambia de pestaña. */}
      <div
        key={pestania}
        id="panel-pedidos"
        role="tabpanel"
        aria-labelledby={`pestania-pedidos-${pestania}`}
        className="rep-subir"
      >
        {pestania === "estados" && (
          <TarjetaPedidos
            titulo="La cinta de pedidos"
            descripcion="En qué etapa está cada pedido y cuánto tardan en llegar. Tocá una estación."
            icono={ShoppingBag}
            cargando={porEstado.cargando || tiempoEntrega.cargando}
            error={porEstado.error || tiempoEntrega.error}
            vacio={totalPedidos === 0}
            textoVacio="Todavía no hay pedidos para mostrar."
            onReintentar={() => {
              void porEstado.cargar();
              void tiempoEntrega.cargar();
            }}
          >
            <CintaPedidos pedidos={porEstado.datos} tiempo={tiempoEntrega.datos} />
          </TarjetaPedidos>
        )}

        {pestania === "dia" && (
          <TarjetaPedidos
            titulo="La plancha"
            descripcion="Cuántos pedidos hubo cada día. Cuanto más caliente la baldosa, más pedidos. Tocá un día."
            icono={Flame}
            cargando={porDia.cargando || cancelaciones.cargando}
            error={porDia.error || cancelaciones.error}
            vacio={porDia.datos.length === 0}
            textoVacio="Todavía no hay pedidos para mostrar."
            onReintentar={() => {
              void porDia.cargar();
              void cancelaciones.cargar();
            }}
          >
            <PlanchaPedidos dias={porDia.datos} cancelaciones={cancelaciones.datos} />
          </TarjetaPedidos>
        )}

        {pestania === "sucursal" && (
          <TarjetaPedidos
            titulo="La carrera de motos"
            descripcion="Cuántos pedidos recibió cada sucursal. Tocá una moto."
            icono={Bike}
            acciones={<BotonesPeriodo valor={periodoCarrera} onCambiar={setPeriodoCarrera} />}
            cargando={porSucursal.cargando}
            error={porSucursal.error}
            vacio={porSucursal.datos.length === 0}
            textoVacio="No hay pedidos de las sucursales en este período."
            onReintentar={() => void porSucursal.cargar()}
          >
            <CarreraSucursales
              sucursales={porSucursal.datos}
              sucursalSeleccionada={sucursalSeleccionada ?? administrador?.sucursal?.id}
            />
          </TarjetaPedidos>
        )}

        {pestania === "cancelados" && (
          <TarjetaPedidos
            titulo="El tacho de cancelados"
            descripcion="Cuántos pedidos se cancelan y qué días pasó más. Tocá el tacho o un día."
            icono={Trash2}
            rojo
            cargando={porEstado.cargando || cancelaciones.cargando}
            error={porEstado.error || cancelaciones.error}
            vacio={totalPedidos === 0}
            textoVacio="Todavía no hay pedidos para mostrar."
            onReintentar={() => {
              void porEstado.cargar();
              void cancelaciones.cargar();
            }}
          >
            <TachoCancelados pedidos={porEstado.datos} cancelaciones={cancelaciones.datos} />
          </TarjetaPedidos>
        )}
      </div>
    </section>
  );
}