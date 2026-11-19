import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastVariante = 'exito' | 'alerta'

export interface ToastAccion {
  label: string
  onClick: () => void
}

export interface ToastOpciones {
  duracion?: number
  variante?: ToastVariante
  accion?: ToastAccion
}

interface ToastState {
  id: number
  message: string
  variante: ToastVariante
  accion?: ToastAccion
}

interface ToastContextType {
  toast: ToastState | null
  showToast: (message: string, opciones?: ToastOpciones) => void
  dismissToast: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const DURACION_EXITO = 2000
const DURACION_ALERTA = 6000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast(null)
  }, [])

  const showToast = useCallback(
    (message: string, opciones: ToastOpciones = {}) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      const variante = opciones.variante ?? 'exito'
      const duracion =
        opciones.duracion ??
        (variante === 'alerta' ? DURACION_ALERTA : DURACION_EXITO)

      setToast({
        id: Date.now(),
        message,
        variante,
        accion: opciones.accion,
      })

      timerRef.current = setTimeout(() => {
        setToast(null)
        timerRef.current = null
      }, duracion)
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ toast, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider')
  }
  return context
}
