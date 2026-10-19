import {
  DIAS_SEMANA,
  ZONA_HORARIA_POR_DEFECTO,
  type DiaSemana,
  type HorarioDia,
  type HorarioSemana,
} from '../types/sucursal'

// Etiquetas para mostrar (el backend usa claves sin acentos)
export const ETIQUETA_DIA: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

const ETIQUETA_DIA_CORTA: Record<DiaSemana, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
  domingo: 'Dom',
}

// Zonas de Argentina para el selector; la primera es la que usa el formulario por defecto
export const ZONAS_HORARIAS = [
  ZONA_HORARIA_POR_DEFECTO,
  'America/Argentina/Cordoba',
  'America/Argentina/Mendoza',
  'America/Argentina/Salta',
  'America/Argentina/San_Juan',
  'America/Argentina/San_Luis',
  'America/Argentina/Tucuman',
  'America/Argentina/Catamarca',
  'America/Argentina/Jujuy',
  'America/Argentina/La_Rioja',
  'America/Argentina/Rio_Gallegos',
  'America/Argentina/Ushuaia',
]

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export function esHoraValida(valor: string) {
  return HORA_REGEX.test(valor)
}

// ¿La zona es un identificador IANA válido? Intl lanza RangeError si no lo es
export function esZonaHorariaValida(zona: string) {
  if (typeof zona !== 'string' || !zona.trim()) return false
  try {
    new Intl.DateTimeFormat('es-AR', { timeZone: zona.trim() })
    return true
  } catch {
    return false
  }
}

// Un horario completo nuevo (objeto nuevo en cada llamada: nunca se comparte)
export function horarioPorDefecto(): HorarioSemana {
  return Object.fromEntries(
    DIAS_SEMANA.map((dia) => [dia, { apertura: '09:00', cierre: '23:00', abierto: true }]),
  ) as HorarioSemana
}

// Normaliza lo que venga del backend a un horario completo.
// Acepta objetos parciales o días corruptos; lo que no sirve cae al valor por defecto.
export function normalizarHorario(valor: unknown): HorarioSemana {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return horarioPorDefecto()

  const objeto = valor as Record<string, unknown>
  const horario = horarioPorDefecto()
  for (const dia of DIAS_SEMANA) {
    const config = objeto[dia]
    if (!config || typeof config !== 'object' || Array.isArray(config)) continue

    const { apertura, cierre, abierto } = config as Record<string, unknown>
    const diaNormalizado = horario[dia]
    if (typeof apertura === 'string' && esHoraValida(apertura)) diaNormalizado.apertura = apertura
    if (typeof cierre === 'string' && esHoraValida(cierre)) diaNormalizado.cierre = cierre
    if (typeof abierto === 'boolean') diaNormalizado.abierto = abierto
  }
  return horario
}

// Copia el horario de un día al resto de la semana (objetos nuevos, sin compartir referencias)
export function aplicarDiaATodos(horario: HorarioSemana, dia: DiaSemana): HorarioSemana {
  const base = { ...horario[dia] }
  return Object.fromEntries(DIAS_SEMANA.map((d) => [d, { ...base }])) as HorarioSemana
}

function mismoHorario(a: HorarioDia, b: HorarioDia) {
  return a.abierto === b.abierto && a.apertura === b.apertura && a.cierre === b.cierre
}

// Texto compacto, agrupando días seguidos con el mismo horario.
// El horario viejo (texto) se muestra tal cual; un valor que no sirve devuelve "—".
export function formatearHorario(valor: unknown): string {
  if (typeof valor === 'string') return valor.trim() || '—'
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return '—'

  const objeto = valor as Record<string, unknown>
  if (!DIAS_SEMANA.some((dia) => dia in objeto)) return '—'

  const horario = normalizarHorario(objeto)
  const grupos: { desde: DiaSemana; hasta: DiaSemana; config: HorarioDia }[] = []
  for (const dia of DIAS_SEMANA) {
    const config = horario[dia]
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && mismoHorario(ultimo.config, config)) {
      ultimo.hasta = dia
    } else {
      grupos.push({ desde: dia, hasta: dia, config })
    }
  }

  return grupos
    .map(({ desde, hasta, config }) => {
      const dias = desde === hasta ? ETIQUETA_DIA_CORTA[desde] : `${ETIQUETA_DIA_CORTA[desde]} a ${ETIQUETA_DIA_CORTA[hasta]}`
      return config.abierto ? `${dias} ${config.apertura}–${config.cierre}` : `${dias} cerrado`
    })
    .join(' · ')
}

// Opciones del selector: las curadas, más la zona actual si no está en la lista
// (para no perder una zona cargada desde afuera del panel)
export function opcionesZonaHoraria(zonaActual: string) {
  const actual = (zonaActual ?? '').trim()
  if (actual && !ZONAS_HORARIAS.includes(actual)) return [...ZONAS_HORARIAS, actual]
  return [...ZONAS_HORARIAS]
}

export function validarHorario(horario: HorarioSemana): string {
  for (const dia of DIAS_SEMANA) {
    const config = horario[dia]
    if (!config) return `Completá el horario del ${ETIQUETA_DIA[dia].toLowerCase()}.`
    if (!esHoraValida(config.apertura)) {
      return `La apertura del ${ETIQUETA_DIA[dia].toLowerCase()} debe tener formato HH:MM.`
    }
    if (!esHoraValida(config.cierre)) {
      return `El cierre del ${ETIQUETA_DIA[dia].toLowerCase()} debe tener formato HH:MM.`
    }
  }
  return ''
}

export function validarZonaHoraria(zona: string): string {
  return esZonaHorariaValida(zona) ? '' : 'Elegí una zona horaria válida.'
}
