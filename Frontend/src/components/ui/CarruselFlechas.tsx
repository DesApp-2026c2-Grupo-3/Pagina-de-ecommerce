import { useCallback, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TOLERANCIA_PX = 5

interface CarruselFlechasProps {
  children: ReactNode
  /** Clases de la pista. */
  claseLista?: string
  /** Clases de la pantalla desde la que las flechas desaparecen (por defecto, desde lg) */
  claseOcultarFlechas?: string
  /** Nombre del carrusel para los lectores de pantalla */
  etiqueta: string
}

export default function CarruselFlechas({
  children,
  claseLista = '',
  claseOcultarFlechas = 'lg:hidden',
  etiqueta,
}: CarruselFlechasProps) {
  const pistaRef = useRef<HTMLDivElement>(null)
  const [puedeIrIzquierda, setPuredeIrIzquierda] = useState(false)
  const [puedeIrDerecha, setPuedeIrDerecha] = useState(false)

  const verificarLimites = useCallback(() => {
    const pista = pistaRef.current
    if (!pista) return
    const { scrollLeft, scrollWidth, clientWidth } = pista
    
    // Control de flechas prendidas/apagadas
    setPuredeIrIzquierda(scrollLeft > TOLERANCIA_PX)
    setPuedeIrDerecha(scrollLeft + clientWidth < scrollWidth - TOLERANCIA_PX)
  }, [])

  useEffect(() => {
    verificarLimites()
    const pista = pistaRef.current
    window.addEventListener('resize', verificarLimites)
    
    if (pista) {
      const observador = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(verificarLimites)
      observador?.observe(pista)
      Array.from(pista.children).forEach((hijo) => observador?.observe(hijo))
      return () => {
        window.removeEventListener('resize', verificarLimites)
        observador?.disconnect()
      }
    }
  }, [verificarLimites, children])

  // 🛠️ FIX DE DESPLAZAMIENTO: Avanza de a una tarjeta midiendo la distancia real del contenedor hijo
  function mover(direccion: -1 | 1) {
    const pista = pistaRef.current
    if (!pista) return
    const primera = pista.firstElementChild as HTMLElement | null
    const segunda = primera?.nextElementSibling as HTMLElement | null
    const paso = (primera && segunda ? segunda.offsetLeft - primera.offsetLeft : 0) || pista.clientWidth
    pista.scrollBy({ left: direccion * paso, behavior: 'smooth' })
  }

  const estiloFlecha =
    'absolute top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full border-2 border-brand-dark bg-white text-brand-dark shadow-sticker transition active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-0 disabled:shadow-none'

  return (
    <div className="relative w-full max-w-full overflow-hidden isolate" role="region" aria-roledescription="carrusel" aria-label={etiqueta}>
      
      {/* Botón Izquierda */}
      
      <button
        type="button"
        disabled={!puedeIrIzquierda}
        onClick={() => mover(-1)}
        className={`${estiloFlecha} left-2 ${claseOcultarFlechas}`}
        aria-label="Ver anteriores"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>

      {/* Botón Derecha */}
      <button
        type="button"
        disabled={!puedeIrDerecha}
        onClick={() => mover(1)}
        className={`${estiloFlecha} right-2 ${claseOcultarFlechas}`}
        aria-label="Ver siguientes"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>

      {/* Pista nativa con scroll-smooth para las flechas y snap-mandatory para el dedo */}
      <div
        ref={pistaRef}
        onScroll={verificarLimites}
        className={`flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-3 pt-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${claseLista}`}
      >
        {children}
      </div>

    </div>
  )
}
