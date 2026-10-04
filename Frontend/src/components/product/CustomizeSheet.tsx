import { useState } from 'react'
import { EXTRA_MAX_INCREMENTO } from '../../config/combo'
import type { ProductIngredient } from '../../types/product'
import QuantityStepper from './QuantityStepper'
import Sheet from './Sheet'

interface CustomizeSheetProps {
  /** Insumos de la receta que se pueden mostrar (sin los lugares elegibles de un combo) */
  ingredientes: ProductIngredient[]
  /** Cantidad final ya elegida por insumo; solo están los que cambiaron respecto de la receta */
  cantidades: Record<number, number>
  /** Precio sin extras, para mostrar el total mientras se personaliza */
  precioBase: number
  onGuardar: (cantidades: Record<number, number>) => void
  onClose: () => void
}

function precio(n: number) {
  return `$${n.toLocaleString('es-AR')}`
}

// Modal "¿Cómo quieres personalizar?": lo que solo se puede sacar va con tilde,
// lo que se puede aumentar va con − / +. Sacar no baja el precio; sumar cobra el precio del extra.
function CustomizeSheet({ ingredientes, cantidades, precioBase, onGuardar, onClose }: CustomizeSheetProps) {
  const [borrador, setBorrador] = useState<Record<number, number>>(() =>
    Object.fromEntries(ingredientes.map((i) => [i.insumoId, cantidades[i.insumoId] ?? i.cantidadBase])),
  )

  const precioExtras = ingredientes.reduce(
    (suma, i) => suma + Math.max(0, borrador[i.insumoId] - i.cantidadBase) * i.precioComercial,
    0,
  )

  function guardar() {
    const tocados = ingredientes.filter((i) => borrador[i.insumoId] !== i.cantidadBase)
    onGuardar(Object.fromEntries(tocados.map((i) => [i.insumoId, borrador[i.insumoId]])))
  }

  function cambiar(insumoId: number, cantidad: number) {
    setBorrador((prev) => ({ ...prev, [insumoId]: cantidad }))
  }

  return (
    <Sheet
      title="¿Cómo quieres personalizar?"
      onClose={onClose}
      alto="completo"
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-xl font-extrabold text-brand-dark">{precio(precioBase + precioExtras)}</span>
          <button
            type="button"
            onClick={guardar}
            className="rounded-full bg-brand-red px-8 py-3 font-bold text-white transition-opacity hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      }
    >
      <h3 className="mt-1 text-xl font-extrabold text-brand-dark">Personalizar</h3>
      <ul className="mt-2 flex flex-col">
        {ingredientes.map((ing) => {
          const cantidad = borrador[ing.insumoId]
          const agregable = ing.esAgregable
          const removible = ing.esRemovible
          const entero = Number.isInteger(ing.cantidadBase)
          const paso = entero ? 1 : ing.cantidadBase
          // Con sucursal elegida, el backend avisa si no alcanza el stock para pedirlo extra
          const sinStockExtra = agregable && ing.hayStockExtra === false
          
          return (
            <li key={ing.insumoId} className="flex items-center gap-3 border-b border-brand-dark/10 py-3 last:border-b-0">
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-cream text-lg font-extrabold text-brand-red"
              >
                {ing.nombre.charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-brand-dark">{ing.nombre}</p>
                {sinStockExtra ? (
                  <p className="text-xs font-semibold text-gray-500">Sin stock para extras</p>
                ) : (
                  agregable &&
                  ing.precioComercial > 0 && (
                    <p className="text-xs text-gray-500">+{precio(ing.precioComercial)} cada extra</p>
                  )
                )}
                {!agregable && !removible && <p className="text-xs text-gray-500">Incluido</p>}
              </div>

              {agregable ? (
                <QuantityStepper
                  value={cantidad}
                  min={removible ? 0 : ing.cantidadBase}
                  max={sinStockExtra ? ing.cantidadBase : ing.cantidadBase + EXTRA_MAX_INCREMENTO * paso}                  step={paso}
                  label={ing.nombre}
                  onChange={(n) => cambiar(ing.insumoId, n)}
                />
              ) : (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={cantidad > 0}
                  aria-label={ing.nombre}
                  disabled={!removible}
                  onClick={() => cambiar(ing.insumoId, cantidad > 0 ? 0 : ing.cantidadBase)}
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border-2 text-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    cantidad > 0
                      ? 'border-brand-red bg-brand-red text-white'
                      : 'border-brand-dark/30 bg-white text-transparent'
                  }`}
                >
                  ✓
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}

export default CustomizeSheet
