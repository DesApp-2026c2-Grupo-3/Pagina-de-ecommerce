import { useId } from 'react'
import { CircleAlert } from 'lucide-react'
import { useZona } from '../../context/ZonaContext'

interface Props {
  sucursal?: string
  motivo?: string | null
  className?: string
  /** Permite cerrar un modal u overlay antes de abrir el selector de dirección */
  onAccion?: () => void
  textoAccion?: string
  /** Los avisos dentro de modales críticos también se muestran en mobile */
  mostrarEnMobile?: boolean
}

function AvisoCierreSucursal({
  sucursal,
  motivo,
  className = '',
  onAccion,
  textoAccion = 'Cambiar dirección',
  mostrarEnMobile = false,
}: Props) {
  const { abrirSelector } = useZona()
  const tooltipId = useId()
  const mensaje = `${motivo ? `${motivo}. ` : 'Está fuera del horario de atención. '}No se pueden generar pedidos por ahora.`
  const accion = onAccion ?? abrirSelector

  return (
    <div
      role="alert"
      aria-describedby={tooltipId}
      className={`group relative ${
        mostrarEnMobile ? 'flex' : 'hidden md:flex'
      } flex-wrap items-center gap-2 rounded-xl border-2 border-brand-dark bg-brand-red px-3 py-2 text-white shadow-[3px_3px_0_var(--color-brand-dark)] sm:flex-nowrap ${className}`}    
      >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-brand-red">        
        <CircleAlert className="h-4 w-4" strokeWidth={2.6} />
      </span>
      <p className="min-w-0 flex-1 truncate text-sm font-bold leading-tight">
        {sucursal ?? 'La sucursal'} está cerrada ahora
      </p>
      <button
        type="button"
        onClick={accion}
        className="ml-auto shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-red transition-transform hover:translate-y-0.5 sm:ml-0"      
        >
        {textoAccion}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border-2 border-brand-mustard bg-brand-dark px-3 py-2 text-xs font-semibold leading-snug text-brand-cream opacity-0 shadow-[3px_3px_0_var(--color-brand-red)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {mensaje}
      </span>
    </div>
  )
}

export default AvisoCierreSucursal
