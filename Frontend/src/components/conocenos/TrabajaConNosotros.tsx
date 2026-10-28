import { BriefcaseBusiness, GraduationCap, Sparkles, Users } from 'lucide-react'

const MOTIVOS = [
  { titulo: 'Sumate al equipo', texto: 'Formá parte de nuestro equipo en nuestras distintas sucursales.', Icono: Users },
  { titulo: 'Aprendé y crecé', texto: 'Buscamos personas comprometidas con ganas de seguir aprendiendo.', Icono: GraduationCap },
  { titulo: 'Sé parte de la experiencia', texto: 'Ayudanos a brindar una buena experiencia a cada cliente.', Icono: Sparkles },
]

function TrabajaConNosotros() {
  return (
    <section id="trabaja-con-nosotros" className="scroll-mt-24 bg-brand-red px-4 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-5">
          <span className="grid h-16 w-16 shrink-0 -rotate-6 place-items-center rounded-2xl border-[3px] border-brand-dark bg-brand-mustard text-brand-dark">
            <BriefcaseBusiness className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1 basis-72">
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Trabajá con nosotros</h2>
            <p className="mt-2 max-w-2xl text-white/85">
              Buscamos personas con ganas de aprender, crecer y formar parte de un equipo dinámico.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {MOTIVOS.map(({ titulo, texto, Icono }) => (
            <article
              key={titulo}
              className="flex flex-col gap-3 rounded-3xl border-2 border-brand-dark bg-brand-cream p-6 text-brand-dark shadow-sticker"
            >
              <Icono className="h-7 w-7 text-brand-red" />
              <h3 className="font-display text-xl font-extrabold">{titulo}</h3>
              <p className="text-brand-muted">{texto}</p>
            </article>
          ))}
        </div>

        <p className="mt-10 font-display text-2xl font-extrabold">
          Queremos crecer junto a las personas que forman parte de BurgerFast.
        </p>
      </div>
    </section>
  )
}

export default TrabajaConNosotros
