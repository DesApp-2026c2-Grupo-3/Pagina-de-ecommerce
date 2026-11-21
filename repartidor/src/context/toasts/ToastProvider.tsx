import { useCallback, useMemo, useReducer, useState, type ReactNode } from 'react'

import { AccionesToastsContext, EstadoToastsContext, type EstadoToastsContextType } from './ToastContext'
import { estadoInicialToasts, toastReducer } from './toastReducer'
import type { AccionesToasts, DatosToast } from '../../types/toast.types'

// Genérico: lo usan los avisos en vivo, los errores de la bandeja y (UX-5) el feedback de
// las acciones. Los toasts se dibujan en ContenedorToasts, que monta MainLayout.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(toastReducer, estadoInicialToasts)
  const [capas, setCapas] = useState<HTMLElement[]>([])

  const mostrar = useCallback((toast: DatosToast) => dispatch({ type: 'MOSTRAR', toast }), [])
  const cerrar = useCallback((id: string) => dispatch({ type: 'CERRAR', id }), [])
  const vaciar = useCallback(() => dispatch({ type: 'VACIAR' }), [])

  const registrarCapa = useCallback((elemento: HTMLElement) => {
    setCapas((actuales) => [...actuales, elemento])
    return () => setCapas((actuales) => actuales.filter((capa) => capa !== elemento))
  }, [])

  const valorEstado = useMemo<EstadoToastsContextType>(
    () => ({ visibles: estado.visibles, capa: capas.at(-1) ?? null }),
    [capas, estado.visibles],
  )

  const acciones = useMemo<AccionesToasts>(
    () => ({ mostrar, cerrar, vaciar, registrarCapa }),
    [cerrar, mostrar, registrarCapa, vaciar],
  )

  return (
    <EstadoToastsContext.Provider value={valorEstado}>
      <AccionesToastsContext.Provider value={acciones}>{children}</AccionesToastsContext.Provider>
    </EstadoToastsContext.Provider>
  )
}
