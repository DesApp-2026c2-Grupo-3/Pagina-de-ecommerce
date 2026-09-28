
export default function SobreNosotros() {
  return (

    <main className="bg-brand-cream">

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-dark text-white">
        <img
          src="/homeImg/nosotros.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />

        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center">
          <p className="text-sm font-bold uppercase tracking-widest">
            Conocenos
          </p>

          <h1 className="mt-3 text-5xl font-extrabold">
            Más que una hamburguesa
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">
            Somos una cadena de comida rápida enfocada en ofrecer
            hamburguesas de calidad, atención rápida y una experiencia
            simple desde el primer clic hasta el último bocado.
          </p>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-red">
            Quiénes somos
          </p>

          <h2 className="mt-2 text-4xl font-extrabold text-brand-dark">
            Una forma simple de disfrutar una buena hamburguesa
          </h2>

          <p className="mt-5 text-gray-700">
            Nuestro objetivo es hacer que pedir comida sea rápido,
            cómodo y accesible. Trabajamos para ofrecer productos
            preparados con ingredientes frescos y una experiencia
            de compra sencilla, tanto desde nuestras sucursales
            como a través de nuestra plataforma online.
          </p>
        </div>

        <img
          src="/homeImg/hamburguesa.jpg"
          alt="Hamburguesa"
          className="h-80 w-full rounded-2xl object-cover"
        />
      </section>

      {/* Misión */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2">
          <img
            src="/homeImg/mision.jpg"
            alt=""
            className="h-80 w-full rounded-2xl object-cover"
          />

          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-red">
              Nuestra misión
            </p>

            <h2 className="mt-2 text-4xl font-extrabold text-brand-dark">
              Calidad que llega hasta tu puerta
            </h2>

            <p className="mt-5 text-gray-700">
              Buscamos acercarte hamburguesas que disfrutes de verdad,
              combinando ingredientes frescos, preparación cuidadosa
              y rapidez en cada pedido.
            </p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-red">
            Lo que nos importa
          </p>

          <h2 className="mt-2 text-4xl font-extrabold text-brand-dark">
            Nuestra forma de trabajar
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-md">
            <h3 className="text-2xl font-bold text-brand-dark">
              Calidad
            </h3>
            <p className="mt-3 text-gray-600">
              Seleccionamos nuestros ingredientes y cuidamos cada
              preparación para ofrecer productos que mantengan
              nuestro estándar en todas las sucursales.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-md">
            <h3 className="text-2xl font-bold text-brand-dark">
              Rapidez
            </h3>
            <p className="mt-3 text-gray-600">
              Queremos que pedir sea fácil y que recibas tu comida
              en el menor tiempo posible, sin dejar de lado la calidad.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-md">
            <h3 className="text-2xl font-bold text-brand-dark">
              Sustentabilidad
            </h3>
            <p className="mt-3 text-gray-600">
              Trabajamos para reducir desperdicios, utilizar
              packaging reciclable y priorizar proveedores locales
              cuando es posible.
            </p>
          </article>
        </div>
      </section>

      {/* Cierre */}
      <section className="bg-brand-red px-6 py-16 text-center text-white">
        <h2 className="text-4xl font-extrabold">
          ¿Ya sabés qué vas a pedir?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-white/90">
          Elegí tu sucursal, explorá nuestro menú y disfrutá
          tu próxima hamburguesa.
        </p>

        <a
          href="/"
          className="mt-6 inline-block rounded-full bg-white px-7 py-3 font-bold text-brand-red"
        >
          Ver menú
        </a>
      </section>

    
  


















 <section
  id="trabaja-con-nosotros"
  className="scroll-mt-24 bg-brand-dark px-4 py-16 text-white"
>
  <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">

    <span className="text-4xl" aria-hidden="true">
      💼
    </span>

    <h2 className="text-3xl font-extrabold sm:text-4xl">
      Trabajá con nosotros
    </h2>

    <p className="max-w-2xl text-white/80">
      Buscamos personas con ganas de aprender, crecer y formar parte
      de un equipo dinámico. Si te interesa trabajar con nosotros,
      queremos conocerte.
    </p>

    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <div className="rounded-xl bg-white/10 px-5 py-4">
        <p className="font-bold">Sumate al equipo</p>
        <p className="mt-1 text-sm text-white/70">
          Formá parte de nuestro equipo en nuestras distintas sucursales.
        </p>
      </div>

      <div className="rounded-xl bg-white/10 px-5 py-4">
        <p className="font-bold">Aprendé y crecé</p>
        <p className="mt-1 text-sm text-white/70">
          Buscamos personas comprometidas con ganas de seguir aprendiendo.
        </p>
      </div>

      <div className="rounded-xl bg-white/10 px-5 py-4">
        <p className="font-bold">Sé parte de la experiencia</p>
        <p className="mt-1 text-sm text-white/70">
          Ayudanos a brindar una buena experiencia a cada cliente.
        </p>
      </div>
    </div>


    <p className="max-w-2xl text-lg font-semibold text-white/90">
      Queremos crecer junto a las personas que forman parte de BurgerFast.
    </p>
    
    {/*<a
      href="mailto:rrhh@burgerfast.com"
      className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
    >
      Enviá tu CV
    </a>*/}

  </div>
</section>
    </main>
  )
}

