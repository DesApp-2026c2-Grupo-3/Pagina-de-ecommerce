import { Check } from 'lucide-react'
import { useToast } from '../context/ToastContext'

// Aviso chico arriba a la derecha (debajo del navbar). Se cierra solo o al tocarlo.
function Toast() {
  const { toast, dismissToast } = useToast()

  if (!toast) return null

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-50 flex justify-end" aria-live="polite">
      <button
        type="button"
        onClick={dismissToast}
        className="pointer-events-auto flex max-w-xs items-center gap-2.5 rounded-2xl border-2 border-brand-dark bg-brand-dark py-2 pl-2 pr-4 text-sm font-bold text-brand-cream shadow-[4px_4px_0_var(--color-brand-red)]"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-mustard text-brand-dark">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
        <span className="text-left">{toast.message}</span>
      </button>
    </div>
  )
}

export default Toast