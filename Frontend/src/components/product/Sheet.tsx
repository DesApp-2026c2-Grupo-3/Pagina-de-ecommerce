import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Barra fija al pie (ej: el precio y el botón Guardar) */
  footer?: ReactNode
  /** En el celular: 'completo' llega casi hasta arriba; 'medio' ocupa al menos el 60% de la pantalla */
  alto?: 'completo' | 'medio'
}

// Hoja que sube desde abajo en el celular y se centra como un modal en pantallas grandes.
// Se muestra solo mientras el padre la renderiza.
function Sheet({ title, onClose, children, footer, alto = 'medio' }: SheetProps) {
  const cerrar = useRef(onClose)
  cerrar.current = onClose

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar.current()
    }
    const overflowPrevio = document.body.style.overflow
    document.addEventListener('keydown', alTeclear)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflowPrevio
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-dark/60 md:items-center md:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-t-[2rem] border-2 border-b-0 border-brand-dark bg-brand-cream
           md:max-h-[85vh] md:max-w-lg md:rounded-[2rem] md:border-b-2 md:shadow-[8px_8px_0_var(--color-brand-red)] ${
          alto === 'completo' ? 'h-[calc(100dvh-2rem)] md:h-auto' : 'min-h-[60dvh] md:min-h-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
          <h2 className="font-display text-2xl font-extrabold text-brand-dark">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-dark transition-colors hover:bg-brand-red hover:text-white"
          >
            <X size={22} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>

        {footer && (
          <div className="border-t-2 border-dashed border-brand-sand bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sheet