import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Pantallas del master (productos, promociones, categorías, insumos, sucursales, administradores)
export function SoloMaster() {
  const { administrador } = useAuth()
  return administrador?.rol === 'MASTER' ? <Outlet /> : <Navigate to="/admin" replace />
}

// Pantallas de gestión (reportes, calificaciones, administradores): master y encargado.
// El empleado solo trabaja con pedidos, así que va directo a ellos.
export function SoloGestion() {
  const { administrador } = useAuth()
  const permitido = administrador?.rol === 'MASTER' || administrador?.rol === 'ADMIN'
  return permitido ? <Outlet /> : <Navigate to="/admin/pedidos" replace />
}

// Pantallas del personal de una sucursal (partes): encargado y empleado.
export function SoloPersonalDeSucursal() {
  const { administrador } = useAuth()
  const permitido = administrador?.rol === 'ADMIN' || administrador?.rol === 'EMPLEADO'
  return permitido ? <Outlet /> : <Navigate to="/admin" replace />
}

// Pantallas de una sucursal (/admin/sucursales/:id/...): el master entra a cualquiera,
// el encargado solo a la suya
export function SoloSuSucursal() {
  const { administrador } = useAuth()
  const { id } = useParams()
  const esMaster = administrador?.rol === 'MASTER'
  const esEncargadoConSucursal = administrador?.rol === 'ADMIN' && Boolean(administrador?.sucursalId)

  // Con :id en la URL el encargado solo entra a su sucursal; sin :id alcanza con tener una asignada.
  // El empleado no entra nunca: trabaja con pedidos y partes.
  const permitido =
    esMaster || (esEncargadoConSucursal && (!id || Number(id) === administrador?.sucursalId))
  return permitido ? <Outlet /> : <Navigate to="/admin" replace />
}
