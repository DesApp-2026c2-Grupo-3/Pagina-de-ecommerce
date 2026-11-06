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

function DestacadoCard({ destacado, link }: { destacado: Destacado; link: string }) {
  const inv = destacado.invertido

  return (
    <Link 
      to={link} 
      className="group relative mx-auto block w-full max-w-[260px] xs:max-w-[280px] lg:max-w-xs pb-6 pt-3 snap-center shrink-0 lg:shrink select-none"
    >
      <div
        className={`relative grid aspect-square place-items-center rounded-[2.5rem] border-2 border-brand-dark transition-transform group-hover:rotate-0 ${
          inv ? '-rotate-3' : 'rotate-3'
        } ${FONDO_RECUADRO[destacado.acento]}`}
      >
        <div className="absolute inset-[7%] rounded-full bg-black/15" />
        <img
          src={destacado.imagen}
          alt=""
          draggable="false"
          className={`relative w-[85%] object-contain drop-shadow-2xl transition-transform group-hover:scale-105 ${
            inv ? 'rotate-3' : '-rotate-3'
          }`}
        />
      </div>

      <div
        className={`absolute bottom-0 rounded-2xl border-2 border-brand-dark bg-brand-cream px-4 py-3 text-brand-dark shadow-sticker pointer-events-none ${
          inv ? '-right-2 rotate-6' : '-left-2 -rotate-6'
        }`}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">{destacado.sticker.eyebrow}</p>
        <p className="font-display text-xl font-extrabold leading-tight">{destacado.sticker.titulo}</p>
      </div>

      {destacado.badge && (
        <div
          className={`absolute top-0 grid h-20 w-20 place-items-center rounded-full border-[3px] border-brand-dark bg-brand-mustard p-2 text-center font-display text-sm font-extrabold leading-none text-brand-dark pointer-events-none ${
            inv ? '-left-2 -rotate-12' : '-right-2 rotate-12'
          }`}
        >
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

  // Estados para controlar si las flechas están bloqueadas
  const [puedeIrIzquierda, setPuedeIrIzquierda] = useState(false)
  const [puedeIrDerecha, setPuedeIrDerecha] = useState(true)

  const linkDe = (d: Destacado) => {
    const p = d.producto ? catalogo.find((x) => x.nombre === d.producto) : undefined
    return p ? `/producto/${p.id}` : d.link
  }

  // Verifica los límites del scroll para deshabilitar las flechitas
  const verificarLimitesScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    
    // Dejamos un margen de tolerancia de 5px para lidiar con decimales de zoom o pantallas fraccionadas
    setPuedeIrIzquierda(scrollLeft > 5)
    setPuedeIrDerecha(scrollLeft + clientWidth < scrollWidth - 5)
  }

  useEffect(() => {
    // Verificar al cargar por primera vez
    verificarLimitesScroll()
    
    // Escuchar cambios de tamaño de ventana para recalcular las flechas
    window.addEventListener('resize', verificarLimitesScroll)
    return () => window.removeEventListener('resize', verificarLimitesScroll)
  }, [])

  const handleScroll = (direccion: 'izq' | 'der') => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    
    // En md avanzamos de a media pantalla (para pasar de a 1 tarjeta si se ven 2), en sm avanza completo
    const esTablet = window.innerWidth >= 640 && window.innerWidth < 1024
    const cantidadDesplazar = esTablet ? clientWidth / 2 : clientWidth

    scrollRef.current.scrollTo({
      left: direccion === 'izq' ? scrollLeft - cantidadDesplazar : scrollLeft + cantidadDesplazar,
      behavior: 'smooth'
    })
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDown(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeftState(scrollRef.current.scrollLeft)
  }

  const onMouseLeaveOrUp = () => {
    setIsDown(false)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const caminar = (x - startX) * 1.3
    scrollRef.current.scrollLeft = scrollLeftState - caminar
    verificarLimitesScroll()
  }

  return (
    <section className="group/row relative px-0 lg:px-4 pb-16 overflow-hidden">
      
      {/* Flecha Izquierda Condicional */}
      <button
        type="button"
        disabled={!puedeIrIzquierda}
        onClick={() => handleScroll('izq')}
        className="absolute left-3 top-[45%] z-30 grid h-10 w-10 place-items-center rounded-full border-2 border-brand-dark bg-white shadow-sticker text-brand-dark transition active:scale-95 disabled:opacity-40 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none lg:hidden"
        aria-label="Desplazar izquierda"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Flecha Derecha Condicional */}
      <button
        type="button"
        disabled={!puedeIrDerecha}
        onClick={() => handleScroll('der')}
        className="absolute right-3 top-[45%] z-30 grid h-10 w-10 place-items-center rounded-full border-2 border-brand-dark bg-white shadow-sticker text-brand-dark transition active:scale-95 disabled:opacity-40 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none lg:hidden"
        aria-label="Desplazar derecha"
      >
        <ChevronRight size={20} />
      </button>

      {/* 
        Contenedor Inteligente Multi-Ancho:
        - Escuchamos el evento `onScroll` para validar dinámicamente el estado de los extremos de las flechas.
        - gap-4 en mobile/tablet para darle un sutil aire en lugar de estar pegadas al 100%.
      */}
      <div 
        ref={scrollRef}
        onScroll={verificarLimitesScroll}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeaveOrUp}
        onMouseUp={onMouseLeaveOrUp}
        onMouseMove={onMouseMove}
        className={`mx-auto flex flex-row lg:grid lg:grid-cols-3 max-w-7xl gap-4 lg:gap-12 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isDown 
            ? 'cursor-grabbing select-none scroll-auto' 
            : 'cursor-grab lg:cursor-default snap-x snap-mandatory scroll-smooth'
        }`}
      >
        {/* 
          Estructura de anchos dinámicos:
          - w-[calc(100vw-32px)]: En mobile (< sm) ocupa casi toda la pantalla dejando ver que hay más.
          - sm:w-[calc(50vw-24px)]: En tablets y md (640px a 1024px) fuerza a que entren exactamente 2 imágenes por fila de forma impecable.
          - lg:w-auto: En desktop vuelve a su comportamiento de grilla estándar.
        */}
        {DESTACADOS.map((d) => (
          <div 
            key={d.id} 
            className="w-[calc(100vw-32px)] sm:w-[calc(50vw-24px)] lg:w-auto px-2 lg:px-0 shrink-0 lg:shrink flex justify-center snap-center"
          >
            <DestacadoCard destacado={d} link={linkDe(d)} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default DestacadosRow
