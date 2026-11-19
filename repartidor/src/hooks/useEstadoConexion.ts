import { useEffect, useState, useSyncExternalStore } from 'react'

import { useRealtime } from '../context/realtime/RealtimeContext'
import type { EstadoRealtime } from '../types/realtime.types'
import type { EstadoConexion, FranjaConexion } from '../types/conexion.types'

export const DEMORA_FRANJA_MS = 3000
export const DURACION_VOLVIO_MS = 2000

function suscribirRed(avisar: () => void) {
  window.addEventListener('online', avisar)
  window.addEventListener('offline', avisar)
  return () => {
    window.removeEventListener('online', avisar)
    window.removeEventListener('offline', avisar)
  }
}

const hayRed = () => navigator.onLine

// Sin red, el navegador manda: el socket no puede estar conectado
function calcularEstado(enLineaNavegador: boolean, realtime: EstadoRealtime): EstadoConexion {
  if (!enLineaNavegador) return 'sin_red'
  if (realtime === 'conectado') return 'en_linea'
  if (realtime === 'reconectando') return 'reconectando'
  return 'conectando'
}

export function useEstadoConexion(): { estado: EstadoConexion; franja: FranjaConexion } {
  const { estado: realtime } = useRealtime()
  const enLineaNavegador = useSyncExternalStore(suscribirRed, hayRed)
  const estado = calcularEstado(enLineaNavegador, realtime)

  // true mientras la franja tiene que verse. Solo cambia en los temporizadores:
  // tras 3 s sin conexión se enciende; tras 2 s de vuelta en línea se apaga.
  // Un corte más corto que 3 s no llega a encenderla (el temporizador se cancela).
  const [avisoActivo, setAvisoActivo] = useState(false)

  useEffect(() => {
    const enLinea = estado === 'en_linea'
    const temporizador = setTimeout(
      () => setAvisoActivo(!enLinea),
      enLinea ? DURACION_VOLVIO_MS : DEMORA_FRANJA_MS,
    )
    return () => clearTimeout(temporizador)
  }, [estado])

  let franja: FranjaConexion = 'oculta'
  if (avisoActivo) {
    if (estado === 'en_linea') franja = 'volvio'
    else if (estado === 'sin_red') franja = 'sin_red'
    else franja = 'reconectando'
  }

  return { estado, franja }
}
