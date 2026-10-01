import { describe, expect, test } from 'vitest'
import {
  cantidadFinal,
  eleccionDesde,
  personalizacionesDe,
  precioExtras,
  textoPersonalizacion,
  type Eleccion,
} from '../../utils/personalizacion'
import type { ProductIngredient } from '../../types/product'

function ingrediente(datos: Partial<ProductIngredient>): ProductIngredient {
  return {
    insumoId: 0,
    nombre: 'Insumo',
    unidadMedida: 'unidad',
    cantidadBase: 1,
    esRemovible: false,
    esAgregable: false,
    precioComercial: 0,
    ...datos,
  }
}

// Una hamburguesa con ingredientes de todos los tipos
const pan = ingrediente({ insumoId: 1, nombre: 'Pan' })
const cebolla = ingrediente({ insumoId: 2, nombre: 'Cebolla', esRemovible: true })
const cheddar = ingrediente({ insumoId: 3, nombre: 'Cheddar', esRemovible: true, esAgregable: true, precioComercial: 500 })
const medallon = ingrediente({ insumoId: 4, nombre: 'Medallón', esAgregable: true, precioComercial: 1500 })
const papas = ingrediente({ insumoId: 5, nombre: 'Papas', cantidadBase: 0.5, esAgregable: true, precioComercial: 800 })
const receta = [pan, cebolla, cheddar, medallon, papas]

function elegir(quitados: number[] = [], extras: number[] = []): Eleccion {
  return { quitados: new Set(quitados), extras: new Set(extras) }
}

describe('cantidadFinal', () => {
  test('sin cambios, es la cantidad de la receta', () => {
    expect(cantidadFinal(cheddar, elegir())).toBe(1)
  })

  test('quitado, es 0', () => {
    expect(cantidadFinal(cebolla, elegir([2]))).toBe(0)
  })

  test('con extra, suma una unidad', () => {
    expect(cantidadFinal(cheddar, elegir([], [3]))).toBe(2)
  })

  test('con extra y porción no entera, suma otra porción', () => {
    expect(cantidadFinal(papas, elegir([], [5]))).toBe(1)
  })

  test('si se quitó, no importa que esté marcado como extra', () => {
    expect(cantidadFinal(cheddar, elegir([3], [3]))).toBe(0)
  })
})

describe('precioExtras', () => {
  test('sin cambios, no suma nada', () => {
    expect(precioExtras(receta, elegir())).toBe(0)
  })

  test('suma el precio de cada extra', () => {
    expect(precioExtras(receta, elegir([], [3, 4]))).toBe(2000)
  })

  test('quitar un ingrediente no descuenta', () => {
    expect(precioExtras(receta, elegir([2]))).toBe(0)
  })

  test('un extra quitado no se cobra', () => {
    expect(precioExtras(receta, elegir([3], [3]))).toBe(0)
  })
})

describe('textoPersonalizacion', () => {
  test('describe lo quitado y los extras con su precio', () => {
    expect(textoPersonalizacion(receta, elegir([2], [3]))).toEqual([
      'Sin Cebolla',
      'Extra Cheddar (+$500)',
    ])
  })

  test('sin cambios, no hay texto', () => {
    expect(textoPersonalizacion(receta, elegir())).toEqual([])
  })
})

describe('personalizacionesDe', () => {
  test('manda solo los ingredientes tocados, con su cantidad final', () => {
    expect(personalizacionesDe(receta, elegir([2], [3]))).toEqual([
      { insumoId: 2, cantidad: 0 },
      { insumoId: 3, cantidad: 2 },
    ])
  })
})

describe('eleccionDesde', () => {
  test('reconstruye las casillas desde lo guardado en el carrito', () => {
    const original = elegir([2], [3, 4])
    const guardado = personalizacionesDe(receta, original)

    const reconstruida = eleccionDesde(receta, guardado)

    expect([...reconstruida.quitados]).toEqual([2])
    expect([...reconstruida.extras].sort()).toEqual([3, 4])
  })

  test('ignora insumos que ya no están en la receta', () => {
    const reconstruida = eleccionDesde(receta, [{ insumoId: 99, cantidad: 0 }])

    expect(reconstruida.quitados.size).toBe(0)
  })

  test('sin personalizaciones, no hay nada marcado', () => {
    const reconstruida = eleccionDesde(receta)

    expect(reconstruida.quitados.size).toBe(0)
    expect(reconstruida.extras.size).toBe(0)
  })
})