import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { useAuth } from '../AuthContext'
import { useRealtime } from '../realtime/RealtimeContext'
import {
  AccionesNotificacionesContext,
  EstadoNotificacionesContext,
} from './NotificacionContext'
import {
  estadoInicial,
  notificacionReducer,
} from './notificacionReducer'
import {
  contarNotificacionesNoLeidasCliente,
  LIMITE_INICIAL,
  LIMITE_VER_MAS,
  listarNotificacionesCliente,
  marcarNotificacionLeidaCliente,
  marcarTodasNotificacionesLeidasCliente,
} from '../../services/notificacionService'
import { ErrorApi } from '../../services/httpClient'
import { mapearNotificacion } from '../../utils/notificaciones/mapearNotificacion'
import { mapearEventoLeida } from '../../utils/notificaciones/mapearEventoLeida'
import { normalizarCursor } from '../../utils/notificaciones/normalizarCursor'
import type { AccionesNotificacionesCliente } from '../../types/notificacion.types'

function mensajeDeError(error: unknown, porDefecto: string): string {
  return error instanceof Error && error.message
    ? error.message
    : porDefecto
}

function esCursorInvalido(error: unknown): boolean {
  return error instanceof ErrorApi && error.codigo === 'CURSOR_INVALIDO'
}

function esSesionExpirada(error: unknown): boolean {
  return error instanceof ErrorApi && error.status === 401
}

export function NotificacionProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const { suscribir } = useRealtime()
  const [estado, dispatch] = useReducer(notificacionReducer, estadoInicial)
  const tokenRef = useRef<string | null>(token)
  const tokenAnteriorRef = useRef<string | null>(null)

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  const cargarInicial = useCallback(async () => {
    const tokenCarga = token
    if (!tokenCarga) return

    dispatch({ type: 'CARGA_INICIAL_INICIO' })

    try {
      const pagina = await listarNotificacionesCliente({
        limite: LIMITE_INICIAL,
      })

      let noLeidas: number | null = null

      try {
        noLeidas = await contarNotificacionesNoLeidasCliente()
      } catch (error) {
        if (esSesionExpirada(error)) return
        noLeidas = null
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
        mensaje: mensajeDeError(
          error,
          'No se pudieron cargar las notificaciones',
        ),
      })
    }
  }, [token])

  useEffect(() => {
    if (tokenAnteriorRef.current !== token) {
      tokenAnteriorRef.current = token
      dispatch({ type: 'REINICIAR' })
    }

    if (!token) return
    void cargarInicial()
  }, [cargarInicial, token])

  const revalidarContador = useCallback(async () => {
    const tokenActual = token
    if (!tokenActual) return

    try {
      const noLeidas = await contarNotificacionesNoLeidasCliente()
      if (tokenRef.current !== tokenActual) return
      dispatch({ type: 'CONTADOR_ACTUALIZADO', noLeidas })
    } catch (error) {
      if (tokenRef.current !== tokenActual || esSesionExpirada(error)) return
      dispatch({ type: 'CONTADOR_ACTUALIZADO', noLeidas: null })
    }
  }, [token])

  const cargarMas = useCallback(() => {
    const tokenActual = token
    const cursor = normalizarCursor(estado.siguienteCursor)
    if (!tokenActual || !cursor || estado.cargandoMas) return

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
          mensaje: mensajeDeError(
            error,
            'No se pudieron cargar más notificaciones',
          ),
        })
      }
    })()
  }, [cargarInicial, estado.cargandoMas, estado.siguienteCursor, token])

  const marcarLeida = useCallback(
    (id: number) => {
      if (!Number.isInteger(id) || id <= 0) return

      const tokenActual = token
      if (!tokenActual) return

      const marca = new Date().toISOString()
      dispatch({ type: 'LECTURA_LOCAL_OPTIMISTA', id, marca })

      void (async () => {
        try {
          await marcarNotificacionLeidaCliente(id)
        } catch (error) {
          if (tokenRef.current !== tokenActual || esSesionExpirada(error)) return

          dispatch({ type: 'LECTURA_LOCAL_REVERTIR', id, marca })
          dispatch({
            type: 'ERROR_ACTUALIZADO',
            mensaje: mensajeDeError(
              error,
              'No se pudo marcar la notificación como leída',
            ),
          })
        }
      })()
    },
    [token],
  )

  const marcarTodas = useCallback(() => {
    const tokenActual = token
    if (!tokenActual || estado.marcandoTodas || estado.noLeidas === 0) return

    const marca = new Date().toISOString()
    dispatch({ type: 'MARCAR_TODAS_INICIO', marca })

    void (async () => {
      try {
        const respuesta = await marcarTodasNotificacionesLeidasCliente()
        if (tokenRef.current !== tokenActual) return

        dispatch({
          type: 'MARCAR_TODAS_OK',
          leidaEn: respuesta.leidaEn,
        })
      } catch (error) {
        if (tokenRef.current !== tokenActual || esSesionExpirada(error)) return

        dispatch({
          type: 'MARCAR_TODAS_ERROR',
          mensaje: mensajeDeError(
            error,
            'No se pudieron marcar todas las notificaciones',
          ),
        })
      }
    })()
  }, [estado.marcandoTodas, estado.noLeidas, token])

  const reintentar = useCallback(() => {
    if (estado.items.length === 0) {
      void cargarInicial()
      return
    }

    if (estado.siguienteCursor) {
      cargarMas()
      return
    }

    dispatch({ type: 'ERROR_ACTUALIZADO', mensaje: null })
  }, [cargarInicial, cargarMas, estado.items.length, estado.siguienteCursor])

  const alRecibirNotificacion = useCallback((payload: unknown) => {
    const notificacion = mapearNotificacion(payload)
    if (!notificacion) return

    dispatch({ type: 'NUEVA_NOTIFICACION', notificacion })
  }, [])

  const alRecibirLeida = useCallback((payload: unknown) => {
    const evento = mapearEventoLeida(payload)
    if (!evento) return

    dispatch({ type: 'LECTURA_REMOTA', evento })
  }, [])

  useEffect(() => {
    if (!token) return

    return suscribir((evento) => {
      if (evento.tipo === 'notificacion') {
        alRecibirNotificacion(evento.payload)
        return
      }

      if (evento.tipo === 'notificacion:leida') {
        alRecibirLeida(evento.payload)
        return
      }

      if (evento.tipo === 'reconexion') {
        void revalidarContador()
      }
    })
  }, [
    alRecibirLeida,
    alRecibirNotificacion,
    revalidarContador,
    suscribir,
    token,
  ])

  const acciones = useMemo<AccionesNotificacionesCliente>(
    () => ({
      cargarMas,
      marcarLeida,
      marcarTodas,
      reintentar,
    }),
    [cargarMas, marcarLeida, marcarTodas, reintentar],
  )

  return (
    <EstadoNotificacionesContext.Provider value={estado}>
      <AccionesNotificacionesContext.Provider value={acciones}>
        {children}
      </AccionesNotificacionesContext.Provider>
    </EstadoNotificacionesContext.Provider>
  )
}
