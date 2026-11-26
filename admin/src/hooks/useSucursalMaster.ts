import { useContext, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { SucursalMasterContext } from '../context/sucursalMaster/SucursalMasterContext'
import { resolverSucursal } from '../utils/sucursalGuardada'

// Sucursal que se muestra en Pedidos y Viajes.
// · MASTER: la de la URL (enlace o aviso) > la que eligió antes en Pedidos o Viajes > la primera.
// · Admin de sucursal: siempre la suya; no hay selector (RN-35).
export function useSucursalMaster(sucursalUrl: number | null) {
  const { administrador } = useAuth()
  const contexto = useContext(SucursalMasterContext)
  if (!contexto) {
    throw new Error('useSucursalMaster debe usarse dentro de SucursalMasterProvider')
  }
  const esMaster = administrador?.rol === 'MASTER'
  const { sucursales, errorSucursales, guardada, guardar } = contexto

  // Un enlace o aviso con ?sucursal pasa a ser la sucursal recordada
  useEffect(() => {
    if (esMaster && sucursalUrl !== null && sucursalUrl !== guardada) guardar(sucursalUrl)
  }, [esMaster, guardada, guardar, sucursalUrl])

  if (!esMaster) {
    return {
      esMaster,
      sucursales: null,
      sucursalesListas: true,
      errorSucursales: '',
      sucursalId: administrador?.sucursalId ?? null,
      elegir: guardar,
    }
  }

  return {
    esMaster,
    sucursales: sucursales ?? [],
    sucursalesListas: sucursales !== null,
    errorSucursales,
    sucursalId: resolverSucursal(sucursalUrl, guardada, sucursales),
    elegir: guardar,
  }
}
