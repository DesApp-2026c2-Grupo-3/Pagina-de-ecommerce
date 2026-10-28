// Cómo se organiza el menú del cliente.
// Es solo presentación: en la base (y en el admin) las categorías siguen siendo las mismas, y las
// subcategorías ("Carne vacuna", "Pastelería"...) no existen en la base: se arman acá, por nombre.
// Ojo: no fusionar categorías en la base. Los combos eligen sus opciones por categoría
// ("Acompañamiento" sale de Papas Fritas, "Una bebida" de Bebidas).
// Cuando el backend tenga subcategorías propias, alcanza con reemplazar este archivo.

export interface SubgrupoCatalogo {
  slug: string
  /** Texto del botón y título de la sección */
  nombre: string
  /** Categoría del backend de la que toma el ícono y el color del título */
  estilo: string
  /** Categorías del backend cuyos productos entran (se comparan sin tildes ni mayúsculas) */
  categorias?: string[]
  /** Productos que entran por nombre, vengan de la categoría que vengan (gana sobre `categorias`) */
  productos?: string[]
}

export interface GrupoCatalogo {
  id: number
  slug: string
  nombre: string
  /** Categorías del backend que entran en el grupo */
  categorias: string[]
  /** Botones de subcategoría que se muestran arriba del grupo */
  subgrupos?: SubgrupoCatalogo[]
  /** Subgrupo donde caen los productos de `categorias` que ningún subgrupo reclama (productos nuevos del admin) */
  subgrupoPorDefecto?: string
  /** true = "Todo" se muestra dividido en secciones (una por subgrupo), sin paginación */
  porSecciones: boolean
}

export const GRUPOS_CATALOGO: GrupoCatalogo[] = [
  // El orden del array es el orden de los botones ("Todos" va siempre primero)
  {
    id: 2,
    slug: 'combos',
    nombre: 'Combos',
    categorias: ['Combos'],
    subgrupos: [
      { slug: 'combo-carne-vacuna', nombre: 'Carne de Res', estilo: 'Combos', categorias: ['Hamburguesas', 'Hamburguesa'] },
      { slug: 'combo-pollo', nombre: 'Carne de Pollo  ', estilo: 'Combos', productos: ['Combo Crispy Crack', 'Combo Crispy Ranch'] },
      { slug: 'combo-veggie', nombre: 'Veggie', estilo: 'Combos', productos: ['Combo Seed Vicious'] },
    ],
    subgrupoPorDefecto: 'carne-vacuna',
    porSecciones: false,
  },
  {
    id: 1,
    slug: 'hamburguesas',
    nombre: 'Hamburguesas',
    categorias: ['Hamburguesas', 'Hamburguesa'],
    subgrupos: [
      { slug: 'carne-vacuna', nombre: 'Carne de Res', estilo: 'Hamburguesas', categorias: ['Hamburguesas', 'Hamburguesa'] },
      { slug: 'pollo', nombre: 'Carne de Pollo', estilo: 'Hamburguesas', productos: ['Crispy Crack', 'Crispy Ranch'] },
      { slug: 'veggie', nombre: 'Veggie', estilo: 'Hamburguesas', productos: ['Seed Vicious'] },
    ],
    subgrupoPorDefecto: 'carne-vacuna',
    porSecciones: false,
  },
  {
    id: 3,
    slug: 'para-acompanar',
    nombre: 'Para acompañar',
    categorias: ['Papas Fritas', 'Nuggets', 'Ensaladas'],
    subgrupos: [
      { slug: 'papas-fritas', nombre: 'Papas', estilo: 'Papas Fritas', categorias: ['Papas Fritas'] },
      { slug: 'nuggets', nombre: 'Nuggets', estilo: 'Nuggets', categorias: ['Nuggets'] },
      { slug: 'ensaladas', nombre: 'Ensaladas', estilo: 'Ensaladas', categorias: ['Ensaladas'] },
       {
        slug: 'otros',
        nombre: 'Otros',
        estilo: 'Nuggets',
        // El Cheddar Fundido es una salsa en la base, pero acá se vende como pileta para mojar
        productos: ['Palitos de Muzzarela', 'Aros de Cebolla x8', 'Cheddar Fundido'],
      },
    ],
    subgrupoPorDefecto: 'papas-fritas',
    porSecciones: true,
  },
  {
    id: 5,
    slug: 'bebidas',
    nombre: 'Bebidas',
    categorias: ['Bebidas'],
     subgrupos: [
      {
        slug: 'gaseosas',
        nombre: 'Gaseosas',
        estilo: 'bebida',
        productos: ['Coca Cola', 'Sprite', 'Fanta'],
      },
      {
        slug: 'agua',
        nombre: 'Agua',
        estilo: 'bebida',
        productos: ['Agua Mineral'],
      },
    ],
    subgrupoPorDefecto: 'gaseosas',
    porSecciones: false,
  },
  {
    id: 4,
    slug: 'cafeteria',
    nombre: 'Cafetería',
    categorias: ['Café', 'Menú Café'],
    subgrupos: [
      { slug: 'bebidas-calientes', nombre: 'Cafés', estilo: 'Café', categorias: ['Café'] },
      {
        slug: 'clasicos',
        nombre: 'Clásicos',
        estilo: 'Menú Café',
        productos: ['Medialunas x2', 'Tostadas con Palta'],
      },
      {
        slug: 'sandwiches',
        nombre: 'Sandwiches',
        estilo: 'sandwich',
        productos: ['Tostado de Jamón y Queso', 'Desayuno Americano'],
      },
      {
        slug: 'pasteleria',
        nombre: 'Dulces',
        estilo: 'Torta',
        // Brownie y Cheesecake son de la categoría Postres: se muestran acá y también en Postres → Tortas
        productos: ['Hot Cakes', 'Muffin de Arándanos', 'Brownie con Helado', 'Cheesecake de Frutos Rojos', 'Donas Glaseadas x3'],
      },
    ],
    subgrupoPorDefecto: 'clasicos',
    porSecciones: true,
  },
  {
    id: 6,
    slug: 'postres',
    nombre: 'Postres',
    categorias: ['Postres'],
    subgrupos: [
      {
        slug: 'helados',
        nombre: 'Helados',
        estilo: 'Postres',
        productos: ['Helado Crunch', 'Helado Sundae', 'Batido de Vainilla'],
      },
      {
        slug: 'tortas',
        nombre: 'Tortas',
        estilo: 'torta',
        productos: ['Brownie con Helado', 'Cheesecake de Frutos Rojos'],
      },
    ],
    subgrupoPorDefecto: 'tortas',
    porSecciones: true,
  },
]

