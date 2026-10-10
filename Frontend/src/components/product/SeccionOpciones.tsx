import type { ReactNode } from 'react'

interface Props {
  titulo: string
  /** Texto chico a la derecha: "Elegí 1", "Opcional"... */
  etiqueta?: string
  children: ReactNode
}

// Bloque de opciones del detalle de producto, separado por una línea punteada
function SeccionOpciones({ titulo, etiqueta, children }: Props) {
  return (
    <section className="mt-6 border-t-2 border-dashed border-brand-sand pt-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">{titulo}</h2>
        {etiqueta && <span className="shrink-0 text-sm font-bold text-brand-muted">{etiqueta}</span>}
      </div>
      {children}
    </section>
  )
}

export default SeccionOpciones