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
  // Inicializamos el estado directamente desde localStorage para que no parpadee ni desaparezca
  const [categorias, setCategorias] = useState<Category[]>(leerCacheCategorias)

  const { user } = useAuth()
  const idUsuario = user?.id ? String(user.id) : undefined

  useEffect(() => {
    getCategories()
      .then((datos) => {
        setCategorias(datos)
        // Actualizamos la caché local con los datos frescos del backend
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(datos))
        } catch {
          // Ignoramos si el storage está lleno o bloqueado
        }
      })
      .catch(() => {
        // Si el backend no corre, NO borramos las categorías; mantenemos las de caché
        setCategorias((prev) => (prev.length > 0 ? prev : leerCacheCategorias()))
      })
  }, [])

  if (categorias.length === 0) return null

  return (
    <section className="bg-brand-cream px-4 py-2 md:py-4 text-brand-dark">
      <div className="mx-auto max-w-7xl">
        {/* Cabecera compactada en mobile */}
        <div className="mb-4 md:mb-6 flex flex-row items-center justify-between gap-3">
          <h2 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight">
            Elegí por <span className="text-brand-red">antojo</span>
          </h2>

          <Link
            to="/catalogo?grupo=todos"
            className="inline-flex min-h-[2.25rem] md:min-h-11 shrink-0 items-center gap-1.5 md:gap-2 rounded-full border-2 border-brand-dark bg-white px-3 md:px-5 text-xs md:text-sm font-bold shadow-sticker transition-transform hover:translate-y-0.5"
          >
            <span className="min-[360px]:hidden">Menú</span>
            <span className="hidden min-[360px]:inline">Ver todo el menú</span>
            <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Link>
        </div>

        <FilaDeslizable
          key={idUsuario ?? 'invitado'}
          userId={idUsuario}
          className="scrollbar-hide -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:gap-4 md:overflow-visible md:px-0"
        >
          {accesos(categorias).map((acceso) => (
            <Link
              key={acceso.clave}
              to={acceso.to}
              className="flex w-24 md:w-auto shrink-0 flex-col items-center gap-2 md:gap-3 rounded-3xl border-2 border-brand-dark bg-white px-1 pb-3 pt-4 md:px-2 md:pb-4 md:pt-5 text-center text-xs md:text-sm font-bold transition-transform hover:translate-y-1"
            >
              <span className={`grid h-14 w-14 md:h-16 md:w-16 place-items-center rounded-2xl ${acceso.fondo}`}>
                <div className="scale-90 md:scale-100 transition-transform">
                  <CategoryIcon icono={acceso.icono} />
                </div>
              </span>

              <span className="leading-tight px-0.5 block truncate max-w-full md:whitespace-normal">
                {acceso.nombre}
              </span>
            </Link>
          ))}
        </FilaDeslizable>
      </div>
    </section>
  )
}

export default CategoriasRow
