import { useEffect, type Dispatch } from 'react'
import { useRealtime } from '../../context/realtime/RealtimeContext'
import type { AccionNotificacionesCliente } from '../../types/notificacion.types'
import { mapearNotificacion } from '../../utils/notificaciones/mapearNotificacion'
import { mapearEventoLeida } from '../../utils/notificaciones/mapearEventoLeida'

const ESPERA_REVALIDAR_MS = 300

interface Opciones {
  activo: boolean
  dispatch: Dispatch<AccionNotificacionesCliente>
  revalidar: () => Promise<void>
}

// Avisos nuevos y lecturas hechas en otra pestaña. Al reconectar o volver a la pestaña se
// revalidan contador y primera página, una sola vez aunque lleguen los dos juntos (plan, C-6).
export function useSuscripcionNotificaciones({ activo, dispatch, revalidar }: Opciones) {
  const { suscribir } = useRealtime()

  useEffect(() => {
    if (!activo) return

    let espera: ReturnType<typeof setTimeout> | null = null

    const desuscribir = suscribir((evento) => {
      if (evento.tipo === 'notificacion') {
        const notificacion = mapearNotificacion(evento.payload)
        if (notificacion) dispatch({ type: 'NUEVA_NOTIFICACION', notificacion })
        return
      }

      if (evento.tipo === 'notificacion:leida') {
        const leida = mapearEventoLeida(evento.payload)
        if (leida) dispatch({ type: 'LECTURA_REMOTA', evento: leida })
        return
      }

      if (evento.tipo === 'reconexion' || evento.tipo === 'visible') {
        if (espera) clearTimeout(espera)
        espera = setTimeout(() => {
          espera = null
          void revalidar()
        }, ESPERA_REVALIDAR_MS)
      }
    })

    return () => {
      if (espera) clearTimeout(espera)
      desuscribir()
    }
  }, [activo, dispatch, revalidar, suscribir])
}
