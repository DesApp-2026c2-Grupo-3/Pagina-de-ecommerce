import type { FilaPromocion } from '../../types/promocion.types'
import EstadoBadge from '../listas/EstadoBadge'

const AMBAR = 'bg-amber-100 text-amber-800'

// Etiqueta con una línea de motivo debajo (en una sola etiqueta no entraba en la columna de escritorio)
function ConMotivo({ texto, motivo, ayuda }: { texto: string; motivo: string; ayuda: string }) {
  return (
    <span className="flex items-center gap-2 @3xl:flex-col @3xl:items-start @3xl:gap-0.5" title={ayuda}>
      <EstadoBadge texto={texto} clases={AMBAR} />
      <span className="text-xs font-medium text-amber-800">{motivo}</span>
    </span>
  )
}

// Estado de la promoción, con la misma lógica de hoy: Deshabilitada · Oculta (falta un producto) · Activa.
// «Nuevo en la carta» suma lo que ve el cliente según su producto (plan de merge v4).
export default function EstadoPromocion({ promo }: { promo: FilaPromocion }) {
  if (!promo.activo) return <EstadoBadge texto="Deshabilitada" clases="bg-gray-200 text-gray-700" />
  if (promo.aviso === 'categoria-deshabilitada') {
    return (
      <ConMotivo
        texto="Oculta"
        motivo="Categoría deshabilitada"
        ayuda="La categoría del producto está deshabilitada: el bloque no se muestra en la tienda"
      />
    )
  }
  if (promo.aviso === 'producto-deshabilitado') {
    return (
      <ConMotivo
        texto="No disponible"
        motivo="Producto deshabilitado"
        ayuda="El bloque se ve en la tienda, pero el producto no se puede comprar"
      />
    )
  }
  if (!promo.completa) {
    return (
      <ConMotivo
        texto="Oculta"
        motivo="Producto eliminado"
        ayuda="Un producto de la promo fue eliminado: los clientes no la ven hasta que lo cambies"
      />
    )
  }
  return <EstadoBadge texto="Activa" clases="bg-green-100 text-green-800" />
}
