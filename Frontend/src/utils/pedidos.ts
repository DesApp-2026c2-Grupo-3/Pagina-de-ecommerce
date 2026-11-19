import type { Order } from '../types/order'

// "2× Hamburguesa Queso, 1× Papas" (corta si son muchos)
// Lo que pagó el cliente: productos + envío
export const totalConEnvio = (pedido: Order) => Number(pedido.total) + Number(pedido.costoEnvio ?? 0)
export function resumenItems(pedido: Order, maximo = 3) {
  const partes = pedido.DetallePedidos.map((d) => `${d.cantidad}× ${d.Producto.nombre}`)
  const resto = partes.length - maximo
  return resto > 0 ? `${partes.slice(0, maximo).join(', ')} y ${resto} más` : partes.join(', ')
}

// Día y mes abreviado para el costado de la tarjeta (ej: { dia: '05', mes: 'oct' })
export function diaYMes(fecha: string) {
  const d = new Date(fecha)
  const opciones = { timeZone: 'America/Argentina/Buenos_Aires' } as const
  return {
    dia: d.toLocaleDateString('es-AR', { ...opciones, day: '2-digit' }),
    mes: d.toLocaleDateString('es-AR', { ...opciones, month: 'short' }).replace('.', ''),
  }
}