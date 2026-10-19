import type { IconoCategoria } from '../../config/categorias'

// Set propio de BurgerFast: trazo grueso + relleno crema. viewBox 48x48.
// "relleno" es la forma pintada de crema; "trazo" son las líneas.
const ICONOS: Record<IconoCategoria, { relleno: string; trazo: string }> = {
  hamburguesa: {
    relleno: 'M8 22c0-9 7-14 16-14s16 5 16 14z',
    trazo: 'M8 22c0-9 7-14 16-14s16 5 16 14zM6 28h36M10 34h28c0 3-3 6-6 6H16c-3 0-6-3-6-6zM18 14v1M26 13v1',
  },
  combo: {
    relleno: 'M6 20h20l-2 20H8z',
    trazo: 'M6 20h20l-2 20H8zM10 20l-1-8M22 20l1-10M28 26c0-6 4-9 9-9s9 3 9 9zM28 31h18',
  },
  papas: {
    relleno: 'M10 22h28l-4 20H14z',
    trazo: 'M10 22h28l-4 20H14zM16 22l-2-14M22 22V6M28 22l1-15M34 22l3-12',
  },
  nuggets: {
    relleno: 'M12 18c4-8 18-8 22 0 6 2 6 12 0 14-4 8-18 8-22 0-6-2-6-12 0-14z',
    trazo: 'M12 18c4-8 18-8 22 0 6 2 6 12 0 14-4 8-18 8-22 0-6-2-6-12 0-14zM18 22h1M26 28h1M22 18h1',
  },
  bebida: {
    relleno: 'M13 14h22l-3 28H16z',
    trazo: 'M13 14h22l-3 28H16zM11 14h26M26 14l4-10h6M15 24h18',
  },
  postre: {
    relleno: 'M14 22h20l-4 20h-12z',
    trazo: 'M14 22h20l-4 20h-12zM12 22c0-7 5-12 12-12s12 5 12 12zM24 10V6',
  },
  ensalada: {
    relleno: 'M6 24h36c0 10-8 16-18 16S6 34 6 24z',
    trazo: 'M6 24h36c0 10-8 16-18 16S6 34 6 24zM14 24c0-6 4-10 10-10M24 24c0-5 3-9 9-9M20 14l2-6',
  },
  sinTacc: {
    relleno: 'M24 42a18 18 0 1 0 0-36 18 18 0 0 0 0 36z',
    trazo: 'M24 42a18 18 0 1 0 0-36 18 18 0 0 0 0 36zM24 36V14M24 20c-3 0-5-2-5-5 3 0 5 2 5 5zM24 20c3 0 5-2 5-5-3 0-5 2-5 5zM24 28c-3 0-5-2-5-5 3 0 5 2 5 5zM24 28c3 0 5-2 5-5-3 0-5 2-5 5zM11 11l26 26',
  },
  desayuno: {
    relleno: 'M8 18h26v14c0 6-5 10-10 10h-6c-5 0-10-4-10-10z',
    trazo: 'M8 18h26v14c0 6-5 10-10 10h-6c-5 0-10-4-10-10zM34 22h3a5 5 0 0 1 0 10h-3M16 6c-2 3 2 5 0 8M24 6c-2 3 2 5 0 8',
  },
  cafe: {
    relleno: 'M6 32c-1.5-6.5 4.5-12.5 10.5-15.5C21 14 26.5 13.5 31.5 16.5c6 3 12 9 10.5 15.5-1 4-6 3-10.5 1.5C27 32 23 31.5 17 33.5c-4.5 1.5-9.5 2.5-11-1.5z',
    trazo: 'M6 32c-1.5-6.5 4.5-12.5 10.5-15.5C21 14 26.5 13.5 31.5 16.5c6 3 12 9 10.5 15.5-1 4-6 3-10.5 1.5C27 32 23 31.5 17 33.5c-4.5 1.5-9.5 2.5-11-1.5z M18.5 15.2c3 5.3 4 11.8 3.5 17.3 M29.5 15.2c-3 5.3-4 11.8-3.5 17.3 M10.5 21.5c4 3 7.5 7 11.5 11 M37.5 21.5c-4 3-7.5 7-11.5 11'
  },
comboCafe: {
  relleno: 'M8 12h20v11c0 4.5-4 7.5-8 7.5h-4c-4 0-8-3-8-7.5V12z M17 42c-1.3-5.3 3.8-10.2 8.6-12.7 3.7-2 8.3-2.5 12.4-.1 5 2.5 10 7.4 8.7 12.7-.8 3.3-5 2.5-8.7 1.2-4-1.2-7.3-1.6-12.3 0-3.7 1.2-7.9 2-9.1-1.1z',
  trazo: 'M8 12h20v11c0 4.5-4 7.5-8 7.5h-4c-4 0-8-3-8-7.5V12zM28 15h2.5c2.2 0 4 1.8 4 4s-1.8 4-4 4H28M14 2c-1.5 2.2 1.5 3.7 0 6M20 2c-1.5 2.2 1.5 3.7 0 6 M17 42c-1.3-5.3 3.8-10.2 8.6-12.7 3.7-2 8.3-2.5 12.4-.1 5 2.5 10 7.4 8.7 12.7-.8 3.3-5 2.5-8.7 1.2-4-1.2-7.3-1.6-12.3 0-3.7 1.2-7.9 2-9.1-1.1z M27.3 28.2c2.5 4.3 3.3 9.7 2.9 14.2 M36.4 28.2c-2.5 4.3-3.3 9.7-2.9 14.2 M20.7 33.4c3.3 2.5 6.2 5.7 9.5 9 M43.3 33.4c-3.3 2.5-6.2 5.7-9.5 9'
}


,
  salsa: {
    relleno: 'M16 18h16v20c0 3-2 4-4 4h-8c-2 0-4-1-4-4z',
    trazo: 'M16 18h16v20c0 3-2 4-4 4h-8c-2 0-4-1-4-4zM19 18v-6h10v6M22 12l2-6 2 6M16 28h16',
  },
  generico: {
    relleno: 'M24 40a14 14 0 1 0 0-28 14 14 0 0 0 0 28z',
    trazo: 'M24 40a14 14 0 1 0 0-28 14 14 0 0 0 0 28zM6 10v10c0 2 2 3 3 3s3-1 3-3V10M9 23v17M40 10c-3 0-4 4-4 9s1 6 4 6v15',
  },
}

interface Props {
  icono: IconoCategoria
  className?: string
}

function CategoryIcon({ icono, className = 'h-10 w-10' }: Props) {
  const { relleno, trazo } = ICONOS[icono]
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={relleno} className="fill-brand-cream" stroke="none" />
      <path d={trazo} />
    </svg>
  )
}

export default CategoryIcon