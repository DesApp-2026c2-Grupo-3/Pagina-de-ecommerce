import { useEffect, useState } from 'react'
import { CircleX } from 'lucide-react'

interface ToastProps {
  mensaje: string
  visible: boolean
  onCerrar: () => void
  contador: number
}

export default function Toast({ mensaje, visible, onCerrar, contador }: ToastProps) {
  const [animando, setAnimando] = useState(false)

  useEffect(() => {
    if (!visible) {
      setAnimando(false)
      return
    }
    setAnimando(true)} , [visible])
    
  useEffect(() => {
    if (!visible) {
      return
    }
    setAnimando(false)

    const temporizadorAnimacion = setTimeout(() => {
      setAnimando(true)
    }, 50)

    return () => clearTimeout(temporizadorAnimacion)
  }, [contador, visible])

  useEffect(() => {
    if (!visible) {
      return
    }

    const temporizador = setTimeout(() => {
      onCerrar()
    }, 3000)

    return () => clearTimeout(temporizador)
  }, [visible, contador])

  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-500 ease-out ${
        visible && animando
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-4 pointer-events-none'
      }`}
    >
      <div className="bg-success text-white px-5 py-3 rounded-md shadow-lg flex items-center gap-4">
        <span>{mensaje}</span>

        <button
          onClick={onCerrar}
          className="font-bold hover:text-gray-200"
        >
          <CircleX size={20} />
        </button>
      </div>
    </div>
  )
}