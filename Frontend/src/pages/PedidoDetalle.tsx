import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { estaEnCurso } from '../config/pedidoEstados'
import { usePedidoEnVivo } from '../hooks/usePedidoEnVivo'
import AccountLayout from '../components/cuenta/AccountLayout'
import PedidoEnCurso from '../components/cuenta/PedidoEnCurso'
import PedidoCard from '../components/cuenta/PedidoCard'
import ErrorAlert from '../components/ErrorAlert'

// Detalle de un pedido: se recarga del servidor con cada cambio (plan, C-6)
function PedidoDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const pedidoId = Number(id)
  const idValido = Number.isInteger(pedidoId) && pedidoId > 0
  const { pedido, error, cargando } = usePedidoEnVivo(user && idValido ? pedidoId : null)
  const mensajeError = idValido ? error : 'El pedido solicitado no es válido'

  return (
    <AccountLayout
      titulo={`Pedido #${idValido ? pedidoId : ''}`}
      subtitulo="Seguí el estado de tu pedido en tiempo real."
      cargando={!user || cargando}
    >
      <Link
        to="/historial"
        className="inline-flex w-fit items-center gap-2 text-sm font-bold text-brand-dark/70 hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al historial
      </Link>

      <ErrorAlert message={mensajeError} />

      {!mensajeError && pedido && (
        estaEnCurso(pedido.estado) ? (
          <PedidoEnCurso pedido={pedido} />
        ) : (
          <PedidoCard pedido={pedido} />
        )
      )}
    </AccountLayout>
  )
}

export default PedidoDetalle
