import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useZona } from '../context/ZonaContext'
import { cotizarEnvio, createOrder, getHistorialPedidos } from '../services/orderService'
import { getParametros } from '../services/parametroService'
import { getDirecciones } from '../services/addressService'
import { getSucursales } from '../services/sucursalService'
import ErrorAlert from '../components/ErrorAlert'
import { ArrowLeft, ChevronDown, House, Pencil, Store } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import PasosCompra from '../components/cart/PasosCompra'
import SeccionCheckout from '../components/checkout/SeccionCheckout'
import Aviso from '../components/ui/Aviso'
import AvisoCierreSucursal from '../components/sucursal/AvisoCierreSucursal'
import ResumenPedido from '../components/checkout/ResumenPedido'
import PedidoConfirmado from '../components/checkout/PedidoConfirmado'
import OpcionesCheckout from '../components/checkout/OpcionesCheckout'
import { FORMAS_ENTREGA, FORMAS_PAGO, type FormaEntrega, type FormaPago } from '../config/compra'
import { buscarSucursalCercana, sucursalParaEntrega } from '../utils/sucursales'
import ElegirSucursal from '../components/sucursal/ElegirSucursal'
import { estadoSucursal } from '../utils/horario'
import { distanciaKm } from '../utils/distancia'
import type { Cotizacion, Order } from '../types/order'
import type { Address } from '../types/address'
import type { Sucursal } from '../types/sucursal'
import type { CartItem } from '../types/cart'
import ModalConfirmarPedido from '../components/checkout/ModalConfirmarPedido'
import PreparandoPedido from '../components/checkout/PreparandoPedido'
import { esperar } from '../utils/esperar'

function formatearKm(km: number) {
  return km.toLocaleString('es-AR', { maximumFractionDigits: 1 })
}

const MISMA_DIRECCION_KM = 0.05
const MAX_PEDIDOS_EN_CURSO_INICIAL = 2
const estaEnCurso = (o: Order) => !['entregado', 'cancelado'].includes(o.estado.trim().toLowerCase())

// ==========================================
// CONSTANTES DE ESTILO
// ==========================================
const layoutCheckoutClase =
  'mx-auto -mt-12 grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_24rem] lg:items-start [&>*]:min-w-0'
const tarjetaElegidaClase =
  'flex flex-wrap items-center gap-3 rounded-[1.75rem] border-2 border-brand-dark bg-white px-4 py-3.5 sm:flex-nowrap sm:gap-4 sm:px-5 sm:py-4'
const iconoTarjetaClase = 'grid h-11 w-11 shrink-0 place-items-center rounded-2xl sm:h-12 sm:w-12'
const linkAccionClase = 'text-sm font-bold text-brand-dark underline-offset-4 hover:text-brand-red hover:underline'
const botonChicoClase =
  'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border-2 border-brand-dark bg-white px-3.5 text-xs font-bold transition-all duration-200 hover:translate-y-0.5 hover:bg-brand-dark hover:text-brand-cream sm:min-h-10 sm:px-4 sm:text-sm'

const botonVolverClase =
  'inline-flex h-10 min-h-0 w-fit shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-bold text-brand-dark transition-all duration-200 hover:translate-y-0.5 hover:bg-brand-mustard hover:text-black'
const botonIconoEditarClase =
  'grid h-9 w-9 shrink-0 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand-cream hover:text-brand-dark'

