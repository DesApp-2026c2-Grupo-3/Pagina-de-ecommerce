import { useCallback, useRef, useState } from 'react'
import { actualizarEstadoPedido } from '../../services/pedidoService'
import type { Etapa } from '../../types/pedido.types'
import { normalizarEtapa } from '../../utils/pedidos/normalizarPedido'

// PATCH de etapa compartido por la lista (acción rápida) y el detalle.
// Lleva qué pedido se está guardando (para deshabilitar botones y pausar la cola)
// y el último error de cada pedido.
export function useCambioEtapaPedido() {
  const [guardandoId, setGuardandoId] = useState<number | null>(null)
  const [errores, setErrores] = useState<Record<number, string>>({})
  const enCurso = useRef(new Set<number>())

  // Devuelve el estado nuevo (normalizado) o null si el backend lo rechazó
  const cambiarEtapa = useCallback(
    async (pedidoId: number, etapa: Etapa): Promise<string | null> => {
      // Doble clic o doble envío: un solo PATCH por pedido a la vez
      if (enCurso.current.has(pedidoId)) return null
      enCurso.current.add(pedidoId)
      setGuardandoId(pedidoId)
      setErrores((prev) => ({ ...prev, [pedidoId]: '' }))

      try {
        const respuesta = await actualizarEstadoPedido(pedidoId, etapa)
        return normalizarEtapa(respuesta?.estado ?? etapa)
      } catch (error) {
        setErrores((prev) => ({
          ...prev,
          [pedidoId]:
            error instanceof Error ? error.message : 'No se pudo actualizar el estado',
        }))
        return null
      } finally {
        enCurso.current.delete(pedidoId)
        setGuardandoId((actual) => (actual === pedidoId ? null : actual))
      }
    },
    [],
  )

  const limpiarError = useCallback((pedidoId: number) => {
    setErrores((prev) => (prev[pedidoId] ? { ...prev, [pedidoId]: '' } : prev))
  }, [])

  return { guardandoId, errores, cambiarEtapa, limpiarError }
}
