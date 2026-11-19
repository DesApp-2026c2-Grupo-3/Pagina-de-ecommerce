import Carousel from '../home/Carousel'

// Misión, sustentabilidad y por qué elegirnos: tres tarjetas sobre fondo oscuro
const PILARES = [
  {
    titulo: 'Nuestra misión',
    texto:
      'Acercarte la mejor hamburguesa de la ciudad, hecha con ingredientes frescos y entregada rápido, sin resignar calidad ni sabor.',
    imagen: '/homeImg/coso2.jpg',
    alt: 'Repartidor entregando un pedido',
  },
  {
    titulo: 'Compromiso sustentable',
    texto:
      'Trabajamos con packaging reciclable, reducimos el desperdicio de alimentos y elegimos proveedores locales siempre que podemos.',
    imagen: '/homeImg/coso1.jpg',
    alt: 'Packaging sustentable',
  },
  {
    titulo: 'Por qué elegirnos',
    texto:
      'Ingredientes frescos, entrega rápida, seguimiento de tu pedido y múltiples medios de pago para que pedir sea siempre fácil.',
    imagen: '/homeImg/coso3.jpg',
    alt: 'Hamburguesa recién hecha',
  },
] as const

const STYLES = {
  section: 'scroll-mt-24 bg-brand-dark px-4 py-12 text-brand-cream md:py-20',
  container: 'mx-auto max-w-7xl',
  title: 'mb-10 font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl',
  titleHighlight: 'text-brand-red',
  mobileWrapper: 'block pb-8 md:hidden',
  mobileSlide: 'w-full animate-fade-in px-1',
  desktopWrapper: 'hidden md:block',
  desktopGrid: 'grid grid-cols-3 gap-6',
  card: 'flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5',
  cardImage: 'h-52 w-full shrink-0 object-cover',
  cardBody: 'flex flex-1 flex-col gap-3 p-7',
  accentBar: 'h-1.5 w-12 rounded-full bg-brand-mustard',
  cardTitle: 'font-display text-xl font-extrabold md:text-2xl',
  cardText: 'text-sm leading-relaxed text-brand-cream/75 md:text-base',
} as const

function CompanySection() {
  return (
    <section id="sobre-nosotros" className={STYLES.section}>
      <div className={STYLES.container}>
        <h2 className={STYLES.title}>
          Más que una <span className={STYLES.titleHighlight}>hamburguesa</span>
        </h2>

        <div className={STYLES.mobileWrapper}>
          <Carousel autoPlayMs={5000}>
            {PILARES.map((pilar) => (
              <div key={pilar.titulo} className={STYLES.mobileSlide}>
                <article className={STYLES.card}>
                  <img src={pilar.imagen} alt={pilar.alt} className={STYLES.cardImage} />
                  <div className={STYLES.cardBody}>
                    <span className={STYLES.accentBar} />
                    <h3 className={STYLES.cardTitle}>{pilar.titulo}</h3>
                    <p className={STYLES.cardText}>{pilar.texto}</p>
                  </div>
                </article>
              </div>
            ))}
          </Carousel>
        </div>

        <div className={STYLES.desktopWrapper}>
          <div className={STYLES.desktopGrid}>
            {PILARES.map((pilar) => (
              <article key={pilar.titulo} className={STYLES.card}>
                <img src={pilar.imagen} alt={pilar.alt} className={STYLES.cardImage} />
                <div className={STYLES.cardBody}>
                  <span className={STYLES.accentBar} />
                  <h3 className={STYLES.cardTitle}>{pilar.titulo}</h3>
                  <p className={STYLES.cardText}>{pilar.texto}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CompanySection
