import type { ReactNode } from 'react'

interface Props {
  titulo: ReactNode
  subtitulo?: ReactNode
  /** Contenido a la derecha del título (buscador, pasos de compra, etc.) */
  children?: ReactNode
  /** Versión más baja, para que el contenido arranque más arriba (ej.: checkout) */
  compacto?: boolean
}

// Banda oscura con el título de la página. El contenido de abajo puede montarse encima con un margen negativo.
function PageHeader({ titulo, subtitulo, children, compacto = false }: Props) {  
  return (
    <section className={`bg-brand-dark px-4 text-brand-cream ${compacto ? 'pb-14 pt-5' : 'pb-20 pt-10'}`}>      
    <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className={`font-display font-extrabold leading-none tracking-tight ${compacto ? 'text-4xl sm:text-5xl' : 'text-5xl sm:text-6xl'}`}>{titulo}</h1>          
          {subtitulo && <p className={`${compacto ? 'mt-1' : 'mt-3'} text-brand-cream/70`}>{subtitulo}</p>}        
          </div>
        {children}
      </div>
    </section>
  )
}

export default PageHeader