import type { RefObject } from 'react'
import type { PedidoCompleto } from '../../../types/pedido.types'
import { formatearFechaHora } from '../../../utils/pedidoEstado'
import EtapaBadge from '../EtapaBadge'

interface Props {
  pedido: PedidoCompleto
  refTitulo: RefObject<HTMLHeadingElement | null>
}

// Número, etapa, fecha, sucursal y tiempo estimado (el que guardó el pedido, RN-26)
export default function EncabezadoDetallePedido({ pedido, refTitulo }: Props) {
  const datos = [
    formatearFechaHora(pedido.fecha),
    pedido.Sucursal?.nombre,
    pedido.minutosEstimados ? `Tiempo estimado: ${pedido.minutosEstimados} min` : null,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <h1
          ref={refTitulo}
          tabIndex={-1}
          className="text-2xl font-extrabold text-gray-900 outline-none @3xl:text-3xl"
        >
          Pedido #{pedido.id}
        </h1>
        <EtapaBadge estado={pedido.estado} tamano="md" />
      </div>
      <p className="text-sm text-gray-600">{datos.join(' · ')}</p>
    </div>
  )
}
