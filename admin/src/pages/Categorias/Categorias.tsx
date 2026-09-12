import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Categorias() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState(() => {
    const categoriasGuardadas = localStorage.getItem('categorias')
   
    if (categoriasGuardadas) {
        return JSON.parse(categoriasGuardadas)
    }
    return []
  });

    const eliminarCategoria = (id: number) => {
      const categoriasActualizadas = categorias.filter(
        (categoria) => categoria.id !== id)
        
        setCategorias(categoriasActualizadas)

        localStorage.setItem('categorias',
        JSON.stringify(categoriasActualizadas)
      )
    }

  return (
  <main className="p-8">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">
          Categorías
        </h1>

        <p className="mt-2 text-gray-600">
          Gestión de categorías de productos.
        </p>

      </div>

      <button onClick={() => navigate('/admin/categorias/nueva')}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Nueva categoría
      </button>
    </div>
    
    <div className="bg-white border rounded-lg overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-100">
        <tr>
          <th className="text-left px-6 py-3">Nombre</th>
          <th className="text-left px-6 py-3">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {categorias.map((categoria: { id: number; nombre: string }) => (
          <tr key={categoria.id} className="border-t border-b">
            <td className="px-6 py-4">
              {categoria.nombre}
            </td>

            <td className="px-6 py-4">
              <button onClick={() => 
              navigate(`/admin/categorias/editar/${categoria.id}`)}
               className="text-blue-600 hover:text-blue-800 pr-1">
              Editar
              </button>

              <button onClick={() => eliminarCategoria(categoria.id)}
              className="text-red-600 hover:text-red-800">
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  </main>
  )
}