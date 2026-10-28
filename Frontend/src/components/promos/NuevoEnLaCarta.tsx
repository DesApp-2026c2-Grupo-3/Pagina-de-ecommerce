import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import CategoryIcon from '../icons/CategoryIcon'
import { formatearPrecio } from '../../utils/precio'
import type { ProductoBackend } from '../../types/product'

// Combo que se presenta como recién agregado a la carta (se busca por nombre exacto)
const PRODUCTO_NUEVO = 'Combo Abominación'

interface Props {
  catalogo: ProductoBackend[]
}

// "Nuevo en la carta": presenta un combo como lanzamiento, con link a su detalle para armarlo
function NuevoEnLaCarta({ catalogo }: Props) {
  const producto = catalogo.find((p) => p.nombre === PRODUCTO_NUEVO)
  if (!producto) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pt-14" aria-labelledby="nuevo-en-la-carta">
      <div className="flex flex-wrap overflow-hidden rounded-[2.25rem] border-2 border-brand-dark bg-white shadow-sticker">
        <div className="relative grid min-h-56 min-w-0 flex-1 basis-64 place-items-center bg-brand-mustard p-6 sm:min-h-64 sm:p-8">          
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.nombre} className="w-full max-w-xs object-contain drop-shadow-2xl" />
          ) : (
            <CategoryIcon icono="combo" className="h-24 w-24" />
          )}
          <span className="absolute left-6 top-6 -rotate-6 rounded-full border-2 border-brand-dark bg-brand-red px-4 py-1.5 font-display text-lg font-extrabold uppercase tracking-wide text-white">
            Nuevo
          </span>
        </div>

        <div className="flex min-w-0 flex-1 basis-64 flex-col items-start justify-center gap-4 p-6 sm:p-10">          
          <span className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-brand-red">
            <Sparkles className="h-4 w-4" /> Recién llegado a la carta
          </span>
          <h2 id="nuevo-en-la-carta" className="break-words font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">            
            {producto.nombre}
          </h2>
          {producto.descripcion && <p className="max-w-md text-lg text-brand-muted">{producto.descripcion}</p>}
          <p className="font-display text-3xl font-extrabold">Desde {formatearPrecio(Number(producto.precio))}</p>
          <Link
            to={`/producto/${producto.id}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-dark px-6 font-bold text-brand-cream transition-transform hover:translate-y-0.5"
          >
            Armalo <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default NuevoEnLaCarta