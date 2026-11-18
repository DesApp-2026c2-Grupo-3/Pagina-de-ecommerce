import { useSyncExternalStore } from 'react'

// Mismo corte que `md:` de Tailwind (48rem = 768 px)
const CONSULTA = '(max-width: 47.99rem)'

function suscribir(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA)
  consulta.addEventListener('change', avisar)
  return () => consulta.removeEventListener('change', avisar)
}

const esChica = () => window.matchMedia(CONSULTA).matches

// true en el celular: la bandeja se abre como hoja inferior en lugar de panel
export function useEsPantallaChica(): boolean {
  return useSyncExternalStore(suscribir, esChica)
}
