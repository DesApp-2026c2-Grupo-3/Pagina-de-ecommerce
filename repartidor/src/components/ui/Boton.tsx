import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle, type LucideIcon } from 'lucide-react'

export type VarianteBoton = 'primaria' | 'secundaria' | 'exito' | 'peligro' | 'peligroSuave' | 'fantasma'
export type TamanoBoton = 'md' | 'lg'

interface BotonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  children: ReactNode
  variante?: VarianteBoton
  // md: 48 px (acciones secundarias); lg: 56 px (la acción principal de la pantalla)
  tamano?: TamanoBoton
  icono?: LucideIcon
  cargando?: boolean
  // Texto mientras carga ("Retirando…"); si falta, se mantiene el texto normal
  textoCargando?: string
  anchoCompleto?: boolean
}

// Texto blanco solo sobre tonos 700 para cumplir 4.5:1 (plan UX, sección 9)
const VARIANTES: Record<VarianteBoton, string> = {
  primaria: 'border-orange-700 bg-orange-700 text-white enabled:hover:border-orange-800 enabled:hover:bg-orange-800',
  exito: 'border-emerald-700 bg-emerald-700 text-white enabled:hover:border-emerald-800 enabled:hover:bg-emerald-800',
  peligro: 'border-red-700 bg-red-700 text-white enabled:hover:border-red-800 enabled:hover:bg-red-800',
  secundaria: 'border-slate-300 bg-white text-slate-900 enabled:hover:bg-slate-50',
  // Acción que deshace algo pero no es la principal ("Quitar del viaje")
  peligroSuave: 'border-red-300 bg-white text-red-700 enabled:hover:bg-red-50',
  fantasma: 'border-transparent bg-transparent text-orange-800 enabled:hover:bg-orange-50',
}

const DESHABILITADO = 'cursor-not-allowed border-slate-200 bg-slate-200 text-slate-600'

const TAMANOS: Record<TamanoBoton, string> = {
  md: 'min-h-12 px-4 text-base',
  lg: 'min-h-14 px-5 text-lg',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-2xl border-2 font-bold transition ' +
  'enabled:active:scale-[0.98] motion-reduce:transition-none motion-reduce:enabled:active:scale-100 ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300'

export default function Boton({
  children,
  variante = 'primaria',
  tamano = 'md',
  icono,
  cargando = false,
  textoCargando,
  anchoCompleto = false,
  disabled = false,
  type = 'button',
  ...resto
}: BotonProps) {
  // Mientras carga conserva su color (no es un botón "apagado"), pero no se puede volver a tocar
  const colores = disabled && !cargando ? DESHABILITADO : `${VARIANTES[variante]}${cargando ? ' cursor-wait' : ''}`
  const Icono = cargando ? LoaderCircle : icono

  return (
    <button
      {...resto}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`${BASE} ${TAMANOS[tamano]} ${colores}${anchoCompleto ? ' w-full' : ''}`}
    >
      {Icono && (
        <Icono
          aria-hidden="true"
          size={tamano === 'lg' ? 22 : 20}
          className={cargando ? 'animate-spin motion-reduce:animate-none' : undefined}
        />
      )}
      <span>{cargando && textoCargando ? textoCargando : children}</span>
    </button>
  )
}
