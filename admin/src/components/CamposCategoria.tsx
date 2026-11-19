// Campos de la categoría que se comparten entre "Nueva" y "Editar": de quién depende y orden

export interface ExtrasCategoria {
  /** '' = categoría principal */
  categoriaPadreId: string
  /** '' = al final (solo al crear) */
  orden: string
}

export const extrasVacios: ExtrasCategoria = { categoriaPadreId: '', orden: '' }

export interface CategoriaOpcion {
  id: number
  nombre: string
  categoriaPadreId?: number | null
  orden?: number
}

// Lo que se manda al backend (el nombre va aparte)
export function extrasAPedido(extras: ExtrasCategoria) {
  return {
    categoriaPadreId: extras.categoriaPadreId === '' ? null : Number(extras.categoriaPadreId),
    ...(extras.orden !== '' ? { orden: Number(extras.orden) } : {}),
  }
}

export function desdeCategoria(c: CategoriaOpcion): ExtrasCategoria {
  return {
    categoriaPadreId: c.categoriaPadreId ? String(c.categoriaPadreId) : '',
    orden: c.orden !== undefined ? String(c.orden) : '',
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
          Por ejemplo, Café y Desayunos y meriendas dependen de Cafetería, que se muestra como una sola tarjeta en el inicio.
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
        <p className="mt-1 text-sm text-gray-600">De menor a mayor.</p>
      </div>
    </>
  )
}
