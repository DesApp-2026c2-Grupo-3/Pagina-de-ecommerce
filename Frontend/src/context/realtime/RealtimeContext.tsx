import { createContext, useContext } from 'react'
import type { EstadoRealtimeCliente } from '../../types/realtime.types'
import type { OyenteRealtimeCliente } from '../../realtime/realtimeBus'

export interface RealtimeContextValue {
  estado: EstadoRealtimeCliente
  suscribir: (oyente: OyenteRealtimeCliente) => () => void
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function useRealtime() {
  const contexto = useContext(RealtimeContext)

  if (!contexto) {
    throw new Error('useRealtime debe usarse dentro de RealtimeProvider')
  }

  return contexto
}
