import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../AuthContext'
import { obtenerSucursales } from '../../services/sucursalService'
import type { SucursalOpcion } from '../../types/pedido.types'
import { guardarSucursal, leerSucursalGuardada } from '../../utils/sucursalGuardada'
import { SucursalMasterContext } from './SucursalMasterContext'

// Sucursal que el MASTER está mirando, compartida entre Pedidos y Viajes y recordada en la pestaña.
// También guarda la lista de sucursales: al volver a una sección no se pide de nuevo ni «salta».
// El admin de sucursal no la usa: siempre ve la suya.
export function SucursalMasterProvider({ children }: { children: ReactNode }) {
  const { administrador } = useAuth()
  const adminId = administrador?.id ?? null
  const esMaster = administrador?.rol === 'MASTER'

  // Se lee antes del primer render: la primera carga ya pide la sucursal correcta
  const [guardada, setGuardada] = useState<number | null>(() => leerSucursalGuardada(adminId))
  const [sucursales, setSucursales] = useState<SucursalOpcion[] | null>(null)
  const [errorSucursales, setErrorSucursales] = useState('')

  // Otro administrador en la misma pestaña: se reinicia en el render (no en un efecto)
  const [adminMostrado, setAdminMostrado] = useState(adminId)
  if (adminMostrado !== adminId) {
    setAdminMostrado(adminId)
    setGuardada(leerSucursalGuardada(adminId))
    setSucursales(null)
    setErrorSucursales('')
  }

  useEffect(() => {
    if (!esMaster) return
    let vigente = true
    obtenerSucursales()
      .then((lista: SucursalOpcion[]) => {
        if (vigente) setSucursales(lista)
      })
      .catch(() => {
        if (!vigente) return
        setSucursales([])
        setErrorSucursales('No se pudieron cargar las sucursales')
      })
    return () => {
      vigente = false
    }
  }, [esMaster, adminId])

  const guardar = useCallback(
    (sucursalId: number) => {
      setGuardada(sucursalId)
      guardarSucursal(adminId, sucursalId)
    },
    [adminId],
  )

  const valor = useMemo(
    () => ({ sucursales, errorSucursales, guardada, guardar }),
    [sucursales, errorSucursales, guardada, guardar],
  )

  return <SucursalMasterContext.Provider value={valor}>{children}</SucursalMasterContext.Provider>
}
