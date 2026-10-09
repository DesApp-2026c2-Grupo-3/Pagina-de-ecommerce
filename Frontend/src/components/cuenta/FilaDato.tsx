import { type LucideIcon } from 'lucide-react'

interface Props {
  Icono: LucideIcon
  titulo: string
  valor?: string | null
  onClick: () => void
  /** Color del recuadro del ícono */
  color?: 'mostaza' | 'rojo'
}

const SIN_DATO = 'Sin completar'

const COLORES = {
  mostaza: 'bg-brand-mustard text-brand-dark',
  rojo: 'bg-brand-red text-white',
}

// Fila clickeable de una lista de datos (perfil, seguridad): ícono, dato y "Editar"
function FilaDato({ Icono, titulo, valor, onClick, color = 'mostaza' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-20 w-full items-center gap-4 border-b-2 border-dashed border-brand-sand px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-brand-cream sm:gap-5 sm:px-6"
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${COLORES[color]}`}>
        <Icono className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-wider text-brand-muted">{titulo}</span>
        <span className={`block truncate text-lg font-bold ${valor ? 'text-brand-dark' : 'italic text-brand-muted/70'}`}>
          {valor || SIN_DATO}
        </span>
      </span>
      <span className="shrink-0 text-sm font-extrabold text-brand-red group-hover:underline">Editar</span>
    </button>
  )
}

export default FilaDato