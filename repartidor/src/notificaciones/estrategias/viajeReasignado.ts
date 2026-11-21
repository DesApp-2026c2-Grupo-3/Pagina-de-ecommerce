import { ArrowLeftRight } from 'lucide-react'
import type { DatosViajeReasignado, NotificacionDe } from '../catalogo'
import { esRegistro, numeroPositivo } from '../parseo'
import type { EstrategiaNotificacion } from '../tipos'

const estrategia = {
  tipo: 'viaje.reasignado',
  icono: ArrowLeftRight,
  tono: 'alerta',
  aviso: { prioridad: 'alta', textoAccion: () => 'Entendido' },
  parsearDatos(valor: unknown): DatosViajeReasignado | null {
    if (!esRegistro(valor)) return null

    const viajeId = numeroPositivo(valor.viajeId)
    return viajeId === null ? null : { viajeId }
  },
  describir(notificacion: NotificacionDe<'viaje.reasignado'>) {
    return {
      titulo: `El viaje #${notificacion.datos.viajeId} pasó a otro repartidor`,
      descripcion: 'Administración lo reasignó por tu pedido de asistencia.',
    }
  },
  destino: () => '/',
} satisfies EstrategiaNotificacion<'viaje.reasignado'>

export default estrategia
