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

function NuevoEnLaCarta({ catalogo }: Props) {
  const producto = catalogo.find((p) => p.nombre === PRODUCTO_NUEVO)
  if (!producto) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pt-14" aria-labelledby="nuevo-en-la-carta">
      {/* 
        1. SOLUCIÓN COMPACTA HORIZONTAL: Cambiamos 'flex flex-wrap' por 'grid grid-cols-2' en la base.
           Esto garantiza que en celulares y pantallas intermedias el banner esté perfectamente partido al medio de forma horizontal.
           En md:flex devolvemos tu comportamiento elástico original para escritorios.
      */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[2.25rem] border-2 border-brand-dark bg-white shadow-sticker md:flex md:flex-wrap">
        
        {/* Mitad Izquierda (o Derecha): Bloque Mostaza con el Combo */}
        <div className="relative grid w-full place-items-center bg-brand-mustard p-4 sm:p-6 md:relative md:flex-1 md:basis-64 md:min-h-64 md:p-8">          
          {producto.imagen ? (
            /* Limitamos el tamaño en móvil para que encaje estéticamente sin desbordar el alto comprimido */
            <img src={producto.imagen} alt={producto.nombre} className="h-auto w-full max-w-[8.5rem] object-contain drop-shadow-2xl sm:max-w-[11rem] md:max-w-xs" />
          ) : (
            <CategoryIcon icono="combo" className="h-24 w-24" />
          )}
          
          {/* Etiqueta "Nuevo" adaptada para pantallas compactas */}
          <span className="absolute left-3 top-3 -rotate-6 rounded-full border-2 border-brand-dark bg-brand-red px-3 py-1 font-display text-sm font-extrabold uppercase tracking-wide text-white sm:left-6 sm:top-6 sm:px-4 sm:py-1.5 sm:text-lg">
            Nuevo
          </span>
        </div>

        {/* Mitad Derecha: Datos y Enlace */}
        <div className="flex flex-col items-start justify-center gap-2 p-5 pl-2 sm:p-8 md:flex-1 md:basis-64 md:p-10">          
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-brand-red sm:text-xs">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Recién llegado
          </span>
          <h2 id="nuevo-en-la-carta" className="break-words font-display text-2xl font-extrabold leading- tracking-tight sm:text-3xl md:text-5xl">            
            {producto.nombre}
          </h2>
          {producto.descripcion && <p className="max-w-md text-xs line-clamp-3 sm:text-sm md:text-lg md:line-clamp-none text-brand-muted">{producto.descripcion}</p>}
          <p className="font-display text-xl font-extrabold sm:text-2xl md:text-3xl">Desde {formatearPrecio(Number(producto.precio))}</p>
          
          <Link
            to={`/producto/${producto.id}`}
            className="mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-dark px-4 text-xs font-bold text-brand-cream transition-transform hover:translate-y-0.5 sm:text-sm md:min-h-12 md:px-6 md:text-base"
          >
            Armalo <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </div>

      </div>
    </section>
  )
}

export default NuevoEnLaCarta
