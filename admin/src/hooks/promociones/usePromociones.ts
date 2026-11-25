import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import {
  deshabilitarPromocion,
  eliminarPromocion as eliminarPromocionAPI,
  habilitarPromocion,
  obtenerPromociones,
} from '../../services/promocionService'
import type { PromocionAdmin } from '../../types/promocion.types'

// Carga y acciones de Promociones, movidas tal cual desde la página. El error de carga va al recuadro
// de la lista; los de las acciones, al aviso (por ejemplo, el día ya tiene el máximo de promos activas).
export function usePromociones() {
  const { mostrarToast } = useToast()
  const [promociones, setPromociones] = useState<PromocionAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      setPromociones(await obtenerPromociones())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las promociones.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function cambiarEstado(promo: PromocionAdmin) {
    try {
      if (promo.activo) {
        await deshabilitarPromocion(promo.id)
        mostrarToast('Promoción deshabilitada')
      } else {
        await habilitarPromocion(promo.id)
        mostrarToast('Promoción habilitada')
      }
      await cargar()
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : 'No se pudo cambiar el estado de la promoción')
    }
  }

  async function eliminar(promo: PromocionAdmin) {
    try {
      await eliminarPromocionAPI(promo.id)
      mostrarToast('Promoción eliminada!')
      await cargar()
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : 'No se pudo eliminar la promoción')
    }
  }

  return { promociones, cargando, error, cambiarEstado, eliminar }
}
