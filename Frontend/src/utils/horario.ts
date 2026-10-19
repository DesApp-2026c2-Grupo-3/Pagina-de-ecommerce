import {
  DIAS_SEMANA,
  ZONA_HORARIA_POR_DEFECTO,
  type DiaSemana,
  type EstadoSucursal,
  type HorarioDia,
  type HorarioSemana,
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

function esHoraValida(valor: string) {
  return HORA_REGEX.test(valor)
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
  const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? 0)
  const minuto = Number(partes.find((p) => p.type === 'minute')?.value ?? 0)

  return { dia, minutos: hora * 60 + minuto }
}

function aMinutos(hhmm: unknown) {
  const match = HORA_REGEX.exec(String(hhmm ?? ''))
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function cierreEnMinutos(cierre: unknown) {
  const minutos = aMinutos(cierre)
  return minutos === 0 ? 24 * 60 : minutos
}

export function estadoSucursal(
  horario: unknown,
  zonaHoraria?: string | null,
  ahora = new Date(),
): EstadoSucursal {
  if (!horario || typeof horario !== 'object' || Array.isArray(horario)) {
    return { abierta: true, motivo: null }
  }

  const { dia, minutos } = obtenerHoraLocal(ahora, zonaHorariaDeSucursal(zonaHoraria))
  if (!dia) return { abierta: true, motivo: null }

  const config = (horario as Record<string, unknown>)[dia]

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { abierta: true, motivo: null }
  }

  const { apertura, cierre, abierto } = config as Record<string, unknown>
  const minutosApertura = aMinutos(apertura)
  const minutosCierre = cierreEnMinutos(cierre)

  if (typeof abierto !== 'boolean' || minutosApertura === null || minutosCierre === null) {
    return { abierta: true, motivo: null }
  }

  if (!abierto) {
    return { abierta: false, motivo: `La sucursal no atiende los ${dia}` }
  }

  const enHorario =
    minutosCierre > minutosApertura
      ? minutos >= minutosApertura && minutos < minutosCierre
      : minutos >= minutosApertura || minutos < minutosCierre

  if (!enHorario) {
    return {
      abierta: false,
      motivo: `La sucursal se encuentra cerrada en este horario. Atiende de ${String(apertura)} a ${String(cierre)}`,
    }
  }

  return { abierta: true, motivo: null }
}

function horarioPorDefecto(): HorarioSemana {
  return Object.fromEntries(
    DIAS_SEMANA.map((dia) => [dia, { apertura: '09:00', cierre: '23:00', abierto: true }]),
  ) as HorarioSemana
}

function normalizarHorario(valor: unknown): HorarioSemana {
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

function mismoHorario(a: HorarioDia, b: HorarioDia) {
  return a.abierto === b.abierto && a.apertura === b.apertura && a.cierre === b.cierre
}

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
      const dias =
        desde === hasta
          ? ETIQUETA_DIA_CORTA[desde]
          : `${ETIQUETA_DIA_CORTA[desde]} a ${ETIQUETA_DIA_CORTA[hasta]}`
      return config.abierto ? `${dias} ${config.apertura}–${config.cierre}` : `${dias} cerrado`
    })
    .join(' · ')
}
