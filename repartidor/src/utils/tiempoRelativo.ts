const MINUTO_MS = 60_000
const HORA_MS = 60 * MINUTO_MS

const relativo = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' })
const fechaCorta = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: 'numeric',
  month: 'short',
})
const diaCalendario = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

// Días de calendario entre dos instantes, en la hora de Argentina (0 = hoy, 1 = ayer)
function diasDeDiferencia(desde: number, hasta: number): number {
  const dia = (instante: number) => Date.parse(diaCalendario.format(instante))
  return Math.round((dia(hasta) - dia(desde)) / (24 * HORA_MS))
}

// "hace 3 minutos", "hace 2 horas", "ayer", "12 nov." (plan UX, UX-14)
export function tiempoRelativo(iso: string, ahora: number): string {
  const instante = Date.parse(iso)
  const transcurrido = Math.max(0, ahora - instante)

  if (transcurrido < MINUTO_MS) return 'recién'
  if (transcurrido < HORA_MS) return relativo.format(-Math.floor(transcurrido / MINUTO_MS), 'minute')

  const dias = diasDeDiferencia(instante, ahora)
  if (dias === 0) return relativo.format(-Math.floor(transcurrido / HORA_MS), 'hour')
  if (dias === 1) return relativo.format(-1, 'day')

  return fechaCorta.format(instante)
}
