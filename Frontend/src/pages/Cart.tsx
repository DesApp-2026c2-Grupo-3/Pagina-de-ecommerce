import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import EditarItemModal from "../components/EditarItemModal";
import PageHeader from "../components/ui/PageHeader";
import PasosCompra from "../components/cart/PasosCompra";
import CartItemRow from "../components/cart/CartItemRow";
import { formatearPrecio } from "../utils/precio";
import type { CartItem } from "../types/cart";

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
      <div className="min-h-screen bg-brand-cream">
        <PageHeader titulo="Tu carrito" />
        <div className="mx-auto -mt-12 max-w-md px-4 pb-16">
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border-2 border-brand-dark bg-white p-8 text-center shadow-sticker">
            <img src="/Otros/bolsaVacia.png" alt="" className="h-48" />
            <h2 className="font-display text-3xl font-extrabold text-brand-dark">Todavía no agregaste nada</h2>
            <p className="text-brand-muted">Elegí tu antojo del menú y lo vas a ver acá.</p>
            <Link
              to="/catalogo"
              className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Ver el menú <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cantidadTotal = items.reduce((suma, item) => suma + item.quantity, 0);

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <PageHeader titulo="Tu carrito">
        <PasosCompra actual={0} />
      </PageHeader>

      <div className="mx-auto -mt-12 grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onCantidad={(cantidad) => updateQuantity(item.id, cantidad)}
              onQuitar={() => removeItem(item.id)}
              onEditar={esEditable(item) ? () => setEditando(item) : undefined}
            />
          ))}

          <Link to="/catalogo" className="mt-2 w-fit font-bold text-brand-red hover:underline">
            ← Seguir agregando
          </Link>
        </div>

        {/* Resumen */}
        <aside className="flex flex-col gap-4 rounded-[2rem] border-2 border-brand-dark bg-white p-6 shadow-sticker lg:sticky lg:top-28">
          <h2 className="font-display text-2xl font-extrabold">Resumen</h2>
          <div className="flex justify-between text-brand-muted">
            <span>
              {cantidadTotal} {cantidadTotal === 1 ? "producto" : "productos"}
            </span>
            <span className="font-bold text-brand-dark">{formatearPrecio(totalPrice)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t-2 border-dashed border-brand-sand pt-4">
            <span className="font-extrabold">Total</span>
            <span className="font-display text-4xl font-extrabold">{formatearPrecio(totalPrice)}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            <ShoppingBag className="h-5 w-5" />
            {isAuthenticated ? "Confirmar pedido" : "Iniciá sesión para confirmar"}
          </button>
        </aside>
      </div>

      <EditarItemModal item={editando} onClose={() => setEditando(null)} />
    </div>
  );
}
 

export default Cart;