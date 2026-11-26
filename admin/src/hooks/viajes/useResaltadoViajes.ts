import { useCallback, useEffect, useRef, useState } from 'react'
import { DURACION_RESALTADO_VIAJE_MS } from '../../config/viajes'
import { textoAnuncioNovedades, type NovedadesViajes } from '../../utils/viajes/novedadesViajes'

// Viajes recién llegados: recuadro ámbar + «Nuevo» durante unos segundos (sin cola, D-V3).
// El rojo de asistencia no depende de esto: sale del estado del viaje y dura lo que dure.
export function useResaltadoViajes() {
  const [resaltados, setResaltados] = useState<number[]>([])
  const [anuncio, setAnuncio] = useState('')
  const temporizadores = useRef(new Set<number>())

  useEffect(() => {
    const activos = temporizadores.current
    return () => {
      for (const t of activos) window.clearTimeout(t)
      activos.clear()
    }
  }, [])

  const marcar = useCallback((novedades: NovedadesViajes) => {
    setAnuncio(textoAnuncioNovedades(novedades))
    const ids = novedades.nuevos
    if (ids.length === 0) return
    setResaltados((previos) => [...previos.filter((id) => !ids.includes(id)), ...ids])
    const t = window.setTimeout(() => {
      temporizadores.current.delete(t)
      setResaltados((previos) => previos.filter((id) => !ids.includes(id)))
    }, DURACION_RESALTADO_VIAJE_MS)
    temporizadores.current.add(t)
  }, [])

  return { resaltados, anuncio, marcar }
}
