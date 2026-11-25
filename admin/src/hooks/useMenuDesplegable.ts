import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { siguienteIndice, ubicarPanel } from '../utils/listas/menuDesplegable'

interface Opciones {
  total: number
  indiceElegido: number
  onElegir: (indice: number) => void
}

// Estado y teclado de MenuFiltro (patrón «combobox de solo selección» del APG):
// el foco queda siempre en el botón y la opción activa se marca con aria-activedescendant.
export function useMenuDesplegable({ total, indiceElegido, onElegir }: Opciones) {
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(-1)
  const [ubicacion, setUbicacion] = useState({ haciaArriba: false, alineadoIzquierda: true })
  const refRaiz = useRef<HTMLDivElement | null>(null)
  const refBoton = useRef<HTMLButtonElement | null>(null)
  const refPanel = useRef<HTMLUListElement | null>(null)

  // Se mide al abrir (en el evento, no en un efecto) para que el panel quede dentro de la pantalla
  const abrir = useCallback(() => {
    const boton = refBoton.current
    if (boton) {
      setUbicacion(ubicarPanel(boton.getBoundingClientRect(), total, { ancho: window.innerWidth, alto: window.innerHeight }))
    }
    setActivo(indiceElegido >= 0 ? indiceElegido : 0)
    setAbierto(true)
  }, [indiceElegido, total])

  const cerrar = useCallback((devolverFoco = true) => {
    setAbierto(false)
    if (devolverFoco) refBoton.current?.focus()
  }, [])

  const elegir = useCallback(
    (indice: number) => {
      onElegir(indice)
      cerrar()
    },
    [cerrar, onElegir],
  )

  // Clic o toque afuera: se cierra sin robar el foco
  useEffect(() => {
    if (!abierto) return
    const alTocar = (evento: PointerEvent) => {
      if (!refRaiz.current?.contains(evento.target as Node)) cerrar(false)
    }
    document.addEventListener('pointerdown', alTocar)
    return () => document.removeEventListener('pointerdown', alTocar)
  }, [abierto, cerrar])

  // La opción activa siempre a la vista dentro del panel (solo si hay scroll interno)
  useEffect(() => {
    if (!abierto || activo < 0) return
    const opcion = refPanel.current?.children[activo] as HTMLElement | undefined
    opcion?.scrollIntoView({ block: 'nearest' })
  }, [abierto, activo])

  function alPresionar(evento: KeyboardEvent<HTMLButtonElement>) {
    const { key } = evento
    if (!abierto) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        evento.preventDefault()
        abrir()
      }
      return
    }
    if (key === 'Escape') {
      evento.preventDefault()
      cerrar()
    } else if (key === 'Enter' || key === ' ') {
      evento.preventDefault()
      if (activo >= 0) elegir(activo)
    } else if (key === 'Tab') {
      cerrar(false)
    } else if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      evento.preventDefault()
      setActivo((actual) => siguienteIndice(actual, total, key))
    }
  }

  return { abierto, activo, setActivo, ubicacion, refRaiz, refBoton, refPanel, abrir, cerrar, elegir, alPresionar }
}
