import type { TonoNotificacion } from './tipos'

interface ClasesTono {
  // Círculo del ícono (bandeja y toasts)
  circulo: string
  // Barra lateral del toast
  barra: string
}

// Única tabla tono → clases (plan UX, sección 6). Ningún componente pregunta por el tipo.
export const TONOS: Record<TonoNotificacion, ClasesTono> = {
  marca: { circulo: 'bg-orange-100 text-orange-700', barra: 'bg-orange-700' },
  exito: { circulo: 'bg-emerald-100 text-emerald-700', barra: 'bg-emerald-700' },
  alerta: { circulo: 'bg-amber-100 text-amber-800', barra: 'bg-amber-600' },
  peligro: { circulo: 'bg-red-100 text-red-700', barra: 'bg-red-700' },
}
