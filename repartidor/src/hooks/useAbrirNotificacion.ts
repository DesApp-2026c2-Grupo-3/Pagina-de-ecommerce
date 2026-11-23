import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAccionesNotificaciones } from '../context/notificaciones/NotificacionContext'
import { destinoNotificacion } from '../notificaciones/mapearNotificacion'
import type { Notificacion } from '../notificaciones/catalogo'

// Tocar un aviso: se marca leído (optimista) y se va a la pantalla donde hay que actuar
export function useAbrirNotificacion(alAbrir?: () => void) {
  const navigate = useNavigate()
  const { marcarLeida } = useAccionesNotificaciones()

  return useCallback(
    (notificacion: Notificacion) => {
      if (!notificacion.leida) marcarLeida(notificacion.id)
      alAbrir?.()
      navigate(destinoNotificacion(notificacion))
    },
    [alAbrir, marcarLeida, navigate],
  )
}
