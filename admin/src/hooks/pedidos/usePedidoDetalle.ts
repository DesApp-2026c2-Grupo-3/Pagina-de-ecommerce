import { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../services/httpClient'
import { obtenerPedidoPorId } from '../../services/pedidoService'
import type { PedidoCompleto } from '../../types/pedido.types'
import { normalizarEtapa } from '../../utils/pedidos/normalizarPedido'

export type EstadoCargaDetalle = 'cargando' | 'listo' | 'no-encontrado' | 'error'

// Detalle de un pedido para la página /admin/pedidos/:pedidoId.
// 403 y 404 se tratan igual («no encontrado»), sin revelar si el pedido existe (RF-83, RN-43).
export function usePedidoDetalle(pedidoId: number | null) {
  const [pedido, setPedido] = useState<PedidoCompleto | null>(null)
  const [carga, setCarga] = useState<EstadoCargaDetalle>(pedidoId === null ? 'no-encontrado' : 'cargando')
  const [error, setError] = useState('')
  const solicitud = useRef(0)

  // Cambio de pedido (p. ej. otra notificación): se reinicia en el mismo render
  const [pedidoMostrado, setPedidoMostrado] = useState(pedidoId)
  if (pedidoMostrado !== pedidoId) {
    setPedidoMostrado(pedidoId)
    setPedido(null)
    setError('')
    setCarga(pedidoId === null ? 'no-encontrado' : 'cargando')
  }

  // Sin setState antes del primer await: se puede llamar desde un efecto
  const traer = useCallback(
    async (silencioso: boolean) => {
      if (pedidoId === null) return
      const actual = ++solicitud.current

      try {
        const detalle = await obtenerPedidoPorId(pedidoId)
        // Una respuesta vieja (otro pedido, o una recarga anterior) no pisa la nueva
        if (actual !== solicitud.current) return
        setPedido({ ...detalle, estado: normalizarEtapa(detalle.estado) })
        setError('')
        setCarga('listo')
      } catch (err) {
        if (actual !== solicitud.current) return
        const status = err instanceof ErrorApi ? err.status : 0
        if (status === 404 || status === 403) {
          setPedido(null)
          setCarga('no-encontrado')
          return
        }
        setError(err instanceof Error ? err.message : 'No se pudo cargar el pedido')
        // Si ya había un detalle en pantalla, se conserva y solo se avisa el error
        setCarga((previa) => (silencioso && previa === 'listo' ? previa : 'error'))
      }
    },
    [pedidoId],
  )

  useEffect(() => {
    void traer(false)
    return () => {
      // Al cambiar de pedido o salir, las respuestas en vuelo quedan descartadas
      solicitud.current += 1
    }
  }, [traer])

  // Recarga sin volver a «Cargando...» (tras un cambio propio o un aviso en tiempo real)
  const recargar = useCallback(() => traer(true), [traer])
  // Desde el botón «Reintentar» (un evento): ahí sí se vuelve a «Cargando...»
  const reintentar = useCallback(() => {
    setCarga('cargando')
    return traer(false)
  }, [traer])

  return { pedido, carga, error, recargar, reintentar }
}
