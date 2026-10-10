import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useZona } from "../context/ZonaContext";
import { createOrder } from "../services/orderService";
import { getDirecciones } from "../services/addressService";
import { getSucursales } from "../services/sucursalService";
import ErrorAlert from "../components/ErrorAlert";
import { ArrowLeft, Bike, MapPin, Pencil, Store, Wallet } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import PasosCompra from "../components/cart/PasosCompra";
import SeccionCheckout from "../components/checkout/SeccionCheckout";
import Aviso from "../components/checkout/Aviso";
import ResumenPedido from "../components/checkout/ResumenPedido";
import PedidoConfirmado from "../components/checkout/PedidoConfirmado";
import OpcionesCheckout from "../components/checkout/OpcionesCheckout";
import { FORMAS_ENTREGA, FORMAS_PAGO, type FormaEntrega, type FormaPago } from "../config/compra";
import { buscarSucursalCercana } from "../utils/sucursales";
import { distanciaKm } from "../utils/distancia";
import type { Order } from "../types/order";
import type { Address } from "../types/address";
import type { Sucursal } from "../types/sucursal";
import type { CartItem } from "../types/cart";
import ModalConfirmarPedido from "../components/checkout/ModalConfirmarPedido";

function formatearKm(km: number) {
  return km.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

// Dos puntos a menos de 50 metros se consideran la misma dirección
const MISMA_DIRECCION_KM = 0.05;

function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { zona, elegirUbicacion } = useZona();
  const location = useLocation();
  const navigate = useNavigate();

  const estadoNav = location.state as { direccionId?: number; compraDirecta?: CartItem } | null;
  // Si vuelve de agregar o editar una dirección, llega con su id para dejarla elegida
  const direccionDeRegreso = estadoNav?.direccionId;
  // "Pagar ahora": se compra solo ese producto y el carrito no se toca
  const compraDirecta = estadoNav?.compraDirecta ?? null;

  const lineas = compraDirecta ? [compraDirecta] : items;
  const total = compraDirecta ? compraDirecta.unitPrice * compraDirecta.quantity : totalPrice;

  // Al ir a direcciones y volver, la compra directa viaja con la navegación
  const volverAlCheckout = { from: "/checkout", compraDirecta };

  const [loading, setLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const [direcciones, setDirecciones] = useState<Address[]>([]);
  const [direccionesLoading, setDireccionesLoading] = useState(true);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<number | null>(null);
  const [eligiendoDireccion, setEligiendoDireccion] = useState(false);

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalesLoading, setSucursalesLoading] = useState(true);

  // ⚠️ Pendiente de backend: se eligen pero todavía no se envían con el pedido
  const [formaEntrega, setFormaEntrega] = useState<FormaEntrega>("envio");
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  // Pregunta "¿Confirmás tu pedido?" antes de enviarlo
  const [preguntando, setPreguntando] = useState(false);
  const [error, setError] = useState("");
  const [avisoSucursal, setAvisoSucursal] = useState("");

  // La dirección elegida pasa a ser la zona: el Navbar y el checkout muestran siempre lo mismo
  function usarComoZona(d: Address) {
    if (d.latitud == null || d.longitud == null) return;
    const coords = { lat: Number(d.latitud), lng: Number(d.longitud) };
    const nueva = buscarSucursalCercana(coords, sucursales);
    const error = elegirUbicacion({
      calle: d.calle,
      numero: d.numero,
      localidad: d.localidad ?? "",
      provincia: d.provincia ?? "",
      codigoPostal: d.codigoPostal ?? "",
      latitud: coords.lat,
      longitud: coords.lng,
    });
    if (error) {
      setError(error);
      return;
    }
    if (zona && nueva && nueva.sucursal.id !== zona.sucursalId) {
      setAvisoSucursal(
        `Ahora tu pedido sale de ${nueva.sucursal.nombre}. Si algún producto no está disponible ahí, te avisamos al confirmar.`,
      );
    }
  }
  useEffect(() => {
    if (!user) return;
    getDirecciones(user.id)
      .then((data) => {
        setDirecciones(data);
        const deRegreso = data.find((d) => d.id === direccionDeRegreso);
        // Si alguna dirección guardada es la de la zona, se elige esa
        const deLaZona = zona
          ? data.find(
              (d) =>
                d.latitud != null &&
                d.longitud != null &&
                distanciaKm(
                  { lat: Number(d.latitud), lng: Number(d.longitud) },
                  { lat: zona.latitud, lng: zona.longitud },
                ) < MISMA_DIRECCION_KM,
            )
          : undefined;
        const predeterminada = data.find((d) => d.predeterminada);
        // Con zona, se elige la dirección de la zona (si no está guardada, primero hay que guardarla).
        // Sin zona, la predeterminada.
        const inicial = deRegreso ?? deLaZona ?? (zona ? undefined : predeterminada ?? data[0]);
        setDireccionSeleccionada(inicial?.id ?? null);
        // Si viene de agregar o editar una dirección, esa pasa a ser la zona
        if (deRegreso) usarComoZona(deRegreso);
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

  // Si no está logueado o no hay nada para comprar, no debería estar acá
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (lineas.length === 0 && !confirmedOrder) {
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

  // El pedido se armó con el stock de la sucursal de la zona: la dirección tiene que ser de esa sucursal
  const sucursalDistinta = Boolean(zona && masCercana && dentroDeZona && masCercana.sucursal.id !== zona.sucursalId);
  const puedeConfirmar = Boolean(direccion && masCercana && dentroDeZona && !sucursalDistinta);

  // ¿La dirección de la zona ya está entre las guardadas?
  const zonaGuardada =
    !zona ||
    direcciones.some(
      (d) =>
        d.latitud != null &&
        d.longitud != null &&
        distanciaKm({ lat: Number(d.latitud), lng: Number(d.longitud) }, { lat: zona.latitud, lng: zona.longitud }) <
          MISMA_DIRECCION_KM,
    );

  // Pasa la zona a la dirección elegida (cambia la sucursal y su disponibilidad)
  function usarDireccionComoZona() {
    if (!direccion || !coordsDireccion) return;
    setError(
      elegirUbicacion({
        calle: direccion.calle,
        numero: direccion.numero,
        localidad: direccion.localidad ?? "",
        provincia: direccion.provincia ?? "",
        codigoPostal: direccion.codigoPostal ?? "",
        latitud: coordsDireccion.lat,
        longitud: coordsDireccion.lng,
      }),
    );
  }

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
    if (sucursalDistinta) {
      setError("Esta dirección le corresponde a otra sucursal. Cambiá tu zona para confirmar.");
      return;
    }

    setError("");
    setPreguntando(true);
  }

  // Se llama desde el cartel "¿Confirmás tu pedido?"
  async function enviarPedido() {
    if (!direccion || !masCercana) return;
    setLoading(true);
    try {
      const order = await createOrder(user!.id, lineas, direccion.id, masCercana.sucursal.id);
      setPreguntando(false);
      setConfirmedOrder(order);
      // En una compra directa, el carrito queda como estaba
      if (!compraDirecta) clearCart();
    } catch (err) {
      setPreguntando(false);
      setError(err instanceof Error ? err.message : "Error al confirmar el pedido");
    } finally {
      setLoading(false);
    }
  }

  if (confirmedOrder) {
    return <PedidoConfirmado pedido={confirmedOrder} quedanEnCarrito={compraDirecta ? items.length : 0} />;
  }

  const tarjetaElegida = "flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand-dark bg-brand-cream/60 p-4";
  const linkAccion = "text-sm font-bold text-brand-dark underline-offset-4 hover:text-brand-red hover:underline";
  const botonChico =
    "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border-2 border-brand-dark bg-white px-4 text-sm font-bold transition-colors hover:bg-brand-dark hover:text-brand-cream";

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <PageHeader
        titulo="Confirmar pedido"
        subtitulo={
          compraDirecta
            ? "Compra directa: estás pagando solo este producto, tu carrito no se modifica."
            : "Revisá todo antes de mandarlo a la cocina."
        }
      >
        <PasosCompra actual={1} />
      </PageHeader>

      <div className="mx-auto -mt-12 grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="flex flex-col gap-5">
          {/* Volver: al carrito, o al producto si es una compra directa */}
          {compraDirecta ? (
            <button type="button" onClick={() => navigate(-1)} className={`${botonChico} w-fit shadow-sticker`}>
              <ArrowLeft className="h-4 w-4" /> Volver al producto
            </button>
          ) : (
            <Link to="/carrito" className={`${botonChico} w-fit shadow-sticker`}>
              <ArrowLeft className="h-4 w-4" /> Volver al carrito
            </Link>
          )}

          {/* ---------- Cómo lo recibís (pendiente de backend) ---------- */}
          <SeccionCheckout titulo="¿Cómo lo recibís?" Icono={Bike}>
            <OpcionesCheckout nombre="Cómo lo recibís" opciones={FORMAS_ENTREGA} elegida={formaEntrega} onElegir={setFormaEntrega} />
          </SeccionCheckout>

          {/* ---------- Dirección de entrega ---------- */}
          <SeccionCheckout titulo="Dirección de entrega" Icono={MapPin}>
            {/* La dirección de la zona, si todavía no está guardada */}
            {zona && !zonaGuardada && !direccionesLoading && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-brand-dark/30 p-4">
                <div className="min-w-0">
                  <p className="font-bold">La dirección de tu zona</p>
                  <p className="text-sm text-brand-muted">
                    {zona.calle} {zona.numero} — {zona.localidad}
                  </p>
                </div>
                <Link
                  to="/direcciones"
                  state={{
                    ...volverAlCheckout,
                    abrirNueva: true,
                    prefill: {
                      calle: zona.calle,
                      numero: zona.numero,
                      localidad: zona.localidad,
                      provincia: zona.provincia,
                      codigoPostal: zona.codigoPostal,
                      latitud: zona.latitud,
                      longitud: zona.longitud,
                    },
                  }}
                  className="shrink-0 rounded-full bg-brand-dark px-4 py-2 text-sm font-bold text-brand-cream transition-transform hover:-translate-y-0.5"
                >
                  Guardarla
                </Link>
              </div>
            )}

            {direccionesLoading ? (
              <p className="text-sm text-brand-muted">Cargando direcciones...</p>
            ) : direcciones.length === 0 ? (
              zona ? null : (
                <div className="rounded-2xl border-2 border-dashed border-brand-dark/30 p-4">
                  <p className="font-semibold">Todavía no tenés direcciones guardadas.</p>
                  <Link to="/direcciones" state={{ ...volverAlCheckout, abrirNueva: true }} className={`mt-1 inline-block ${linkAccion}`}>
                    Agregar una dirección →
                  </Link>
                </div>
              )
            ) : !eligiendoDireccion && direccion ? (
              // La dirección elegida. "Cambiar" abre la lista (ahí también se edita o se agrega una)
              <div className={tarjetaElegida}>
                <div className="min-w-0">
                  <p className="font-display text-lg font-extrabold">{direccion.alias}</p>
                  <p className="text-sm text-brand-muted">
                    {direccion.calle} {direccion.numero} — {direccion.localidad}
                  </p>
                </div>
                <button type="button" onClick={() => setEligiendoDireccion(true)} className={botonChico}>
                  Cambiar
                </button>
              </div>
            ) : (
              // Lista para elegir otra dirección
              <div className="flex flex-col gap-2">
                {direcciones.map((d) => {
                  const elegida = direccionSeleccionada === d.id;
                  return (
                    <label
                      key={d.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors ${
                        elegida ? "border-brand-dark bg-brand-cream/60" : "border-brand-dark/15 hover:border-brand-dark/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="direccion"
                        className="mt-1 h-4 w-4 accent-brand-red"
                        checked={elegida}
                        onChange={() => {
                          setDireccionSeleccionada(d.id);
                          setEligiendoDireccion(false);
                          setError("");
                          usarComoZona(d);
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold">{d.alias}</span>
                          {d.predeterminada && (
                            <span className="rounded-full bg-brand-mustard px-2 py-0.5 text-xs font-extrabold">Predeterminada</span>
                          )}
                        </div>
                        <p className="text-sm text-brand-muted">
                          {d.calle} {d.numero} — {d.localidad}
                        </p>
                      </div>
                      <Link
                        to="/direcciones"
                        state={{ ...volverAlCheckout, editarId: d.id }}
                        aria-label={`Editar ${d.alias}`}
                        title="Editar"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand-cream hover:text-brand-dark"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </label>
                  );
                })}
                <Link
                  to="/direcciones"
                  state={{ ...volverAlCheckout, abrirNueva: true }}
                  className="rounded-2xl border-2 border-dashed border-brand-dark/30 p-4 text-center text-sm font-bold transition-colors hover:border-brand-dark"
                >
                  + Agregar dirección
                </Link>
              </div>
            )}
          </SeccionCheckout>

          {/* ---------- Sucursal ---------- */}
          <SeccionCheckout titulo="Sucursal que lo prepara" Icono={Store}>
            {sucursalesLoading ? (
              <p className="text-sm text-brand-muted">Buscando la sucursal...</p>
            ) : !direccion ? (
              <p className="text-sm text-brand-muted">
                {zona && !zonaGuardada
                  ? "Guardá la dirección de tu zona para confirmar el pedido."
                  : "Elegí una dirección para ver qué sucursal te lo envía."}
              </p>
            ) : !coordsDireccion ? (
              <Aviso>
                <p className="font-semibold">Esta dirección no tiene ubicación en el mapa.</p>
                <Link to="/direcciones" state={{ ...volverAlCheckout, editarId: direccion.id }} className="mt-1 inline-block font-bold underline">
                  Marcarla en el mapa →
                </Link>
              </Aviso>
            ) : !masCercana ? (
              <p className="text-sm text-brand-muted">No hay sucursales disponibles.</p>
            ) : !dentroDeZona ? (
              <Aviso tono="error">
                <p className="font-semibold">Tu dirección está fuera de nuestra zona de entrega.</p>
                <p className="mt-1">
                  La sucursal más cercana, {masCercana.sucursal.nombre}, está a {formatearKm(masCercana.distancia)} km y
                  entrega hasta {masCercana.sucursal.radioEntregaKm} km.
                </p>
              </Aviso>
            ) : sucursalDistinta && zona ? (
              <Aviso>
                <p className="font-semibold">
                  Tu pedido es de {zona.sucursalNombre}, pero esta dirección le corresponde a {masCercana.sucursal.nombre}.
                </p>
                <p className="mt-1">
                  Si cambiás tu zona, revisá el pedido: algunos productos pueden no estar disponibles en esa sucursal.
                </p>
                <button
                  type="button"
                  onClick={usarDireccionComoZona}
                  className="mt-3 rounded-full bg-brand-dark px-4 py-2 font-bold text-brand-cream transition-transform hover:-translate-y-0.5"
                >
                  Pedir desde {masCercana.sucursal.nombre}
                </button>
              </Aviso>
            ) : (
              <div className={tarjetaElegida}>
                <div className="min-w-0">
                  <p className="font-display text-lg font-extrabold">{masCercana.sucursal.nombre}</p>
                  <p className="text-sm text-brand-muted">
                    {masCercana.sucursal.calle} {masCercana.sucursal.numero} — {masCercana.sucursal.localidad}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-dark px-3 py-1 text-xs font-extrabold text-brand-mustard">
                  a {formatearKm(masCercana.distancia)} km
                </span>
              </div>
            )}
          </SeccionCheckout>

          {/* ---------- Forma de pago (pendiente de backend) ---------- */}
          <SeccionCheckout titulo="Forma de pago" Icono={Wallet}>
            <OpcionesCheckout nombre="Forma de pago" opciones={FORMAS_PAGO} elegida={formaPago} onElegir={setFormaPago} />
          </SeccionCheckout>

        </div>

        {/* Resumen y, debajo del botón de confirmar, los avisos y errores (así se ven al confirmar) */}
        <div className="flex flex-col gap-4">
          <ResumenPedido
            lineas={lineas}
            total={total}
            onConfirmar={handleConfirm}
            deshabilitado={loading || !puedeConfirmar}
            cargando={loading}
          />
          {avisoSucursal && <Aviso>{avisoSucursal}</Aviso>}
          <ErrorAlert message={error} />
        </div>
      </div>
      
      <ModalConfirmarPedido
        abierto={preguntando}
        total={total}
        direccion={direccion ? `${direccion.alias} · ${direccion.calle} ${direccion.numero}` : ""}
        sucursal={masCercana?.sucursal.nombre ?? ""}
        formaPago={FORMAS_PAGO.find((f) => f.id === formaPago)?.titulo ?? ""}
        cargando={loading}
        onCancelar={() => setPreguntando(false)}
        onConfirmar={enviarPedido}
      />
    </div>
  );
}
export default Checkout;