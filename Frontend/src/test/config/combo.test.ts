import { describe, expect, test } from 'vitest'
import { etiquetaTamanio, ordenarVariantes } from '../../config/combo'

describe('etiquetaTamanio', () => {
  test('junta el tamaño con la medida', () => {
    expect(etiquetaTamanio('regular', '354 ml')).toBe('Regular · 354 ml')
  })

  test('sin medida, muestra solo el tamaño', () => {
    expect(etiquetaTamanio('grande')).toBe('Grande')
  })

  test.each([null, undefined, 'gigante'])('devuelve vacío para %s', (tamanio) => {
    expect(etiquetaTamanio(tamanio)).toBe('')
  })
})

describe('ordenarVariantes', () => {
  test('ordena de regular a grande, vengan como vengan', () => {
    const desordenadas = [{ tamanio: 'grande' }, { tamanio: 'regular' }, { tamanio: 'mediano' }]
    expect(ordenarVariantes(desordenadas).map((v) => v.tamanio)).toEqual(['regular', 'mediano', 'grande'])
  })

  test('no modifica la lista original', () => {
    const original = [{ tamanio: 'grande' }, { tamanio: 'regular' }]
    ordenarVariantes(original)
    expect(original[0].tamanio).toBe('grande')
  })

  test('sin variantes, devuelve una lista vacía', () => {
    expect(ordenarVariantes(undefined)).toEqual([])
  })
})