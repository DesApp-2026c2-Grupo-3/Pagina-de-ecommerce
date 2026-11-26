import { Bike } from 'lucide-react'
import type {
  DatosViajeRequiereAsistencia,
  NotificacionDe,
} from '../catalogo'
import { esRegistro, fechaIso, numeroPositivo, texto } from '../parseo'
import type { EstrategiaNotificacion } from '../tipos'
import { rutaDetalleViaje } from '../../utils/navegacion/rutasViaje'

function nombreRepartidor(id: number, nombre: string): string {
  return nombre.trim() || `Repartidor #${id}`
}

const estrategia = {
  tipo: 'viaje.requiere_asistencia',
  icono: Bike,
  clasesIcono: 'bg-red-50 text-danger',
  parsearDatos(valor: unknown): DatosViajeRequiereAsistencia | null {
    if (!esRegistro(valor)) return null

    const viajeId = numeroPositivo(valor.viajeId)
    const repartidorId = numeroPositivo(valor.repartidorId)
    const sucursalId = numeroPositivo(valor.sucursalId)
    const solicitadaEn = fechaIso(valor.solicitadaEn)

    if (
      viajeId === null
      || repartidorId === null
      || sucursalId === null
      || solicitadaEn === null
    ) {
      return null
    }

    const comentario = texto(valor.comentario)?.trim()

    return {
      viajeId,
      repartidorId,
      repartidorNombre: texto(valor.repartidorNombre) ?? '',
      sucursalId,
      motivo: texto(valor.motivo)?.trim() || 'No especificado',
      comentario: comentario || null,
      solicitadaEn,
    }
  },
  describir(notificacion: NotificacionDe<'viaje.requiere_asistencia'>) {
    const { datos } = notificacion
    const repartidor = nombreRepartidor(datos.repartidorId, datos.repartidorNombre)

    return {
      titulo: `Viaje #${datos.viajeId} requiere asistencia`,
      descripcion: `${repartidor} pidió ayuda: ${datos.motivo}.`,
      detalle: datos.comentario ?? 'Sin comentario',
    }
  },
  // RN-43: lleva a donde se resuelve, la sección de asistencia del viaje
  destino(notificacion: NotificacionDe<'viaje.requiere_asistencia'>) {
    const { viajeId, sucursalId } = notificacion.datos
    return `${rutaDetalleViaje(viajeId, sucursalId)}#asistencia`
  },
} satisfies EstrategiaNotificacion<'viaje.requiere_asistencia'>

export default estrategia
