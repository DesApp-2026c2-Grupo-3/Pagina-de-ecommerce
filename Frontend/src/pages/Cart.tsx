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
    navigate("/login", { state: { from: "/carrito" } });  
    return;
    }
    navigate("/checkout");
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex flex-col items-center justify-center gap-6 px-4 py-24
       text-center bg-stone-900 min-h-screen">
        <div className="flex flex-col gap-4 p-6 rounded bg-stone-800 border-3 border-stone-500">
        <img src="/Otros/bolsaVacia.png" alt="carrito vacio" 
        className="h-80 rounded"/>
        <div className="flex flex-col bg-red-900 p-2 gap-4 rounded-xl border-2">
        <h1 className="text-3xl font-extrabold text-white ">
          Todavia no agregaste nada
        </h1>
        <Link
          to="/catalogo"
          className="rounded bg-red-700 px-6 py-3 font-bold text-white 
          transition-opacity hover:opacity-60 border border-black"
        >
          Ver el catálogo.
        </Link>
        </div>
        </div>
      </div>
      
    );
  }

  return (
    <div className="bg-black">
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-12
    bg-gradient-to-b from-brand-cream via-yellow-600 to-red-700
     border-l-3 border-r-3 border-red-800">
      <h1 className="text-3xl font-extrabold text-brand-dark
      bg-gradient-to-r from-stone-900 via-gray-800 to-red-700 bg-clip-text text-transparent w-fit">Tu carrito</h1>

      <div className="mt-8 flex flex-col gap-4">
        {items.map((item) => (  
          <div key={item.id} className="flex flex-col">
            <div className="flex items-center gap-4 rounded-2xl p-4 shadow-md
            bg-gradient-to-t from-orange-400 to-orange-100 ">
              <img
              src={item.product.imagen}
              alt={item.product.nombre}
              className="h-20 w-20 rounded-xl  object-cover"
              />

              <div className="flex-1">
                <h3 className="font-bold text-brand-dark">{item.product.nombre}</h3>
                {item.selectedOptions.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {item.selectedOptions.join(", ")}
                  </p>
                )}
                <span className="font-extrabold text-brand-red">
                  ${item.unitPrice.toLocaleString("es-AR")}
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
                rounded-2xl p-2 m-1 shadow-md border  bg-gradient-to-t from-orange-500 to-orange-200">

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
                  rounded-2xl bg-black border p-2 m-2 shadow-md">
                    <Trash size={18} />
                  </button>
                </div>

              </div>
          </div>

        ))}

      </div>

      <div className="mt-8 flex items-center justify-between border-t border-brand-dark/10 pt-6">
        <span className="text-xl font-extrabold bg-gradient-to-r from-stone-200 via-gray-100 to-red-200 bg-clip-text text-transparent w-fit">
          Total: ${totalPrice.toLocaleString("es-AR")}
        </span>
        <button
          type="button"
          onClick={handleCheckout}
          className="rounded-full bg-red-600 px-8 py-3 font-bold text-white transition-opacity hover:opacity-60
          border border-black"
        >
          Confirmar pedido
        </button>
      </div>
    </div>
    </div>
  );
}

export default Cart;
