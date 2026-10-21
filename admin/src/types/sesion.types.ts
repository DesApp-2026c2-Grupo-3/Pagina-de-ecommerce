// Sesión del administrador logueado en el panel.
export interface AdministradorSesion {
  id: number
  nombre: string
  email: string
  rol: 'ADMIN' | 'MASTER'
  sucursalId: number | null // null para el MASTER
  sucursal: { id: number; nombre: string } | null
}
