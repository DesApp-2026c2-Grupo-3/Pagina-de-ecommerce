import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight } from 'lucide-react'

interface PaginationProps {
  paginaActual: number
  totalElementos: number
  elementosPorPagina: number
  cambiarPagina: (pagina: number) => void
}

export default function Paginacion({
  paginaActual,
  totalElementos,
  elementosPorPagina,
  cambiarPagina,
}: PaginationProps) {
  const totalPaginas = Math.ceil(
    totalElementos / elementosPorPagina
  )

  if (totalPaginas <= 1) {
    return null
  }

  const paginas: number[] = []

  if (paginaActual === 1) {
    paginas.push(2, 3)
  } else if (paginaActual === totalPaginas) {
    paginas.push(totalPaginas - 2, totalPaginas - 1)
  } else {
    paginas.push(paginaActual - 1, paginaActual + 1)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-6">

      <div>
        <span className="px-3 py-1 border rounded font-medium">
          Página {paginaActual} de {totalPaginas}
        </span>
      </div>

      <div className="flex gap-2">
        <button
        onClick={() => cambiarPagina(1)}
        disabled={paginaActual === 1}
        className="p-2 rounded-lg border border-gray-300
        hover:bg-gray-100 transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronsLeft size={18} />
        </button>

      <button
        onClick={() => cambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        className="p-2 rounded-lg border border-gray-300
        hover:bg-gray-100 transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronLeft size={18} />
      </button>

      {paginas
        .filter((pagina) => pagina >= 1 && pagina <= totalPaginas)
        .map((pagina) => (
          <button
            key={pagina}
            onClick={() => cambiarPagina(pagina)}
            className={`min-w-9 h-9 rounded-lg border transition-colors ${
              paginaActual === pagina
              ? 'bg-action text-white border-action'
              : 'border-gray-300 hover:bg-gray-100'
              }`}>
            {pagina}
          </button>
        ))}

      <button
        onClick={() => cambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className="p-2 rounded-lg border border-gray-300
        hover:bg-gray-100 transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronRight size={18} />
      </button>

      <button
      onClick={() => cambiarPagina(totalPaginas)}
      disabled={paginaActual === totalPaginas}
      className="p-2 rounded-lg border border-gray-300
      hover:bg-gray-100 transition-colors
      disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronsRight size={18} />
      </button>
    </div>
  </div>
  )
}