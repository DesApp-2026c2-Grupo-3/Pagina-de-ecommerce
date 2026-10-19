import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useZona } from "../context/ZonaContext";
import EditarItemModal from "../components/EditarItemModal";
import PageHeader from "../components/ui/PageHeader";
import PasosCompra from "../components/cart/PasosCompra";
import CartItemRow from "../components/cart/CartItemRow";
import SugerenciasCarrito from "../components/cart/SugerenciaCarrito";
import ResumenCarrito from "../components/cart/ResumenCarrito";
import AvisoCierreSucursal from "../components/sucursal/AvisoCierreSucursal";
import ConfirmarEliminarModal from "../components/cart/ConfirmarEliminacionModal";
import type { CartItem } from "../types/cart";

function Cart() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const { zona } = useZona();
  const navigate = useNavigate();
  const [editando, setEditando] = useState<CartItem | null>(null);
  const [itemAEliminar, setItemAEliminar] = useState<CartItem | null>(null);
  const [observaciones, setObservaciones] = useState("");

  // Se puede editar si tiene tamaños o ingredientes para quitar o agregar
  const esEditable = (item: CartItem) =>
    Boolean(
      item.product.tamanios?.length ||
        item.product.ingredientes?.some((i) => i.esRemovible || i.esAgregable),
    );

  const sucursalCerrada = Boolean(zona && zona.sucursalAbierta === false);

  function handleCheckout() {
    if (sucursalCerrada) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/carrito" } });
      return;
    }
    navigate("/checkout" , { state: { observaciones } });
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <PageHeader titulo="Tu carrito" />
        <div className="mx-auto -mt-12 max-w-md px-4 pb-16">
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border-2 border-brand-dark bg-white p-8 text-center shadow-sticker">
            <span className="relative grid h-24 w-24 -rotate-6 place-items-center rounded-3xl border-2 border-brand-dark bg-brand-mustard shadow-sticker">
              <ShoppingBag className="h-12 w-12" strokeWidth={2.2} />
              <span className="absolute -right-3 -top-3 grid h-9 w-9 rotate-12 place-items-center rounded-full border-2 border-brand-dark bg-brand-red font-display text-lg font-extrabold text-white">
                0
              </span>
            </span>            
            <h2 className="font-display text-3xl font-extrabold text-brand-dark">Todavía no agregaste nada</h2>
            <p className="text-brand-muted">Elegí tu antojo del menú y lo vas a ver acá.</p>
            <Link
              to="/catalogo"
              className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:translate-y-0.5"
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
          {sucursalCerrada && <AvisoCierreSucursal sucursal={zona?.sucursalNombre} />}

          <Link
            to="/catalogo"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-2 border-brand-dark bg-white px-5 text-sm font-bold shadow-sticker transition-transform hover:translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" /> Seguir agregando
          </Link>

          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onCantidad={(cantidad) => updateQuantity(item.id, cantidad)}
              onQuitar={() => setItemAEliminar(item)}
              onEditar={esEditable(item) ? () => setEditando(item) : undefined}
            />
          ))}

          <div className="rounded-2xl border-2 border-brand-dark bg-white p-4">
            <label
            htmlFor="observaciones"
            className="mb-2 block font-bold text-brand-dark"
            >
              Observaciones del pedido (opcional)
            </label>

            <textarea 
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            maxLength={500}
            placeholder="Ej.: tocar timbre dos veces..."
            rows={3}
            className="w-full rounded-xl border-2 border-brand-dark/20 p-3 text-sm outline-none focus:border-brand-red"
            />

            <p className="mt-1 text-right text-xs text-brand-muted">
              {observaciones.length}/500 caracteres
            </p>
          </div>

        </div>

        <ResumenCarrito
          cantidad={cantidadTotal}
          subtotal={totalPrice}
          logueado={isAuthenticated}
          deshabilitado={sucursalCerrada}
          onConfirmar={handleCheckout}
        />
      </div>

      <SugerenciasCarrito />

      <EditarItemModal item={editando} onClose={() => setEditando(null)} />

      {itemAEliminar && (
  <ConfirmarEliminarModal
    nombreProducto={itemAEliminar.product.nombre}
    onCancelar={() => setItemAEliminar(null)}
    onConfirmar={() => {
      removeItem(itemAEliminar.id)
      setItemAEliminar(null)
    }}
  />
)}
    </div>
  );
}

export default Cart;