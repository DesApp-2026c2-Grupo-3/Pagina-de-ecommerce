import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { deshabilitarInsumo, eliminarInsumo, habilitarInsumo, obtenerInsumos } from '../../services/insumoService'
import type { Insumo } from '../../types/insumo.types'

// Carga y acciones de la lista de Insumos, movidas tal cual desde la página. Los errores van al
// recuadro del formulario, como hoy (setError lo comparte la página con useFormularioInsumo).
export function useInsumos(setError: (mensaje: string) => void) {
  const { mostrarToast } = useToast()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(() => {
    obtenerInsumos()
      .then(setInsumos)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error al obtener los insumos'))
      .finally(() => setCargando(false))
  }, [setError])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function eliminar(insumo: Insumo) {
    try {
      await eliminarInsumo(insumo.id)
      mostrarToast('Insumo eliminado!')
      cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el insumo.')
    }
  }

  async function cambiarEstado(insumo: Insumo) {
    try {
      if (insumo.activo) {
        await deshabilitarInsumo(insumo.id)
        mostrarToast('Insumo deshabilitado correctamente')
      } else {
        await habilitarInsumo(insumo.id)
        mostrarToast('Insumo habilitado correctamente')
      }
      cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del insumo.')
    }
  }

  return { insumos, cargando, cargar, eliminar, cambiarEstado }
}
