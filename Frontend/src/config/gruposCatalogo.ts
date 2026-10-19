// Cómo se agrupan las categorías en el catálogo del cliente.
// Solo es presentación: en la base (y en el admin) las categorías siguen siendo las mismas.
// Ojo: no fusionar categorías en la base. Los combos eligen sus opciones por categoría
// ("Acompañamiento" sale de Papas Fritas, "Bebida" de Bebidas).

export interface SeccionCatalogo {
  /** Nombre de la categoría tal como viene del backend */
  categoria: string
  /** Título que se muestra arriba de la sección */
  titulo: string
}

export interface GrupoCatalogo {
  id: number
  slug: string
  nombre: string
  /** Categorías del backend que entran en el grupo (se comparan sin tildes ni mayúsculas) */
  secciones: SeccionCatalogo[]
  /** true = se muestra dividido en secciones, sin paginación */
  porSecciones: boolean
}

export const GRUPOS_CATALOGO: GrupoCatalogo[] = [
  // El orden del array es el orden de los botones ("Todos" va siempre primero)
  {
    id: 2,
    slug: 'combos',
    nombre: 'Combos',
    secciones: [{ categoria: 'Combos', titulo: 'Combos' }],
    porSecciones: false,
  },
  {
    id: 1,
    slug: 'hamburguesas',
    nombre: 'Hamburguesas',
    secciones: [
      { categoria: 'Hamburguesas', titulo: 'Hamburguesas' },
      { categoria: 'Hamburguesa', titulo: 'Hamburguesas' },
    ],
    porSecciones: false,
  },
  {
    id: 3,
    slug: 'para-acompanar',
    nombre: 'Para acompañar',
    secciones: [
      { categoria: 'Papas Fritas', titulo: 'Papas' },
      { categoria: 'Nuggets', titulo: 'Nuggets' },
      { categoria: 'Bebidas', titulo: 'Bebidas' },
    ],
    porSecciones: true,
  },
  {
    id: 4,
    slug: 'cafeteria',
    nombre: 'Cafetería',
    secciones: [
      { categoria: 'Café', titulo: 'Café' },
      { categoria: 'Menú Café', titulo: 'Para comer' },
    ],
    porSecciones: true,
  },
]

/** El catálogo arranca en Combos */
export const GRUPO_INICIAL = 2

// "Menú Café" → "menu cafe"
export function normalizarNombre(nombre: string) {
  return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

/** Grupo al que pertenece una categoría del backend (por nombre), si pertenece a alguno */
export function grupoDeCategoria(nombreCategoria: string): GrupoCatalogo | undefined {
  const buscado = normalizarNombre(nombreCategoria)
  return GRUPOS_CATALOGO.find((g) => g.secciones.some((s) => normalizarNombre(s.categoria) === buscado))
}