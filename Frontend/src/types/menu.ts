// El menú del catálogo como lo arma el master (GET /menu): solo ids, sin nombres de productos ni categorías

export interface MenuSeccionApi {
  id: number
  slug: string
  nombre: string
  /** Ícono y color del título de la sección (null = los de su categoría) */
  icono: string | null
  fondo: string | null
  /** Los productos de esta categoría entran solos en la sección */
  categoriaId: number | null
  /** Ahí caen los productos del grupo que ninguna sección reclama (productos nuevos) */
  esPorDefecto: boolean
  /** Productos puestos a mano: en su grupo, ganan sobre la categoría */
  productoIds: number[]
}

export interface MenuGrupoApi {
  id: number
  slug: string
  nombre: string
  /** true = "Todo" se muestra dividido en una sección por subcategoría, sin paginación */
  porSecciones: boolean
  /** Categorías cuyos productos entran en el grupo */
  categoriaIds: number[]
  secciones: MenuSeccionApi[]
}

export interface MenuApi {
  grupos: MenuGrupoApi[]
}
