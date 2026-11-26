import type { PedidoFila } from '../../types/pedido.types'
import { ordenarPedidosPorFechaDesc } from './ordenPedidos'

// Cola de ingreso de pedidos (plan responsivo, 4.2). Funciones PURAS: sin timers ni React.
// - `visibles`: lo que ya se muestra en la lista (del más nuevo al más viejo).
// - `cola`: pedidos nuevos que esperan su turno, en orden de llegada.
// Los datos de ambos se actualizan siempre con lo último del servidor.
export interface EstadoCola {
  visibles: PedidoFila[]
  cola: PedidoFila[]
}

export interface ResultadoLiberacion {
  estado: EstadoCola
  liberados: PedidoFila[]
}

function marcaDeTiempo(pedido: PedidoFila): number {
  const valor = Date.parse(pedido.fecha)
  // Una fecha inválida va al final de la cola
  return Number.isNaN(valor) ? Number.POSITIVE_INFINITY : valor
}

export function ordenarPorLlegada(pedidos: PedidoFila[]): PedidoFila[] {
  return [...pedidos].sort((a, b) => {
    const diferencia = marcaDeTiempo(a) - marcaDeTiempo(b)
    if (diferencia !== 0 && !Number.isNaN(diferencia)) return diferencia
    return a.id - b.id
  })
}

// Carga inicial o cambio de sucursal: todo se muestra de una vez, sin cola
export function estadoInicialCola(lista: PedidoFila[]): EstadoCola {
  return { visibles: ordenarPedidosPorFechaDesc(lista), cola: [] }
}

// Aplica una respuesta nueva del servidor:
// - visibles y encolados se actualizan (estado, total…); los que el servidor ya no devuelve, se quitan
// - los ids que no estaban en ningún lado se encolan
export function sincronizarCola(
  estado: EstadoCola,
  listaServidor: PedidoFila[],
): EstadoCola {
  const porId = new Map(listaServidor.map((pedido) => [pedido.id, pedido]))

  const visibles = estado.visibles
    .filter((pedido) => porId.has(pedido.id))
    .map((pedido) => porId.get(pedido.id) as PedidoFila)
  const encolados = estado.cola
    .filter((pedido) => porId.has(pedido.id))
    .map((pedido) => porId.get(pedido.id) as PedidoFila)

  const conocidos = new Set([...visibles, ...encolados].map((p) => p.id))
  const nuevos = listaServidor.filter((pedido) => !conocidos.has(pedido.id))

  return {
    visibles: ordenarPedidosPorFechaDesc(visibles),
    cola: ordenarPorLlegada([...encolados, ...nuevos]),
  }
}

function moverAVisibles(estado: EstadoCola, ids: Set<number>): ResultadoLiberacion {
  if (ids.size === 0) return { estado, liberados: [] }
  const liberados = estado.cola.filter((pedido) => ids.has(pedido.id))
  return {
    estado: {
      visibles: ordenarPedidosPorFechaDesc([...estado.visibles, ...liberados]),
      cola: estado.cola.filter((pedido) => !ids.has(pedido.id)),
    },
    liberados,
  }
}

// Saca de la cola el que llegó primero
export function liberarSiguiente(estado: EstadoCola): ResultadoLiberacion {
  const [primero] = estado.cola
  if (!primero) return { estado, liberados: [] }
  return moverAVisibles(estado, new Set([primero.id]))
}

// "Mostrar ahora": vacía la cola de una vez
export function liberarTodos(estado: EstadoCola): ResultadoLiberacion {
  return moverAVisibles(estado, new Set(estado.cola.map((pedido) => pedido.id)))
}

// Los encolados que el filtro actual no mostraría entran sin esperar turno:
// no se verían, así que no tiene sentido gastar un cooldown en ellos
export function liberarQueNoCoinciden(
  estado: EstadoCola,
  coincide: (pedido: PedidoFila) => boolean,
): ResultadoLiberacion {
  const ids = new Set(
    estado.cola.filter((pedido) => !coincide(pedido)).map((pedido) => pedido.id),
  )
  return moverAVisibles(estado, ids)
}

// Cambio local (p. ej. tras un PATCH propio) sobre visibles y encolados
export function actualizarPedidoEnCola(
  estado: EstadoCola,
  pedidoId: number,
  cambios: Partial<PedidoFila>,
): EstadoCola {
  const aplicar = (pedido: PedidoFila) =>
    pedido.id === pedidoId ? { ...pedido, ...cambios } : pedido
  return { visibles: estado.visibles.map(aplicar), cola: estado.cola.map(aplicar) }
}
