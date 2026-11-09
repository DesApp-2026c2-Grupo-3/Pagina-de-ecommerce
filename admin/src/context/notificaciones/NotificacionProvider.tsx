import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import { useAuth } from '../AuthContext'
import {
  AccionesNotificacionesContext,
  EstadoNotificacionesContext,
} from './NotificacionContext'
import {
  estadoInicial,
  notificacionReducer,
} from './notificacionReducer'
import { useRealtime } from '../realtime/RealtimeContext'
import { useTituloNoLeidas } from '../../hooks/useTituloNoLeidas'
import {
  contarNotificacionesNoLeidas,
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  normalizarCursorNotificaciones,
} from '../../services/notificacionService'
import { ErrorApi } from '../../services/httpClient'
import {
  mapearEventoLeida,
  mapearNotificacion,
} from '../../utils/notificaciones/mapearNotificacion'
import type { AccionesNotificaciones } from '../../types/notificacion.types'

const LIMITE_INICIAL = 8
const LIMITE_VER_MAS = 5

function mensajeDeError(error: unknown, porDefecto: string): string {
  return error instanceof Error && error.message
    ? error.message
    : porDefecto
}

function esCursorInvalido(error: unknown): boolean {
  return error instanceof ErrorApi && error.codigo === 'CURSOR_INVALIDO'
}

export function NotificacionProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const { suscribir } = useRealtime()
  const [estado, dispatch] = useReducer(notificacionReducer, estadoInicial)

  useTituloNoLeidas(estado.noLeidas)

  const cargarInicial = useCallback(async () => {
    if (!token) return

    dispatch({ type: 'CARGA_INICIAL_INICIO' })

    try {
      const pagina = await listarNotificaciones({ limite: LIMITE_INICIAL })
      let noLeidas: number | null = null

      try {
        noLeidas = await contarNotificacionesNoLeidas()
      } catch {
        noLeidas = null
      }

      dispatch({
        type: 'CARGA_INICIAL_OK',
        items: pagina.items,
        siguienteCursor: pagina.siguienteCursor,
        noLeidas,
      })
    } catch (error) {
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
    void cargarInicial()
  }, [cargarInicial])

  const revalidarContador = useCallback(async () => {
    if (!token) return

    try {
      const noLeidas = await contarNotificacionesNoLeidas()
      dispatch({ type: 'CONTADOR_ACTUALIZADO', noLeidas })
    } catch {
      dispatch({ type: 'CONTADOR_ACTUALIZADO', noLeidas: null })
    }
  }, [token])

  const cargarMas = useCallback(() => {
    const cursor = normalizarCursorNotificaciones(estado.siguienteCursor)
    if (!cursor || estado.cargandoMas) return

    dispatch({ type: 'CARGA_MAS_INICIO' })

    void (async () => {
      try {
        const pagina = await listarNotificaciones({
          limite: LIMITE_VER_MAS,
          antesDe: cursor,
        })
        dispatch({
          type: 'CARGA_MAS_OK',
          items: pagina.items,
          siguienteCursor: pagina.siguienteCursor,
        })
      } catch (error) {
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
  }, [cargarInicial, estado.cargandoMas, estado.siguienteCursor])

  const marcarLeida = useCallback((id: number) => {
    const marca = new Date().toISOString()
    dispatch({ type: 'LECTURA_LOCAL_OPTIMISTA', id, marca })

    void (async () => {
      try {
        await marcarNotificacionLeida(id)
      } catch (error) {
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
  }, [])

  const marcarTodas = useCallback(() => {
    if (estado.marcandoTodas || estado.noLeidas === 0) return

    const marca = new Date().toISOString()
    dispatch({ type: 'MARCAR_TODAS_INICIO', marca })

    void (async () => {
      try {
        const respuesta = await marcarTodasNotificacionesLeidas()
        const leidaEn = typeof respuesta?.leidaEn === 'string'
          ? respuesta.leidaEn
          : new Date().toISOString()

        dispatch({ type: 'MARCAR_TODAS_OK', leidaEn })
      } catch (error) {
        dispatch({
          type: 'MARCAR_TODAS_ERROR',
          mensaje: mensajeDeError(
            error,
            'No se pudieron marcar todas las notificaciones',
          ),
        })
      }
    })()
  }, [estado.marcandoTodas, estado.noLeidas])

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

  useEffect(() => suscribir((evento) => {
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
  }), [alRecibirLeida, alRecibirNotificacion, revalidarContador, suscribir])

  const acciones = useMemo<AccionesNotificaciones>(
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
