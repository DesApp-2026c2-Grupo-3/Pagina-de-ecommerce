import type { PromocionAdmin } from '../../types/promocion.types'
import EstadoBadge from '../listas/EstadoBadge'

// Estado de la promoción, con la misma lógica de hoy: Deshabilitada · Oculta (falta un producto) · Activa.
// «Oculta» lleva debajo «Producto eliminado» (en una sola etiqueta no entraba en la columna de escritorio).
export default function EstadoPromocion({ promo }: { promo: PromocionAdmin }) {
  if (!promo.activo) return <EstadoBadge texto="Deshabilitada" clases="bg-gray-200 text-gray-700" />
  if (!promo.completa) {
    return (
      <span
        className="flex items-center gap-2 @3xl:flex-col @3xl:items-start @3xl:gap-0.5"
        title="Un producto de la promo fue eliminado: los clientes no la ven hasta que lo cambies"
      >
        <EstadoBadge texto="Oculta" clases="bg-amber-100 text-amber-800" />
        <span className="text-xs font-medium text-amber-800">Producto eliminado</span>
      </span>
    )
  }
  return <EstadoBadge texto="Activa" clases="bg-green-100 text-green-800" />
}
