import type { EventoRealtimeCliente } from '../types/realtime.types'

export type OyenteRealtimeCliente = (evento: EventoRealtimeCliente) => void

const oyentes = new Set<OyenteRealtimeCliente>()

export function suscribirEventoRealtime(
  oyente: OyenteRealtimeCliente,
): () => void {
  oyentes.add(oyente)

  return () => {
    oyentes.delete(oyente)
  }
}

function notificarOyente(
  oyente: OyenteRealtimeCliente,
  evento: EventoRealtimeCliente,
) {
  try {
    oyente(evento)
  } catch (error) {
    console.error('No se pudo procesar un evento en tiempo real:', error)
  }
}

export function publicarEventoRealtime(evento: EventoRealtimeCliente) {
  const oyentesActuales = [...oyentes]

  for (const oyente of oyentesActuales) {
    notificarOyente(oyente, evento)
  }
}

export function limpiarBusRealtime() {
  oyentes.clear()
}
