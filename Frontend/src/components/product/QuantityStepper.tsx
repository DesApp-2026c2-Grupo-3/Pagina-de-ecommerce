interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  /** Nombre de lo que se cuenta, para los lectores de pantalla (ej: "Queso") */
  label: string
  min?: number
  max?: number
  step?: number
  /** Versión más chica para tarjetas compactas como el carrito */
  compacto?: boolean
  /** Oculta el borde exterior de la píldora */
  sinBorde?: boolean
}

const redondear = (n: number) => Math.round(n * 100) / 100

// ==========================================
// CONSTANTES DE ESTILO
// ==========================================
const contenedorBaseClase = 'inline-flex shrink-0 items-center rounded-full bg-white'
const bordeActivoClase = 'border-2 border-brand-dark p-0.5'
const sinBordeClase = 'border-0 p-1'

const botonBaseClase =
  'grid place-items-center rounded-full font-bold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-30'

const botonNormalTamanoClase = 'h-7 w-7 text-lg xs:h-8 xs:w-8 xs:text-xl sm:h-9 sm:w-9'
const botonCompactoTamanoClase = 'h-6 w-6 text-base sm:h-7 sm:w-7'

// Control "− 1 +" en forma de píldora
function QuantityStepper({
  value,
  onChange,
  label,
  min = 1,
  max = 99,
  step = 1,
  compacto = false,
  sinBorde = false,
}: QuantityStepperProps) {
  const botonTamanoClase = compacto ? botonCompactoTamanoClase : botonNormalTamanoClase
  const valorTamanoClase = compacto ? 'min-w-5 text-xs sm:min-w-6 sm:text-sm' : 'min-w-6 text-sm xs:min-w-7 xs:text-base'

  return (
    <div
      className={`${contenedorBaseClase} ${sinBorde ? sinBordeClase : bordeActivoClase} ${compacto ? 'gap-0.5' : 'gap-1'}`}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label={`Quitar ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, redondear(value - step)))}
        className={`${botonBaseClase} ${botonTamanoClase} bg-brand-cream text-brand-dark hover:bg-brand-sand`}
      >
        −
      </button>
      <span
        className={`text-center font-extrabold text-brand-dark ${valorTamanoClase}`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Agregar ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, redondear(value + step)))}
        className={`${botonBaseClase} ${botonTamanoClase}`}
      >
        +
      </button>
    </div>
  )
}

export default QuantityStepper
