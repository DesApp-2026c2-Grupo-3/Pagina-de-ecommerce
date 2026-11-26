import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { obtenerCategorias } from '../../services/categoriaService'
import { obtenerProductos } from '../../services/productoService'
import {
  deshabilitarPromocion,
  eliminarPromocion as eliminarPromocionAPI,
  guardarProductoNuevo,
  habilitarPromocion,
  obtenerProductoNuevo,
  obtenerPromociones,
} from '../../services/promocionService'
import type { FilaPromocion } from '../../types/promocion.types'
import { filaNuevoEnLaCarta } from '../../utils/promociones/nuevoEnLaCarta'

// Carga y acciones de Promociones, movidas tal cual desde la página. El error de carga va al recuadro
// de la lista; los de las acciones, al aviso (por ejemplo, el día ya tiene el máximo de promos activas).
// Suma la fila «Nuevo en la carta» (PR #78): se saca de la página, no se habilita ni se elimina.
export function usePromociones() {
  const { mostrarToast } = useToast()
  const [promociones, setPromociones] = useState<FilaPromocion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      const [lista, nuevo, productos, categorias] = await Promise.all([
        obtenerPromociones(),
        obtenerProductoNuevo(),
        obtenerProductos(),
        obtenerCategorias(),
      ])
      const fila = filaNuevoEnLaCarta(
        nuevo?.productoId ?? null,
        Array.isArray(productos) ? productos : [],
        Array.isArray(categorias) ? categorias : [],
      )
      setPromociones(fila ? [...lista, fila] : lista)
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

  async function cambiarEstado(promo: FilaPromocion) {
    try {
      if (promo.tipo === 'NUEVO') {
        await guardarProductoNuevo(null)
        mostrarToast('Se sacó «Nuevo en la carta» de la página')
      } else if (promo.activo) {
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

  async function eliminar(promo: FilaPromocion) {
    if (promo.tipo === 'NUEVO') return
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
