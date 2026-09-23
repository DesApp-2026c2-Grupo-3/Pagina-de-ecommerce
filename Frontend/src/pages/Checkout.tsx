import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderService";
import { getDirecciones } from "../services/addressService";
import ErrorAlert from "../components/ErrorAlert";
import type { Order } from "../types/order";
import type { Address } from "../types/address";

function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const [direcciones, setDirecciones] = useState<Address[]>([]);
  const [direccionesLoading, setDireccionesLoading] = useState(true);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getDirecciones(user.id)
      .then((data) => {
        setDirecciones(data);
        const predeterminada = data.find((d) => d.predeterminada);
        setDireccionSeleccionada(predeterminada?.id ?? data[0]?.id ?? null);
      })
      .catch(() => setError("No se pudieron cargar tus direcciones"))
      .finally(() => setDireccionesLoading(false));
  }, [user]);

  // Si no está logueado o no hay items, no debería estar acá
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (items.length === 0 && !confirmedOrder) {
    return <Navigate to="/carrito" replace />;
  }

  async function handleConfirm() {
    if (!direccionSeleccionada) {
      setError("Seleccioná una dirección de entrega");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const order = await createOrder(user!.id, items, direccionSeleccionada);
      setConfirmedOrder(order);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar el pedido");
    } finally {
      setLoading(false);
    }
  }

  if (confirmedOrder) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">
          ¡Pedido confirmado!
        </h1>
        <p className="text-gray-600">
          Tu pedido{" "}
          <span className="font-bold text-brand-red">#{confirmedOrder.id}</span>{" "}
          fue generado con éxito.
        </p>
        <p className="text-xl font-extrabold text-brand-dark">
          Total: ${Number(confirmedOrder.total).toLocaleString("es-AR")}
        </p>
        <Link
          to="/"
          className="mt-4 rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Volver al catálogo.
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark">
        Confirmar pedido
      </h1>
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
                  {item.selectedOptions.map((o) => o.split("-")[1]).join(", ")}
                </p>
              )}
            </div>
            <span className="font-extrabold text-brand-red">
              ${(item.product.price * item.quantity).toLocaleString("es-AR")}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-brand-dark">Dirección de entrega</h2>

        {direccionesLoading ? (
          <p className="mt-2 text-sm text-gray-600">Cargando direcciones...</p>
        ) : direcciones.length === 0 ? (
          <div className="mt-3 rounded-xl border border-brand-red/20 bg-brand-red/10 p-4">
            <p className="text-sm font-semibold text-brand-red">
              Todavía no tenés direcciones guardadas.
            </p>
            <Link
              to="/direcciones"
              className="mt-2 inline-block text-sm font-bold text-brand-red hover:underline"
            >
              Agregar una dirección →
            </Link>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {direcciones.map((direccion) => (
              <label
                key={direccion.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  direccionSeleccionada === direccion.id
                    ? "border-brand-red bg-brand-red/5"
                    : "border-brand-dark/10 bg-white hover:border-brand-red/40"
                }`}
              >
                <input
                  type="radio"
                  name="direccion"
                  className="mt-1 accent-brand-red"
                  checked={direccionSeleccionada === direccion.id}
                  onChange={() => setDireccionSeleccionada(direccion.id)}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-dark">{direccion.alias}</span>
                    {direccion.predeterminada && (
                      <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-bold text-brand-green">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {direccion.calle} {direccion.numero}
                    {direccion.piso && `, piso ${direccion.piso}`} — {direccion.ciudad} (
                    {direccion.codigoPostal})
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <ErrorAlert message={error} />
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-brand-dark/10 pt-6">
        <span className="text-xl font-extrabold text-brand-dark">
          Total: ${totalPrice.toLocaleString("es-AR")}
        </span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || direcciones.length === 0}
          className="rounded-full bg-brand-red px-8 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Confirmando..." : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}

export default Checkout;