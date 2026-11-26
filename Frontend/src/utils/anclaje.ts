export interface Anclaje {
  top: number
  right: number
}

const SEPARACION = 12
const MARGEN = 12

// Posición de un panel que cuelga debajo de un botón, alineado a su borde derecho
// y sin pegarse al borde de la pantalla
export function anclajeDebajoDe(rect: DOMRect, anchoVentana: number): Anclaje {
  return {
    top: rect.bottom + SEPARACION,
    right: Math.max(MARGEN, anchoVentana - rect.right),
  }
}
