import { useCallback, useEffect, useState, type RefObject } from 'react'
import { anclajeDebajoDe, type Anclaje } from '../utils/anclaje'

// Posición de un panel anclado debajo de un botón. "medir" se llama al abrir
// y, mientras esté activo, se vuelve a medir al cambiar el tamaño de la ventana.
export function useAnclajeDebajo(boton: RefObject<HTMLElement | null>, activo: boolean) {
  const [anclaje, setAnclaje] = useState<Anclaje | null>(null)

  const medir = useCallback(() => {
    const elemento = boton.current
    if (!elemento) return
    setAnclaje(
      anclajeDebajoDe(elemento.getBoundingClientRect(), document.documentElement.clientWidth),
    )
  }, [boton])

  useEffect(() => {
    if (!activo) return
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [activo, medir])

  return { anclaje, medir }
}
