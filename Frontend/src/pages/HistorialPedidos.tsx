import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHistorialPedidos } from '../services/orderService'
import type { Order } from '../types/order'

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
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">Todavía no hiciste pedidos</h1>
        <Link
          to="/"
          className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Ver el menú
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
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
              {new Date(pedido.fecha).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
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
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistorialPedidos