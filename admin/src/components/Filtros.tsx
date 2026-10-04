import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

// Fila de filtros: apilados en celular, en línea en escritorio
export function BarraFiltros({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">{children}</div>
}

interface BuscadorProps {
  valor: string
  onChange: (valor: string) => void
  placeholder: string
}

export function Buscador({ valor, onChange, placeholder }: BuscadorProps) {
  return (
    <div className="relative w-full md:w-72">
      <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded border bg-white py-2 pl-10 pr-3"
      />
    </div>
  )
}

interface SelectFiltroProps {
  valor: string
  onChange: (valor: string) => void
  etiqueta: string // para lectores de pantalla
  opciones: { valor: string; etiqueta: string }[]
}

export function SelectFiltro({ valor, onChange, etiqueta, opciones }: SelectFiltroProps) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label={etiqueta}
      className="w-full rounded border bg-white px-3 py-2 md:w-auto"
    >
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.etiqueta}
        </option>
      ))}
    </select>
  )
}