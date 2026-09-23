import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface ToastState {
  id: number
  message: string
}

interface ToastContextType {
  toast: ToastState | null
  showToast: (message: string, duration?: number) => void
  dismissToast: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const DEFAULT_DURATION = 2000

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

  const showToast = useCallback((message: string, duration = DEFAULT_DURATION) => {
    // Si ya hay un toast visible o un timer corriendo, lo cancelamos:
    // así el tiempo de vida es siempre el mismo, click tras click.
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setToast({ id: Date.now(), message })

    timerRef.current = setTimeout(() => {
      setToast(null)
      timerRef.current = null
    }, duration)
  }, [])

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
