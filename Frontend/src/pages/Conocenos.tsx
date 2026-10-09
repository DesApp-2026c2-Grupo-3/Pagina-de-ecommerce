import { Link } from 'react-router-dom'
import CompanySection from '../components/conocenos/CompanySection'
import TrabajaConNosotros from '../components/conocenos/TrabajaConNosotros'
import SucursalesMap from '../components/home/SucursalesMap'

function Conocenos() {
  return (
    <main className="bg-brand-cream text-brand-dark">
      {/* Hero: foto de fondo apagada, igual que el carrusel */}
      <section className="relative overflow-hidden bg-brand-dark text-brand-cream">
        <img src="/Nosotros/1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-sm font-extrabold uppercase tracking-widest text-brand-mustard">Conocenos</p>
          <h1 className="mt-3 font-display text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-7xl">
            Más que una
            <br />
            <span className="text-brand-red">hamburguesa</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-brand-cream/80">
            Somos una cadena de comida rápida enfocada en ofrecer hamburguesas de calidad, atención rápida y una
            experiencia simple desde el primer clic hasta el último bocado.
          </p>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brand-red">Quiénes somos</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold leading-tight tracking-tight">
            Una forma simple de disfrutar una buena hamburguesa
          </h2>
          <p className="mt-5 leading-relaxed text-brand-muted">
            Nuestro objetivo es hacer que pedir comida sea rápido, cómodo y accesible. Trabajamos para ofrecer productos
            preparados con ingredientes frescos y una experiencia de compra sencilla, tanto desde nuestras sucursales
            como a través de nuestra plataforma online.
          </p>
          <Link
            to="/catalogo"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Ver el menú
          </Link>
        </div>

        <div className="rotate-2 rounded-[2rem] border-2 border-brand-dark bg-brand-mustard p-3 shadow-sticker">
          <img src="/Nosotros/4.png" alt="Persona pidiendo en la web de BurgerFast" className="h-80 w-full -rotate-2 rounded-3xl object-cover" />
        </div>
      </section>

      <CompanySection />
      <SucursalesMap />
      <TrabajaConNosotros />
    </main>
  )
}

export default Conocenos