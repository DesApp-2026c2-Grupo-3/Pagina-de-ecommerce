import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type TonoBotonIcono = 'neutro' | 'marca'

interface BotonIconoProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'aria-label'> {
  icono: LucideIcon
  // Obligatoria: un botón que solo tiene ícono necesita un nombre para el lector de pantalla
  etiqueta: string
  tono?: TonoBotonIcono
  // Algo superpuesto al ícono, como la Insignia de la campana
  children?: ReactNode
}

const TONOS: Record<TonoBotonIcono, string> = {
  neutro: 'text-slate-700 enabled:hover:bg-slate-100',
  marca: 'text-orange-700 enabled:hover:bg-orange-50',
}

// Área táctil de 44 × 44 px como mínimo
export default function BotonIcono({
  icono: Icono,
  etiqueta,
  tono = 'neutro',
  children,
  type = 'button',
  ...resto
}: BotonIconoProps) {
  return (
    <button
      {...resto}
      type={type}
      aria-label={etiqueta}
      className={
        'relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition ' +
        'enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ' +
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ' +
        TONOS[tono]
      }
    >
      <Icono aria-hidden="true" size={22} />
      {children}
    </button>
  )
}
