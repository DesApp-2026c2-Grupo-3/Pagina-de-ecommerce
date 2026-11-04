import type { ReactNode } from 'react'

interface Props {
  titulo: ReactNode
  subtitulo?: ReactNode
  /** Contenido a la derecha del título (buscador, pasos de compra, etc.) */
  children?: ReactNode
}

// Banda oscura con el título de la página. El contenido de abajo puede montarse encima con un margen negativo.
function PageHeader({ titulo, subtitulo, children }: Props) {
  let restoDelTexto = "";
  let ultimaPalabra = "";
   if (titulo) {
    const palabras = titulo.trim().split(/\s+/);
    ultimaPalabra = palabras.pop() || "";
    restoDelTexto = palabras.join(" ");
  }
  return (
    <section className="bg-brand-dark px-4 pb-20 pt-10 text-brand-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">
             {titulo ? (
              <>
                {restoDelTexto}{' '}
                <span className="text-brand-red">{ultimaPalabra}</span>
              </>
            ) : (
              "Título genérico"
            )}
          </h1>
          {subtitulo && <p className="mt-3 text-brand-cream/70">{subtitulo}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}

export default PageHeader