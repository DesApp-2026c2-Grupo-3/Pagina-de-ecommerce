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
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-extrabold transition-colors ${
                  esActual
                    ? 'border-brand-dark bg-brand-red text-white'
                    : hecho
                      ? 'border-brand-dark bg-brand-mustard text-brand-dark'
                      : 'border-brand-dark/20 bg-white text-brand-muted'
                }`}
              >
                {hecho ? '✓' : n}
              </button>
              <span
                className={`hidden text-sm font-bold sm:inline ${
                  esActual ? 'text-brand-dark' : 'text-brand-muted'
                }`}
              >
                {titulo}
              </span>
              {n < pasos.length && <span className="h-0 flex-1 border-t-2 border-dashed border-brand-dark/25" />}
            </li>
          )
        })}
      </ol>
      {/* En celular no entran los títulos: se muestra el paso actual en texto */}
      <p className="mt-2 text-sm font-bold text-brand-dark sm:hidden">
        Paso {actual} de {pasos.length} · {pasos[actual - 1]}
      </p>
    </div>
  )
}

export default Stepper