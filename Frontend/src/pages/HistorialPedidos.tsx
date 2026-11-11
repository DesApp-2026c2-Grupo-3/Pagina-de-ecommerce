import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/realtime/RealtimeContext'
import { getHistorialPedidos } from '../services/orderService'
import type { Order } from '../types/order'
import { FILTROS_PEDIDO, estaEnCurso, type FiltroPedido } from '../config/pedidoEstados'
import {
  aplicarEventoPedido,
  leerEventoPedido,
} from '../utils/notificaciones/eventoPedido'
import AccountLayout from '../components/cuenta/AccountLayout'
import PedidoEnCurso from '../components/cuenta/PedidoEnCurso'
import PedidoCard from '../components/cuenta/PedidoCard'
import ErrorAlert from '../components/ErrorAlert'

function HistorialPedidos() {
  const { user } = useAuth()
  const { suscribir } = useRealtime()
  const [pedidos, setPedidos] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<FiltroPedido>('todos')

  const cargarPedidos = useCallback(() => {
    if (!user) return Promise.resolve()

    return getHistorialPedidos(user.id)
      .then((historial) => {
        setPedidos(historial)
        setError('')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar el historial')
      })
  }, [user])

  useEffect(() => {
    void cargarPedidos().finally(() => setLoading(false))
  }, [cargarPedidos])

  useEffect(() => {
    if (!user) return

    return suscribir((evento) => {
      if (evento.tipo !== 'notificacion') return

      const eventoPedido = leerEventoPedido(evento.payload, user.id)
      if (!eventoPedido) return

      if (eventoPedido.tipo === 'pedido.creado') {
        void cargarPedidos()
        return
      }

      setPedidos((actuales) =>
        actuales.map((pedido) => aplicarEventoPedido(pedido, eventoPedido)),
      )
    })
  }, [cargarPedidos, suscribir, user])

  const enCurso = pedidos.filter((p) => estaEnCurso(p.estado))
  const aplica = FILTROS_PEDIDO.find((f) => f.id === filtro)!.aplica
  // La lista de abajo es solo de pedidos terminados: los en curso ya están arriba
  const filtrados = pedidos.filter((p) => !estaEnCurso(p.estado) && aplica(p.estado))
  
  return (
    <AccountLayout titulo="Historial de pedidos" cargando={loading}>
      <ErrorAlert message={error} />

      {!error && pedidos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-brand-dark bg-white px-6 py-12 text-center">
          <span className="grid h-16 w-16 -rotate-6 place-items-center rounded-2xl bg-brand-mustard">
            <ShoppingBag className="h-8 w-8" />
          </span>
          <p className="font-display text-3xl font-extrabold tracking-tight">Todavía no hiciste pedidos</p>
          <p className="text-brand-muted">Cuando pidas, vas a poder seguirlos y repetirlos desde acá.</p>
          <Link
            to="/catalogo"
            className="inline-flex min-h-12 items-center rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:translate-y-0.5"
          >
            Ver el menú
          </Link>
        </div>
      ) : (
        <>
          {enCurso.map((pedido) => (
            <PedidoEnCurso key={pedido.id} pedido={pedido} />
          ))}

          <div role="tablist" aria-label="Filtrar pedidos" className="mt-2 flex flex-wrap gap-2">
            {FILTROS_PEDIDO.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filtro === f.id}
                onClick={() => setFiltro(f.id)}
                className={`min-h-10 rounded-full border-2 border-brand-dark px-4 text-sm font-bold transition-colors ${
                  filtro === f.id ? 'bg-brand-dark text-brand-cream' : 'bg-white hover:bg-brand-cream'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtrados.length === 0 ? (
            <p className="py-6 text-center text-brand-muted">No hay pedidos en esta categoría.</p>
          ) : (
            <div className="bf-escalonado flex flex-col gap-5">
              {filtrados.map((pedido) => (
                <PedidoCard key={pedido.id} pedido={pedido} />
              ))}
            </div>          )}
        </>
      )}
    </AccountLayout>
  )
}

export default HistorialPedidos