
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bike, Package, Clock, AlertTriangle, ChevronUp, ChevronDown, MapPin } from "lucide-react";
import MensajeVacio from "../../components/MensajeVacio";
import Paginacion from "../../components/Paginacion";
import { BarraFiltros, Buscador, SelectFiltro } from "../../components/Filtros";
import { obtenerSucursales } from "../../services/sucursalService";
import { obtenerViajesPorSucursal, reasignarViaje } from "../../services/viajeService";
import { useAuth } from "../../context/AuthContext";
import type { SucursalOpcion } from "../../types/pedido.types";
import type { Viaje } from "../../types/viaje.types";
import DetallePedidoModal from "../../components/DetallePedidoModal";
import ModalReasignarRepartidor from "../../components/viajes/ModalReasignarRepartidor"; 
import { useViajesEnTiempoReal } from "../../hooks/useViajesEnTiempoReal";
import { leerIdPositivo } from "../../utils/navegacion/leerIdPositivo";
import { PARAM_SUCURSAL } from "../../utils/navegacion/parametros";

// D-22: el cartel de reasignación se cierra solo
const DURACION_CARTEL_REASIGNACION_MS = 8000;

const POR_PAGINA = 8;

function formatearFechaHora(valor: string | null) {
  if (!valor) return "Pendiente de inicio";

  return new Date(valor).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatearHora(valor: string) {
  return new Date(valor).toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
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
    preparando: "bg-blue-100 text-blue-700",
    "requiere asistencia": "bg-red-100 text-red-700",
    cancelado: "bg-gray-200 text-gray-700",
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
  const [searchParams, setSearchParams] = useSearchParams();
  const sucursalEnlace = leerIdPositivo(searchParams.get(PARAM_SUCURSAL));

  const [sucursalId, setSucursalId] = useState<number | null>(
    esMaster
      ? sucursalEnlace ?? administrador?.sucursalId ?? null
      : administrador?.sucursalId ?? null,
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

  const [detalleAsistenciaId, setDetalleAsistenciaId] = useState<number | null>(null);

  const [viajeReasignacionId, setViajeReasignacionId] = useState<number | null>(null);

  const [reasignando, setReasignando] = useState(false);
  const [mensajeReasignacion, setMensajeReasignacion] = useState("");
  const [errorReasignacion, setErrorReasignacion] = useState("");

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

  // Una notificación de asistencia trae ?sucursal=: el MASTER salta a esa sucursal.
  // El parámetro se consume para que otra notificación igual vuelva a funcionar.
  useEffect(() => {
    if (!searchParams.has(PARAM_SUCURSAL)) return;

    if (esMaster && sucursalEnlace !== null) {
      setSucursalId(sucursalEnlace);
      setPaginaActual(1);
    }

    const siguientes = new URLSearchParams(searchParams);
    siguientes.delete(PARAM_SUCURSAL);
    setSearchParams(siguientes, { replace: true });
  }, [esMaster, sucursalEnlace, searchParams, setSearchParams]);

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

  // Refresco en vivo: recarga sin spinner para no perder el scroll ni los desplegables
  const sucursalVigenteRef = useRef(sucursalId);
  useEffect(() => {
    sucursalVigenteRef.current = sucursalId;
  }, [sucursalId]);

  const recargarViajes = useCallback(async () => {
    if (sucursalId === null) return;

    const lista = await obtenerViajesPorSucursal(sucursalId);
    // Si mientras tanto se eligió otra sucursal, esta respuesta ya no aplica
    if (sucursalVigenteRef.current !== sucursalId) return;

    setViajes(lista);
    setErrorCarga("");
  }, [sucursalId]);

  useViajesEnTiempoReal({
    sucursalId,
    pausado: cargando || reasignando,
    onRefrescar: recargarViajes,
  });

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

  // D-22: el cartel de una reasignación se cierra solo a los pocos segundos
  useEffect(() => {
    if (!mensajeReasignacion) return;
    const temporizador = window.setTimeout(
      () => setMensajeReasignacion(""),
      DURACION_CARTEL_REASIGNACION_MS
    );
    return () => window.clearTimeout(temporizador);
  }, [mensajeReasignacion]);

  function abrirReasignacion(viajeId: number) {
    // D-22: al empezar otra reasignación se descartan los carteles de la anterior
    setMensajeReasignacion("");
    setErrorReasignacion("");
    setViajeReasignacionId(viajeId);
  }

  async function confirmarReasignacion(repartidorId: number) {
    if (viajeReasignacionId === null) return;

    setReasignando(true);
    setErrorReasignacion("");
    setMensajeReasignacion("");

    try {
      const { viaje, repartidorAnterior } = await reasignarViaje(viajeReasignacionId, repartidorId);

      // D-22 / D-24: a quién pasó el viaje y que el anterior quedó inactivo
      setMensajeReasignacion(
        `Viaje #${viaje.id} reasignado a ${viaje.Repartidor.nombre} ${viaje.Repartidor.apellido}. ` +
        `${repartidorAnterior.nombre} ${repartidorAnterior.apellido} quedó inactivo hasta que lo reactives desde Repartidores.`
      );

      setViajeReasignacionId(null);

      // Actualizamos los viajes para mostrar al nuevo repartidor.
      const lista = await obtenerViajesPorSucursal(sucursalId!);
      setViajes(lista);

    } catch (error) {
      setErrorReasignacion(
        error instanceof Error
          ? error.message
          : "No se pudo reasignar el viaje."
      );
    } finally {
      setReasignando(false);
    }
  }

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

      {mensajeReasignacion && (
        <div role="status" className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          {mensajeReasignacion}
        </div>
        )
      }

      {errorReasignacion && (
        <div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {errorReasignacion}
        </div>
      )
    }

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
                { valor: "preparando", etiqueta: "Preparando" },
                { valor: "activo", etiqueta: "Activos" },
                { valor: "requiere asistencia", etiqueta: "Requieren asistencia" },
                { valor: "finalizado", etiqueta: "Finalizados" },
                { valor: "cancelado", etiqueta: "Cancelados" },
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

                        {/* D-16 v2: el viaje se conserva aunque el repartidor ya no esté */}
                        {viaje.Repartidor?.deletedAt && (
                          <span
                            title={`Dado de baja el ${formatearFechaHora(viaje.Repartidor.deletedAt)}`}
                            className="rounded-md bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700"
                          >
                            Dado de baja
                          </span>
                        )}
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

                                <div className="flex flex-wrap items-center gap-2">
                                    {/* D-07: retirado del local pero el viaje todavía no salió */}
                                    {pedido.retiradoEn && pedido.estado === "Listo para retirar" && (
                                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                            Retirado {formatearHora(pedido.retiradoEn)}
                                        </span>
                                    )}

                                    <span className="text-xs font-medium text-gray-600">
                                        {pedido.estado}
                                    </span>
                                </div>


                                <button type="button" onClick={() => setDetalleId(pedido.id)}
                                    className="mt-2 text-left text-sm font-semibold text-orange-600 hover:text-orange-700">
                                        Ver detalle
                                </button>
                            </div>
                          );
                        })}
                      </div>
                      
                      {viaje.estado === "requiere asistencia" && (
                        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
                          <button type="button"
                          onClick={() => setDetalleAsistenciaId((actual) =>
                          actual === viaje.id ? null : viaje.id
                          )}
                        className="flex w-full items-center justify-between text-left"
                        aria-expanded={detalleAsistenciaId === viaje.id}>
                        <span className="flex items-center gap-2 font-semibold text-amber-800">
                          <AlertTriangle size={18} />
                            Detalles de asistencia
                        </span>

                        {detalleAsistenciaId === viaje.id ? (
                          <ChevronUp size={18} className="text-amber-800" />
                        ) : (
                          <ChevronDown size={18} className="text-amber-800" />
                        )}
                        </button>
                        
                        {detalleAsistenciaId === viaje.id && (
                          <div className="mt-3 space-y-3 border-t border-amber-200 pt-3">
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Motivo
                              </p>
                              <p className="font-semibold text-gray-800">
                                {viaje.motivoAsistencia ?? "No especificado"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Comentario del repartidor
                              </p>
                              <p className="text-sm text-gray-800 [overflow-wrap:anywhere]">
                                {viaje.comentarioAsistencia?.trim() ||
                                    "El repartidor no agregó comentarios."}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Solicitud
                              </p>
                              <p className="text-sm text-gray-800">
                                {viaje.fechaSolicitudAsistencia ? formatearFechaHora(viaje.fechaSolicitudAsistencia)
                                : "Fecha no disponible"}
                              </p>
                            </div>

                            <div>
                              <p className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                <MapPin size={15} />
                                Ubicación del repartidor
                              </p>
                              
                              {viaje.latitudAsistencia != null &&
                              viaje.longitudAsistencia != null ? (
                              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border
                               border-orange-200 bg-white p-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-800">
                                    Punto de asistencia registrado
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Ubicación guardada al solicitar ayuda.
                                  </p>
                                </div>
                                
                                <a href={`https://www.google.com/maps?q=${viaje.latitudAsistencia},${viaje.longitudAsistencia}`}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-orange-500
                                 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600">
                                  <MapPin size={15} />
                                  Ver mapa
                                </a>
                              </div>
                              ) : (
                              <p className="mt-1 text-sm text-gray-600">
                                No hay una ubicación registrada.
                              </p>
                            )}
                          </div>
                        </div>
                        )}

                        <button type="button" onClick={() => abrirReasignacion(viaje.id)}
                        className="mt-3 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
                          Reasignar repartidor
                        </button>
                        </div>
                      )}

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

      {viajeReasignacionId !== null && (
        <ModalReasignarRepartidor
        viajeId={viajeReasignacionId}
        onClose={() => setViajeReasignacionId(null)}
        onSeleccionar={confirmarReasignacion}
        procesando={reasignando}
        />
      )}

    </main>
  );
}
