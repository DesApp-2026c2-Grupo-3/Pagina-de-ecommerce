import type { ReactNode } from 'react'
import { AlertTriangle, CircleAlert } from 'lucide-react'

interface Props {
  tono?: 'aviso' | 'error'
  children: ReactNode
}

const estilos = {
  aviso: 'bg-brand-mustard text-brand-dark',
  error: 'bg-brand-red text-white',
}

// Mensaje destacado: 'aviso' (mostaza) para advertencias, 'error' (rojo) para lo que impide confirmar
function Aviso({ tono = 'aviso', children }: Props) {
  const Icono = tono === 'error' ? CircleAlert : AlertTriangle
  return (
    <div className={`flex gap-3 rounded-2xl border-2 border-brand-dark p-4 text-sm font-semibold shadow-[4px_4px_0_var(--color-brand-dark)] ${estilos[tono]}`}>      
    <Icono className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export default Aviso