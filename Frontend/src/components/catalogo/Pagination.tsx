import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, type LucideIcon } from 'lucide-react'

interface Props {
  paginaActual: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
  /** Cuántos números se ven a la vez, centrados en la página actual */
  maxBotones?: number
}

// Mismo estilo que las cards del sitio: blanco, borde negro y sombra "sticker"
const boton =
  'grid h-11 min-w-11 place-items-center rounded-2xl border-2 border-brand-dark bg-white px-3 font-bold text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)] hover:bg-brand-cream disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none'

function Flecha({ Icono, label, onClick, disabled }: { Icono: LucideIcon; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={boton}>
      <Icono className="h-5 w-5" />
    </button>
  )
}

function Pagination({ paginaActual, totalPaginas, onCambiar, maxBotones = 3 }: Props) {
  if (totalPaginas <= 1) return null

  // Ventana de números centrada en la página actual
  const cantidad = Math.min(maxBotones, totalPaginas)
  const inicio = Math.max(1, Math.min(paginaActual - 1, totalPaginas - cantidad + 1))
  const paginas = Array.from({ length: cantidad }, (_, i) => inicio + i)

  const esPrimera = paginaActual === 1
  const esUltima = paginaActual === totalPaginas

  return (
    <nav aria-label="Paginación" className="mt-10 flex items-center justify-center gap-2 sm:gap-3">
      <Flecha Icono={ChevronsLeft} label="Primera página" onClick={() => onCambiar(1)} disabled={esPrimera} />
      <Flecha Icono={ChevronLeft} label="Página anterior" onClick={() => onCambiar(paginaActual - 1)} disabled={esPrimera} />

      {paginas.map((pagina) => {
        const actual = pagina === paginaActual
        return (
          <button
            key={pagina}
            type="button"
            onClick={() => onCambiar(pagina)}
            aria-current={actual ? 'page' : undefined}
            aria-label={`Página ${pagina}`}
            className={`${boton} hidden sm:grid ${actual ? 'pointer-events-none !bg-brand-red text-white' : ''}`}
          >
            {pagina}
          </button>
        )
      })}

      {/* En celular no entran todos los números: se muestra "2 / 5" */}
      <span className="px-2 font-bold text-brand-dark sm:hidden">
        {paginaActual} / {totalPaginas}
      </span>

      <Flecha Icono={ChevronRight} label="Página siguiente" onClick={() => onCambiar(paginaActual + 1)} disabled={esUltima} />
      <Flecha Icono={ChevronsRight} label="Última página" onClick={() => onCambiar(totalPaginas)} disabled={esUltima} />
    </nav>
  )
}

export default Pagination