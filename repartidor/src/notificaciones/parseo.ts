type Registro = Record<string, unknown>

export function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function numeroPositivo(valor: unknown): number | null {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

export function numeroNoNegativo(valor: unknown): number | null {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero >= 0 ? numero : null
}

export function fechaIso(valor: unknown): string | null {
  if (typeof valor !== 'string') return null

  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString()
}
