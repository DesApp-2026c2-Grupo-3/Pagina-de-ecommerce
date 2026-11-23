import { Bike, ClipboardList, History, MapPinned, type LucideIcon } from 'lucide-react'

export interface EnlaceNavegacion {
  nombre: string
  ruta: string
  icono: LucideIcon
}

export const RUTA_PEDIDOS = '/pedidos'

// Única lista de destinos: la usan las pestañas de escritorio y la barra inferior del celular
export const ENLACES_NAVEGACION: readonly EnlaceNavegacion[] = [
  { nombre: 'Inicio', ruta: '/', icono: Bike },
  { nombre: 'Pedidos', ruta: RUTA_PEDIDOS, icono: ClipboardList },
  { nombre: 'Mi viaje', ruta: '/viaje', icono: MapPinned },
  { nombre: 'Historial', ruta: '/historial', icono: History },
]
