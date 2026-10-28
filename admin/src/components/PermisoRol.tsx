import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Pantallas del master (productos, categorías, insumos, sucursales, administradores)
export function SoloMaster() {
  const { administrador } = useAuth()
  return administrador?.rol === 'MASTER' ? <Outlet /> : <Navigate to="/admin" replace />
}

// Pantallas de gestión (reportes, administradores): master y encargado.
// El empleado solo trabaja con pedidos, así que va directo a ellos.
export function SoloGestion() {
  const { administrador } = useAuth()
  const permitido = administrador?.rol === 'MASTER' || administrador?.rol === 'ADMIN'
  return permitido ? <Outlet /> : <Navigate to="/admin/pedidos" replace />
}

// Pantallas de una sucursal (/admin/sucursales/:id/...): el master entra a cualquiera,
// el admin de sucursal solo a la suya
export function SoloSuSucursal() {
  const { administrador } = useAuth()
  const { id } = useParams()
  const permitido =
    administrador?.rol === 'MASTER' ||
    (administrador?.rol === 'ADMIN' && Number(id) === administrador.sucursalId)
  return permitido ? <Outlet /> : <Navigate to="/admin" replace />
}
