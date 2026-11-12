import { useRef, useState } from 'react'

interface Props {
  subgrupos: { slug: string; nombre: string }[]
  seleccionado: string | null
  onSeleccionar: (slug: string | null) => void
}

// Compacto debajo de 480px (fuente 13px y padding reducido) y amplio desde 480px en adelante
const base =
  'min-h-8 text-[13px] px-2.5 py-1 font-bold leading-tight transition-colors shrink-0 select-none min-[393px]:min-h-9 min-[393px]:px-3.5 min-[393px]:py-1.5 min-[480px]:min-h-10 min-[480px]:px-4 min-[480px]:text-sm'


const activo = 'bg-brand-red text-brand-cream'
const inactivo = 'bg-white text-brand-dark hover:bg-brand-sand'

function SubcategoriaFilter({ subgrupos, seleccionado, onSeleccionar }: Props) {
  const opciones = [{ slug: null, nombre: 'Todo' }, ...subgrupos]
  
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
    <div
      ref={scrollRef}
      role="group"
      aria-label="Subcategorías"
      onMouseDown={alPresionarMouse}
      onMouseMove={alMoverMouse}
      onMouseUp={alSoltarMouse}
      onMouseLeave={alSoltarMouse}
      className="mt-4 inline-flex max-w-full items-center overflow-x-auto rounded-full border-2 border-brand-dark bg-white divide-x-2 divide-brand-dark cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
            className={`${base} ${elegida ? activo : inactivo}`}
          >
            {s.nombre}
          </button>
        )
      })}
    </div>
  )
}

export default SubcategoriaFilter
