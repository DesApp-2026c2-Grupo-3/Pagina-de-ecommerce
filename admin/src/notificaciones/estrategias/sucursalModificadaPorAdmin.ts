import { PencilLine } from 'lucide-react'
import type {
  BloqueSucursal,
  DatosSucursalModificadaPorAdmin,
  NotificacionDe,
} from '../catalogo'
import { esRegistro, numeroPositivo, texto } from '../parseo'
import type { EstrategiaNotificacion } from '../tipos'

const BLOQUES: BloqueSucursal[] = [
  'datos_generales',
  'horarios',
  'ubicacion',
  'entrega',
]

const ETIQUETAS: Record<BloqueSucursal, string> = {
  datos_generales: 'datos generales',
  horarios: 'horarios',
  ubicacion: 'ubicación',
  entrega: 'radio de entrega',
}

function esBloque(valor: unknown): valor is BloqueSucursal {
  return typeof valor === 'string' && BLOQUES.includes(valor as BloqueSucursal)
}

function parsearCambios(valor: unknown): BloqueSucursal[] | null {
  if (!Array.isArray(valor)) return null

  const vistos = new Set<BloqueSucursal>()
  for (const item of valor) {
    if (!esBloque(item)) return null
    vistos.add(item)
  }

  return BLOQUES.filter((bloque) => vistos.has(bloque))
}

function nombreSucursal(id: number, nombre: string): string {
  return nombre.trim() || `Sucursal #${id}`
}

function nombreAdmin(id: number, nombre: string): string {
  return nombre.trim() || `Administrador #${id}`
}

function unirEtiquetas(cambios: BloqueSucursal[]): string {
  const etiquetas = cambios.map((bloque) => ETIQUETAS[bloque])

  if (etiquetas.length === 1) return etiquetas[0]
  return `${etiquetas.slice(0, -1).join(', ')} y ${etiquetas.at(-1)}`
}

const estrategia = {
  tipo: 'sucursal.modificada_por_admin',
  icono: PencilLine,
  clasesIcono: 'bg-orange-100 text-action',
  parsearDatos(valor: unknown): DatosSucursalModificadaPorAdmin | null {
    if (!esRegistro(valor)) return null

    const sucursalId = numeroPositivo(valor.sucursalId)
    const adminId = numeroPositivo(valor.adminId)
    const cambios = parsearCambios(valor.cambios)

    if (sucursalId === null || adminId === null || !cambios || cambios.length === 0) {
      return null
    }

    return {
      sucursalId,
      sucursalNombre: texto(valor.sucursalNombre) ?? '',
      adminId,
      adminNombre: texto(valor.adminNombre) ?? '',
      cambios,
    }
  },
  describir(notificacion: NotificacionDe<'sucursal.modificada_por_admin'>) {
    const sucursal = nombreSucursal(
      notificacion.datos.sucursalId,
      notificacion.datos.sucursalNombre,
    )
    const admin = nombreAdmin(
      notificacion.datos.adminId,
      notificacion.datos.adminNombre,
    )
    const cantidad = notificacion.datos.cambios.length

    return {
      titulo: `Sucursal ${sucursal} modificada`,
      descripcion: `${admin} cambió ${unirEtiquetas(notificacion.datos.cambios)} de la sucursal.`,
      detalle: `Sucursal #${notificacion.datos.sucursalId} · ${cantidad} bloque${cantidad === 1 ? '' : 's'}`,
    }
  },
  destino(notificacion: NotificacionDe<'sucursal.modificada_por_admin'>) {
    return `/admin/sucursales/editar/${notificacion.datos.sucursalId}`
  },
} satisfies EstrategiaNotificacion<'sucursal.modificada_por_admin'>

export default estrategia
