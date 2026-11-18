import { useCallback, useEffect, useState } from 'react'

import { obtenerPedidosDisponibles } from '../services/pedidoService'
import { tomarPedidos } from '../services/viajeService'
import type { Pedido } from '../types/pedido.types'
import { useRefrescoRepartidor } from './useRefrescoRepartidor'

// Pedidos "Listo para retirar" de la sucursal, siempre al día:
// se recargan solos cuando otro repartidor toma uno o el local suma/cancela uno.
export function usePedidosDisponibles() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Los cambios de estado viven en los callbacks de la promesa (cuando llega la respuesta),
  // nunca en el mismo paso del efecto: mismo patrón que la validación de sesión de AuthProvider
  const cargar = useCallback(
    () =>
      obtenerPedidosDisponibles()
        .then((datos) => {
          setPedidos(datos)
          setError('')
        })
        .catch(() => setError('No se pudieron cargar los pedidos disponibles.'))
        .finally(() => setCargando(false)),
    [],
  )

  // Primera carga: "cargando" ya arranca en true
  useEffect(() => {
    void cargar()
  }, [cargar])

  const recargarSilencioso = useCallback(() => {
    void cargar()
  }, [cargar])

  useRefrescoRepartidor('pedidos_disponibles', recargarSilencioso)

  // "Actualizar" manual: muestra la carga
  const recargar = useCallback(() => {
    setCargando(true)
    void cargar()
  }, [cargar])

  // Si falla (otro repartidor se adelantó), la lista se refresca y el error sube a la pantalla
  const tomar = useCallback(async (pedidoIds: number[]) => {
    try {
      await tomarPedidos(pedidoIds)
    } catch (error) {
      recargarSilencioso()
      throw error
    }
  }, [recargarSilencioso])

  return { pedidos, cargando, error, recargar, tomar }
}
