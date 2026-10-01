import type { ProductIngredient } from '../types/product'
import { pasoExtra, type Eleccion } from '../utils/personalizacion'
import { formatearPrecio } from '../utils/precio'

interface PersonalizarIngredientesProps {
  ingredientes: ProductIngredient[]
  eleccion: Eleccion
  onChange: (eleccion: Eleccion) => void
}

function PersonalizarIngredientes({ ingredientes, eleccion, onChange }: PersonalizarIngredientesProps) {
  const fijos = ingredientes.filter((i) => !i.esRemovible && !i.esAgregable)
  const removibles = ingredientes.filter((i) => i.esRemovible)
  const agregables = ingredientes.filter((i) => i.esAgregable)

  function toggleQuitar(insumoId: number) {
    const quitados = new Set(eleccion.quitados)
    const extras = new Set(eleccion.extras)
    if (quitados.has(insumoId)) {
      quitados.delete(insumoId)
    } else {
      quitados.add(insumoId)
      extras.delete(insumoId) // si se quita, tampoco puede ir como extra
    }
    onChange({ quitados, extras })
  }

  function toggleExtra(insumoId: number) {
    const extras = new Set(eleccion.extras)
    if (extras.has(insumoId)) extras.delete(insumoId)
    else extras.add(insumoId)
    onChange({ quitados: eleccion.quitados, extras })
  }

  return (
    <div className="flex flex-col gap-4">
      {fijos.length > 0 && (
        <p className="text-sm text-gray-600">
          <span className="font-bold text-brand-dark">Incluye: </span>
          {fijos.map((i) => i.nombre).join(', ')}
        </p>
      )}

      {removibles.length > 0 && (
        <fieldset>
          <legend className="text-sm font-bold text-brand-dark">Ingredientes</legend>          <div className="mt-2 grid grid-cols-2 gap-2">
            {removibles.map((ing) => (
              <label key={ing.insumoId} className="flex items-center gap-2 text-sm text-brand-dark">
                <input
                  type="checkbox"
                  checked={!eleccion.quitados.has(ing.insumoId)}
                  onChange={() => toggleQuitar(ing.insumoId)}
                  className="h-4 w-4 accent-brand-red"
                />
                {ing.nombre}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {agregables.length > 0 && (
        <fieldset>
          <legend className="text-sm font-bold text-brand-dark">Extras</legend>
          <div className="mt-2 flex flex-col gap-2">
            {agregables.map((ing) => {
              const quitado = eleccion.quitados.has(ing.insumoId)
              return (
                <label
                  key={ing.insumoId}
                  className={`flex items-center justify-between gap-2 text-sm ${
                    quitado ? 'text-gray-400' : 'text-brand-dark'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={eleccion.extras.has(ing.insumoId)}
                      disabled={quitado}
                      onChange={() => toggleExtra(ing.insumoId)}
                      className="h-4 w-4 accent-brand-red"
                    />
                    {ing.nombre} extra
                  </span>
                  {ing.precioComercial > 0 && (
                    <span className="font-semibold">+{formatearPrecio(ing.precioComercial * pasoExtra(ing))}</span>
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {removibles.length === 0 && agregables.length === 0 && (
        <p className="text-sm text-gray-600">Este producto no tiene opciones para personalizar.</p>
      )}
    </div>
  )
}

export default PersonalizarIngredientes