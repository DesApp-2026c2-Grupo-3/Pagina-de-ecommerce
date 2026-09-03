import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { createOrder } from '../services/orderService'
import type { Order } from '../types/order'

function Checkout() {
  const { user, isAuthenticated } = useAuth()
  const { items, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)

  // Si no está logueado o no hay items, no debería estar acá
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (items.length === 0 && !confirmedOrder) {
    return <Navigate to="/carrito" replace />
  }

  async function handleConfirm() {
    setLoading(true)
    const order = await createOrder(user!.id, items, totalPrice)
    setConfirmedOrder(order)
    clearCart()
    setLoading(false)
  }

  if (confirmedOrder) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">¡Pedido confirmado!</h1>
        <p className="text-gray-600">
          Tu pedido <span className="font-bold text-brand-red">#{confirmedOrder.id}</span> fue
          generado con éxito.
        </p>
        <p className="text-xl font-extrabold text-brand-dark">
          Total: ${confirmedOrder.total.toLocaleString('es-AR')}
        </p>
        <Link
          to="/"
          className="mt-4 rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Volver al menú
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark">Confirmar pedido</h1>
      <p className="mt-2 text-gray-600">Revisá tu pedido antes de confirmar.</p>

      <div className="mt-8 flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-md"
          >
            <div>
              <p className="font-bold text-brand-dark">
                {item.quantity}x {item.product.name}
              </p>
              {item.selectedOptions.length > 0 && (
                <p className="text-sm text-gray-600">
                  {item.selectedOptions.map((o) => o.split('-')[1]).join(', ')}
                </p>
              )}
            </div>
            <span className="font-extrabold text-brand-red">
              ${(item.product.price * item.quantity).toLocaleString('es-AR')}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-brand-dark/10 pt-6">
        <span className="text-xl font-extrabold text-brand-dark">
          Total: ${totalPrice.toLocaleString('es-AR')}
        </span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="rounded-full bg-brand-red px-8 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Confirmando...' : 'Confirmar pedido'}
        </button>
      </div>
    </div>
  )
}

export default Checkout