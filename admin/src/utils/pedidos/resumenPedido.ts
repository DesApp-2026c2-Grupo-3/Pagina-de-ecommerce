import type { Etapa, PedidoFila } from '../../types/pedido.types'
import { opcionesDeEtapa } from '../pedidoEstado'

type ConUsuario = Pick<PedidoFila, 'Usuario'>

export function nombreCliente(pedido: ConUsuario): string {
  const partes = [pedido.Usuario?.nombre, pedido.Usuario?.apellido]
    .filter((parte) => parte?.trim())
    .join(' ')
  return partes || 'Cliente no disponible'
}

// "2× Hamburguesa doble · 1× Papas · +2 más"
export function resumenProductos(
  pedido: Pick<PedidoFila, 'DetallePedidos'>,
  maximo = 3,
): string {
  const detalles = pedido.DetallePedidos ?? []
  const primeros = detalles
    .slice(0, maximo)
    .map((d) => `${d.cantidad}× ${d.Producto?.nombre ?? 'producto'}`)
  const resto = detalles.length - Math.min(detalles.length, maximo)
  if (resto > 0) primeros.push(`+${resto} más`)
  return primeros.join(' · ') || 'Sin productos'
}

// El único avance posible desde la etapa actual (nunca Cancelado: eso va solo
// en el detalle, con su confirmación). null si el panel no puede avanzar.
export function siguienteEtapaRapida(estado: string): Etapa | null {
  const avances = opcionesDeEtapa(estado)
    .slice(1)
    .filter((etapa) => etapa !== 'Cancelado')
  return (avances[0] as Etapa | undefined) ?? null
}

export function formatearPrecio(valor: number | string | null | undefined): string {
  return `$${Number(valor ?? 0).toLocaleString('es-AR')}`
}
