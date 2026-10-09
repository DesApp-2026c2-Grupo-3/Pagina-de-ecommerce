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
]

function CompanySection() {
  return (
    <section id="sobre-nosotros" className="scroll-mt-24 bg-brand-dark px-4 py-20 text-brand-cream">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Más que una <span className="text-brand-red">hamburguesa</span>
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PILARES.map((pilar, i) => (
            <article key={pilar.titulo} className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
              <img src={pilar.imagen} alt={pilar.alt} className="h-52 w-full object-cover" />
              <div className="flex flex-col gap-3 p-7">
                <span className="h-1.5 w-12 rounded-full bg-brand-mustard" />
                <h3 className="font-display text-2xl font-extrabold">{pilar.titulo}</h3>
                <p className="leading-relaxed text-brand-cream/75">{pilar.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CompanySection