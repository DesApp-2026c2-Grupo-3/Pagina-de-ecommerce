import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'

interface Props {
  /** 'preparando': plancha y pasos. 'listo': check rojo con confeti */
  fase: 'preparando' | 'listo'
  sucursal: string
  numeroPedido?: number
}

// Piezas de confeti: hacia dónde vuela cada una y su forma
const CONFETI = [
  { x: '-120px', y: '-90px', clase: 'h-2.5 w-4 bg-brand-mustard' },
  { x: '130px', y: '-70px', clase: 'h-2.5 w-4 bg-brand-red' },
  { x: '-100px', y: '110px', clase: 'h-3.5 w-3.5 rounded-full bg-brand-mustard' },
  { x: '120px', y: '100px', clase: 'h-2.5 w-4 bg-brand-cream' },
  { x: '10px', y: '-140px', clase: 'h-3.5 w-3.5 rounded-full bg-brand-red' },
]

// Pantalla decorativa mientras se crea el pedido. Ocupa toda la ventana.
function PreparandoPedido({ fase, sucursal, numeroPedido }: Props) {
  const pasos = ['Recibimos tu pedido', 'Prendimos la plancha', `Avisando a ${sucursal}`]

  return (
    <div
      role="status"
      aria-live="polite"
      className="pantalla-carga fixed inset-0 z-20 grid place-items-center pt-20 bg-brand-cream px-4 text-brand-dark"
    >
      {/* Banda oscura de fondo, como el resto de las páginas */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[40vh] bg-brand-dark" />

      {fase === 'preparando' ? (
        <div className="bf-tarjeta-entra relative flex w-full max-w-md flex-col gap-6 rounded-[2rem] border-[3px] border-brand-dark bg-white p-7 shadow-[10px_10px_0_var(--color-brand-red)] sm:p-9">
          {/* Plancha: vapor, medallón que chisporrotea y llamas */}
          <div aria-hidden="true" className="relative flex h-40 items-end justify-center">
            {[0, 0.4, 0.8].map((delay, i) => (
              <span
                key={delay}
                className="bf-vapor absolute bottom-24 h-10 w-2 rounded-full bg-[#d9cbc7]"
                style={{ left: `calc(50% + ${(i - 1) * 30}px)`, animationDelay: `${delay}s` }}
              />
            ))}
            <div className="flex flex-col items-center">
              <div className="bf-chisporrotea -mb-1.5 h-10 w-40 rounded-[22px] border-4 border-brand-dark bg-[#6b2f1d]" />
              <div className="h-6 w-64 rounded-lg bg-brand-dark" />
              <div className="mt-1.5 flex gap-10">
                {['bg-brand-mustard h-8', 'bg-brand-red h-10', 'bg-brand-mustard h-8'].map((clase, i) => (
                  <span
                    key={i}
                    className={`bf-llama w-6 rounded-[50%_50%_40%_40%/70%_70%_30%_30%] border-[3px] border-brand-dark ${clase}`}
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-center font-display text-4xl font-extrabold leading-none tracking-tight">
            Preparando tu pedido
          </h2>

          {/* Pasos que se van tildando */}
          <ol className="flex flex-col gap-3">
            {pasos.map((paso, i) => (
              <li
                key={paso}
                className="bf-paso flex items-center gap-3 text-lg font-bold"
                style={{ animationDelay: `${0.3 + i * 0.95}s` }}
              >
                <span className="relative h-7 w-7 shrink-0 rounded-full border-[3px] border-brand-dark bg-brand-cream">
                  <span
                    className="bf-tilde absolute -inset-[3px] grid place-items-center rounded-full bg-brand-red text-white"
                    style={{ animationDelay: `${0.9 + i * 0.95}s` }}
                  >
                    <Check className="h-4 w-4" strokeWidth={4} />
                  </span>
                </span>
                {paso}
              </li>
            ))}
          </ol>

          <div aria-hidden="true" className="h-3.5 overflow-hidden rounded-full border-[3px] border-brand-dark bg-brand-cream">
            <div className="bf-barra-3s h-full bg-brand-mustard"/>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col items-center gap-6 text-center">
          <div className="relative h-40 w-40">
            {CONFETI.map((c) => (
              <span
                key={c.x + c.y}
                aria-hidden="true"
                className={`bf-confeti absolute left-1/2 top-1/2 border-2 border-brand-dark ${c.clase}`}
                style={{ '--x': c.x, '--y': c.y } as CSSProperties}
              />
            ))}
            <div className="bf-pop grid h-40 w-40 place-items-center rounded-full border-4 border-brand-dark bg-brand-red text-white shadow-sticker">
              <Check className="h-20 w-20" strokeWidth={3.2} />
            </div>
          </div>
          <div className="bf-subir" style={{ animationDelay: '0.25s' }}>
            <p className="font-display text-5xl font-extrabold tracking-tight">¡Pedido confirmado!</p>
            {numeroPedido && (
              <p className="mt-2 text-lg font-bold text-brand-muted">Pedido #{numeroPedido} · ya está en la cocina</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PreparandoPedido