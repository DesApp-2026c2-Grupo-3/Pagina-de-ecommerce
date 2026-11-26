import { describe, expect, test } from 'vitest'

import {
  actualizarPedidoEnCola,
  estadoInicialCola,
  liberarQueNoCoinciden,
  liberarSiguiente,
  liberarTodos,
  ordenarPorLlegada,
  sincronizarCola,
} from '../../utils/pedidos/colaIngreso'
import type { PedidoFila } from '../../types/pedido.types'

function pedido(id: number, minuto: number, estado = 'Pendiente'): PedidoFila {
  return {
    id,
    fecha: `2026-11-24T14:${String(minuto).padStart(2, '0')}:00.000Z`,
    total: '1000',
    estado,
    Usuario: { nombre: 'Ana', apellido: 'Gómez' },
    DetallePedidos: [],
  }
}

const ids = (lista: PedidoFila[]) => lista.map((p) => p.id)

describe('estadoInicialCola', () => {
  test('la carga inicial muestra todo, del más nuevo al más viejo, sin cola', () => {
    const estado = estadoInicialCola([pedido(1, 10), pedido(3, 30), pedido(2, 20)])
    expect(ids(estado.visibles)).toEqual([3, 2, 1])
    expect(estado.cola).toEqual([])
  })
})

describe('sincronizarCola', () => {
  test('los pedidos nuevos se encolan en orden de llegada', () => {
    const inicial = estadoInicialCola([pedido(1, 10)])
    const estado = sincronizarCola(inicial, [pedido(3, 32), pedido(2, 31), pedido(1, 10)])
    expect(ids(estado.visibles)).toEqual([1])
    expect(ids(estado.cola)).toEqual([2, 3])
  })

  test('un cambio de estado de un pedido visible se aplica al instante', () => {
    const inicial = estadoInicialCola([pedido(1, 10)])
    const estado = sincronizarCola(inicial, [pedido(1, 10, 'En proceso')])
    expect(estado.visibles[0].estado).toBe('En proceso')
    expect(estado.cola).toEqual([])
  })

  test('un pedido encolado se actualiza sin duplicarse', () => {
    let estado = sincronizarCola(estadoInicialCola([]), [pedido(5, 40)])
    estado = sincronizarCola(estado, [pedido(5, 40, 'Cancelado')])
    expect(estado.cola).toHaveLength(1)
    expect(estado.cola[0].estado).toBe('Cancelado')
  })

  test('lo que el servidor ya no devuelve se quita de visibles y de la cola', () => {
    let estado = sincronizarCola(estadoInicialCola([pedido(1, 10)]), [pedido(1, 10), pedido(2, 20)])
    estado = sincronizarCola(estado, [])
    expect(estado.visibles).toEqual([])
    expect(estado.cola).toEqual([])
  })

  test('aplicar dos veces la misma respuesta no cambia el resultado', () => {
    const lista = [pedido(1, 10), pedido(2, 20)]
    const una = sincronizarCola(estadoInicialCola([pedido(1, 10)]), lista)
    const dos = sincronizarCola(una, lista)
    expect(dos).toEqual(una)
  })
})

describe('liberar', () => {
  const conCola = sincronizarCola(estadoInicialCola([pedido(1, 10)]), [
    pedido(1, 10),
    pedido(2, 20),
    pedido(3, 30, 'Cancelado'),
  ])

  test('liberarSiguiente saca el que llegó primero y lo muestra arriba', () => {
    const { estado, liberados } = liberarSiguiente(conCola)
    expect(ids(liberados)).toEqual([2])
    expect(ids(estado.visibles)).toEqual([2, 1])
    expect(ids(estado.cola)).toEqual([3])
  })

  test('liberarSiguiente con la cola vacía no hace nada', () => {
    const vacio = estadoInicialCola([pedido(1, 10)])
    expect(liberarSiguiente(vacio)).toEqual({ estado: vacio, liberados: [] })
  })

  test('liberarTodos vacía la cola', () => {
    const { estado, liberados } = liberarTodos(conCola)
    expect(ids(liberados)).toEqual([2, 3])
    expect(ids(estado.visibles)).toEqual([3, 2, 1])
    expect(estado.cola).toEqual([])
  })

  test('los que no coinciden con el filtro entran sin esperar turno', () => {
    const { estado, liberados } = liberarQueNoCoinciden(conCola, (p) => p.estado === 'Pendiente')
    expect(ids(liberados)).toEqual([3])
    expect(ids(estado.cola)).toEqual([2])
  })
})

describe('ordenarPorLlegada y actualizarPedidoEnCola', () => {
  test('con la misma fecha desempata por id; una fecha inválida va al final', () => {
    const invalido = { ...pedido(1, 10), fecha: 'no es fecha' }
    expect(ids(ordenarPorLlegada([pedido(9, 10), invalido, pedido(4, 10)]))).toEqual([4, 9, 1])
  })

  test('actualiza el pedido donde esté', () => {
    const estado = actualizarPedidoEnCola(
      { visibles: [pedido(1, 10)], cola: [pedido(2, 20)] },
      2,
      { estado: 'En proceso' },
    )
    expect(estado.cola[0].estado).toBe('En proceso')
    expect(estado.visibles[0].estado).toBe('Pendiente')
  })
})
