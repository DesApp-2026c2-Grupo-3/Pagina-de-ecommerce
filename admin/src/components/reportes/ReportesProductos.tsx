import { useCallback, useEffect, useState } from "react";
import {
  Award,
  TrendingDown,
  DollarSign,
  PackageX,
  RefreshCw,
  AlertCircle,
  ImageOff,Store
} from "lucide-react";

import {
  obtenerProductosMasVendidos,
  obtenerProductosMenosVendidos,
  obtenerProductosMayorFacturacion,
  obtenerProductosSinStock,
} from "../../services/reporteService";

import {type ProductoMasVendido,
  type ProductoMenosVendido,
  type ProductoMayorFacturacion,
  type ProductoSinStock,} from "../../types/reporte.types"

import { obtenerSucursales } from "../../services/sucursalService";
import { useAuth } from "../../context/AuthContext";
import {type Sucursal} from "../../types/sucursal.types"
import GraficoProductos from "./GraficoProductos";
import GraficoFacturacion from "./GraficoFacturacion";

import Paginacion from "../../components/Paginacion";

const API_BASE = "http://localhost:3000";
const LIMITE_PRODUCTOS = 5;

type FilaRanking = {
  id: string | number;
  nombre: string;
  imagen: string | null;
  valor: string;
};

type EstadoReporte<T> = {
  datos: T[];
  cargando: boolean;
  error: string;
  cargar: () => Promise<void>;
};


function useReporte<T>(
  obtenerDatos: (sucursalId?: number) => Promise<T[]>,
  sucursalId?: number,
): EstadoReporte<T> {
  const [datos, setDatos] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const resultado = await obtenerDatos(sucursalId);
      setDatos(resultado);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los datos.",
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


function obtenerUrlImagen(imagen: string | null): string | null {
  if (!imagen) return null;

  if (/^https?:\/\//i.test(imagen)) {
    return imagen;
  }

  return `${API_BASE}/${imagen.replace(/^\/+/, "")}`;
}

function formatearNumero(valor: string | number): string {
  return Number(valor).toLocaleString("es-AR");
}

function formatearDinero(valor: string | number): string {
  return Number(valor).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });
}

type TarjetaProps = {
  titulo: string;
  descripcion: string;
  icono: typeof Award;
  color: "orange" | "red" | "green" | "blue";
  filas: FilaRanking[];
  cargando: boolean;
  error: string;
  textoVacio: string;
  etiquetaValor: string;
  onReintentar: () => void;
  contenido?: React.ReactNode;
};

const colores = {
  orange: {
    icono: "bg-orange-50 text-orange-600",
    posicion: "bg-orange-50 text-orange-700",
    valor: "bg-orange-50 text-orange-700",
  },
  red: {
    icono: "bg-red-50 text-red-600",
    posicion: "bg-red-50 text-red-700",
    valor: "bg-red-50 text-red-700",
  },
  green: {
    icono: "bg-green-50 text-green-600",
    posicion: "bg-green-50 text-green-700",
    valor: "bg-green-50 text-green-700",
  },
  blue: {
    icono: "bg-blue-50 text-blue-600",
    posicion: "bg-blue-50 text-blue-700",
    valor: "bg-blue-50 text-blue-700",
  },
};

