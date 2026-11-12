import {
  DIAS_SEMANA,
  ZONA_HORARIA_POR_DEFECTO,
  type DiaSemana,
  type EstadoSucursal,
  type GrupoHorario,
  type HorarioDia,
  type HorarioSemana,
} from '../types/sucursal'

// El backend es quien valida el horario (utils/horarioSucursal.js); acá solo se interpreta para mostrarlo.

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

const FIN_DE_DIA = '23:59'
const MINUTOS_POR_DIA = 24 * 60

function aMinutos(hhmm: unknown) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm ?? ''))
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

// 23:59 cuenta como las 24:00 (sin hueco antes de la transnoche)
const finDelDia = (cierre: string) => (cierre === FIN_DE_DIA ? MINUTOS_POR_DIA : aMinutos(cierre))

// 150 -> "+02:30"
export function formatearExceso(minutos: number) {
  const hh = String(Math.floor(minutos / 60)).padStart(2, '0')
  const mm = String(minutos % 60).padStart(2, '0')
  return `+${hh}:${mm}`
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

  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? ''
  return { dia: DIAS_POR_NOMBRE_EN[valor('weekday')], minutos: Number(valor('hour')) * 60 + Number(valor('minute')) }
}

// Solo la forma: los siete días, cada uno con abierto, apertura y cierre. Devuelve el error o null.
export function validarHorarioSemana(valor: unknown): string | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    return 'El horario debe ser un objeto con los días de la semana'
  }
  const horario = valor as Record<string, Partial<HorarioDia> | undefined>
  for (const dia of DIAS_SEMANA) {
    const config = horario[dia]
    if (!config || typeof config.abierto !== 'boolean' || !config.apertura || !config.cierre) {
      return `El horario del ${NOMBRE_DIA[dia]} está incompleto`
    }
  }
  return null
}

function horasDelDia(config: HorarioDia) {
  const horas = `${config.apertura} a ${config.cierre}`
  return config.transnocheMin ? `${horas} ${formatearExceso(config.transnocheMin)}` : horas
}

// Un horario ausente o incompleto no bloquea: solo se cierra con un horario explícito (igual que el backend)
export function estadoSucursal(
  horario: HorarioSemana,
  zonaHoraria: string = ZONA_HORARIA_POR_DEFECTO,
  ahora = new Date(),
): EstadoSucursal {
  const abierta = { abierta: true, motivo: null }
  if (!horario) return abierta

  const { dia, minutos } = obtenerHoraLocal(ahora, zonaHorariaDeSucursal(zonaHoraria))
  const ayer = horario[DIAS_SEMANA[(DIAS_SEMANA.indexOf(dia) + DIAS_SEMANA.length - 1) % DIAS_SEMANA.length]]

  // La madrugada de hoy puede ser la transnoche de ayer
  if (ayer?.abierto && Number.isInteger(ayer.transnocheMin) && minutos < (ayer.transnocheMin ?? 0)) return abierta

  const config = horario[dia]
  if (!config || typeof config.abierto !== 'boolean') return abierta
  if (!config.abierto) return { abierta: false, motivo: `La sucursal no atiende los ${NOMBRE_DIA[dia]}` }

  const inicio = aMinutos(config.apertura)
  const fin = finDelDia(config.cierre)
  if (inicio === null || fin === null || fin <= inicio) return abierta
  if (minutos >= inicio && minutos < fin) return abierta

  return { abierta: false, motivo: `La sucursal se encuentra cerrada en este horario. Atiende de ${horasDelDia(config)}` }
}

const mismoHorario = (a: HorarioDia, b: HorarioDia) =>
  a.abierto === b.abierto &&
  a.apertura === b.apertura &&
  a.cierre === b.cierre &&
  (a.transnocheMin ?? 0) === (b.transnocheMin ?? 0)

// "Lun a Vie 09:00 a 23:00 · Sáb 10:00 a 23:59 +02:30 · Dom cerrado"
export function formatearHorario(horario: HorarioSemana): string {
  const grupos: GrupoHorario[] = []

  for (const dia of DIAS_SEMANA) {
    const config = horario[dia]
    if (!config) continue
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && mismoHorario(ultimo.config, config)) ultimo.hasta = dia
    else grupos.push({ desde: dia, hasta: dia, config })
  }

  return grupos
    .map(({ desde, hasta, config }) => {
      const dias =
        desde === hasta ? ETIQUETA_DIA_CORTA[desde] : `${ETIQUETA_DIA_CORTA[desde]} a ${ETIQUETA_DIA_CORTA[hasta]}`
      return config.abierto ? `${dias} ${horasDelDia(config)}` : `${dias} cerrado`
    })
    .join(' · ')
}

// Estado de una sucursal: el cierre temporal del encargado pesa más que su horario semanal.
export function estadoDeSucursal(
  sucursal: { horario: HorarioSemana; zona_horaria?: string | null; cierreTemporal?: boolean },
  ahora = new Date(),
): EstadoSucursal {
  if (sucursal.cierreTemporal) {
    return { abierta: false, motivo: 'La sucursal está cerrada temporalmente' }
  }
  return estadoSucursal(sucursal.horario, sucursal.zona_horaria ?? undefined, ahora)
}
