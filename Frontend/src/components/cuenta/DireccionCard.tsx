import { BriefcaseBusiness, House, MapPin, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import type { Address } from '../../types/address'

interface Props {
  direccion: Address
  onEditar: () => void
  onEliminar: () => void
  onPredeterminada: () => void
}

// Ícono según el nombre que le puso el usuario (Casa, Trabajo, u otro)
function IconoAlias({ alias }: { alias: string }) {
  const nombre = alias.toLowerCase()
  const clase = 'h-6 w-6 text-brand-dark'
  if (/casa|hogar|depto|departamento/.test(nombre)) return <House className={clase} strokeWidth={2.2} />
  if (/trabajo|oficina|laburo/.test(nombre)) return <BriefcaseBusiness className={clase} strokeWidth={2.2} />
  return <MapPin className={clase} strokeWidth={2.2} />
}

const accion = 'inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-[13px] font-bold transition-colors sm:px-3 sm:text-sm'

// Tarjeta de una dirección guardada. La predeterminada se destaca con sombra y el ícono en mostaza.
function DireccionCard({ direccion, onEditar, onEliminar, onPredeterminada }: Props) {
  const { alias, calle, numero, piso, localidad, provincia, codigoPostal, predeterminada } = direccion
  const zona = [localidad, provincia].filter(Boolean).join(', ')

  return (
    <article
      className={`flex flex-wrap items-center gap-4 rounded-3xl border-2 border-brand-dark bg-white p-5 sm:gap-5 ${
        predeterminada ? 'shadow-sticker' : ''
      }`}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
          predeterminada ? 'bg-brand-mustard' : 'bg-brand-cream'
        }`}
      >
        <IconoAlias alias={alias} />
      </span>

      <div className="min-w-0 flex-1 basis-56">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight">{alias}</h2>
          {predeterminada && (
            <span className="rounded-full border-2 border-brand-dark bg-brand-mustard px-2.5 py-0.5 text-xs font-extrabold">
              Predeterminada
            </span>
          )}
        </div>
        <p className="mt-0.5 text-brand-dark/80">
          {calle} {numero}
          {piso && ` · ${piso}`}
        </p>
        {(zona || codigoPostal) && (
          <p className="text-sm text-brand-muted">
            {zona}
            {codigoPostal && ` (${codigoPostal})`}
          </p>
        )}
        {direccion.latitud == null && (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-brand-red">
            <TriangleAlert className="h-4 w-4" /> Sin ubicación en el mapa. Editala para completarla.
          </p>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center justify-between border-t-2 border-dashed border-brand-sand pt-3 sm:w-auto sm:justify-start sm:border-0 sm:pt-0">
        {!predeterminada && (
          <button type="button" onClick={onPredeterminada} className={`${accion} text-brand-dark hover:bg-brand-cream`}>
            Usar por defecto
          </button>
        )}
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Editar ${alias}`}
          className={`${accion} text-brand-dark hover:bg-brand-cream`}
        >
          <Pencil className="h-4 w-4" /> Editar
        </button>
        <button
          type="button"
          onClick={onEliminar}
          aria-label={`Eliminar ${alias}`}
          className={`${accion} text-brand-red hover:bg-brand-red/10`}
        >
          <Trash2 className="h-4 w-4" /> Eliminar
        </button>
      </div>
    </article>
  )
}

export default DireccionCard