import type { PrioridadToast } from '../../types/toast.types'

// Cuánto se ve un toast antes de irse solo (plan UX, 7.3)
export const DURACION_MS: Record<PrioridadToast, number> = { alta: 8000, normal: 4000 }

// Lo que dura el fundido de salida (animate-toast-salida en index.css)
export const DURACION_SALIDA_MS = 150
