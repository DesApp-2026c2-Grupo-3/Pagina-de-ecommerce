import { describe, expect, test } from 'vitest'
import { formatearPrecio } from '../../utils/precio'
import { precioDe, precioDesde } from '../../utils/precio'
import type { ProductoBackend } from '../../types/product'

const papas = {
  id: 40,
  nombre: 'Papas',
  descripcion: '',
  precio: 2400,
  imagen: '',
  disponible: true,
  categoriaId: 3,
  variantes: [
    { tamanio: 'grande', precio: '3500', etiqueta: null },
    { tamanio: 'regular', precio: '2400', etiqueta: null },
  ],
} satisfies ProductoBackend

describe('precioDe', () => {
  test('usa el precio del tamaño elegido', () => {
    expect(precioDe(papas, 'grande')).toBe(3500)
  })

  test('sin tamaños, usa el precio del producto', () => {
    expect(precioDe({ ...papas, variantes: [] }, null)).toBe(2400)
  })

  test('con un tamaño que no existe, usa el precio del producto', () => {
    expect(precioDe(papas, 'gigante')).toBe(2400)
  })
})

describe('precioDesde', () => {
  test('es el precio más bajo de los tamaños', () => {
    expect(precioDesde(papas)).toBe(2400)
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