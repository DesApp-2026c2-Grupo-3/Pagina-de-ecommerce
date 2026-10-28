// Contenido editorial del Home (textos de marketing, no datos de la base).
// Las promos del día salen de GET /promociones (ver components/home/PromoDestacadaBanner).

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
  /** Si viene, la tarjeta lleva al detalle de ese producto (se busca por nombre en el catálogo) */
  producto?: string
  /** A dónde lleva si no hay producto (o si no se encuentra) */
  link: string
}

export const DESTACADOS: Destacado[] = [
  {
    id: 1,
    imagen: '/imagenes/Combos/Combo-Habemus-Doble.png',
    acento: 'red',
    sticker: { eyebrow: 'Nuevo combo', titulo: 'Combo Doble Habemus' },
    badge: 'NUEVO combo',
    producto: 'Combo Doble Habemus',
    link: '/catalogo?grupo=combos',
  },
  {
    id: 2,
    imagen: '/imagenes/Hamburguesas/Fast-Mushroom.png',
    acento: 'mustard',
    sticker: { eyebrow: 'A tu manera', titulo: 'Sacá o sumá ingredientes' },
    producto: 'Fast Mushroom',
    link: '/catalogo?grupo=hamburguesas',
    invertido: true,
  },
  {
    id: 3,
    imagen: '/imagenes/Combos/Combo-Habemus.png',
    acento: 'dark',
    sticker: { eyebrow: 'Producto de la semana', titulo: 'Combo Habemus Bacon' },
    badge: '20% OFF',
    producto: 'Combo Habemus Bacon',
    link: '/promociones',
  },
]
