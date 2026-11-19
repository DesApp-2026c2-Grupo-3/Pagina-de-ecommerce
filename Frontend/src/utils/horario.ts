import {
  DIAS_SEMANA,
  ZONA_HORARIA_POR_DEFECTO,
  type DiaSemana,
  type EstadoSucursal,
  type GrupoHorario,
  type HorarioDia,
  type HorarioSemana,
  type HorarioTurno,
  type IntervaloTurno,
} from '../types/sucursal'

const ETIQUETA_DIA_CORTA: Record<DiaSemana, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
  domingo: 'Dom',
}

const NOMBRE_DIA: Record<DiaSemana, string> = {
  lunes: 'lunes',
  martes: 'martes',
  miercoles: 'miércoles',
  jueves: 'jueves',
  viernes: 'viernes',
  sabado: 'sábado',
  domingo: 'domingo',
}

const DIAS_POR_NOMBRE_EN: Record<string, DiaSemana> = {
  Monday: 'lunes',
  Tuesday: 'martes',
  Wednesday: 'miercoles',
  Thursday: 'jueves',
  Friday: 'viernes',
  Saturday: 'sabado',
  Sunday: 'domingo',
}

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
const TURNOS_MAXIMOS = 2
const MINUTOS_POR_DIA = 24 * 60

function esHoraValida(valor: unknown): valor is string {
  return typeof valor === 'string' && HORA_REGEX.test(valor)
}

function aMinutos(hhmm: unknown) {
  const match = HORA_REGEX.exec(String(hhmm ?? ''))
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function esZonaHorariaValida(zona: string) {
  if (typeof zona !== 'string' || !zona.trim()) return false
  try {
    new Intl.DateTimeFormat('es-AR', { timeZone: zona.trim() })
    return true
  } catch {
    return false
  }
}

export function zonaHorariaDeSucursal(zona?: string | null) {
  return typeof zona === 'string' && esZonaHorariaValida(zona) ? zona.trim() : ZONA_HORARIA_POR_DEFECTO
}

function obtenerHoraLocal(fecha: Date, zonaHoraria: string) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zonaHoraria,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha)

  const dia = DIAS_POR_NOMBRE_EN[partes.find((p) => p.type === 'weekday')?.value ?? '']
  if (!dia) throw new Error('No se pudo determinar el día de la semana')

  const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? 0)
  const minuto = Number(partes.find((p) => p.type === 'minute')?.value ?? 0)

  return { dia, minutos: hora * 60 + minuto }
}

function validarTurno(turno: unknown): string | null {
  if (!turno || typeof turno !== 'object' || Array.isArray(turno)) {
    return 'el turno debe ser un objeto'
  }

  const { apertura, cierre, cruzaMedianoche } = turno as Record<string, unknown>

  if (!esHoraValida(apertura)) {
    return 'la apertura debe tener formato HH:MM (ej: "09:00")'
  }
  if (!esHoraValida(cierre)) {
    return 'el cierre debe tener formato HH:MM (ej: "23:00")'
  }
  if (typeof cruzaMedianoche !== 'boolean') {
    return 'debe indicar si cruza la medianoche'
  }

  const minutosApertura = aMinutos(apertura) as number
  const minutosCierre = aMinutos(cierre) as number

  if (minutosApertura === minutosCierre) {
    return 'el cierre no puede ser igual a la apertura'
  }

  if (cruzaMedianoche) {
    if (cierre === '00:00') {
      return 'el cierre "00:00" no puede estar marcado como cruza medianoche; usalo como fin del día'
    }
    if (minutosCierre >= minutosApertura) {
      return 'está marcado como cruza medianoche pero el cierre no es anterior a la apertura'
    }
    return null
  }

  if (minutosCierre !== 0 && minutosCierre < minutosApertura) {
    return 'el cierre es anterior a la apertura: marcá "cruzaMedianoche" o corregí el horario'
  }

  return null
}

