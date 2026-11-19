import { CheckCircle2, RefreshCw, WifiOff, type LucideIcon } from 'lucide-react'

import type { FranjaConexion as TipoFranja } from '../../types/conexion.types'

interface FranjaConexionProps {
  franja: TipoFranja
}

type FranjaVisible = Exclude<TipoFranja, 'oculta'>

const CONTENIDO: Record<FranjaVisible, { icono: LucideIcon; fuerte: string; resto: string; clases: string }> = {
  reconectando: {
    icono: RefreshCw,
    fuerte: 'Sin conexión en tiempo real.',
    resto: 'Lo que ves puede estar desactualizado.',
    clases: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  sin_red: {
    icono: WifiOff,
    fuerte: 'Estás sin internet.',
    resto: 'Las acciones van a fallar hasta que vuelva la señal.',
    clases: 'border-red-200 bg-red-50 text-red-800',
  },
  volvio: {
    icono: CheckCircle2,
    fuerte: 'Conectado de nuevo.',
    resto: 'Actualizamos tus datos.',
    clases: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
}

// Aviso debajo del encabezado. No tapa nada: empuja el contenido hacia abajo.
export default function FranjaConexion({ franja }: FranjaConexionProps) {
  if (franja === 'oculta') return null

  const { icono: Icono, fuerte, resto, clases } = CONTENIDO[franja]

  return (
    <div role="status" className={`border-b ${clases}`}>
      <p className="mx-auto flex max-w-7xl items-start gap-2 px-4 py-2.5 text-sm leading-5 sm:px-6">
        <Icono aria-hidden="true" size={18} className="mt-px shrink-0" />
        <span>
          <strong className="font-bold">{fuerte}</strong> {resto}
        </span>
      </p>
    </div>
  )
}
