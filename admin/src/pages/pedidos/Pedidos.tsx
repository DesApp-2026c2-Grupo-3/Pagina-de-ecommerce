import { useCallback, useEffect, useRef, useState } from "react";
import MensajeVacio from "../../components/MensajeVacio";
import Paginacion from "../../components/Paginacion";
import { BarraFiltros, Buscador, SelectFiltro } from "../../components/Filtros";
import DetallePedidoModal from "../../components/DetallePedidoModal";
import PedidoCard from "../../components/pedidos/PedidoCard";
import { useToast } from "../../context/ToastContext";
import { obtenerSucursales } from "../../services/sucursalService";
import {
  actualizarEstadoPedido,
  obtenerPedidosPorSucursal,
} from "../../services/pedidoService";
import { esEstadoFinal, puedePasarA } from "../../utils/pedidoEstado";
import type { Etapa, PedidoFila, SucursalOpcion } from "../../types/pedido.types";
import { ETAPAS } from "../../types/pedido.types";
import { useAuth } from "../../context/AuthContext";
import { usePedidosEnTiempoReal } from "../../hooks/usePedidosEnTiempoReal";
import { usePedidoDeepLink } from "../../hooks/usePedidoDeepLink";
import { ordenarPedidosPorFechaDesc } from "../../utils/pedidos/ordenPedidos";

const POR_PAGINA = 8;

// Pedidos creados antes de la validación traen estados como "pendiente" (minúscula):
// se llevan a la forma canónica para que el badge, el filtro y el selector coincidan
function normalizarEtapa(valor: string): string {
  const coincidencia = ETAPAS.find(
    (etapa) => etapa.toLowerCase() === (valor ?? "").toLowerCase(),
  );
  return coincidencia ?? valor;
}

// La red vive en services/pedidoService; acá solo se normaliza la etapa
// (lógica de presentación) para que badge, filtro y selector coincidan
async function traerPedidos(sucursalId: number): Promise<PedidoFila[]> {
  const pedidos = await obtenerPedidosPorSucursal(sucursalId);
  return pedidos.map((pedido) => ({
    ...pedido,
    estado: normalizarEtapa(pedido.estado),
  }));
}

