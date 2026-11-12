// Una calificación aprobada, tal como se muestra en el inicio (GET /calificaciones/recientes)
export interface CalificacionPublica {
  id: number
  nombre: string
  puntaje: number
  comentario: string
  fecha: string
}