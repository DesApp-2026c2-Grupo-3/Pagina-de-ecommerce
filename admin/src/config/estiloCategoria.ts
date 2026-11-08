import type { IconoCategoria } from '../components/inicio/IconoCategoriaSvg'

// Ícono y color de las tarjetas del Home. Es lo mismo que decide el sitio (Frontend/src/config/categorias.ts):
// lo que eligió el master y, si no eligió, lo que corresponde al nombre de la categoría.

export const ICONOS: { valor: IconoCategoria; etiqueta: string }[] = [
  { valor: 'hamburguesa', etiqueta: 'Hamburguesa' },
  { valor: 'combo', etiqueta: 'Combo' },
  { valor: 'papas', etiqueta: 'Papas' },
  { valor: 'nuggets', etiqueta: 'Nuggets' },
  { valor: 'aro', etiqueta: 'Aros' },
  { valor: 'bebida', etiqueta: 'Bebida' },
  { valor: 'postre', etiqueta: 'Postre' },
  { valor: 'ensalada', etiqueta: 'Ensalada' },
  { valor: 'sinTacc', etiqueta: 'Sin TACC' },
  { valor: 'desayuno', etiqueta: 'Taza' },
  { valor: 'cafe', etiqueta: 'Medialuna' },
  { valor: 'comboCafe', etiqueta: 'Combo de cafetería' },
  { valor: 'sandwich', etiqueta: 'Sandwich' },
  { valor: 'torta', etiqueta: 'Torta' },
  { valor: 'salsa', etiqueta: 'Salsa' },
  { valor: 'generico', etiqueta: 'Genérico' },
]

export const FONDOS: { valor: string; etiqueta: string; color: string }[] = [
  { valor: 'mostaza', etiqueta: 'Mostaza', color: '#ffb81c' },
  { valor: 'rojo', etiqueta: 'Rojo', color: '#e4002b' },
  { valor: 'arena', etiqueta: 'Arena', color: '#f3e3c7' },
]

interface Estilo {
  icono: IconoCategoria
  fondo: string
}

// Por nombre ("Menú Café" → "menu cafe")
const POR_NOMBRE: Record<string, Estilo> = {
  hamburguesa: { icono: 'hamburguesa', fondo: 'mostaza' },
  hamburguesas: { icono: 'hamburguesa', fondo: 'mostaza' },
  combos: { icono: 'combo', fondo: 'rojo' },
  'combos de cafeteria': { icono: 'comboCafe', fondo: 'mostaza' },
  'papas fritas': { icono: 'papas', fondo: 'mostaza' },
  nuggets: { icono: 'nuggets', fondo: 'arena' },
  bebidas: { icono: 'bebida', fondo: 'rojo' },
  postres: { icono: 'postre', fondo: 'mostaza' },
  ensaladas: { icono: 'ensalada', fondo: 'arena' },
  'sin tacc': { icono: 'sinTacc', fondo: 'rojo' },
  'desayunos y meriendas': { icono: 'desayuno', fondo: 'mostaza' },
  cafeteria: { icono: 'desayuno', fondo: 'mostaza' },
  cafe: { icono: 'desayuno', fondo: 'arena' },
  aro: { icono: 'aro', fondo: 'arena' },
  sandwich: { icono: 'sandwich', fondo: 'arena' },
  torta: { icono: 'torta', fondo: 'arena' },
  'menu cafe': { icono: 'cafe', fondo: 'mostaza' },
  salsas: { icono: 'salsa', fondo: 'rojo' },
}

const POR_DEFECTO: Estilo = { icono: 'generico', fondo: 'arena' }

const normalizar = (nombre: string) =>
  nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

export const estiloPorNombre = (nombre: string): Estilo => POR_NOMBRE[normalizar(nombre)] ?? POR_DEFECTO

const iconosValidos = new Set<string>(ICONOS.map((i) => i.valor))

/** Ícono y color con los que se ve una tarjeta: lo elegido, o lo que corresponde al nombre */
export function estiloDeTarjeta(nombre: string, icono: string | null, fondo: string | null): Estilo {
  const base = estiloPorNombre(nombre)
  return {
    icono: icono && iconosValidos.has(icono) ? (icono as IconoCategoria) : base.icono,
    fondo: fondo && FONDOS.some((f) => f.valor === fondo) ? fondo : base.fondo,
  }
}

export const colorDeFondo = (fondo: string) => FONDOS.find((f) => f.valor === fondo)?.color ?? '#f3e3c7'
