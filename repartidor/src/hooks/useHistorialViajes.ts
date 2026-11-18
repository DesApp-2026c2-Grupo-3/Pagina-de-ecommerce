import { useEffect, useState } from 'react'

import { obtenerHistorialViajes } from '../services/viajeService'
import type { ViajeHistorial } from '../types/viaje.types'

// Viajes terminados o cancelados del repartidor. Los cambios de estado viven en los callbacks
// de la promesa, nunca en el mismo paso del efecto (mismo patrón que los demás hooks de datos).
export function useHistorialViajes() {
  const [viajes, setViajes] = useState<ViajeHistorial[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerHistorialViajes()
      .then((datos) => {
        setViajes(datos)
        setError('')
      })
      .catch(() => setError('No se pudo cargar el historial de viajes.'))
      .finally(() => setCargando(false))
  }, [])

  return { viajes, cargando, error }
}
