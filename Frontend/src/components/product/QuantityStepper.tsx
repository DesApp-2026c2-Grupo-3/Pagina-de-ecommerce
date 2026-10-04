interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  /** Nombre de lo que se cuenta, para los lectores de pantalla (ej: "Queso") */
  label: string
  min?: number
  max?: number
  step?: number
}

const redondear = (n: number) => Math.round(n * 100) / 100

// Control "− 1 +" en forma de píldora
function QuantityStepper({ value, onChange, label, min = 1, max = 99, step = 1 }: QuantityStepperProps) {
  const boton =
    'grid h-9 w-9 place-items-center text-xl leading-none text-brand-dark transition-colors hover:text-brand-red disabled:cursor-not-allowed disabled:text-brand-dark/25 disabled:hover:text-brand-dark/25'

  return (
    <div className="inline-flex shrink-0 items-center rounded-full border border-brand-dark/40" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Quitar ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, redondear(value - step)))}
        className={boton}
      >
        −
      </button>
      <span className="min-w-6 text-center font-semibold text-brand-dark" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Agregar ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, redondear(value + step)))}
        className={boton}
      >
        +
      </button>
    </div>
  )
}

export default QuantityStepper
