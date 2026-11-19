import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../AuthContext'
import {
  limpiarBusRealtime,
  publicarEventoRealtime,
  suscribirEventoRealtime,
} from '../../realtime/realtimeBus'
import {
  desconectarSocketCliente,
  obtenerSocketCliente,
} from '../../realtime/socketClient'
import {
  codigoErrorSocket,
  esErrorAutenticacionSocket,
} from '../../realtime/realtimeEvents'
import { RealtimeContext } from './RealtimeContext'
import type {
  EstadoConexionCliente,
  EstadoRealtimeCliente,
} from '../../types/realtime.types'

const ESTADO_INICIAL: EstadoRealtimeCliente = {
  conexion: 'desconectado',
  ultimaConexionEn: null,
  ultimoError: null,
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth()
  const [estado, setEstado] = useState<EstadoRealtimeCliente>(ESTADO_INICIAL)
  const estadoRef = useRef<EstadoRealtimeCliente>(ESTADO_INICIAL)
  const huboConectadoRef = useRef(false)

  const actualizarConexion = useCallback(
    (
      conexion: EstadoConexionCliente,
      ultimoError: string | null = null,
    ) => {
      const anterior = estadoRef.current
      const siguiente: EstadoRealtimeCliente = {
        conexion,
        ultimaConexionEn:
          conexion === 'conectado'
            ? new Date().toISOString()
            : anterior.ultimaConexionEn,
        ultimoError,
      }

      estadoRef.current = siguiente
      setEstado(siguiente)
      publicarEventoRealtime({ tipo: 'conexion', estado: siguiente })
    },
    [],
  )

  useEffect(() => {
    if (!token) {
      huboConectadoRef.current = false
      actualizarConexion('desconectado')
      return
    }

    const socket = obtenerSocketCliente(token)
    if (!socket) return

    const alConectar = () => {
      const eraReconexion = huboConectadoRef.current
      huboConectadoRef.current = true
      actualizarConexion('conectado')

      if (eraReconexion) {
        publicarEventoRealtime({ tipo: 'reconexion' })
      }
    }

    const alDesconectar = (motivo: string) => {
      actualizarConexion(
        motivo === 'io client disconnect' ? 'desconectado' : 'reconectando',
      )
    }

    const alFallar = (error: Error) => {
      const codigo = codigoErrorSocket(error)

      if (esErrorAutenticacionSocket(error)) {
        actualizarConexion('desconectado', codigo)
        logout()
        return
      }

      actualizarConexion('reconectando', codigo)
    }

    const alReintentar = () => actualizarConexion('reconectando')

    const alRecibirNotificacion = (payload: unknown) => {
      publicarEventoRealtime({ tipo: 'notificacion', payload })
    }

    const alRecibirLeida = (payload: unknown) => {
      publicarEventoRealtime({ tipo: 'notificacion:leida', payload })
    }

    socket.on('connect', alConectar)
    socket.on('disconnect', alDesconectar)
    socket.on('connect_error', alFallar)
    socket.io.on('reconnect_attempt', alReintentar)
    socket.on('notificacion', alRecibirNotificacion)
    socket.on('notificacion:leida', alRecibirLeida)

    actualizarConexion(socket.connected ? 'conectado' : 'conectando')
    if (socket.connected) huboConectadoRef.current = true
    if (!socket.connected) socket.connect()

    return () => {
      socket.off('connect', alConectar)
      socket.off('disconnect', alDesconectar)
      socket.off('connect_error', alFallar)
      socket.io.off('reconnect_attempt', alReintentar)
      socket.off('notificacion', alRecibirNotificacion)
      socket.off('notificacion:leida', alRecibirLeida)
      huboConectadoRef.current = false
      desconectarSocketCliente()
    }
  }, [actualizarConexion, logout, token])

  useEffect(
    () => () => {
      limpiarBusRealtime()
    },
    [],
  )

  const valor = useMemo(
    () => ({
      estado,
      suscribir: suscribirEventoRealtime,
    }),
    [estado],
  )

  return (
    <RealtimeContext.Provider value={valor}>
      {children}
    </RealtimeContext.Provider>
  )
}
