import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash, PencilSparkles } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import EditarItemModal from "../components/EditarItemModal";
import { etiquetaTamanio } from "../config/combo";
import type { CartItem } from "../types/cart";

const botonCantidad =
  "flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark/20 text-brand-dark transition-colors hover:border-brand-dark";
const botonAccion =
  "rounded-full p-2 text-gray-500 transition-colors hover:bg-yellow-500 hover:text-brand-dark";

function Cart() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [editando, setEditando] = useState<CartItem | null>(null);

  // Se puede editar si tiene tamaños o ingredientes para quitar o agregar
  const esEditable = (item: CartItem) =>
    Boolean(
      item.product.tamanios?.length ||
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
      <div className="mx-auto flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-900 px-4 py-24 text-center">
        <div className="flex flex-col gap-4 rounded border-3 border-stone-500 bg-stone-800 p-6">
          <img src="/Otros/bolsaVacia.png" alt="Carrito vacío" className="h-80 rounded" />
          <div className="flex flex-col gap-4 rounded-xl border-2 bg-red-900 p-2">
            <h1 className="text-3xl font-extrabold text-white">Todavía no agregaste nada</h1>
            <Link
              to="/catalogo"
              className="rounded border border-black bg-red-700 px-6 py-3 font-bold text-white transition-opacity hover:opacity-60"
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
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-extrabold text-brand-dark">Tu carrito</h1>

        <div className="mt-8 flex flex-col gap-4">
          {items.map((item) => {
            const detalle = [
              etiquetaTamanio(
                item.tamanio,
                item.product.tamanios?.find((t) => t.tamanioId === item.tamanioId)?.etiqueta,
              ),
              ...item.selectedOptions,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <div key={item.id} className="rounded-2xl p-4 shadow-md
              bg-gradient-to-r from-red-200 via-orange-300 to-yellow-200
              border">
                <div className="flex items-center gap-4">
                  {item.product.imagen ? (
                    <img
                      src={item.product.imagen}
                      alt={item.product.nombre}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover
                      bg-gradient-to-b from-orange-200 via-yellow-400 to-red-500 border"
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
                    <h3 className="font-bold text-brand-dark">{item.product.nombre}</h3>
                    {detalle && <p className="text-sm text-gray-600">{detalle}</p>}
                    <p className="mt-1 font-extrabold text-brand-dark">
                      ${item.unitPrice.toLocaleString("es-AR")}
                    </p>
                  </div>

                  {/* Cantidad y acciones: escritorio */}
                  <div className="hidden items-center gap-4 sm:flex">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={`Restar un ${item.product.nombre}`}
                        className={botonCantidad}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-6 text-center font-semibold text-brand-dark">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Sumar un ${item.product.nombre}`}
                        className={botonCantidad}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {esEditable(item) && (
                        <button
                          type="button"
                          onClick={() => setEditando(item)}
                          aria-label={`Editar ${item.product.nombre}`}
                          className={botonAccion}
                        >
                          <PencilSparkles size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Quitar ${item.product.nombre}`}
                        className={botonAccion}
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cantidad y acciones: celular (dentro de la misma tarjeta) */}
                <div className="mt-3 flex items-center justify-between border-t border-brand-dark/10 pt-3 sm:hidden">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Restar un ${item.product.nombre}`}
                      className={botonCantidad}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-6 text-center font-semibold text-brand-dark">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Sumar un ${item.product.nombre}`}
                      className={botonCantidad}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {esEditable(item) && (
                      <button
                        type="button"
                        onClick={() => setEditando(item)}
                        aria-label={`Editar ${item.product.nombre}`}
                        className={botonAccion}
                      >
                        <PencilSparkles size={18} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Quitar ${item.product.nombre}`}
                      className={botonAccion}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total y confirmar */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl p-4 shadow-md 
        sm:flex-row sm:items-center sm:justify-between border
        bg-gradient-to-t from-red-400 from-10% to-yellow-200 ">
          <span className="text-xl font-extrabold text-brand-dark">
            Total: ${totalPrice.toLocaleString("es-AR")}
          </span>
          <button
            type="button"
            onClick={handleCheckout}
            className="rounded-full px-6 py-3 font-bold text-white transition-opacity hover:opacity-70
            bg-gradient-to-t from-red-600 to-red-400 border border-black"
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