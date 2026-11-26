import { useSyncExternalStore } from 'react'

const INTERVALO = 30_000

// Un solo reloj para toda la app: avanza cada 30 segundos mientras alguien lo usa
let ahora = Date.now()
const oyentes = new Set<() => void>()
let temporizador: ReturnType<typeof setInterval> | null = null

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  if (!temporizador) {
    ahora = Date.now()
    temporizador = setInterval(() => {
      ahora = Date.now()
      for (const avisar of oyentes) avisar()
    }, INTERVALO)
  }

  return () => {
    oyentes.delete(oyente)
    if (oyentes.size === 0 && temporizador) {
      clearInterval(temporizador)
      temporizador = null
    }
  }
}

const leer = () => ahora

// Hora actual para textos como «hace 3 min», sin llamar a Date.now() durante el render
export function useAhora(): number {
  return useSyncExternalStore(suscribir, leer)
}
