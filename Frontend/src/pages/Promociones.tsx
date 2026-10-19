import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Gift, ShoppingBag } from 'lucide-react'
import ProductCard from '../components/home/ProductCard'
import { getMasPedidos, getProducts } from '../services/productService'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useZona } from '../context/ZonaContext'
import { PROMO_ESTRELLA, PROMOS_COMPARTIR, PROMOS_SEMANA, type Promo, type PromoCompartir } from '../config/promosConfig'
import { resolverPromo, resumenLineas, type PromoResuelta } from '../utils/promosUtils'
import { formatearPrecio } from '../utils/precio'
import type { ProductoBackend } from '../types/product'

const TONOS: Record<PromoCompartir['tono'], { fondo: string; texto: string; etiqueta: string }> = {
  rojo: { fondo: 'bg-brand-red', texto: 'text-white', etiqueta: 'bg-brand-dark text-brand-cream' },
  mostaza: { fondo: 'bg-brand-mustard', texto: 'text-brand-dark', etiqueta: 'bg-brand-dark text-brand-cream' },
  oscuro: { fondo: 'bg-brand-dark', texto: 'text-brand-cream', etiqueta: 'bg-brand-mustard text-brand-dark' },
}

// ⚠️ Las promos salen de config/promos.ts (no hay tabla en el backend).
// Cada botón arma el carrito con los productos reales de la promo, al precio real.
function Promociones() {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { zona } = useZona()
  const sucursalId = zona?.sucursalId

  const [catalogo, setCatalogo] = useState<ProductoBackend[]>([])
  const [masPedidos, setMasPedidos] = useState<ProductoBackend[]>([])
  const [cargando, setCargando] = useState(true)
  // Arranca en el día de hoy
  const [dia, setDia] = useState(() => new Date().getDay())

  useEffect(() => {
    setCargando(true)
    Promise.all([getProducts(sucursalId), getMasPedidos(sucursalId, 8).catch(() => [])])
      .then(([productos, ranking]) => {
        setCatalogo(productos)
        const porId = new Map(productos.map((p) => [p.id, p]))
        setMasPedidos(
          ranking.map((r) => porId.get(r.productoId)).filter((p): p is ProductoBackend => Boolean(p?.disponible)).slice(0, 4),
        )
      })
      .catch(() => setCatalogo([]))
      .finally(() => setCargando(false))
  }, [sucursalId])

  const resolver = useMemo(() => {
    const cache = new Map<string, PromoResuelta>()
    return (promo: Promo) => {
      if (!cache.has(promo.id)) cache.set(promo.id, resolverPromo(promo, catalogo))
      return cache.get(promo.id)!
    }
  }, [catalogo])

  // Suma al carrito los productos de la promo y lleva a revisarlo
  function pedirPromo(promo: Promo) {
    const { lineas, disponible } = resolver(promo)
    if (!disponible || lineas.length === 0) return
    for (const l of lineas) {
      addItem(l.producto, l.cantidad, [`Promo: ${promo.titulo}`], { combo: l.combo })
    }
    showToast(`Promo "${promo.titulo}" agregada al carrito`)
    navigate('/carrito')
  }

  const delDia = PROMOS_SEMANA.find((p) => p.dia === dia) ?? PROMOS_SEMANA[0]
  // Lunes primero
  const semana = [...PROMOS_SEMANA].sort((a, b) => ((a.dia + 6) % 7) - ((b.dia + 6) % 7))
  const estrella = resolver(PROMO_ESTRELLA)
  const hoy = resolver(delDia)

  const textoBoton = (r: PromoResuelta, texto: string) =>
    cargando ? 'Cargando…' : r.disponible ? texto : 'No disponible en tu zona'

  return (
    <div className="min-h-screen bg-brand-cream pb-16 text-brand-dark">
      {/* ---------- Hero: título + promo estrella ---------- */}
      <section className="overflow-hidden bg-brand-dark px-4 pb-16 pt-10 text-brand-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10">
          <div className="flex min-w-[18rem] flex-1 flex-col gap-4">
            <h1 className="font-display text-6xl font-extrabold leading-[0.9] tracking-tight sm:text-7xl">
              Promos
              <br />
              <span className="text-brand-red">que pegan</span>
            </h1>
            <p className="max-w-md text-lg text-brand-cream/70">
              Elegí una promo y te armamos el carrito al toque. Después lo revisás y confirmás.
            </p>
          </div>

          <button
            type="button"
            onClick={() => pedirPromo(PROMO_ESTRELLA)}
            disabled={!estrella.disponible}
            className="flex min-w-[18rem] flex-1 -rotate-[1.5deg] flex-col gap-3 rounded-[2rem] border-2 border-brand-cream bg-brand-red p-7 text-left text-white shadow-[10px_10px_0_var(--color-brand-mustard)] transition-transform duration-200 hover:rotate-0 disabled:cursor-not-allowed disabled:opacity-60 sm:p-8"
          >
            <span className="self-start rounded-full bg-brand-dark px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-mustard">
              Promo estrella
            </span>
            <span className="font-display text-7xl font-extrabold leading-[0.85] sm:text-8xl">
              {PROMO_ESTRELLA.destacado}
              <span className="text-4xl"> OFF</span>
            </span>
            <span className="font-display text-3xl font-extrabold tracking-tight">{PROMO_ESTRELLA.titulo}</span>
            <span className="text-sm text-white/80">{PROMO_ESTRELLA.detalle}</span>
            <span className="mt-2 inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-3 font-extrabold text-brand-dark">
              {textoBoton(estrella, 'La quiero')} <ArrowRight className="h-5 w-5" />
            </span>
          </button>
        </div>
      </section>

      {/* ---------- Banner primera compra ---------- */}
      <div className="mx-auto -mt-7 max-w-6xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border-2 border-brand-dark bg-brand-mustard px-6 py-4 shadow-sticker">
          <p className="flex items-center gap-3 font-extrabold">
            <Gift className="h-6 w-6 shrink-0" />
            Tu primer pedido viene con papas de regalo
          </p>
          <Link
            to="/catalogo"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-5 font-bold text-brand-cream transition-transform hover:-translate-y-0.5"
          >
            Empezar a pedir <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ---------- La semana en promos ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">La semana en promos</h2>
          <span className="font-semibold text-brand-muted">Cada día tiene la suya</span>
        </div>

        <div role="tablist" aria-label="Días de la semana" className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {semana.map((p) => {
            const activo = p.dia === dia
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setDia(p.dia)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-brand-dark px-1 sm:min-h-20 ${
                  activo ? 'bg-brand-red text-white' : 'bg-white hover:bg-brand-cream'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">{p.corto}</span>
                <span className="hidden font-display text-lg font-extrabold sm:block">{p.destacado}</span>
              </button>
            )
          })}
        </div>

        <div
          key={delDia.id}
          className="bf-pop mt-4 flex flex-wrap items-center gap-6 rounded-[1.75rem] border-2 border-brand-dark bg-white p-6 shadow-sticker sm:p-7"
        >
          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl border-2 border-brand-dark bg-brand-mustard font-display text-3xl font-extrabold">
            {delDia.destacado}
          </span>
          <div className="flex min-w-[14rem] flex-1 flex-col gap-1">
            <span className="text-sm font-extrabold uppercase tracking-wider text-brand-red">{delDia.nombreDia}</span>
            <span className="font-display text-3xl font-extrabold tracking-tight">{delDia.titulo}</span>
            <span className="text-brand-muted">{delDia.detalle}</span>
            {hoy.lineas.length > 0 && (
              <span className="mt-1 text-sm font-semibold">
                Te suma: {resumenLineas(hoy.lineas)} · {formatearPrecio(hoy.total)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => pedirPromo(delDia)}
            disabled={!hoy.disponible || cargando}
            className="inline-flex min-h-13 items-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingBag className="h-5 w-5" />
            {textoBoton(hoy, 'Pedirla')}
          </button>
        </div>
      </section>

      {/* ---------- Para compartir ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <h2 className="mb-5 font-display text-4xl font-extrabold tracking-tight">Para compartir</h2>
        <div className="bf-escalonado grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROMOS_COMPARTIR.map((promo) => {
            const r = resolver(promo)
            const tono = TONOS[promo.tono]
            return (
              <button
                key={promo.id}
                type="button"
                onClick={() => pedirPromo(promo)}
                disabled={!r.disponible || cargando}
                className={`flex flex-col overflow-hidden rounded-[1.75rem] border-2 border-brand-dark text-left transition-transform duration-200 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 ${tono.fondo} ${tono.texto}`}
              >
                <div className="flex items-start justify-between gap-3 p-6 pb-4">
                  <span className="font-display text-6xl font-extrabold leading-[0.85]">{promo.destacado}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${tono.etiqueta}`}>{promo.etiqueta}</span>
                </div>
                <p className="px-6 pb-5 text-sm opacity-80">{promo.detalle}</p>
                <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-dashed border-brand-dark bg-white px-6 py-4 text-brand-dark">
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold">{promo.titulo}</p>
                    <p className="text-sm text-brand-muted">{textoBoton(r, 'Tocá para pedirla')}</p>
                  </div>
                  {r.disponible && <span className="shrink-0 text-xl font-extrabold text-brand-red">{formatearPrecio(r.total)}</span>}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ---------- Los más pedidos (ranking real) ---------- */}
      {masPedidos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <h2 className="mb-5 font-display text-4xl font-extrabold tracking-tight">
            Los <span className="text-brand-red">más pedidos</span>
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {masPedidos.map((producto) => (
              <ProductCard key={producto.id} product={producto} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Promociones