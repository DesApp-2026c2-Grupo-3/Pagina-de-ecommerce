import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Award,
  TrendingDown,
  DollarSign,
  PackageX,
  RefreshCw,
  AlertCircle,
  ImageOff,
  Snowflake,
  Store,
} from "lucide-react";

import {
  obtenerProductosMasVendidos,
  obtenerProductosMenosVendidos,
  obtenerProductosMayorFacturacion,
  obtenerProductosSinStock,
} from "../../services/reporteService";

import {
  type ProductoMasVendido,
  type ProductoMenosVendido,
  type ProductoMayorFacturacion,
  type ProductoSinStock,
} from "../../types/reporte.types";

import { obtenerSucursales } from "../../services/sucursalService";
import { useAuth } from "../../context/AuthContext";
import { type Sucursal } from "../../types/sucursal.types";
import RankingAnimado, { type FilaRankingAnimado } from "./RankingAnimado";
import TicketProducto, { type DatosTicket } from "./TicketProducto";
import HeladeraMenosVendidos from "./HeladeraMenosVendidos";
import Paginacion from "../../components/Paginacion";
import TorresFacturacion, { type FilaFacturacion } from "./TorresFacturacion";

const API_BASE = "http://localhost:3000";
const LIMITE_PRODUCTOS = 5;
const PRODUCTOS_POR_PAGINA = 5;

/* =========================================================
   ESTILOS COMPARTIDOS
   Sombras y bordes marcados para que nada se pierda sobre el blanco.
   Si quieren más o menos sombra, se cambia solo acá.
   ========================================================= */

// Tarjetas grandes (cada reporte)
const ESTILO_TARJETA =
  "rounded-2xl border border-gray-300/80 bg-white shadow-[0_2px_6px_rgba(17,24,39,0.08),0_16px_36px_rgba(17,24,39,0.10)]";

// Controles chicos (select, botones)
const ESTILO_CONTROL =
  "min-h-11 rounded-xl border border-gray-300 bg-white shadow-[0_1px_3px_rgba(17,24,39,0.12)]";

/* =========================================================
   SUBMENÚ
   ========================================================= */

type PestaniaProductos = "mas" | "menos" | "facturacion" | "stock";

const PESTANIAS: {
  id: PestaniaProductos;
  nombre: string;
  icono: typeof Award;
}[] = [
  { id: "mas", nombre: "Más vendidos", icono: Award },
  { id: "menos", nombre: "Menos vendidos", icono: TrendingDown },
  { id: "facturacion", nombre: "Mayor facturación", icono: DollarSign },
  { id: "stock", nombre: "Sin stock", icono: PackageX },
];

/* =========================================================
   TIPOS Y UTILIDADES
   ========================================================= */

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

/* =========================================================
   TARJETA DE RANKING
   ========================================================= */

type TarjetaProps = {
  titulo: string;
  descripcion: string;
  icono: typeof Award;
  color: "orange" | "red" | "green" | "blue" | "sky";  
  filas: FilaRanking[];
  cargando: boolean;
  error: string;
  textoVacio: string;
  etiquetaValor: string;
  onReintentar: () => void;
  contenido?: ReactNode;
};