/** Categorías que no se muestran en el menú: se ofrecen en otro lado (las salsas, en el carrito) */
export const CATEGORIAS_OCULTAS = ['Salsas']

/** El catálogo arranca en Combos */
export const GRUPO_INICIAL = 2

// "Menú Café" → "menu cafe"
export function normalizarNombre(nombre: string) {
  return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

const igual = (a: string, b: string) => normalizarNombre(a) === normalizarNombre(b)

export function esCategoriaOculta(nombreCategoria: string) {
  return CATEGORIAS_OCULTAS.some((c) => igual(c, nombreCategoria))
}

// Productos nombrados a mano en algún subgrupo: se ven en el menú aunque su categoría esté oculta
const NOMBRADOS = GRUPOS_CATALOGO.flatMap((g) => g.subgrupos ?? []).flatMap((s) => s.productos ?? [])

/** Si un producto se muestra en el menú (y en la búsqueda) */
export function visibleEnMenu(nombreProducto: string, nombreCategoria: string) {
  return !esCategoriaOculta(nombreCategoria) || NOMBRADOS.some((n) => igual(n, nombreProducto))
}

/** Grupo al que pertenece una categoría del backend (por nombre), si pertenece a alguno */
export function grupoDeCategoria(nombreCategoria: string): GrupoCatalogo | undefined {
  return GRUPOS_CATALOGO.find((g) => g.categorias.some((c) => igual(c, nombreCategoria)))
}

/** Subgrupo que reúne a toda una categoría (ej: "Nuggets" → el botón Nuggets), si hay uno */
export function subgrupoDeCategoria(grupo: GrupoCatalogo, nombreCategoria: string): SubgrupoCatalogo | undefined {
  return grupo.subgrupos?.find((s) => s.categorias?.some((c) => igual(c, nombreCategoria)))
}

/**
 * Dónde cae un producto dentro de un grupo:
 * - `pertenece`: si el producto se muestra en ese grupo.
 * - `subgrupo`: el botón en el que aparece (si el grupo tiene subgrupos).
 * Primero manda el nombre del producto, después su categoría, y por último el subgrupo por defecto.
 */
export function ubicarEnGrupo(
  grupo: GrupoCatalogo,
  nombreProducto: string,
  nombreCategoria: string,
): { pertenece: boolean; subgrupo?: SubgrupoCatalogo } {
  const subgrupos = grupo.subgrupos
  const enCategoria = grupo.categorias.some((c) => igual(c, nombreCategoria))
  if (!subgrupos) return { pertenece: enCategoria }

  const porNombre = subgrupos.find((s) => s.productos?.some((n) => igual(n, nombreProducto)))
  if (porNombre) return { pertenece: true, subgrupo: porNombre }

  const porCategoria = subgrupos.find((s) => s.categorias?.some((c) => igual(c, nombreCategoria)))
  if (porCategoria) return { pertenece: true, subgrupo: porCategoria }

  if (enCategoria) return { pertenece: true, subgrupo: subgrupos.find((s) => s.slug === grupo.subgrupoPorDefecto) }
  return { pertenece: false }
}
