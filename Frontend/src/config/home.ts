// Contenido editorial del Home (textos de marketing, no datos de la base).
// Cuando exista la tabla de promociones, PROMO_DESTACADA puede venir del backend.

export interface PromoDestacada {
  etiqueta: string
  titulo: string
  descripcion: string
  /** Texto grande del círculo: "2×1", "20%", etc. */
  destacado: string
  /** Texto chico debajo del destacado: "OFF", "Martes", etc. */
  bajada?: string
  imagen: string
  link: string
  boton: string
}

export const PROMO_DESTACADA: PromoDestacada = {
  etiqueta: 'Todos los martes',
  titulo: 'Martes de 2×1',
  descripcion: 'Llevá dos hamburguesas clásicas al precio de una. Válido para envío y retiro.',
  destacado: '2×1',
  bajada: 'Martes',
  imagen: '/imagenes/HDoble.png',
  link: '/promociones',
  boton: 'Quiero la promo',
}