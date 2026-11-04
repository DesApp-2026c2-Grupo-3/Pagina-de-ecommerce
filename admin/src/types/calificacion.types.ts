// Calificaciones de los clientes, como las devuelve /admin/calificaciones

export interface FiltrosCalificaciones {
  sucursalId?: string
  productoId?: string
  puntaje?: string
  conComentario?: boolean
  desde?: string // AAAA-MM-DD
  hasta?: string // AAAA-MM-DD
}

export interface PromedioDe {
  id: number | null
  nombre: string
  total: number
  promedio: number | null
}

export interface ResumenCalificaciones {
  total: number
  /** Entre 1 y 5, con decimales (por ejemplo 3.6). null si todavía no hay calificaciones */
  promedio: number | null
  conComentario: number
  /** Cuántas calificaciones hay de cada puntaje */
  distribucion: Record<1 | 2 | 3 | 4 | 5, number>
  porSucursal: PromedioDe[]
  porProducto: PromedioDe[]
  /** De la semana más vieja a la más nueva; `semana` es el lunes (AAAA-MM-DD) */
  porSemana: { semana: string; total: number; promedio: number | null }[]
}

export interface CalificacionAdmin {
  id: number
  puntaje: number
  comentario: string | null
  fecha: string
  cliente: { nombre: string; apellido: string | null }
  pedido: { id: number; total: number | null; fecha: string }
  sucursal: { id: number | null; nombre: string }
  productos: string[]
}

export interface ListadoCalificaciones {
  total: number
  pagina: number
  limite: number
  calificaciones: CalificacionAdmin[]
}

export interface OpcionesFiltros {
  sucursales: { id: number; nombre: string }[]
  productos: { id: number; nombre: string }[]
}
