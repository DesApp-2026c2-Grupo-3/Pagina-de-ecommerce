import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Paginacion from '../../components/Paginacion'
import { Pencil, Trash2, Plus, DollarSign } from 'lucide-react'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import { useToast } from '../../context/ToastContext'
import MensajeVacio from '../../components/MensajeVacio'
import { obtenerProductos } from '../../services/productos'
import { obtenerCategorias } from '../../services/categorias'
import { eliminarProducto as eliminarProductoAPI } from '../../services/productos'

export default function Productos() {
  const navigate = useNavigate();
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 5;
  const [productoAEliminar, setProductoAEliminar] = useState<number | null>(null);
  const { mostrarToast } = useToast();

  const [productos, setProductos] = useState<any[]>([])

  const [categorias, setCategorias] = useState<any[]>([])

  const eliminarProducto = async (id: number) => {
    try {
      await eliminarProductoAPI(id)

      const productosActualizados = productos.filter(
        (producto: any) => producto.id !== id
      )

      setProductos(productosActualizados)

      const ultimaPagina = Math.max(1, Math.ceil(productosActualizados.length / productosPorPagina))

      if (paginaActual > ultimaPagina) {
        setPaginaActual(ultimaPagina)
      }

      mostrarToast('Producto eliminado!')
    } catch (error) {
      console.error('Error al eliminar producto:', error)
    }
  }

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const datos = await obtenerProductos()
        setProductos(datos)
      } catch (error) {
        console.error('Error al cargar productos:', error)
      }
    }

    cargarProductos()
  }, [])

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
  
  const indiceUltimoProducto = 
  paginaActual * productosPorPagina

  const indicePrimerProducto =
  indiceUltimoProducto - productosPorPagina

  const productosPagina = productos.slice(
    indicePrimerProducto,
    indiceUltimoProducto
  )

  return (
    <main className="p-8 ">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Productos
          </h1>

          <p className="text-gray-600 mt-2">
            Gestioná los productos disponibles en el sistema.
          </p>
        </div>

        <button
        onClick={() => navigate('/admin/productos/nuevo')}
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
        <table className="min-w-max w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-6 py-3">Nombre</th>
              <th className="text-left px-6 py-3">Descripcion</th>
              <th className="text-left px-6 py-3">Categoria</th>
              <th className="text-left px-6 py-3">Precio</th>
              <th className="text-left px-6 py-3">Imagen</th>
              <th className="text-left px-6 py-3">Disponibilidad</th>
              <th className="text-right px-6 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {productosPagina.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10">
                  <MensajeVacio mensaje="No hay productos registrados." />
                </td>
              </tr>
            ) : (
            productosPagina.map((producto: any) => {
              const categoria = categorias.find(
                (categoria: { id: number }) =>
                  categoria.id === producto.categoriaId
              )
              return(


              <tr key={producto.id} className="border-t border-b">
                <td className="px-6 py-4">
                  {producto.nombre}
                </td>

                <td className="px-6 py-4">
                  {producto.descripcion}
                </td>

                <td className="px-6 py-4">
                  {categoria?.nombre || 'Sin categoria'}
                </td>

                <td className="px-6 py-4">
                  <div className='flex items-center gap-1'>
                    <DollarSign size={18} />{producto.precio}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {producto.imagen}
                </td>

                <td className="px-6 py-4">
                  {producto.disponible ? 'Disponible' : 'No disponible'}
                </td>

                <td className="flex justify-end gap-2 px-6 py-4">
                    <button onClick={() => navigate(`/admin/productos/editar/${producto.id}`)}
                    className="bg-emerald-200 text-success hover:text-success-hover p-2 border rounded
                    hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                        <Pencil size={18} />
                    </button>

                    <button onClick={() =>  setProductoAEliminar(producto.id)}
                    className="bg-red-200 text-danger hover:text-danger-hover p-2 border rounded
                    hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                        <Trash2 size={18} />
                    </button>
                </td>
              </tr>
              )
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmarEliminacion
      abierto={productoAEliminar !== null}
      mensaje="¿Estás seguro de que querés eliminar este producto?"
      onConfirmar={() => {
        if (productoAEliminar !== null) {
          eliminarProducto(productoAEliminar)
          setProductoAEliminar(null)
          }
        }
      }
      onCancelar={() => setProductoAEliminar(null)}/>

      <Paginacion
        paginaActual={paginaActual}
        totalElementos={productos.length}
        elementosPorPagina={productosPorPagina}
        cambiarPagina={setPaginaActual} />
        
    </main>
  )
}