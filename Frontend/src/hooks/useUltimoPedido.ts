import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getHistorialPedidos } from '../services/orderService'
import type { Order } from '../types/order'
import { useRefrescoCliente } from './useRefrescoCliente'

function masReciente(pedidos: Order[]): Order | null {
  if (pedidos.length === 0) return null
  return pedidos.reduce((reciente, actual) =>
    new Date(actual.fecha).getTime() > new Date(reciente.fecha).getTime() ? actual : reciente,
  )
}

// El último pedido del cliente, al día: un pedido nuevo o un cambio de estado lo vuelve a traer
// (plan, C-6). La carga sale del componente por la regla de capas (sección 38, C-7).
export function useUltimoPedido(): Order | null {
  const { user } = useAuth()
  const [ultimo, setUltimo] = useState<Order | null>(null)
  // Solo vale la respuesta de la última carga: una más vieja que llega tarde no pisa la nueva
  const ultimaCargaRef = useRef(0)

  const cargar = useCallback(() => {
    if (!user) return

    const carga = ++ultimaCargaRef.current
    getHistorialPedidos()
      .then((pedidos) => {
        if (carga === ultimaCargaRef.current) setUltimo(masReciente(pedidos))
      })
      .catch(() => {
        if (carga === ultimaCargaRef.current) setUltimo(null)
      })
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  useRefrescoCliente('pedido', cargar)

  // Sin sesión no se muestra (y no queda el del usuario anterior)
  return user ? ultimo : null
}
