import { Navigate, Outlet, useParams } from 'react-router-dom'
import type { AdministradorSesion } from '../App'

interface Props {
  administrador: AdministradorSesion | null
}

// Pantallas del master (productos, categorías, insumos, sucursales, administradores)
export function SoloMaster({ administrador }: Props) {
  return administrador?.rol === 'MASTER' ? <Outlet /> : <Navigate to="/admin" replace />
}

// Pantallas de una sucursal (/admin/sucursales/:id/...): el master entra a cualquiera,
// el admin de sucursal solo a la suya
export function SoloSuSucursal({ administrador }: Props) {
  const { id } = useParams()
  const permitido = administrador?.rol === 'MASTER' || Number(id) === administrador?.sucursalId
  return permitido ? <Outlet /> : <Navigate to="/admin" replace />
}