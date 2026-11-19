import { useId } from 'react'
import { CircleAlert } from 'lucide-react'
import { useZona } from '../../context/ZonaContext'

interface Props {
  sucursal?: string
  motivo?: string | null
  className?: string
  onAccion?: () => void
  textoAccion?: string
  mostrarEnMobile?: boolean
  conBoton?: boolean
}

const STYLES = {
  containerBase:
    'group relative items-center gap-2 rounded-xl border-2 border-brand-dark bg-brand-red px-2.5 py-1.5 text-white shadow-[3px_3px_0_var(--color-brand-dark)] lg:px-3 lg:py-2',
  iconBadge: 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-brand-red lg:h-7 lg:w-7',
  text: 'min-w-0 flex-1 truncate text-xs font-bold leading-tight lg:text-sm',
  actionBtn:
    'ml-auto shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-brand-red transition-transform hover:translate-y-0.5 lg:ml-0 lg:px-3 lg:py-1.5 lg:text-xs',
  tooltip:
    'pointer-events-none absolute left-0 top-full z-20 mt-2 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border-2 border-brand-mustard bg-brand-dark px-3 py-2 text-xs font-semibold leading-snug text-brand-cream opacity-0 shadow-[3px_3px_0_var(--color-brand-red)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
} as const

function AvisoCierreSucursal({
  sucursal,
  motivo,
  className = '',
  onAccion,
  textoAccion = 'Cambiar dirección',
  mostrarEnMobile = false,
  conBoton = false,
}: Props) {
  const { abrirSelector } = useZona()
  const tooltipId = useId()

  const mensaje = `${motivo ? `${motivo}. ` : 'Está fuera del horario de atención. '}No se pueden generar pedidos por ahora.`
  const accion = onAccion ?? abrirSelector
  const visibilidadClass = mostrarEnMobile ? 'flex' : 'hidden md:flex'

  return (
    <div role="alert" aria-describedby={tooltipId} className={`${STYLES.containerBase} ${visibilidadClass} ${className}`}>
      <span className={STYLES.iconBadge}>
        <CircleAlert className="h-3.5 w-3.5 lg:h-4 lg:w-4" strokeWidth={2.6} />
      </span>

      <p className={STYLES.text}>{sucursal ?? 'La sucursal'} está cerrada ahora</p>

      {conBoton && (
        <button type="button" onClick={accion} className={STYLES.actionBtn}>
          {textoAccion}
        </button>
      )}

      <span id={tooltipId} role="tooltip" className={STYLES.tooltip}>
        {mensaje}
      </span>
    </div>
  )
}

export default AvisoCierreSucursal
