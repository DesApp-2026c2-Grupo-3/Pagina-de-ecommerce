import { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { cambiarEstadoSucursal, obtenerSucursales } from '../../services/sucursalService'
import type { Sucursal } from '../../types/sucursal.types'

// Carga y activar / desactivar, movidos tal cual desde la página de Sucursales.
// El error de carga va a la consola y el de cambiar estado al aviso, como hoy.
export function useSucursales() {
  const { mostrarToast } = useToast()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    obtenerSucursales()
      .then((lista) => {
        if (vigente) setSucursales(lista)
      })
      .catch((error: unknown) => console.error('Error al cargar sucursales:', error))
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  async function cambiarEstado(sucursal: Sucursal) {
    try {
      const respuesta = await cambiarEstadoSucursal(sucursal.id, !sucursal.activa)
      setSucursales((prev) => prev.map((s) => (s.id === sucursal.id ? respuesta.sucursal : s)))
      mostrarToast(sucursal.activa ? 'Sucursal desactivada' : 'Sucursal activada')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'No se pudo cambiar el estado')
    }
  }

  return { sucursales, cargando, cambiarEstado }
}
