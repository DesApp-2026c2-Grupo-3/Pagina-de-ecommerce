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

// Las 3 tarjetas ilustradas debajo de la promo (imagen recortada sobre un recuadro inclinado)
export interface Destacado {
  id: number
  imagen: string
  /** Color del recuadro inclinado */
  acento: 'red' | 'mustard' | 'dark'
  sticker: { eyebrow: string; titulo: string }
  /** Círculo mostaza en la esquina (opcional) */
  badge?: string
    /** Inclina la tarjeta hacia el lado opuesto (sticker a la derecha) */
  invertido?: boolean
  link: string
}

export const DESTACADOS: Destacado[] = [
  {
    id: 1,
    imagen: '/imagenes/HComboPapas.png',
    acento: 'red',
    sticker: { eyebrow: 'Para compartir', titulo: 'Combo con papas' },
    badge: 'NUEVO combo',
    link: '/catalogo',
  },
  {
    id: 2,
    imagen: '/imagenes/HconPapas.png',
    acento: 'mustard',
    sticker: { eyebrow: 'A tu manera', titulo: 'Sacá o sumá ingredientes' },
    link: '/catalogo',
    invertido: true,
  },
  {
    id: 3,
    imagen: '/imagenes/Bestia.png',
    acento: 'dark',
    sticker: { eyebrow: 'Box Familiar', titulo: 'Para toda la mesa' },
    badge: '20% OFF',
    link: '/promociones',
  },
]