function validarDia(dia: DiaSemana, config: unknown): string | null {
  const nombre = NOMBRE_DIA[dia]

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return `Completá el horario del ${nombre}`
  }

  const { abierto, turnos } = config as Record<string, unknown>

  if (typeof abierto !== 'boolean') {
    return `El estado "abierto" del ${nombre} debe ser true o false`
  }
  if (!Array.isArray(turnos)) {
    return `El ${nombre} debe indicar sus turnos`
  }
  if (turnos.length > TURNOS_MAXIMOS) {
    return `El ${nombre} admite como máximo ${TURNOS_MAXIMOS} turnos`
  }

  if (!abierto) {
    if (turnos.length > 0) return `El ${nombre} está cerrado y no puede tener turnos`
    return null
  }

  if (turnos.length === 0) {
    return `El ${nombre} está abierto y debe tener al menos un turno`
  }

  for (let i = 0; i < turnos.length; i++) {
    const error = validarTurno(turnos[i])
    if (error) return `El turno ${i + 1} del ${nombre}: ${error}`
  }

  if (turnos.length === TURNOS_MAXIMOS) {
    const [turno1, turno2] = turnos as HorarioTurno[]

    if (turno1.cruzaMedianoche) {
      return `El turno 1 del ${nombre} cruza la medianoche, así que no puede tener un turno 2 el mismo día`
    }

    const cierre1 = aMinutos(turno1.cierre) as number
    const cierre1Efectivo = cierre1 === 0 ? MINUTOS_POR_DIA : cierre1
    const apertura2 = aMinutos(turno2.apertura) as number

    if (apertura2 <= cierre1Efectivo) {
      return `El turno 2 del ${nombre} debe abrir después del cierre del turno 1 (${turno1.apertura}–${turno1.cierre})`
    }
  }

  return null
}

function validarSolapamientoEntreDias(horario: HorarioSemana): string | null {
  for (let i = 0; i < DIAS_SEMANA.length; i++) {
    const dia = DIAS_SEMANA[i]
    const siguiente = DIAS_SEMANA[(i + 1) % DIAS_SEMANA.length]
    const config = horario[dia]

    if (config.abierto !== true) continue

    const nocturno = config.turnos.find((turno) => turno.cruzaMedianoche === true)
    if (!nocturno) continue

    const configSiguiente = horario[siguiente]
    if (configSiguiente.abierto !== true) continue

    const cierreExtendido = aMinutos(nocturno.cierre)
    const aperturaSiguiente = aMinutos(configSiguiente.turnos[0]?.apertura)
    if (cierreExtendido === null || aperturaSiguiente === null) continue

    if (aperturaSiguiente <= cierreExtendido) {
      return `El cierre del ${NOMBRE_DIA[dia]} a las ${nocturno.cierre} (+1) se superpone con la apertura del ${NOMBRE_DIA[siguiente]} a las ${configSiguiente.turnos[0].apertura}. La apertura del ${NOMBRE_DIA[siguiente]} debe ser posterior a las ${nocturno.cierre}.`
    }
  }

  return null
}

export function validarHorarioSemana(valor: unknown): string | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    return 'El horario debe ser un objeto con los días de la semana'
  }

  const horario = valor as Record<string, unknown>
  const claveInvalida = Object.keys(horario).find((clave) => !DIAS_SEMANA.includes(clave as DiaSemana))
  if (claveInvalida) {
    return `El día "${claveInvalida}" no es válido`
  }

  for (const dia of DIAS_SEMANA) {
    if (!(dia in horario)) return `Falta el horario del ${NOMBRE_DIA[dia]}`

    const error = validarDia(dia, horario[dia])
    if (error) return error
  }

  return validarSolapamientoEntreDias(horario as unknown as HorarioSemana)
}

export function assertHorarioSemana(valor: unknown): asserts valor is HorarioSemana {
  const error = validarHorarioSemana(valor)
  if (error) throw new Error(error)
}

export function intervaloTurno(turno: HorarioTurno): IntervaloTurno | null {
  if (!turno || typeof turno !== 'object' || Array.isArray(turno)) return null

  const apertura = aMinutos(turno.apertura)
  const cierre = aMinutos(turno.cierre)
  if (apertura === null || cierre === null) return null

  if (turno.cruzaMedianoche === true) {
    if (cierre === 0 || cierre >= apertura) return null
    return { inicio: apertura, fin: cierre + MINUTOS_POR_DIA }
  }

  if (cierre === 0) return { inicio: apertura, fin: MINUTOS_POR_DIA }
  if (cierre > apertura) return { inicio: apertura, fin: cierre }

  return null
}

