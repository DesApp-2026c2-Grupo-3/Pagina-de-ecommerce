interface Props {
  subgrupos: { slug: string; nombre: string }[]
  seleccionado: string | null
  onSeleccionar: (slug: string | null) => void
}

const base =
  'min-h-8 text-xs px-3 py-1 rounded-full border-2 border-brand-dark font-bold leading-tight transition-colors sm:min-h-10 sm:px-4 sm:py-1.5 sm:text-sm'
const activo = 'bg-brand-dark text-brand-cream'
const inactivo = 'bg-white text-brand-dark hover:bg-brand-sand'


// Botones de subcategoría (Carne vacuna / Pollo / Veggie...). Bajan de línea en vez de deslizarse,
// así en el celular se ven todos de una vez.
function SubcategoriaFilter({ subgrupos, seleccionado, onSeleccionar }: Props) {
  const opciones = [{ slug: null, nombre: 'Todo' }, ...subgrupos]
  return (
    <div role="group" aria-label="Subcategorías" className="mt-4 flex flex-wrap gap-1 md:gap-2">
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
