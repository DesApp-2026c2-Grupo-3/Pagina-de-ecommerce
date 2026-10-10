import type { ProductIngredient } from '../../types/product'
import { formatearPrecio } from '../../utils/precio'
import CasillaOpcion from './CasillaOpcion'

interface Props {
  ingredientes: ProductIngredient[]
  /** Cantidad final elegida por insumo (solo los que cambiaron respecto de la receta) */
  cantidades: Record<number, number>
  onCambiar: (insumoId: number, cantidad: number) => void
}

// Dos columnas: "Sacale" (lo que viene y se puede quitar) y "Sumale" (extras que cobran)
function IngredientesEditables({ ingredientes, cantidades, onCambiar }: Props) {
  const removibles = ingredientes.filter((i) => i.esRemovible && i.cantidadBase > 0)
  const agregables = ingredientes.filter((i) => i.esAgregable)
  if (removibles.length === 0 && agregables.length === 0) return null

  const cantidadDe = (i: ProductIngredient) => cantidades[i.insumoId] ?? i.cantidadBase
  // Un extra = una porción más (la receta puede usar medidas no enteras)
  const porcion = (i: ProductIngredient) => (i.cantidadBase > 0 && !Number.isInteger(i.cantidadBase) ? i.cantidadBase : 1)

  return (
    <section className="mt-6 grid gap-6 border-t-2 border-dashed border-brand-sand pt-5 sm:grid-cols-2">
      {removibles.length > 0 && (
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Sacale</h2>
            <span className="text-sm font-bold text-brand-muted">Destildá lo que no va</span>
          </div>
          {removibles.map((i) => {
            const incluido = cantidadDe(i) > 0
            return (
              <CasillaOpcion
                key={i.insumoId}
                texto={i.nombre}
                marcada={incluido}
                onCambiar={() => onCambiar(i.insumoId, incluido ? 0 : i.cantidadBase)}
              />
            )
          })}
        </div>
      )}

      {agregables.length > 0 && (
        <div className={removibles.length > 0 ? 'sm:border-l-2 sm:border-dashed sm:border-brand-sand sm:pl-6' : ''}>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Sumale</h2>
            <span className="text-sm font-bold text-brand-muted">Opcional</span>
          </div>
          {agregables.map((i) => {
            const sumado = cantidadDe(i) > i.cantidadBase
            // Con sucursal elegida, el backend avisa si no alcanza el stock para pedirlo extra
            const sinStock = i.hayStockExtra === false
            return (
              <CasillaOpcion
                key={i.insumoId}
                texto={i.nombre}
                marcada={sumado}
                deshabilitada={sinStock && !sumado}
                detalle={sinStock ? 'Sin stock' : i.precioComercial > 0 ? `+${formatearPrecio(i.precioComercial)}` : undefined}
                onCambiar={() => onCambiar(i.insumoId, sumado ? i.cantidadBase : Math.max(cantidadDe(i), i.cantidadBase) + porcion(i))}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

export default IngredientesEditables