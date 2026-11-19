import { Truck } from 'lucide-react'
import type { DatosViajeAsignado, NotificacionDe } from '../catalogo'
import { esRegistro, numeroNoNegativo, numeroPositivo } from '../parseo'
import type { EstrategiaNotificacion } from '../tipos'

const estrategia = {
  tipo: 'viaje.asignado',
  icono: Truck,
  tono: 'marca',
  aviso: { prioridad: 'alta', textoAccion: () => 'Ver viaje' },
  parsearDatos(valor: unknown): DatosViajeAsignado | null {
    if (!esRegistro(valor)) return null

    const viajeId = numeroPositivo(valor.viajeId)
    const cantidadPedidos = numeroNoNegativo(valor.cantidadPedidos)
    if (viajeId === null || cantidadPedidos === null) return null

    return { viajeId, cantidadPedidos }
  },
  describir(notificacion: NotificacionDe<'viaje.asignado'>) {
    const { viajeId, cantidadPedidos } = notificacion.datos
    const pedidos = cantidadPedidos === 1 ? '1 pedido' : `${cantidadPedidos} pedidos`

    return {
      titulo: `Te asignaron el viaje #${viajeId}`,
      descripcion: `Tiene ${pedidos}. Retiralos en el punto de asistencia y confirmá la recepción.`,
    }
  },
  destino: () => '/viaje',
} satisfies EstrategiaNotificacion<'viaje.asignado'>

export default estrategia
