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
  /** Foto de fondo: es la protagonista del slide */
  backgroundImage: string
}