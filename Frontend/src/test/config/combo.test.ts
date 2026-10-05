import { describe, expect, test } from 'vitest'
import { etiquetaTamanio, ordenarTamanios } from '../../config/combo'
import type { ProductoTamanio } from '../../types/product'

const tamanio = (tamanioId: number, nombre: string): ProductoTamanio => ({
  tamanioId,
  tamanio: nombre,
  precio: 1000,
  etiqueta: null,
})

describe('etiquetaTamanio', () => {
  test('junta el tamaño con la medida', () => {
    expect(etiquetaTamanio('regular', '354 ml')).toBe('Regular · 354 ml')
  })

  test('sin medida, muestra solo el tamaño', () => {
    expect(etiquetaTamanio('grande')).toBe('Grande')
  })

  test.each([null, undefined, 'gigante'])('devuelve vacío para %s', (valor) => {
    expect(etiquetaTamanio(valor)).toBe('')
  })
})

describe('ordenarTamanios', () => {
  test('ordena de regular a grande, vengan como vengan', () => {
    const desordenados = [tamanio(3, 'grande'), tamanio(1, 'regular'), tamanio(2, 'mediano')]

    expect(ordenarTamanios(desordenados).map((t) => t.tamanio)).toEqual(['regular', 'mediano', 'grande'])
  })

  test('no modifica la lista original', () => {
    const original = [tamanio(3, 'grande'), tamanio(1, 'regular')]

    ordenarTamanios(original)

    expect(original[0].tamanio).toBe('grande')
  })

  test('sin tamaños, devuelve una lista vacía', () => {
    expect(ordenarTamanios(undefined)).toEqual([])
  })
})