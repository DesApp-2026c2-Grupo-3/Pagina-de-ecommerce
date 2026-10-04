import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { crearSucursal } from '../../services/sucursalService'
import FormularioSucursal, { aPedido, sucursalVacia } from '../../components/FormularioSucursal'

export default function NuevaSucursal() {
  const { mostrarToast } = useToast()
  const navigate = useNavigate()

  return (
    <main className="p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold">Nueva sucursal</h1>
      <FormularioSucursal
        inicial={sucursalVacia}
        textoBoton="Crear sucursal"
        onCancelar={() => navigate('/admin/sucursales')}
        onGuardar={async (datos) => {
          await crearSucursal(aPedido(datos))
          mostrarToast('Sucursal creada!')
          navigate('/admin/sucursales')
        }}
      />
    </main>
  )
}