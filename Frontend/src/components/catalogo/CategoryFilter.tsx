import type { Category } from '../../types/product'
import FilaDeslizable from '../ui/FilaDeslizable'
import { useAuth } from '../../context/AuthContext'

interface Props {
  categorias: Category[]
  seleccionada: number | null
  onSeleccionar: (id: number | null) => void
}

// max-w-[20ch]: la etiqueta tiene un ancho máximo (unos 16 caracteres de texto, sin contar el relleno del botón).
// Si el nombre no entra, baja a una segunda línea ("Combos de" / "Cafetería") en vez de agrandar el botón.
// "ch" es el ancho de un "0" en la fuente: para cambiar el límite, subí o bajá ese número.
const base =
  'max-w-[20ch] shrink-0 rounded-2xl px-4 py-2.5 text-center text-sm font-bold leading-tight text-balance transition-colors'
const activo = 'bg-gradient-to-b from-red-500 to-red-700 text-white'
const inactivo = 'text-brand-dark hover:bg-gradient-to-b from-red-100 to-red-200 '

// Chips de categorías dentro de la barra blanca tipo sticker
function CategoryFilter({ categorias, seleccionada, onSeleccionar }: Props) {
  const opciones = [{ id: null, nombre: 'Todos' }, ...categorias]
  // La pista de "deslizá" se recuerda por usuario (invitado si no inició sesión)
  const { user } = useAuth()
  const idUsuario = user?.id ? String(user.id) : undefined

  return (
    <FilaDeslizable
      key={idUsuario ?? 'invitado'}
      userId={idUsuario}
      className="scrollbar-hide flex gap-1 overflow-x-auto rounded-3xl border-2 border-brand-dark bg-white p-2 shadow-sticker"
    >
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
    </FilaDeslizable>
  )
}

export default CategoryFilter