import { useAuth } from "../../context/AuthContext";
import Carousel from "./Carousel";
import type { CarouselSlide } from "../../types/carousel";

function Hero() {
  const { isAuthenticated, user } = useAuth();

  const primerNombre = user?.name?.split(" ")[0];

  const slides: CarouselSlide[] = [
    {
      id: "valor",
      title: isAuthenticated
        ? `Hola, ${primerNombre} 👋 ¿Qué se te antoja hoy?`
        : "La hamburguesa que amás, en la puerta de tu casa",
      description: isAuthenticated
        ? "Volvé a pedir tus favoritos o descubrí algo nuevo en el menú."
        : "Pedí en minutos y seguí tu pedido en tiempo real.",
      ctaLabel: "Ver menú",
      ctaTo: "/productos",
      visual: "/imagenes/turbo-bacon.png",
      visualType: "image",
    },
    {
      id: "rapidez",
      eyebrow: "Fácil y rápido",
      title: "Pedí en pocos pasos",
      description:
        "Elegí, personalizá y pagá online: tu pedido llega directo a la puerta de tu casa.",
      ctaLabel: "Empezar a pedir",
      ctaTo: "/productos",
      ctaVariant: "outline",
      visual: "🛵",
    },
    {
      id: "combo",
      eyebrow: "Promo de la semana",
      title: "Box Familiar con 20% off",
      description:
        "Hamburguesas, papas grandes y bebidas para compartir, a un precio especial.",
      ctaLabel: "Ver promociones",
      ctaTo: "/promociones",
      visual: "🎉",
    },
  ];

  return <Carousel slides={slides} />;
}

export default Hero;
