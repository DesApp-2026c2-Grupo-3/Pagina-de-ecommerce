import type { ReactNode } from 'react'
import CarruselFlechas from '../ui/CarruselFlechas'
import ProductCard from './ProductCard'
import type { ProductoBackend } from '../../types/product'

interface RankingProductosRowProps {
  titulo: string
  lugar: ReactNode
  productos: ProductoBackend[]
  claseSeccion?: string
  etiqueta: string
}

function RankingProductosRow({ titulo, lugar, productos, claseSeccion = 'py-12 sm:py-16', etiqueta }: RankingProductosRowProps) {
  return (
    <section className={`bg-brand-cream px-4 text-brand-dark ${claseSeccion}`}>
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 font-display text-3xl font-extrabold tracking-tight sm:mb-8 sm:text-4xl">
          {titulo} {lugar}
        </h2>

        <CarruselFlechas etiqueta={etiqueta} claseLista="gap-4 snap-x snap-mandatory sm:gap-5 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible">
          {/* 🛠️ SOLUCIÓN EN RankingProductosRow.tsx: 
    Eliminamos los aspect-square del padre. Dejamos que en mobile conserve el formato controlado, 
    pero en sm, md y lg se adapte de forma fluida a la grilla nativa de Tailwind. */}
          {productos.map((producto, i) => (
            <div
              key={producto.id}
              className="relative w-[75vw] max-w-[400px] shrink-0 snap-center sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-full lg:shrink mx-auto"
            >
              <span className="absolute left-2 top-2 z-10 grid h-8 w-8 -rotate-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-dark font-display text-xs font-extrabold text-white sm:left-3 sm:top-3 sm:h-10 sm:w-10 sm:text-sm">
                #{i + 1}
              </span>
              <ProductCard product={producto} indice={i} compacta={false} mostrarDescripcion={false} />
            </div>
          ))}

        </CarruselFlechas>
      </div>
    </section>
  )
}

export default RankingProductosRow
