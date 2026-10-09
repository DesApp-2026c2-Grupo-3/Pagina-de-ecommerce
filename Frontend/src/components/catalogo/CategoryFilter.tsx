import type { Category } from '../../types/product'

interface Props {
  categorias: Category[]
  seleccionada: number | null
  onSeleccionar: (id: number | null) => void
}

const base = 'shrink-0 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors'
const activo = 'bg-brand-red text-white'
const inactivo = 'text-brand-dark hover:bg-brand-cream'

// Chips de categorías dentro de la barra blanca tipo sticker
function CategoryFilter({ categorias, seleccionada, onSeleccionar }: Props) {
  const opciones = [{ id: null, nombre: 'Todos' }, ...categorias]

  return (
    <div className="scrollbar-hide flex gap-1 overflow-x-auto rounded-3xl md:flex-wrap md:overflow-visible border-2 border-brand-dark bg-white p-2 shadow-sticker">
      {opciones.map((categoria) => {
        const elegida = seleccionada === categoria.id
        return (
          <button
            key={categoria.id ?? 'todos'}
            type="button"
            onClick={() => onSeleccionar(categoria.id)}
            aria-pressed={elegida}
            className={`${base} ${elegida ? activo : inactivo}`}
          >
            {categoria.nombre}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryFilter