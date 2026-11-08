import { useEffect, useState } from 'react'
import { Quote, Star } from 'lucide-react'
import { getCalificacionesRecientes } from '../../services/calificacionService'
import { formatearFechaHora } from '../../utils/fechas'
import type { CalificacionPublica } from '../../types/calificacion'

// "Lo que dicen nuestros clientes": las últimas calificaciones aprobadas por un admin
function OpinionesSection() {
  const [opiniones, setOpiniones] = useState<CalificacionPublica[]>([])

  useEffect(() => {
    getCalificacionesRecientes()
      .then(setOpiniones)
      .catch(() => setOpiniones([])) // si falla, la sección simplemente no se muestra
  }, [])

  // Sin opiniones aprobadas no se muestra nada
  if (opiniones.length === 0) return null

  return (
    <section className="bg-brand-sand/50 px-4 py-16 text-brand-dark sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-muted">Opiniones reales</p>
          <h2 className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Lo que dicen <span className="text-brand-red">nuestros clientes</span>
          </h2>
        </div>

        {/* flex-wrap + justify-center: las tarjetas van una al lado de la otra y siempre quedan centradas */}
        <ul className="flex flex-wrap justify-center gap-8">
          {opiniones.map((o, i) => (
            <li
              key={o.id}
              className={`relative flex w-full max-w-sm flex-col gap-4 rounded-[1.75rem] border-2 border-brand-dark bg-white p-7 pt-9 shadow-sticker transition-transform duration-300 hover:rotate-0 sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] ${
                i % 2 === 0 ? '-rotate-1' : 'rotate-1'
              }`}
            >
              {/* Comillas "pegadas" sobre el borde de la tarjeta */}
              <span className="absolute -top-5 left-6 grid h-10 w-10 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard">
                <Quote className="h-5 w-5 fill-brand-dark text-brand-dark" />
              </span>

              <div className="flex gap-0.5" aria-label={`${o.puntaje} de 5 estrellas`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-5 w-5 ${n <= o.puntaje ? 'fill-brand-mustard text-brand-dark' : 'fill-white text-brand-dark/30'}`}
                    strokeWidth={1.75}
                  />
                ))}
              </div>

              <p className="flex-1 break-words text-lg leading-relaxed">{o.comentario}</p>

              <div className="flex items-center gap-3 border-t-2 border-dashed border-brand-sand pt-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-red font-display text-lg font-extrabold text-white">
                  {o.nombre.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-extrabold leading-tight">{o.nombre}</p>
                  <p className="text-xs text-brand-muted">{formatearFechaHora(o.fecha)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default OpinionesSection