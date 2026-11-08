// Calificaciones de los clientes, como las devuelve /admin/calificaciones
export type EstadoCalificacion = 'PENDIENTE' | 'APROBADA' | 'OCULTA'

export interface CalificacionAdmin {
  id: number
  nombre: string
  puntaje: number
  comentario: string | null
  fecha: string
  estado: EstadoCalificacion
  sucursal: string
}