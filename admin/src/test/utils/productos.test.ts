import { describe, expect, test } from 'vitest'

import { POR_PAGINA_PRODUCTOS } from '../../config/productos'
import type { ProductoFila, SucursalStockProducto } from '../../types/producto.types'
import { destinoVolverProductos, rutaStockProducto } from '../../utils/navegacion/rutasProducto'
import { contarPorDisponibilidad, filtrarProductos } from '../../utils/productos/filtrarProductos'
import { contarStockProducto, filtrarStockProducto, tieneStock } from '../../utils/productos/filtrarStockProducto'

function prod(id: number, nombre: string, extra: Partial<ProductoFila> = {}): ProductoFila {
  return { id, nombre, disponible: true, categoriaId: 1, precio: '7920', imagen: null, ...extra }
}

const productos = [
  prod(1, 'Hamburguesa Bacon'),
  prod(2, 'Fast Cheese', { categoriaId: 2 }),
  prod(3, 'Papas con cheddar', { categoriaId: 3, disponible: false }),
  prod(4, 'Hamburguesa vegana', { categoriaId: null }),
]

describe('filtros de la lista (misma lógica que antes)', () => {
  test('búsqueda, categoría exacta y disponibilidad', () => {
    const ids = (busqueda: string, categoria = 'todas', disponibilidad: 'todas' | 'habilitados' | 'inhabilitados' = 'todas') =>
      filtrarProductos(productos, { busqueda, categoria, disponibilidad }).map((p) => p.id)
    expect(ids('hambur')).toEqual([1, 4])
    expect(ids('', '2')).toEqual([2])
    expect(ids('', 'todas', 'inhabilitados')).toEqual([3])
    expect(ids('', 'todas', 'habilitados')).toEqual([1, 2, 4])
  })

  test('contadores de disponibilidad sobre la búsqueda y la categoría', () => {
    expect(contarPorDisponibilidad(productos, { busqueda: '', categoria: 'todas' })).toEqual({ todas: 4, habilitados: 3, inhabilitados: 1 })
    expect(contarPorDisponibilidad(productos, { busqueda: '', categoria: '3' })).toEqual({ todas: 1, habilitados: 0, inhabilitados: 1 })
  })

  test('10 por página (D-P5)', () => {
    expect(POR_PAGINA_PRODUCTOS).toBe(10)
  })
})

describe('página de stock del producto', () => {
  const sucursales: SucursalStockProducto[] = [
    { id: 1, nombre: 'Sucursal Centro', unidades: 24, limitante: null },
    { id: 2, nombre: 'Sucursal Norte', unidades: 0, limitante: 'Pan de papa' },
    { id: 3, nombre: 'Sucursal Sur', unidades: null, limitante: null },
  ]

  test('con stock = al menos una unidad (como el modal)', () => {
    expect(sucursales.map(tieneStock)).toEqual([true, false, false])
  })

  test('buscar sucursal y filtrar con o sin stock', () => {
    expect(filtrarStockProducto(sucursales, { busqueda: 'norte', estado: 'todas' }).map((s) => s.id)).toEqual([2])
    expect(filtrarStockProducto(sucursales, { busqueda: '', estado: 'sin' }).map((s) => s.id)).toEqual([2, 3])
    expect(contarStockProducto(sucursales, '')).toEqual({ todas: 3, con: 1, sin: 2 })
  })

  test('rutas y vuelta a la lista con sus filtros', () => {
    expect(rutaStockProducto(7)).toBe('/admin/productos/7/stock')
    expect(destinoVolverProductos({ desde: '/admin/productos?categoria=2&pagina=3' })).toBe('/admin/productos?categoria=2&pagina=3')
    expect(destinoVolverProductos({ desde: '/admin/pedidos' })).toBe('/admin/productos')
    expect(destinoVolverProductos(null)).toBe('/admin/productos')
  })
})
