import { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import {
  deshabilitarCategoria,
  eliminarCategoria as eliminarCategoriaAPI,
  habilitarCategoria,
  obtenerCategorias,
} from '../../services/categoriaService'
import type { CategoriaAdmin } from '../../types/categoria.types'

// Carga y acciones de Categorías, movidas tal cual desde la página (plan v2, D-C4:
// los errores siguen yendo solo a la consola). Los avisos de éxito son los de siempre.
export function useCategorias() {
  const { mostrarToast } = useToast()
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    obtenerCategorias()
      .then((datos: CategoriaAdmin[]) => {
        if (vigente) setCategorias(datos)
      })
      .catch((error: unknown) => {
        console.error('Error al cargar categorías:', error)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  async function cambiarEstado(categoria: CategoriaAdmin) {
    try {
      if (categoria.activo) {
        await deshabilitarCategoria(categoria.id)
        mostrarToast('Categoría deshabilitada correctamente')
      } else {
        await habilitarCategoria(categoria.id)
        mostrarToast('Categoría habilitada correctamente')
      }
      const datos: CategoriaAdmin[] = await obtenerCategorias()
      setCategorias(datos)
    } catch (error) {
      console.error('Error al cambiar el estado de la categoría:', error)
    }
  }

  async function eliminar(id: number) {
    try {
      await eliminarCategoriaAPI(id)
      setCategorias((prev) => prev.filter((c) => c.id !== id))
      mostrarToast('Categoria eliminada!')
    } catch (error) {
      console.error('Error al eliminar categoria:', error)
    }
  }

  return { categorias, cargando, cambiarEstado, eliminar }
}
