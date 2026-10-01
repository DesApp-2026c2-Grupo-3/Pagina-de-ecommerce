export interface CarouselSlide {
  id: number
  eyebrow?: string
  title: string
  description: string
  backgroundImage: string
  ctaLabel: string
  ctaTo: string
  ctaVariant?: 'solid' | 'outline'
}