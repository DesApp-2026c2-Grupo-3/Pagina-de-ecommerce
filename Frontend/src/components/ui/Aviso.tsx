import type { ReactNode } from 'react'
import { AlertTriangle, CircleAlert } from 'lucide-react'

interface Props {
  variante?: 'aviso' | 'error'
  titulo?: ReactNode
  mensaje?: ReactNode
  children?: ReactNode
  className?: string
}

const estilos = {
  aviso: 'bg-brand-mustard text-brand-dark',
  error: 'bg-brand-red text-white',
}

function Aviso({ variante = 'aviso', titulo, mensaje, children, className = '' }: Props) {
  const Icono = variante === 'error' ? CircleAlert : AlertTriangle
  return (
    <div
      role={variante === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-2xl border-2 border-brand-dark p-4 text-sm font-semibold shadow-[4px_4px_0_var(--color-brand-dark)] ${estilos[variante]} ${className}`}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {titulo && <p>{titulo}</p>}
        {mensaje && <p className={titulo ? 'mt-1' : undefined}>{mensaje}</p>}
        {children}
      </div>
    </div>
  )
}

export default Aviso
