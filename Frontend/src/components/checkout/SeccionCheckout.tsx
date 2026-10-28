import type { ReactNode } from 'react'

interface Props {
  titulo: string
  children: ReactNode
}

// Bloque del checkout: título sobre el fondo y las tarjetas debajo (sin caja contenedora)
function SeccionCheckout({ titulo, children }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl font-extrabold text-brand-dark">{titulo}</h2>
      {children}
    </section>
  )
}

export default SeccionCheckout