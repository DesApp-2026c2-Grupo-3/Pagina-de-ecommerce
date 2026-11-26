// Desplazamiento lento y animado hacia un elemento (plan de Insumos v3, D-I3 y D-I4).
// Es la única excepción a «sin scroll con movimiento» del panel: solo al tocar «Editar» en Insumos.
export const DURACION_DESPLAZAMIENTO_MS = 700

// Curva con aceleración y frenado suaves (cúbica ease-in-out); t entre 0 y 1
export function suavizado(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export function posicionEn(desde: number, hasta: number, t: number): number {
  return desde + (hasta - desde) * suavizado(t)
}

// Lleva el elemento arriba de la pantalla (con un margen). Si ya se ve entero, no se mueve.
// Con «reducir movimiento», salta al instante. Se cancela si el usuario desplaza con la rueda o el dedo.
// Devuelve una función para cancelarlo.
export function desplazarSuave(elemento: HTMLElement, margen = 16, duracion = DURACION_DESPLAZAMIENTO_MS): () => void {
  const rect = elemento.getBoundingClientRect()
  if (rect.top >= 0 && rect.bottom <= window.innerHeight) return () => {}

  const desde = window.scrollY
  const hasta = Math.max(0, desde + rect.top - margen)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: hasta, behavior: 'instant' })
    return () => {}
  }

  let id = 0
  const inicio = performance.now()
  const cancelar = () => {
    window.cancelAnimationFrame(id)
    window.removeEventListener('wheel', cancelar)
    window.removeEventListener('touchstart', cancelar)
  }
  const paso = (ahora: number) => {
    const t = (ahora - inicio) / duracion
    window.scrollTo({ top: posicionEn(desde, hasta, t), behavior: 'instant' })
    if (t < 1) id = window.requestAnimationFrame(paso)
    else cancelar()
  }
  window.addEventListener('wheel', cancelar, { passive: true })
  window.addEventListener('touchstart', cancelar, { passive: true })
  id = window.requestAnimationFrame(paso)
  return cancelar
}
