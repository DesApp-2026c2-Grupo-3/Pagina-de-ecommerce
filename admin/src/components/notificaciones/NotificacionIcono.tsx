import {
  ShoppingBag,
  Store,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import type { TipoNotificacion } from '../../types/notificacion.types'

const ESTILOS: Record<TipoNotificacion, { Icono: LucideIcon; clases: string }> = {
  'pedido.creado': {
    Icono: ShoppingBag,
    clases: 'bg-orange-100 text-action',
  },
  'sucursal.cerrada': {
    Icono: Store,
    clases: 'bg-red-50 text-danger',
  },
  'stock.bajo': {
    Icono: TriangleAlert,
    clases: 'bg-red-50 text-danger',
  },
}

export default function NotificacionIcono({ tipo }: { tipo: TipoNotificacion }) {
  const { Icono, clases } = ESTILOS[tipo]

  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${clases}`}
    >
      <Icono size={18} />
    </span>
  )
}
