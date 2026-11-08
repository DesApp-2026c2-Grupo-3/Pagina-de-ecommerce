// Sesión del administrador logueado en el panel.
export interface AdministradorSesion {
  id: number
  nombre: string
  email: string
  rol: 'MASTER' | 'ADMIN' | 'EMPLEADO' // ADMIN = encargado de sucursal
  sucursalId: number | null // null para el MASTER
  sucursal: { id: number; nombre: string } | null
}
