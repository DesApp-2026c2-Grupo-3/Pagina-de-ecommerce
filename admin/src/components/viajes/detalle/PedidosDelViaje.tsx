import { ChevronRight, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PedidoDeViaje } from '../../../types/viaje.types'
import { rutaDetallePedido } from '../../../utils/navegacion/rutasPedido'
import { formatearPrecio } from '../../../utils/pedidos/resumenPedido'
import { formatearHora } from '../../../utils/viajes/resumenViaje'
import EtapaBadge from '../../pedidos/EtapaBadge'

function cliente(pedido: PedidoDeViaje): string {
  if (!pedido.Usuario) return 'Cliente no disponible'
  return [pedido.Usuario.nombre, pedido.Usuario.apellido].filter((p) => p?.trim()).join(' ') || 'Cliente sin nombre'
}

// Pedidos del viaje. «Ver pedido» abre su página y desde ahí se vuelve a este viaje.
export default function PedidosDelViaje({
  pedidos,
  sucursalEnlace,
  desde,
}: {
  pedidos: PedidoDeViaje[]
  sucursalEnlace: number | null
  // Ruta actual (/admin/viajes/512?…): el detalle del pedido vuelve acá
  desde: string
}) {
  return (
    <section aria-labelledby="titulo-pedidos-viaje" className="rounded-xl border border-gray-200 bg-white p-4 @3xl:p-5">
      <h2 id="titulo-pedidos-viaje" className="mb-3 font-bold text-gray-900">
        Pedidos del viaje ({pedidos.length})
      </h2>
      {pedidos.length === 0 ? (
        <p className="text-sm text-gray-600">Este viaje no tiene pedidos.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-200">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-extrabold text-gray-900">#{pedido.id}</span>
                  <EtapaBadge estado={pedido.estado} />
                </p>
                <p className="mt-1 truncate font-semibold text-gray-800">{cliente(pedido)}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    {pedido.retiradoEn ? (
                      <>
                        <PackageCheck size={14} aria-hidden="true" /> Retirado {formatearHora(pedido.retiradoEn)}
                      </>
                    ) : (
                      'Sin retirar'
                    )}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">{formatearPrecio(pedido.total)}</span>
                </p>
              </div>
              <Link
                to={rutaDetallePedido(pedido.id, sucursalEnlace)}
                state={{ desde }}
                aria-label={`Ver el pedido ${pedido.id}`}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 @xl:min-h-9"
              >
                Ver pedido <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
