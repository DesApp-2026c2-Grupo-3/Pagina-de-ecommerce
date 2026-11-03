// Menú del catálogo como lo devuelve y recibe /admin/menu (solo Admin-Master)

export interface SeccionMenu {
  id?: number
  /** Identificador estable que usan las URLs (?sub=): no cambia al renombrar */
  slug: string
  nombre: string
  activo: boolean
  /** Ícono y color del título de la sección (null = genérico) */
  icono: string | null
  fondo: string | null
  /** Todos los productos de esta categoría entran solos en la sección */
  categoriaId: number | null
  /** Ahí caen los productos del grupo que ninguna sección reclama (productos nuevos) */
  esPorDefecto: boolean
  /** Productos puestos a mano: en su grupo, ganan sobre la categoría */
  productoIds: number[]
}

export interface GrupoMenu {
  id?: number
  /** Identificador estable: lo usan ?grupo= y los banners del Home */
  slug: string
  nombre: string
  activo: boolean
  /** true = "Todo" se muestra dividido en una sección por subcategoría */
  porSecciones: boolean
  /** Categorías cuyos productos entran en el grupo */
  categoriaIds: number[]
  secciones: SeccionMenu[]
}

export interface MenuAdmin {
  grupos: GrupoMenu[]
}

export interface ProductoMenu {
  id: number
  nombre: string
  categoriaId: number
}

export interface CategoriaMenu {
  id: number
  nombre: string
}
