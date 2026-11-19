type Registro = Record<string, unknown>

export function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function numeroPositivo(valor: unknown): number | null {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

export function numero(valor: unknown): number | null {
  const resultado = Number(valor)
  return Number.isFinite(resultado) ? resultado : null
}

export function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor : null
}

export function fechaIso(valor: unknown): string | null {
  if (typeof valor !== 'string' && !(valor instanceof Date)) return null

  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString()
}
