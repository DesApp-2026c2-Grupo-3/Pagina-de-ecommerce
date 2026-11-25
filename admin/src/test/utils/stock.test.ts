import { describe, expect, test } from 'vitest'

import { POR_PAGINA_MOVIMIENTOS, POR_PAGINA_STOCK } from '../../config/stock'
import type { ItemStock, Movimiento } from '../../types/stock.types'
import { paginar } from '../../utils/listas/paginar'
import { destinoVolverStock, rutaReportarBaja, rutaStock } from '../../utils/navegacion/rutasStock'
import { textoAyudaBaja, validarBaja } from '../../utils/stock/baja'
import { enAlerta, estadoInsumo } from '../../utils/stock/estadoInsumo'
import { contarPorEstadoStock, filtrarStock } from '../../utils/stock/filtrarStock'
import {
  contarPorTipoMovimiento,
  descripcionMovimiento,
  filtrarMovimientos,
  formatearFechaMovimiento,
  responsableMovimiento,
  textoCantidadMovimiento,
} from '../../utils/stock/movimientos'

function insumo(id: number, nombre: string, cantidad: number, extra: Partial<ItemStock> = {}): ItemStock {
  return { id, nombre, cantidad, stockMinimo: null, bajoMinimo: false, activo: true, ...extra }
}

const stock = [
  insumo(1, 'Pan de papa', 140, { stockMinimo: 50 }),
  insumo(2, 'Medallón 120 g', 18, { stockMinimo: 20, bajoMinimo: true }),
  insumo(3, 'Cheddar en fetas', 0, { stockMinimo: 30, bajoMinimo: true }),
  insumo(4, 'Salsa barbacoa', 9, { activo: false }),
  insumo(5, 'Panceta', 0, { activo: false }),
]

function mov(id: number, tipo: Movimiento['tipo'], insumoNombre: string, extra: Partial<Movimiento> = {}): Movimiento {
  return { id, fecha: '2026-11-25T02:10:00.000Z', tipo, insumo: insumoNombre, cantidad: 4, motivo: null, detalle: null, admin: null, pedidoId: null, ...extra }
}

const movimientos = [
  mov(1, 'baja', 'Medallón 120 g', { motivo: 'merma', admin: 'Laura M.' }),
  mov(2, 'venta', 'Pan de papa', { pedidoId: 18332 }),
  mov(3, 'aumento', 'Cheddar en fetas', { cantidad: 30, admin: 'Laura M.' }),
  mov(4, 'devolucion', 'Panceta', { pedidoId: 18301 }),
  mov(5, 'aumento', 'Pan de papa'),
]

describe('estado de los insumos', () => {
  test('deshabilitado > sin stock > bajo > normal', () => {
    expect(stock.map(estadoInsumo)).toEqual(['normal', 'bajo', 'sin', 'deshabilitado', 'deshabilitado'])
    expect(stock.map(enAlerta)).toEqual([false, true, true, false, false])
  })

  test('filtro y contadores sobre la búsqueda', () => {
    const ids = (filtroEstado: string, busqueda = '') =>
      filtrarStock({ items: stock, busqueda, filtroEstado, objetivoId: null }).map((i) => i.id)
    expect(ids('bajo')).toEqual([2])
    expect(ids('sin')).toEqual([3])
    expect(ids('deshabilitado')).toEqual([4, 5])
    expect(ids('todos', 'pan')).toEqual([1, 5])
    expect(filtrarStock({ items: stock, busqueda: '', filtroEstado: 'todos', objetivoId: 3 }).map((i) => i.id)).toEqual([3])
    expect(contarPorEstadoStock(stock, '')).toEqual({ todos: 5, bajo: 1, sin: 1, deshabilitado: 2 })
    expect(contarPorEstadoStock(stock, 'pan')).toEqual({ todos: 2, bajo: 0, sin: 0, deshabilitado: 1 })
  })
})

