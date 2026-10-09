// Icono y color de fondo de cada categoría, por nombre (como vienen del backend)
export type IconoCategoria =
  | 'hamburguesa'
  | 'combo'
  | 'papas'
  | 'nuggets'
  | 'bebida'
  | 'postre'
  | 'ensalada'
  | 'sinTacc'
  | 'desayuno'
  | 'cafe'
  | 'salsa'
  | 'generico'

interface EstiloCategoria {
  icono: IconoCategoria
  fondo: string
}

const ESTILOS: Record<string, EstiloCategoria> = {
  hamburguesa: { icono: 'hamburguesa', fondo: 'bg-brand-mustard' },
  combos: { icono: 'combo', fondo: 'bg-brand-red' },
  'papas fritas': { icono: 'papas', fondo: 'bg-brand-mustard' },
  nuggets: { icono: 'nuggets', fondo: 'bg-brand-sand' },
  bebidas: { icono: 'bebida', fondo: 'bg-brand-red' },
  postres: { icono: 'postre', fondo: 'bg-brand-mustard' },
  ensaladas: { icono: 'ensalada', fondo: 'bg-brand-sand' },
  'sin tacc': { icono: 'sinTacc', fondo: 'bg-brand-red' },
  'desayunos y meriendas': { icono: 'desayuno', fondo: 'bg-brand-mustard' },
  'menu cafe': { icono: 'cafe', fondo: 'bg-brand-sand' },
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

export function estiloCategoria(nombre: string): EstiloCategoria {
  return ESTILOS[normalizar(nombre)] ?? POR_DEFECTO
}