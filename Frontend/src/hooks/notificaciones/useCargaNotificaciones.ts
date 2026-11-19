import { useCallback, useEffect, type Dispatch, type RefObject } from 'react'
import type {
  AccionNotificacionesCliente,
  EstadoNotificacionesCliente,
} from '../../types/notificacion.types'
import {
  contarNotificacionesNoLeidasCliente,
  LIMITE_INICIAL,
  LIMITE_VER_MAS,
  listarNotificacionesCliente,
} from '../../services/notificacionService'
import { normalizarCursor } from '../../utils/notificaciones/normalizarCursor'
import {
  esCursorInvalido,
  esSesionExpirada,
  mensajeDeError,
} from '../../utils/notificaciones/errores'

interface Opciones {
  token: string | null
  dispatch: Dispatch<AccionNotificacionesCliente>
  tokenRef: RefObject<string | null>
  estadoRef: RefObject<EstadoNotificacionesCliente>
}

// Carga inicial con el contador (al cambiar la sesión y al revalidar) y páginas siguientes.
// Las funciones son estables: leen la sesión y el estado de las referencias (plan, E-6).
export function useCargaNotificaciones({ token, dispatch, tokenRef, estadoRef }: Opciones) {
  const cargarInicial = useCallback(async () => {
    const tokenCarga = tokenRef.current
    if (!tokenCarga) return

    dispatch({ type: 'CARGA_INICIAL_INICIO' })

    try {
      const pagina = await listarNotificacionesCliente({ limite: LIMITE_INICIAL })

      let noLeidas: number | null = null
      try {
        noLeidas = await contarNotificacionesNoLeidasCliente()
      } catch (error) {
        if (esSesionExpirada(error)) return
      }

      if (tokenRef.current !== tokenCarga) return
      dispatch({
        type: 'CARGA_INICIAL_OK',
        items: pagina.items,
        siguienteCursor: pagina.siguienteCursor,
        noLeidas,
      })
    } catch (error) {
      if (tokenRef.current !== tokenCarga || esSesionExpirada(error)) return
      dispatch({
        type: 'CARGA_INICIAL_ERROR',
        mensaje: mensajeDeError(error, 'No se pudieron cargar las notificaciones'),
      })
    }
  }, [dispatch, tokenRef])

  const cargarMas = useCallback(() => {
    const tokenActual = tokenRef.current
    const { siguienteCursor, cargandoMas } = estadoRef.current
    const cursor = normalizarCursor(siguienteCursor)
    if (!tokenActual || !cursor || cargandoMas) return

    dispatch({ type: 'CARGA_MAS_INICIO' })

    void (async () => {
      try {
        const pagina = await listarNotificacionesCliente({
          limite: LIMITE_VER_MAS,
          antesDe: cursor,
        })
        if (tokenRef.current !== tokenActual) return
        dispatch({
          type: 'CARGA_MAS_OK',
          items: pagina.items,
          siguienteCursor: pagina.siguienteCursor,
        })
      } catch (error) {
        if (tokenRef.current !== tokenActual || esSesionExpirada(error)) return

        if (esCursorInvalido(error)) {
          dispatch({ type: 'CURSOR_DESCARTADO' })
          void cargarInicial()
          return
        }

        dispatch({
          type: 'CARGA_MAS_ERROR',
          mensaje: mensajeDeError(error, 'No se pudieron cargar más notificaciones'),
        })
      }
    })()
  }, [cargarInicial, dispatch, estadoRef, tokenRef])

  // Cada sesión arranca de cero: se vacía lo del usuario anterior y se carga lo del nuevo
  // (tokenRef ya tiene el token nuevo: su efecto se declara antes, en el provider)
  useEffect(() => {
    dispatch({ type: 'REINICIAR' })
    if (token) void cargarInicial()
  }, [cargarInicial, dispatch, token])

  return { cargarInicial, cargarMas }
}