function Checkout() {
  const { user, isAuthenticated } = useAuth()
  const { items, totalPrice, clearCart } = useCart()
  const { zona, elegirUbicacion, opcionesSucursal } = useZona()
  const location = useLocation()
  const navigate = useNavigate()

  const estadoNav = location.state as { direccionId?: number; compraDirecta?: CartItem; observaciones?: string } | null
  const direccionDeRegreso = estadoNav?.direccionId
  const compraDirecta = estadoNav?.compraDirecta ?? null
  const observaciones = estadoNav?.observaciones ?? ''

  const lineas = compraDirecta ? [compraDirecta] : items
  const total = compraDirecta ? compraDirecta.unitPrice * compraDirecta.quantity : totalPrice
  const volverAlCheckout = { from: '/checkout', compraDirecta, observaciones }

  const [searchParams] = useSearchParams()
  const paso: 1 | 2 = searchParams.get('paso') === 'pago' ? 2 : 1

  function irAPaso(n: 1 | 2) {
    setError('')
    window.scrollTo(0, 0)
    if (n === 2) {
      navigate('/checkout?paso=pago', { state: location.state })
    } else if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1)
    } else {
      navigate('/checkout', { state: location.state, replace: true })
    }
  }

  const [loading, setLoading] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)

  const [direcciones, setDirecciones] = useState<Address[]>([])
  const [direccionesLoading, setDireccionesLoading] = useState(true)
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<number | null>(null)
  const [eligiendoDireccion, setEligiendoDireccion] = useState(false)

  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [sucursalesLoading, setSucursalesLoading] = useState(true)

  const [formaEntrega, setFormaEntrega] = useState<FormaEntrega>('envio')
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo')
  const [preguntando, setPreguntando] = useState(false)
  const [procesando, setProcesando] = useState<{ fase: 'preparando' | 'listo'; numero?: number } | null>(null)
  const [error, setError] = useState('')
  const [avisoSucursal, setAvisoSucursal] = useState('')
  const [pedidosEnCurso, setPedidosEnCurso] = useState(0)
  const [maxPedidosEnCurso, setMaxPedidosEnCurso] = useState(MAX_PEDIDOS_EN_CURSO_INICIAL)
  const [cotizacionGuardada, setCotizacionGuardada] = useState<{ clave: string; datos: Cotizacion } | null>(null)

  function usarComoZona(d: Address) {
    if (d.latitud == null || d.longitud == null) return
    const coords = { lat: Number(d.latitud), lng: Number(d.longitud) }
    const nueva = buscarSucursalCercana(coords, sucursales)
    const err = elegirUbicacion({
      calle: d.calle,
      numero: d.numero,
      localidad: d.localidad ?? '',
      provincia: d.provincia ?? '',
      codigoPostal: d.codigoPostal ?? '',
      latitud: coords.lat,
      longitud: coords.lng,
    })
    if (err) {
      setError(err)
      return
    }
    if (zona && nueva && nueva.sucursal.id !== zona.sucursalId) {
      setAvisoSucursal(
        `Ahora tu pedido sale de ${nueva.sucursal.nombre}. Si algún producto no está disponible ahí, te avisamos al confirmar.`,
      )
    }
  }

  useEffect(() => {
    if (!user) return
    getDirecciones(user.id)
      .then((data) => {
        setDirecciones(data)
        const deRegreso = data.find((d) => d.id === direccionDeRegreso)
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
          : undefined
        const predeterminada = data.find((d) => d.predeterminada)
        const inicial = deRegreso ?? deLaZona ?? (zona ? undefined : predeterminada ?? data.at(0))
        setDireccionSeleccionada(inicial?.id ?? null)
        if (deRegreso) usarComoZona(deRegreso)
      })
      .catch(() => setError('No se pudieron cargar tus direcciones'))
      .finally(() => setDireccionesLoading(false))
  }, [user])

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .catch(() => setError('No se pudieron cargar las sucursales'))
      .finally(() => setSucursalesLoading(false))
  }, [])

  useEffect(() => {
    getParametros()
      .then((p) => setMaxPedidosEnCurso(p.maxPedidosEnCurso))
      .catch(() => {})
  }, [])

  const unidades = lineas.reduce((suma, item) => suma + item.quantity, 0)
  const claveCotizacion = `${direccionSeleccionada}|${unidades}|${zona?.sucursalId}`
  const cotizacion = cotizacionGuardada?.clave === claveCotizacion ? cotizacionGuardada.datos : null

  useEffect(() => {
    const elegida = direcciones.find((d) => d.id === direccionSeleccionada)
    if (!user || !elegida || elegida.latitud == null || elegida.longitud == null) return
    const cercana = sucursalParaEntrega(
      { lat: Number(elegida.latitud), lng: Number(elegida.longitud) },
      sucursales,
      zona?.sucursalId,
    )
    if (!cercana?.dentroDeZona || unidades === 0) return

    let cancelado = false
    cotizarEnvio(user.id, elegida.id, cercana.sucursal.id, unidades)
      .then((datos) => {
        if (!cancelado) setCotizacionGuardada({ clave: `${elegida.id}|${unidades}|${zona?.sucursalId}`, datos })
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [user, direcciones, direccionSeleccionada, sucursales, unidades, zona?.sucursalId])

  useEffect(() => {
    if (!user) return
    getHistorialPedidos(user.id)
      .then((pedidos) => setPedidosEnCurso(pedidos.filter(estaEnCurso).length))
      .catch(() => setPedidosEnCurso(0))
  }, [user])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (lineas.length === 0 && !confirmedOrder) {
    return <Navigate to="/carrito" replace />
  }

  const direccion = direcciones.find((d) => d.id === direccionSeleccionada)
  const coordsDireccion =
    direccion && direccion.latitud != null && direccion.longitud != null
      ? { lat: Number(direccion.latitud), lng: Number(direccion.longitud) }
      : null

  const masCercana = sucursalParaEntrega(coordsDireccion, sucursales, zona?.sucursalId)
  const dentroDeZona = masCercana?.dentroDeZona ?? false
  const estadoPedido = masCercana
    ? estadoSucursal(masCercana.sucursal.horario, masCercana.sucursal.zona_horaria)
    : null
  const sucursalCerrada = estadoPedido
    ? !estadoPedido.abierta
    : Boolean(zona && zona.sucursalAbierta === false)

  const sucursalDistinta = Boolean(zona && masCercana && dentroDeZona && masCercana.sucursal.id !== zona.sucursalId)
  const limiteAlcanzado = pedidosEnCurso >= maxPedidosEnCurso
  const puedeConfirmar = Boolean(
    direccion && masCercana && dentroDeZona && !sucursalDistinta && !sucursalCerrada && !limiteAlcanzado,
  )

  const zonaGuardada =
    !zona ||
    direcciones.some(
      (d) =>
        d.latitud != null &&
        d.longitud != null &&
        distanciaKm({ lat: Number(d.latitud), lng: Number(d.longitud) }, { lat: zona.latitud, lng: zona.longitud }) <
          MISMA_DIRECCION_KM,
    )

  function usarDireccionComoZona() {
    if (!direccion || !coordsDireccion) return
    setError(
      elegirUbicacion({
        calle: direccion.calle,
        numero: direccion.numero,
        localidad: direccion.localidad ?? '',
        provincia: direccion.provincia ?? '',
        codigoPostal: direccion.codigoPostal ?? '',
        latitud: coordsDireccion.lat,
        longitud: coordsDireccion.lng,
      }),
    )
  }

  async function handleConfirm() {
    if (!direccion) {
      setError('Seleccioná una dirección de entrega')
      return
    }
    if (!coordsDireccion) {
      setError('Tu dirección no tiene ubicación en el mapa. Editala para completarla.')
      return
    }
    if (!masCercana || !dentroDeZona) {
      setError('Tu dirección está fuera de nuestra zona de entrega')
      return
    }
    if (sucursalDistinta) {
      setError('Esta dirección le corresponde a otra sucursal. Cambiá tu zona para confirmar.')
      return
    }
    if (sucursalCerrada) {
      setError('La sucursal está cerrada en este horario. No se pueden generar pedidos por ahora.')
      return
    }
    if (limiteAlcanzado) {
      setError(`Ya tenés ${pedidosEnCurso} pedidos en curso. Esperá a que se entregue alguno para hacer otro.`)
      return
    }

    setError('')
    setPreguntando(true)
  }

  async function enviarPedido() {
    if (!direccion || !masCercana) return
    const estado = estadoSucursal(masCercana.sucursal.horario, masCercana.sucursal.zona_horaria)
    if (!estado.abierta) {
      setPreguntando(false)
      setError(`${estado.motivo ?? 'La sucursal está cerrada'}. No se pueden generar pedidos por ahora.`)
      return
    }
    setPreguntando(false)
    setLoading(true)
    setProcesando({ fase: 'preparando' })
    try {
      const [order] = await Promise.all([
        createOrder(user!.id, lineas, direccion.id, masCercana.sucursal.id, compraDirecta ? '' : observaciones),
        esperar(3000),
      ])
      setProcesando({ fase: 'listo', numero: order.id })
      await esperar(1600)
      setProcesando(null)
      setConfirmedOrder(order)
      if (!compraDirecta) {
        clearCart()
        try {
          sessionStorage.removeItem('observacionesPedido')
        } catch {
          /* sin storage */
        }
      }
    } catch (err) {
      setProcesando(null)
      setError(err instanceof Error ? err.message : 'Error al confirmar el pedido')
    } finally {
      setLoading(false)
    }
  }

  if (confirmedOrder) {
    return <PedidoConfirmado pedido={confirmedOrder} quedanEnCarrito={compraDirecta ? items.length : 0} />
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
            <PageHeader
        titulo={paso === 1 ? 'Datos de entrega' : 'Pago y confirmación'}
        subtitulo={
          compraDirecta
            ? 'Compra directa: estás pagando solo este producto, tu carrito no se modifica.'
            : paso === 1
              ? 'Elegí dónde y cómo querés recibir tu pedido.'
              : 'Seleccioná tu medio de pago antes de enviarlo a la cocina.'
        }
      >
        <PasosCompra actual={paso} />
      </PageHeader>


            <div className={layoutCheckoutClase}>
        <div className="flex flex-col gap-4">
          {paso === 2 ? (
            <button type="button" onClick={() => irAPaso(1)} className={botonVolverClase}>
              <ArrowLeft className="h-4 w-4" /> Volver a la entrega
            </button>
          ) : compraDirecta ? (
            <button type="button" onClick={() => navigate(-1)} className={botonVolverClase}>
              <ArrowLeft className="h-4 w-4" /> Volver al producto
            </button>
          ) : (
            <Link to="/carrito" className={botonVolverClase}>
              <ArrowLeft className="h-4 w-4" /> Volver al carrito
            </Link>
          )}


          {limiteAlcanzado && (
            <Aviso variante="error" titulo={`Ya tenés ${pedidosEnCurso} pedidos en curso.`}>
              Podés hacer uno nuevo cuando se entregue o se cancele alguno.{' '}
              <Link to="/historial" className="font-bold underline">
                Ver mis pedidos
              </Link>
            </Aviso>
          )}

          {sucursalCerrada && (
            <AvisoCierreSucursal
              sucursal={masCercana?.sucursal.nombre ?? zona?.sucursalNombre}
              motivo={estadoPedido?.motivo}
            />
          )}

                    {/* ==========================================
              SUB-PASO 1: ENTREGA, DIRECCIÓN Y SUCURSAL
              ========================================== */}
          {paso === 1 && (
            <>
              <SeccionCheckout titulo="¿Cómo lo recibís?">
                <OpcionesCheckout
                  nombre="Cómo lo recibís"
                  opciones={FORMAS_ENTREGA}
                  elegida={formaEntrega}
                  onElegir={setFormaEntrega}
                />
              </SeccionCheckout>

              <SeccionCheckout titulo="Dirección de entrega">
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
                      className="shrink-0 rounded-full bg-brand-dark px-4 py-2 text-sm font-bold text-brand-cream transition-transform hover:translate-y-0.5"
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
                      <Link
                        to="/direcciones"
                        state={{ ...volverAlCheckout, abrirNueva: true }}
                        className={`mt-1 inline-block ${linkAccionClase}`}
                      >
                        Agregar una dirección →
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="rounded-[1.75rem] border-2 border-brand-dark bg-white">
                    {direccion && (
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap sm:gap-4 sm:px-5 sm:py-4">
                        <span className={`${iconoTarjetaClase} bg-brand-mustard`}>
                          <House className="h-5 w-5 sm:h-6 sm:w-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-extrabold sm:text-lg">{direccion.alias}</p>
                          <p className="truncate text-sm text-brand-muted sm:text-base">
                            {direccion.calle} {direccion.numero} · {direccion.localidad}
                          </p>
                          {direccion.piso && (
                            <p className="truncate text-xs text-brand-muted sm:text-sm">
                              Timbre / depto: {direccion.piso}
                            </p>
                          )}
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
                          <Link
                            to="/direcciones"
                            state={{ ...volverAlCheckout, editarId: direccion.id }}
                            aria-label={`Editar ${direccion.alias}`}
                            title="Editar"
                            className={botonIconoEditarClase}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEligiendoDireccion((valor) => !valor)}
                            aria-expanded={eligiendoDireccion}
                            className={botonChicoClase}
                          >
                            Cambiar
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${eligiendoDireccion ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </div>
                      </div>
                    )}

                    {(eligiendoDireccion || !direccion) && (
                      <ul className={direccion ? 'border-t-2 border-dashed border-brand-sand' : ''}>
                        {direcciones
                          .filter((d) => d.id !== direccionSeleccionada)
                          .map((d) => (
                            <li
                              key={d.id}
                              className="flex items-center gap-2 pr-3 transition-colors hover:bg-brand-cream"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setDireccionSeleccionada(d.id)
                                  setEligiendoDireccion(false)
                                  setError('')
                                  usarComoZona(d)
                                }}
                                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left sm:px-5"
                              >
                                <House className="h-5 w-5 shrink-0 text-brand-muted" />
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold">{d.alias}</span>
                                    {d.predeterminada && (
                                      <span className="rounded-full bg-brand-mustard px-2 py-0.5 text-xs font-extrabold">
                                        Predeterminada
                                      </span>
                                    )}
                                  </span>
                                  <span className="block truncate text-xs text-brand-muted sm:text-sm">
                                    {d.calle} {d.numero} — {d.localidad}
                                  </span>
                                </span>
                                <span className="shrink-0 text-xs font-bold text-brand-red sm:text-sm">Elegir</span>
                              </button>
                              <Link
                                to="/direcciones"
                                state={{ ...volverAlCheckout, editarId: d.id }}
                                aria-label={`Editar ${d.alias}`}
                                title="Editar"
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-brand-muted transition-colors hover:bg-white hover:text-brand-dark"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </li>
                          ))}
                        <li className="border-t-2 border-dashed border-brand-sand">
                          <Link
                            to="/direcciones"
                            state={{ ...volverAlCheckout, abrirNueva: true }}
                            className="block px-5 py-3 text-center text-sm font-bold transition-colors hover:bg-brand-cream"
                          >
                            + Agregar dirección
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                )}
              </SeccionCheckout>

              <SeccionCheckout titulo="Sucursal que lo prepara">
                {sucursalesLoading ? (
                  <p className="text-sm text-brand-muted">Buscando la sucursal...</p>
                ) : !direccion ? (
                  <p className="text-sm text-brand-muted">
                    {zona && !zonaGuardada
                      ? 'Guardá la dirección de tu zona para confirmar el pedido.'
                      : 'Elegí una dirección para ver qué sucursal te lo envía.'}
                  </p>
                ) : !coordsDireccion ? (
                  <Aviso titulo="Esta dirección no tiene ubicación en el mapa.">
                    <Link
                      to="/direcciones"
                      state={{ ...volverAlCheckout, editarId: direccion.id }}
                      className="mt-1 inline-block font-bold underline"
                    >
                      Marcarla en el mapa →
                    </Link>
                  </Aviso>
                ) : !masCercana ? (
                  <p className="text-sm text-brand-muted">No hay sucursales disponibles.</p>
                ) : !dentroDeZona ? (
                                    <Aviso variante="error" titulo="Tu dirección está fuera de nuestra zona de entrega.">
                    <p className="mt-1">
                      La sucursal más cercana, {masCercana.sucursal.nombre}, está a {formatearKm(masCercana.distancia)}{' '}
                      km y entrega hasta {masCercana.sucursal.radioEntregaKm} km.
                    </p>
                  </Aviso>
                ) : sucursalDistinta && zona ? (
                  <Aviso
                    titulo={`Tu pedido es de ${zona.sucursalNombre}, pero esta dirección le corresponde a ${masCercana.sucursal.nombre}.`}
                  >
                    <p className="mt-1">
                      Si cambiás tu zona, revisá el pedido: algunos productos pueden no estar disponibles en esa
                      sucursal.
                    </p>
                    <button
                      type="button"
                      onClick={usarDireccionComoZona}
                      className="mt-3 rounded-full bg-brand-dark px-4 py-2 font-bold text-brand-cream transition-transform hover:translate-y-0.5"
                    >
                      Pedir desde {masCercana.sucursal.nombre}
                    </button>
                  </Aviso>
                ) : opcionesSucursal.length > 1 ? (
                  <ElegirSucursal />
                ) : (
                  <div className={tarjetaElegidaClase}>
                    <span className={`${iconoTarjetaClase} bg-brand-red text-white`}>
                      <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-extrabold sm:text-lg">{masCercana.sucursal.nombre}</p>
                      <p className="truncate text-sm text-brand-muted sm:text-base">
                        {masCercana.sucursal.calle} {masCercana.sucursal.numero} · {masCercana.sucursal.localidad}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 rounded-full bg-brand-dark px-3 py-1 text-xs font-extrabold text-brand-mustard sm:ml-0">
                      a {formatearKm(masCercana.distancia)} km
                    </span>
                  </div>
                )}
              </SeccionCheckout>
            </>
          )}

          {/* ==========================================
              SUB-PASO 2: FORMA DE PAGO
              ========================================== */}
          {paso === 2 && (
            <SeccionCheckout titulo="Forma de pago">
              <OpcionesCheckout
                nombre="Forma de pago"
                opciones={FORMAS_PAGO}
                elegida={formaPago}
                onElegir={setFormaPago}
              />
            </SeccionCheckout>
          )}


        </div>

        <div className="flex flex-col gap-4">
          <ErrorAlert message={error} />
          {avisoSucursal && <Aviso mensaje={avisoSucursal} />}
                    <ResumenPedido
            lineas={lineas}
            total={total}
            costoEnvio={cotizacion?.costoEnvio ?? null}
            demora={cotizacion ? String(cotizacion.minutosEstimados) : undefined}
            onConfirmar={paso === 1 ? () => irAPaso(2) : handleConfirm}
            deshabilitado={loading || !puedeConfirmar}
            cargando={loading}
            textoBoton={paso === 1 ? 'Continuar' : 'Confirmar pedido'}
          />

        </div>
      </div>

      <ModalConfirmarPedido
        abierto={preguntando}
        total={total + (cotizacion?.costoEnvio ?? 0)}
        direccion={direccion ? `${direccion.alias} · ${direccion.calle} ${direccion.numero}` : ''}
        sucursal={masCercana?.sucursal.nombre ?? ''}
        formaPago={FORMAS_PAGO.find((f) => f.id === formaPago)?.titulo ?? ''}
        observaciones={compraDirecta ? '' : observaciones}
        cargando={loading}
        onCancelar={() => setPreguntando(false)}
        onConfirmar={enviarPedido}
      />

      {procesando && (
        <PreparandoPedido
          fase={procesando.fase}
          sucursal={masCercana?.sucursal.nombre ?? 'la sucursal'}
          numeroPedido={procesando.numero}
        />
      )}
    </div>
  )
}

export default Checkout
