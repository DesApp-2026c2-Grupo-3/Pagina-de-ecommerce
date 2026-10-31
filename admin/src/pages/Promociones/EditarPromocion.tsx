import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { actualizarPromocion, obtenerPromocionPorId } from '../../services/promocionService'
import FormularioPromocion, { aPedido, desdePromocion, type DatosPromocion } from '../../components/FormularioPromocion'

export default function EditarPromocion() {
  const { id } = useParams()
  const { mostrarToast } = useToast()
  const navigate = useNavigate()
  const [inicial, setInicial] = useState<DatosPromocion | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerPromocionPorId(Number(id))
      .then((promocion) => setInicial(desdePromocion(promocion)))
      .catch(() => setError('No se pudo cargar la promoción.'))
  }, [id])

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Editar promoción</h1>

      {error && <p className="text-red-600">{error}</p>}
      {!inicial && !error && <p className="text-gray-600">Cargando...</p>}

      {/* El formulario se dibuja recién cuando llegó la promo, así arranca con sus datos */}
      {inicial && (
        <FormularioPromocion
          inicial={inicial}
          textoBoton="Guardar cambios"
          onCancelar={() => navigate('/admin/promociones')}
          onGuardar={async (datos) => {
            await actualizarPromocion(Number(id), aPedido(datos))
            mostrarToast('Promoción modificada!')
            navigate('/admin/promociones')
          }}
        />
      )}
    </main>
  )
}
