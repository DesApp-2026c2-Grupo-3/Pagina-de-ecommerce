import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { obtenerSucursales } from '../services/sucursalService'
import type { Sucursal } from '../types/sucursal.types'

// Sucursales activas para el filtro "Sucursal" de los reportes.
// Solo el MASTER ve ese filtro, y GET /admin/sucursales es exclusivo del MASTER (esMasterJwt):
// el admin de sucursal no lo pide (antes recibía un 403 "Acceso no autorizado").
// Sus reportes ya vienen filtrados por su sucursal desde el backend.
export function useSucursalesReporte() {
  const { administrador } = useAuth()
  const esMaster = administrador?.rol === 'MASTER'

  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [cargandoSucursales, setCargandoSucursales] = useState(esMaster)
  const [errorSucursales, setErrorSucursales] = useState('')

  useEffect(() => {
    if (!esMaster) {
      setSucursales([])
      setErrorSucursales('')
      setCargandoSucursales(false)
      return
    }

    let vigente = true
    setCargandoSucursales(true)
    setErrorSucursales('')

    obtenerSucursales()
      .then((resultado) => {
        if (vigente) setSucursales(resultado.filter((sucursal) => sucursal.activa))
      })
      .catch((err: unknown) => {
        if (!vigente) return
        setErrorSucursales(
          err instanceof Error ? err.message : 'No se pudieron cargar las sucursales.',
        )
      })
      .finally(() => {
        if (vigente) setCargandoSucursales(false)
      })

    return () => {
      vigente = false
    }
  }, [esMaster])

  return { sucursales, cargandoSucursales, errorSucursales }
}
