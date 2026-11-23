import { TriangleAlert } from 'lucide-react'
import type {
  DatosStockBajo,
  NotificacionDe,
} from '../catalogo'
import { esRegistro, numero, numeroPositivo, texto } from '../parseo'
import type { EstrategiaNotificacion } from '../tipos'
import {
  formatearCantidad,
} from '../../utils/notificaciones/formatoNotificacion'
import { PARAM_BUSQUEDA } from '../../utils/navegacion/parametros'

function nombreSucursal(id: number, nombre: string): string {
  return nombre.trim() || `Sucursal #${id}`
}

function nombreInsumo(id: number, nombre: string): string {
  return nombre.trim() || `Insumo #${id}`
}

const estrategia = {
  tipo: 'stock.bajo',
  icono: TriangleAlert,
  clasesIcono: 'bg-red-50 text-danger',
  parsearDatos(valor: unknown): DatosStockBajo | null {
    if (!esRegistro(valor)) return null

    const sucursalId = numeroPositivo(valor.sucursalId)
    const insumoId = numeroPositivo(valor.insumoId)
    const cantidad = numero(valor.cantidad)
    if (sucursalId === null || insumoId === null || cantidad === null) return null

    return {
      sucursalId,
      sucursalNombre: texto(valor.sucursalNombre) ?? '',
      insumoId,
      insumoNombre: texto(valor.insumoNombre) ?? '',
      cantidad,
      stockMinimo: valor.stockMinimo === null ? null : numero(valor.stockMinimo),
    }
  },
  describir(notificacion: NotificacionDe<'stock.bajo'>) {
    const sucursal = nombreSucursal(
      notificacion.datos.sucursalId,
      notificacion.datos.sucursalNombre,
    )
    const insumo = nombreInsumo(
      notificacion.datos.insumoId,
      notificacion.datos.insumoNombre,
    )
    const minimo = notificacion.datos.stockMinimo

    return {
      titulo: `Stock bajo de ${insumo}`,
      descripcion: `Quedan ${formatearCantidad(notificacion.datos.cantidad)} en ${sucursal}.`,
      detalle: minimo === null
        ? 'Sin mínimo definido'
        : `Mínimo: ${formatearCantidad(minimo)}`,
    }
  },
  destino(notificacion: NotificacionDe<'stock.bajo'>) {
    const nombre = notificacion.datos.insumoNombre.trim()
    if (!nombre) return null

    const params = new URLSearchParams({
      [PARAM_BUSQUEDA]: nombre,
    })

    return `/admin/sucursales/${notificacion.datos.sucursalId}/stock?${params.toString()}`
  },
} satisfies EstrategiaNotificacion<'stock.bajo'>

export default estrategia
