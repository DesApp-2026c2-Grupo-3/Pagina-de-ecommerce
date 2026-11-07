import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Mail,
  RefreshCw,
  Stamp,
  Store,
  UserPlus,
  Users,
} from "lucide-react";

import {
  obtenerClientesInactivos,
  obtenerClientesMasPedidos,
  obtenerClientesNuevos,
} from "../../services/reporteService";
import { obtenerSucursales } from "../../services/sucursalService";
import { useAuth } from "../../context/AuthContext";
import type { Sucursal } from "../../types/sucursal.types";
import type {
  ClienteInactivo,
  ClienteMasPedidos,
  ClientesNuevosPorPeriodo,
  PeriodoClientes,
  PeriodoReporte,
} from "../../types/reporte.types";
import TarjetaSellos from "./TarjetaSellos";
import FilaClientesNuevos from "./FilaClientesNuevos";
import BuzonInactivos from "./buzonInactivos";
import BotonesPeriodo from "./BotonesPeriodo";

/* =========================================================
   ESTILOS COMPARTIDOS (los mismos que en Productos y Pedidos)
   ========================================================= */

const ESTILO_TARJETA =
  "rounded-2xl border border-gray-300/80 bg-white shadow-[0_2px_6px_rgba(17,24,39,0.08),0_16px_36px_rgba(17,24,39,0.10)]";

const ESTILO_CONTROL =
  "min-h-11 rounded-xl border border-gray-300 bg-white shadow-[0_1px_3px_rgba(17,24,39,0.12)]";

/* =========================================================
   SUBMENÚ Y OPCIONES
   ========================================================= */

type PestaniaClientes = "mas" | "nuevos" | "inactivos";

const PESTANIAS: {
  id: PestaniaClientes;
  nombre: string;
  icono: typeof Users;
}[] = [
  { id: "mas", nombre: "Más pedidos", icono: Stamp },
  { id: "nuevos", nombre: "Nuevos", icono: UserPlus },
  { id: "inactivos", nombre: "Inactivos", icono: Mail },
];

const PERIODOS: { valor: PeriodoClientes; nombre: string }[] = [
  { valor: "mes", nombre: "Por mes" },
  { valor: "semana", nombre: "Por semana" },
];

const DIAS: { valor: number; nombre: string }[] = [
  { valor: 30, nombre: "30 días" },
  { valor: 60, nombre: "60 días" },
  { valor: 90, nombre: "90 días" },
];

/* Cómo se nombra el período en los textos de la tarjeta */
const textoPeriodo = (periodo: PeriodoReporte) =>
  periodo === 7
    ? "en los últimos 7 días"
    : periodo === 30
      ? "en los últimos 30 días"
      : periodo === 365
        ? "en los últimos 12 meses"
        : "desde siempre";

/* =========================================================
   CARGA DE DATOS
   Recibe la función que pide los datos (armada con useCallback):
   cada vez que cambia (otra sucursal, otro período…) vuelve a pedirlos.
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
   SELECTOR CHICO (Por mes / Por semana, 30 / 60 / 90 días)
   ========================================================= */

