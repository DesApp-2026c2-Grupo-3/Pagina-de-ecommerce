interface StepperProps {
  pasos: string[]
  actual: number // el primer paso es 1
  onIrA: (paso: number) => void
}

function Stepper({ pasos, actual, onIrA }: StepperProps) {
  return (
    <div>
      <ol className="flex items-center gap-2">
        {pasos.map((titulo, i) => {
          const n = i + 1
          const esActual = n === actual
          const hecho = n < actual
          return (
            <li key={titulo} className="flex flex-1 items-center gap-2 last:flex-none">
              <button
                type="button"
                onClick={() => onIrA(n)}
                aria-current={esActual ? 'step' : undefined}
                aria-label={`Paso ${n}: ${titulo}`}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${
                  esActual
                    ? 'bg-brand-red text-white'
                    : hecho
                      ? 'bg-brand-red/15 text-brand-red'
                      : 'bg-brand-dark/10 text-brand-dark/50'
                }`}
              >
                {hecho ? '✓' : n}
              </button>
              <span
                className={`hidden text-sm font-semibold sm:inline ${
                  esActual ? 'text-brand-dark' : 'text-gray-400'
                }`}
              >
                {titulo}
              </span>
              {n < pasos.length && <span className="h-0.5 flex-1 rounded bg-brand-dark/10" />}
            </li>
          )
        })}
      </ol>
      {/* En celular no entran los títulos: se muestra el paso actual en texto */}
      <p className="mt-2 text-sm font-semibold text-brand-dark sm:hidden">
        Paso {actual} de {pasos.length} · {pasos[actual - 1]}
      </p>
    </div>
  )
}

export default Stepper