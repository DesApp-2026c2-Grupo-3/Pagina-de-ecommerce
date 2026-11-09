import type { EventoRealtime } from '../types/realtime.types'

export type OyenteRealtime = (evento: EventoRealtime) => void

const oyentes = new Set<OyenteRealtime>()

export function suscribirEventoRealtime(oyente: OyenteRealtime): () => void {
  oyentes.add(oyente)

  return () => {
    oyentes.delete(oyente)
  }
}

export function publicarEventoRealtime(evento: EventoRealtime) {
  for (const oyente of [...oyentes]) {
    try {
      oyente(evento)
    } catch (error) {
      console.error('No se pudo procesar un evento en tiempo real:', error)
    }
  }
}

export function limpiarBusRealtime() {
  oyentes.clear()
}
