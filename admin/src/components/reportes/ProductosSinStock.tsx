
import { useCallback, useEffect, useState } from "react";
import type { ProductoSinStock } from "../../types/reporte.types";
import { obtenerProductosSinStock } from "../../services/reporteService";
import { useAuth } from "../../context/AuthContext";
import { obtenerSucursales } from "../../services/sucursalService";
import Paginacion from "../Paginacion";

interface Sucursal {
  id: number;
  nombre: string;
}

const API_BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:3000";

export default function ProductosSinStock() {
  const { administrador } = useAuth();
  const [productos, setProductos] = useState<ProductoSinStock[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("todas");
  const [errorSucursales, setErrorSucursales] = useState("");
  const [productosTodasSucursales, setProductosTodasSucursales] = useState<ProductoSinStock[]>([]);
  const [cargandoGrafico, setCargandoGrafico] = useState(true);
  const [errorGrafico, setErrorGrafico] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 5;


    useEffect(() => {
  if (administrador?.rol !== "MASTER") {
    return;
  }

  obtenerSucursales()
    .then((datos: Sucursal[]) => {
      setSucursales(datos);
    })
    .catch((err: unknown) => {
      setErrorSucursales(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las sucursales",
      );
    });
}, [administrador?.rol]);

useEffect(() => {
  if (administrador?.rol !== "MASTER") {
    return;
  }

  let cancelado = false;

  async function cargarDatosGrafico() {
    setCargandoGrafico(true);
    setErrorGrafico("");

    try {
      const datos = await obtenerProductosSinStock();

      if (!cancelado) {
        setProductosTodasSucursales(datos);
      }
    } catch (err) {
      if (!cancelado) {
        setErrorGrafico(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el gráfico",
        );
      }
    } finally {
      if (!cancelado) {
        setCargandoGrafico(false);
      }
    }
  }

  void cargarDatosGrafico();

  return () => {
    cancelado = true;
  };
}, [administrador?.rol]);


  const cargarReporte = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const datos = administrador?.rol === "MASTER" && sucursalSeleccionada !== "todas"
    ? await obtenerProductosSinStock(Number(sucursalSeleccionada))
    : await obtenerProductosSinStock();
      setProductos(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el reporte",
      );
    } finally {
      setCargando(false);
    }
  }, [administrador?.rol, sucursalSeleccionada]);

  useEffect(() => {
    void cargarReporte();
  }, [cargarReporte]);

  const sucursalesAfectadas = new Set(
    productos.map((producto) => producto.sucursalId),
  ).size;

  
const sucursalesParaGrafico: Sucursal[] =
  administrador?.rol === "MASTER"
    ? sucursales
    : administrador?.sucursal
      ? [administrador.sucursal]
      : [];

const cantidadesPorSucursal = new Map<number, number>();

const productosParaGrafico =
  administrador?.rol === "MASTER"
    ? productosTodasSucursales
    : productos;

for (const producto of productosParaGrafico) {
  cantidadesPorSucursal.set(
    producto.sucursalId,
    (cantidadesPorSucursal.get(producto.sucursalId) ?? 0) + 1,
  );
}

const datosGrafico = sucursalesParaGrafico.map((sucursal) => ({
  ...sucursal,
  cantidad: cantidadesPorSucursal.get(sucursal.id) ?? 0,
}));

const maxProductosAgotados = Math.max(
  1,
  ...datosGrafico.map((sucursal) => sucursal.cantidad),
);


  const obtenerImagen = (imagen: string) => {
    if (imagen.startsWith("http")) {
      return imagen;
    }

    return `${API_BASE}${imagen.startsWith("/") ? "" : "/"}${imagen}`;
  };

const indiceUltimoProducto = paginaActual * productosPorPagina;
const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;

