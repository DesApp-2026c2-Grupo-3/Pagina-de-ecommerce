import { useCallback, type Dispatch, type RefObject } from 'react'
import type {
  AccionNotificacionesCliente,
  EstadoNotificacionesCliente,
} from '../../types/notificacion.types'
import {
  marcarNotificacionLeidaCliente,
  marcarTodasNotificacionesLeidasCliente,
} from '../../services/notificacionService'
import { esSesionExpirada, mensajeDeError } from '../../utils/notificaciones/errores'

interface Opciones {
  dispatch: Dispatch<AccionNotificacionesCliente>
  tokenRef: RefObject<string | null>
  estadoRef: RefObject<EstadoNotificacionesCliente>
}

// Marcar una (optimista, se revierte si falla) y marcar todas (con el leidaEn del servidor)
export function useLecturaNotificaciones({ dispatch, tokenRef, estadoRef }: Opciones) {
  const marcarLeida = useCallback(
    (id: number) => {
      const tokenActual = tokenRef.current
      if (!tokenActual) return

      const marca = new Date().toISOString()
      dispatch({ type: 'LECTURA_LOCAL_OPTIMISTA', id, marca })

      void (async () => {
        try {
          await marcarNotificacionLeidaCliente(id)
        } catch (error) {
          if (tokenRef.current !== tokenActual || esSesionExpirada(error)) return
          dispatch({
            type: 'LECTURA_LOCAL_REVERTIR',
            id,
            marca,
            mensaje: mensajeDeError(error, 'No se pudo marcar la notificación como leída'),
          })
        }
      })()
    },
    [dispatch, tokenRef],
  )

  const marcarTodas = useCallback(() => {
    const tokenActual = tokenRef.current
    const { marcandoTodas, noLeidas } = estadoRef.current
    if (!tokenActual || marcandoTodas || noLeidas === 0) return

    dispatch({ type: 'MARCAR_TODAS_INICIO' })

    void (async () => {
      try {
        const respuesta = await marcarTodasNotificacionesLeidasCliente()
        if (tokenRef.current !== tokenActual) return
        dispatch({ type: 'MARCAR_TODAS_OK', leidaEn: respuesta.leidaEn })
      } catch (error) {
        if (tokenRef.current !== tokenActual || esSesionExpirada(error)) return
        dispatch({
          type: 'MARCAR_TODAS_ERROR',
          mensaje: mensajeDeError(error, 'No se pudieron marcar todas las notificaciones'),
        })
      }
    })()
  }, [dispatch, estadoRef, tokenRef])

  return { marcarLeida, marcarTodas }
}
