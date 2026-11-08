// Calificaciones de los clientes, como las devuelve /admin/calificaciones.
// Cada una es de UN producto de un pedido: estrellas y/o comentario (puede venir sin estrellas, nunca vacía).

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
  /** Calificaciones de productos (con estrellas o solo con comentario) */
  total: number
  /** De esas, las que tienen estrellas: solo ellas promedian y reparten la distribución */
  conPuntaje: number
  /** Entre 1 y 5, con decimales (por ejemplo 3.6). null si todavía no hay calificaciones */
  promedio: number | null
  conComentario: number
  /** Cuántas calificaciones hay de cada puntaje */
  distribucion: Record<1 | 2 | 3 | 4 | 5, number>
  porSucursal: PromedioDe[]
  /** Hasta 50 productos con estrellas, de los más calificados a los menos */
  porProducto: PromedioDe[]
  /** De la semana más vieja a la más nueva; `semana` es el lunes (AAAA-MM-DD) */
  porSemana: { semana: string; total: number; promedio: number | null }[]
}

export interface CalificacionAdmin {
  id: number
  /** null si el cliente solo dejó un comentario sobre ese producto */
  puntaje: number | null
  comentario: string | null
  fecha: string
  cliente: { nombre: string; apellido: string | null }
  pedido: { id: number; total: number | null; fecha: string }
  sucursal: { id: number | null; nombre: string }
  producto: { id: number; nombre: string }
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
