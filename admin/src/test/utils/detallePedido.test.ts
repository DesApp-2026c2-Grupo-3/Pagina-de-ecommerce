import { describe, expect, test } from 'vitest'

import {
  destinoVolver,
  rutaDetallePedido,
  rutaListaPedidos,
} from '../../utils/navegacion/rutasPedido'
import { crearTraductorLineas, tuvoPromocion } from '../../utils/pedidos/textosLineaPedido'
import { nombreCliente, resumenProductos } from '../../utils/pedidos/resumenPedido'
import type { DetalleLinea } from '../../types/pedido.types'

describe('rutas de pedidos', () => {
  test('detalle con y sin sucursal', () => {
    expect(rutaDetallePedido(1042)).toBe('/admin/pedidos/1042')
    expect(rutaDetallePedido(1042, 3)).toBe('/admin/pedidos/1042?sucursal=3')
    expect(rutaListaPedidos()).toBe('/admin/pedidos')
    expect(rutaListaPedidos(3)).toBe('/admin/pedidos?sucursal=3')
  })

  test.each([
    [{ desde: '/admin/pedidos?etapa=Pendiente&pagina=2' }, 3, '/admin/pedidos?etapa=Pendiente&pagina=2'],
    [{ desde: '/admin/pedidos' }, null, '/admin/pedidos'],
    [{ desde: 'https://otro.sitio' }, 3, '/admin/pedidos?sucursal=3'],
    [{ desde: '/admin/pedidosX' }, null, '/admin/pedidos'],
    [{ desde: 42 }, null, '/admin/pedidos'],
    [null, 3, '/admin/pedidos?sucursal=3'],
    ['texto', null, '/admin/pedidos'],
  ])('volver desde %j → %s', (estado, sucursal, esperado) => {
    expect(destinoVolver(estado, sucursal)).toBe(esperado)
  })
})

function linea(parcial: Partial<DetalleLinea>): DetalleLinea {
  return {
    id: 1,
    productoId: 10,
    cantidad: 1,
    precio: '4000',
    tamanioId: null,
    personalizaciones: null,
    combo: null,
    Producto: null,
    ...parcial,
  }
}

describe('textos de cada línea', () => {
  const traductor = crearTraductorLineas({
    productos: [
      { id: 10, nombre: 'Hamburguesa doble', receta: [{ insumoId: 5, cantidadBase: 1 }, { insumoId: 6, cantidadBase: 1 }] },
      { id: 20, nombre: 'Combo clásico', grupos: [{ id: 1, nombre: 'Papas' }] },
      { id: 21, nombre: 'Papas con cheddar' },
    ],
    insumos: [{ id: 5, nombre: 'Cheddar' }, { id: 6, nombre: 'Cebolla' }],
  })

  test('tamaño y personalización según la receta', () => {
    const extras = traductor.extras(linea({
      tamanioId: 3,
      personalizaciones: JSON.stringify([{ insumoId: 6, cantidad: 0 }, { insumoId: 5, cantidad: 2 }]),
    }))
    expect(extras).toEqual(['Tamaño grande', 'Sin Cebolla', '+1 Cheddar'])
  })

  test('elecciones del combo con recargo', () => {
    const extras = traductor.extras(linea({
      productoId: 20,
      combo: { elecciones: [{ grupoId: 1, productoId: 21, recargo: 800 }] },
    }))
    expect(extras[0]).toMatch(/^Papas: Papas con cheddar \(\+\$800\)$/)
  })

  test('sin catálogo muestra ids', () => {
    const sinCatalogo = crearTraductorLineas()
    expect(sinCatalogo.nombreProducto(linea({}))).toBe('Producto #10')
    expect(sinCatalogo.nombreProducto(linea({ Producto: { id: 10, nombre: 'Doble' } }))).toBe('Doble')
  })

  test('detecta promoción por precio de lista', () => {
    expect(tuvoPromocion(linea({ precio: '4000', precioLista: '4500' }))).toBe(true)
    expect(tuvoPromocion(linea({ precio: '4000', precioLista: '4000' }))).toBe(false)
    expect(tuvoPromocion(linea({ precio: '4000' }))).toBe(false)
  })
})

describe('resumen del pedido', () => {
  test('cliente y productos', () => {
    expect(nombreCliente({ Usuario: { nombre: 'Juan', apellido: ' ' } })).toBe('Juan')
    expect(nombreCliente({ Usuario: null })).toBe('Cliente no disponible')
    const detalles = [1, 2, 3, 4, 5].map((n) => ({ cantidad: n, Producto: { nombre: `P${n}` } }))
    expect(resumenProductos({ DetallePedidos: detalles })).toBe('1× P1 · 2× P2 · 3× P3 · +2 más')
    expect(resumenProductos({ DetallePedidos: [] })).toBe('Sin productos')
  })
})
