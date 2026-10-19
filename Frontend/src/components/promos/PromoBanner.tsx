import { ShoppingBag } from 'lucide-react'
import CategoryIcon from '../icons/CategoryIcon'
import { formatearPrecio } from '../../utils/precio'
import { resumenLineas, type PromoResuelta } from '../../utils/promosUtils'
import type { Promo } from '../../types/promo'

export type TonoPromo = 'rojo' | 'oscuro' | 'mostaza'

const TONOS: Record<TonoPromo, { fondo: string; texto: string; suave: string; boton: string; etiqueta: string }> = {
  rojo: { fondo: 'bg-brand-red', texto: 'text-white', suave: 'text-white/85', boton: 'bg-brand-cream text-brand-dark', etiqueta: 'bg-brand-dark text-brand-mustard' },
  oscuro: { fondo: 'bg-brand-dark', texto: 'text-brand-cream', suave: 'text-brand-cream/75', boton: 'bg-brand-red text-white', etiqueta: 'bg-brand-mustard text-brand-dark' },
  mostaza: { fondo: 'bg-brand-mustard', texto: 'text-brand-dark', suave: 'text-brand-dark/80', boton: 'bg-brand-dark text-brand-cream', etiqueta: 'bg-brand-dark text-brand-mustard' },
}

interface Props {
  promo: Promo
  resuelta: PromoResuelta
  /** Texto chico de arriba: "Martes", "Hoy", ... */
  etiqueta: string
  tono?: TonoPromo
  cargando?: boolean
  /** Si viene, el botón queda deshabilitado con este texto (ej: promo de otro día) */
  deshabilitado?: string
  onPedir: () => void
}

// Bloque grande de una promo (mismo estilo que la promo destacada del Home):
// título, qué incluye, precio con descuento y la foto con el círculo del descuento
function PromoBanner({ promo, resuelta, etiqueta, tono = 'rojo', cargando, deshabilitado, onPedir }: Props) {
  const t = TONOS[tono]
  const [principal, segunda] = resuelta.lineas
  const ahorro = resuelta.totalLista - resuelta.total

  return (
    <article className={`flex flex-wrap overflow-hidden rounded-[2.25rem] border-2 border-brand-dark ${t.fondo} ${t.texto}`}>
      <div className="flex flex-1 basis-80 flex-col items-start gap-4 p-7 sm:p-10">
        <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider ${t.etiqueta}`}>{etiqueta}</span>
        <h3 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">{promo.titulo}</h3>
        <p className={`max-w-md text-lg ${t.suave}`}>{promo.detalle}</p>
        {resuelta.lineas.length > 0 && <p className={`text-sm font-semibold ${t.suave}`}>Incluye: {resumenLineas(resuelta.lineas)}</p>}

        {resuelta.disponible && (
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-3xl font-extrabold">{resuelta.total === 0 ? 'Gratis' : formatearPrecio(resuelta.total)}</span>
            {ahorro > 0 && <s className={`font-bold ${t.suave}`}>{formatearPrecio(resuelta.totalLista)}</s>}
          </div>
        )}

        <button
          type="button"
          onClick={onPedir}
          disabled={cargando || Boolean(deshabilitado) || !resuelta.disponible}
          className={`inline-flex min-h-12 items-center gap-2 rounded-full px-6 font-bold transition-transform hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${t.boton}`}
        >
          <ShoppingBag className="h-5 w-5" />
          {cargando ? 'Cargando…' : deshabilitado ?? (resuelta.disponible ? 'La quiero' : 'No disponible en tu zona')}
        </button>
      </div>

      <div className="relative grid min-h-64 flex-1 basis-72 place-items-center bg-black/15 p-8">
        {principal?.producto.imagen ? (
          <img src={principal.producto.imagen} alt="" className="w-full max-w-[13rem] object-contain drop-shadow-2xl sm:max-w-xs" />
        ) : (
          <CategoryIcon icono="generico" className="h-24 w-24 opacity-60" />
        )}
        {segunda?.producto.imagen && (
          <img
            src={segunda.producto.imagen}
            alt=""
            className="absolute bottom-6 left-6 w-24 rounded-3xl border-2 border-brand-dark bg-brand-cream object-contain p-2 sm:w-28"
          />
        )}
        <div className="absolute right-6 top-6 grid h-28 w-28 -rotate-12 place-items-center rounded-full border-[3px] border-brand-dark bg-brand-mustard text-center font-display font-extrabold leading-none text-brand-dark sm:h-32 sm:w-32">
          <span>
            <span className="block text-4xl">{promo.destacado}</span>
            {promo.destacado.endsWith('%') && <span className="block text-sm">OFF</span>}
          </span>
        </div>
      </div>
    </article>
  )
}

export default PromoBanner
