import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Plus, Minus, Trash } from "lucide-react";


function Cart() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function handleCheckout() {
    if (!isAuthenticated) {
    navigate("/login", { state: { from: "/carrito" } });      return;
    }
    navigate("/checkout");
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">
          Tu carrito está vacío
        </h1>
        <Link
          to="/"
          className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Ver el catálogo.
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark">Tu carrito</h1>

      <div className="mt-8 flex flex-col gap-4">
        {items.map((item) => (  
          <div key={item.id} className="flex flex-col">
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md">
              <img
              src={item.product.imagen}
              alt={item.product.nombre}
              className="h-20 w-20 rounded-xl bg-brand-cream object-cover"
              />

              <div className="flex-1">
                <h3 className="font-bold text-brand-dark">{item.product.nombre}</h3>
                
                <span className="font-extrabold text-brand-red">
                  ${Number(item.product.precio).toLocaleString("es-AR")}
                </span>
              </div>

            

              <div className=" items-center justify-center gap-2
              hidden sm:flex ">

                <div className="flex justify-center items-center gap-2">

                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 rounded-full border border-brand-dark/20 font-bold text-brand-dark hover:border-brand-red hover:text-brand-red
                    flex justify-center items-center">
                    <Minus size={18} />
                  </button>

                  <span className="w-6 text-center font-semibold text-brand-dark">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 rounded-full border border-brand-dark/20 font-bold text-brand-dark hover:border-brand-red hover:text-brand-red
                    flex justify-center items-center">
                    <Plus size={18} />
                  </button>

                </div>

                <div>
                  <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-sm font-semibold text-brand-red hover:underline">
                    Quitar
                  </button>
                </div>
              </div>
            

            </div>

            <div className="flex flex-col sm:hidden items-center justify-center
            ">

                <div className="flex justify-center items-center gap-2
                rounded-2xl bg-white p-2 m-1 shadow-md">

                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 rounded-full border border-brand-dark/20 font-bold text-brand-dark hover:border-brand-red hover:text-brand-red
                    flex justify-center items-center">
                    <Minus size={18} />
                  </button>

                  <span className="w-6 text-center font-semibold text-brand-dark">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 rounded-full border border-brand-dark/20 font-bold text-brand-dark hover:border-brand-red hover:text-brand-red
                    flex justify-center items-center">
                    <Plus size={18} />
                  </button>

                </div>

                <div>
                  <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-sm font-semibold text-brand-red
                  rounded-2xl bg-white p-2 m-2 shadow-md">
                    <Trash size={18} />
                  </button>
                </div>

              </div>
          </div>

        ))}

      </div>

      <div className="mt-8 flex items-center justify-between border-t border-brand-dark/10 pt-6">
        <span className="text-xl font-extrabold text-brand-dark">
          Total: ${totalPrice.toLocaleString("es-AR")}
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
  );
}

export default Cart;
