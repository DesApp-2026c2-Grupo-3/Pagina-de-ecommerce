import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Gift, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useZona } from '../context/ZonaContext'
import EditarItemModal from '../components/EditarItemModal'
import PageHeader from '../components/ui/PageHeader'
import PasosCompra from '../components/cart/PasosCompra'
import CartItemRow from '../components/cart/CartItemRow'
import SugerenciasCarrito from '../components/cart/SugerenciaCarrito'
import ResumenCarrito from '../components/cart/ResumenCarrito'
import NotaCocina from '../components/cart/NotaCocina'
import AvisoCierreSucursal from '../components/sucursal/AvisoCierreSucursal'
import ConfirmarEliminarModal from '../components/cart/ConfirmarEliminacionModal'
import type { CartItem } from '../types/cart'
import type { Promo } from '../types/promo'
import { getPromociones } from '../services/promotionService'

// ==========================================
// CONSTANTES DE ESTILO
// ==========================================
const contenedorVacioClase = 'mx-auto -mt-12 max-w-md px-4 pb-16'
const tarjetaVaciaClase =
  'flex flex-col items-center gap-4 rounded-[2rem] border-2 border-brand-dark bg-white p-6 text-center shadow-sticker sm:p-8'
const iconoVacioCajaClase =
  'relative grid h-24 w-24 -rotate-6 place-items-center rounded-3xl border-2 border-brand-dark bg-brand-mustard shadow-sticker'
const badgeCeroClase =
  'absolute -right-3 -top-3 grid h-9 w-9 rotate-12 place-items-center rounded-full border-2 border-brand-dark bg-brand-red font-display text-lg font-extrabold text-white'
const botonMenuVacioClase =
  'mt-2 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:translate-y-0.5'

const layoutCarritoClase =
  'mx-auto -mt-12 grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_22rem] lg:items-start [&>*]:min-w-0'
const barraAccionesClase = 'flex flex-wrap items-center justify-between gap-2.5'
const botonVolverMenuClase =
  'inline-flex min-h-11 w-fit shrink-0 items-center gap-1.5 rounded-full border-2 border-brand-dark bg-white px-3.5 text-sm font-bold shadow-sticker transition-all duration-200 hover:translate-y-0.5 hover:bg-brand-dark hover:text-brand-cream min-[380px]:px-4'

const botonVaciarClase =
  'group inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-full border-2 border-brand-dark bg-brand-mustard pl-2 pr-3.5 text-sm font-bold text-brand-dark shadow-[4px_4px_0_var(--color-brand-dark)] transition-all duration-200 hover:translate-y-0.5 hover:bg-brand-red hover:text-white min-[380px]:gap-2.5 min-[380px]:pr-5'
const iconoTachoClase =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-brand-dark bg-brand-red text-white transition-colors duration-200 group-hover:border-white group-hover:bg-brand-dark'

const alertaPromoClase = 'rounded-2xl border-2 border-brand-dark bg-brand-mustard p-3.5 font-bold sm:p-4'
const iconoRegaloClase =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-brand-dark bg-brand-red text-white sm:h-10 sm:w-10'

