import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { obtenerProductoPorId, actualizarProducto } from '../../services/productoService'
import FormularioProducto, { aPedido, desdeProducto, type DatosProducto } from '../../components/FormularioProducto'

export default function EditarProducto() {
  const { id } = useParams()
  const { mostrarToast } = useToast()
  const navigate = useNavigate()
  const [inicial, setInicial] = useState<DatosProducto | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerProductoPorId(Number(id))
      .then((producto) => setInicial(desdeProducto(producto)))
      .catch(() => setError('No se pudo cargar el producto.'))
  }, [id])

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Editar producto</h1>

      {error && <p className="text-red-600">{error}</p>}
      {!inicial && !error && <p className="text-gray-600">Cargando...</p>}

      {/* El formulario se dibuja recién cuando llegó el producto, así arranca con sus datos */}
      {inicial && (
        <FormularioProducto
          inicial={inicial}
          textoBoton="Guardar cambios"
          onCancelar={() => navigate('/admin/productos')}
          onGuardar={async (datos) => {
            await actualizarProducto(Number(id), aPedido(datos))
            mostrarToast('Producto modificado!')
            navigate('/admin/productos')
          }}
        />
      )}
    </main>
  )
}