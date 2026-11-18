import { useEffect, useRef } from 'react'

import { useRealtime } from '../context/realtime/RealtimeContext'
import type { DominioRefresco } from '../types/realtime.types'

const ESPERA_MS = 300
const MAX_EVENTOS_RECORDADOS = 100

// Llama a `alRefrescar` cuando llega un `repartidor:refresco` del dominio, al reconectar o al
// volver la app a primer plano (W-1). Deduplica por eventoId y agrupa las ráfagas en una sola
// recarga (plan 8.4): si al volver llegan "visible" y "reconexion" juntos, se recarga una vez.
// Con varios dominios (una constante del módulo, para no volver a suscribirse en cada render),
// cualquiera de ellos dispara la misma recarga y también se agrupan (v1.7).
export function useRefrescoRepartidor(
  dominio: DominioRefresco | readonly DominioRefresco[],
  alRefrescar: () => void,
) {
  const { suscribir } = useRealtime()
  const callback = useRef(alRefrescar)
  const vistos = useRef(new Set<string>())

  useEffect(() => {
    callback.current = alRefrescar
  }, [alRefrescar])

  useEffect(() => {
    let espera: ReturnType<typeof setTimeout> | null = null

    const programar = () => {
      if (espera) clearTimeout(espera)
      espera = setTimeout(() => {
        espera = null
        callback.current()
      }, ESPERA_MS)
    }

    const desuscribir = suscribir((evento) => {
      if (evento.tipo === 'reconexion' || evento.tipo === 'visible') {
        programar()
        return
      }

      if (evento.tipo !== 'repartidor:refresco') return
      const delDominio = typeof dominio === 'string'
        ? evento.payload.dominio === dominio
        : dominio.includes(evento.payload.dominio)
      if (!delDominio) return

      const { eventoId } = evento.payload
      if (vistos.current.has(eventoId)) return

      vistos.current.add(eventoId)
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
  }, [dominio, suscribir])
}
