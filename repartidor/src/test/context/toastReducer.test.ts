import { describe, expect, test } from 'vitest'
import { Bell } from 'lucide-react'

import { estadoInicialToasts, MAXIMO_VISIBLES, toastReducer } from '../../context/toasts/toastReducer'
import type { DatosToast, EstadoToasts } from '../../types/toast.types'

const toast = (id: string): DatosToast => ({ id, tono: 'marca', icono: Bell, titulo: `Aviso ${id}`, prioridad: 'alta' })

function mostrarVarios(...ids: string[]): EstadoToasts {
  return ids.reduce((estado, id) => toastReducer(estado, { type: 'MOSTRAR', toast: toast(id) }), estadoInicialToasts)
}

const ids = (lista: DatosToast[]) => lista.map((t) => t.id)

describe('toastReducer', () => {
  test('el más nuevo queda primero', () => {
    expect(ids(mostrarVarios('a', 'b').visibles)).toEqual(['b', 'a'])
  })

  test(`máximo ${MAXIMO_VISIBLES} visibles: el resto espera en cola, en orden de llegada`, () => {
    const estado = mostrarVarios('a', 'b', 'c', 'd', 'e')

    expect(ids(estado.visibles)).toEqual(['c', 'b', 'a'])
    expect(ids(estado.cola)).toEqual(['d', 'e'])
  })

  test('al cerrar uno, entra el primero de la cola (arriba, porque es más nuevo)', () => {
    const estado = toastReducer(mostrarVarios('a', 'b', 'c', 'd', 'e'), { type: 'CERRAR', id: 'b' })

    expect(ids(estado.visibles)).toEqual(['d', 'c', 'a'])
    expect(ids(estado.cola)).toEqual(['e'])
  })

  test('cerrar uno que está en la cola lo saca de ahí', () => {
    const estado = toastReducer(mostrarVarios('a', 'b', 'c', 'd', 'e'), { type: 'CERRAR', id: 'e' })

    expect(ids(estado.visibles)).toEqual(['c', 'b', 'a'])
    expect(ids(estado.cola)).toEqual(['d'])
  })

  test('un mismo id no se duplica, ni visible ni en cola', () => {
    const lleno = mostrarVarios('a', 'b', 'c', 'd')

    expect(toastReducer(lleno, { type: 'MOSTRAR', toast: toast('a') })).toBe(lleno)
    expect(toastReducer(lleno, { type: 'MOSTRAR', toast: toast('d') })).toBe(lleno)
  })

  test('después de cerrarse, el mismo id puede volver a mostrarse', () => {
    const cerrado = toastReducer(mostrarVarios('a'), { type: 'CERRAR', id: 'a' })

    expect(ids(toastReducer(cerrado, { type: 'MOSTRAR', toast: toast('a') }).visibles)).toEqual(['a'])
  })

  test('vaciar descarta visibles y cola', () => {
    expect(toastReducer(mostrarVarios('a', 'b', 'c', 'd'), { type: 'VACIAR' })).toEqual(estadoInicialToasts)
  })
})
