import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EstadoVacioProps {
  icono: LucideIcon
  titulo: string
  descripcion?: string
  // Un botón o enlace opcional ("Ver pedidos")
  accion?: ReactNode
}

export default function EstadoVacio({ icono: Icono, titulo, descripcion, accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-orange-100 text-orange-700"
      >
        <Icono size={28} />
      </span>

      <p className="text-base font-bold text-slate-900">{titulo}</p>

      {descripcion && <p className="max-w-xs text-sm leading-6 text-slate-600">{descripcion}</p>}

      {accion}
    </div>
  )
}
