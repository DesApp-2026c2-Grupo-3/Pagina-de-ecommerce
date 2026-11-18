import { useEffect, useRef } from 'react'

import { useRealtime } from '../context/realtime/RealtimeContext'
import { useToast } from '../context/toasts/ToastContext'
import { useAbrirNotificacion } from './useAbrirNotificacion'
import {
  apariencia,
  avisoEnVivo,
  describirNotificacion,
  mapearNotificacion,
} from '../notificaciones/mapearNotificacion'

// Bus "notificacion" → toast (plan UX, 7.3). Solo lo que llega en vivo: la carga inicial y la
// recarga al volver van directo a la bandeja (UX-07). Un mismo aviso no genera dos toasts.
export function useAvisosEnVivo(alAbrir?: () => void) {
  const { suscribir } = useRealtime()
  const { mostrar } = useToast()
  const abrir = useAbrirNotificacion(alAbrir)
  const mostrados = useRef(new Set<number>())

  useEffect(
    () =>
      suscribir((evento) => {
        if (evento.tipo !== 'notificacion') return

        const notificacion = mapearNotificacion(evento.payload)
        if (!notificacion || mostrados.current.has(notificacion.id)) return

        const aviso = avisoEnVivo(notificacion)
        if (!aviso) return

        mostrados.current.add(notificacion.id)
        const { titulo, descripcion } = describirNotificacion(notificacion)
        const { icono, tono } = apariencia(notificacion)

        mostrar({
          id: `notificacion-${notificacion.id}`,
          tono,
          icono,
          titulo,
          descripcion,
          prioridad: aviso.prioridad,
          accion: { texto: aviso.textoAccion, alTocar: () => abrir(notificacion) },
        })
      }),
    [abrir, mostrar, suscribir],
  )
}
