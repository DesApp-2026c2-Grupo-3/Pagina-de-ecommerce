interface Props {
  subgrupos: { slug: string; nombre: string }[]
  seleccionado: string | null
  onSeleccionar: (slug: string | null) => void
}

const base =
  'min-h-10 rounded-full border-2 border-brand-dark px-4 py-1.5 text-sm font-bold leading-tight transition-colors'
const activo = 'bg-brand-dark text-brand-cream'
const inactivo = 'bg-white text-brand-dark hover:bg-brand-sand'

// Botones de subcategoría (Carne vacuna / Pollo / Veggie...). Bajan de línea en vez de deslizarse,
// así en el celular se ven todos de una vez.
function SubcategoriaFilter({ subgrupos, seleccionado, onSeleccionar }: Props) {
  const opciones = [{ slug: null, nombre: 'Todo' }, ...subgrupos]
  return (
    <div role="group" aria-label="Subcategorías" className="mt-4 flex flex-wrap gap-2">
      {opciones.map((s) => {
        const elegida = seleccionado === s.slug
        return (
          <button
            key={s.slug ?? 'todo'}
            type="button"
            onClick={() => onSeleccionar(s.slug)}
            aria-pressed={elegida}
            className={`${base} ${elegida ? activo : inactivo}`}
          >
            {s.nombre}
          </button>
        )
      })}
    </div>
  )
}

export default SubcategoriaFilter
