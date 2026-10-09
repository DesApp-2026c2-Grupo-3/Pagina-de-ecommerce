export interface CarouselSlide {
  id: number
  eyebrow?: string
  title: string
  /** Palabra del título que se resalta en mostaza (debe aparecer tal cual en title) */
  highlight?: string
  description: string
  ctaLabel: string
  ctaTo: string
  ctaVariant?: 'solid' | 'outline'
  /** 'photo': foto de fondo (default). 'split': fondo oscuro, texto a la izquierda e imagen a la derecha */
  layout?: 'photo' | 'split'
  /** Solo layout 'photo' */
  backgroundImage?: string
    /** Solo layout 'split': color de fondo del slide (default 'dark') */
  tone?: 'dark' | 'red'
  /** Solo layout 'split': color del recuadro inclinado de la imagen (default 'red') */
  accent?: 'red' | 'mustard' | 'dark'
  /** Solo layout 'split': imagen recortada del producto */
  image?: string
  /** Solo layout 'split': tarjetita inclinada sobre la imagen */
  sticker?: { eyebrow: string; title: string }
  /** Solo layout 'split': círculo mostaza en la esquina */
  badge?: string
}