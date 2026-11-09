const FECHA = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatearFecha(valor: string): string {
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? '' : FECHA.format(fecha)
}

export function formatearImporte(valor: number): string {
  return valor.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatearCantidad(valor: number): string {
  return valor.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
}

export function formatearContador(valor: number): string {
  if (valor > 99) return '99+'
  return String(Math.max(0, valor))
}
