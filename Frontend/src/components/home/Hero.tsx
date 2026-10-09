import { useAuth } from "../../context/AuthContext";
import Carousel from "./Carousel";
import type { CarouselSlide } from "../../types/carousel";
import { useZona } from "../../context/ZonaContext";

function Hero() {
  const { isAuthenticated, user } = useAuth();
  const { zona } = useZona();
  const primerNombre = user?.name?.split(" ")[0];

  const slides: CarouselSlide[] = [
    {
      id: 1,
      layout: "split",
      eyebrow: zona ? `Pedís desde ${zona.sucursalNombre}` : undefined,
      title: isAuthenticated
        ? `Hola, ${primerNombre}. ¿Qué se te antoja hoy?`
        : "La hamburguesa que amás, en la puerta de tu casa",
      highlight: isAuthenticated ? "antoja" : "amás",
      description: isAuthenticated
        ? "Volvé a pedir tus favoritos o descubrí algo nuevo en el menú."
        : "Pedí en minutos y seguí tu pedido en tiempo real.",
      ctaLabel: "Ver menú",
      ctaTo: "/catalogo",
      image: "/imagenes/HComboPapas.png",
      backgroundImage: "/banners/publicidad1.jpg",
      sticker: { eyebrow: "Para compartir", title: "Combo con papas" },
      badge: "NUEVO combo",
    },
    {
      id: 2,
      layout: "split",
      accent: "mustard",
      title: "Pedí en pocos pasos",
      highlight: "pocos pasos",
      description:
        "Elegí, personalizá y pagá online: tu pedido llega directo a la puerta de tu casa.",
      ctaLabel: "Empezar a pedir",
      ctaTo: "/catalogo",
      ctaVariant: "outline",
      image: "/imagenes/HconPapas.png",
      backgroundImage: "/banners/publicidad2.png",
      sticker: { eyebrow: "A tu manera", title: "Sacá o sumá ingredientes" },
    },
    {
      id: 3,
      layout: "split",
      tone: "red",
      accent: "dark",
      title: "Box Familiar con 20% off",
      highlight: "20% off",
      description:
        "Hamburguesas, papas grandes y bebidas para compartir, a un precio especial.",
      ctaLabel: "Ver promociones",
      ctaTo: "/promociones",
      image: "/imagenes/Bestia.png",
      backgroundImage: "/banners/publicidad3.jpg",
      badge: "20% OFF",
    },
  ];

  return <Carousel slides={slides} />;
}

export default Hero;
