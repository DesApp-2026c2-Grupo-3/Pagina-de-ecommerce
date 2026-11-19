import { createContext, useContext } from 'react'
import type {
  AccionesNotificaciones,
  EstadoNotificaciones,
} from '../../types/notificacion.types'

export const EstadoNotificacionesContext =
  createContext<EstadoNotificaciones | null>(null)

export const AccionesNotificacionesContext =
  createContext<AccionesNotificaciones | null>(null)

export function useNotificaciones() {
  const contexto = useContext(EstadoNotificacionesContext)

  if (!contexto) {
    throw new Error('useNotificaciones debe usarse dentro de NotificacionProvider')
  }

  return contexto
}

export function useAccionesNotificaciones() {
  const contexto = useContext(AccionesNotificacionesContext)

  if (!contexto) {
    throw new Error('useAccionesNotificaciones debe usarse dentro de NotificacionProvider')
  }

  return contexto
}
