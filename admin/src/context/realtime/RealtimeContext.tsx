import { createContext, useContext } from 'react'
import type { EstadoRealtime } from '../../types/realtime.types'
import type { OyenteRealtime } from '../../realtime/realtimeBus'

export interface RealtimeContextValue {
  estado: EstadoRealtime
  suscribir: (oyente: OyenteRealtime) => () => void
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function useRealtime() {
  const contexto = useContext(RealtimeContext)

  if (!contexto) {
    throw new Error('useRealtime debe usarse dentro de RealtimeProvider')
  }

  return contexto
}
