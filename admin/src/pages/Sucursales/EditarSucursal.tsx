import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { obtenerSucursalPorId, actualizarSucursal } from '../../services/sucursalService'
import FormularioSucursal, { aPedido, desdeSucursal, type DatosSucursal } from '../../components/FormularioSucursal'

export default function EditarSucursal() {
  const { id } = useParams()
  const { mostrarToast } = useToast()
  const navigate = useNavigate()
  const [inicial, setInicial] = useState<DatosSucursal | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerSucursalPorId(Number(id))
      .then((sucursal) => setInicial(desdeSucursal(sucursal)))
      .catch(() => setError('No se pudo cargar la sucursal.'))
  }, [id])

  return (
    <main className="p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold">Editar sucursal</h1>

      {error && <p className="text-red-600">{error}</p>}
      {!inicial && !error && <p className="text-gray-600">Cargando...</p>}

      {/* El formulario se dibuja cuando llegó la sucursal, así arranca con sus datos */}
      {inicial && (
        <FormularioSucursal
          inicial={inicial}
          textoBoton="Guardar cambios"
          onCancelar={() => navigate(-1)}
          onGuardar={async (datos) => {
            await actualizarSucursal(Number(id), aPedido(datos))
            mostrarToast('Sucursal modificada!')
            navigate(-1)
          }}
        />
      )}
    </main>
  )
}