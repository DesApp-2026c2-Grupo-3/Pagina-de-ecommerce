import { useEffect, useId, type ReactNode } from 'react'

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

function Modal({ isOpen, onClose, title, subtitle, tamanio = 'md', cerrable = true, children }: ModalProps) {  const tituloId = useId()

  // Se cierra con la tecla Esc
  useEffect(() => {
    if (!isOpen || !cerrable) return    
    function alPresionar(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/50 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className={`max-h-[90vh] w-full ${ANCHOS[tamanio]} overflow-y-auto rounded-2xl bg-white p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={tituloId} className="text-2xl font-extrabold text-brand-dark">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </div>
          {cerrable && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-2xl leading-none text-brand-dark/50 hover:text-brand-red"
            >
              ✕
            </button>
          )}
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal