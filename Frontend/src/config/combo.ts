// Qué categorías participan del armado del combo.
// Ej: para ofrecer nuggets como acompañamiento: acompanamientos: ['Papas Fritas', 'Nuggets']
export const COMBO = {
  categoriasArmables: ['Hamburguesa'],
  acompanamientos: ['Papas Fritas'],
  bebidas: ['Bebidas'],
}

export const TAMANIOS = [
  { valor: 'regular', etiqueta: 'Regular' },
  { valor: 'mediano', etiqueta: 'Mediano' },
  { valor: 'grande', etiqueta: 'Grande' },
] as const

export type Tamanio = (typeof TAMANIOS)[number]['valor']

export const SABORES = [
  { valor: 'cola', etiqueta: 'Cola' },
  { valor: 'naranja', etiqueta: 'Naranja' },
  { valor: 'lima', etiqueta: 'Lima' },
  { valor: 'agua', etiqueta: 'Agua' },
]

// Ej: etiquetaTamanio('regular', '354 ml') → "Regular · 354 ml"
export function etiquetaTamanio(tamanio?: string | null, etiqueta?: string | null) {
  const nombre = TAMANIOS.find((t) => t.valor === tamanio)?.etiqueta ?? ''
  return [nombre, etiqueta].filter(Boolean).join(' · ')
}

// Ordena las variantes como en TAMANIOS: regular, mediano, grande
export function ordenarVariantes<T extends { tamanio: string }>(variantes: T[] = []) {
  const orden: string[] = TAMANIOS.map((t) => t.valor)
  return [...variantes].sort((a, b) => orden.indexOf(a.tamanio) - orden.indexOf(b.tamanio))
}