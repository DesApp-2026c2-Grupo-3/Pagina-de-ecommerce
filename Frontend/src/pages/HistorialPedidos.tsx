import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHistorialPedidos } from '../services/orderService'
import type { Order } from '../types/order'
import { formatearFechaHora } from '../utils/fechas'
import BotonRepetirPedido from '../components/BotonRepetirPedido'

const estadoColores: Record<string, string> = {
  pendiente: 'bg-brand-red/10 text-brand-red',
  entregado: 'bg-brand-green/10 text-brand-green',
}

function HistorialPedidos() {
  const { user } = useAuth()
  const [pedidos, setPedidos] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    getHistorialPedidos(user.id)
      .then(setPedidos)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar el historial')
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-gray-600">Cargando...</div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center font-semibold text-red-600">
        {error}
      </div>
    )
  }

  if (pedidos.length === 0) {
    return (
      
      <div className="mx-auto flex flex-col items-center justify-center gap-6 px-4 py-24
       text-center bg-stone-900 min-h-screen">
        <div className="flex flex-col gap-4 p-6 rounded bg-stone-800 border-3 border-stone-500">
          <img src="/Otros/bolsaVacia.png" alt="carrito vacio" 
        className="h-80 rounded"/>
        <h1 className="text-3xl font-extrabold text-white">Todavía no hiciste pedidos</h1>
        <Link
          to="/catalogo"
          className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Ver el catalogo
        </Link>
      </div>
      </div>
    )
  }

  return (
    <div className='bg-brand-cream'>
    <div className="mx-auto max-w-3xl px-4 py-12 min-h-screen">
      <h1 className="text-3xl font-extrabold text-brand-dark">Historial de pedidos</h1>

      <div className="mt-8 flex flex-col gap-4">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="rounded-2xl bg-white p-5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-brand-dark">Pedido #{pedido.id}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  estadoColores[pedido.estado] ?? 'bg-brand-dark/10 text-brand-dark'
                }`}
              >
                {pedido.estado}
              </span>
            </div>
            
            <span className="mt-1 block text-sm text-gray-600">
              {formatearFechaHora(pedido.fecha)}
            </span>

            <div className="mt-4 flex flex-col gap-2 border-t border-brand-dark/10 pt-4">
              {pedido.DetallePedidos.map((detalle) => (
                <div key={detalle.id} className="flex items-center justify-between text-sm">
                  <span className="text-brand-dark">
                    {detalle.cantidad}x {detalle.Producto.nombre}
                  </span>
                  <span className="font-semibold text-gray-600">
                    ${(Number(detalle.precio) * detalle.cantidad).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-brand-dark/10 pt-4">
              <span className="font-bold text-brand-dark">Total</span>
              <span className="text-xl font-extrabold text-brand-red">
                ${Number(pedido.total).toLocaleString('es-AR')}
              </span>
            </div>
            <BotonRepetirPedido pedidoId={pedido.id} />
          </div>
        ))}
      </div>
    </div>
    </div>
  )
}

export default HistorialPedidos