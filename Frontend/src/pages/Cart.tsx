import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash, PencilSparkles } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import EditarItemModal from "../components/EditarItemModal";
import { etiquetaTamanio } from "../config/combo";
import type { CartItem } from "../types/cart";

function Cart() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [editando, setEditando] = useState<CartItem | null>(null);

  // Se puede editar si tiene tamaños o ingredientes para quitar o agregar
  const esEditable = (item: CartItem) =>
    Boolean(
      item.product.variantes?.length ||
        item.product.ingredientes?.some((i) => i.esRemovible || i.esAgregable),
    );

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
          Ver el catálogo
        </Link>
        </div>
        </div>
      </div>
      
    );
  }

  return (
    <div className="bg-gradient-to-b from-orange-200 via-yellow-600 to-red-700">
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark
      bg-gradient-to-r from-stone-900 via-gray-800 to-red-700 bg-clip-text text-transparent w-fit">Tu carrito</h1>

      <div className="mt-8 flex flex-col gap-4">
        {items.map((item) => {
          const detalle = [
            etiquetaTamanio(
              item.tamanio,
              item.product.variantes?.find((v) => v.tamanio === item.tamanio)?.etiqueta,
            ),
            ...item.selectedOptions,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <div key={item.id} className="flex flex-col">
              <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md
              border bg-gradient-to-r from-red-500 sm:from-40% via-red-500  to-orange-300">
                {item.product.imagen ? (
                  <img
                    src={item.product.imagen}
                    alt={item.product.nombre}
                    className="h-20 w-20 shrink-0 rounded-xl border bg-orange-200 object-cover"
                  />
                ) : (
                  <div
                    className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-brand-cream text-3xl"
                    aria-hidden="true"
                  >
                    🍽️
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white">{item.product.nombre}</h3>
                  {detalle && 
                  <p className="text-sm text-gray-100">{detalle}</p>}
                  <span className="text-lg font-extrabold text-brand-red [-webkit-text-stroke:1px_black]">
                    ${item.unitPrice.toLocaleString("es-AR")}
                  </span>
                </div>

                {/* Cantidad y acciones: escritorio */}
                <div className="hidden items-center justify-center gap-4 sm:flex">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Restar un ${item.product.nombre}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark/20 font-bold text-brand-dark hover:border-brand-red hover:text-brand-red"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-6 text-center font-semibold text-brand-dark">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Sumar un ${item.product.nombre}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark/20 font-bold text-brand-dark hover:border-brand-red hover:text-brand-red"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 border p-2 rounded bg-orange-600">
                    {esEditable(item) && (
                      <button
                        type="button"
                        onClick={() => setEditando(item)}
                        className="text-sm font-semibold text-dark hover:bg-yellow-500 
                        border p-1 bg-orange-400 rounded"
                      >
                        <PencilSparkles size={20} />
                      </button>
              <div className="flex-1">
                <h3 className="font-bold text-brand-dark">{item.product.nombre}</h3>
                {item.tamanio && (
                  <p className="text-sm text-gray-600">
                    {etiquetaTamanio(
                      item.tamanio,
                      item.product.tamanios?.find((v) => v.tamanio === item.tamanio)?.etiqueta,
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm font-semibold text-dark hover:bg-yellow-500 
                      border rounded-full p-1 bg-orange-400"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cantidad y acciones: celular */}
              <div className="flex items-center justify-center gap-2 sm:hidden">
                <div className="m-1 flex items-center justify-center gap-2 rounded-2xl p-2 shadow-md
                bg-red-800 text-white">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label={`Restar un ${item.product.nombre}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark/20 
                    font-bold  hover:border-brand-red hover:text-brand-red"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-6 text-center font-semibold ">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Sumar un ${item.product.nombre}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark/20 font-bold
                      hover:border-brand-red hover:text-brand-red"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {esEditable(item) && (
                  <button
                    type="button"
                    onClick={() => setEditando(item)}
                    className="m-1 rounded-2xl bg-red-800 p-2 text-sm font-semibold text-white shadow-md"
                  >
                    <PencilSparkles size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Quitar ${item.product.nombre}`}
                  className="m-1 rounded-2xl bg-red-800 p-2 text-white shadow-md"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-brand-dark/10 pt-6">
      <div className="bg-red-500 py-3 px-1 border-2 rounded">
        <span className="text-xl font-extrabold 
        bg-gradient-to-b from-stone-200 via-gray-100 to-red-900 bg-clip-text text-transparent w-fit
        [-webkit-text-stroke:0.5px_black]">
          Total: ${totalPrice.toLocaleString("es-AR")}
        </span>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          className="rounded-full bg-red-600 px-5 py-3 font-bold text-white transition-opacity hover:opacity-60
          border border-black"
        >
          {isAuthenticated ? "Confirmar pedido" : "Iniciá sesión para confirmar"}
        </button>
      </div>

      <EditarItemModal item={editando} onClose={() => setEditando(null)} />
    </div>
    </div>
  );
}

export default Cart;