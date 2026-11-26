import MensajeVacio from '../MensajeVacio'
import Paginacion from '../Paginacion'
import type { PedidoFila } from '../../types/pedido.types'
import type { EstadoNavegacionPedido } from '../../utils/navegacion/rutasPedido'
import { rutaDetallePedido } from '../../utils/navegacion/rutasPedido'
import PedidoCard from './PedidoCard'

interface Props {
  cargando: boolean
  pedidos: PedidoFila[]
  totalFiltrados: number
  hayFiltros: boolean
  pagina: number
  porPagina: number
  onPagina: (pagina: number) => void
  resaltados: number[]
  armadoId: number | null
  guardandoId: number | null
  errores: Record<number, string>
  // Sucursal para el enlace al detalle (solo la usa el MASTER al volver)
  sucursalEnlace: number | null
  estadoNavegacion: EstadoNavegacionPedido
  onAccionRapida: (pedido: PedidoFila) => void
}

export default function ListaPedidos({
  cargando,
  pedidos,
  totalFiltrados,
  hayFiltros,
  pagina,
  porPagina,
  onPagina,
  resaltados,
  armadoId,
  guardandoId,
  errores,
  sucursalEnlace,
  estadoNavegacion,
  onAccionRapida,
}: Props) {
  if (cargando) return <p className="text-gray-600">Cargando pedidos...</p>

  if (pedidos.length === 0) {
    return (
      <div className="rounded-lg border bg-white px-6 py-10">
        <MensajeVacio
          mensaje={hayFiltros ? 'No hay pedidos con esos filtros.' : 'Todavía no hay pedidos en esta sucursal.'}
        />
      </div>
    )
  }

  return (
    <>
      <ul aria-label="Pedidos" className="flex w-full flex-col gap-2.5">
          {pedidos.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              resaltado={resaltados.includes(pedido.id)}
              armado={armadoId === pedido.id}
              guardando={guardandoId === pedido.id}
              error={errores[pedido.id]}
              enlaceDetalle={rutaDetallePedido(pedido.id, sucursalEnlace)}
              estadoNavegacion={estadoNavegacion}
              onAccionRapida={() => onAccionRapida(pedido)}
            />
          ))}
      </ul>
      <Paginacion
        paginaActual={pagina}
        totalElementos={totalFiltrados}
        elementosPorPagina={porPagina}
        cambiarPagina={onPagina}
      />
    </>
  )
}
