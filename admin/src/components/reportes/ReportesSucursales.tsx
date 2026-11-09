import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, ClipboardList, CupSoda, RefreshCw, Store, UtensilsCrossed } from "lucide-react";

import {
  obtenerPedidosAtendidosPorSucursal,
  obtenerProductosPorSucursal,
  obtenerVentasPorSucursal,
} from "../../services/reporteService";
import type {
  MesVentas,
  PedidosAtendidosSucursal,
  PeriodoReporte,
  ProductosDeSucursal,
  VentasPorSucursal,
} from "../../types/reporte.types";
import VasosMeta from "./VasosMeta";
import BandejaSucursal from "./BandejaSucursal";
import RielComandas from "./RielComandas";
import BotonesPeriodo from "./BotonesPeriodo";

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

type PestaniaSucursales = "ventas" | "productos" | "atendidos";

const PESTANIAS: {
  id: PestaniaSucursales;
  nombre: string;
  icono: typeof Store;
}[] = [
  { id: "ventas", nombre: "Ventas", icono: CupSoda },
  { id: "productos", nombre: "Productos", icono: UtensilsCrossed },
  { id: "atendidos", nombre: "Pedidos atendidos", icono: ClipboardList },
];

/* Nombre del mes actual o del anterior ("octubre", "noviembre") */
function nombreDeMes(desplazamiento: number) {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth() + desplazamiento, 15).toLocaleDateString(
    "es-AR",
    { month: "long" },
  );
}

const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/* =========================================================
   CARGA DE DATOS
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
   SELECTOR CHICO
   ========================================================= */

