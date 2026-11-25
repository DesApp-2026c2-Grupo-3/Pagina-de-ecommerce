import { beforeEach, describe, expect, test } from 'vitest'

import {
  clasesEstadoViaje,
  esFiltroEstadoViaje,
  etiquetaEstadoViaje,
  tonoDeViaje,
} from '../../utils/viajes/estadoViaje'
import { contarPorEstadoViaje, filtrarViajes } from '../../utils/viajes/filtrarViajes'
import { nombreRepartidor, notaDeViaje, textoInicio, textoPedidos, totalViaje } from '../../utils/viajes/resumenViaje'
import { textoConsecuenciaReasignacion } from '../../utils/viajes/reasignacion'
import { destinoVolverViaje, rutaDetalleViaje, rutaListaViajes } from '../../utils/navegacion/rutasViaje'
import { destinoVolver, etiquetaVolver } from '../../utils/navegacion/rutasPedido'
import {
  guardarSucursal,
  leerSucursalGuardada,
  limpiarSucursalesGuardadas,
  resolverSucursal,
} from '../../utils/sucursalGuardada'
import type { PedidoDeViaje, Viaje } from '../../types/viaje.types'

function pedido(id: number, estado: string, extra: Partial<PedidoDeViaje> = {}): PedidoDeViaje {
  return { id, fecha: '2026-11-24T17:00:00.000Z', estado, total: 1000, retiradoEn: null, Usuario: { id: 1, nombre: 'Juan', apellido: 'Pérez' }, ...extra }
}

function viaje(id: number, estado: Viaje['estado'], pedidos: PedidoDeViaje[], extra: Partial<Viaje> = {}): Viaje {
  return {
    id, repartidorId: 1, fechaInicio: '2026-11-24T17:20:00.000Z', fechaFin: null, estado,
    motivoAsistencia: null, comentarioAsistencia: null, fechaSolicitudAsistencia: null,
    latitudAsistencia: null, longitudAsistencia: null,
    Repartidor: { id: 1, nombre: 'Carlos', apellido: 'Gómez', deletedAt: null }, Pedidos: pedidos, ...extra,
  }
}

const viajes = [
  viaje(512, 'requiere asistencia', [pedido(18301, 'En camino'), pedido(18302, 'En camino'), pedido(18305, 'Entregado')]),
  viaje(511, 'preparando', [pedido(18310, 'Listo para retirar', { retiradoEn: '2026-11-24T17:10:00.000Z' }), pedido(18311, 'Listo para retirar')], { fechaInicio: null, Repartidor: { id: 2, nombre: 'Lucía', apellido: 'Paz', deletedAt: null } }),
  viaje(509, 'finalizado', [pedido(18280, 'Entregado', { Usuario: { id: 9, nombre: 'Ana', apellido: 'López' } })], { fechaFin: '2026-11-24T16:52:00.000Z' }),
]

describe('estado del viaje', () => {
  test('etiquetas, colores y filtros', () => {
    expect(etiquetaEstadoViaje('activo')).toBe('En curso')
    expect(etiquetaEstadoViaje('Requiere asistencia')).toBe('Requiere asistencia')
    expect(clasesEstadoViaje('requiere asistencia')).toMatch(/red/)
    expect(esFiltroEstadoViaje('todos')).toBe(true)
    expect(esFiltroEstadoViaje('preparando')).toBe(true)
    expect(esFiltroEstadoViaje('otro')).toBe(false)
  })

  test.each([
    ['requiere asistencia', true, 'alerta'],
    ['requiere asistencia', false, 'alerta'],
    ['preparando', true, 'nuevo'],
    ['preparando', false, 'normal'],
  ])('%s (recién llegado: %s) → %s', (estado, recien, tono) => {
    expect(tonoDeViaje({ estado: estado as Viaje['estado'] }, recien as boolean)).toBe(tono)
  })
})

describe('resumen del viaje', () => {
  test('textos de la tarjeta', () => {
    expect(nombreRepartidor(viajes[0])).toBe('Carlos Gómez')
    expect(textoPedidos(viajes[0])).toBe('3 pedidos · #18301, #18302, +1')
    expect(textoPedidos(viajes[2])).toBe('1 pedido · #18280')
    expect(textoInicio(viajes[1])).toBe('Sin iniciar')
    expect(totalViaje(viajes[0])).toBe(3000)
  })

  test('nota según el estado (el viaje lo mueve el repartidor)', () => {
    expect(notaDeViaje(viajes[0])).toBeNull()
    expect(notaDeViaje(viajes[1])?.texto).toBe('Retirados 1 de 2')
    expect(notaDeViaje({ ...viajes[0], estado: 'activo' })?.texto).toBe('Entregados 1 de 3')
    expect(notaDeViaje(viajes[2])?.icono).toBe('candado')
    expect(notaDeViaje({ ...viajes[2], estado: 'cancelado' })?.texto).toBe('Solo lectura')
  })
})

