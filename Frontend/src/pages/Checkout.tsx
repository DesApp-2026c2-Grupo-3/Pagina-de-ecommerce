import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderService";
import { getDirecciones } from "../services/addressService";
import { getSucursales } from "../services/sucursalService";
import ErrorAlert from "../components/ErrorAlert";
import { etiquetaTamanio } from "../config/combo";
import { buscarSucursalCercana } from "../utils/sucursales";import type { Order } from "../types/order";
import type { Address } from "../types/address";
import type { Sucursal } from "../types/sucursal";

function formatearKm(km: number) {
  return km.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const location = useLocation();

  // Si vuelve de agregar o editar una dirección, llega con su id para dejarla elegida
  const direccionDeRegreso = (location.state as { direccionId?: number } | null)?.direccionId;

  const [loading, setLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const [direcciones, setDirecciones] = useState<Address[]>([]);
  const [direccionesLoading, setDireccionesLoading] = useState(true);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<number | null>(null);
  const [eligiendoDireccion, setEligiendoDireccion] = useState(false);

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalesLoading, setSucursalesLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getDirecciones(user.id)
      .then((data) => {
        setDirecciones(data);
        const deRegreso = data.find((d) => d.id === direccionDeRegreso);
        const predeterminada = data.find((d) => d.predeterminada);
        setDireccionSeleccionada(deRegreso?.id ?? predeterminada?.id ?? data[0]?.id ?? null);
      })
      .catch(() => setError("No se pudieron cargar tus direcciones"))
      .finally(() => setDireccionesLoading(false));
  }, [user]);

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .catch(() => setError("No se pudieron cargar las sucursales"))
      .finally(() => setSucursalesLoading(false));
  }, []);

  // Si no está logueado o no hay items, no debería estar acá
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (items.length === 0 && !confirmedOrder) {
    return <Navigate to="/carrito" replace />;
  }

  // ---------- Sucursal más cercana a la dirección elegida ----------
  const direccion = direcciones.find((d) => d.id === direccionSeleccionada);
  const coordsDireccion =
    direccion && direccion.latitud != null && direccion.longitud != null
      ? { lat: Number(direccion.latitud), lng: Number(direccion.longitud) }
      : null;

  const masCercana = buscarSucursalCercana(coordsDireccion, sucursales);
  const dentroDeZona = masCercana?.dentroDeZona ?? false;
  const puedeConfirmar = Boolean(direccion && masCercana && dentroDeZona);

  async function handleConfirm() {
    if (!direccion) {
      setError("Seleccioná una dirección de entrega");
      return;
    }
    if (!coordsDireccion) {
      setError("Tu dirección no tiene ubicación en el mapa. Editala para completarla.");
      return;
    }
    if (!masCercana || !dentroDeZona) {
      setError("Tu dirección está fuera de nuestra zona de entrega");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const order = await createOrder(user!.id, items, direccion.id, masCercana.sucursal.id);
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
      <div className="bg-brand-cream">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center
      min-h-screen justify-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">¡Pedido confirmado!</h1>
        <p className="text-gray-600">
          Tu pedido <span className="font-bold text-brand-red">#{confirmedOrder.id}</span> fue generado con éxito.
        </p>
        <p className="text-xl font-extrabold text-brand-dark">
          Total: ${Number(confirmedOrder.total).toLocaleString("es-AR")}
        </p>
        <Link
          to="/historial"
          className="mt-4 rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Ver pedido
        </Link>
      </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream">
    <div className="mx-auto max-w-2xl px-4 py-12 min-h-screen">
      <h1 className="text-3xl font-extrabold text-brand-dark">Confirmar pedido</h1>
      <p className="mt-2 text-gray-600">Revisá tu pedido antes de confirmar.</p>

      {/* ---------- Productos ---------- */}
      <div className="mt-8 flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-md"
          >
            <div className="min-w-0">
              <p className="font-bold text-brand-dark">
                {item.quantity}x {item.product.nombre}
              </p>
              {(item.tamanio || item.selectedOptions.length > 0) && (
                <p className="text-sm text-gray-600">
                  {[etiquetaTamanio(item.tamanio), ...item.selectedOptions].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <span className="shrink-0 font-extrabold text-brand-red">
              ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
            </span>
          </div>
        ))}
      </div>

      {/* ---------- Dirección de entrega ---------- */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-brand-dark">Dirección de entrega</h2>

        {direccionesLoading ? (
          <p className="mt-2 text-sm text-gray-600">Cargando direcciones...</p>
        ) : direcciones.length === 0 ? (
          <div className="mt-3 rounded-xl border border-brand-red/20 bg-brand-red/10 p-4">
            <p className="text-sm font-semibold text-brand-red">Todavía no tenés direcciones guardadas.</p>
            <Link
              to="/direcciones"
              state={{ from: "/checkout", abrirNueva: true }}
              className="mt-2 inline-block text-sm font-bold text-brand-red hover:underline"
            >
              Agregar una dirección →
            </Link>
          </div>
        ) : !eligiendoDireccion && direccion ? (
          // La dirección elegida, con opciones para cambiarla o editarla
          <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-brand-red bg-brand-red/5 p-4">
            <div className="min-w-0">
              <p className="font-bold text-brand-dark">{direccion.alias}</p>
              <p className="text-sm text-gray-600">
                {direccion.calle} {direccion.numero} — {direccion.localidad}
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link
                to="/direcciones"
                state={{ from: "/checkout", editarId: direccion.id }}
                className="text-sm font-semibold text-brand-dark hover:text-brand-red"
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={() => setEligiendoDireccion(true)}
                className="text-sm font-semibold text-brand-red hover:underline"
              >
                Cambiar
              </button>
            </div>
          </div>
        ) : (
          // Lista para elegir otra dirección
          <div className="mt-3 flex flex-col gap-2">
            {direcciones.map((d) => (
              <label
                key={d.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  direccionSeleccionada === d.id
                    ? "border-brand-red bg-brand-red/5"
                    : "border-brand-dark/10 bg-white hover:border-brand-red/40"
                }`}
              >
                <input
                  type="radio"
                  name="direccion"
                  className="mt-1 accent-brand-red"
                  checked={direccionSeleccionada === d.id}
                  onChange={() => {
                    setDireccionSeleccionada(d.id);
                    setEligiendoDireccion(false);
                  }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-dark">{d.alias}</span>
                    {d.predeterminada && (
                      <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-bold text-brand-green">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {d.calle} {d.numero} — {d.localidad}
                  </p>
                </div>
              </label>
            ))}
            <Link
              to="/direcciones"
              state={{ from: "/checkout", abrirNueva: true }}
              className="rounded-xl border border-dashed border-brand-dark/20 p-4 text-center text-sm font-bold text-brand-red transition-colors hover:border-brand-red"
            >
              + Agregar dirección
            </Link>
          </div>
        )}
      </div>

      {/* ---------- Sucursal más cercana ---------- */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-brand-dark">Sucursal</h2>

        {sucursalesLoading ? (
          <p className="mt-2 text-sm text-gray-600">Buscando la sucursal más cercana...</p>
        ) : !direccion ? (
          <p className="mt-2 text-sm text-gray-600">Elegí una dirección para ver qué sucursal te lo envía.</p>
        ) : !coordsDireccion ? (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-700">Esta dirección no tiene ubicación en el mapa.</p>
            <Link
              to="/direcciones"
              state={{ from: "/checkout", editarId: direccion.id }}
              className="mt-1 inline-block text-sm font-bold text-amber-700 hover:underline"
            >
              Marcarla en el mapa →
            </Link>
          </div>
        ) : !masCercana ? (
          <p className="mt-2 text-sm text-gray-600">No hay sucursales disponibles.</p>
        ) : !dentroDeZona ? (
          <div className="mt-3 rounded-xl border border-brand-red/20 bg-brand-red/10 p-4">
            <p className="text-sm font-semibold text-brand-red">Tu dirección está fuera de nuestra zona de entrega.</p>
            <p className="mt-1 text-sm text-brand-red">
              La sucursal más cercana, {masCercana.sucursal.nombre}, está a {formatearKm(masCercana.distancia)} km y
              entrega hasta {masCercana.sucursal.radioEntregaKm} km.
            </p>
          </div>
        ) : (
          <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-brand-red bg-brand-red/5 p-4">
            <div className="min-w-0">
              <p className="font-bold text-brand-dark">{masCercana.sucursal.nombre}</p>
              <p className="text-sm text-gray-600">
                {masCercana.sucursal.calle} {masCercana.sucursal.numero} — {masCercana.sucursal.localidad}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-bold text-brand-green">
              a {formatearKm(masCercana.distancia)} km
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <ErrorAlert message={error} />
      </div>

      {/* ---------- Total y confirmar ---------- */}
      <div className="mt-6 flex items-center justify-between border-t border-brand-dark/10 pt-6">
        <span className="text-xl font-extrabold text-brand-dark">
          Total: ${totalPrice.toLocaleString("es-AR")}
        </span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || !puedeConfirmar}
          className="rounded-full bg-brand-red px-8 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Confirmando..." : "Confirmar pedido"}
        </button>
      </div>
    </div>
    </div>
  );
}

export default Checkout;