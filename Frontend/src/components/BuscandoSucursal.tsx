import { Store } from 'lucide-react'

interface Props {
  sucursal: string
  distanciaKm: number
}

// Cuadrícula de calles del mini mapa
const CALLES = {
  backgroundColor: 'var(--color-brand-sand)',
  backgroundImage: 'linear-gradient(#fff 6px, transparent 6px), linear-gradient(90deg, #fff 6px, transparent 6px)',
  backgroundSize: '64px 64px',
}

// Pantalla decorativa al elegir una dirección: busca y muestra la sucursal que te atiende
function BuscandoSucursal({ sucursal, distanciaKm }: Props) {
  const km = distanciaKm.toLocaleString('es-AR', { maximumFractionDigits: 1 })

  return (
    <div
      role="status"
      aria-live="polite"
      className="pantalla-carga fixed inset-0 z-20 grid place-items-center bg-brand-dark/60 px-4 pt-20 backdrop-blur-sm"
    >
      <div className="bf-tarjeta-entra flex w-full max-w-md flex-col gap-6 rounded-[2rem] border-[3px] border-brand-dark bg-brand-cream p-7 text-brand-dark shadow-[10px_10px_0_var(--color-brand-red)]">
        {/* Mini mapa: tu pin, ondas de búsqueda, la ruta y la sucursal */}
        <div aria-hidden="true" className="relative h-60 overflow-hidden rounded-3xl border-[3px] border-brand-dark" style={CALLES}>
          <svg viewBox="0 0 460 240" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path
              className="bf-ruta"
              d="M120 170 C 170 170, 190 90, 250 100 S 330 70, 350 70"
              fill="none"
              stroke="var(--color-brand-red)"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
          {[0, 0.5].map((delay) => (
            <span
              key={delay}
              className="bf-radar absolute left-[20%] top-[58%] h-14 w-14 rounded-full border-[3px] border-brand-red"
              style={{ animationDelay: `${0.2 + delay}s` }}
            />
          ))}
          <div className="bf-pin absolute left-[22%] top-[48%] grid h-10 w-10 place-items-center rounded-[50%_50%_50%_0] border-[3px] border-brand-dark bg-brand-red">
            <span className="h-3 w-3 rounded-full bg-brand-cream" />
          </div>
          <div
            className="bf-pop absolute left-[71%] top-[15%] grid h-14 w-14 place-items-center rounded-2xl border-[3px] border-brand-dark bg-brand-mustard"
            style={{ animationDelay: '1.6s' }}
          >
            <Store className="h-7 w-7" strokeWidth={2.4} />
          </div>
        </div>

        {/* Texto que cambia: buscando → encontrada */}
        <div className="relative h-20 text-center">
          <div className="bf-texto-sale absolute inset-0">
            <p className="font-display text-3xl font-extrabold tracking-tight">Buscando tu sucursal…</p>
            <p className="mt-1 font-bold text-brand-muted">Calculamos cuál te queda más cerca</p>
          </div>
          <div className="bf-texto-entra absolute inset-0">
            <p className="font-display text-3xl font-extrabold tracking-tight">
              Te atiende <span className="text-brand-red">{sucursal}</span>
            </p>
            <p className="mt-1 font-bold text-brand-muted">a {km} km de tu dirección</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuscandoSucursal