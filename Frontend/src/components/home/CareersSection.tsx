function CareersSection() {
  return (
    <section
      id="trabaja-con-nosotros"
      className="scroll-mt-24 bg-brand-dark px-4 py-16 text-white"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <span className="text-4xl" aria-hidden="true">
          💼
        </span>
        <h2 className="text-3xl font-extrabold sm:text-4xl">Trabajá con nosotros</h2>
        <p className="max-w-2xl text-white/80">
          Buscamos gente con ganas de aprender y crecer en un ambiente dinámico. Sumate al
          equipo de BurgerFast y formá parte de una marca que crece todos los días.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-5 py-4">
            <p className="font-bold">Horarios flexibles</p>
            <p className="mt-1 text-sm text-white/70">
              Turnos que se adaptan a tu estudio o tu rutina.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-5 py-4">
            <p className="font-bold">Capacitación paga</p>
            <p className="mt-1 text-sm text-white/70">
              Te formamos desde el primer día, sin experiencia previa.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-5 py-4">
            <p className="font-bold">Buen clima de equipo</p>
            <p className="mt-1 text-sm text-white/70">
              Crecimiento interno y compañerismo real.
            </p>
          </div>
        </div>

        <a
          href="mailto:rrhh@burgerfast.com"
          className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Enviá tu CV
        </a>
      </div>
    </section>
  )
}

export default CareersSection
