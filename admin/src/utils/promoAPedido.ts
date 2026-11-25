// Arma lo que espera POST /admin/promociones/nueva y PATCH /admin/promociones/editar/:id
import type { PromocionAdmin, TipoPromo } from '../types/promocion.types'
import type { ItemPedido } from './mecanicasPromo'

export interface PromoPedido {
  tipo: TipoPromo
  titulo: string
  destacado: string
  detalle: string
  dias: number[] | null
  maxPorPedido: number | null
  compraMinima: number | null
  activo: boolean
  items: ItemPedido[]
}

/** Una promo guardada, lista para volver a mandarla con algunos cambios (por ejemplo, otros días) */
export function pedidoDesdePromo(p: PromocionAdmin, cambios: Partial<PromoPedido> = {}): PromoPedido {
  return {
    tipo: p.tipo,
    titulo: p.titulo,
    destacado: p.destacado,
    detalle: p.detalle,
    dias: p.tipo === 'DIA' ? p.dias : null,
    maxPorPedido: p.maxPorPedido,
    compraMinima: p.compraMinima,
    activo: p.activo,
    items: p.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, descuento: i.descuento })),
    ...cambios,
  }
}
