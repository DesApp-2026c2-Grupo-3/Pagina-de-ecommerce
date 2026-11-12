import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function useDesplegableNotificaciones() {
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const alternar = useCallback(() => {
    setAbierto((valor) => !valor)
  }, [])

  useEffect(() => {
    if (!abierto) return

    const alPresionarFuera = (evento: PointerEvent) => {
      if (
        evento.target instanceof Node &&
        !contenedorRef.current?.contains(evento.target)
      ) {
        setAbierto(false)
      }
    }

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return

      setAbierto(false)
      botonRef.current?.focus()
    }

    document.addEventListener('pointerdown', alPresionarFuera)
    document.addEventListener('keydown', alPresionarTecla)

    return () => {
      document.removeEventListener('pointerdown', alPresionarFuera)
      document.removeEventListener('keydown', alPresionarTecla)
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return

    const timer = window.setTimeout(() => {
      panelRef.current?.focus()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [abierto])

  useEffect(() => {
    setAbierto(false)
  }, [location.key])

  return {
    abierto,
    alternar,
    contenedorRef,
    botonRef,
    panelRef,
  }
}
