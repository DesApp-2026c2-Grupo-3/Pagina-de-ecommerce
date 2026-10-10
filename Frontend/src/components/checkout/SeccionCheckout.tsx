import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  titulo: string
  Icono: LucideIcon
  children: ReactNode
}

// Bloque del checkout con título e icono (dirección, sucursal...)
function SeccionCheckout({ titulo, Icono, children }: Props) {
  return (
    <section className="rounded-[2rem] border-2 border-brand-dark bg-white p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-extrabold text-brand-dark">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-mustard">
          <Icono className="h-5 w-5" />
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export default SeccionCheckout