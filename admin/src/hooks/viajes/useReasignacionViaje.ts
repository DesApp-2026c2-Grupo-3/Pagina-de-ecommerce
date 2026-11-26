import { useCallback, useEffect, useState } from 'react'
import { ErrorApi } from '../../services/httpClient'
import { obtenerRepartidoresDisponibles } from '../../services/repartidorService'
import { reasignarViaje } from '../../services/viajeService'
import type { RepartidorDisponible } from '../../types/repartidor.types'
import type { RespuestaReasignacion } from '../../types/viaje.types'

// Reasignación de un viaje que pide asistencia (RN-32). Las reglas las aplica el backend:
// 400 = el viaje ya no requiere asistencia · 409 = el repartidor elegido ya tiene un viaje en curso.
export function useReasignacionViaje(
  viajeId: number,
  onHecho: (r: RespuestaReasignacion) => void,
  // 400: el viaje cambió (otro admin lo atendió o el repartidor siguió): hay que recargarlo
  onDesactualizado: () => void,
) {
  const [disponibles, setDisponibles] = useState<RepartidorDisponible[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorDisponibles, setErrorDisponibles] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true
    obtenerRepartidoresDisponibles(viajeId)
      .then((lista) => {
        if (!vigente) return
        setDisponibles(lista)
        setErrorDisponibles('')
      })
      .catch((err) => {
        if (vigente) setErrorDisponibles(err instanceof Error ? err.message : 'No se pudieron cargar los repartidores')
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [viajeId, version])

  // Volver a pedir la lista (p. ej. después de un 409): el «cargando» se pone acá, no en el efecto
  const recargarDisponibles = useCallback(() => {
    setCargando(true)
    setVersion((v) => v + 1)
  }, [])

  const reasignar = useCallback(
    async (repartidorId: number): Promise<boolean> => {
      setProcesando(true)
      setError('')
      try {
        onHecho(await reasignarViaje(viajeId, repartidorId))
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo reasignar el viaje.')
        // Otro lo tomó mientras tanto: se actualiza la lista para elegir de nuevo
        if (err instanceof ErrorApi && err.status === 409) recargarDisponibles()
        if (err instanceof ErrorApi && err.status === 400) onDesactualizado()
        return false
      } finally {
        setProcesando(false)
      }
    },
    [onDesactualizado, onHecho, recargarDisponibles, viajeId],
  )

  return { disponibles, cargando, errorDisponibles, recargarDisponibles, procesando, error, reasignar }
}
