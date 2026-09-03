import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function Cart() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  function handleCheckout() {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">Tu carrito está vacío</h1>
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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark">Tu carrito</h1>

      <div className="mt-8 flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md"
          >
            <img
              src={item.product.image}
              alt={item.product.name}
              className="h-20 w-20 rounded-xl bg-brand-cream object-cover"
            />

            <div className="flex-1">
              <h3 className="font-bold text-brand-dark">{item.product.name}</h3>
              {item.selectedOptions.length > 0 && (
                <p className="text-sm text-gray-600">
                  {item.selectedOptions.map((o) => o.split('-')[1]).join(', ')}
                </p>
              )}
              <span className="font-extrabold text-brand-red">
                ${item.product.price.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="h-8 w-8 rounded-full border border-brand-dark/20 font-bold text-brand-dark hover:border-brand-red hover:text-brand-red"
              >
                -
              </button>
              <span className="w-6 text-center font-semibold text-brand-dark">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="h-8 w-8 rounded-full border border-brand-dark/20 font-bold text-brand-dark hover:border-brand-red hover:text-brand-red"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-sm font-semibold text-brand-red hover:underline"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-brand-dark/10 pt-6">
        <span className="text-xl font-extrabold text-brand-dark">
          Total: ${totalPrice.toLocaleString('es-AR')}
        </span>
        <button
          type="button"
          onClick={handleCheckout}
          className="rounded-full bg-brand-red px-8 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Confirmar pedido
        </button>
      </div>
    </div>
  )
}

export default Cart