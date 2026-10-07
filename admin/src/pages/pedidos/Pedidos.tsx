import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import MensajeVacio from "../../components/MensajeVacio";
import Paginacion from "../../components/Paginacion";
import { BarraFiltros, Buscador, SelectFiltro } from "../../components/Filtros";
import { useToast } from "../../context/ToastContext";
import type { AdministradorSesion } from "../../App";

const API_URL = "http://localhost:3000/admin/pedidos";
const POR_PAGINA = 8;

// Las 4 etapas válidas (mismo orden que el backend)
const ETAPAS = ["Pendiente", "En proceso", "En camino", "Entregado"] as const;
type Etapa = (typeof ETAPAS)[number];

interface DetallePedidoFila {
  cantidad: number;
  Producto: { nombre: string } | null;
}

interface PedidoFila {
  id: number;
  fecha: string;
  total: string;
  estado: string;
  usuario: { nombre: string; apellido: string } | null;
  DetallePedidos: DetallePedidoFila[];
}

interface PedidosProps {
  administrador: AdministradorSesion | null;
}

// Colores de cada etapa (badge)
const coloresEtapa: Record<Etapa, string> = {
  Pendiente: "bg-amber-100 text-amber-700",
  "En proceso": "bg-blue-100 text-blue-700",
  "En camino": "bg-purple-100 text-purple-700",
  Entregado: "bg-green-100 text-green-700",
};

function esEtapa(valor: string): valor is Etapa {
  return (ETAPAS as readonly string[]).includes(valor);
}

// Pedidos creados antes de la validación traen estados como "pendiente" (minúscula):
// se llevan a la forma canónica para que el badge, el filtro y el selector coincidan
function normalizarEtapa(valor: string): string {
  const coincidencia = ETAPAS.find(
    (etapa) => etapa.toLowerCase() === valor.toLowerCase(),
  );
  return coincidencia ?? valor;
}

function Etapa({ estado }: { estado: string }) {
  const color = esEtapa(estado)
    ? coloresEtapa[estado]
    : "bg-gray-200 text-gray-600";
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${color}`}>
      {estado}
    </span>
  );
}

function formatearFechaHora(valor: string) {
  return new Date(valor).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function resumenProductos(pedido: PedidoFila) {
  const detalles = pedido.DetallePedidos ?? [];
  const primeros = detalles
    .slice(0, 3)
    .map((d) => `${d.cantidad}× ${d.Producto?.nombre ?? "producto"}`);
  const resto = detalles.length - Math.min(detalles.length, 3);
  if (resto > 0) primeros.push(`+${resto} más`);
  return primeros.join(" · ") || "Sin productos";
}

// Mensaje de error del backend: { code } de Joi, { mensaje } de negocio o { msj } de auth
async function mensajeDeError(respuesta: Response, porDefecto: string) {
  const datos = await respuesta.json().catch(() => null);
  return datos?.code ?? datos?.mensaje ?? datos?.msj ?? porDefecto;
}

async function traerPedidos(sucursalId: number): Promise<PedidoFila[]> {
  const respuesta = await fetch(`${API_URL}/sucursal/${sucursalId}`, {
    credentials: "include",
  });
  if (!respuesta.ok)
    throw new Error(
      await mensajeDeError(respuesta, "Error al cargar los pedidos"),
    );
  const pedidos: PedidoFila[] = await respuesta.json();
  return pedidos.map((pedido) => ({
    ...pedido,
    estado: normalizarEtapa(pedido.estado),
  }));
}

async function enviarEstado(
  id: number,
  estado: string,
): Promise<{ estado?: string }> {
  const respuesta = await fetch(`${API_URL}/editar/estado/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ estado }),
  });
  if (!respuesta.ok)
    throw new Error(
      await mensajeDeError(respuesta, "No se pudo actualizar el estado"),
    );
  return respuesta.json();
}

// Selector de etapa dentro del pedido (radio buttons accesibles, sin modales)
function SelectorEtapa({
  pedidoId,
  valor,
  bloqueado,
  onChange,
}: {
  pedidoId: number;
  valor: string | undefined;
  bloqueado: boolean;
  onChange: (etapa: Etapa) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`Elegir etapa del pedido ${pedidoId}`}
      className="grid grid-cols-2 gap-2"
    >
      {ETAPAS.map((etapa) => {
        const activa = valor === etapa;
        return (
          <label
            key={etapa}
            className={`flex cursor-pointer items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-action peer-focus-visible:ring-offset-2 ${
              activa
                ? "border-orange-300 bg-action text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            } ${bloqueado ? "cursor-not-allowed opacity-50 hover:bg-white" : ""}`}
          >
            <input
              type="radio"
              name={`etapa-${pedidoId}`}
              value={etapa}
              checked={activa}
              disabled={bloqueado}
              onChange={() => onChange(etapa)}
              className="peer sr-only"
            />
            {etapa}
          </label>
        );
      })}
    </div>
  );
}

