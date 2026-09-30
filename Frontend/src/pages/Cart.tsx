import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash } from "lucide-react";
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
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">Tu carrito está vacío</h1>
        <Link
          to="/catalogo"
          className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Ver el catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark">Tu carrito</h1>

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
              <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md">
                {item.product.imagen ? (
                  <img
                    src={item.product.imagen}
                    alt={item.product.nombre}
                    className="h-20 w-20 shrink-0 rounded-xl bg-brand-cream object-cover"
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
                  <span className="font-extrabold text-brand-red">
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

                  <div className="flex items-center gap-3">
                    {esEditable(item) && (
                      <button
                        type="button"
                        onClick={() => setEditando(item)}
                        className="text-sm font-semibold text-brand-dark hover:text-brand-red"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm font-semibold text-brand-red hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>

              {/* Cantidad y acciones: celular */}
              <div className="flex items-center justify-center gap-2 sm:hidden">
                <div className="m-1 flex items-center justify-center gap-2 rounded-2xl bg-white p-2 shadow-md">
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

                {esEditable(item) && (
                  <button
                    type="button"
                    onClick={() => setEditando(item)}
                    className="m-1 rounded-2xl bg-white p-2 text-sm font-semibold text-brand-dark shadow-md"
                  >
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Quitar ${item.product.nombre}`}
                  className="m-1 rounded-2xl bg-white p-2 text-brand-red shadow-md"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          );
        })}
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
          {isAuthenticated ? "Confirmar pedido" : "Iniciá sesión para confirmar"}
        </button>
      </div>

      <EditarItemModal item={editando} onClose={() => setEditando(null)} />
    </div>
  );
}

export default Cart;