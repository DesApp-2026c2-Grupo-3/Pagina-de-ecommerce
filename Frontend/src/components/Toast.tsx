import { useToast } from '../context/ToastContext'

function Toast() {
  const { toast, dismissToast } = useToast()

  if (!toast) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:justify-end"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={dismissToast}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-brand-green bg-white px-5 py-3 font-semibold text-brand-green shadow-lg transition-opacity hover:opacity-90"
      >
        <span aria-hidden="true">✓</span>
        {toast.message}
      </button>
    </div>
  )
}

export default Toast
