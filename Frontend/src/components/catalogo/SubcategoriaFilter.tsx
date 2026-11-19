import { useRef, useState } from 'react'

interface Props {
  subgrupos: { slug: string; nombre: string }[]
  seleccionado: string | null
  onSeleccionar: (slug: string | null) => void
}

const STYLES = {
  wrapper: 'flex w-full justify-center',
  track:
    'inline-flex max-w-full cursor-grab items-center divide-x-2 divide-brand-dark overflow-x-auto rounded-full border-2 border-brand-dark bg-white [scrollbar-width:none] [-ms-overflow-style:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden',
  base: 'h-8 shrink-0 select-none px-2.5 text-xs font-bold leading-none transition-colors min-[360px]:h-9 min-[360px]:px-3.5 min-[360px]:text-[13px] min-[480px]:h-10 min-[480px]:px-4 min-[480px]:text-sm',
  activo: 'bg-brand-dark text-brand-cream',
  inactivo: 'bg-white text-brand-dark hover:bg-brand-sand',
} as const

function SubcategoriaFilter({ subgrupos, seleccionado, onSeleccionar }: Props) {
  const opciones = [{ slug: null, nombre: 'Todos' },...subgrupos ]

  const scrollRef = useRef<HTMLDivElement>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [inicioX, setInicioX] = useState(0)
  const [scrollIzquierda, setScrollIzquierda] = useState(0)
  const [seMovio, setSeMovio] = useState(false)

  const alPresionarMouse = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setArrastrando(true)
    setSeMovio(false)
    setInicioX(e.pageX - scrollRef.current.offsetLeft)
    setScrollIzquierda(scrollRef.current.scrollLeft)
  }

  const alMoverMouse = (e: React.MouseEvent) => {
    if (!arrastrando || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const distancia = (x - inicioX) * 1.5
    if (Math.abs(distancia) > 5) setSeMovio(true)
    scrollRef.current.scrollLeft = scrollIzquierda - distancia
  }

  const alSoltarMouse = () => {
    setArrastrando(false)
  }

  return (
    <div className={STYLES.wrapper}>
      <div
        ref={scrollRef}
        role="group"
        aria-label="Subcategorías"
        onMouseDown={alPresionarMouse}
        onMouseMove={alMoverMouse}
        onMouseUp={alSoltarMouse}
        onMouseLeave={alSoltarMouse}
        className={STYLES.track}
      >
        {opciones.map((s) => {
          const elegida = seleccionado === s.slug
          return (
            <button
              key={s.slug ?? 'todo'}
              type="button"
              onClick={() => {
                if (!seMovio) onSeleccionar(s.slug)
              }}
              aria-pressed={elegida}
              className={`${STYLES.base} ${elegida ? STYLES.activo : STYLES.inactivo}`}
            >
              {s.nombre}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SubcategoriaFilter
