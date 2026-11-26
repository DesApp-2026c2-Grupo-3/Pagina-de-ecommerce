import { ChefHat, CircleCheck, CircleX, Mail, Package, Store, Truck, type LucideIcon } from 'lucide-react'
import type { TonoNotificacionCliente } from '../../types/notificacion.types'

// Ícono y colores de cada tono de aviso (la estrategia de cada tipo elige el tono)
export const APARIENCIA_TONO: Record<TonoNotificacionCliente, { Icono: LucideIcon; clase: string }> = {
  pedido: { Icono: Package, clase: 'bg-brand-mustard text-brand-dark' },
  estado: { Icono: Truck, clase: 'bg-brand-green text-white' },
  sucursal: { Icono: Store, clase: 'bg-brand-red text-white' },
  cocina: { Icono: ChefHat, clase: 'bg-brand-mustard text-brand-dark' },
  entregado: { Icono: CircleCheck, clase: 'bg-brand-green text-white' },
  cancelado: { Icono: CircleX, clase: 'bg-brand-red text-white' },
  mensaje: { Icono: Mail, clase: 'bg-brand-mustard text-brand-dark' },
}
