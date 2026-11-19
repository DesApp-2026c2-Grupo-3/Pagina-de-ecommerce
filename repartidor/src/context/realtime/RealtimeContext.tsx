import { createContext, useContext } from 'react'
import type { OyenteRealtime } from '../../realtime/realtimeBus'
import type { EstadoRealtime } from '../../types/realtime.types'

export interface RealtimeContextType {
  estado: EstadoRealtime
  // Cambia de identidad con cada sesión: así los suscriptores se vuelven a anotar
  // después de cerrarSesion(), que limpia el bus
  suscribir: (oyente: OyenteRealtime) => () => void
}

export const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function useRealtime() {
  const contexto = useContext(RealtimeContext)

  if (!contexto) {
    throw new Error('useRealtime debe usarse dentro de RealtimeProvider')
  }

  return contexto
}
