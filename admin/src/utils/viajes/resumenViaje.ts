import type { Viaje } from '../../types/viaje.types'
import { normalizarEstado } from '../pedidoEstado'
import { normalizarEstadoViaje } from './estadoViaje'

const ZONA = 'America/Argentina/Buenos_Aires'

// «14:20» (24 h, hora de Argentina)
export function formatearHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleTimeString('es-AR', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}

export function nombreRepartidor(viaje: Pick<Viaje, 'Repartidor'>): string {
  const r = viaje.Repartidor
  if (!r) return 'Repartidor no disponible'
  return [r.nombre, r.apellido].filter((parte) => parte?.trim()).join(' ') || 'Repartidor sin nombre'
}

// «Inicio 14:20» o «Sin iniciar» (un viaje en preparación todavía no salió)
export function textoInicio(viaje: Pick<Viaje, 'fechaInicio'>): string {
  return viaje.fechaInicio ? `Inicio ${formatearHora(viaje.fechaInicio)}` : 'Sin iniciar'
}

// «3 pedidos · #18301, #18302, +1»
export function textoPedidos(viaje: Pick<Viaje, 'Pedidos'>, maximo = 2): string {
  const pedidos = viaje.Pedidos ?? []
  if (pedidos.length === 0) return 'Sin pedidos'
  const cantidad = `${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'}`
  const ids = pedidos.slice(0, maximo).map((p) => `#${p.id}`).join(', ')
  const resto = pedidos.length > maximo ? `, +${pedidos.length - maximo}` : ''
  return `${cantidad} · ${ids}${resto}`
}

export function totalViaje(viaje: Pick<Viaje, 'Pedidos'>): number {
  return (viaje.Pedidos ?? []).reduce((total, pedido) => total + Number(pedido.total ?? 0), 0)
}

export interface NotaViaje {
  texto: string
  icono: 'reloj' | 'candado'
}

// Nota de la tarjeta cuando no hay acción (el viaje lo mueve el repartidor, RN-31).
// null = requiere asistencia: en su lugar va el botón «Atender asistencia».
export function notaDeViaje(viaje: Pick<Viaje, 'estado' | 'Pedidos' | 'fechaFin'>): NotaViaje | null {
  const pedidos = viaje.Pedidos ?? []
  switch (normalizarEstadoViaje(viaje.estado)) {
    case 'preparando': {
      const retirados = pedidos.filter((p) => p.retiradoEn).length
      return { texto: `Retirados ${retirados} de ${pedidos.length}`, icono: 'reloj' }
    }
    case 'activo': {
      const entregados = pedidos.filter((p) => normalizarEstado(p.estado) === 'Entregado').length
      return { texto: `Entregados ${entregados} de ${pedidos.length}`, icono: 'reloj' }
    }
    case 'finalizado':
      return { texto: viaje.fechaFin ? `Finalizado ${formatearHora(viaje.fechaFin)}` : 'Finalizado', icono: 'candado' }
    case 'requiere asistencia':
      return null
    default:
      return { texto: 'Solo lectura', icono: 'candado' }
  }
}