function TarjetaRanking({
  titulo,
  descripcion,
  icono: Icono,
  color,
  filas,
  cargando,
  error,
  textoVacio,
  etiquetaValor,
  onReintentar,
  contenido
}: TarjetaProps) {
  const estilo = colores[color];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-start gap-3 border-b border-gray-100 p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${estilo.icono}`}
        >
          <Icono size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-gray-900">{titulo}</h2>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            {descripcion}
          </p>
        </div>
      </header>

      {cargando ? (
        <div className="space-y-4 p-5">
          {[1, 2, 3].map((numero) => (
            <div key={numero} className="flex animate-pulse items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gray-100" />
              <div className="h-10 flex-1 rounded-lg bg-gray-100" />
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
            onClick={onReintentar}
            className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Reintentar
          </button>
        </div>
      )  : contenido ? (
  <div className="p-3 sm:p-4">
    {contenido}
  </div>
      ) :filas.length === 0 ? (
  <div className="flex flex-col items-center px-5 py-10 text-center">
    <ImageOff size={28} className="text-gray-300" />
    <p className="mt-3 text-sm font-medium text-gray-600">
      {textoVacio}
    </p>
  </div>
) : (
  <div className="p-3 sm:p-4">
    <div className="divide-y divide-gray-100">
      {filas.slice(0, LIMITE_PRODUCTOS).map((fila, indice) => {
        const urlImagen = obtenerUrlImagen(fila.imagen);

        return (
          <div
            key={fila.id}
            className="flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-gray-50"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${estilo.posicion}`}
            >
              {indice + 1}
            </span>

            {urlImagen ? (
              <img
                src={urlImagen}
                alt={fila.nombre}
                loading="lazy"
                className="h-11 w-11 shrink-0 rounded-lg border border-gray-100 object-cover"
                onError={(evento) => {
                  evento.currentTarget.style.visibility = "hidden";
                }}
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                <PackageX size={19} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-semibold text-gray-800"
                title={fila.nombre}
              >
                {fila.nombre}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {etiquetaValor}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold ${estilo.valor}`}
            >
              {fila.valor}
            </span>
          </div>
        );
      })}
    </div>
  </div>
)}
    </section>
  );
}

export default function ReportesProductos() {
const { administrador } = useAuth();
const [sucursales, setSucursales] = useState<Sucursal[]>([]);
const [cargandoSucursales, setCargandoSucursales] = useState(true);
const [errorSucursales, setErrorSucursales] = useState("");

// undefined significa que se seleccionaron todas las sucursales.
const [sucursalSeleccionada, setSucursalSeleccionada] =
  useState<number | undefined>(undefined);

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



  const masVendidos = useReporte<ProductoMasVendido>(
    obtenerProductosMasVendidos,
    sucursalSeleccionada,
  );

  const menosVendidos = useReporte<ProductoMenosVendido>(
    obtenerProductosMenosVendidos,
    sucursalSeleccionada,
  );

  const mayorFacturacion = useReporte<ProductoMayorFacturacion>(
    obtenerProductosMayorFacturacion,
    sucursalSeleccionada,
  );

  const sinStock = useReporte<ProductoSinStock>(
    obtenerProductosSinStock,
    sucursalSeleccionada,
  );

  const actualizarTodo = async () => {
    await Promise.all([
      masVendidos.cargar(),
      menosVendidos.cargar(),
      mayorFacturacion.cargar(),
      sinStock.cargar(),
    ]);
  };

  const filasMasVendidos: FilaRanking[] = masVendidos.datos.map(
    (producto) => ({
      id: producto.productoId,
      nombre: producto.Producto.nombre,
      imagen: producto.Producto.imagen,
      valor: formatearNumero(producto.unidadesVendidas),
    }),
  );

  const filasMenosVendidos: FilaRanking[] = menosVendidos.datos.map(
    (producto) => ({
      id: producto.productoId,
      nombre: producto.nombre,
      imagen: producto.imagen,
      valor: formatearNumero(producto.unidadesVendidas),
    }),
  );

  const filasMayorFacturacion: FilaRanking[] = mayorFacturacion.datos.map(
    (producto) => ({
      id: producto.productoId,
      nombre: producto.nombre,
      imagen: producto.imagen,
      valor: formatearDinero(producto.facturacion),
    }),
  );

  const productosSinStock = sinStock.datos

  const totalSinStock = sinStock.datos.length;

  const cargandoTodo =
    masVendidos.cargando ||
    menosVendidos.cargando ||
    mayorFacturacion.cargando ||
    sinStock.cargando;

  const [paginaSinStock, setPaginaSinStock] = useState(1);

const productosPorPagina = 5;

const totalPaginasSinStock = Math.ceil(
  productosSinStock.length / productosPorPagina
);

const productosSinStockPaginados = productosSinStock.slice(
  (paginaSinStock - 1) * productosPorPagina,
  paginaSinStock * productosPorPagina
);

useEffect(() => {
  setPaginaSinStock((pagina) =>
    Math.min(pagina, Math.max(1, totalPaginasSinStock))
  );
}, [totalPaginasSinStock]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Rendimiento de productos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Resumen de ventas, ingresos y disponibilidad.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void actualizarTodo()}
          disabled={cargandoTodo}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={cargandoTodo ? "animate-spin" : ""}
          />
          {cargandoTodo ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

{administrador?.rol === "MASTER" && (    
<div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
  <label
    htmlFor="filtro-sucursal"
    className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
  >
    <Store size={18} className="text-orange-600" />
    Filtrar por sucursal
  </label>

  <select
    id="filtro-sucursal"
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
    <option value="">
      Todas las sucursales
    </option>

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
)}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TarjetaRanking
          titulo="Más vendidos"
          descripcion="Los productos con más unidades vendidas."
          icono={Award}
          color="orange"
          filas={filasMasVendidos}
          cargando={masVendidos.cargando}
          error={masVendidos.error}
          textoVacio="Todavía no hay ventas para mostrar."
          etiquetaValor="Unidades vendidas"
          onReintentar={() => void masVendidos.cargar()}
          contenido={
          <GraficoProductos
            datos={filasMasVendidos.slice(0, 5).map((fila) => ({
              nombre: fila.nombre,
              cantidad: Number(fila.valor),
            }))}
            color="#ea580c"
            etiqueta="Unidades vendidas"
            />
          }
        />
        

        <TarjetaRanking
          titulo="Menos vendidos"
          descripcion="Productos con menor movimiento, incluidos los que no vendieron."
          icono={TrendingDown}
          color="red"
          filas={filasMenosVendidos}
          cargando={menosVendidos.cargando}
          error={menosVendidos.error}
          textoVacio="No hay productos para mostrar."
          etiquetaValor="Unidades vendidas"
          onReintentar={() => void menosVendidos.cargar()}
          contenido={
            <GraficoProductos
            datos={filasMenosVendidos.slice(0, 5).map((fila) => ({
              nombre: fila.nombre,
              cantidad: Number(fila.valor),
            }))}
            color="#64748b"
            etiqueta="Unidades vendidas"
            />
          }
        />

        <TarjetaRanking
          titulo="Mayor facturación"
          descripcion="Los productos que generan más ingresos."
          icono={DollarSign}
          color="green"
          filas={filasMayorFacturacion}
          cargando={mayorFacturacion.cargando}
          error={mayorFacturacion.error}
          textoVacio="Todavía no hay facturación para mostrar."
          etiquetaValor="Facturación"
          onReintentar={() => void mayorFacturacion.cargar()}
          contenido={
          <GraficoFacturacion
            datos={mayorFacturacion.datos.slice(0, 5).map((producto) => ({
              nombre: producto.nombre,
              facturacion: Number(producto.facturacion)
            }))}
              />
            }
        />

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <header className="flex items-start gap-3 border-b border-gray-100 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <PackageX size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-gray-900">Sin stock</h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Productos que no se pueden preparar por falta de insumos.
              </p>
            </div>

            {!sinStock.cargando && !sinStock.error && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">
                {totalSinStock}
              </span>
            )}
          </header>

          {sinStock.cargando ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Cargando productos...
            </div>
          ) : sinStock.error ? (
            <div className="p-5">
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
              >
                {sinStock.error}
              </div>
              <button
                type="button"
                onClick={() => void sinStock.cargar()}
                className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
              >
                Reintentar
              </button>
            </div>
          ) : productosSinStock.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <PackageX size={28} className="mx-auto text-green-500" />
              <p className="mt-3 text-sm font-semibold text-gray-700">
                Todos los productos están disponibles.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[380px] flex-col p-3 sm:p-4">
              <div className="flex-1 divide-y divide-gray-100">
              {productosSinStockPaginados.map((producto) => {
                const urlImagen = obtenerUrlImagen(producto.imagen);

                return (
                  <div
                    key={`${producto.productoId}-${producto.sucursalId}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-gray-50"
                  >
                    {urlImagen ? (
                      <img
                        src={urlImagen}
                        alt={producto.nombre}
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-lg border border-gray-100 object-cover"
                        onError={(evento) => {
                          evento.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                        <PackageX size={19} />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {producto.nombre}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {producto.sucursalNombre}
                      </p>
                      </div>

                      <div className="shrink-0">
                      <p className="mt-1 truncate text-orange-700">
                        {producto.insumoLimitante
                          ? `Falta: ${producto.insumoLimitante}`
                          : "Sin disponibilidad"}
                      </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

            </div>
          )}

          <div className="border-t border-gray-100 px-3 pb-4 pt-1 sm:px-4">
            <Paginacion
            paginaActual={paginaSinStock}
            totalElementos={productosSinStock.length}
            elementosPorPagina={productosPorPagina}
            cambiarPagina={setPaginaSinStock}
            />
          </div>
        </section>
      </div>
    </section>
  );
}
