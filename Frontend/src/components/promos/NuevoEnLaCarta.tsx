import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import CategoryIcon from '../icons/CategoryIcon'
import { formatearPrecio } from '../../utils/precio'
import type { ProductoBackend } from '../../types/product'

// Combo que se presenta como recién agregado a la carta (se busca por nombre exacto)
const PRODUCTO_NUEVO = 'Combo Abominación'

const ESTILOS = {
  seccion: 'mx-auto max-w-6xl px-4 pt-14',
  card: 'grid grid-cols-2 overflow-hidden rounded-[2.25rem] border-2 border-brand-dark bg-white shadow-sticker md:flex md:flex-wrap',
  mediaCol:
    'relative grid w-full place-items-center bg-brand-mustard p-4 sm:p-6 md:min-h-64 md:flex-1 md:basis-64 md:p-8',
  imagen: 'h-auto w-full max-w-[8.5rem] object-contain drop-shadow-2xl sm:max-w-[11rem] md:max-w-xs',
  badgeNuevo:
    'absolute left-3 top-3 -rotate-6 rounded-full border-2 border-brand-dark bg-brand-red px-3 py-1 font-display text-sm font-extrabold uppercase tracking-wide text-white sm:left-6 sm:top-6 sm:px-4 sm:py-1.5 sm:text-lg',
  infoCol: 'flex min-w-0 flex-col items-start justify-center gap-2 p-5 pl-3 sm:p-8 md:flex-1 md:basis-64 md:p-10',
  subtitulo: 'inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-brand-red sm:text-xs',
  subtituloIcono: 'h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4',
  titulo: 'break-words font-display text-2xl font-extrabold leading-[0.95] tracking-tight sm:text-3xl md:text-5xl',
  descripcion: 'line-clamp-3 max-w-md text-xs text-brand-muted sm:text-sm md:line-clamp-none md:text-lg',
  precio: 'font-display text-xl font-extrabold sm:text-2xl md:text-3xl',
  ctaBtn:
    'mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-dark px-4 text-xs font-bold text-brand-cream transition-transform hover:translate-y-0.5 sm:text-sm md:min-h-12 md:px-6 md:text-base',
  ctaIcono: 'h-4 w-4 md:h-5 md:w-5',
} as const

interface Props {
  catalogo: ProductoBackend[]
}

// "Nuevo en la carta": presenta un combo como lanzamiento, con link a su detalle para armarlo
function NuevoEnLaCarta({ catalogo }: Props) {
  const producto = catalogo.find((p) => p.nombre === PRODUCTO_NUEVO)
  if (!producto) return null

  return (
    <section className={ESTILOS.seccion} aria-labelledby="nuevo-en-la-carta">
      <div className={ESTILOS.card}>
        {/* Mitad Izquierda: Bloque Mostaza con el Combo */}
        <div className={ESTILOS.mediaCol}>
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.nombre} className={ESTILOS.imagen} />
          ) : (
            <CategoryIcon icono="combo" className="h-24 w-24" />
          )}

          <span className={ESTILOS.badgeNuevo}>Nuevo</span>
        </div>

        {/* Mitad Derecha: Datos y Enlace */}
        <div className={ESTILOS.infoCol}>
          <span className={ESTILOS.subtitulo}>
            <Sparkles className={ESTILOS.subtituloIcono} /> Recién llegado a la carta
          </span>
          <h2 id="nuevo-en-la-carta" className={ESTILOS.titulo}>
            {producto.nombre}
          </h2>
          {producto.descripcion && <p className={ESTILOS.descripcion}>{producto.descripcion}</p>}
          <p className={ESTILOS.precio}>Desde {formatearPrecio(Number(producto.precio))}</p>

          <Link to={`/producto/${producto.id}`} className={ESTILOS.ctaBtn}>
            Armalo <ArrowRight className={ESTILOS.ctaIcono} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default NuevoEnLaCarta
