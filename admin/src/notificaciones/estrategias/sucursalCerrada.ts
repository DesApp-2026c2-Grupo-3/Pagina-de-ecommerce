import { Store } from 'lucide-react'
import type {
  DatosSucursalCerrada,
  NotificacionDe,
} from '../catalogo'
import { esRegistro, numeroPositivo, texto } from '../parseo'
import type { EstrategiaNotificacion } from '../tipos'

function nombreSucursal(id: number, nombre: string): string {
  return nombre.trim() || `Sucursal #${id}`
}

const estrategia = {
  tipo: 'sucursal.cerrada',
  icono: Store,
  clasesIcono: 'bg-red-50 text-danger',
  parsearDatos(valor: unknown): DatosSucursalCerrada | null {
    if (!esRegistro(valor)) return null

    const sucursalId = numeroPositivo(valor.sucursalId)
    if (sucursalId === null) return null

    return {
      sucursalId,
      sucursalNombre: texto(valor.sucursalNombre) ?? '',
    }
  },
  describir(notificacion: NotificacionDe<'sucursal.cerrada'>) {
    const sucursal = nombreSucursal(
      notificacion.datos.sucursalId,
      notificacion.datos.sucursalNombre,
    )

    return {
      titulo: 'Sucursal cerrada',
      descripcion: `${sucursal} quedó fuera de servicio.`,
      detalle: `Sucursal #${notificacion.datos.sucursalId}`,
    }
  },
  destino() {
    return null
  },
} satisfies EstrategiaNotificacion<'sucursal.cerrada'>

export default estrategia
