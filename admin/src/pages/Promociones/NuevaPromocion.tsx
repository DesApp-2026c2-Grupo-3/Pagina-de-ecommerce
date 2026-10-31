import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { crearPromocion } from '../../services/promocionService'
import FormularioPromocion, { aPedido, promocionVacia } from '../../components/FormularioPromocion'

export default function NuevaPromocion() {
  const { mostrarToast } = useToast()
  const navigate = useNavigate()

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Nueva promoción</h1>
      <FormularioPromocion
        inicial={promocionVacia}
        textoBoton="Crear promoción"
        onCancelar={() => navigate('/admin/promociones')}
        onGuardar={async (datos) => {
          await crearPromocion(aPedido(datos))
          mostrarToast('Promoción creada!')
          navigate('/admin/promociones')
        }}
      />
    </main>
  )
}
