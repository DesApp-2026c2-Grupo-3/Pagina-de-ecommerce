function CompanySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <span className="text-3xl" aria-hidden="true">
            🎯
          </span>
          <h2 className="mt-3 text-xl font-extrabold text-brand-dark">Nuestra misión</h2>
          <p className="mt-2 text-gray-600">
            Acercarte la mejor hamburguesa de la ciudad, hecha con ingredientes frescos y
            entregada rápido, sin resignar calidad ni sabor.
          </p>
        </div>
        <div>
          <span className="text-3xl" aria-hidden="true">
            🌱
          </span>
          <h2 className="mt-3 text-xl font-extrabold text-brand-dark">
            Compromiso sustentable
          </h2>
          <p className="mt-2 text-gray-600">
            Trabajamos con packaging reciclable, reducimos el desperdicio de alimentos y
            elegimos proveedores locales siempre que podemos.
          </p>
        </div>
        <div>
          <span className="text-3xl" aria-hidden="true">
            ⭐
          </span>
          <h2 className="mt-3 text-xl font-extrabold text-brand-dark">Por qué elegirnos</h2>
          <p className="mt-2 text-gray-600">
            Ingredientes frescos, entrega rápida, seguimiento de tu pedido en tiempo real y
            múltiples medios de pago para que pedir sea siempre fácil.
          </p>
        </div>
      </div>
    </section>
  )
}

export default CompanySection