const colores = {
  orange: {
    icono: "bg-orange-50 text-orange-600 ring-1 ring-orange-200",
    posicion: "bg-orange-50 text-orange-700",
    valor: "bg-orange-50 text-orange-700",
  },
  red: {
    icono: "bg-red-50 text-red-600 ring-1 ring-red-200",
    posicion: "bg-red-50 text-red-700",
    valor: "bg-red-50 text-red-700",
  },
  green: {
    icono: "bg-green-50 text-green-600 ring-1 ring-green-200",
    posicion: "bg-green-50 text-green-700",
    valor: "bg-green-50 text-green-700",
  },
  blue: {
    icono: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
    posicion: "bg-blue-50 text-blue-700",
    valor: "bg-blue-50 text-blue-700",
  },
    sky: {
    icono: "bg-sky-50 text-sky-600 ring-1 ring-sky-200",
    posicion: "bg-sky-50 text-sky-700",
    valor: "bg-sky-50 text-sky-700",
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
  contenido,
}: TarjetaProps) {
  const estilo = colores[color];

  return (
    <section className={`min-w-0 overflow-hidden ${ESTILO_TARJETA}`}>
      <header className="flex items-start gap-3 border-b border-gray-200 bg-gray-50/60 p-4 sm:p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${estilo.icono}`}
        >
          <Icono size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-gray-900">{titulo}</h2>
          <p className="mt-1 text-sm leading-5 text-gray-500">{descripcion}</p>
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
      ) : contenido ? (
        <div className="p-2 sm:p-4">{contenido}</div>
      ) : filas.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <ImageOff size={28} className="text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-600">{textoVacio}</p>
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
                      className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 object-cover"
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
                    <p className="mt-1 text-xs text-gray-400">{etiquetaValor}</p>
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

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function ReportesProductos() {
  const { administrador } = useAuth();

  // Pestaña del submenú que se está viendo
  const [pestania, setPestania] = useState<PestaniaProductos>("mas");

  // Producto que se muestra en el ticket (null = el 1.º del ranking)
  const [productoTicketId, setProductoTicketId] = useState<number | string | null>(null);

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

  /* ---------- Datos de cada tarjeta ---------- */

  const filasMasVendidos: FilaRanking[] = masVendidos.datos.map((producto) => ({
    id: producto.productoId,
    nombre: producto.Producto.nombre,
    imagen: producto.Producto.imagen,
    valor: formatearNumero(producto.unidadesVendidas),
  }));

  // Para el ranking animado: el valor va como número, sin formatear
  const rankingMasVendidos: FilaRankingAnimado[] = masVendidos.datos.map(
    (producto) => ({
      id: producto.productoId,
      nombre: producto.Producto.nombre,
      imagen: obtenerUrlImagen(producto.Producto.imagen),
      valor: Number(producto.unidadesVendidas),
      categoria: producto.Producto.categoria?.nombre ?? null,
    }),
  );

  /* ---------- Ticket del producto elegido ---------- */

  // Si el elegido ya no está en la lista (por ejemplo, al cambiar de sucursal), vuelve al 1.º
  const indiceTicket = Math.max(
    0,
    rankingMasVendidos.findIndex((fila) => fila.id === productoTicketId),
  );
  const filaTicket = rankingMasVendidos[indiceTicket];

  const totalUnidades = rankingMasVendidos.reduce(
    (suma, fila) => suma + fila.valor,
    0,
  );

  const nombreSucursal =
    administrador?.sucursal?.nombre ??
    sucursales.find((sucursal) => sucursal.id === sucursalSeleccionada)?.nombre ??
    "Todas las sucursales";

  const datosTicket: DatosTicket | null = filaTicket
    ? {
        id: filaTicket.id,
        nombre: filaTicket.nombre,
        categoria: filaTicket.categoria,
        puesto: indiceTicket + 1,
        totalPuestos: Math.min(rankingMasVendidos.length, LIMITE_PRODUCTOS),
        unidades: filaTicket.valor,
        // La facturación sale del reporte de "mayor facturación"
        facturacion: (() => {
          const encontrado = mayorFacturacion.datos.find(
            (producto) => producto.productoId === filaTicket.id,
          );
          return encontrado ? Number(encontrado.facturacion) : null;
        })(),
        participacion:
          totalUnidades > 0 ? (filaTicket.valor / totalUnidades) * 100 : 0,
        // Las sucursales sin stock salen del reporte de "sin stock" (sin repetir)
        agotadoEn: [
          ...new Set(
            sinStock.datos
              .filter((producto) => producto.productoId === filaTicket.id)
              .map((producto) => producto.sucursalNombre),
          ),
        ],
        contexto: nombreSucursal,
        esPrimero: indiceTicket === 0,
      }
    : null;

  const filasMenosVendidos: FilaRanking[] = menosVendidos.datos.map(
    (producto) => ({
      id: producto.productoId,
      nombre: producto.nombre,
      imagen: producto.imagen,
      valor: formatearNumero(producto.unidadesVendidas),
    }),
  );

  // Para la heladera: el valor va como número, sin formatear
  const rankingMenosVendidos: FilaRankingAnimado[] = menosVendidos.datos.map(
    (producto) => ({
      id: producto.productoId,
      nombre: producto.nombre,
      imagen: obtenerUrlImagen(producto.imagen),
      valor: Number(producto.unidadesVendidas),
      categoria: producto.categoria?.nombre ?? null,
    }),
  );

  // El reporte trae TODOS los productos, así que el promedio es directo
  const promedioPorProducto =
    rankingMenosVendidos.length > 0
      ? rankingMenosVendidos.reduce((suma, fila) => suma + fila.valor, 0) /
        rankingMenosVendidos.length
      : 0;

        // Para las torres: cruzamos con "más vendidos" para saber unidades y puesto en unidades
  const puestoPorUnidades = new Map(
    rankingMasVendidos.map((fila, indice) => [fila.id, indice + 1]),
  );
  const unidadesPorProducto = new Map(
    rankingMasVendidos.map((fila) => [fila.id, fila.valor]),
  );

  const rankingFacturacion: FilaFacturacion[] = mayorFacturacion.datos.map(
    (producto) => ({
      id: producto.productoId,
      nombre: producto.nombre,
      categoria: producto.categoria?.nombre ?? null,
      facturacion: Number(producto.facturacion),
      unidades: unidadesPorProducto.get(producto.productoId) ?? null,
      puestoUnidades: puestoPorUnidades.get(producto.productoId) ?? null,
    }),
  );

  const totalFacturado = rankingFacturacion.reduce(
    (suma, fila) => suma + fila.facturacion,
    0,
  );

  const filasMayorFacturacion: FilaRanking[] = mayorFacturacion.datos.map(
    (producto) => ({
      id: producto.productoId,
      nombre: producto.nombre,
      imagen: producto.imagen,
      valor: formatearDinero(producto.facturacion),
    }),
  );

  /* ---------- Sin stock (con paginación) ---------- */

  const productosSinStock = sinStock.datos;
  const totalSinStock = sinStock.datos.length;

  const cargandoTodo =
    masVendidos.cargando ||
    menosVendidos.cargando ||
    mayorFacturacion.cargando ||
    sinStock.cargando;

  const [paginaSinStock, setPaginaSinStock] = useState(1);

  const totalPaginasSinStock = Math.ceil(
    productosSinStock.length / PRODUCTOS_POR_PAGINA,
  );

  const productosSinStockPaginados = productosSinStock.slice(
    (paginaSinStock - 1) * PRODUCTOS_POR_PAGINA,
    paginaSinStock * PRODUCTOS_POR_PAGINA,
  );

  useEffect(() => {
    setPaginaSinStock((pagina) =>
      Math.min(pagina, Math.max(1, totalPaginasSinStock)),
    );
  }, [totalPaginasSinStock]);

  /* ---------- Vista ---------- */

  return (
    <section className="space-y-5">
      {/* Título + filtro de sucursal + Actualizar, en una sola línea */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Rendimiento de productos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Resumen de ventas, ingresos y disponibilidad.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {administrador?.rol === "MASTER" && (
            <>
              <label
                htmlFor="filtro-sucursal"
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
              >
                <Store size={17} className="text-orange-600" aria-hidden="true" />
                {/* En celular se oculta el texto (sigue disponible para lectores de pantalla) */}
                <span className="sr-only sm:not-sr-only">Sucursal</span>
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
        aria-label="Reportes de productos"
        className="grid grid-cols-2 gap-1 rounded-2xl border border-gray-300 bg-gray-100 p-1.5 shadow-inner sm:inline-flex sm:flex-wrap"
      >
        {PESTANIAS.map(({ id, nombre, icono: Icono }) => {
          const activa = pestania === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`pestania-${id}`}
              aria-selected={activa}
              aria-controls="panel-productos"
              onClick={() => setPestania(id)}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold transition sm:gap-2 sm:px-4 sm:text-sm ${
                activa
                  ? "bg-white text-orange-700 shadow-[0_2px_6px_rgba(17,24,39,0.15)] ring-1 ring-orange-300"
                  : "text-gray-600 hover:bg-white/60 hover:text-orange-700"
              }`}
            >
              <Icono size={17} className="shrink-0" />
              <span className="truncate">{nombre}</span>

              {/* Contador rojo en "Sin stock" para que se vea sin entrar */}
              {id === "stock" && totalSinStock > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200">
                  {totalSinStock}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel de la pestaña activa. La "key" hace que la animación
          de entrada se repita cada vez que se cambia de pestaña. */}
      <div
        key={pestania}
        id="panel-productos"
        role="tabpanel"
        aria-labelledby={`pestania-${pestania}`}
        className="rep-subir"
      >
        {pestania === "mas" && (
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
              rankingMasVendidos.length > 0 ? (
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                  {/* Ranking: ocupa el espacio que sobra */}
                  <div className="min-w-0">
                    <RankingAnimado
                      filas={rankingMasVendidos}
                      formatearValor={formatearNumero}
                      textoUnidad="unidades"
                      etiquetaPrimero="MÁS VENDIDO"
                      seleccionadoId={filaTicket?.id}
                      onSeleccionar={setProductoTicketId}
                    />
                  </div>

                  {/* Ticket: al costado en pantallas anchas; abajo y centrado en tablet y celular */}
                  {datosTicket && (
                    <aside
                      aria-label="Ticket del producto"
                      className="mx-auto w-full max-w-sm py-2.5 lg:max-w-none"
                    >
                      <TicketProducto datos={datosTicket} />
                    </aside>
                  )}
                </div>
              ) : undefined
            }
          />
        )}

        {pestania === "menos" && (
          <TarjetaRanking
            titulo="Menos vendidos"
            descripcion="Los productos que se quedaron en el freezer. Tocá un cubito para descongelarlo."
            icono={Snowflake}
            color="sky"
            filas={filasMenosVendidos}
            cargando={menosVendidos.cargando}
            error={menosVendidos.error}
            textoVacio="No hay productos para mostrar."
            etiquetaValor="Unidades vendidas"
            onReintentar={() => void menosVendidos.cargar()}
            contenido={
              rankingMenosVendidos.length > 0 ? (
                <HeladeraMenosVendidos
                  // La "key" vuelve a congelar todo al cambiar de sucursal
                  key={sucursalSeleccionada ?? "todas"}
                  filas={rankingMenosVendidos}
                  promedio={promedioPorProducto}
                  contexto={nombreSucursal}
                  puedeCrearPromo={administrador?.rol === "MASTER"}
                />
              ) : undefined
            }
          />
        )}

        {pestania === "facturacion" && (
          <TarjetaRanking
            titulo="Mayor facturación"
            descripcion="Lo que más plata deja. Tocá una torre para ver su comprobante."            
            icono={DollarSign}
            color="green"
            filas={filasMayorFacturacion}
            cargando={mayorFacturacion.cargando}
            error={mayorFacturacion.error}
            textoVacio="Todavía no hay facturación para mostrar."
            etiquetaValor="Facturación"
            onReintentar={() => void mayorFacturacion.cargar()}
            contenido={
              rankingFacturacion.length > 0 ? (
                <TorresFacturacion
                  // La "key" vuelve a armar las torres al cambiar de sucursal
                  key={sucursalSeleccionada ?? "todas"}
                  filas={rankingFacturacion}
                  totalFacturado={totalFacturado}
                  contexto={nombreSucursal}
                />
              ) : undefined
            }
          />
        )}

        {pestania === "stock" && (
          <section className={`min-w-0 overflow-hidden ${ESTILO_TARJETA}`}>
            <header className="flex items-start gap-3 border-b border-gray-200 bg-gray-50/60 p-4 sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-200">
                <PackageX size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-900">Sin stock</h2>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Productos que no se pueden preparar por falta de insumos.
                </p>
              </div>

              {!sinStock.cargando && !sinStock.error && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700 ring-1 ring-orange-200">
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
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
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
                            className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 object-cover"
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

            <div className="border-t border-gray-200 px-3 pb-4 pt-1 sm:px-4">
              <Paginacion
                paginaActual={paginaSinStock}
                totalElementos={productosSinStock.length}
                elementosPorPagina={PRODUCTOS_POR_PAGINA}
                cambiarPagina={setPaginaSinStock}
              />
            </div>
          </section>
        )}
      </div>
    </section>
  );
}