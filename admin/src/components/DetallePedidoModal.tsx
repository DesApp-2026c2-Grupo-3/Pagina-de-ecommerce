import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { obtenerPedidoPorId } from "../services/pedidoService";
import { formatearFechaHora } from "../utils/pedidoEstado";
import SeguimientoPedidoAdmin from "./SeguimientoPedidoAdmin";
import ClientePedido from "./pedidos/detalle/ClientePedido";
import EntregaPedido from "./pedidos/detalle/EntregaPedido";
import ObservacionesPedido from "./pedidos/detalle/ObservacionesPedido";
import ProductosPedido from "./pedidos/detalle/ProductosPedido";
import { useBloquearScroll } from "../hooks/useBloquearScroll";
import type {
  PedidoCompleto,
  PropsDetallePedidoModal,
} from "../types/pedido.types";

// Detalle de solo lectura que todavía usa la pantalla de Viajes.
// Pedidos ya no lo usa: tiene su página propia (/admin/pedidos/:pedidoId).
// Las secciones son las mismas de esa página (components/pedidos/detalle).
export default function DetallePedidoModal({
  pedidoId,
  onClose,
}: PropsDetallePedidoModal) {
  const [pedido, setPedido] = useState<PedidoCompleto | null>(null);
  const [error, setError] = useState("");
  // Al abrir otro pedido se limpia en el mismo render (no en el efecto)
  const [pedidoMostrado, setPedidoMostrado] = useState(pedidoId);
  if (pedidoMostrado !== pedidoId) {
    setPedidoMostrado(pedidoId);
    setPedido(null);
    setError("");
  }
  // Mientras está abierto, la página de atrás no se mueve (cerrado = sin pedido elegido)
  useBloquearScroll(pedidoId !== null);

  useEffect(() => {
    if (pedidoId === null) return;
    let cancelado = false;

    obtenerPedidoPorId(pedidoId)
      .then((detalle: PedidoCompleto) => {
        if (!cancelado) setPedido(detalle);
      })
      .catch(
        (err) =>
          !cancelado &&
          setError(
            err instanceof Error ? err.message : "No se pudo cargar el pedido",
          ),
      );

    return () => {
      cancelado = true;
    };
  }, [pedidoId]);

  // Esc cierra
  useEffect(() => {
    if (pedidoId === null) return;
    const alApretar = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", alApretar);
    return () => document.removeEventListener("keydown", alApretar);
  }, [pedidoId, onClose]);

  if (pedidoId === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-detalle-pedido"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="titulo-detalle-pedido" className="text-xl font-bold">
              Pedido #{pedidoId}
            </h2>
            {pedido && (
              <p className="text-sm text-gray-600">
                {formatearFechaHora(pedido.fecha)} ·{" "}
                {pedido.Sucursal?.nombre ?? "Sucursal"} · {pedido.estado}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded p-1 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {!pedido && !error && <p className="mt-4 text-gray-600">Cargando...</p>}

        {pedido && (
          <div className="mt-6 flex flex-col gap-4">
            <section className="rounded border p-3">
              <h3 className="font-semibold">Seguimiento del pedido</h3>
              <div className="mt-2">
                <SeguimientoPedidoAdmin
                  estado={pedido.estado}
                  historial={pedido.historialDeTiemposPedidos ?? []}
                />
              </div>
            </section>
            <ObservacionesPedido observaciones={pedido.observaciones} />
            <ProductosPedido
              DetallePedidos={pedido.DetallePedidos}
              catalogo={pedido.catalogo}
              total={pedido.total}
              costoEnvio={pedido.costoEnvio}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <EntregaPedido direccion={pedido.Direccion} />
              <ClientePedido usuario={pedido.Usuario} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
