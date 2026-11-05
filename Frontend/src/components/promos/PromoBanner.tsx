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

function PromoBanner({ promo, resuelta, etiqueta, tono = 'rojo', cargando, deshabilitado, onPedir }: Props) {
  const t = TONOS[tono]
  const [principal, segunda] = resuelta.lineas
  const ahorro = resuelta.totalLista - resuelta.total

  return (
    /* 
      1. SOLUCIÓN COMPACTA HORIZONTAL: Usamos 'grid grid-cols-2' en la base. 
         Esto fuerza a que tanto en celulares chicos como en tablets la pantalla esté dividida a la mitad.
         En md:flex devolvemos tu comportamiento elástico original de escritorio.
    */
    <article className={`grid grid-cols-2 overflow-hidden rounded-[2.25rem] border-2 border-brand-dark md:flex md:flex-wrap ${t.fondo} ${t.texto}`}>
      
      {/* Mitad Izquierda: Texto y Botón */}
      <div className="flex flex-col items-start gap-2 p-5 pr-2 sm:p-8 md:flex-1 md:basis-80 md:p-10">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider md:text-xs ${t.etiqueta}`}>{etiqueta}</span>
        <h3 className="font-display text-2xl font-extrabold leading-[0.95] tracking-tight sm:text-3xl md:text-5xl">{promo.titulo}</h3>
        <p className={`max-w-md text-xs sm:text-sm md:text-lg ${t.suave}`}>{promo.detalle}</p>
        {resuelta.lineas.length > 0 && <p className={`text-[11px] font-semibold md:text-sm ${t.suave}`}>Incluye: {resumenLineas(resuelta.lineas)}</p>}

        {resuelta.disponible && (
          <div className="flex flex-wrap items-baseline gap-x-2 pt-1">
            <span className="font-display text-xl font-extrabold sm:text-2xl md:text-3xl">{resuelta.total === 0 ? 'Gratis' : formatearPrecio(resuelta.total)}</span>
            {ahorro > 0 && <s className={`text-xs font-bold ${t.suave}`}>{formatearPrecio(resuelta.totalLista)}</s>}
          </div>
        )}

        <button
          type="button"
          onClick={onPedir}
          disabled={cargando || Boolean(deshabilitado) || !resuelta.disponible}
          className={`mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-transform hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm md:min-h-12 md:px-6 md:text-base ${t.boton}`}
        >
          <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
          {cargando ? 'Cargando…' : deshabilitado ?? (resuelta.disponible ? 'La quiero' : 'No disponible en tu zona')}
        </button>
      </div>

      {/* Mitad Derecha: Imagen Flotante con Fondo Limpio Integrado */}
      <div className="relative grid w-full place-items-center p-4 md:relative md:flex-1 md:basis-72 md:bg-black/15 md:p-8 md:min-h-64">
        
        {/* Hamburguesa principal contenida perfectamente al alto disponible */}
        {principal?.producto.imagen ? (
          <img 
            src={principal.producto.imagen} 
            alt="" 
            className="h-auto w-full max-w-[8.5rem] object-contain drop-shadow-2xl sm:max-w-[11rem] md:max-w-xs" 
          />
        ) : (
          <CategoryIcon icono="generico" className="h-24 w-24 opacity-60" />
        )}

        {/* Producto secundario reubicado sutilmente en celular */}
        {segunda?.producto.imagen && (
          <img
            src={segunda.producto.imagen}
            alt=""
            className="absolute bottom-2 left-2 w-12 rounded-xl border border-brand-dark bg-brand-cream object-contain p-1 sm:w-16 md:absolute md:bottom-6 md:left-6 md:w-28 md:rounded-3xl md:border-2 md:p-2"
          />
        )}
        
        {/* Círculo de descuento adaptado para no asfixiar el espacio de la mitad */}
        <div className="absolute right-2 top-2 grid h-14 w-14 -rotate-12 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard text-center font-display font-extrabold leading-none text-brand-dark sm:h-20 sm:w-20 md:absolute md:right-6 md:top-6 md:h-32 md:w-32 md:border-[3px]">
          <span>
            <span className="block text-sm sm:text-xl md:text-4xl">{promo.destacado}</span>
            {promo.destacado.endsWith('%') && <span className="block text-[8px] sm:text-[10px] md:text-sm">OFF</span>}
          </span>
        </div>

      </div>
    </article>
  )
}

export default PromoBanner
