import { useCallback, useEffect, useRef, useState } from 'react'
import { obtenerViajesPorSucursal } from '../../services/viajeService'
import type { Viaje } from '../../types/viaje.types'
import { detectarNovedades, type NovedadesViajes } from '../../utils/viajes/novedadesViajes'

// Viajes de una sucursal (GET /admin/viajes/sucursal/:id, sin cambios en el backend).
// La carga inicial no resalta nada; cada recarga avisa qué viajes llegaron o piden asistencia.
// Contadores de solicitudes: una respuesta vieja (otra sucursal, recargas solapadas) se descarta.
export function useViajesSucursal(
  sucursalId: number | null,
  onNovedades?: (novedades: NovedadesViajes) => void,
) {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [cargando, setCargando] = useState(sucursalId !== null)
  const [errorCarga, setErrorCarga] = useState('')
  const solicitudRef = useRef(0)
  const recargaRef = useRef(0)
  const sucursalRef = useRef(sucursalId)
  // Última lista recibida, para comparar sin efectos dentro de un setState
  const viajesRef = useRef<Viaje[]>([])
  const novedadesRef = useRef(onNovedades)
  useEffect(() => {
    novedadesRef.current = onNovedades
  }, [onNovedades])

  // Cambio de sucursal: se reinicia en el mismo render (no en un efecto)
  const [sucursalMostrada, setSucursalMostrada] = useState(sucursalId)
  if (sucursalMostrada !== sucursalId) {
    setSucursalMostrada(sucursalId)
    setViajes([])
    setErrorCarga('')
    setCargando(sucursalId !== null)
  }

  useEffect(() => {
    sucursalRef.current = sucursalId
    viajesRef.current = []
    const solicitud = ++solicitudRef.current
    recargaRef.current += 1
    if (sucursalId === null) return

    obtenerViajesPorSucursal(sucursalId)
      .then((lista) => {
        if (solicitud !== solicitudRef.current) return
        viajesRef.current = lista
        setViajes(lista)
      })
      .catch((error) => {
        if (solicitud !== solicitudRef.current) return
        setErrorCarga(error instanceof Error ? error.message : 'Error al cargar los viajes')
      })
      .finally(() => {
        if (solicitud === solicitudRef.current) setCargando(false)
      })
  }, [sucursalId])

  // Refresco en vivo o después de reasignar: sin spinner, para no perder la posición
  const recargar = useCallback(async () => {
    const objetivo = sucursalRef.current
    if (objetivo === null) return
    const recarga = ++recargaRef.current
    try {
      const lista = await obtenerViajesPorSucursal(objetivo)
      if (recarga !== recargaRef.current || sucursalRef.current !== objetivo) return
      const previos = viajesRef.current
      viajesRef.current = lista
      setViajes(lista)
      setErrorCarga('')
      const novedades = detectarNovedades(previos, lista)
      if (novedades.nuevos.length > 0 || novedades.asistencias.length > 0) novedadesRef.current?.(novedades)
    } catch (error) {
      if (recarga !== recargaRef.current) return
      setErrorCarga(error instanceof Error ? error.message : 'Error al actualizar los viajes')
    }
  }, [])

  return { viajes, cargando, errorCarga, recargar }
}
