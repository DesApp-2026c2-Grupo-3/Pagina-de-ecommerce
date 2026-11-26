import { MOTIVOS_BAJA } from '../../services/stockService'
import type { Movimiento } from '../../types/stock.types'

export type TipoMovimiento = Movimiento['tipo']
export type FiltroTipoMovimiento = 'todos' | TipoMovimiento

export const TIPOS_MOVIMIENTO: { valor: TipoMovimiento; etiqueta: string; plural: string; clases: string }[] = [
  { valor: 'aumento', etiqueta: 'Aumento', plural: 'Aumentos', clases: 'bg-green-100 text-green-800' },
  { valor: 'baja', etiqueta: 'Baja', plural: 'Bajas', clases: 'bg-red-100 text-red-800' },
  { valor: 'venta', etiqueta: 'Venta', plural: 'Ventas', clases: 'bg-blue-100 text-blue-800' },
  { valor: 'devolucion', etiqueta: 'Devolución', plural: 'Devoluciones', clases: 'bg-gray-200 text-gray-700' },
]

const POR_TIPO = new Map(TIPOS_MOVIMIENTO.map((t) => [t.valor, t]))

export function datosTipoMovimiento(tipo: string) {
  return POR_TIPO.get(tipo as TipoMovimiento) ?? { valor: tipo, etiqueta: tipo, plural: tipo, clases: 'bg-gray-200 text-gray-700' }
}

// Las ventas y las bajas restan stock; los aumentos y las devoluciones suman
export function restaStock(m: Pick<Movimiento, 'tipo'>): boolean {
  return m.tipo === 'baja' || m.tipo === 'venta'
}

export function textoCantidadMovimiento(m: Pick<Movimiento, 'tipo' | 'cantidad'>): string {
  return `${restaStock(m) ? '−' : '+'}${m.cantidad.toLocaleString('es-AR')}`
}

// Mismos textos que la pantalla anterior
export function descripcionMovimiento(m: Movimiento): string {
  if (m.tipo === 'baja') return MOTIVOS_BAJA.find((x) => x.valor === m.motivo)?.etiqueta ?? 'Baja manual'
  if (m.tipo === 'venta') return `Venta · pedido #${m.pedidoId}`
  if (m.tipo === 'devolucion') return `Pedido #${m.pedidoId} cancelado`
  return 'Carga de stock'
}

// Ventas y devoluciones las registra el sistema; el resto, un administrador (RN-10)
export function responsableMovimiento(m: Movimiento): string {
  if (m.tipo === 'venta' || m.tipo === 'devolucion') return 'Automático'
  return m.admin ? `Por ${m.admin}` : 'Responsable no registrado'
}

// «24/11 23:10» (hora de Argentina, 24 h)
export function formatearFechaMovimiento(valor: string): string {
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return '—'
  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(fecha)
  const p = (tipo: string) => partes.find((x) => x.type === tipo)?.value ?? ''
  return `${p('day')}/${p('month')} ${p('hour')}:${p('minute')}`
}

// Busca por insumo o por número de pedido («18332» o «#18332»)
export function coincideBusquedaMovimiento(m: Movimiento, busqueda: string): boolean {
  const termino = busqueda.trim().toLowerCase().replace(/^#/, '')
  if (!termino) return true
  if (m.insumo.toLowerCase().includes(termino)) return true
  return m.pedidoId !== null && String(m.pedidoId).includes(termino)
}

export function esFiltroTipoMovimiento(valor: unknown): valor is FiltroTipoMovimiento {
  return valor === 'todos' || POR_TIPO.has(valor as TipoMovimiento)
}

export function filtrarMovimientos(movimientos: Movimiento[], { busqueda, tipo }: { busqueda: string; tipo: FiltroTipoMovimiento }) {
  return movimientos.filter((m) => coincideBusquedaMovimiento(m, busqueda) && (tipo === 'todos' || m.tipo === tipo))
}

export function contarPorTipoMovimiento(movimientos: Movimiento[], busqueda: string): Record<FiltroTipoMovimiento, number> {
  const conteo: Record<FiltroTipoMovimiento, number> = { todos: 0, aumento: 0, baja: 0, venta: 0, devolucion: 0 }
  for (const m of movimientos) {
    if (!coincideBusquedaMovimiento(m, busqueda)) continue
    conteo.todos += 1
    if (m.tipo in conteo) conteo[m.tipo] += 1
  }
  return conteo
}
