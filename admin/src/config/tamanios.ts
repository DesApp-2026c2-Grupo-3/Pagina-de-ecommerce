// Igual que en el backend (src/utils/tamanios.js): si se cambia uno, se cambia el otro
export const TAMANIOS_AUTO: Record<number, { nombre: string; factorPrecio: number; factorStock: number }> = {
  1: { nombre: 'Regular', factorPrecio: 1, factorStock: 1 },
  2: { nombre: 'Mediano', factorPrecio: 1.2, factorStock: 1.5 },
  3: { nombre: 'Grande', factorPrecio: 1.4, factorStock: 2 },
}

// Precio de un tamaño a partir del regular (los demás, redondeados a $100)
export function precioTamanio(precioRegular: number, tamanioId: number): number {
  if (tamanioId === 1) return precioRegular
  const factor = TAMANIOS_AUTO[tamanioId]?.factorPrecio ?? 1
  return Math.round((precioRegular * factor) / 100) * 100
}