import { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import {
  darDeBajaRepartidor,
  desactivarRepartidor,
  obtenerRepartidores,
  reactivarRepartidor,
} from '../../services/repartidorService'
import type { Repartidor } from '../../types/repartidor.types'

// Lista de repartidores y sus acciones, con la misma lógica que tenía la página.
// El backend decide el alcance: el admin de sucursal recibe solo los de su sucursal (RN-35).
export function useRepartidores() {
  const { mostrarToast } = useToast()
  const [repartidores, setRepartidores] = useState<Repartidor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    obtenerRepartidores()
      .then((lista) => {
        if (vigente) setRepartidores(lista)
      })
      .catch((err) => {
        console.error('Error al cargar repartidores:', err)
        if (vigente) setError('No se pudieron cargar los repartidores.')
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  function cambiarActivo(id: number, activo: boolean) {
    setRepartidores((previos) => previos.map((r) => (r.id === id ? { ...r, activo } : r)))
  }

  // Suspensión reversible (RN-52)
  async function desactivar(r: Repartidor) {
    try {
      await desactivarRepartidor(r.id)
      cambiarActivo(r.id, false)
      mostrarToast('Repartidor desactivado correctamente')
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : 'No se pudo desactivar el repartidor')
    }
  }

  async function reactivar(r: Repartidor) {
    try {
      await reactivarRepartidor(r.id)
      cambiarActivo(r.id, true)
      mostrarToast('Repartidor reactivado correctamente')
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : 'No se pudo reactivar el repartidor')
    }
  }

  // Baja definitiva y lógica (RN-52): sale de la lista; sus viajes se conservan
  async function darDeBaja(r: Repartidor) {
    try {
      await darDeBajaRepartidor(r.id)
      setRepartidores((previos) => previos.filter((x) => x.id !== r.id))
      mostrarToast('Repartidor dado de baja correctamente')
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : 'No se pudo dar de baja el repartidor')
    }
  }

  return { repartidores, cargando, error, desactivar, reactivar, darDeBaja }
}