describe('filtros de viajes', () => {
  test('busca por repartidor, viaje, pedido o cliente', () => {
    const ids = (busqueda: string) => filtrarViajes(viajes, { busqueda, estado: 'todos' }).map((v) => v.id)
    expect(ids('lucía')).toEqual([511])
    expect(ids('512')).toEqual([512])
    expect(ids('18280')).toEqual([509])
    expect(ids('ana lópez')).toEqual([509])
  })

  test('contadores por estado sobre la búsqueda', () => {
    const c = contarPorEstadoViaje(viajes)
    expect(c.todos).toBe(3)
    expect(c['requiere asistencia']).toBe(1)
    expect(c.activo).toBe(0)
    expect(contarPorEstadoViaje(viajes, 'gómez').todos).toBe(2)
  })
})

describe('rutas y volver', () => {
  test('rutas de viajes', () => {
    expect(rutaDetalleViaje(512)).toBe('/admin/viajes/512')
    expect(rutaDetalleViaje(512, 3)).toBe('/admin/viajes/512?sucursal=3')
    expect(rutaListaViajes()).toBe('/admin/viajes')
    expect(destinoVolverViaje({ desde: '/admin/viajes?estado=activo' })).toBe('/admin/viajes?estado=activo')
    expect(destinoVolverViaje({ desde: '/admin/pedidos' }, 3)).toBe('/admin/viajes?sucursal=3')
  })

  test('el detalle de un pedido puede volver al viaje del que vino', () => {
    expect(destinoVolver({ desde: '/admin/viajes/512' })).toBe('/admin/viajes/512')
    expect(destinoVolver({ desde: '/admin/viajes/512?sucursal=3' })).toBe('/admin/viajes/512?sucursal=3')
    expect(destinoVolver({ desde: '/admin/viajes/abc' })).toBe('/admin/pedidos')
    expect(etiquetaVolver('/admin/viajes/512')).toBe('Volver al viaje #512')
    expect(etiquetaVolver('/admin/pedidos?etapa=Pendiente')).toBe('Volver a pedidos')
  })

  test('texto de la reasignación (RN-32, RN-55)', () => {
    expect(textoConsecuenciaReasignacion('Carlos Gómez', 'Lucas Herrera')).toMatch(/Carlos Gómez quedará inactivo.*Lucas Herrera tiene que confirmar/)
  })
})

describe('sucursal guardada del MASTER', () => {
  beforeEach(() => window.sessionStorage.clear())

  test('se guarda por administrador y se limpia al cerrar sesión', () => {
    expect(leerSucursalGuardada(1)).toBeNull()
    guardarSucursal(1, 7)
    guardarSucursal(2, 9)
    expect(leerSucursalGuardada(1)).toBe(7)
    expect(leerSucursalGuardada(2)).toBe(9)
    limpiarSucursalesGuardadas()
    expect(leerSucursalGuardada(1)).toBeNull()
    expect(leerSucursalGuardada(2)).toBeNull()
  })

  test('ignora valores inválidos', () => {
    guardarSucursal(1, -3)
    window.sessionStorage.setItem('bf-admin:sucursal:1', 'abc')
    expect(leerSucursalGuardada(1)).toBeNull()
    expect(leerSucursalGuardada(null)).toBeNull()
  })

  test.each([
    [5, 7, [{ id: 1 }, { id: 7 }], 5],
    [null, 7, [{ id: 1 }, { id: 7 }], 7],
    [null, 7, [{ id: 1 }, { id: 2 }], 1],
    [null, 7, null, 7],
    [null, null, [{ id: 4 }], 4],
    [null, null, null, null],
  ])('URL %s, guardada %s → %s', (url, guardada, lista, esperado) => {
    expect(resolverSucursal(url as number | null, guardada as number | null, lista as { id: number }[] | null)).toBe(esperado)
  })
})

describe('novedades entre cargas', () => {
  test('detecta viajes nuevos y pedidos de asistencia', async () => {
    const { detectarNovedades, textoAnuncioNovedades } = await import('../../utils/viajes/novedadesViajes')
    const antes = [viajes[1], { ...viajes[0], estado: 'activo' as const }]
    const despues = [...viajes, viaje(520, 'preparando', [])]
    const n = detectarNovedades(antes, despues)
    expect(n.nuevos).toEqual([509, 520])
    expect(n.asistencias).toEqual([512])
    expect(textoAnuncioNovedades(n)).toBe('El viaje #512 requiere asistencia. Llegaron 2 viajes nuevos')
    expect(detectarNovedades(viajes, viajes)).toEqual({ nuevos: [], asistencias: [] })
  })
})
