import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Paginacion from '../../components/Paginacion'
import { Pencil, Trash2, Plus } from 'lucide-react'

export default function Categorias() {
  const navigate = useNavigate();
    const [paginaActual, setPaginaActual] = useState(1);
  const categoriaPorPagina = 5;

  const [categorias, setCategorias] = useState(() => {
    const categoriasGuardadas = localStorage.getItem('categorias')
   
    if (categoriasGuardadas) {
        return JSON.parse(categoriasGuardadas)
    }
    return []
  });

  const eliminarCategoria = (id: number) => {
    const categoriasActualizadas = categorias.filter(
      (categoria: any) => categoria.id !== id)
        
      setCategorias(categoriasActualizadas)

      localStorage.setItem('categorias',
      JSON.stringify(categoriasActualizadas)
    )
  }

  const indiceUltimaCategoria = 
  paginaActual * categoriaPorPagina

  const indicePrimeraCategoria =
  indiceUltimaCategoria - categoriaPorPagina

  const categoriasPagina = categorias.slice(
    indicePrimeraCategoria,
    indiceUltimaCategoria
  )

  return (
  <main className="p-8">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold">
          Categorías
        </h1>

        <p className="mt-2 text-gray-600">
          Gestión de categorías de productos.
        </p>

      </div>

      <button onClick={() => navigate('/admin/categorias/nueva')}
      className="bg-action text-white px-4 py-4 rounded-full border 
      shadow-[0_0_10px_rgba(249,115,22,0.6)]
      hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]
      transition-all
      border-orange-400 
      hover:bg-action-hover w-fit ml-auto">
        <Plus size={22} />
      </button>
    </div>
    
    <div className="bg-white border rounded-lg overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-100">
        <tr>
          <th className="text-left px-6 py-3">Nombre</th>
          <th className="text-right px-6 py-3">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {categoriasPagina.map((categoria: { id: number; nombre: string }) => (
          <tr key={categoria.id} className="border-t border-b">
            <td className="px-6 py-4">
              {categoria.nombre}
            </td>

            <td className="flex justify-end gap-2 px-6 py-4">
              <button onClick={() => navigate(`/admin/categorias/editar/${categoria.id}`)}
              className="bg-emerald-200 text-success hover:text-success-hover p-2 border rounded
              hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  <Pencil size={18} />
              </button>

              <button onClick={() => eliminarCategoria(categoria.id)}
              className="bg-red-200 text-danger hover:text-danger-hover p-2 border rounded
              hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
    <Paginacion
      paginaActual={paginaActual}
      totalElementos={categorias.length}
      elementosPorPagina={categoriaPorPagina}
      cambiarPagina={setPaginaActual} />
  </main>
  )
}