const botonAceptar =
  "rounded border border-orange-300 bg-action px-4 py-2 font-semibold text-white transition-colors hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-40";

export default function Pedidos({ administrador }: PedidosProps) {
  const { mostrarToast } = useToast();

  const sucursalId = administrador?.sucursalId ?? null;

  const [pedidos, setPedidos] = useState<PedidoFila[]>([]);
  // Cargando solo si hay sucursal que consultar (el estado inicial evita setState síncrono en el effect)
  const [cargando, setCargando] = useState(sucursalId !== null);
  const [errorCarga, setErrorCarga] = useState("");

  // Etapa elegida por cada pedido (todavía no aceptada)
  const [seleccion, setSeleccion] = useState<Record<number, Etapa | undefined>>(
    {},
  );
  // Pedido que se está guardando y error de guardado por fila
  const [guardando, setGuardando] = useState<number | null>(null);
  const [errorFila, setErrorFila] = useState<Record<number, string>>({});

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    if (sucursalId === null) return;
    traerPedidos(sucursalId)
      .then(setPedidos)
      .catch((error) =>
        setErrorCarga(
          error instanceof Error
            ? error.message
            : "Error al cargar los pedidos",
        ),
      )
      .finally(() => setCargando(false));
  }, [sucursalId]);

  // Al cambiar un filtro, se vuelve a la primera página
  const conReinicio = (cambiar: (valor: string) => void) => (valor: string) => {
    cambiar(valor);
    setPaginaActual(1);
  };

  const filtrados = pedidos.filter((pedido) => {
    const cliente =
      `${pedido.usuario?.nombre ?? ""} ${pedido.usuario?.apellido ?? ""}`.toLowerCase();
    const termino = busqueda.trim().toLowerCase();
    const coincideBusqueda =
      termino === "" ||
      cliente.includes(termino) ||
      String(pedido.id).includes(termino);
    const coincideEstado =
      filtroEstado === "todos" || pedido.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });
  const pagina = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );
  const hayFiltros = busqueda !== "" || filtroEstado !== "todos";

  const etapaActual = (pedido: PedidoFila) =>
    seleccion[pedido.id] ?? pedido.estado;

  // Inhabilitado: sin selección, igual a la etapa actual, guardando o ya entregado
  const puedeAceptar = (pedido: PedidoFila) => {
    const elegida = seleccion[pedido.id];
    return (
      elegida !== undefined &&
      elegida !== pedido.estado &&
      guardando !== pedido.id &&
      pedido.estado !== "Entregado"
    );
  };

  async function aceptar(pedido: PedidoFila) {
    const nueva = seleccion[pedido.id];
    if (!nueva || !puedeAceptar(pedido)) return;

    setGuardando(pedido.id);
    setErrorFila((prev) => ({ ...prev, [pedido.id]: "" }));
    try {
      const actualizado = await enviarEstado(pedido.id, nueva);
      // Solo se actualiza el estado: la respuesta no trae cliente ni productos
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedido.id
            ? { ...p, estado: actualizado.estado ?? nueva }
            : p,
        ),
      );
      setSeleccion((prev) => ({ ...prev, [pedido.id]: undefined }));
      mostrarToast("Estado del pedido actualizado");
    } catch (error) {
      setErrorFila((prev) => ({
        ...prev,
        [pedido.id]:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado",
      }));
    } finally {
      setGuardando(null);
    }
  }

  const controles = (pedido: PedidoFila) => {
    const entregado = pedido.estado === "Entregado";
    const error = errorFila[pedido.id];
    return (
      <>
        <SelectorEtapa
          pedidoId={pedido.id}
          valor={etapaActual(pedido)}
          bloqueado={entregado || guardando === pedido.id}
          onChange={(etapa) =>
            setSeleccion((prev) => ({ ...prev, [pedido.id]: etapa }))
          }
        />
        {error && (
          <p
            role="alert"
            className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => aceptar(pedido)}
            disabled={!puedeAceptar(pedido)}
            className={botonAceptar}
          >
            {guardando === pedido.id ? "Guardando..." : "Aceptar"}
          </button>
          {entregado && (
            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
              <Lock size={14} /> Entregado · solo lectura
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="mt-2 text-gray-600">
          {administrador?.sucursal?.nombre
            ? `Seguimiento de los pedidos de ${administrador.sucursal.nombre}.`
            : "Seguimiento de los pedidos de tu sucursal."}
        </p>
      </div>

      {sucursalId === null ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje="No tenés una sucursal asignada. Pedile al administrador general que te asigne una." />
        </div>
      ) : (
        <>
          <BarraFiltros>
            <Buscador
              valor={busqueda}
              onChange={conReinicio(setBusqueda)}
              placeholder="Buscar por cliente o nº de pedido..."
            />
            <SelectFiltro
              valor={filtroEstado}
              onChange={conReinicio(setFiltroEstado)}
              etiqueta="Filtrar por etapa"
              opciones={[
                { valor: "todos", etiqueta: "Todas las etapas" },
                ...ETAPAS.map((etapa) => ({ valor: etapa, etiqueta: etapa })),
              ]}
            />
          </BarraFiltros>

          {errorCarga && (
            <div
              role="alert"
              className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700"
            >
              {errorCarga}
            </div>
          )}

          {cargando ? (
            <p className="text-gray-600">Cargando pedidos...</p>
          ) : pagina.length === 0 ? (
            <div className="rounded-lg border bg-white px-6 py-10">
              <MensajeVacio
                mensaje={
                  hayFiltros
                    ? "No hay pedidos con esos filtros."
                    : "Todavía no hay pedidos en tu sucursal."
                }
              />
            </div>
          ) : (
            <>
              {/* Celular: tarjetas */}
              <ul className="flex flex-col gap-3 md:hidden">
                {pagina.map((pedido) => (
                  <li
                    key={pedido.id}
                    className="flex flex-col gap-3 rounded-lg border bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">Pedido #{pedido.id}</p>
                        <p className="truncate text-sm text-gray-600">
                          {pedido.usuario
                            ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}`
                            : "Cliente no disponible"}
                        </p>
                      </div>
                      <Etapa estado={pedido.estado} />
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>
                        {formatearFechaHora(pedido.fecha)} ·{" "}
                        {Number(pedido.total).toLocaleString("es-AR")}
                      </p>
                      <p className="mt-1">{resumenProductos(pedido)}</p>
                    </div>

                    {controles(pedido)}
                  </li>
                ))}
              </ul>

              {/* Escritorio: tabla */}
              <div className="hidden overflow-x-auto rounded-lg border bg-white md:block">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Nº</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-left">Productos</th>
                      <th className="px-4 py-3 text-left">Etapa actual</th>
                      <th className="px-4 py-3 text-left">Cambiar etapa</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagina.map((pedido) => {
                      const entregado = pedido.estado === "Entregado";
                      const error = errorFila[pedido.id];
                      return (
                        <tr key={pedido.id} className="border-t align-top">
                          <td className="px-4 py-4 font-medium">
                            #{pedido.id}
                          </td>
                          <td className="px-4 py-4">
                            {pedido.usuario
                              ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}`
                              : "No disponible"}
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {formatearFechaHora(pedido.fecha)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {Number(pedido.total).toLocaleString("es-AR")}
                          </td>
                          <td className="max-w-56 px-4 py-4 text-sm text-gray-600">
                            {resumenProductos(pedido)}
                          </td>
                          <td className="px-4 py-4">
                            <Etapa estado={pedido.estado} />
                          </td>
                          <td className="px-4 py-4">
                            <SelectorEtapa
                              pedidoId={pedido.id}
                              valor={etapaActual(pedido)}
                              bloqueado={entregado || guardando === pedido.id}
                              onChange={(etapa) =>
                                setSeleccion((prev) => ({
                                  ...prev,
                                  [pedido.id]: etapa,
                                }))
                              }
                            />
                            {error && (
                              <p
                                role="alert"
                                className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700"
                              >
                                {error}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col items-end gap-2">
                              <button
                                type="button"
                                onClick={() => aceptar(pedido)}
                                disabled={!puedeAceptar(pedido)}
                                className={botonAceptar}
                              >
                                {guardando === pedido.id
                                  ? "Guardando..."
                                  : "Aceptar"}
                              </button>
                              {entregado && (
                                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                  <Lock size={14} /> Solo lectura
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Paginacion
                paginaActual={paginaActual}
                totalElementos={filtrados.length}
                elementosPorPagina={POR_PAGINA}
                cambiarPagina={setPaginaActual}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}