function Selector<T extends string | number>({
  etiqueta,
  opciones,
  valor,
  onCambiar,
}: {
  etiqueta: string;
  opciones: { valor: T; nombre: string }[];
  valor: T;
  onCambiar: (valor: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className="flex gap-1 rounded-xl bg-gray-100 p-1 ring-1 ring-gray-300"
    >
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor;

        return (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={activa}
            onClick={() => onCambiar(opcion.valor)}
            className={`min-h-9 rounded-lg px-3 text-[13px] font-semibold whitespace-nowrap transition ${
              activa
                ? "bg-white text-orange-700 shadow-[0_1px_4px_rgba(17,24,39,0.15)]"
                : "text-gray-600 hover:text-orange-700"
            }`}
          >
            {opcion.nombre}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   TARJETA (encabezado + cargando / error / vacío / contenido)
   ========================================================= */

type TarjetaProps = {
  titulo: string;
  descripcion: string;
  icono: typeof Users;
  acciones?: ReactNode;
  cargando: boolean;
  error: string;
  vacio: boolean;
  textoVacio: string;
  onReintentar: () => void;
  children: ReactNode;
};

function TarjetaClientes({
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
          <Users size={30} className="text-gray-300" />
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

export default function ReportesClientes() {
  const { administrador } = useAuth();

  const [pestania, setPestania] = useState<PestaniaClientes>("mas");
  // Período de "Más pedidos" (últimos 30 días al entrar)
  const [periodoRanking, setPeriodoRanking] = useState<PeriodoReporte>(30);
  const [periodo, setPeriodo] = useState<PeriodoClientes>("mes");
  const [dias, setDias] = useState(60);

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargandoSucursales, setCargandoSucursales] = useState(true);
  const [errorSucursales, setErrorSucursales] = useState("");

  // undefined significa que se seleccionaron todas las sucursales.
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        setErrorSucursales("");
        const resultado = await obtenerSucursales();
        setSucursales(resultado.filter((sucursal) => sucursal.activa));
      } catch (err) {
        setErrorSucursales(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las sucursales.",
        );
      } finally {
        setCargandoSucursales(false);
      }
    };

    void cargarSucursales();
  }, []);

  /* Cada reporte con sus propios parámetros */
  const pedirMasPedidos = useCallback(
    () => obtenerClientesMasPedidos(periodoRanking, sucursalSeleccionada),
    [periodoRanking, sucursalSeleccionada],
  );
  const pedirNuevos = useCallback(
    () => obtenerClientesNuevos(periodo, sucursalSeleccionada),
    [periodo, sucursalSeleccionada],
  );
  const pedirInactivos = useCallback(
    () => obtenerClientesInactivos(dias, sucursalSeleccionada),
    [dias, sucursalSeleccionada],
  );

  const masPedidos = useDato<ClienteMasPedidos[]>(pedirMasPedidos, []);
  const nuevos = useDato<ClientesNuevosPorPeriodo[]>(pedirNuevos, []);
  const inactivos = useDato<ClienteInactivo[]>(pedirInactivos, []);

  const cargandoTodo = masPedidos.cargando || nuevos.cargando || inactivos.cargando;

  const actualizarTodo = async () => {
    await Promise.all([masPedidos.cargar(), nuevos.cargar(), inactivos.cargar()]);
  };

  return (
    <section className="space-y-5">
      {/* Título + filtro de sucursal + Actualizar, en una sola línea */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rendimiento de clientes</h2>
          <p className="mt-1 text-sm text-gray-500">
            Quiénes piden más, cuántos se suman y quiénes dejaron de pedir.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {administrador?.rol === "MASTER" && (
            <>
              <label
                htmlFor="filtro-sucursal-clientes"
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
              >
                <Store size={17} className="text-orange-600" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Sucursal</span>
              </label>

              <select
                id="filtro-sucursal-clientes"
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

      {/* Submenú: 3 pestañas (en celular, a lo ancho) */}
      <div
        role="tablist"
        aria-label="Reportes de clientes"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-gray-300 bg-gray-100 p-1.5 shadow-inner sm:inline-flex"
      >
        {PESTANIAS.map(({ id, nombre, icono: Icono }) => {
          const activa = pestania === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`pestania-clientes-${id}`}
              aria-selected={activa}
              aria-controls="panel-clientes"
              onClick={() => setPestania(id)}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold transition sm:gap-2 sm:px-4 sm:text-sm ${
                activa
                  ? "bg-white text-orange-700 shadow-[0_2px_6px_rgba(17,24,39,0.15)] ring-1 ring-orange-300"
                  : "text-gray-600 hover:bg-white/60 hover:text-orange-700"
              }`}
            >
              {/* En celular se oculta el ícono para que entre el texto */}
              <Icono size={17} className="hidden shrink-0 sm:block" />
              <span className="truncate">{nombre}</span>
            </button>
          );
        })}
      </div>

      {/* Panel de la pestaña activa. La "key" repite la animación de entrada. */}
      <div
        key={pestania}
        id="panel-clientes"
        role="tabpanel"
        aria-labelledby={`pestania-clientes-${pestania}`}
        className="rep-subir"
      >
        {pestania === "mas" && (
          <TarjetaClientes
            titulo="La tarjeta de sellos"
            descripcion={`Los clientes que más pedidos hicieron ${textoPeriodo(periodoRanking)}. Tocá un cliente.`}
            icono={Stamp}
            acciones={<BotonesPeriodo valor={periodoRanking} onCambiar={setPeriodoRanking} />}
            cargando={masPedidos.cargando}
            error={masPedidos.error}
            vacio={masPedidos.datos.length === 0}
            textoVacio={`No hay pedidos entregados ${textoPeriodo(periodoRanking)}.`}
            onReintentar={() => void masPedidos.cargar()}
          >
            <TarjetaSellos
              key={String(periodoRanking)}
              clientes={masPedidos.datos}
              periodo={periodoRanking}
            />
          </TarjetaClientes>
        )}

        {pestania === "nuevos" && (
          <TarjetaClientes
            titulo="Los que llegaron"
            descripcion="Cuántos clientes hicieron su primer pedido en cada período. Tocá un período."
            icono={UserPlus}
            acciones={
              <Selector etiqueta="Agrupar por" opciones={PERIODOS} valor={periodo} onCambiar={setPeriodo} />
            }
            cargando={nuevos.cargando}
            error={nuevos.error}
            vacio={nuevos.datos.every((item) => item.cantidad === 0)}
            textoVacio="Todavía no hay clientes nuevos en estos períodos."
            onReintentar={() => void nuevos.cargar()}
          >
            <FilaClientesNuevos key={periodo} periodos={nuevos.datos} periodo={periodo} />
          </TarjetaClientes>
        )}

        {pestania === "inactivos" && (
          <TarjetaClientes
            titulo={'El buzón de "te extrañamos"'}
            descripcion="Clientes que dejaron de pedir. Tocá un sobre para ver la notificación que le llegaría."
            icono={Mail}
            acciones={
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-gray-700">Sin pedir hace más de</span>
                <Selector etiqueta="Sin pedir hace más de" opciones={DIAS} valor={dias} onCambiar={setDias} />
              </div>
            }
            cargando={inactivos.cargando}
            error={inactivos.error}
            vacio={inactivos.datos.length === 0}
            textoVacio={`¡Bien! No hay clientes que lleven más de ${dias} días sin pedir.`}
            onReintentar={() => void inactivos.cargar()}
          >
            <BuzonInactivos key={dias} clientes={inactivos.datos} dias={dias} />
          </TarjetaClientes>
        )}
      </div>
    </section>
  );
}