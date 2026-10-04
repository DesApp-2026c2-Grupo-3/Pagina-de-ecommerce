import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { crearProducto } from '../../services/productoService'
import FormularioProducto, { aPedido, productoVacio } from '../../components/FormularioProducto'

export default function NuevoProducto() {
  const { mostrarToast } = useToast()
  const navigate = useNavigate()

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Nuevo producto</h1>
      <FormularioProducto
        inicial={productoVacio}
        textoBoton="Crear producto"
        onCancelar={() => navigate('/admin/productos')}
        onGuardar={async (datos) => {
          await crearProducto(aPedido(datos))
          mostrarToast('Producto creado!')
          navigate('/admin/productos')
        }}
      />
    </main>
  )
}