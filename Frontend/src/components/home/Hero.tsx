import { useAuth } from '../../context/AuthContext'
import { useZona } from '../../context/ZonaContext'
import type { CarouselSlide } from '../../types/carousel'
import Carousel from './Carousel'

const SLIDE_IMAGES = {
  principal: '/banners/publicidad1.jpg',
  pasos: '/banners/publicidad2.png',
  promos: '/banners/publicidad3.jpg',
} as const

function capitalizarPrimerNombre(fullName?: string): string {
  const primerNombre = fullName?.split(' ')[0] || ''
  return primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1)
}

function Hero() {
  const { isAuthenticated, user } = useAuth()
  const { zona } = useZona()

  const primerNombre = capitalizarPrimerNombre(user?.name)
  const eyebrowSucursal = zona ? `Pedís desde ${zona.sucursalNombre}` : undefined

  const slides: CarouselSlide[] = [
    {
      id: 1,
      eyebrow: eyebrowSucursal,
      title: isAuthenticated
        ? `Hola, ${primerNombre}. ¿Qué se te antoja hoy?`
        : 'La hamburguesa que amás, en la puerta de tu casa',
      nombraUsuario: true,
      highlight: isAuthenticated ? 'antoja' : 'amás',
      description: isAuthenticated
        ? 'Volvé a pedir tus favoritos o descubrí algo nuevo en el menú.'
        : 'Pedí en minutos y seguí tu pedido en tiempo real.',
      ctaLabel: 'Ver menú',
      ctaTo: '/catalogo',
      backgroundImage: SLIDE_IMAGES.principal,
    },
    {
      id: 2,
      eyebrow: eyebrowSucursal,
      title: 'Pedí en pocos pasos',
      highlight: 'pocos pasos',
      description: 'Elegí, personalizá y pagá online: \ntu pedido llega directo a la puerta de tu casa.',
      ctaLabel: 'Empezar a pedir',
      ctaTo: '/catalogo',
      ctaVariant: 'outline',
      backgroundImage: SLIDE_IMAGES.pasos,
    },
    {
      id: 3,
      eyebrow: eyebrowSucursal,
      title: 'Box Familiar con 20% off',
      highlight: '20% off',
      description: 'Hamburguesas, papas grandes y bebidas para compartir, a un precio especial.',
      ctaLabel: 'Ver promociones',
      ctaTo: '/promociones',
      backgroundImage: SLIDE_IMAGES.promos,
    },
  ]

  return <Carousel slides={slides} transparentesEnMovil />
}

export default Hero
