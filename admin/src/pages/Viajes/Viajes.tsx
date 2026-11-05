
import { useEffect, useState } from "react";
import { Bike, Package, Clock } from "lucide-react";
import MensajeVacio from "../../components/MensajeVacio";
import Paginacion from "../../components/Paginacion";
import {
  BarraFiltros,
  Buscador,
  SelectFiltro,
} from "../../components/Filtros";
import { obtenerSucursales } from "../../services/sucursalService";
import { obtenerViajesPorSucursal } from "../../services/viajeService";
import { useAuth } from "../../context/AuthContext";
import type { SucursalOpcion } from "../../types/pedido.types";
import type { Viaje } from "../../types/viaje.types";
import DetallePedidoModal from "../../components/DetallePedidoModal";

const POR_PAGINA = 8;

function formatearFechaHora(valor: string) {
  return new Date(valor).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function nombreRepartidor(viaje: Viaje) {
  const repartidor = viaje.Repartidor;

  if (!repartidor) return "Repartidor no disponible";

  return [repartidor.nombre, repartidor.apellido]
    .filter((parte) => parte?.trim())
    .join(" ");
}

function EstadoViaje({ estado }: { estado: string }) {
  const colores: Record<string, string> = {
    activo: "bg-green-100 text-green-700",
    finalizado: "bg-gray-200 text-gray-700",
  };

  const color = colores[estado.toLowerCase()] ?? "bg-amber-100 text-amber-700";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${color}`}
    >
      {estado}
    </span>
  );
}

export default function Viajes() {
  const { administrador } = useAuth();
  const esMaster = administrador?.rol === "MASTER";

  const [sucursales, setSucursales] = useState<SucursalOpcion[]>([]);
  const [sucursalId, setSucursalId] = useState<number | null>(
    administrador?.sucursalId ?? null,
  );

  const [detalleId, setDetalleId] = useState<number | null>(null);

  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [cargando, setCargando] = useState(
    esMaster || sucursalId !== null,
  );
  const [errorCarga, setErrorCarga] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);

  // El MASTER puede consultar cualquier sucursal.
  useEffect(() => {
    if (!esMaster) return;

    obtenerSucursales()
      .then((lista: SucursalOpcion[]) => {
        setSucursales(lista);
        setSucursalId((actual) => actual ?? lista[0]?.id ?? null);

        if (lista.length === 0) setCargando(false);
      })
      .catch(() => {
        setErrorCarga("No se pudieron cargar las sucursales");
        setCargando(false);
      });
  }, [esMaster]);

  // Cargamos los viajes de la sucursal seleccionada.
  useEffect(() => {
    if (sucursalId === null) return;

    let cancelado = false;

    setCargando(true);
    setErrorCarga("");

    obtenerViajesPorSucursal(sucursalId)
      .then((lista) => {
        if (!cancelado) setViajes(lista);
      })
      .catch((error) => {
        if (cancelado) return;

        setViajes([]);
        setErrorCarga(
          error instanceof Error
            ? error.message
            : "Error al cargar los viajes",
        );
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [sucursalId]);

  const conReinicio = (cambiar: (valor: string) => void) => (
    valor: string,
  ) => {
    cambiar(valor);
    setPaginaActual(1);
  };

  const filtrados = viajes.filter((viaje) => {
    const termino = busqueda.trim().toLowerCase();

    const repartidor = nombreRepartidor(viaje).toLowerCase();

    const coincideBusqueda =
      termino === "" ||
      repartidor.includes(termino) ||
      String(viaje.id).includes(termino) ||
      viaje.Pedidos.some(
        (pedido) =>
          String(pedido.id).includes(termino) ||
          `${pedido.Usuario?.nombre ?? ""} ${pedido.Usuario?.apellido ?? ""}`
            .toLowerCase()
            .includes(termino),
      );

    const coincideEstado =
      filtroEstado === "todos" || viaje.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  const pagina = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  const hayFiltros = busqueda !== "" || filtroEstado !== "todos";

  const nombreSucursal = esMaster
    ? sucursales.find((s) => s.id === sucursalId)?.nombre
    : administrador?.sucursal?.nombre;

  return (
    <main className="w-full max-w-full overflow-hidden p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Gestión de viajes
        </p>

        <h1 className="text-3xl font-bold">Viajes</h1>

        <p className="mt-2 text-gray-600">
          {nombreSucursal
            ? `Seguimiento de los viajes de ${nombreSucursal}.`
            : "Seguimiento de los viajes de la sucursal."}
        </p>
      </div>

      {!esMaster && sucursalId === null ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje="No tenés una sucursal asignada. Pedile al administrador general que te asigne una." />
        </div>
      ) : (
        <>
          <BarraFiltros>
            {esMaster && (
              <SelectFiltro
                valor={sucursalId !== null ? String(sucursalId) : ""}
                onChange={(valor) => {
                  setSucursalId(Number(valor));
                  setPaginaActual(1);
                }}
                etiqueta="Elegir sucursal"
                opciones={sucursales.map((s) => ({
                  valor: String(s.id),
                  etiqueta: s.activa
                    ? s.nombre
                    : `${s.nombre} (inactiva)`,
                }))}
              />
            )}

            <Buscador
              valor={busqueda}
              onChange={conReinicio(setBusqueda)}
              placeholder="Buscar por repartidor, viaje o pedido..."
            />

            <SelectFiltro
              valor={filtroEstado}
              onChange={conReinicio(setFiltroEstado)}
              etiqueta="Filtrar por estado"
              opciones={[
                { valor: "todos", etiqueta: "Todos los viajes" },
                { valor: "activo", etiqueta: "Activos" },
                { valor: "finalizado", etiqueta: "Finalizados" },
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
            <p className="text-gray-600">Cargando viajes...</p>
          ) : pagina.length === 0 ? (
            <div className="rounded-lg border bg-white px-6 py-10">
              <MensajeVacio
                mensaje={
                  hayFiltros
                    ? "No hay viajes con esos filtros."
                    : "Todavía no hay viajes en esta sucursal."
                }
              />
            </div>
          ) : (
            <>
              <ul className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {pagina.map((viaje) => (
                  <li
                    key={viaje.id}
                    className="flex w-full flex-col overflow-hidden rounded-lg border bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
                      <div>
                        <p className="font-semibold">
                          Viaje #{viaje.id}
                        </p>

                        <p className="text-xs text-gray-500">
                          Inicio: {formatearFechaHora(viaje.fechaInicio)}
                        </p>

                        {viaje.fechaFin && (
                          <p className="text-xs text-gray-500">
                            Fin: {formatearFechaHora(viaje.fechaFin)}
                          </p>
                        )}
                      </div>

                      <EstadoViaje estado={viaje.estado} />
                    </div>

                    <div className="flex flex-col gap-3 border-b py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Bike size={18} className="text-gray-500" />
                        <span className="font-medium text-gray-800">
                          {nombreRepartidor(viaje)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package size={18} />
                        {viaje.Pedidos.length}{" "}
                        {viaje.Pedidos.length === 1 ? "pedido" : "pedidos"}
                      </div>

                      <div className="flex flex-col gap-2">
                        {viaje.Pedidos.map((pedido) => {
                          const cliente = pedido.Usuario
                          ? [pedido.Usuario.nombre, pedido.Usuario.apellido]
                          .filter((parte) => parte?.trim())
                          .join(" ") || "Cliente sin nombre"
                          : "Cliente no disponible";

                          return (
                            <div
                              key={pedido.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm"
                            >
                                <div>
                                    <p className="font-medium text-gray-800">
                                        Pedido #{pedido.id}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {cliente}
                                    </p>
                                </div>

                                <span className="text-xs font-medium text-gray-600">
                                    {pedido.estado}
                                </span>


                                <button type="button" onClick={() => setDetalleId(pedido.id)}
                                    className="mt-2 text-left text-sm font-semibold text-orange-600 hover:text-orange-700">
                                        Ver detalle
                                </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={14} />
                        {viaje.estado === "activo"
                          ? "En curso"
                          : "Viaje finalizado"}
                      </span>

                      <span>
                        {viaje.Pedidos.reduce(
                          (total, pedido) => total + Number(pedido.total),
                          0,
                        ).toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

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

      <DetallePedidoModal pedidoId={detalleId} onClose={() => setDetalleId(null)}/>
    </main>
  );
}