function formatearTurno(turno: HorarioTurno) {
  return `${turno.apertura}–${turno.cierre}${turno.cruzaMedianoche ? ' (+1)' : ''}`
}

function formatearTurnosParaMotivo(turnos: HorarioTurno[]) {
  return turnos
    .map((turno) => `${turno.apertura} a ${turno.cierre}${turno.cruzaMedianoche ? ' (+1)' : ''}`)
    .join(' y de ')
}

function motivoCerrada(turnos: HorarioTurno[]) {
  return `La sucursal se encuentra cerrada en este horario. Atiende de ${formatearTurnosParaMotivo(turnos)}`
}

export function estadoSucursal(
  horario: HorarioSemana,
  zonaHoraria: string = ZONA_HORARIA_POR_DEFECTO,
  ahora = new Date(),
): EstadoSucursal {
  const { dia, minutos } = obtenerHoraLocal(ahora, zonaHorariaDeSucursal(zonaHoraria))

  const indice = DIAS_SEMANA.indexOf(dia)
  const config = horario[dia]
  if (!config) throw new Error(`Falta el horario del ${NOMBRE_DIA[dia]}`)

  const anterior = DIAS_SEMANA[(indice - 1 + DIAS_SEMANA.length) % DIAS_SEMANA.length]
  const configAnterior = horario[anterior]

  if (configAnterior?.abierto === true && Array.isArray(configAnterior.turnos)) {
    const minutosExtendidos = minutos + MINUTOS_POR_DIA
    const abiertaPorAyer = configAnterior.turnos.some((turno) => {
      if (!turno || turno.cruzaMedianoche !== true) return false
      const intervalo = intervaloTurno(turno)
      return intervalo !== null && minutosExtendidos >= intervalo.inicio && minutosExtendidos < intervalo.fin
    })

    if (abiertaPorAyer) return { abierta: true, motivo: null }
  }

  if (!config.abierto) {
    return { abierta: false, motivo: `La sucursal no atiende los ${NOMBRE_DIA[dia]}` }
  }

  const intervalos = config.turnos.map(intervaloTurno).filter((intervalo): intervalo is IntervaloTurno => intervalo !== null)
  if (intervalos.length === 0) {
    throw new Error(`El horario del ${NOMBRE_DIA[dia]} no tiene turnos válidos`)
  }

  const abiertaAhora = intervalos.some((intervalo) => minutos >= intervalo.inicio && minutos < intervalo.fin)
  if (abiertaAhora) return { abierta: true, motivo: null }

  return { abierta: false, motivo: motivoCerrada(config.turnos) }
}

function mismoTurno(a: HorarioTurno, b: HorarioTurno) {
  return a.apertura === b.apertura && a.cierre === b.cierre && a.cruzaMedianoche === b.cruzaMedianoche
}

function mismoHorario(a: HorarioDia, b: HorarioDia) {
  return a.abierto === b.abierto && a.turnos.length === b.turnos.length && a.turnos.every((turno, i) => mismoTurno(turno, b.turnos[i]))
}

export function formatearHorario(horario: HorarioSemana): string {
  const grupos: GrupoHorario[] = []

  for (const dia of DIAS_SEMANA) {
    const config = horario[dia]
    if (!config) throw new Error(`Falta el horario del ${NOMBRE_DIA[dia]}`)

    const ultimo = grupos[grupos.length - 1]
    if (ultimo && mismoHorario(ultimo.config, config)) {
      ultimo.hasta = dia
    } else {
      grupos.push({ desde: dia, hasta: dia, config })
    }
  }

  return grupos
    .map(({ desde, hasta, config }) => {
      const dias =
        desde === hasta
          ? ETIQUETA_DIA_CORTA[desde]
          : `${ETIQUETA_DIA_CORTA[desde]} a ${ETIQUETA_DIA_CORTA[hasta]}`

      if (!config.abierto) return `${dias} cerrado`

      if (config.turnos.length === 0) {
        throw new Error(`El ${NOMBRE_DIA[desde]} está abierto y no tiene turnos`)
      }

      return `${dias} ${config.turnos.map(formatearTurno).join(' y ')}`
    })
    .join(' · ')
}
