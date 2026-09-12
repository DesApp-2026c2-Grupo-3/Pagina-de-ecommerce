import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Productos() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState(() => {
    const productosGuardados = localStorage.getItem('productos')

    if (productosGuardados) {
      return JSON.parse(productosGuardados)
    }
    
    return []
  })

  const eliminarProducto = (id: number) => {
    const productosActualizados = productos.filter(
      (producto) => producto.id !== id)
      
      setProductos(productosActualizados)

      localStorage.setItem('productos',
        JSON.stringify(productosActualizados)
      )}

  return (
    <section className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Productos
          </h1>

          <p className="text-gray-600 mt-1">
            Gestioná los productos disponibles en el sistema.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/productos/nuevo')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Nuevo producto
        </button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-6 py-3">Nombre</th>
              <th className="text-left px-6 py-3">Precio</th>
              <th className="text-left px-6 py-3">Disponibilidad</th>
              <th className="text-left px-6 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id} className="border-t">
                <td className="px-6 py-4">
                  {producto.nombre}
                </td>

                <td className="px-6 py-4">
                  ${producto.precio}
                </td>

                <td className="px-6 py-4">
                  {producto.disponible ? 'Disponible' : 'No disponible'}
                </td>

                <td className="px-6 py-4">
                    <button onClick={() => navigate(`/admin/productos/editar/${producto.id}`)}
                    className="text-blue-600 hover:text-blue-800">
                        Editar
                    </button>

                    <button onClick={() => eliminarProducto(producto.id)}
                    className="text-red-600 hover:text-red-800">
                        Eliminar
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}