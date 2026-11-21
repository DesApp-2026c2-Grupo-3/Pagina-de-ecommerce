import type { ReactNode } from 'react'
import CarruselFlechas from '../ui/CarruselFlechas'
import ProductCard from './ProductCard'
import type { ProductoBackend } from '../../types/product'

const STYLES = {
  section: 'overflow-hidden bg-brand-cream px-4 text-brand-dark',
  container: 'mx-auto max-w-7xl',
  title: 'mb-6 font-display text-3xl font-extrabold tracking-tight sm:mb-8 sm:text-4xl',
  carouselList: 'gap-4 snap-x snap-mandatory sm:gap-5 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible',
  cardWrapper:
    'relative mx-auto min-w-full w-full shrink-0 snap-center sm:min-w-0 sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-full lg:shrink',
  rankBadge:
    'absolute left-2 top-2 z-10 grid h-8 w-8 -rotate-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-dark font-display text-xs font-extrabold text-white sm:left-3 sm:top-3 sm:h-10 sm:w-10 sm:text-sm',
} as const

interface RankingProductosRowProps {
  titulo: string
  lugar: ReactNode
  productos: ProductoBackend[]
  claseSeccion?: string
  etiqueta: string
}

function RankingProductosRow({
  titulo,
  lugar,
  productos,
  claseSeccion = 'py-12 sm:py-16',
  etiqueta,
}: RankingProductosRowProps) {
  return (
    <section className={`${STYLES.section} ${claseSeccion}`}>
      <div className={STYLES.container}>
        <h2 className={STYLES.title}>
          {titulo} {lugar}
        </h2>

        <CarruselFlechas etiqueta={etiqueta} claseLista={STYLES.carouselList}>
          {productos.map((producto, i) => (
            <div key={producto.id} className={STYLES.cardWrapper}>
              <span className={STYLES.rankBadge}>#{i + 1}</span>
              <ProductCard
                product={producto}
                indice={i}
                compacta={false}
                mostrarDescripcion={false}
                horizontalIntermedio
              />
            </div>
          ))}
        </CarruselFlechas>
      </div>
    </section>
  )
}

export default RankingProductosRow
