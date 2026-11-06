import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../../services/productService'
import { estiloDeCategoria, type IconoCategoria } from '../../config/categorias'
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
    /* 
      py-6: Reducimos a la mitad el aire superior e inferior en mobile.
      md:py-12: Recupera su espaciado original en desktop.
    */
    <section className="bg-brand-cream px-4 py-6 md:py-12 text-brand-dark">
      <div className="mx-auto max-w-7xl">
        
        {/* Cabecera compactada en mobile */}
        <div className="mb-4 md:mb-6 flex flex-row items-center justify-between gap-3">
          {/* text-2xl en mobile, text-4xl original en md+ */}
          <h2 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight">Elegí por <span className='text-brand-red'>antojo</span></h2>
          
          {/* El botón "Ver todo el menú" se vuelve más sutil en mobile con paddings e h-9 compactos */}
          <Link
            to="/catalogo?grupo=todos"
            className="inline-flex min-h-[2.25rem] md:min-h-11 items-center gap-1.5 md:gap-2 rounded-full border-2 border-brand-dark bg-white px-3 md:px-5 text-xs md:text-sm font-bold shadow-sticker transition-transform hover:translate-y-0.5"
          >
            Ver todo el menú <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Link>
        </div>

        <FilaDeslizable
          key={idUsuario ?? 'invitado'}
          userId={idUsuario}
          className="scrollbar-hide -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:gap-4 md:overflow-visible md:px-0"
        >
          {accesos(categorias).map((acceso) => (
            /* 
              Tarjeta de categoría compactada:
              - w-24: Reducimos el ancho de 28 a 24 en mobile para que entren más ítems en pantalla.
              - pb-3 pt-4: Achicamos la altura reduciendo el aire interno vertical.
              - md:w-auto md:px-2 md:pb-4 md:pt-5: Vuelve a los valores exactos originales.
            */
            <Link
              key={acceso.clave}
              to={acceso.to}
              className="flex w-24 md:w-auto shrink-0 flex-col items-center gap-2 md:gap-3 rounded-3xl border-2 border-brand-dark bg-white px-1 pb-3 pt-4 md:px-2 md:pb-4 md:pt-5 text-center text-xs md:text-sm font-bold transition-transform hover:translate-y-1"
            >
              {/* 
                Contenedor del ícono recortado:
                - h-14 w-14: Reducimos de 16 (4rem) a 14 (3.5rem) en mobile para ganar espacio vertical limpio.
                - md:h-16 md:w-16: Recupera su tamaño original en escritorio.
              */}
              <span className={`grid h-14 w-14 md:h-16 md:w-16 place-items-center rounded-2xl ${acceso.fondo}`}>
                <div className="scale-90 md:scale-100 transition-transform">
                  <CategoryIcon icono={acceso.icono} />
                </div>
              </span>
              
              {/* Texto de la categoría con un pequeño ajuste de interlineado */}
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
