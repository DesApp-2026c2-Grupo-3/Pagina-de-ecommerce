import { useEffect } from 'react'

// Cuántos modales hay abiertos ahora (puede haber uno encima de otro)
let abiertos = 0
let overflowAnterior = ''

// Mientras "activo" sea true, la página de atrás no se mueve: el scroll queda solo para el modal.
// En la tienda el scroll de la página vive en <html> (index.css), así que se bloquea solo <html>.
// No se toca <body>: con overflow hidden pasaría a ser un contenedor de scroll y el encabezado
// sticky se despegaría si la página ya estaba scrolleada (plan de clientes, 36.2 y C-1).
export function useBloquearScroll(activo: boolean) {
  useEffect(() => {
    if (!activo) return

    const html = document.documentElement

    if (abiertos === 0) {
      overflowAnterior = html.style.overflow
      html.style.overflow = 'hidden'
    }
    abiertos++

    return () => {
      abiertos--
      if (abiertos === 0) html.style.overflow = overflowAnterior
    }
  }, [activo])
}
