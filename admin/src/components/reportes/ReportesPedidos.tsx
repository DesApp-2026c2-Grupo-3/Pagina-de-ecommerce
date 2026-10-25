
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ClipboardList,
  RefreshCw,
  Store,
  Clock3
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

import { obtenerPedidosPorEstado, obtenerPedidosPorDia, obtenerPedidosPorSucursal, obtenerCancelacionesPorDia, obtenerTiempoPromedioEntrega} from "../../services/reporteService";
import { obtenerSucursales } from "../../services/sucursalService";
import type { PedidoPorEstado, PedidoPorDia, PedidoPorSucursal,CancelacionPorDia, TiempoPromedioEntrega } from "../../types/reporte.types";
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

function completarDiasSinCancelaciones( datos: CancelacionPorDia[]): CancelacionPorDia[] {
  const cantidades = new Map(
    datos.map((dato) => [dato.fecha.slice(0, 10), dato.cantidad]),
  );

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const resultado: CancelacionPorDia[] = [];

  for (let i = 29; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const fechaISO = `${anio}-${mes}-${dia}`;

    resultado.push({
      fecha: fechaISO,
      cantidad: cantidades.get(fechaISO) ?? 0,
    });
  }

  return resultado;
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

  const [pedidosPorSucursal, setPedidosPorSucursal] = useState<PedidoPorSucursal[]>([]);
  const [cargandoPorSucursal, setCargandoPorSucursal] = useState(true);
  const [errorPorSucursal, setErrorPorSucursal] = useState("");

  const [cancelacionesPorDia, setCancelacionesPorDia] =
  useState<CancelacionPorDia[]>([]);
  const [cargandoCancelaciones, setCargandoCancelaciones] = useState(true);
  const [errorCancelaciones, setErrorCancelaciones] = useState("");

  const [tiempoEntrega, setTiempoEntrega] =
  useState<TiempoPromedioEntrega | null>(null);
  const [cargandoTiempoEntrega, setCargandoTiempoEntrega] = useState(true);
  const [errorTiempoEntrega, setErrorTiempoEntrega] = useState("");

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

  
  const cargarPedidosPorSucursal = useCallback(async () => {
    setCargandoPorSucursal(true);
    setErrorPorSucursal("");

    try {
      const resultado = await obtenerPedidosPorSucursal();
      setPedidosPorSucursal(resultado);
    } catch (err) {
      setErrorPorSucursal(
        err instanceof Error
         ? err.message
         : "No se pudieron cargar los pedidos por sucursal.",
      );
    } finally {
     setCargandoPorSucursal(false);
    }
  }, []);


  const cargarCancelacionesPorDia = useCallback(async () => {
    setCargandoCancelaciones(true);
    setErrorCancelaciones("");

    try {
      const resultado = await obtenerCancelacionesPorDia(sucursalSeleccionada);
      setCancelacionesPorDia(resultado);
    } catch (err) {
      setErrorCancelaciones(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las cancelaciones por día.",
      );
    } finally {
      setCargandoCancelaciones(false);
    }
  }, [sucursalSeleccionada]);

  const cargarTiempoEntrega = useCallback(async () => {
    setCargandoTiempoEntrega(true);
    setErrorTiempoEntrega("");

    try {
      const resultado = await obtenerTiempoPromedioEntrega(
        sucursalSeleccionada
      );
      setTiempoEntrega(resultado);
    } catch (err) {
      setErrorTiempoEntrega(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el tiempo promedio de entrega."
      );
    } finally {
      setCargandoTiempoEntrega(false);
    }
  }, [sucursalSeleccionada]);


  useEffect(() => {
    void cargarPedidosPorSucursal();
  }, [cargarPedidosPorSucursal]);

  useEffect(() => {
    void cargarPedidos();
  }, [cargarPedidos]);

  useEffect(() => {
    void cargarPedidosPorDia();
  }, [cargarPedidosPorDia]);

  useEffect(() => {
    void cargarCancelacionesPorDia();
  }, [cargarCancelacionesPorDia]);

  useEffect(() => {
    void cargarTiempoEntrega();
  }, [cargarTiempoEntrega]);

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
          onClick={() => {void cargarPedidos(); void cargarPedidosPorDia(); void cargarPedidosPorSucursal(); void cargarCancelacionesPorDia(), void cargarTiempoEntrega()}}
          disabled={cargando || cargandoPorDia || cargandoPorSucursal || cargandoCancelaciones || cargandoTiempoEntrega }
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={ cargando || cargandoPorDia || cargandoPorSucursal || cargandoCancelaciones || cargandoTiempoEntrega ? "animate-spin" : ""}
          />
          {cargando || cargandoPorDia || cargandoPorSucursal || cargandoCancelaciones || cargandoTiempoEntrega ? "Actualizando..." : "Actualizar"}
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Clock3 size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900">
            Tiempo promedio de entrega
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Tiempo desde la creación del pedido hasta su entrega.
          </p>
        </div>
      </header>

      {cargandoTiempoEntrega ? (
        <div className="p-10 text-center text-sm text-gray-500">
          Calculando tiempo promedio...
        </div>
        ) : errorTiempoEntrega ? (
        <div className="p-5">
          <div role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={18} className="shrink-0" />
            <p>{errorTiempoEntrega}</p>
          </div>

          <button type="button" onClick={() => void cargarTiempoEntrega()}
          className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Reintentar
          </button>
        </div>
        ) : tiempoEntrega?.promedioMinutos == null ? (
        <div className="p-8 text-center">
          <Clock3 size={30} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm font-semibold text-gray-700">
            Todavía no hay entregas para calcular el promedio.
          </p>
        </div>
        ) : (
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Promedio total de entrega
            </p>

            <p className="mt-1 text-4xl font-bold tracking-tight text-gray-900">
              {tiempoEntrega.promedioMinutos >= 60 
              ? `${Math.floor(tiempoEntrega.promedioMinutos / 60)} h ${Math.round(tiempoEntrega.promedioMinutos % 60)} min`
              : `${tiempoEntrega.promedioMinutos.toLocaleString("es-AR", {
                  maximumFractionDigits: 1,
                })} min`}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-700">
              Pedidos entregados analizados
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">
              {tiempoEntrega.cantidadPedidos.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
        )
      }
    </section>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

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


      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <header className="flex items-center gap-3 border-b border-gray-100 p-5">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
      <Store size={22} />
    </div>

    <div className="min-w-0 flex-1">
      <h3 className="font-bold text-gray-900">
        Pedidos por sucursal
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Comparación de la cantidad de pedidos recibidos por sucursal.
      </p>
    </div>

    {!cargandoPorSucursal && !errorPorSucursal && (
      <span className="shrink-0 rounded-full bg-purple-50 px-3 py-1 text-sm font-bold text-purple-700">
        {pedidosPorSucursal.reduce(
          (total, pedido) => total + pedido.cantidad,
          0,
        ).toLocaleString("es-AR")} pedidos
      </span>
    )}
  </header>

  {cargandoPorSucursal ? (
    <div className="p-10 text-center text-sm text-gray-500">
      Cargando pedidos por sucursal...
    </div>
  ) : errorPorSucursal ? (
    <div className="p-5">
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
      >
        <AlertCircle size={18} className="shrink-0" />
        <p>{errorPorSucursal}</p>
      </div>

      <button
        type="button"
        onClick={() => void cargarPedidosPorSucursal()}
        className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
      >
        Reintentar
      </button>
    </div>
  ) : pedidosPorSucursal.length === 0 ? (
    <div className="px-5 py-12 text-center">
      <Store size={30} className="mx-auto text-gray-300" />
      <p className="mt-3 text-sm font-semibold text-gray-700">
        No hay pedidos para mostrar.
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Cuando las sucursales reciban pedidos, aparecerán acá.
      </p>
    </div>
  ) : (
    <div className="h-[320px] w-full p-3 sm:h-[380px] sm:p-5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={pedidosPorSucursal}
          layout="vertical"
          margin={{ top: 8, right: 20, left: 12, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />

          <XAxis
            type="number"
            allowDecimals={false}
          />

          <YAxis
            type="category"
            dataKey="nombre"
            width={110}
            tick={{ fontSize: 12 }}
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
            fill="#9333ea"
            radius={[0, 6, 6, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
      </section>


      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <header className="flex items-center gap-3 border-b border-gray-100 p-5">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
      <AlertCircle size={22} />
    </div>

    <div className="min-w-0 flex-1">
      <h3 className="font-bold text-gray-900">
        Cancelaciones por día
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Evolución diaria de los pedidos cancelados durante los últimos 30 días.
      </p>
    </div>

    {!cargandoCancelaciones && !errorCancelaciones && (
      <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700">
        {cancelacionesPorDia
          .reduce((total, item) => total + item.cantidad, 0)
          .toLocaleString("es-AR")} cancelaciones
      </span>
    )}
  </header>

  {cargandoCancelaciones ? (
    <div className="p-10 text-center text-sm text-gray-500">
      Cargando cancelaciones...
    </div>
  ) : errorCancelaciones ? (
    <div className="p-5">
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
      >
        <AlertCircle size={18} className="shrink-0" />
        <p>{errorCancelaciones}</p>
      </div>

      <button
        type="button"
        onClick={() => void cargarCancelacionesPorDia()}
        className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
      >
        Reintentar
      </button>
    </div>
  ) : (
    <>
      {cancelacionesPorDia.every((item) => item.cantidad === 0) && (
        <p className="px-5 pt-4 text-sm text-gray-500">
          No hubo cancelaciones registradas en los últimos 30 días.
        </p>
      )}

      <div className="h-[320px] w-full p-3 sm:h-[380px] sm:p-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={completarDiasSinCancelaciones(cancelacionesPorDia).map(
              (item) => ({
                ...item,
                fechaFormateada: formatearFecha(item.fecha),
              }),
            )}
            margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="fechaFormateada"
              tick={{ fontSize: 12 }}
              minTickGap={20}
            />

            <YAxis allowDecimals={false} width={40} />

            <Tooltip
              labelFormatter={(_, datos) => {
                const fecha = datos?.[0]?.payload?.fecha;

                return fecha
                  ? new Date(
                      `${String(fecha).slice(0, 10)}T12:00:00`,
                    ).toLocaleDateString("es-AR")
                  : "Fecha";
              }}
              formatter={(valor) => [
                Number(valor).toLocaleString("es-AR"),
                "Cancelaciones",
              ]}
            />

            <Bar
              dataKey="cantidad"
              name="Cancelaciones"
              fill="#dc2626"
              radius={[5, 5, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )}
      </section>
    
    </div>

  </section>
  );
}
