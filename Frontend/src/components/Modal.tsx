import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

// Ancho máximo según lo que contiene el modal
const ANCHOS = {
  sm: 'max-w-sm', // un solo dato (teléfono, DNI, fecha)
  md: 'max-w-md', // un formulario corto
  lg: 'max-w-lg', // contenido grande (ej: un mapa)
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  tamanio?: keyof typeof ANCHOS
  children: ReactNode
  cerrable?: boolean // false = sin ✕ y sin Esc (hay que completar algo para seguir)
}

function Modal({ isOpen, onClose, title, subtitle, tamanio = 'md', cerrable = true, children }: ModalProps) {
  const tituloId = useId()
  // Se cierra con la tecla Esc
  useEffect(() => {
    if (!isOpen || !cerrable) return    
    function alPresionar(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [isOpen, cerrable, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 px-4 backdrop-blur-sm"
      onClick={cerrable ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className={`max-h-[90vh] w-full ${ANCHOS[tamanio]} overflow-y-auto rounded-[1.75rem] border-2 border-brand-dark bg-brand-cream p-6 text-brand-dark shadow-[8px_8px_0_var(--color-brand-red)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={tituloId} className="font-display text-3xl font-extrabold leading-tight tracking-tight">              
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-gray-800">{subtitle}</p>}
          </div>
          {cerrable && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-brand-dark bg-white transition-colors hover:bg-brand-dark hover:text-brand-cream"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal