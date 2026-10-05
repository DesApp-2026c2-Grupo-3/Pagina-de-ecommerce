import { describe, expect, test } from 'vitest'
import { formatearPrecio, precioDe, precioDesde } from '../../utils/precio'
import type { ProductoBackend } from '../../types/product'

// Los tamaños vienen desordenados y con el precio como texto, como los devuelve el backend
const papas: ProductoBackend = {
  id: 40,
  nombre: 'Papas',
  descripcion: '',
  precio: 2400,
  imagen: '',
  disponible: true,
  categoriaId: 3,
  tamanios: [
    { tamanioId: 3, tamanio: 'grande', precio: '3500', etiqueta: null },
    { tamanioId: 1, tamanio: 'regular', precio: '2400', etiqueta: null },
  ],
}

describe('precioDe', () => {
  test('usa el precio del tamaño elegido', () => {
    expect(precioDe(papas, 3)).toBe(3500)
  })

  test('sin tamaños, usa el precio del producto', () => {
    expect(precioDe({ ...papas, tamanios: [] }, null)).toBe(2400)
  })

  test('con un tamaño que no existe, usa el precio del producto', () => {
    expect(precioDe(papas, 9)).toBe(2400)
  })
})

describe('precioDesde', () => {
  test('es el precio más bajo de los tamaños', () => {
    expect(precioDesde(papas)).toBe(2400)
  })

  test('sin tamaños, es el precio del producto', () => {
    expect(precioDesde({ ...papas, tamanios: [] })).toBe(2400)
  })
})

describe('formatearPrecio', () => {
  test.each([
    [5500, '$5.500'],
    [0, '$0'],
    [1500000, '$1.500.000'],
  ])('%d se muestra como %s', (monto, esperado) => {
    expect(formatearPrecio(monto)).toBe(esperado)
  })
})