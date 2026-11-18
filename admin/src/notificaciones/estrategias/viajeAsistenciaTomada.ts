import { UserCheck } from 'lucide-react'
import type {
  DatosViajeAsistenciaTomada,
  NotificacionDe,
} from '../catalogo'
import { esRegistro, fechaIso, numero, numeroPositivo, texto } from '../parseo'
import type { EstrategiaNotificacion } from '../tipos'
import { formatearFecha } from '../../utils/notificaciones/formatoNotificacion'
import { PARAM_SUCURSAL } from '../../utils/navegacion/parametros'

function nombreRepartidor(id: number, nombre: string): string {
  return nombre.trim() || `Repartidor #${id}`
}

// D-19: el repartidor que va a asistir confirmó que recibió el viaje reasignado
const estrategia = {
  tipo: 'viaje.asistencia_tomada',
  icono: UserCheck,
  clasesIcono: 'bg-green-50 text-green-700',
  parsearDatos(valor: unknown): DatosViajeAsistenciaTomada | null {
    if (!esRegistro(valor)) return null

    const viajeId = numeroPositivo(valor.viajeId)
    const repartidorId = numeroPositivo(valor.repartidorId)
    const sucursalId = numeroPositivo(valor.sucursalId)
    const tomadaEn = fechaIso(valor.tomadaEn)

    if (
      viajeId === null
      || repartidorId === null
      || sucursalId === null
      || tomadaEn === null
    ) {
      return null
    }

    const cantidad = numero(valor.cantidadPedidos)

    return {
      viajeId,
      repartidorId,
      repartidorNombre: texto(valor.repartidorNombre) ?? '',
      sucursalId,
      cantidadPedidos: cantidad !== null && cantidad > 0 ? Math.trunc(cantidad) : 0,
      tomadaEn,
    }
  },
  describir(notificacion: NotificacionDe<'viaje.asistencia_tomada'>) {
    const { datos } = notificacion
    const repartidor = nombreRepartidor(datos.repartidorId, datos.repartidorNombre)
    const pedidos = datos.cantidadPedidos === 1
      ? 'el pedido'
      : `los ${datos.cantidadPedidos} pedidos`

    return {
      titulo: `Viaje #${datos.viajeId}: asistencia en camino`,
      descripcion: datos.cantidadPedidos > 0
        ? `${repartidor} tomó ${pedidos}.`
        : `${repartidor} tomó el viaje.`,
      detalle: `Confirmado: ${formatearFecha(datos.tomadaEn)}`,
    }
  },
  destino(notificacion: NotificacionDe<'viaje.asistencia_tomada'>) {
    const params = new URLSearchParams({
      [PARAM_SUCURSAL]: String(notificacion.datos.sucursalId),
    })

    return `/admin/viajes?${params.toString()}`
  },
} satisfies EstrategiaNotificacion<'viaje.asistencia_tomada'>

export default estrategia
