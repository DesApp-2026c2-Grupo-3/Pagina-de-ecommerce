import { useCallback, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TOLERANCIA_PX = 5

const STYLES = {
  wrapper: 'relative isolate w-full max-w-full overflow-hidden',
  arrowBtn:
    'absolute top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-2 border-brand-dark bg-white text-brand-dark shadow-sticker transition active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-40 disabled:shadow-none',
  track:
    'flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-3 pt-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
} as const

interface CarruselFlechasProps {
  children: ReactNode
  claseLista?: string
  claseOcultarFlechas?: string
  etiqueta: string
}

export default function CarruselFlechas({
  children,
  claseLista = '',
  claseOcultarFlechas = 'lg:hidden',
  etiqueta,
}: CarruselFlechasProps) {
  const pistaRef = useRef<HTMLDivElement>(null)
  const [puedeIrIzquierda, setPuedeIrIzquierda] = useState(false)
  const [puedeIrDerecha, setPuedeIrDerecha] = useState(false)

  const verificarLimites = useCallback(() => {
    const pista = pistaRef.current
    if (!pista) return
    const { scrollLeft, scrollWidth, clientWidth } = pista

    setPuedeIrIzquierda(scrollLeft > TOLERANCIA_PX)
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

  function mover(direccion: -1 | 1) {
    const pista = pistaRef.current
    if (!pista) return
    const primera = pista.firstElementChild as HTMLElement | null
    const segunda = primera?.nextElementSibling as HTMLElement | null
    const paso = (primera && segunda ? segunda.offsetLeft - primera.offsetLeft : 0) || pista.clientWidth
    pista.scrollBy({ left: direccion * paso, behavior: 'smooth' })
  }

  return (
    <div className={STYLES.wrapper} role="region" aria-roledescription="carrusel" aria-label={etiqueta}>
      <button
        type="button"
        disabled={!puedeIrIzquierda}
        onClick={() => mover(-1)}
        className={`${STYLES.arrowBtn} left-2 ${claseOcultarFlechas}`}
        aria-label="Ver anteriores"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        disabled={!puedeIrDerecha}
        onClick={() => mover(1)}
        className={`${STYLES.arrowBtn} right-2 ${claseOcultarFlechas}`}
        aria-label="Ver siguientes"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>

      <div ref={pistaRef} onScroll={verificarLimites} className={`${STYLES.track} ${claseLista}`}>
        {children}
      </div>
    </div>
  )
}
