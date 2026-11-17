import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DESTACADOS, type Destacado } from '../../config/home'
import { useCatalogo } from '../../hooks/usePromociones'

const FONDO_RECUADRO: Record<Destacado['acento'], string> = {
  red: 'bg-brand-red',
  mustard: 'bg-brand-mustard',
  dark: 'bg-brand-dark',
}

const STYLES = {
  section: 'group/row relative overflow-hidden px-0 pb-16 lg:px-4',
  navBtn:
    'absolute top-[45%] z-30 grid h-10 w-10 place-items-center rounded-full border-2 border-brand-dark bg-white text-brand-dark shadow-sticker transition active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-40 disabled:shadow-none lg:hidden',
  trackBase:
    'mx-auto flex max-w-7xl flex-row gap-4 overflow-x-auto px-8 pb-4 sm:px-0 lg:grid lg:grid-cols-3 lg:gap-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  trackDragging: 'cursor-grabbing select-none scroll-auto',
  trackIdle: 'cursor-grab snap-x snap-mandatory scroll-smooth lg:cursor-default',
  slideItem: 'flex w-[calc(100vw-4rem)] shrink-0 snap-center justify-center px-1 sm:w-[calc(50vw-24px)] lg:w-auto lg:shrink lg:px-0',
  cardLink: 'group relative mx-auto block w-full max-w-[260px] shrink-0 snap-center select-none pb-6 pt-3 xs:max-w-[280px] lg:max-w-xs lg:shrink',
  cardFrame: 'relative grid aspect-square place-items-center rounded-[2.5rem] border-2 border-brand-dark transition-transform group-hover:rotate-0',
  cardBackdropCircle: 'absolute inset-[7%] rounded-full bg-black/15',
  cardImage: 'relative w-[85%] object-contain drop-shadow-2xl transition-transform group-hover:scale-105',
  sticker: 'pointer-events-none absolute bottom-0 rounded-2xl border-2 border-brand-dark bg-brand-cream px-4 py-3 text-brand-dark shadow-sticker',
  stickerEyebrow: 'text-[11px] font-bold uppercase tracking-wider text-brand-muted',
  stickerTitle: 'font-display text-xl font-extrabold leading-tight',
  badge:
    'pointer-events-none absolute top-0 grid h-20 w-20 place-items-center rounded-full border-[3px] border-brand-dark bg-brand-mustard p-2 text-center font-display text-sm font-extrabold leading-none text-brand-dark',
} as const

function DestacadoCard({ destacado, link }: { destacado: Destacado; link: string }) {
  const inv = destacado.invertido

  return (
    <Link to={link} className={STYLES.cardLink}>
      <div className={`${STYLES.cardFrame} ${inv ? '-rotate-3' : 'rotate-3'} ${FONDO_RECUADRO[destacado.acento]}`}>
        <div className={STYLES.cardBackdropCircle} />
        <img
          src={destacado.imagen}
          alt=""
          draggable="false"
          className={`${STYLES.cardImage} ${inv ? 'rotate-3' : '-rotate-3'}`}
        />
      </div>

      <div className={`${STYLES.sticker} ${inv ? '-right-2 rotate-6' : '-left-2 -rotate-6'}`}>
        <p className={STYLES.stickerEyebrow}>{destacado.sticker.eyebrow}</p>
        <p className={STYLES.stickerTitle}>{destacado.sticker.titulo}</p>
      </div>

      {destacado.badge && (
        <div className={`${STYLES.badge} ${inv ? '-left-2 -rotate-12' : '-right-2 rotate-12'}`}>
          {destacado.badge}
        </div>
      )}
    </Link>
  )
}

function DestacadosRow() {
  const { catalogo } = useCatalogo()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [isDown, setIsDown] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)
  const [puedeIrIzquierda, setPuedeIrIzquierda] = useState(false)
  const [puedeIrDerecha, setPuedeIrDerecha] = useState(true)

  const linkDe = (d: Destacado) => {
    const p = d.producto ? catalogo.find((x) => x.nombre === d.producto) : undefined
    return p ? `/producto/${p.id}` : d.link
  }

  const verificarLimitesScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setPuedeIrIzquierda(scrollLeft > 5)
    setPuedeIrDerecha(scrollLeft + clientWidth < scrollWidth - 5)
  }

  useEffect(() => {
    verificarLimitesScroll()
    window.addEventListener('resize', verificarLimitesScroll)
    return () => window.removeEventListener('resize', verificarLimitesScroll)
  }, [])

  const handleScroll = (direccion: 'izq' | 'der') => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    const esTablet = window.innerWidth >= 640 && window.innerWidth < 1024
    const cantidadDesplazar = esTablet ? clientWidth / 2 : clientWidth

    scrollRef.current.scrollTo({
      left: direccion === 'izq' ? scrollLeft - cantidadDesplazar : scrollLeft + cantidadDesplazar,
      behavior: 'smooth',
    })
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDown(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeftState(scrollRef.current.scrollLeft)
  }

  const onMouseLeaveOrUp = () => setIsDown(false)

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const caminar = (x - startX) * 1.3
    scrollRef.current.scrollLeft = scrollLeftState - caminar
    verificarLimitesScroll()
  }

  return (
    <section className={STYLES.section}>
      <button
        type="button"
        disabled={!puedeIrIzquierda}
        onClick={() => handleScroll('izq')}
        className={`${STYLES.navBtn} left-3`}
        aria-label="Desplazar izquierda"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        disabled={!puedeIrDerecha}
        onClick={() => handleScroll('der')}
        className={`${STYLES.navBtn} right-3`}
        aria-label="Desplazar derecha"
      >
        <ChevronRight size={20} />
      </button>

      <div
        ref={scrollRef}
        onScroll={verificarLimitesScroll}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeaveOrUp}
        onMouseUp={onMouseLeaveOrUp}
        onMouseMove={onMouseMove}
        className={`${STYLES.trackBase} ${isDown ? STYLES.trackDragging : STYLES.trackIdle}`}
      >
        {DESTACADOS.map((d) => (
          <div key={d.id} className={STYLES.slideItem}>
            <DestacadoCard destacado={d} link={linkDe(d)} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default DestacadosRow
