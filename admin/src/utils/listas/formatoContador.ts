// Tope visual de los contadores de los filtros: más de 99 se muestra «99+»
export const TOPE_CONTADOR = 99

export function formatearContador(cantidad: number): string {
  return cantidad > TOPE_CONTADOR ? `${TOPE_CONTADOR}+` : String(Math.max(0, cantidad))
}
