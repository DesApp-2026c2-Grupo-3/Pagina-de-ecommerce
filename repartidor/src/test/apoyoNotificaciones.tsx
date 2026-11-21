import type { ReactNode } from 'react'
import { vi } from 'vitest'

import { AccionesNotificacionesContext, EstadoNotificacionesContext } from '../context/notificaciones/NotificacionContext'
import type { AccionesNotificaciones, EstadoNotificaciones } from '../types/notificacion.types'

// Proveedores con estado fijo y acciones espía, para probar la bandeja y la campana
export function crearNotificacionesDePrueba(estado: EstadoNotificaciones) {
  const acciones: AccionesNotificaciones = {
    cargarMas: vi.fn(),
    marcarLeida: vi.fn(),
    marcarTodas: vi.fn(),
    reintentar: vi.fn(),
  }

  function Proveedor({ children }: { children: ReactNode }) {
    return (
      <EstadoNotificacionesContext.Provider value={estado}>
        <AccionesNotificacionesContext.Provider value={acciones}>{children}</AccionesNotificacionesContext.Provider>
      </EstadoNotificacionesContext.Provider>
    )
  }

  return { Proveedor, acciones }
}

// jsdom no trae matchMedia: true = celular
export function fijarPantallaChica(chica: boolean) {
  window.matchMedia = (consulta: string) =>
    ({
      matches: chica,
      media: consulta,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
