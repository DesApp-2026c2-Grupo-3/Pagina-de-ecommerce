import type { Etapa } from '../../types/pedido.types'
import { normalizarEstado } from '../pedidoEstado'
import { siguienteEtapaRapida } from './resumenPedido'

// Textos del panel «Próximo paso» del bloque de seguimiento (plan responsivo, 4.4.1)
export interface ProximoPaso {
  destino: Etapa
  // Cuándo usar el botón
  pista: string
  // Qué pasa al confirmar (RN-23 sin vuelta atrás; RN-30 aviso a repartidores)
  efecto: string
}

const PISTAS: Partial<Record<Etapa, string>> = {
  'En proceso': 'Cuando la cocina empiece a prepararlo.',
  'Listo para retirar': 'Cuando el pedido esté preparado y embalado.',
}

const EFECTOS: Partial<Record<Etapa, string>> = {
  'En proceso': 'Después no se puede volver a «Pendiente».',
  'Listo para retirar':
    'Se avisa a los repartidores disponibles. Después no se puede volver atrás.',
}

export function proximoPaso(estado: string): ProximoPaso | null {
  const destino = siguienteEtapaRapida(estado)
  if (!destino) return null
  return {
    destino,
    pista: PISTAS[destino] ?? '',
    efecto: EFECTOS[destino] ?? 'Después no se puede volver atrás.',
  }
}

// Mensaje cuando el panel no tiene avance que ofrecer
export function textoSinAvance(
  estado: string,
  opciones: { retirado: boolean; enViaje: boolean },
): string | null {
  switch (normalizarEstado(estado)) {
    case 'Listo para retirar':
      if (opciones.retirado) {
        return 'El repartidor ya retiró el pedido. Pasa a «En camino» cuando inicie el viaje. Ya no se puede cancelar desde el panel.'
      }
      return opciones.enViaje
        ? 'Esperando que el repartidor lo retire: está en un viaje en preparación, todavía sin retirar.'
        : 'Esperando que un repartidor lo tome y lo retire.'
    case 'En camino':
      return 'Está en viaje con el repartidor. La entrega la marca él desde su app.'
    case 'Entregado':
      return 'Pedido entregado. Solo lectura.'
    case 'Cancelado':
      return 'Pedido cancelado. Solo lectura.'
    default:
      return null
  }
}
