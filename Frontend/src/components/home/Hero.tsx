import heroImg from '../../assets/hero.png'

function Hero() {
  return (
    <section className="bg-brand-red text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-12 md:flex-row md:justify-between">
        <div className="max-w-xl text-center md:text-left">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            La hamburguesa que amás, en la puerta de tu casa
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Pedí en minutos y seguí tu pedido en tiempo real.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#menu"
              className="rounded-full bg-brand-dark px-6 py-3 text-center font-bold text-white transition-opacity hover:opacity-90"
            >
              Ver menú
            </a>
            <a
              href="#"
              className="rounded-full border-2 border-white bg-transparent px-6 py-3 text-center font-bold text-white transition-colors hover:bg-white hover:text-brand-red"
            >
              Promociones
            </a>
          </div>
        </div>
        <img
          src={heroImg}
          alt="Hamburguesa destacada"
          className="h-56 w-56 object-contain drop-shadow-xl md:h-72 md:w-72"
        />
      </div>
    </section>
  )
}

export default Hero
