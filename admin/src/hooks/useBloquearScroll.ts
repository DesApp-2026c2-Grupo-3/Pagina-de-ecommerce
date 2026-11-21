import { useEffect } from 'react'

// Cuántos modales hay abiertos ahora (puede haber uno encima de otro)
let abiertos = 0
let anterior = { htmlOverflow: '', bodyOverflow: '', bodyPadding: '' }

// D-23: el menú lateral se entera de cuándo hay un modal abierto, para no superponerse
const oyentes = new Set<() => void>()

function avisar() {
  for (const oyente of [...oyentes]) oyente()
}

export function suscribirModales(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function hayModalAbierto() {
  return abiertos > 0
}

// Mientras "activo" sea true, la página de atrás no se mueve: el scroll queda solo para el modal.
// Bloquea <html> y <body>, porque según los estilos el scroll de la página puede estar en cualquiera
// de los dos (en la tienda está en <html>). Compensa el ancho de la barra para que no salte.
// Todo modal del panel lo usa: así también cuenta como "modal abierto" para el menú (D-23).
export function useBloquearScroll(activo: boolean) {
  useEffect(() => {
    if (!activo) return

    const html = document.documentElement
    const body = document.body

    if (abiertos === 0) {
      const anchoBarra = window.innerWidth - html.clientWidth
      anterior = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        bodyPadding: body.style.paddingRight,
      }
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      if (anchoBarra > 0) body.style.paddingRight = `${anchoBarra}px`
    }
    abiertos++
    avisar()

    return () => {
      abiertos--
      if (abiertos === 0) {
        html.style.overflow = anterior.htmlOverflow
        body.style.overflow = anterior.bodyOverflow
        body.style.paddingRight = anterior.bodyPadding
      }
      avisar()
    }
  }, [activo])
}