describe('movimientos', () => {
  test('textos de cada fila', () => {
    expect(descripcionMovimiento(movimientos[0])).toBe('Merma (se echó a perder)')
    expect(descripcionMovimiento(movimientos[1])).toBe('Venta · pedido #18332')
    expect(descripcionMovimiento(movimientos[3])).toBe('Pedido #18301 cancelado')
    expect(textoCantidadMovimiento(movimientos[0])).toBe('−4')
    expect(textoCantidadMovimiento(movimientos[2])).toBe('+30')
    expect(responsableMovimiento(movimientos[0])).toBe('Por Laura M.')
    expect(responsableMovimiento(movimientos[1])).toBe('Automático')
    expect(responsableMovimiento(movimientos[4])).toBe('Responsable no registrado')
    expect(formatearFechaMovimiento('2026-11-25T02:10:00.000Z')).toBe('24/11 23:10')
  })

  test('búsqueda por insumo o nº de pedido y contadores por tipo', () => {
    const ids = (busqueda: string, tipo: 'todos' | Movimiento['tipo'] = 'todos') =>
      filtrarMovimientos(movimientos, { busqueda, tipo }).map((m) => m.id)
    expect(ids('pan')).toEqual([2, 4, 5])
    expect(ids('#18332')).toEqual([2])
    expect(ids('18301')).toEqual([4])
    expect(ids('', 'aumento')).toEqual([3, 5])
    expect(contarPorTipoMovimiento(movimientos, '')).toEqual({ todos: 5, aumento: 2, baja: 1, venta: 1, devolucion: 1 })
    expect(contarPorTipoMovimiento(movimientos, 'pan')).toEqual({ todos: 3, aumento: 1, baja: 0, venta: 1, devolucion: 1 })
  })
})

describe('paginación de 10 fijos (D-S7)', () => {
  test('50 movimientos son 5 páginas y 23 insumos son 3', () => {
    expect(POR_PAGINA_STOCK).toBe(10)
    expect(paginar(Array.from({ length: 50 }), 1, POR_PAGINA_MOVIMIENTOS).totalPaginas).toBe(5)
    const p = paginar(Array.from({ length: 23 }, (_, i) => i), 3, POR_PAGINA_STOCK)
    expect(p.totalPaginas).toBe(3)
    expect(p.items).toEqual([20, 21, 22])
  })

  test('una página fuera de rango va a la última válida', () => {
    expect(paginar([1, 2, 3], 4, 10).pagina).toBe(1)
    expect(paginar(Array.from({ length: 12 }), 9, 10).pagina).toBe(2)
  })
})

describe('reportar baja', () => {
  const lleno = { stockId: '2', cantidad: '4', motivo: 'merma', detalle: '' }
  test('mismas validaciones que antes (RN-10)', () => {
    expect(validarBaja({ ...lleno, stockId: '' })).toBe('Elegí el insumo.')
    expect(validarBaja({ ...lleno, cantidad: '1.5' })).toBe('Ingresá una cantidad entera mayor a 0.')
    expect(validarBaja({ ...lleno, motivo: '' })).toBe('Elegí el motivo de la baja.')
    expect(validarBaja({ ...lleno, motivo: 'otro', detalle: 'abc' })).toMatch(/al menos 5/)
    expect(validarBaja(lleno)).toBeNull()
  })

  test('ayuda en vivo, solo informativa', () => {
    expect(textoAyudaBaja(stock[1], '4')).toBe('Quedarían 14: en el mínimo o por debajo (20), queda en alerta de reposición.')
    expect(textoAyudaBaja(stock[0], '10')).toBe('Quedarían 130.')
    expect(textoAyudaBaja(stock[1], '30')).toBe('Hay 18: no alcanza para bajar 30.')
    expect(textoAyudaBaja(stock[1], '')).toBeNull()
  })

  test('rutas y vuelta a la vista de origen', () => {
    expect(rutaStock(3)).toBe('/admin/sucursales/3/stock')
    expect(rutaStock(3, 'movimientos')).toBe('/admin/sucursales/3/stock?vista=movimientos')
    expect(rutaReportarBaja(3)).toBe('/admin/sucursales/3/stock/baja')
    expect(destinoVolverStock({ desde: '/admin/sucursales/3/stock?vista=movimientos' }, 3)).toBe('/admin/sucursales/3/stock?vista=movimientos')
    expect(destinoVolverStock({ desde: '/admin/sucursales/4/stock' }, 3)).toBe('/admin/sucursales/3/stock')
    expect(destinoVolverStock({ desde: 'https://otro.sitio' }, 3)).toBe('/admin/sucursales/3/stock')
  })
})
