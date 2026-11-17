import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../../services/productService'
import { estiloDeCategoria, type IconoCategoria } from '../../config/categorias'
import CategoryIcon from '../icons/CategoryIcon'
import FilaDeslizable from '../ui/FilaDeslizable'
import type { Category } from '../../types/product'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const CACHE_KEY = 'categorias_cache_v1'

const STYLES = {
  section: 'overflow-hidden bg-brand-cream py-2 text-brand-dark md:py-4',
  container: 'mx-auto max-w-7xl px-4',
  header: 'mb-4 flex flex-row items-center justify-between gap-3 md:mb-6',
  title: 'py-2 font-display text-2xl font-extrabold tracking-tight md:text-4xl',
  ctaLink:
    'inline-flex min-h-[2.25rem] shrink-0 items-center gap-1.5 rounded-full border-2 border-brand-dark bg-white px-3 text-xs font-bold shadow-sticker transition-transform hover:translate-y-0.5 md:min-h-11 md:gap-2 md:px-5 md:text-sm',
  ctaIcon: 'h-3.5 w-3.5 md:h-4 md:w-4',
  sliderRow:
    'scrollbar-hide mx-[clamp(-16px,calc(16.87vw-75px),0px)] flex gap-1.5 overflow-x-auto px-0 pb-2 min-[480px]:max-[659px]:justify-between min-[480px]:max-[659px]:gap-2 min-[660px]:gap-2.5 md:grid md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:gap-4 md:overflow-visible',
  card: 'flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 bg-transparent px-0.5 py-1 text-center text-[11px] font-bold transition-transform hover:translate-y-1 min-[480px]:max-[659px]:w-auto min-[480px]:max-[659px]:flex-1 min-[480px]:max-[659px]:text-xs min-[660px]:w-24 min-[660px]:gap-2 min-[660px]:rounded-3xl min-[660px]:border-2 min-[660px]:border-brand-dark min-[660px]:bg-white min-[660px]:px-1 min-[660px]:pb-3 min-[660px]:pt-4 min-[660px]:text-xs md:w-auto md:gap-3 md:px-2 md:pb-4 md:pt-5 md:text-sm',
  iconBox:
    'grid h-12 w-12 place-items-center rounded-2xl min-[480px]:max-[659px]:h-14 min-[480px]:max-[659px]:w-14 min-[660px]:h-14 min-[660px]:w-14 md:h-16 md:w-16',
  iconScale: 'scale-90 transition-transform min-[480px]:scale-100',
  cardLabel: 'block max-w-full truncate px-0.5 leading-tight md:whitespace-normal',
} as const

interface Acceso {
  clave: string
  nombre: string
  to: string
  icono: IconoCategoria
  fondo: string
}

export function accesos(categorias: Category[]): Acceso[] {
  return categorias
    .filter((categoria) => categoria.categoriaPadreId == null)
    .map((categoria) => ({
      clave: String(categoria.id),
      nombre: categoria.nombre,
      to: `/catalogo?categoria=${categoria.id}`,
      ...estiloDeCategoria(categoria),
    }))
}

function leerCacheCategorias(): Category[] {
  try {
    const guardado = localStorage.getItem(CACHE_KEY)
    return guardado ? (JSON.parse(guardado) as Category[]) : []
  } catch {
    return []
  }
}

function CategoriasRow() {
  const [categorias, setCategorias] = useState<Category[]>(leerCacheCategorias)

  const { user } = useAuth()
  const idUsuario = user?.id ? String(user.id) : undefined

  useEffect(() => {
    getCategories()
      .then((datos) => {
        setCategorias(datos)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(datos))
        } catch {
          // Ignoramos si el storage está lleno o bloqueado
        }
      })
      .catch(() => {
        setCategorias((prev) => (prev.length > 0 ? prev : leerCacheCategorias()))
      })
  }, [])

  if (categorias.length === 0) return null

  return (
    <section className={STYLES.section}>
      <div className={STYLES.container}>
        <div className={STYLES.header}>
          <h2 className={STYLES.title}>
            Elegí por <span className="text-brand-red">antojo</span>
          </h2>

          <Link to="/catalogo" className={STYLES.ctaLink}>
            <span className="min-[360px]:hidden">Menú</span>
            <span className="hidden min-[360px]:inline">Ver todo el menú</span>
            <ArrowRight className={STYLES.ctaIcon} />
          </Link>
        </div>

        <FilaDeslizable key={idUsuario ?? 'invitado'} userId={idUsuario} className={STYLES.sliderRow}>
          {accesos(categorias).map((acceso) => (
            <Link key={acceso.clave} to={acceso.to} className={STYLES.card}>
              <span className={`${STYLES.iconBox} ${acceso.fondo}`}>
                <div className={STYLES.iconScale}>
                  <CategoryIcon icono={acceso.icono} />
                </div>
              </span>

              <span className={STYLES.cardLabel}>{acceso.nombre}</span>
            </Link>
          ))}
        </FilaDeslizable>
      </div>
    </section>
  )
}

export default CategoriasRow
