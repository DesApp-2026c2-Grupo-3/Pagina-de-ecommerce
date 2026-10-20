import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Gift } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useAgregarPromo, useCatalogo, usePromociones } from '../hooks/usePromociones'
import { resolverPromo } from '../utils/promosUtils'
import { formatearPrecio } from '../utils/precio'
import PromoBanner, { type TonoPromo } from '../components/promos/PromoBanner'
import CategoryIcon from '../components/icons/CategoryIcon'
import type { Promo } from '../types/promo'
import NuevoEnLaCarta from '../components/promos/NuevoEnLaCarta'

const TONOS: TonoPromo[] = ['rojo', 'oscuro', 'mostaza']

// Promos: producto de la semana (20 % menos), regalo de la semana y 3 promos por día.
// Cada botón suma al carrito los productos de la promo con su descuento (el backend lo valida al confirmar).
function Promociones() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const promos = usePromociones()
  const { catalogo, cargando } = useCatalogo()
  const agregar = useAgregarPromo(catalogo)
  // Arranca en el día de hoy
  const [dia, setDia] = useState<number | null>(null)
  const diaElegido = dia ?? promos?.hoy ?? new Date().getDay()

  function pedir(promo: Promo, irAlCarrito = true) {
    const error = agregar(promo)
    if (error) {
      showToast(error)
      return
    }
    showToast(`"${promo.titulo}" se sumó a tu carrito`)
    if (irAlCarrito) navigate('/carrito')
  }

  const semana = promos?.productoSemana ?? null
  const semanaResuelta = semana ? resolverPromo(semana, catalogo) : null
  const productoSemana = semanaResuelta?.lineas[0]?.producto
  const delDia = promos?.dias.find((d) => d.dia === diaElegido)
  const esHoy = diaElegido === promos?.hoy

  return (
    <div className="min-h-screen bg-brand-cream pb-16 text-brand-dark">
      {/* ---------- Hero: producto de la semana ---------- */}
      <section className="overflow-hidden bg-brand-dark px-4 pb-16 pt-10 text-brand-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10">
          <div className="flex min-w-[18rem] flex-1 flex-col gap-4">
            <h1 className="font-display text-6xl font-extrabold leading-[0.9] tracking-tight sm:text-7xl">
              Promos
              <br />
              <span className="text-brand-red">que pegan</span>
            </h1>
            <p className="max-w-md text-lg text-brand-cream/70">
              Elegí una promo y la sumamos a tu carrito con el descuento aplicado. Después lo revisás y confirmás.
            </p>
          </div>

          {semana && semanaResuelta && (
            <button
              type="button"
              onClick={() => pedir(semana)}
              disabled={cargando || !semanaResuelta.disponible}
              className="flex min-w-[18rem] flex-1 -rotate-[1.5deg] items-center gap-5 rounded-[2rem] border-2 border-brand-cream bg-brand-red p-6 text-left text-white shadow-[10px_10px_0_var(--color-brand-mustard)] transition-transform duration-200 hover:rotate-0 disabled:cursor-not-allowed disabled:opacity-60 sm:p-8"
            >
              <div className="flex flex-1 flex-col gap-2">
                <span className="self-start rounded-full bg-brand-dark px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-mustard">
                  Producto de la semana
                </span>
                <span className="font-display text-7xl font-extrabold leading-[0.85]">
                  {semana.destacado}
                  <span className="text-3xl"> OFF</span>
                </span>
                <span className="font-display text-3xl font-extrabold tracking-tight">{semana.titulo}</span>
                {semanaResuelta.disponible && (
                  <span className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold">{formatearPrecio(semanaResuelta.total)}</span>
                    <s className="font-bold text-white/70">{formatearPrecio(semanaResuelta.totalLista)}</s>
                  </span>
                )}
                <span className="mt-1 inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-3 font-extrabold text-brand-dark">
                  {cargando ? 'Cargando…' : semanaResuelta.disponible ? 'La quiero' : 'No disponible en tu zona'}{' '}
                  <ArrowRight className="h-5 w-5" />
                </span>
              </div>
              <span className="hidden w-40 shrink-0 sm:block">
                {productoSemana?.imagen ? (
                  <img src={productoSemana.imagen} alt="" className="w-full object-contain drop-shadow-2xl" />
                ) : (
                  <CategoryIcon icono="combo" className="h-24 w-24" />
                )}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* ---------- Regalo de la semana ---------- */}
      {promos?.regalo && (
        <div className="mx-auto -mt-7 max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border-2 border-brand-dark bg-brand-mustard px-6 py-4 shadow-sticker">
            <p className="flex items-center gap-3 font-extrabold">
              <Gift className="h-6 w-6 shrink-0" />
              {promos.regalo.titulo} toda la semana
            </p>
            <button
              type="button"
              onClick={() => pedir(promos.regalo!, false)}
              disabled={cargando}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-5 font-bold text-brand-cream transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              Sumalas gratis <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* ---------- Nuevo en la carta ---------- */}
      <NuevoEnLaCarta catalogo={catalogo} />
      {/* ---------- La semana en promos ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">La semana en promos</h2>
          <span className="font-semibold text-brand-muted">Tres promos distintas cada día</span>
        </div>

        <div role="tablist" aria-label="Días de la semana" className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {promos?.dias.map((d) => {
            const activo = d.dia === diaElegido
            return (
              <button
                key={d.dia}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setDia(d.dia)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-brand-dark px-1 sm:min-h-16 ${
                  activo ? 'bg-brand-red text-white' : 'bg-white hover:bg-brand-cream'
                }`}
              >
                <span className="text-xs font-extrabold uppercase tracking-wider sm:text-sm">{d.nombre.slice(0, 3)}</span>
                {d.dia === promos.hoy && <span className="text-[10px] font-bold opacity-80">Hoy</span>}
              </button>
            )
          })}
        </div>

        {!esHoy && (
          <p className="mt-4 rounded-2xl border-2 border-dashed border-brand-dark/30 px-4 py-3 text-sm font-semibold text-brand-muted">
            Estas promos son del {delDia?.nombre.toLowerCase()}: se pueden pedir solo ese día.
          </p>
        )}

        <div className="mt-6 grid auto-rows-fr gap-6">
          {delDia?.promos.map((promo, i) => (
            <PromoBanner
              key={promo.id}
              promo={promo}
              resuelta={resolverPromo(promo, catalogo)}
              etiqueta={esHoy ? `Hoy · ${delDia.nombre}` : delDia.nombre}
              tono={TONOS[i % TONOS.length]}
              cargando={cargando}
              deshabilitado={esHoy ? undefined : `Disponible el ${delDia.nombre.toLowerCase()}`}
              onPedir={() => pedir(promo)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Promociones
