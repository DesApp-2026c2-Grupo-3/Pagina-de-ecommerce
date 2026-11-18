import { createContext, useContext } from 'react'
import type { AccionesToasts, DatosToast } from '../../types/toast.types'

export interface EstadoToastsContextType {
  visibles: DatosToast[]
  // Diálogo modal abierto más reciente, o null si no hay ninguno
  capa: HTMLElement | null
}

export const EstadoToastsContext = createContext<EstadoToastsContextType | null>(null)

export const AccionesToastsContext = createContext<AccionesToasts | null>(null)

export function useToasts() {
  const contexto = useContext(EstadoToastsContext)

  if (!contexto) {
    throw new Error('useToasts debe usarse dentro de ToastProvider')
  }

  return contexto
}

export function useToast() {
  const contexto = useContext(AccionesToastsContext)

  if (!contexto) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }

  return contexto
}
