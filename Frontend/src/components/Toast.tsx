import { Check, TriangleAlert, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'

function Toast() {
  const { toast, dismissToast } = useToast()

  if (!toast) return null

  const esAlerta = toast.variante === 'alerta'

  return (
    <div
      className="pointer-events-none fixed right-4 top-24 z-50 flex justify-end"
      aria-live="polite"
    >
      <div
        role={esAlerta ? 'alert' : 'status'}
        className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border-2 border-brand-dark py-3 pl-3 pr-2 text-sm font-bold shadow-[4px_4px_0_var(--color-brand-red)] ${
          esAlerta
            ? 'bg-brand-red text-white'
            : 'bg-brand-dark text-brand-cream'
        }`}
      >
        <span
          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
            esAlerta
              ? 'bg-brand-cream text-brand-red'
              : 'bg-brand-mustard text-brand-dark'
          }`}
        >
          {esAlerta ? (
            <TriangleAlert className="h-4 w-4" strokeWidth={3} />
          ) : (
            <Check className="h-4 w-4" strokeWidth={3} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="break-words">{toast.message}</p>
          {toast.accion && (
            <button
              type="button"
              onClick={() => {
                toast.accion?.onClick()
                dismissToast()
              }}
              className="mt-2 min-h-10 rounded-full border-2 border-current px-3 text-xs font-extrabold uppercase tracking-wide"
            >
              {toast.accion.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={dismissToast}
          aria-label="Cerrar aviso"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
