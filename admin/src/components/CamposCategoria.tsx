// Campos de la categoría que se comparten entre "Nueva" y "Editar": de quién depende, orden y complemento

export interface ExtrasCategoria {
  /** '' = categoría principal */
  categoriaPadreId: string
  /** '' = al final (solo al crear) */
  orden: string
  esComplemento: boolean
}

export const extrasVacios: ExtrasCategoria = { categoriaPadreId: '', orden: '', esComplemento: false }

export interface CategoriaOpcion {
  id: number
  nombre: string
  categoriaPadreId?: number | null
  orden?: number
  esComplemento?: boolean
}

// Lo que se manda al backend (el nombre va aparte)
export function extrasAPedido(extras: ExtrasCategoria) {
  return {
    categoriaPadreId: extras.categoriaPadreId === '' ? null : Number(extras.categoriaPadreId),
    ...(extras.orden !== '' ? { orden: Number(extras.orden) } : {}),
    esComplemento: extras.esComplemento,
  }
}

export function desdeCategoria(c: CategoriaOpcion): ExtrasCategoria {
  return {
    categoriaPadreId: c.categoriaPadreId ? String(c.categoriaPadreId) : '',
    orden: c.orden !== undefined ? String(c.orden) : '',
    esComplemento: Boolean(c.esComplemento),
  }
}

interface CamposCategoriaProps {
  categorias: CategoriaOpcion[]
  /** La categoría que se está editando (no puede ser su propio padre) */
  idActual?: number
  valor: ExtrasCategoria
  onChange: (valor: ExtrasCategoria) => void
}

export default function CamposCategoria({ categorias, idActual, valor, onChange }: CamposCategoriaProps) {
  // Solo se puede colgar de una categoría principal
  const posiblesPadres = categorias.filter((c) => !c.categoriaPadreId && c.id !== idActual)

  return (
    <>
      <div className="mb-4">
        <label htmlFor="categoria-padre" className="mb-2 block font-medium">Depende de (opcional)</label>
        <select
          id="categoria-padre"
          value={valor.categoriaPadreId}
          onChange={(e) => onChange({ ...valor, categoriaPadreId: e.target.value })}
          className="w-full rounded border px-3 py-2"
        >
          <option value="">Ninguna (categoría principal)</option>
          {posiblesPadres.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-600">
          Por ejemplo, Café y Menú Café dependen de Cafetería, que se muestra como una sola tarjeta en el inicio.
          La categoría principal no puede tener productos propios.
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="categoria-orden" className="mb-2 block font-medium">Orden (opcional)</label>
        <input
          id="categoria-orden"
          type="number"
          min={0}
          max={100000}
          value={valor.orden}
          onChange={(e) => onChange({ ...valor, orden: e.target.value })}
          placeholder="Al final"
          className="w-full rounded border px-3 py-2"
        />
        <p className="mt-1 text-sm text-gray-600">De menor a mayor. Las categorías complemento siempre van al final.</p>
      </div>

      <label className="mb-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={valor.esComplemento}
          onChange={(e) => onChange({ ...valor, esComplemento: e.target.checked })}
          className="mt-1 h-5 w-5"
        />
        <span>
          <span className="block font-medium">Es un complemento</span>
          <span className="block text-sm text-gray-600">
            Salsas y similares: tienen un tope por pedido, no pueden ser todo el pedido, no se sugieren en el carrito
            y no cuentan en el ranking de más pedidos.
          </span>
        </span>
      </label>
    </>
  )
}
