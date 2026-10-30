import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Pantallas del master (productos, categorías, insumos, sucursales, administradores)
export function SoloMaster() {
  const { administrador } = useAuth()
  return administrador?.rol === 'MASTER' ? <Outlet /> : <Navigate to="/admin" replace />
}

// Pantallas de una sucursal (/admin/sucursales/:id/...): el master entra a cualquiera,
// el admin de sucursal solo a la suya
export function SoloSuSucursal() {
  const { administrador } = useAuth()
  const { id } = useParams()

  const esMaster = administrador?.rol === 'MASTER'
  const esAdminConSucursal = administrador?.rol === 'ADMIN' && Boolean(administrador?.sucursalId)

  const permitido = esMaster || (id ? Number(id) === administrador?.sucursalId : esAdminConSucursal)
  
  return permitido ? <Outlet /> : <Navigate to="/admin" replace />
}
