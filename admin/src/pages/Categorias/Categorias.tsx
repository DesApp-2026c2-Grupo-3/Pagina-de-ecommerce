import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Paginacion from '../../components/Paginacion'
import { Pencil, Trash2, Plus, Ban, CheckCircle } from 'lucide-react'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion';
import { useToast } from '../../context/ToastContext'
import MensajeVacio from '../../components/MensajeVacio'
import { deshabilitarCategoria, habilitarCategoria, obtenerCategorias } from '../../services/categoriaService';
import { eliminarCategoria as eliminarCategoriaAPI } from '../../services/categoriaService'

interface Categoria {
  id: number
  nombre: string
  activo: boolean
}

export default function Categorias() {
  const navigate = useNavigate();
  const [paginaActual, setPaginaActual] = useState(1);
  const categoriaPorPagina = 5;
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<number | null>(null);
  const { mostrarToast } = useToast();

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const cambiarEstado = async (categoria: Categoria) => {
    try {
      if (categoria.activo) {
        await deshabilitarCategoria(categoria.id)
        mostrarToast('Categoría deshabilitada correctamente')
      } else {
        await habilitarCategoria(categoria.id)
        mostrarToast('Categoría habilitada correctamente')
      }

      const datos = await obtenerCategorias()
      setCategorias(datos)
    } catch (error) {
      console.error('Error al cambiar el estado de la categoría:', error)
    }
  }

  const eliminarCategoria = async (id: number) => {
    try {
      await eliminarCategoriaAPI(id)

      const categoriasActualizadas = categorias.filter(
        (categoria: any) => categoria.id !== id
      )

      setCategorias(categoriasActualizadas)

      const ultimaPagina = Math.max(1,Math.ceil(categoriasActualizadas.length / categoriaPorPagina))

      if (paginaActual > ultimaPagina) {
        setPaginaActual(ultimaPagina)
      }

      mostrarToast('Categoria eliminada!')
    } catch (error) {
      console.error('Error al eliminar categoria:', error)
    }
  }

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const datos = await obtenerCategorias()
        setCategorias(datos)
      } catch (error) {
        console.error('Error al cargar categorías:', error)
      }
    }

    cargarCategorias()
  }, [])

  const filtradas = categorias.filter((categoria) => {
    if (filtroEstado === 'activas') return categoria.activo
    if (filtroEstado === 'deshabilitadas') return !categoria.activo
    return true
  })

  const indiceUltimaCategoria = 
  paginaActual * categoriaPorPagina

  const indicePrimeraCategoria =
  indiceUltimaCategoria - categoriaPorPagina

  const categoriasPagina = filtradas.slice(
    (paginaActual - 1) * categoriaPorPagina,
    paginaActual * categoriaPorPagina
  )

  useEffect(() => {
    const ultimaPagina = Math.max(
      1,
      Math.ceil(filtradas.length / categoriaPorPagina)
    )

    if (paginaActual > ultimaPagina) {
      setPaginaActual(ultimaPagina)
    }
  }, [filtradas.length, paginaActual])

  return (
  <main className="p-8">    
  <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Organización del catálogo
        </p>
        <h1 className="text-3xl font-bold">
          Categorías
        </h1>

        <p className="mt-2 text-gray-600">
          Gestión de categorías de productos.
        </p>

      </div>

      <button 
      type="button"
      onClick={() => navigate('/admin/categorias/nueva')}
      title="Nueva categoria"
      className="bg-action text-white px-4 py-4 rounded-full border 
      shadow-[0_0_10px_rgba(249,115,22,0.6)]
      hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]
      transition-all
      border-orange-400 
      hover:bg-action-hover w-fit ml-auto">
        <Plus size={22} />
      </button>
    </div>

    <div className="mb-4">
      <label htmlFor="filtro-categoria" className="sr-only">
        Filtrar categorías
      </label>

      <select
        id="filtro-categoria"
        value={filtroEstado}
        onChange={(e) => {
        setFiltroEstado(e.target.value)
        setPaginaActual(1)
        }}
        className="rounded-lg border bg-white px-3 py-2">
        <option value="todos">Todas las categorías</option>
        <option value="activas">Habilitadas</option>
        <option value="deshabilitadas">Deshabilitadas</option>
      </select>
    </div>
    
    <div className="bg-white border rounded-lg overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-100">
        <tr>
          <th className="text-left px-4 py-3 sm:px-6">Nombre</th>
          <th className="px-4 py-3 text-left sm:px-6">Estado</th>
          <th className="text-right px-4 py-3 sm:px-6">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {categoriasPagina.length === 0 ? (
          <tr>
            <td colSpan={3} className="px-6 py-10">
              <MensajeVacio mensaje={categorias.length === 0 
                ? 'No hay categorías registradas.'
                : 'No hay categorías para este filtro.'}/>
            </td>
          </tr>
        ) : (
        categoriasPagina.map((categoria: Categoria) => (
          <tr key={categoria.id} className="border-t border-b">
            <td className="px-4 py-4 sm:px-6">
              {categoria.nombre}
            </td>

            <td className="px-4 py-4 sm:px-6">
              <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                categoria.activo
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-200 text-gray-600'
              }`}>
                {categoria.activo ? 'Activa' : 'Deshabilitada'}
              </span>
            </td>

            <td className="px-4 py-4 sm:px-6">
              <div className="flex justify-end gap-2">
                <button onClick={() => navigate(`/admin/categorias/editar/${categoria.id}`)}
                className="bg-emerald-200 text-success hover:text-success-hover p-2 border rounded
                hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    <Pencil size={18} />
                </button>

                <button type="button" onClick={() => cambiarEstado(categoria)}
                title={categoria.activo ? 'Deshabilitar categoría' : 'Habilitar categoría'}
                aria-label={`${categoria.activo ? 'Deshabilitar' : 'Habilitar'} ${categoria.nombre}`}
                className={`rounded border p-2 ${
                  categoria.activo
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}>
                
                  {categoria.activo ? <Ban size={18} /> : <CheckCircle size={18} />}
                </button>

                <button onClick={() => setCategoriaAEliminar(categoria.id)}
                className="bg-red-200 text-danger hover:text-danger-hover p-2 border rounded
                hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  <Trash2 size={18} />
                </button>
              </div>
            </td>
          </tr>
        )))}
      </tbody>
    </table>
    </div>

    <ConfirmarEliminacion
    abierto={categoriaAEliminar !== null}
    mensaje="¿Estás seguro de que querés eliminar esta categoria?"
    onConfirmar={() => {
      if (categoriaAEliminar !== null) {
        eliminarCategoria(categoriaAEliminar)
        setCategoriaAEliminar(null)
          }
        }
      }
    onCancelar={() => setCategoriaAEliminar(null)}/>
          
    <Paginacion
      paginaActual={paginaActual}
      totalElementos={filtradas.length}
      elementosPorPagina={categoriaPorPagina}
      cambiarPagina={setPaginaActual} />
  </main>
  )
}