function Selector<T extends string>({
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
  icono: typeof Store;
  acciones?: ReactNode;
  cargando: boolean;
  error: string;
  vacio: boolean;
  textoVacio: string;
  onReintentar: () => void;
  children: ReactNode;
};

function TarjetaSucursales({
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
          <Store size={30} className="text-gray-300" />
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
   No tiene filtro de sucursal: esta sección compara las
   sucursales entre sí. El admin de sucursal recibe solo la suya.
   ========================================================= */

export default function ReportesSucursales() {
  const [pestania, setPestania] = useState<PestaniaSucursales>("ventas");
  const [mes, setMes] = useState<MesVentas>("anterior");

  // Período de la bandeja (últimos 30 días al entrar)
  const [periodoBandeja, setPeriodoBandeja] = useState<PeriodoReporte>(30);

  /* Nombres de los meses para el selector (se calculan una sola vez) */
  const [meses] = useState(() => ({
    anterior: nombreDeMes(-1),
    actual: nombreDeMes(0),
  }));

  const opcionesMes: { valor: MesVentas; nombre: string }[] = [
    { valor: "anterior", nombre: conMayuscula(meses.anterior) },
    { valor: "actual", nombre: `${conMayuscula(meses.actual)} (en curso)` },
  ];

  const pedirVentas = useCallback(() => obtenerVentasPorSucursal(mes), [mes]);
  const pedirProductos = useCallback(
    () => obtenerProductosPorSucursal(periodoBandeja),
    [periodoBandeja],
  );

  const ventas = useDato<VentasPorSucursal | null>(pedirVentas, null);
  const productos = useDato<ProductosDeSucursal[]>(pedirProductos, []);
  const atendidos = useDato<PedidosAtendidosSucursal[]>(obtenerPedidosAtendidosPorSucursal, []);

  const cargandoTodo = ventas.cargando || productos.cargando || atendidos.cargando;

  const actualizarTodo = async () => {
    await Promise.all([ventas.cargar(), productos.cargar(), atendidos.cargar()]);
  };

  const descripcionVentas =
    mes === "anterior"
      ? `La meta de ${meses.anterior} era superar lo vendido el mes anterior. Si la pasó, el vaso rebalsa. Tocá un vaso.`
      : `La meta es vender lo mismo que en ${meses.anterior}. El vaso se llena con lo que lleva vendido en ${meses.actual}. Tocá un vaso.`;

  return (
    <section className="space-y-5">
      {/* Título + Actualizar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rendimiento de sucursales</h2>
          <p className="mt-1 text-sm text-gray-500">
            Cuánto vende cada una, qué sale más y cómo atiende los pedidos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void actualizarTodo()}
          disabled={cargandoTodo}
          className={`${ESTILO_CONTROL} inline-flex items-center justify-center gap-2 self-start px-4 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto`}
        >
          <RefreshCw size={16} className={cargandoTodo ? "animate-spin" : ""} />
          {cargandoTodo ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Submenú: 3 pestañas (en celular, a lo ancho y sin íconos) */}
      <div
        role="tablist"
        aria-label="Reportes de sucursales"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-gray-300 bg-gray-100 p-1.5 shadow-inner sm:inline-flex"
      >
        {PESTANIAS.map(({ id, nombre, icono: Icono }) => {
          const activa = pestania === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`pestania-sucursales-${id}`}
              aria-selected={activa}
              aria-controls="panel-sucursales"
              onClick={() => setPestania(id)}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold leading-tight transition sm:gap-2 sm:px-4 sm:text-sm ${
                activa
                  ? "bg-white text-orange-700 shadow-[0_2px_6px_rgba(17,24,39,0.15)] ring-1 ring-orange-300"
                  : "text-gray-600 hover:bg-white/60 hover:text-orange-700"
              }`}
            >
              <Icono size={17} className="hidden shrink-0 sm:block" />
              <span className="text-center">{nombre}</span>
            </button>
          );
        })}
      </div>

      {/* Panel de la pestaña activa. La "key" repite la animación de entrada. */}
      <div
        key={pestania}
        id="panel-sucursales"
        role="tabpanel"
        aria-labelledby={`pestania-sucursales-${pestania}`}
        className="rep-subir"
      >
        {pestania === "ventas" && (
          <TarjetaSucursales
            titulo="Los vasos de la meta"
            descripcion={descripcionVentas}
            icono={CupSoda}
            acciones={
              <Selector etiqueta="Qué mes mirar" opciones={opcionesMes} valor={mes} onCambiar={setMes} />
            }
            cargando={ventas.cargando}
            error={ventas.error}
            vacio={!ventas.datos || ventas.datos.sucursales.length === 0}
            textoVacio="Todavía no hay ventas entregadas para comparar."
            onReintentar={() => void ventas.cargar()}
          >
            {ventas.datos && <VasosMeta key={mes} datos={ventas.datos} />}
          </TarjetaSucursales>
        )}

        {pestania === "productos" && (
          <TarjetaSucursales
            titulo="La bandeja de cada sucursal"
            descripcion="Los 5 productos que más se venden en cada sucursal. Elegí una para servir su bandeja."
            icono={UtensilsCrossed}
            acciones={<BotonesPeriodo valor={periodoBandeja} onCambiar={setPeriodoBandeja} />}
            cargando={productos.cargando}
            error={productos.error}
            vacio={productos.datos.length === 0}
            textoVacio="No hay productos vendidos en este período."
            onReintentar={() => void productos.cargar()}
          >
            <BandejaSucursal sucursales={productos.datos} />
          </TarjetaSucursales>
        )}

        {pestania === "atendidos" && (
          <TarjetaSucursales
            titulo="El riel de comandas"
            descripcion="Cuántos pedidos entregó cada sucursal en los últimos 30 días y cuánto tardó en promedio."
            icono={ClipboardList}
            cargando={atendidos.cargando}
            error={atendidos.error}
            vacio={atendidos.datos.length === 0}
            textoVacio="No hubo pedidos entregados en los últimos 30 días."
            onReintentar={() => void atendidos.cargar()}
          >
            <RielComandas filas={atendidos.datos} />
          </TarjetaSucursales>
        )}
      </div>
    </section>
  );
}