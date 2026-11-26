import { useCallback, useEffect, useRef, useState } from 'react'
import { getPedidoCliente } from '../services/orderService'
import type { Order } from '../types/order'
import { useRefrescoCliente } from './useRefrescoCliente'
import { useValorActual } from './useValorActual'

interface Resultado {
  pedidoId: number
  pedido: Order | null
  error: string
}

// Un pedido del cliente, al día: se recarga del servidor con cada refresco de ese pedido, al
// reconectar y al volver a la pestaña. Estado, línea de tiempo y hora estimada vienen del
// backend (plan, C-6 y E-2). Con pedidoId null no carga nada.
export function usePedidoEnVivo(pedidoId: number | null) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const pedidoIdRef = useValorActual(pedidoId)
  // Solo vale la respuesta del último pedido hecho: una más vieja que llega tarde no pisa el estado
  // actual (un refresco puede llegar mientras la carga inicial está en camino, RN-45)
  const ultimaCargaRef = useRef(0)

  const cargar = useCallback(() => {
    if (pedidoId === null) return

    const carga = ++ultimaCargaRef.current
    const vigente = () => carga === ultimaCargaRef.current && pedidoIdRef.current === pedidoId

    getPedidoCliente(pedidoId)
      .then((pedido) => {
        if (vigente()) setResultado({ pedidoId, pedido, error: '' })
      })
      .catch((error: unknown) => {
        if (!vigente()) return
        // Si falla una recarga, queda a la vista lo último que se cargó
        setResultado((anterior) =>
          anterior?.pedidoId === pedidoId && anterior.pedido
            ? anterior
            : {
                pedidoId,
                pedido: null,
                error: error instanceof Error ? error.message : 'No se pudo cargar el pedido',
              },
        )
      })
  }, [pedidoId, pedidoIdRef])

  useEffect(() => {
    cargar()
  }, [cargar])

  useRefrescoCliente('pedido', cargar, (refresco) => refresco.pedidoId === pedidoId)

  const actual = resultado?.pedidoId === pedidoId ? resultado : null
  return {
    pedido: actual?.pedido ?? null,
    error: actual?.error ?? '',
    cargando: pedidoId !== null && actual === null,
  }
}
