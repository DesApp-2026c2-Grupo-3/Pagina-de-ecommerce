import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../AuthContext'
import {
  limpiarBusRealtime,
  publicarEventoRealtime,
  suscribirEventoRealtime,
} from '../../realtime/realtimeBus'
import {
  desconectarSocketAdmin,
  obtenerSocketAdmin,
} from '../../realtime/socketClient'
import { normalizarEventoRefresco } from '../../realtime/realtimeEvents'
import { RealtimeContext } from './RealtimeContext'
import type {
  EstadoConexionRealtime,
  EstadoRealtime,
} from '../../types/realtime.types'

interface ErrorSocket extends Error {
  data?: { code?: string }
}

const ESTADO_INICIAL: EstadoRealtime = {
  conexion: 'desconectado',
  ultimaConexionEn: null,
  ultimoError: null,
}

function esErrorAuth(codigo: string) {
  return (
    codigo === 'AUTH_REQUIRED' ||
    codigo === 'AUTH_INVALID' ||
    codigo === 'AUTH_EXPIRED'
  )
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { token, cerrarSesion } = useAuth()
  const [estado, setEstado] = useState<EstadoRealtime>(ESTADO_INICIAL)
  const estadoRef = useRef<EstadoRealtime>(ESTADO_INICIAL)
  const huboConectadoRef = useRef(false)

  const actualizarConexion = useCallback(
    (conexion: EstadoConexionRealtime, ultimoError: string | null = null) => {
      const anterior = estadoRef.current
      const siguiente: EstadoRealtime = {
        conexion,
        ultimaConexionEn: conexion === 'conectado'
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

    const socket = obtenerSocketAdmin(token)
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
      const codigo = (error as ErrorSocket).data?.code ?? error.message

      if (esErrorAuth(codigo)) {
        actualizarConexion('desconectado', codigo)
        cerrarSesion()
        return
      }

      actualizarConexion('reconectando', error.message)
    }

    const alReintentar = () => actualizarConexion('reconectando')

    const alRecibirNotificacion = (payload: unknown) => {
      publicarEventoRealtime({ tipo: 'notificacion', payload })
    }

    const alRecibirLeida = (payload: unknown) => {
      publicarEventoRealtime({ tipo: 'notificacion:leida', payload })
    }

    const alRecibirRefresco = (payload: unknown) => {
      const evento = normalizarEventoRefresco(payload)
      if (!evento) return

      publicarEventoRealtime({ tipo: 'admin:refresco', payload: evento })
    }

    socket.on('connect', alConectar)
    socket.on('disconnect', alDesconectar)
    socket.on('connect_error', alFallar)
    socket.io.on('reconnect_attempt', alReintentar)
    socket.on('notificacion', alRecibirNotificacion)
    socket.on('notificacion:leida', alRecibirLeida)
    socket.on('admin:refresco', alRecibirRefresco)

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
      socket.off('admin:refresco', alRecibirRefresco)
      huboConectadoRef.current = false
      desconectarSocketAdmin()
    }
  }, [actualizarConexion, cerrarSesion, token])

  useEffect(() => () => {
    limpiarBusRealtime()
  }, [])

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
