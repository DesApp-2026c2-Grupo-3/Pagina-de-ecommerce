import { Check, TriangleAlert, X } from 'lucide-react'
import { useToast, type ToastTema } from '../context/ToastContext'

// ==========================================
// CONSTANTES DE ESTILO POR TEMA
// ==========================================
const contenedorPosicionClase =
  'pointer-events-none fixed left-4 right-4 top-20 z-50 flex justify-center sm:left-auto sm:top-24 sm:justify-end'

const tarjetaBaseClase =
  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border-2 py-3 pl-3 pr-2 text-sm font-bold transition-all'

const estilosPorTema: Record<
  ToastTema,
  { tarjeta: string; icono: string; botonCerrar: string }
> = {
  dark: {
    tarjeta:
      'border-brand-cream/20 bg-brand-dark text-brand-cream shadow-[4px_4px_0_var(--color-brand-red)]',
    icono: 'bg-brand-mustard text-brand-dark',
    botonCerrar: 'hover:bg-white/10',
  },
  light: {
    tarjeta:
      'border-brand-dark bg-brand-cream text-brand-dark shadow-[4px_4px_0_var(--color-brand-red)]',
    icono: 'border border-brand-dark bg-emerald-600 text-white',
    botonCerrar: 'hover:bg-black/10',
  },
  mostaza: {
    tarjeta:
      'border-brand-dark bg-brand-mustard text-brand-dark shadow-[4px_4px_0_var(--color-brand-red)]',
    icono: 'border border-brand-dark bg-emerald-600 text-white',
    botonCerrar: 'hover:bg-black/10',
  },
}


const tarjetaAlertaClase =
  'border-brand-dark bg-brand-red text-white shadow-[4px_4px_0_#1A1414]'
const iconoAlertaClase = 'bg-brand-cream text-brand-red'

const iconoBaseClase = 'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full'
const botonAccionClase =
  'mt-2 min-h-9 rounded-full border-2 border-current px-3.5 text-xs font-extrabold uppercase tracking-wide transition-opacity hover:opacity-85'
const botonCerrarBaseClase =
  'grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors'

function Toast() {
  const { toast, dismissToast } = useToast()

  if (!toast) return null

  const esAlerta = toast.variante === 'alerta'
  const estiloTema = estilosPorTema[toast.tema]

  return (
    <div className={contenedorPosicionClase} aria-live="polite">
      <div
        role={esAlerta ? 'alert' : 'status'}
        className={`${tarjetaBaseClase} ${esAlerta ? tarjetaAlertaClase : estiloTema.tarjeta}`}
      >
        <span
          className={`${iconoBaseClase} ${esAlerta ? iconoAlertaClase : estiloTema.icono}`}
        >
          {esAlerta ? (
            <TriangleAlert className="h-4 w-4" strokeWidth={3} />
          ) : (
            <Check className="h-4 w-4" strokeWidth={3} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="break-words leading-snug">{toast.message}</p>
          {toast.accion && (
            <button
              type="button"
              onClick={() => {
                toast.accion?.onClick()
                dismissToast()
              }}
              className={botonAccionClase}
            >
              {toast.accion.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={dismissToast}
          aria-label="Cerrar aviso"
          className={`${botonCerrarBaseClase} ${esAlerta ? 'hover:bg-white/10' : estiloTema.botonCerrar}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
