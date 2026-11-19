import type { ViajeHistorial } from '../types/viaje.types'

export const formatearFecha = (fecha: string | null) => {
  if (!fecha) return 'No disponible'

  const date = new Date(fecha)

  if (Number.isNaN(date.getTime())) return 'No disponible'

  return date.toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export const formatearDuracion = (
  inicio: string | null,
  fin: string | null
) => {
  if (!inicio || !fin) return 'No disponible'

  const diferencia =
    new Date(fin).getTime() - new Date(inicio).getTime()

  if (!Number.isFinite(diferencia) || diferencia < 0) {
    return 'No disponible'
  }

  const minutos = Math.floor(diferencia / 60000)
  const horas = Math.floor(minutos / 60)
  const minutosRestantes = minutos % 60

  if (horas === 0) return `${minutosRestantes} min`

  return `${horas} h ${minutosRestantes} min`
}

export const filtrarViajes = (
  viajes: ViajeHistorial[],
  filtroEstado: string,
  busqueda: string,
  fechaDesde: string,
  fechaHasta: string
) => {
  return viajes.filter((viaje) => {
    if (
      filtroEstado !== 'todos' &&
      viaje.estado !== filtroEstado
    ) {
      return false
    }

    const termino = busqueda.trim()

    if (termino) {
      const coincideViaje = String(viaje.id).includes(termino)

      if (!coincideViaje) {
        return false
      }
    }

    if (fechaDesde || fechaHasta) {
      if (!viaje.fechaInicio) return false

      const fechaViaje = new Date(viaje.fechaInicio)

      if (Number.isNaN(fechaViaje.getTime())) return false

      const fechaLocal = [
        fechaViaje.getFullYear(),
        String(fechaViaje.getMonth() + 1).padStart(2, '0'),
        String(fechaViaje.getDate()).padStart(2, '0'),
      ].join('-')

      if (fechaDesde && fechaLocal < fechaDesde) return false
      if (fechaHasta && fechaLocal > fechaHasta) return false
    }

    return true
  })
}