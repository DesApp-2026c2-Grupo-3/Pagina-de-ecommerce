import type { ReactNode } from 'react'

import { RealtimeContext } from '../context/realtime/RealtimeContext'
import type { OyenteRealtime } from '../realtime/realtimeBus'
import type { EstadoRealtime, EventoRealtime } from '../types/realtime.types'

// Bus en memoria para los tests: permite emitir eventos como si llegaran del socket
export function crearRealtimeDePrueba(estado: EstadoRealtime = 'conectado') {
  const oyentes = new Set<OyenteRealtime>()

  const valor = {
    estado,
    suscribir: (oyente: OyenteRealtime) => {
      oyentes.add(oyente)
      return () => {
        oyentes.delete(oyente)
      }
    },
  }

  const emitir = (evento: EventoRealtime) => {
    for (const oyente of [...oyentes]) oyente(evento)
  }

  function Proveedor({ children, estado: otroEstado }: { children: ReactNode; estado?: EstadoRealtime }) {
    return (
      <RealtimeContext.Provider value={{ ...valor, estado: otroEstado ?? valor.estado }}>
        {children}
      </RealtimeContext.Provider>
    )
  }

  return { Proveedor, emitir }
}
