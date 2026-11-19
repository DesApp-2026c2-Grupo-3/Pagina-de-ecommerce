import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Notificacion } from '../types/notificacion.types'
import { useAccionesNotificaciones } from '../context/notificaciones/NotificacionContext'
import { construirDestinoNotificacion } from '../utils/notificaciones/destinoNotificacion'

export function useAbrirNotificacion() {
  const navigate = useNavigate()
  const { marcarLeida } = useAccionesNotificaciones()

  return useCallback(
    (notificacion: Notificacion) => {
      const destino = construirDestinoNotificacion(notificacion)
      if (!destino) return

      if (!notificacion.leida) {
        marcarLeida(notificacion.id)
      }

      navigate(destino)
    },
    [marcarLeida, navigate],
  )
}
