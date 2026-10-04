// Cuántas unidades de más se pueden pedir de un ingrediente agregable (ej: hasta 3 fetas extra)
export const EXTRA_MAX_INCREMENTO = 3

export const TAMANIOS = [
  { valor: 'regular', etiqueta: 'Regular' },
  { valor: 'mediano', etiqueta: 'Mediano' },
  { valor: 'grande', etiqueta: 'Grande' },
] as const

export type Tamanio = (typeof TAMANIOS)[number]['valor']

// Ej: etiquetaTamanio('regular', '354 ml') → "Regular · 354 ml"
export function etiquetaTamanio(tamanio?: string | null, etiqueta?: string | null) {
  const nombre = TAMANIOS.find((t) => t.valor === tamanio)?.etiqueta ?? ''
  return [nombre, etiqueta].filter(Boolean).join(' · ')
}

// Ordena los tamaños como en TAMANIOS: regular, mediano, grande
export function ordenarTamanios<T extends { tamanio: string }>(tamanios: T[] = []) {
  const orden: string[] = TAMANIOS.map((t) => t.valor)
  return [...tamanios].sort((a, b) => orden.indexOf(a.tamanio) - orden.indexOf(b.tamanio))
}