const productosPagina = productos.slice(
  indicePrimerProducto,
  indiceUltimoProducto
); 

  return (
    <section className="space-y-6 p-3">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-orange-600">
            ANÁLISIS DEL NEGOCIO
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Productos sin stock
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Productos que no se pueden preparar con el stock disponible
            en cada sucursal.
          </p>
        </div>

        {administrador?.rol === "MASTER" && (
  <div className="flex flex-col gap-1">
    <label
      htmlFor="filtro-sucursal"
      className="text-sm font-semibold text-gray-700"
    >
      Filtrar por sucursal
    </label>

    <select
      id="filtro-sucursal"
      value={sucursalSeleccionada}
      onChange={(evento) => {setSucursalSeleccionada(evento.target.value); setPaginaActual(1)}}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
    >
      <option value="todas">Todas las sucursales</option>

      {sucursales.map((sucursal) => (
        <option key={sucursal.id} value={sucursal.id}>
          {sucursal.nombre}
        </option>
      ))}
    </select>

    {errorSucursales && (
      <p className="text-sm text-red-600">{errorSucursales}</p>
    )}
  </div>
)}

        <button
          type="button"
          onClick={() => void cargarReporte()}
          disabled={cargando}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {cargando ? "Actualizando..." : "↻ Actualizar"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Productos agotados
          </p>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {cargando ? "—" : productos.length.toLocaleString("es-AR")}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Registros de productos y sucursales
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Sucursales afectadas
          </p>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {cargando ? "—" : sucursalesAfectadas.toLocaleString("es-AR")}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Con al menos un producto agotado
          </p>
        </article>
      </div>

      
<section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="mb-6">
    <h2 className="text-lg font-bold text-gray-900">
      Productos agotados por sucursal
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Comparación de productos que no se pueden preparar en cada sucursal.
    </p>
  </div>

  {(administrador?.rol === "MASTER"
  ? cargandoGrafico
  : cargando) ?  (
    <p className="py-6 text-center text-sm text-gray-500">
      Cargando gráfico...
    </p>
  ) : (administrador?.rol === "MASTER" ? errorGrafico : error) ? (
    <p className="py-6 text-center text-sm text-red-600">
      No se pudo cargar el gráfico.
    </p>
  ) : datosGrafico.length === 0 ? (
    <p className="py-6 text-center text-sm text-gray-500">
      No hay sucursales para mostrar.
    </p>
  ) : (
    <div className="space-y-5">
      {datosGrafico.map((sucursal) => (
        <div key={sucursal.id}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">
              {sucursal.nombre}
            </span>

            <span className="shrink-0 text-sm font-bold text-gray-900">
              {sucursal.cantidad}
            </span>
          </div>

          <div
            className="h-3 overflow-hidden rounded-full bg-gray-100"
            role="img"
            aria-label={`${sucursal.nombre}: ${sucursal.cantidad} registros de productos agotados`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                sucursal.cantidad > 0 ? "bg-red-500" : "bg-gray-300"
              }`}
              style={{
                width: `${
                  (sucursal.cantidad / maxProductosAgotados) * 100
                }%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )}
</section>


      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-gray-900">
            Detalle de productos agotados
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            El mismo producto puede aparecer en distintas sucursales.
          </p>
        </div>

        {cargando ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Cargando datos del reporte...
          </div>
        ) : error ? (
          <div className="p-6">
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>

            <button
              type="button"
              onClick={() => void cargarReporte()}
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Reintentar
            </button>
          </div>
        ) : productos.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-3xl">✅</p>
            <p className="mt-3 font-semibold text-gray-800">
              No hay productos sin stock
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Todos los productos incluidos en este reporte pueden prepararse
              con el stock actual.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold sm:px-6">
                    Producto
                  </th>
                  <th className="px-5 py-3 font-semibold sm:px-6">
                    Sucursal
                  </th>
                  <th className="px-5 py-3 font-semibold sm:px-6">
                    Insumo faltante
                  </th>
                  
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {productosPagina.map((producto, indice) => (
                  <tr
                    key={`${producto.productoId}-${producto.sucursalId}-${indice}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {producto.imagen ? (
                          <img
                            src={obtenerImagen(producto.imagen)}
                            alt={producto.nombre}
                            className="h-12 w-12 rounded-lg border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xl">
                            🍔
                          </div>
                        )}

                        <span className="font-semibold text-gray-800">
                          {producto.nombre}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-700 sm:px-6">
                      {producto.sucursalNombre}
                    </td>

                    <td className="px-5 py-4 sm:px-6">
                      <span className="inline-flex max-w-sm rounded-lg bg-red-50 px-3 py-2 text-red-700">
                        {producto.insumoLimitante ?? "Sin stock disponible"}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Paginacion
              paginaActual={paginaActual}
              totalElementos={productos.length}
              elementosPorPagina={productosPorPagina}
              cambiarPagina={setPaginaActual}
            />
    </section>
  );
}
