import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/realtime/RealtimeContext'
import { getPedidoCliente } from '../services/orderService'
import type { Order } from '../types/order'
import { estaEnCurso } from '../config/pedidoEstados'
import {
  aplicarEventoPedido,
  leerEventoPedido,
  type EventoPedidoCliente,
} from '../utils/notificaciones/eventoPedido'
import AccountLayout from '../components/cuenta/AccountLayout'
import PedidoEnCurso from '../components/cuenta/PedidoEnCurso'
import PedidoCard from '../components/cuenta/PedidoCard'
import ErrorAlert from '../components/ErrorAlert'

function PedidoDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const { suscribir } = useRealtime()
  const pedidoId = Number(id)
  const idValido = Number.isInteger(pedidoId) && pedidoId > 0
  const [pedido, setPedido] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const eventoPendienteRef = useRef<EventoPedidoCliente | null>(null)

  useEffect(() => {
    if (!user) return

    if (!idValido) {
      setError('El pedido solicitado no es válido')
      setLoading(false)
      return
    }

    let cancelado = false
    setLoading(true)
    setError('')

    getPedidoCliente(pedidoId)
      .then((cargado) => {
        if (cancelado) return

        const pendiente = eventoPendienteRef.current
        eventoPendienteRef.current = null
        setPedido(pendiente ? aplicarEventoPedido(cargado, pendiente) : cargado)
      })
      .catch((err) => {
        if (cancelado) return
        setPedido(null)
        setError(
          err instanceof Error ? err.message : 'No se pudo cargar el pedido',
        )
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })

    return () => {
      cancelado = true
    }
  }, [idValido, pedidoId, user])

  useEffect(() => {
    if (!user || !idValido) return

    return suscribir((evento) => {
      if (evento.tipo !== 'notificacion') return

      const eventoPedido = leerEventoPedido(evento.payload, user.id)
      if (!eventoPedido || eventoPedido.pedidoId !== pedidoId) return

      setPedido((actual) => {
        if (!actual) {
          eventoPendienteRef.current = eventoPedido
          return actual
        }

        return aplicarEventoPedido(actual, eventoPedido)
      })
    })
  }, [idValido, pedidoId, suscribir, user])

  return (
    <AccountLayout
      titulo={`Pedido #${idValido ? pedidoId : ''}`}
      subtitulo="Seguí el estado de tu pedido en tiempo real."
      cargando={loading}
    >
      <Link
        to="/historial"
        className="inline-flex w-fit items-center gap-2 text-sm font-bold text-brand-dark/70 hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al historial
      </Link>

      <ErrorAlert message={error} />

      {!error && pedido && (
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