function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { zona } = useZona()
  const navigate = useNavigate()

  const [editando, setEditando] = useState<CartItem | null>(null)
  const [itemAEliminar, setItemAEliminar] = useState<CartItem | null>(null)
  const [mostrarModalVaciar, setMostrarModalVaciar] = useState(false)

  // Se guarda en la sesión para no perderla al ir y volver del checkout
  const [observaciones, setObservaciones] = useState(() => {
    try {
      return sessionStorage.getItem('observacionesPedido') ?? ''
    } catch {
      return ''
    }
  })

  function cambiarObservaciones(valor: string) {
    setObservaciones(valor)
    try {
      sessionStorage.setItem('observacionesPedido', valor)
    } catch {
      /* sin storage */
    }
  }

  // Se puede editar si tiene tamaños o ingredientes para quitar o agregar
  const esEditable = (item: CartItem) =>
    Boolean(
      item.product.tamanios?.length ||
      item.product.ingredientes?.some((i) => i.esRemovible || i.esAgregable),
    )

  const sucursalCerrada = Boolean(zona && zona.sucursalAbierta === false)

  // Promos vigentes, para controlar las que piden una compra mínima
  const [promos, setPromos] = useState<Promo[]>([])
  useEffect(() => {
    getPromociones()
      .then((p) =>
        setPromos(
          [p.productoSemana, p.regalo, ...p.dias.flatMap((d) => d.promos)].filter(
            (promo): promo is Promo => Boolean(promo),
          ),
        ),
      )
      .catch(() => setPromos([]))
  }, [])

  // Promos del carrito que todavía no llegan a su compra mínima
  const faltantes = promos
    .filter((promo) => promo.compraMinima && items.some((i) => i.promoId === promo.id))
    .map((promo) => {
      const resto = items
        .filter((i) => i.promoId !== promo.id)
        .reduce((suma, i) => suma + i.unitPrice * i.quantity, 0)
      return { promo, falta: (promo.compraMinima ?? 0) - resto }
    })
    .filter((f) => f.falta > 0)

  const textoFaltante = faltantes
    .map((f) => `Te faltan $${f.falta.toLocaleString('es-AR')} en otros productos para la promo "${f.promo.titulo}".`)
    .join(' ')

  function handleCheckout() {
    if (sucursalCerrada || faltantes.length > 0) return

    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/carrito' } })
      return
    }
    navigate('/checkout', { state: { observaciones } })
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <PageHeader
          titulo={
            <>
              Tu <span className="text-brand-red">carrito</span>
            </>
          }
        />
        <div className={contenedorVacioClase}>
          <div className={tarjetaVaciaClase}>
            <span className={iconoVacioCajaClase}>
              <ShoppingBag className="h-12 w-12" strokeWidth={2.2} />
              <span className={badgeCeroClase}>0</span>
            </span>
            <h2 className="font-display text-2xl font-extrabold text-brand-dark sm:text-3xl">
              Todavía no agregaste nada
            </h2>
            <p className="text-brand-muted">Elegí tu antojo del menú y lo vas a ver acá.</p>
            <Link to="/catalogo?grupo=todos" className={botonMenuVacioClase}>
              Ver el menú <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const cantidadTotal = items.reduce((suma, item) => suma + item.quantity, 0)

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <PageHeader
        titulo={
          <>
            Tu <span className="text-brand-red">carrito</span>
          </>
        }
        subtitulo="Acá podés ver los productos seleccionados"
      >
        <PasosCompra actual={0} />
      </PageHeader>

      <div className={layoutCarritoClase}>
        <div className="flex flex-col gap-3">
          {/* Barra superior de acciones rápidas */}
          <div className={barraAccionesClase}>
            <Link to="/catalogo?grupo=todos" className={botonVolverMenuClase}>
              <ArrowLeft className="h-4 w-4" /> Ir al Menú
            </Link>

            <button type="button" onClick={() => setMostrarModalVaciar(true)} className={botonVaciarClase}>
              <span className={iconoTachoClase}>
                <Trash2 className="h-3.5 w-3.5 stroke-[2.4px]" />
              </span>
              <span className="min-[380px]:hidden">Vaciar</span>
              <span className="hidden min-[380px]:inline">Eliminar todo</span>
            </button>
          </div>

          {sucursalCerrada && <AvisoCierreSucursal sucursal={zona?.sucursalNombre} />}

          {faltantes.map((f) => (
            <div key={f.promo.id} role="alert" className={alertaPromoClase}>
              <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
                <span className={iconoRegaloClase}>
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span className="text-sm leading-snug sm:text-base">
                  Te faltan ${f.falta.toLocaleString('es-AR')} en otros productos para la promo &ldquo;{f.promo.titulo}
                  &rdquo; (compra mínima ${(f.promo.compraMinima ?? 0).toLocaleString('es-AR')}).
                </span>
              </div>
            </div>
          ))}

          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onCantidad={(cantidad) => updateQuantity(item.id, cantidad)}
              onQuitar={() => setItemAEliminar(item)}
              onEditar={esEditable(item) ? () => setEditando(item) : undefined}
            />
          ))}

          <NotaCocina guardada={observaciones} onGuardar={cambiarObservaciones} />
        </div>

        <ResumenCarrito
          cantidad={cantidadTotal}
          subtotal={totalPrice}
          logueado={isAuthenticated}
          deshabilitado={sucursalCerrada || faltantes.length > 0}
          motivo={sucursalCerrada ? undefined : textoFaltante}
          onConfirmar={handleCheckout}
          nota={observaciones}
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

      {mostrarModalVaciar && (
        <ConfirmarEliminarModal
          nombreProducto="todos los productos"
          onCancelar={() => setMostrarModalVaciar(false)}
          onConfirmar={() => {
            clearCart()
            setMostrarModalVaciar(false)
          }}
        />
      )}
    </div>
  )
}

export default Cart

