import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
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
import type { Promo } from "../types/promo";
import { getPromociones } from "../services/promotionService";
import { CLASE_INPUT, CLASE_LABEL } from '../components/ui/formulario'

function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { zona } = useZona();
  const navigate = useNavigate();
  const [editando, setEditando] = useState<CartItem | null>(null);
  const [itemAEliminar, setItemAEliminar] = useState<CartItem | null>(null);
  const [mostrarModalVaciar, setMostrarModalVaciar] = useState(false);
  // Se guarda en la sesión para no perderla al ir y volver del checkout
  const [observaciones, setObservaciones] = useState(() => {
    try { return sessionStorage.getItem('observacionesPedido') ?? '' } catch { return '' }
  });
  function cambiarObservaciones(valor: string) {
    setObservaciones(valor);
    try { sessionStorage.setItem('observacionesPedido', valor) } catch { /* sin storage */ }
  }
  // Se puede editar si tiene tamaños o ingredientes para quitar o agregar
  const esEditable = (item: CartItem) =>
    Boolean(
      item.product.tamanios?.length ||
        item.product.ingredientes?.some((i) => i.esRemovible || i.esAgregable),
    );

  const sucursalCerrada = Boolean(zona && zona.sucursalAbierta === false);

  // Promos vigentes, para controlar las que piden una compra mínima (ej: papas gratis)
  const [promos, setPromos] = useState<Promo[]>([]);
  useEffect(() => {
    getPromociones()
      .then((p) =>
        setPromos(
          [p.productoSemana, p.regalo, ...p.dias.flatMap((d) => d.promos)].filter(
            (promo): promo is Promo => Boolean(promo),
          ),
        ),
      )
      .catch(() => setPromos([]));
  }, []);

  // Promos del carrito que todavía no llegan a su compra mínima, y cuánto falta
  const faltantes = promos
    .filter((promo) => promo.compraMinima && items.some((i) => i.promoId === promo.id))
    .map((promo) => {
      const resto = items
        .filter((i) => i.promoId !== promo.id)
        .reduce((suma, i) => suma + i.unitPrice * i.quantity, 0);
      return { promo, falta: (promo.compraMinima ?? 0) - resto };
    })
    .filter((f) => f.falta > 0);

  const textoFaltante = faltantes
    .map((f) => `Te faltan $${f.falta.toLocaleString('es-AR')} en otros productos para la promo "${f.promo.titulo}".`)
    .join(' ');

  function handleCheckout() {
    if (sucursalCerrada || faltantes.length > 0) return;

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

      

      <div className="mx-auto -mt-12 grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_22rem] lg:items-start [&>*]:min-w-0">        
        <div className="flex flex-col gap-3">
          {sucursalCerrada && <AvisoCierreSucursal sucursal={zona?.sucursalNombre} />}
          {faltantes.map((f) => (
            <div
              key={f.promo.id}
              role="alert"
              className="rounded-2xl border-2 border-brand-dark bg-brand-mustard p-4 font-bold"
            >
              🎁 Te faltan ${f.falta.toLocaleString('es-AR')} en otros productos para llevarte la promo "
              {f.promo.titulo}" (compra mínima ${(f.promo.compraMinima ?? 0).toLocaleString('es-AR')}).
            </div>
          ))}
                   <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/catalogo"
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-2 border-brand-dark bg-white
               px-5 text-sm font-bold shadow-sticker transition-transform hover:translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" /> Seguir agregando
            </Link>

            <button
              type="button"
              onClick={() => setMostrarModalVaciar(true)}
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-2 border-red-600 bg-stone-100
               px-5 text-sm font-bold shadow-[4px_4px_0px_#c556a0] transition-transform hover:translate-y-0.5
               hover:bg-stone-500 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Vaciar carrito
            </button>
          </div>

          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onCantidad={(cantidad) => updateQuantity(item.id, cantidad)}
              onQuitar={() => setItemAEliminar(item)}
              onEditar={esEditable(item) ? () => setEditando(item) : undefined}
            />
          ))}

          <div className="mx-auto w-full max-w-lg rounded-2xl border-2 border-brand-dark bg-white p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
              <label htmlFor="observaciones" className={CLASE_LABEL}>
                Notas para la cocina (opcional)
              </label>

              <span className="shrink-0 text-xs text-brand-muted">
                {observaciones.length}/100
              </span>
            </div>

              <textarea id="observaciones" value={observaciones}
              onChange={(e) => cambiarObservaciones(e.target.value)}
              maxLength={100}
              placeholder="Ej.: sin cebolla, bien cocida..."
              rows={2}
              className={`${CLASE_INPUT} w-full resize-none`}/>
            </div>

          </div>

        <ResumenCarrito
          cantidad={cantidadTotal}
          subtotal={totalPrice}
          logueado={isAuthenticated}
          deshabilitado={sucursalCerrada || faltantes.length > 0}
          motivo={sucursalCerrada ? undefined : textoFaltante}
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
        }}/>
      )}

      {mostrarModalVaciar && (
        <ConfirmarEliminarModal
        nombreProducto="todos los productos"
        onCancelar={() => setMostrarModalVaciar(false)}
        onConfirmar={() => { clearCart();
          setMostrarModalVaciar(false);
        }}/>
      )}
    </div>
  );
}

export default Cart;