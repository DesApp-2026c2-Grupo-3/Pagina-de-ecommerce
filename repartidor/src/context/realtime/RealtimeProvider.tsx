import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { useAuth } from '../AuthContext'
import { RealtimeContext } from './RealtimeContext'
import { obtenerSocketRepartidor, desconectarSocketRepartidor } from '../../realtime/socketClient'
import { publicarEventoRealtime, suscribirEventoRealtime, type OyenteRealtime } from '../../realtime/realtimeBus'
import {
  CODIGOS_AUTH,
  EVENTOS,
  normalizarEventoRefresco,
  normalizarMotivoRevocacion,
} from '../../realtime/realtimeEvents'
import { escucharRegresoAPrimerPlano } from '../../realtime/visibilidad'
import type { EstadoRealtime } from '../../types/realtime.types'

function codigoDeError(error: unknown): string | null {
  const datos = (error as { data?: { code?: unknown } } | null)?.data
  return typeof datos?.code === 'string' ? datos.code : null
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token, cargando, cerrarSesion } = useAuth()
  const [estado, setEstado] = useState<EstadoRealtime>('desconectado')

  // El socket se abre recién con la sesión ya validada por /me (plan 5.6)
  const activo = Boolean(token) && !cargando

  useEffect(() => {
    if (!activo) return

    const socket = obtenerSocketRepartidor()
    let yaConecto = false

    const cambiarEstado = (nuevo: EstadoRealtime) => {
      setEstado(nuevo)
      publicarEventoRealtime({ tipo: 'conexion', estado: nuevo })
    }

    socket.on('connect', () => {
      cambiarEstado('conectado')
      // Mientras no hubo conexión se pudieron perder refrescos: los hooks recargan
      if (yaConecto) publicarEventoRealtime({ tipo: 'reconexion' })
      yaConecto = true
    })

    // D-18 / 31.5: el servidor cortó (revocación). Socket.io no reconecta solo en este caso.
    socket.on('disconnect', (motivo) => {
      if (motivo === 'io server disconnect') {
        cerrarSesion('desactivado')
        return
      }
      cambiarEstado('reconectando')
    })

    // Handshake rechazado por autenticación: socket.active queda en false y no se reintenta.
    // Prohibido llamar a socket.connect() acá. Un corte de red sí se reintenta solo.
    socket.on('connect_error', (error) => {
      const codigo = codigoDeError(error)
      if (codigo && CODIGOS_AUTH.has(codigo)) {
        cerrarSesion('expirada')
        return
      }
      cambiarEstado('reconectando')
    })

    socket.on(EVENTOS.sesionRevocada, (payload: unknown) => {
      cerrarSesion(normalizarMotivoRevocacion(payload))
    })

    socket.on(EVENTOS.notificacion, (payload: unknown) => {
      publicarEventoRealtime({ tipo: 'notificacion', payload })
    })

    socket.on(EVENTOS.notificacionLeida, (payload: unknown) => {
      publicarEventoRealtime({ tipo: 'notificacion:leida', payload })
    })

    socket.on(EVENTOS.refresco, (payload: unknown) => {
      const evento = normalizarEventoRefresco(payload)
      if (evento) publicarEventoRealtime({ tipo: 'repartidor:refresco', payload: evento })
    })

    cambiarEstado('conectando')
    socket.connect()

    return () => {
      desconectarSocketRepartidor()
      setEstado('desconectado')
    }
  }, [activo, cerrarSesion])

  // W-1: al volver a primer plano se recargan los datos. El socket se reconecta solo
  // (Socket.io); acá nunca se llama a socket.connect() (D-18).
  useEffect(() => {
    if (!activo) return
    return escucharRegresoAPrimerPlano(() => publicarEventoRealtime({ tipo: 'visible' }))
  }, [activo])

  // Nueva identidad por sesión (ver RealtimeContextType.suscribir): depende del token a propósito
  const suscribir = useCallback(
    (oyente: OyenteRealtime) => (token ? suscribirEventoRealtime(oyente) : () => {}),
    [token],
  )

  const valor = useMemo(() => ({ estado, suscribir }), [estado, suscribir])

  return <RealtimeContext.Provider value={valor}>{children}</RealtimeContext.Provider>
}
