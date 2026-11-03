// Icono y color de fondo de cada categoría, por nombre (como vienen del backend)
export type IconoCategoria =
  | 'hamburguesa'
  | 'combo'
  | 'papas'
  | 'nuggets'
  | 'aro'
  | 'bebida'
  | 'postre'
  | 'ensalada'
  | 'sinTacc'
  | 'desayuno'
  | 'cafe'
  | 'comboCafe'
  | 'sandwich'
  | 'torta'
  | 'salsa'
  | 'generico'

interface EstiloCategoria {
  icono: IconoCategoria
  fondo: string
}

const ESTILOS: Record<string, EstiloCategoria> = {
  hamburguesa: { icono: 'hamburguesa', fondo: 'bg-brand-mustard' },
  hamburguesas: { icono: 'hamburguesa', fondo: 'bg-brand-mustard' },
  combos: { icono: 'combo', fondo: 'bg-brand-red' },
  'combos de cafeteria': { icono: 'comboCafe', fondo: 'bg-brand-mustard' },
  'papas fritas': { icono: 'papas', fondo: 'bg-brand-mustard' },
  nuggets: { icono: 'nuggets', fondo: 'bg-brand-sand' },
  aro: { icono: 'aro', fondo: 'bg-brand-sand' },
  bebidas: { icono: 'bebida', fondo: 'bg-brand-red' },
  postres: { icono: 'postre', fondo: 'bg-brand-mustard' },
  ensaladas: { icono: 'ensalada', fondo: 'bg-brand-sand' },
  'sin tacc': { icono: 'sinTacc', fondo: 'bg-brand-red' },
  'desayunos y meriendas': { icono: 'desayuno', fondo: 'bg-brand-mustard' },
  // "Café" son las bebidas calientes (taza) y "Menú Café" las comidas (medialuna)
  // "Cafetería" junta a las dos en el Home
  cafeteria: { icono: 'desayuno', fondo: 'bg-brand-mustard' },
  'cafe': { icono: 'desayuno', fondo: 'bg-brand-sand' },
  'menu cafe': { icono: 'cafe', fondo: 'bg-brand-mustard' },
  'sandwich': { icono: 'sandwich', fondo: 'bg-brand-sand' },
  'torta': { icono: 'torta', fondo: 'bg-brand-sand' },
  salsas: { icono: 'salsa', fondo: 'bg-brand-red' },
}

const POR_DEFECTO: EstiloCategoria = { icono: 'generico', fondo: 'bg-brand-sand' }

// "Menú Café" → "menu cafe"
function normalizar(nombre: string) {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

// Categorías que van siempre al final del menú (nombre normalizado). El resto conserva el orden con que llega del backend.
const AL_FINAL = ['salsas']

export function ordenarCategorias<T extends { nombre: string }>(categorias: T[]): T[] {
  const lugar = (c: T) => AL_FINAL.indexOf(normalizar(c.nombre)) + 1 // 0 = no va al final
  return [...categorias].sort((a, b) => lugar(a) - lugar(b))
}

export function estiloCategoria(nombre: string): EstiloCategoria {
  return ESTILOS[normalizar(nombre)] ?? POR_DEFECTO
}

// Colores de fondo que puede elegir el master para una tarjeta o una sección (los de la marca)
export const FONDOS: Record<string, string> = {
  mostaza: 'bg-brand-mustard',
  rojo: 'bg-brand-red',
  arena: 'bg-brand-sand',
}

const ICONOS_VALIDOS: Record<IconoCategoria, true> = {
  hamburguesa: true, combo: true, papas: true, nuggets: true, aro: true, bebida: true, postre: true, ensalada: true,
  sinTacc: true, desayuno: true, cafe: true, comboCafe: true, sandwich: true, torta: true, salsa: true, generico: true,
}

interface CategoriaConEstilo {
  nombre: string
  icono?: string | null
  fondo?: string | null
}

/**
 * Ícono y color de una categoría (o de una sección del menú): lo que eligió el master y,
 * si no eligió, lo que corresponde a su nombre.
 */
export function estiloDeCategoria(categoria: CategoriaConEstilo): EstiloCategoria {
  const porNombre = estiloCategoria(categoria.nombre)
  return {
    icono: categoria.icono && categoria.icono in ICONOS_VALIDOS ? (categoria.icono as IconoCategoria) : porNombre.icono,
    fondo: (categoria.fondo && FONDOS[categoria.fondo]) || porNombre.fondo,
  }
}
