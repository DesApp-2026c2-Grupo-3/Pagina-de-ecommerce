import { normalizarEstado, puedePasarA } from '../pedidoEstado'

// RN-23: Pendiente, En proceso y Listo para retirar se cancelan desde el panel,
// salvo un Listo para retirar que el repartidor ya retiró del local.
// El backend vuelve a validarlo (responde 409 si lo retiraron mientras tanto).
export function puedeCancelarDesdePanel(
  estado: string,
  retiradoEn?: string | null,
): boolean {
  if (!puedePasarA(estado, 'Cancelado')) return false
  if (normalizarEstado(estado) === 'Listo para retirar' && retiradoEn) return false
  return true
}

// Consecuencia concreta de cancelar, según el estado (RN-09 y RN-23)
export function textoConfirmacionCancelacion(
  estado: string,
  enViaje = false,
): string {
  switch (normalizarEstado(estado)) {
    case 'Pendiente':
      return 'Se devuelve automáticamente el stock que se descontó al confirmar.'
    case 'En proceso':
      return 'El stock no se devuelve automáticamente: si hace falta, ajustalo a mano en Stock.'
    case 'Listo para retirar':
      return enViaje
        ? 'El stock no se devuelve automáticamente. El pedido sale del viaje en preparación y se avisa al repartidor.'
        : 'El stock no se devuelve automáticamente: si hace falta, ajustalo a mano en Stock.'
    default:
      return ''
  }
}
