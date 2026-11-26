import { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import {
  eliminarAdministrador as eliminarAdministradorAPI,
  obtenerAdministradores,
  reactivarAdmin,
} from '../../services/administradorService'
import type { AdministradorFila } from '../../types/administrador.types'

// Carga, desactivar (baja lógica) y reactivar, movidos tal cual desde la página de Administradores.
// El error de carga va a la consola y los de las acciones al aviso, como hoy.
export function useAdministradores() {
  const { mostrarToast } = useToast()
  const [administradores, setAdministradores] = useState<AdministradorFila[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    ;(obtenerAdministradores() as Promise<AdministradorFila[]>)
      .then((lista) => {
        if (vigente) setAdministradores(lista)
      })
      .catch((error: unknown) => console.error('Error al cargar administradores:', error))
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  async function desactivar(admin: AdministradorFila) {
    try {
      await eliminarAdministradorAPI(admin.id)
      setAdministradores((prev) => prev.map((a) => (a.id === admin.id ? { ...a, activo: false } : a)))
      mostrarToast('Administrador desactivado correctamente')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'No se pudo desactivar el administrador')
    }
  }

  async function reactivar(admin: AdministradorFila) {
    try {
      await reactivarAdmin(admin.id)
      setAdministradores((prev) => prev.map((a) => (a.id === admin.id ? { ...a, activo: true } : a)))
      mostrarToast('Administrador reactivado correctamente')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'No se pudo reactivar el administrador')
    }
  }

  return { administradores, cargando, desactivar, reactivar }
}
