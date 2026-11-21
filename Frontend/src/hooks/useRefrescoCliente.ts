import { useEffect, useRef } from 'react'
import { useRealtime } from '../context/realtime/RealtimeContext'
import type { DominioRefrescoCliente, RefrescoCliente } from '../types/realtime.types'
import { useValorActual } from './useValorActual'

const ESPERA_MS = 300
const MAX_EVENTOS_RECORDADOS = 100

// Llama a `alRefrescar` cuando llega un `cliente:refresco` del dominio (y, si se indica, que
// cumpla `coincide`), al reconectar o al volver a la pestaña. Descarta eventos repetidos y agrupa
// los que llegan juntos en una sola recarga (plan, C-6). Mismo patrón que useRefrescoRepartidor.
export function useRefrescoCliente(
  dominio: DominioRefrescoCliente,
  alRefrescar: () => void,
  coincide?: (refresco: RefrescoCliente) => boolean,
) {
  const { suscribir } = useRealtime()
  const alRefrescarRef = useValorActual(alRefrescar)
  const coincideRef = useValorActual(coincide)
  const vistos = useRef(new Set<string>())

  useEffect(() => {
    let espera: ReturnType<typeof setTimeout> | null = null

    const programar = () => {
      if (espera) clearTimeout(espera)
      espera = setTimeout(() => {
        espera = null
        alRefrescarRef.current()
      }, ESPERA_MS)
    }

    const desuscribir = suscribir((evento) => {
      if (evento.tipo === 'reconexion' || evento.tipo === 'visible') {
        programar()
        return
      }

      if (evento.tipo !== 'cliente:refresco') return
      const { refresco } = evento
      if (refresco.dominio !== dominio) return
      if (coincideRef.current && !coincideRef.current(refresco)) return
      if (vistos.current.has(refresco.eventoId)) return

      vistos.current.add(refresco.eventoId)
      if (vistos.current.size > MAX_EVENTOS_RECORDADOS) {
        const masViejo = vistos.current.values().next().value
        if (masViejo !== undefined) vistos.current.delete(masViejo)
      }

      programar()
    })

    return () => {
      if (espera) clearTimeout(espera)
      desuscribir()
    }
  }, [alRefrescarRef, coincideRef, dominio, suscribir])
}
