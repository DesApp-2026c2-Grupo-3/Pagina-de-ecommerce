import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../../services/productService'
import { estiloCategoria, type IconoCategoria } from '../../config/categorias'
import { esCategoriaOculta, grupoDeCategoria } from '../../config/gruposCatalogo'
import CategoryIcon from '../icons/CategoryIcon'
import FilaDeslizable from '../ui/FilaDeslizable'
import type { Category } from '../../types/product'
import { ArrowRight } from 'lucide-react'
import { useAuth } from  '../../context/AuthContext'

interface Acceso {
  clave: string
  nombre: string
  to: string
  icono: IconoCategoria
  fondo: string
}

// Café y Menú Café se muestran como una sola tarjeta "Cafetería" que abre ese grupo del catálogo
const GRUPO_UNIDO = 'cafeteria'

function accesos(categorias: Category[]): Acceso[] {
  const lista: Acceso[] = []
  for (const categoria of categorias) {
    // Las salsas no van en el menú (se ofrecen en el carrito)
    if (esCategoriaOculta(categoria.nombre)) continue
    const grupo = grupoDeCategoria(categoria.nombre)
    if (grupo?.slug === GRUPO_UNIDO) {
      if (!lista.some((a) => a.clave === GRUPO_UNIDO)) {
        lista.push({ clave: GRUPO_UNIDO, nombre: grupo.nombre, to: `/catalogo?grupo=${GRUPO_UNIDO}`, icono: 'desayuno', fondo: 'bg-brand-mustard' })
      }
      continue
    }
    lista.push({ clave: String(categoria.id), nombre: categoria.nombre, to: `/catalogo?categoria=${categoria.id}`, ...estiloCategoria(categoria.nombre) })
  }
  return lista
}

// "Elegí por antojo": acceso directo al catálogo filtrado por categoría
function CategoriasRow() {
  const [categorias, setCategorias] = useState<Category[]>([])

  const { user } = useAuth()
  const idUsuario = user?.id ? String(user.id) : undefined

  useEffect(() => {
    getCategories()
      .then(setCategorias)
      .catch(() => setCategorias([]))
  }, [])

  if (categorias.length === 0) return null

  return (
    <section className="bg-brand-cream px-4 py-12 text-brand-dark">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">Elegí por antojo</h2>
          <Link
            to="/catalogo"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-brand-dark bg-white px-5 text-sm font-bold shadow-sticker transition-transform hover:translate-y-0.5"
          >
            Ver todo el menú <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <FilaDeslizable
          key={idUsuario ?? 'invitado'}
          userId={idUsuario}
          className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:gap-4 md:overflow-visible md:px-0"
        >
          {accesos(categorias).map((acceso) => (
            <Link
              key={acceso.clave}
              to={acceso.to}
              className="flex w-28 shrink-0 flex-col items-center gap-3 rounded-3xl border-2 border-brand-dark bg-white px-2 pb-4 pt-5 text-center text-sm font-bold transition-transform hover:translate-y-1 md:w-auto"
            >
              <span className={`grid h-16 w-16 place-items-center rounded-2xl ${acceso.fondo}`}>
                <CategoryIcon icono={acceso.icono} />
              </span>
              {acceso.nombre}
            </Link>
          ))}
        </FilaDeslizable>
      </div>
    </section>
  )
}

export default CategoriasRow