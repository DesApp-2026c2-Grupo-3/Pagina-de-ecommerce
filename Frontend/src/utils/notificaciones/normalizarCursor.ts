const LONGITUD_MAXIMA_CURSOR = 500

export function normalizarCursor(valor: unknown): string | null {
  if (typeof valor !== 'string') return null

  const cursor = valor.trim()

  if (
    !cursor ||
    cursor === 'null' ||
    cursor === 'undefined' ||
    cursor.length > LONGITUD_MAXIMA_CURSOR
  ) {
    return null
  }

  return cursor
}
