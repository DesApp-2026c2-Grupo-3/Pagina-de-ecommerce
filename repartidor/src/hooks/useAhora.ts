import { useEffect, useState } from 'react'

const INTERVALO_MS = 30_000

// Un único reloj para toda la pantalla (D-15): las tarjetas reciben `ahora` por props
export function useAhora(): number {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), INTERVALO_MS)
    return () => clearInterval(intervalo)
  }, [])

  return ahora
}
