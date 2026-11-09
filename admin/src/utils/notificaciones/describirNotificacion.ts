import type { Notificacion } from '../../types/notificacion.types'
import {
  formatearCantidad,
  formatearImporte,
} from './formatoNotificacion'

export interface DescripcionNotificacion {
  titulo: string
  descripcion: string
  detalle: string
}

function nombreSucursal(id: number, nombre: string): string {
  return nombre.trim() || `Sucursal #${id}`
}

function nombreInsumo(id: number, nombre: string): string {
  return nombre.trim() || `Insumo #${id}`
}

export function describirNotificacion(
  notificacion: Notificacion,
): DescripcionNotificacion {
  switch (notificacion.tipo) {
    case 'pedido.creado':
      return {
        titulo: `Pedido #${notificacion.datos.pedidoId} creado`,
        descripcion: `Ingresó un pedido por $${formatearImporte(notificacion.datos.total)}.`,
        detalle: `Estado: ${notificacion.datos.estado}`,
      }

    case 'sucursal.cerrada': {
      const sucursal = nombreSucursal(
        notificacion.datos.sucursalId,
        notificacion.datos.sucursalNombre,
      )

      return {
        titulo: 'Sucursal cerrada',
        descripcion: `${sucursal} quedó fuera de servicio.`,
        detalle: `Sucursal #${notificacion.datos.sucursalId}`,
      }
    }

    case 'stock.bajo': {
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
    }
  }
}
