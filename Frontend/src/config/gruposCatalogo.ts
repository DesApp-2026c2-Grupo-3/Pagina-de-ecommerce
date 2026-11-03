// Cómo se organiza el menú del cliente.
// Es solo presentación: en la base las categorías siguen siendo las mismas (los combos eligen sus opciones
// por categoría: "Acompañamiento" sale de Papas Fritas, "Una bebida" de Bebidas).
//
// El menú lo arma el master desde el panel (GET /menu) y config/menuDinamico.ts lo convierte a esta forma.
// Lo que está acá abajo (GRUPOS_CATALOGO) es el menú de RESPALDO: es el mismo que carga la semilla
// 20261102120000-menu-inicial y se usa solo si el backend no responde.

export interface SubgrupoCatalogo {
  slug: string
  /** Texto del botón y título de la sección */
  nombre: string
  /** Categoría (o clave de estilo) de la que toma el ícono y el color del título */
  estilo: string
  /** Ícono y color elegidos por el master (si están, mandan sobre `estilo`) */
  icono?: string
  fondo?: string
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
      { slug: 'combo-carne-vacuna', nombre: 'Carne de Res', estilo: 'Combos', categorias: ['Combos', 'Combo'] },
      { slug: 'combo-pollo', nombre: 'Carne de Pollo', estilo: 'Combos', productos: ['Combo Crispy Crack', 'Combo Crispy Ranch'] },
      { slug: 'combo-veggie', nombre: 'Veggie', estilo: 'Combos', productos: ['Combo Seed Vicious'] },
    ],
    subgrupoPorDefecto: 'combo-carne-vacuna',
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
        estilo: 'aro',
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
        estilo: 'Bebidas',
        productos: ['Coca Cola', 'Sprite', 'Fanta'],
      },
      {
        slug: 'agua',
        nombre: 'Agua',
        estilo: 'Bebidas',
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
    // "Cafetería" es la categoría principal; Café y Menú Café, sus hijas
    categorias: ['Cafetería', 'Café', 'Menú Café'],
    subgrupos: [
      { slug: 'cafes', nombre: 'Cafés', estilo: 'Café', categorias: ['Café'] },
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
        slug: 'dulces',
        nombre: 'Dulces',
        estilo: 'Torta',
        // Brownie y Cheesecake son de la categoría Postres: se muestran acá y también en Postres → Tortas
        productos: ['Hot Cakes de Miel y Manteca', 'Hot Cakes de Dulce de Leche', 'Muffin de Arándanos', 'Brownie con Helado', 'Cheesecake de Frutos Rojos', 'Donas Glaseadas x3'],
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
        productos: ['Helado Crunch', 'Sundae de Chocolate', 'Sundae de Frutilla', 'Batido de Vainilla'],
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
  {
    // Siempre al final: son un agregado (Mayonesa, Ketchup...), con tope por pedido
    id: 7,
    slug: 'salsas',
    nombre: 'Salsas',
    categorias: ['Salsas'],
    porSecciones: false,
  },
]

/** El catálogo arranca en Combos */
export const GRUPO_INICIAL_SLUG = 'combos'

// "Menú Café" → "menu cafe"
export function normalizarNombre(nombre: string) {
  return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

const igual = (a: string, b: string) => normalizarNombre(a) === normalizarNombre(b)

/** Grupo al que pertenece una categoría del backend (por nombre), si pertenece a alguno */
export function grupoDeCategoria(nombreCategoria: string, grupos: GrupoCatalogo[] = GRUPOS_CATALOGO): GrupoCatalogo | undefined {
  return grupos.find((g) => g.categorias.some((c) => igual(c, nombreCategoria)))
}

/** Subgrupo que reúne a toda una categoría (ej: "Nuggets" → el botón Nuggets), si hay uno */
export function subgrupoDeCategoria(grupo: GrupoCatalogo, nombreCategoria: string): SubgrupoCatalogo | undefined {
  return grupo.subgrupos?.find((s) => s.categorias?.some((c) => igual(c, nombreCategoria)))
}

/**
 * Subcategoría que se abre al llegar desde la tarjeta de una categoría del Home.
 * Solo si el grupo reúne varias categorías (Para acompañar: Papas, Nuggets, Ensaladas) se abre la sección
 * de esa categoría. Si el grupo ES esa categoría (Combos, Hamburguesas) se abre entero, en "Todo": sus secciones
 * son una división interna (carne, pollo, veggie) y abrir solo una mostraría una parte.
 * `categoriasExistentes`: nombres de las categorías que hay en el catálogo (ignora alias que no existen).
 */
export function seccionAlAbrirCategoria(
  grupo: GrupoCatalogo,
  nombreCategoria: string,
  categoriasExistentes: string[],
): SubgrupoCatalogo | undefined {
  const delGrupo = grupo.categorias.filter((c) => categoriasExistentes.some((e) => igual(e, c)))
  if (delGrupo.length <= 1) return undefined
  return subgrupoDeCategoria(grupo, nombreCategoria)
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
