import { useAuth } from '../../context/AuthContext'
import { useZona } from '../../context/ZonaContext'
import type { CarouselSlide } from '../../types/carousel'
import Carousel from './Carousel'

function Hero() {
  const { isAuthenticated, user } = useAuth()
  const { zona } = useZona()
  const primerNombre = user?.name?.split(' ')[0]

  const slides: CarouselSlide[] = [
    {
      id: 1,
      eyebrow: zona ? `Pedís desde ${zona.sucursalNombre}` : undefined,
      title: isAuthenticated
        ? `Hola, ${primerNombre}. ¿Qué se te antoja hoy?`
        : 'La hamburguesa que amás, en la puerta de tu casa',
      highlight: isAuthenticated ? 'antoja' : 'amás',
      description: isAuthenticated
        ? 'Volvé a pedir tus favoritos o descubrí algo nuevo en el menú.'
        : 'Pedí en minutos y seguí tu pedido en tiempo real.',
      ctaLabel: 'Ver menú',
      ctaTo: '/catalogo',
      backgroundImage: '/banners/publicidad1.jpg',
    },
    {
      id: 2,
      title: 'Pedí en pocos pasos',
      highlight: 'pocos pasos',
      description: 'Elegí, personalizá y pagá online: tu pedido llega directo a la puerta de tu casa.',
      ctaLabel: 'Empezar a pedir',
      ctaTo: '/catalogo',
      ctaVariant: 'outline',
      backgroundImage: '/banners/publicidad2.png',
    },
    {
      id: 3,
      title: 'Box Familiar con 20% off',
      highlight: '20% off',
      description: 'Hamburguesas, papas grandes y bebidas para compartir, a un precio especial.',
      ctaLabel: 'Ver promociones',
      ctaTo: '/promociones',
      backgroundImage: '/banners/publicidad3.jpg',
    },
  ]

  return <Carousel slides={slides} />
}

export default Hero