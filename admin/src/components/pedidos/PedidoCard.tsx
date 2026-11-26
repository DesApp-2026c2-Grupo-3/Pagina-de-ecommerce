import EnlaceDetalle from '../listas/EnlaceDetalle'
import NotaSinAccion from '../listas/NotaSinAccion'
import TarjetaFila from '../listas/TarjetaFila'
import type { PedidoFila } from '../../types/pedido.types'
import { formatearFechaHora, normalizarEstado } from '../../utils/pedidoEstado'
import type { EstadoNavegacionPedido } from '../../utils/navegacion/rutasPedido'
import {
  formatearPrecio,
  nombreCliente,
  resumenProductos,
  siguienteEtapaRapida,
} from '../../utils/pedidos/resumenPedido'
import EtapaBadge from './EtapaBadge'

interface PedidoCardProps {
  pedido: PedidoFila
  // Recién salido de la cola: recuadro ámbar + «Nuevo»
  resaltado: boolean
  // Primer clic dado: el botón pide confirmación
  armado: boolean
  guardando: boolean
  error: string | undefined
  enlaceDetalle: string
  estadoNavegacion: EstadoNavegacionPedido
  onAccionRapida: () => void
}

// Por qué no hay acción rápida (sin color de urgencia: solo texto, D6)
function notaSinAccion(pedido: PedidoFila): string {
  switch (normalizarEstado(pedido.estado)) {
    case 'Listo para retirar':
      if (pedido.retiradoEn) return 'Retirado · no se cancela'
      return pedido.viajeId ? 'En un viaje · sin retirar' : 'Esperando repartidor'
    case 'En camino':
      return 'Lo gestiona el repartidor'
    default:
      return 'Solo lectura'
  }
}

// Tarjeta de un pedido sobre la fila compartida con Viajes (plan responsivo, 4.1)
export default function PedidoCard({
  pedido,
  resaltado,
  armado,
  guardando,
  error,
  enlaceDetalle,
  estadoNavegacion,
  onAccionRapida,
}: PedidoCardProps) {
  const siguiente = siguienteEtapaRapida(pedido.estado)
  const productos = resumenProductos(pedido)
  const hora = formatearFechaHora(pedido.fecha)

  return (
    <TarjetaFila
      identificador={{ principal: `#${pedido.id}`, secundario: hora }}
      titulo={nombreCliente(pedido)}
      subtitulo={productos}
      importe={formatearPrecio(pedido.total)}
      estado={<EtapaBadge estado={pedido.estado} />}
      tono={resaltado ? 'nuevo' : 'normal'}
      error={error}
      acciones={
        <>
          {siguiente ? (
            <button
              type="button"
              onClick={onAccionRapida}
              disabled={guardando}
              aria-label={
                armado
                  ? `Confirmar: pasar el pedido ${pedido.id} a ${siguiente}`
                  : `Pasar el pedido ${pedido.id} a ${siguiente}`
              }
              className={`min-h-11 flex-1 whitespace-nowrap rounded-lg border px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 @xl:min-h-9 @xl:flex-none ${
                armado
                  ? 'border-action bg-action text-white hover:bg-action-hover'
                  : 'border-orange-600 bg-white text-orange-700 hover:bg-orange-50'
              }`}
            >
              {guardando ? 'Guardando...' : armado ? '¿Confirmar?' : `→ ${siguiente}`}
            </button>
          ) : (
            <NotaSinAccion texto={notaSinAccion(pedido)} />
          )}
          <EnlaceDetalle to={enlaceDetalle} estado={estadoNavegacion} etiqueta={`Ver detalle del pedido ${pedido.id}`} />
        </>
      }
    />
  )
}
