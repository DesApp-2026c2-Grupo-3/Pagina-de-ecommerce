// Lógica pura del menú de filtros (MenuFiltro): teclado y ubicación del panel en la pantalla

export const ALTO_OPCION_PX = 44
export const ANCHO_MINIMO_PANEL_PX = 256 // 16 rem
export const MARGEN_PANTALLA_PX = 16 // 1 rem a cada lado
const ALTO_MAXIMO_PANEL_PX = 352 // 22 rem
const ALTO_EXTRA_PX = 44 // título del panel + relleno

// ↑ ↓ Home End (patrón «combobox de solo selección» del APG): sin dar la vuelta en los extremos
export function siguienteIndice(actual: number, total: number, tecla: string): number {
  if (total <= 0) return -1
  switch (tecla) {
    case 'ArrowDown':
      return Math.min(actual + 1, total - 1)
    case 'ArrowUp':
      return Math.max(actual - 1, 0)
    case 'Home':
      return 0
    case 'End':
      return total - 1
    default:
      return actual
  }
}

// Alto que va a ocupar el panel: lo que piden las opciones, con tope en 22 rem y en el 60 % de la pantalla
export function altoPanel(totalOpciones: number, altoVentana: number): number {
  return Math.min(totalOpciones * ALTO_OPCION_PX + ALTO_EXTRA_PX, ALTO_MAXIMO_PANEL_PX, Math.floor(altoVentana * 0.6))
}

// Ancho del panel: como mínimo el del botón o 16 rem, nunca más que la pantalla menos 2 rem
export function anchoPanel(anchoBoton: number, anchoVentana: number): number {
  return Math.min(Math.max(anchoBoton, ANCHO_MINIMO_PANEL_PX), anchoVentana - MARGEN_PANTALLA_PX * 2)
}

interface Rect {
  top: number
  bottom: number
  left: number
  right: number
  width: number
}

// Dónde abrir para quedar siempre dentro de la pantalla:
// · hacia arriba solo si abajo no entra y arriba hay más lugar
// · alineado a la izquierda del botón si entra; si no, a su borde derecho
export function ubicarPanel(boton: Rect, totalOpciones: number, ventana: { ancho: number; alto: number }) {
  const alto = altoPanel(totalOpciones, ventana.alto)
  const ancho = anchoPanel(boton.width, ventana.ancho)
  const espacioAbajo = ventana.alto - boton.bottom - MARGEN_PANTALLA_PX
  const espacioArriba = boton.top - MARGEN_PANTALLA_PX
  return {
    haciaArriba: espacioAbajo < alto && espacioArriba > espacioAbajo,
    alineadoIzquierda: boton.left + ancho <= ventana.ancho - MARGEN_PANTALLA_PX,
  }
}
