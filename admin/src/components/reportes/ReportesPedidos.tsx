
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ClipboardList,
  RefreshCw,
  Store,
} from "lucide-react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { obtenerPedidosPorEstado } from "../../services/reporteService";
import { obtenerSucursales } from "../../services/sucursalService";
import type { PedidoPorEstado } from "../../types/reporte.types";
import type { Sucursal } from "../../types/sucursal.types";

function formatearEstado(estado: string): string {
  return estado
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letra) => letra.toLocaleUpperCase("es-AR"));
}

function colorEstado(estado: string): string {
  const normalizado = estado.toLowerCase();

  if (normalizado.includes("entregado")) return "bg-green-500";
  if (normalizado.includes("cancelado")) return "bg-red-500";
  if (normalizado.includes("proceso")) return "bg-orange-500";
  if (normalizado.includes("pendiente")) return "bg-amber-500";
  if (normalizado.includes("camino") || normalizado.includes("env")) {
    return "bg-blue-500";
  }

  return "bg-gray-500";
}

export default function ReportesPedidos() {
  const [pedidos, setPedidos] = useState<PedidoPorEstado[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<number | undefined>(undefined);

  const [cargando, setCargando] = useState(true);
  const [cargandoSucursales, setCargandoSucursales] = useState(true);
  const [error, setError] = useState("");
  const [errorSucursales, setErrorSucursales] = useState("");

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const resultado = await obtenerPedidosPorEstado(sucursalSeleccionada);
      setPedidos(resultado);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los pedidos.",
      );
    } finally {
      setCargando(false);
    }
  }, [sucursalSeleccionada]);

  useEffect(() => {
    void cargarPedidos();
  }, [cargarPedidos]);

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

  const totalPedidos = pedidos.reduce(
    (total, pedido) => total + pedido.cantidad,
    0,
  );

  const cantidadMaxima = Math.max(
    1,
    ...pedidos.map((pedido) => pedido.cantidad),
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Estado de los pedidos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Distribución de los pedidos según su estado actual.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void cargarPedidos()}
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={cargando ? "animate-spin" : ""}
          />
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="filtro-sucursal-pedidos"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
        >
          <Store size={18} className="text-orange-600" />
          Filtrar por sucursal
        </label>

        <select
          id="filtro-sucursal-pedidos"
          value={sucursalSeleccionada ?? ""}
          onChange={(evento) => {
            const valor = evento.target.value;
            setSucursalSeleccionada(
              valor === "" ? undefined : Number(valor),
            );
          }}
          disabled={cargandoSucursales}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 sm:max-w-md"
        >
          <option value="">Todas las sucursales</option>

          {sucursales.map((sucursal) => (
            <option key={sucursal.id} value={sucursal.id}>
              {sucursal.nombre}
            </option>
          ))}
        </select>

        {cargandoSucursales && (
          <p className="mt-2 text-xs text-gray-500">
            Cargando sucursales...
          </p>
        )}

        {errorSucursales && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {errorSucursales}
          </p>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 border-b border-gray-100 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <ClipboardList size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900">
              Pedidos por estado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Cantidad de pedidos registrados en cada estado.
            </p>
          </div>

          {!cargando && !error && (
            <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">
              {totalPedidos.toLocaleString("es-AR")}
            </span>
          )}
        </header>

        {cargando ? (
          <div className="space-y-5 p-5">
            {[1, 2, 3].map((numero) => (
              <div key={numero} className="animate-pulse space-y-2">
                <div className="h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-3 rounded-full bg-gray-100" />
              </div>
            ))}
            <p className="text-center text-xs text-gray-400">
              Cargando reporte...
            </p>
          </div>
        ) : error ? (
          <div className="p-5">
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => void cargarPedidos()}
              className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Reintentar
            </button>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ClipboardList
              size={30}
              className="mx-auto text-gray-300"
            />
            <p className="mt-3 text-sm font-semibold text-gray-700">
              No hay pedidos para mostrar.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Cuando se registren pedidos, sus estados aparecerán acá.
            </p>
          </div>
        ) : (
          
            <div className="h-[320px] w-full sm:h-[380px]">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={pedidos.map((pedido) => ({
        ...pedido,
        nombre: formatearEstado(pedido.estado),
      }))}
      margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={false} />

      <XAxis
        dataKey="nombre"
        tick={{ fontSize: 12 }}
        interval={0}
        angle={-15}
        textAnchor="end"
        height={55}
      />

      <YAxis
        allowDecimals={false}
        width={40}
      />

      <Tooltip
        formatter={(valor) => [
          Number(valor).toLocaleString("es-AR"),
          "Pedidos",
        ]}
      />

      <Bar
        dataKey="cantidad"
        name="Pedidos"
        fill="#ea580c"
        radius={[6, 6, 0, 0]}
        maxBarSize={64}
      />
    </BarChart>
  </ResponsiveContainer>
</div>
          
        )}
      </section>
    </section>
  );
}
