import type { AccionToasts, DatosToast, EstadoToasts } from '../../types/toast.types'

// Más de 3 tapan la pantalla del celular: el resto espera (plan UX, UX-06)
export const MAXIMO_VISIBLES = 3

export const estadoInicialToasts: EstadoToasts = { visibles: [], cola: [] }

function existe(estado: EstadoToasts, id: string) {
  return [...estado.visibles, ...estado.cola].some((toast) => toast.id === id)
}

function mostrar(estado: EstadoToasts, toast: DatosToast): EstadoToasts {
  if (existe(estado, toast.id)) return estado

  return estado.visibles.length < MAXIMO_VISIBLES
    ? { ...estado, visibles: [toast, ...estado.visibles] }
    : { ...estado, cola: [...estado.cola, toast] }
}

function cerrar(estado: EstadoToasts, id: string): EstadoToasts {
  if (!estado.visibles.some((toast) => toast.id === id)) {
    return { ...estado, cola: estado.cola.filter((toast) => toast.id !== id) }
  }

  const visibles = estado.visibles.filter((toast) => toast.id !== id)
  const [siguiente, ...cola] = estado.cola

  // El que sale de la cola es más nuevo que los que ya se ven: entra arriba
  return siguiente ? { visibles: [siguiente, ...visibles], cola } : { visibles, cola }
}

export function toastReducer(estado: EstadoToasts, accion: AccionToasts): EstadoToasts {
  switch (accion.type) {
    case 'MOSTRAR':
      return mostrar(estado, accion.toast)
    case 'CERRAR':
      return cerrar(estado, accion.id)
    case 'VACIAR':
      return estadoInicialToasts
  }
}