export default function Pedidos() {
  const { mostrarToast } = useToast();
  const { administrador } = useAuth();
  const esMaster = administrador?.rol === "MASTER";
  const deepLink = usePedidoDeepLink();

  // El admin de sucursal ve la suya; el master elige cuál ver
  const [sucursales, setSucursales] = useState<SucursalOpcion[]>([]);
  const [sucursalId, setSucursalId] = useState<number | null>(() =>
    esMaster ? deepLink.sucursalId : (administrador?.sucursalId ?? null),
  );

  const [pedidos, setPedidos] = useState<PedidoFila[]>([]);
  const [cargando, setCargando] = useState(esMaster || sucursalId !== null);
  const [errorCarga, setErrorCarga] = useState("");

  // Etapa elegida por cada pedido (todavía no aceptada)
  const [seleccion, setSeleccion] = useState<Record<number, Etapa | undefined>>(
    {},
  );
  // Pedido que se está guardando y error de guardado por fila
  const [guardando, setGuardando] = useState<number | null>(null);
  const [errorFila, setErrorFila] = useState<Record<number, string>>({});

  // Pedido abierto en el detalle
  const [detalleId, setDetalleId] = useState<number | null>(null);

  useEffect(() => {
    if (!esMaster || deepLink.sucursalId === null) return;
    setSucursalId(deepLink.sucursalId);
  }, [esMaster, deepLink.sucursalId]);

  useEffect(() => {
    if (deepLink.pedidoId !== null) setDetalleId(deepLink.pedidoId);
  }, [deepLink.pedidoId]);

  const cerrarDetalle = () => {
    setDetalleId(null);
    deepLink.limpiarPedido();
  };

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);

  // Pedidos que llegaron por realtime y todavía no están visibles
  const [pedidosNuevos, setPedidosNuevos] = useState<number[]>([]);
  const [pedidoResaltadoId, setPedidoResaltadoId] = useState<number | null>(null);

  const sucursalIdRef = useRef<number | null>(sucursalId);
  const solicitudRef = useRef(0);

  useEffect(() => {
    sucursalIdRef.current = sucursalId;
  }, [sucursalId]);

  // El master trae todas las sucursales y arranca con la primera
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

  useEffect(() => {
    if (sucursalId === null) return;

    const solicitud = ++solicitudRef.current;
    setCargando(true);
    setErrorCarga("");
    setSeleccion({});
    setErrorFila({});
    setPedidosNuevos([]);
    setPedidoResaltadoId(null);

    traerPedidos(sucursalId)
      .then((lista) => {
        if (solicitud !== solicitudRef.current) return;
        setPedidos(ordenarPedidosPorFechaDesc(lista));
      })
      .catch((error) => {
        if (solicitud !== solicitudRef.current) return;
        setPedidos([]);
        setErrorCarga(
          error instanceof Error
            ? error.message
            : "Error al cargar los pedidos",
        );
      })
      .finally(() => {
        if (solicitud === solicitudRef.current) setCargando(false);
      });
  }, [sucursalId]);

  const recargarPedidos = useCallback(async () => {
    const objetivo = sucursalIdRef.current;
    if (objetivo === null) return;

    const solicitud = ++solicitudRef.current;

    try {
      const lista = await traerPedidos(objetivo);
      if (
        solicitud !== solicitudRef.current ||
        sucursalIdRef.current !== objetivo
      ) {
        return;
      }
      setPedidos(ordenarPedidosPorFechaDesc(lista));
      setErrorCarga("");
    } catch (error) {
      if (solicitud !== solicitudRef.current) return;
      setErrorCarga(
        error instanceof Error
          ? error.message
          : "Error al actualizar los pedidos",
      );
    }
  }, []);

  usePedidosEnTiempoReal({
    sucursalId,
    pausado: guardando !== null || cargando,
    onRefrescar: async (eventos) => {
      await recargarPedidos();

      const ids = eventos
        .map((evento) => evento.recursos?.pedidoId)
        .filter((id): id is number => typeof id === "number");

      if (ids.length === 0) return;

      setPedidosNuevos(ids);
      setPedidoResaltadoId(ids[ids.length - 1]);
    },
  });

  useEffect(() => {
    if (pedidoResaltadoId === null) return;

    const timer = window.setTimeout(() => setPedidoResaltadoId(null), 4000);
    return () => window.clearTimeout(timer);
  }, [pedidoResaltadoId]);

  // Al cambiar un filtro, se vuelve a la primera página
  const conReinicio = (cambiar: (valor: string) => void) => (valor: string) => {
    cambiar(valor);
    setPedidosNuevos([]);
    setPaginaActual(1);
  };

  const filtrados = pedidos.filter((pedido) => {
    const cliente = [
      pedido.Usuario?.nombre,
      pedido.Usuario?.apellido,
    ]
    .filter((parte) => parte?.trim())
    .join(" ")
    .toLowerCase();
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
  const idsVisibles = new Set(pagina.map((pedido) => pedido.id));
  const nuevosNoVisibles = pedidosNuevos.filter((id) => !idsVisibles.has(id));

  const nombreSucursal = esMaster
    ? sucursales.find((s) => s.id === sucursalId)?.nombre
    : administrador?.sucursal?.nombre;

  // Inhabilitado: sin selección, igual a la actual, guardando, cerrado
  // o un cambio que el admin no puede pedir (TRANSICIONES_ADMIN: nunca
  // "En camino"/"Entregado", que los marca el repartidor)
  const puedeAceptar = (pedido: PedidoFila) => {
    const elegida = seleccion[pedido.id];
    if (elegida === undefined) return false;
    if (guardando === pedido.id) return false;
    if (esEstadoFinal(pedido.estado)) return false;
    return puedePasarA(pedido.estado, elegida);
  };

  async function aceptar(pedido: PedidoFila) {
    const nueva = seleccion[pedido.id];
    if (!nueva || !puedeAceptar(pedido)) return;

    setGuardando(pedido.id);
    setErrorFila((prev) => ({ ...prev, [pedido.id]: "" }));
    try {
      const actualizado = await actualizarEstadoPedido(pedido.id, nueva);
      // Solo se actualiza el estado: la respuesta no trae cliente ni productos
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedido.id
            ? { ...p, estado: normalizarEtapa(actualizado.estado ?? nueva) }
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

  return (
    <main className="w-full max-w-full overflow-hidden p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Gestión de pedidos
        </p>
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="mt-2 text-gray-600">
          {nombreSucursal
            ? `Seguimiento de los pedidos de ${nombreSucursal}.`
            : "Seguimiento de los pedidos de la sucursal."}
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
                  etiqueta: s.activa ? s.nombre : `${s.nombre} (inactiva)`,
                }))}
              />
            )}
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

          {nuevosNoVisibles.length > 0 && (
            <div
              role="status"
              className="mb-4 flex flex-wrap items-center gap-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <span className="min-w-0 flex-1">
                {nuevosNoVisibles.length === 1
                  ? `Llegó el pedido #${nuevosNoVisibles[0]}.`
                  : `Llegaron ${nuevosNoVisibles.length} pedidos nuevos.`}
              </span>
              <button
                type="button"
                onClick={() => setDetalleId(nuevosNoVisibles[nuevosNoVisibles.length - 1])}
                className="rounded border border-amber-400 bg-white px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100"
              >
                Ver pedido
              </button>
              <button
                type="button"
                onClick={() => setPedidosNuevos([])}
                className="rounded px-2 py-1.5 font-semibold text-amber-900 hover:bg-amber-100"
              >
                Descartar
              </button>
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
                    : "Todavía no hay pedidos en esta sucursal."
                }
              />
            </div>
          ) : (
            <>
              {/* Tarjetas de pedidos: 1 columna en móvil, 2 en md/lg */}
              <ul className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {pagina.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    etapaSeleccionada={seleccion[pedido.id]}
                    guardando={guardando === pedido.id}
                    error={errorFila[pedido.id]}
                    puedeAceptar={puedeAceptar(pedido)}
                    resaltado={pedido.id === pedidoResaltadoId}
                    onSeleccionarEtapa={(etapa) =>
                      setSeleccion((prev) => ({ ...prev, [pedido.id]: etapa }))
                    }
                    onAceptar={() => {
                      void aceptar(pedido);
                    }}
                    onVerDetalle={() => setDetalleId(pedido.id)}
                  />
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

      <DetallePedidoModal pedidoId={detalleId} onClose={cerrarDetalle} />
    </main>
  );
}
