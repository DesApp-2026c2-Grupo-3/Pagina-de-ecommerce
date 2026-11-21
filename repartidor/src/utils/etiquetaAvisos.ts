// Nombre accesible de la campana y de la pestaña "Avisos": el número va en la etiqueta
// porque la Insignia es decorativa
export function etiquetaAvisos(noLeidas: number | null): string {
  return noLeidas && noLeidas > 0 ? `Avisos, ${noLeidas} sin leer` : 'Avisos'
}
