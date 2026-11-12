import { useEffect, useRef } from 'react'

interface OpcionesScrollNotificaciones {
  cargandoMas: boolean
  cantidadItems: number
}

export function useScrollNotificaciones({
  cargandoMas,
  cantidadItems,
}: OpcionesScrollNotificaciones) {
  const listaRef = useRef<HTMLDivElement>(null)
  const cargaAnteriorRef = useRef(cargandoMas)
  const cantidadAnteriorRef = useRef(cantidadItems)

  useEffect(() => {
    const terminoCarga = cargaAnteriorRef.current && !cargandoMas
    const agregados = cantidadItems > cantidadAnteriorRef.current

    cargaAnteriorRef.current = cargandoMas
    cantidadAnteriorRef.current = cantidadItems

    if (!terminoCarga || !agregados) return

    const lista = listaRef.current
    if (!lista) return

    const movimientoReducido = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    lista.scrollTo({
      top: lista.scrollHeight,
      behavior: movimientoReducido ? 'auto' : 'smooth',
    })
  }, [cantidadItems, cargandoMas])

  return { listaRef }
}
