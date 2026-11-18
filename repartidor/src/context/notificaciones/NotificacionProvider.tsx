import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

import { useAuth } from '../AuthContext'
import { useRealtime } from '../realtime/RealtimeContext'
import { useToast } from '../toasts/ToastContext'
import { AccionesNotificacionesContext, EstadoNotificacionesContext } from './NotificacionContext'
import { estadoInicial, notificacionReducer } from './notificacionReducer'
import {
  contarNotificacionesNoLeidas,
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from '../../services/notificacionService'
import { mapearEventoLeida, mapearNotificacion } from '../../notificaciones/mapearNotificacion'
import type { AccionesNotificaciones } from '../../types/notificacion.types'
import type { DatosToast } from '../../types/toast.types'

const LIMITE_INICIAL = 10
const LIMITE_VER_MAS = 10
// Junta "reconexion" y "visible" que llegan casi juntos en una sola recarga
const ESPERA_RECARGA_MS = 300

// UX-04: si una lectura optimista falla, se revierte y se avisa (id fijo: no se apilan)
const ERROR_MARCAR_LEIDA: DatosToast = {
  id: 'error-marcar-leida',
  tono: 'peligro',
  icono: CircleAlert,
  titulo: 'No se pudo marcar el aviso como leído',
  descripcion: 'Revisá tu conexión y volvé a intentarlo.',
  prioridad: 'alta',
}

const ERROR_MARCAR_TODAS: DatosToast = {
  ...ERROR_MARCAR_LEIDA,
  id: 'error-marcar-todas',
  titulo: 'No se pudieron marcar los avisos como leídos',
}

function mensajeDeError(error: unknown, porDefecto: string): string {
  return error instanceof Error && error.message ? error.message : porDefecto
}

// Bandeja del repartidor: carga por REST y se mantiene al día con el bus
export function NotificacionProvider({ children }: { children: ReactNode }) {
  const { token, cargando } = useAuth()
  const { suscribir } = useRealtime()
  const { mostrar } = useToast()
  const [estado, dispatch] = useReducer(notificacionReducer, estadoInicial)

  const activo = Boolean(token) && !cargando

  const cargarInicial = useCallback(async () => {
    dispatch({ type: 'CARGA_INICIAL_INICIO' })

    try {
      const [pagina, noLeidas] = await Promise.all([
        listarNotificaciones({ limite: LIMITE_INICIAL }),
        contarNotificacionesNoLeidas().catch(() => null),
      ])

      dispatch({
        type: 'CARGA_INICIAL_OK',
        items: pagina.items,
        siguienteCursor: pagina.siguienteCursor,
        noLeidas,
      })
    } catch (error) {
      dispatch({
        type: 'CARGA_INICIAL_ERROR',
        mensaje: mensajeDeError(error, 'No se pudieron cargar las notificaciones'),
      })
    }
  }, [])

  // Al cambiar de sesión se arranca de cero
  useEffect(() => {
    dispatch({ type: 'REINICIAR' })
    if (activo) void cargarInicial()
  }, [activo, cargarInicial])

  useEffect(() => {
    let espera: ReturnType<typeof setTimeout> | null = null

    const desuscribir = suscribir((evento) => {
      if (evento.tipo === 'notificacion') {
        const notificacion = mapearNotificacion(evento.payload)
        if (notificacion) dispatch({ type: 'NUEVA_NOTIFICACION', notificacion })
        return
      }

      if (evento.tipo === 'notificacion:leida') {
        const lectura = mapearEventoLeida(evento.payload)
        if (lectura) dispatch({ type: 'LECTURA_REMOTA', evento: lectura })
        return
      }

      // Sin conexión o en segundo plano se pudieron perder avisos: se vuelve a cargar (W-1)
      if (evento.tipo === 'reconexion' || evento.tipo === 'visible') {
        if (espera) clearTimeout(espera)
        espera = setTimeout(() => {
          espera = null
          void cargarInicial()
        }, ESPERA_RECARGA_MS)
      }
    })

    return () => {
      if (espera) clearTimeout(espera)
      desuscribir()
    }
  }, [cargarInicial, suscribir])

  const cargarMas = useCallback(() => {
    const cursor = estado.siguienteCursor
    if (!cursor || estado.cargandoMas) return

    dispatch({ type: 'CARGA_MAS_INICIO' })

    listarNotificaciones({ limite: LIMITE_VER_MAS, antesDe: cursor })
      .then((pagina) => dispatch({
        type: 'CARGA_MAS_OK',
        items: pagina.items,
        siguienteCursor: pagina.siguienteCursor,
      }))
      .catch((error: unknown) => dispatch({
        type: 'CARGA_MAS_ERROR',
        mensaje: mensajeDeError(error, 'No se pudieron cargar más notificaciones'),
      }))
  }, [estado.cargandoMas, estado.siguienteCursor])

  // UX-04: se marca al instante; si el servidor falla, se revierte y aparece un toast
  const marcarLeida = useCallback((id: number) => {
    const marca = new Date().toISOString()
    dispatch({ type: 'LECTURA_OPTIMISTA', id, marca })

    marcarNotificacionLeida(id).catch(() => {
      dispatch({ type: 'LECTURA_REVERTIR', id, marca })
      mostrar(ERROR_MARCAR_LEIDA)
    })
  }, [mostrar])

  const marcarTodas = useCallback(() => {
    if (estado.marcandoTodas) return

    dispatch({ type: 'MARCAR_TODAS_INICIO', marca: new Date().toISOString() })

    marcarTodasNotificacionesLeidas()
      .then(({ leidaEn }) => dispatch({ type: 'MARCAR_TODAS_OK', leidaEn }))
      .catch(() => {
        dispatch({ type: 'MARCAR_TODAS_ERROR' })
        mostrar(ERROR_MARCAR_TODAS)
      })
  }, [estado.marcandoTodas, mostrar])

  const reintentar = useCallback(() => {
    void cargarInicial()
  }, [cargarInicial])

  const acciones = useMemo<AccionesNotificaciones>(
    () => ({ cargarMas, marcarLeida, marcarTodas, reintentar }),
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
