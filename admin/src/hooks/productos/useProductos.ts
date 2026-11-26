import { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { obtenerCategorias } from '../../services/categoriaService'
import {
  cambiarDisponibilidad,
  eliminarProducto as eliminarProductoAPI,
  obtenerProductos,
} from '../../services/productoService'
import type { ProductoFila } from '../../types/producto.types'

// Productos y categorías, y las acciones de la lista, con la misma lógica que tenía la página.
// Los eliminados (baja lógica, RN-16) no vienen: el backend solo devuelve los que no tienen deletedAt.
export function useProductos() {
  const { mostrarToast } = useToast()
  const [productos, setProductos] = useState<ProductoFila[]>([])
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    ;(obtenerProductos() as Promise<ProductoFila[]>)
      .then((lista) => {
        if (vigente) setProductos(lista)
      })
      .catch((error) => {
        console.error('Error al cargar productos:', error)
        if (vigente) mostrarToast('No se pudieron cargar los productos')
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    obtenerCategorias()
      .then((lista: { id: number; nombre: string }[]) => {
        if (vigente) setCategorias(lista)
      })
      .catch(() => {
        if (vigente) setCategorias([])
      })
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function eliminar(producto: ProductoFila) {
    try {
      await eliminarProductoAPI(producto.id)
      setProductos((prev) => prev.filter((p) => p.id !== producto.id))
      mostrarToast('Producto eliminado!')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'No se pudo eliminar el producto')
    }
  }

  // Inhabilitar / habilitar: el producto no se borra, solo cambia «disponible»
  async function alternarDisponibilidad(producto: ProductoFila) {
    const nuevo = !producto.disponible
    try {
      await cambiarDisponibilidad(producto.id, nuevo)
      setProductos((prev) => prev.map((p) => (p.id === producto.id ? { ...p, disponible: nuevo } : p)))
      mostrarToast(nuevo ? 'Producto habilitado!' : 'Producto inhabilitado!')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'No se pudo cambiar la disponibilidad')
    }
  }

  return { productos, categorias, cargando, eliminar, alternarDisponibilidad }
}
