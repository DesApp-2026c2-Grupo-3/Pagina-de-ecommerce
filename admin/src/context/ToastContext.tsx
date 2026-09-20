import { createContext, useContext, useState } from 'react'
import Toast from '../components/Toast'

interface ToastContextType {
  mostrarToast: (mensaje: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mensaje, setMensaje] = useState('')
  const [visible, setVisible] = useState(false)
  const [contador, setContador] = useState(0)

  const mostrarToast = (nuevoMensaje: string) => {
    setMensaje(nuevoMensaje)
    setVisible(true)
    setContador((valor) => valor + 1)
  }

  const cerrarToast = () => {
    setVisible(false)
  }

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}

      <Toast
        mensaje={mensaje}
        visible={visible}
        onCerrar={cerrarToast}
        contador={contador}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast debe utilizarse dentro de ToastProvider')
  }

  return context
}