import { useEffect } from 'react'
import { formatearContador } from '../utils/notificaciones/formatoNotificacion'

export const TITULO_PANEL = 'Panel Admin - E-commerce'

export function calcularTitulo(noLeidas: number | null): string {
  if (noLeidas === null || noLeidas <= 0) return TITULO_PANEL

  return `(${formatearContador(noLeidas)}) ${TITULO_PANEL}`
}

export function useTituloNoLeidas(noLeidas: number | null) {
  useEffect(() => {
    const titulo = calcularTitulo(noLeidas)

    if (document.title !== titulo) {
      document.title = titulo
    }
  }, [noLeidas])

  useEffect(() => () => {
    document.title = TITULO_PANEL
  }, [])
}
