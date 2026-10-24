
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

import { obtenerPedidosPorEstado, obtenerPedidosPorDia } from "../../services/reporteService";
import { obtenerSucursales } from "../../services/sucursalService";
import type { PedidoPorEstado, PedidoPorDia } from "../../types/reporte.types";
import type { Sucursal } from "../../types/sucursal.types";

function formatearEstado(estado: string): string {
  return estado
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letra) => letra.toLocaleUpperCase("es-AR"));
}

function formatearFecha(fecha: string): string {
  const fechaCorta = fecha.slice(0, 10);
  const [anio, mes, dia] = fechaCorta.split("-");

  return `${dia}/${mes}`;
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

  const [pedidosPorDia, setPedidosPorDia] = useState<PedidoPorDia[]>([]);
  const [cargandoPorDia, setCargandoPorDia] = useState(true);
  const [errorPorDia, setErrorPorDia] = useState("");

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

  
  const cargarPedidosPorDia = useCallback(async () => {
    setCargandoPorDia(true);
    setErrorPorDia("");

    try {
    const resultado = await obtenerPedidosPorDia(sucursalSeleccionada);
    setPedidosPorDia(resultado);
    } catch (err) {
      setErrorPorDia(
        err instanceof Error
        ? err.message
        : "No se pudieron cargar los pedidos por día.",
    );
    } finally {
      setCargandoPorDia(false);
    }
  }, [sucursalSeleccionada]);


  useEffect(() => {
    void cargarPedidos();
  }, [cargarPedidos]);

  useEffect(() => {
    void cargarPedidosPorDia();
  }, [cargarPedidosPorDia]);

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
          onClick={() => {void cargarPedidos(); void cargarPedidosPorDia()}}
          disabled={cargando || cargandoPorDia}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={cargando ? "animate-spin" : ""}
          />
          {cargando || cargandoPorDia ? "Actualizando..." : "Actualizar"}
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

      
<section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <header className="flex items-center gap-3 border-b border-gray-100 p-5">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <ClipboardList size={22} />
    </div>

    <div className="min-w-0 flex-1">
      <h3 className="font-bold text-gray-900">
        Pedidos por día
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Evolución de la cantidad de pedidos registrados por fecha.
      </p>
    </div>

    {!cargandoPorDia && !errorPorDia && (
      <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
        {pedidosPorDia.reduce(
          (total, pedido) => total + pedido.cantidad,
          0,
        ).toLocaleString("es-AR")} pedidos
      </span>
    )}
  </header>

  {cargandoPorDia ? (
    <div className="p-10 text-center text-sm text-gray-500">
      Cargando pedidos por día...
    </div>
  ) : errorPorDia ? (
    <div className="p-5">
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
      >
        <AlertCircle size={18} className="shrink-0" />
        <p>{errorPorDia}</p>
      </div>

      <button
        type="button"
        onClick={() => void cargarPedidosPorDia()}
        className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
      >
        Reintentar
      </button>
    </div>
  ) : pedidosPorDia.length === 0 ? (
    <div className="px-5 py-12 text-center">
      <ClipboardList size={30} className="mx-auto text-gray-300" />
      <p className="mt-3 text-sm font-semibold text-gray-700">
        No hay pedidos para mostrar.
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Cuando se registren pedidos, su evolución aparecerá acá.
      </p>
    </div>
  ) : (
    <div className="h-[320px] w-full p-3 sm:h-[380px] sm:p-5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={pedidosPorDia.map((pedido) => ({
            ...pedido,
            fechaFormateada: formatearFecha(pedido.fecha),
          }))}
          margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="fechaFormateada"
            tick={{ fontSize: 12 }}
            minTickGap={20}
          />

          <YAxis
            allowDecimals={false}
            width={40}
          />

          <Tooltip
            labelFormatter={(_, datos) => {
              const fecha = datos?.[0]?.payload?.fecha;

              return fecha
                ? new Date(`${String(fecha).slice(0, 10)}T12:00:00`).toLocaleDateString("es-AR")
                : "Fecha";
            }}
            formatter={(valor) => [
              Number(valor).toLocaleString("es-AR"),
              "Pedidos",
            ]}
          />

          <Bar
            dataKey="cantidad"
            name="Pedidos"
            fill="#2563eb"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</section>


    </section>
  );
}
