import { useId } from 'react'
import { CircleAlert, MapPin } from 'lucide-react'
import { useZona } from '../../context/ZonaContext'

interface Props {
  sucursal?: string
  motivo?: string | null
  className?: string
  /** Permite cerrar un modal u overlay antes de abrir el selector de dirección */
  onAccion?: () => void
  textoAccion?: string
  mostrarEnMobile?: boolean
  conBoton?: boolean
}

const STYLES = {
  containerBase:
    'group relative items-center gap-2.5 rounded-xl border-2 border-brand-dark bg-brand-red px-3.5 py-2.5 text-white shadow-[4px_4px_0_#000000] sm:gap-3 sm:px-4 sm:py-3',
  iconBadge:
    'grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard text-brand-dark',
  icon: 'h-5 w-5',
  text: 'min-w-0 flex-1 text-sm font-extrabold leading-snug text-white sm:truncate sm:text-base',
  actionBtn:
    'ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-brand-dark bg-brand-mustard px-3.5 py-2 text-sm font-extrabold text-brand-dark shadow-[2px_2px_0_#000000] transition-transform hover:translate-y-0.5 sm:ml-0 sm:gap-2 sm:px-4',
  pinIcon: 'h-4 w-4 shrink-0 text-brand-dark',
  tooltip:
    'pointer-events-none absolute left-0 top-full z-20 mt-2 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border-2 border-brand-mustard bg-brand-dark px-3.5 py-2.5 text-xs font-bold leading-snug text-brand-cream opacity-0 shadow-[4px_4px_0_#000000] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
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
    <div
      role="alert"
      aria-describedby={tooltipId}
      className={`${STYLES.containerBase} ${visibilidadClass} ${className}`}
    >
      <span className={STYLES.iconBadge}>
        <CircleAlert className={STYLES.icon} strokeWidth={2.6} />
      </span>

      <p className={STYLES.text}>{sucursal ?? 'La sucursal'} está cerrada ahora</p>

      {conBoton && (
        <button type="button" onClick={accion} className={STYLES.actionBtn}>
          <MapPin className={STYLES.pinIcon} strokeWidth={2.8} />
          <span className="min-[480px]:hidden">Cambiar</span>
          <span className="hidden min-[480px]:inline">{textoAccion}</span>
        </button>
      )}

      <span id={tooltipId} role="tooltip" className={STYLES.tooltip}>
        {mensaje}
      </span>
    </div>
  )
}

export default AvisoCierreSucursal
