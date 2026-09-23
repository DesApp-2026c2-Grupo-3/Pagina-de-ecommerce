export interface CarouselSlide {
  id: string
  eyebrow?: string
  title: string
  description: string
  ctaLabel: string
  ctaTo: string
  ctaVariant?: 'solid' | 'outline'
  /** Emoji grande o ruta de imagen, según visualType. */
  visual: string
  visualType?: 'emoji' | 'image'
}
