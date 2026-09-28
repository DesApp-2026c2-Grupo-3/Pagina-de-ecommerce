// Formatea una fecha como DD/MM/AA (ej: 20/05/95), en hora de Argentina.
export function formatearFecha(valor: string | Date | null | undefined): string {
  if (!valor) return ''

  // Fechas sin hora ("1995-05-20", o guardadas a medianoche UTC):
  // se toman tal cual, para que la zona horaria no las corra un día
  if (typeof valor === 'string') {
    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})(T00:00:00(\.000)?Z)?$/.exec(valor)
    if (soloFecha) {
      const [, anio, mes, dia] = soloFecha
      return `${dia}/${mes}/${anio.slice(2)}`
    }
  }

  const fecha = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''

  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

// Formatea fecha y hora como DD/MM/AA HH:mm (ej: 27/09/26 20:21), en hora de Argentina.
export function formatearFechaHora(valor: string | Date | null | undefined): string {
  if (!valor) return ''

  const fecha = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''

  return fecha
    .toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires',
    })
    .replace(',', '')
}