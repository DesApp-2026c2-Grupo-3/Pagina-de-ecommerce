// Administrador como lo devuelve GET /admin/administradores (antes AdminFila, dentro de la página)
export interface AdministradorFila {
  id: number
  nombre: string
  email: string
  // 'MASTER' = General · 'ADMIN' = Sucursal
  rol: string
  activo: boolean
  // null para los administradores generales
  sucursal: { id: number; nombre: string } | null
}
