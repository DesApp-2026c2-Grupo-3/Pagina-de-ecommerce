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
        <div className="mx-auto grid grid-cols-1 max-w-6xl gap-10 md:grid-cols-2 md:items-center">

          <div className="flex flex-col gap-4">
            <h1 className="font-display text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-6xl md:text-7xl">
              Promos
              <br />
              <span className="text-brand-red">que pegan</span>
            </h1>
            <p className="max-w-md text-base text-brand-cream/70 sm:text-lg">
              Elegí una promo y la sumamos a tu carrito con el descuento aplicado. Después lo revisás y confirmás.
            </p>
          </div>

          {semana && semanaResuelta && (
            <button
              type="button"
              onClick={() => pedir(semana)}
              disabled={cargando || !semanaResuelta.disponible}
              className="grid w-full max-w-md mx-auto grid-cols-[1fr_auto] -rotate-[1.5deg] items-center gap-4 rounded-[2rem] border-2 border-brand-cream bg-brand-red p-5 pr-6 text-left text-white shadow-[10px_10px_0_var(--color-brand-mustard)] transition-transform duration-200 hover:rotate-0 disabled:cursor-not-allowed disabled:opacity-60 sm:p-6 sm:pr-8 sm:max-w-xl md:max-w-none md:grid-cols-[1.15fr_1fr] md:gap-5 lg:p-8"
            >
              {/* Lado Izquierdo del Botón: Textos */}
              <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
                {/* Etiqueta superior pulida */}
                <span className="self-start rounded-full bg-brand-dark px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-brand-mustard sm:text-[10px] md:text-xs">
                  Producto de la semana
                </span>

                {/* Escalado armónico del Descuento */}
                <span className="font-display text-4xl font-extrabold leading-none sm:text-5xl md:text-5xl lg:text-7xl whitespace-nowrap">
                  {semana.destacado}
                  <span className="text-lg sm:text-2xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight"> OFF</span>
                </span>

                {/* Ajuste fino del título para evitar cortes toscos */}
                <h2 className="font-display text-lg font-extrabold tracking-tight break-words sm:text-2xl md:text-xl lg:text-3xl leading-tight mt-0.5">
                  {semana.titulo}
                </h2>

                {semanaResuelta.disponible && (
                  <span className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-lg font-extrabold sm:text-xl md:text-xl lg:text-2xl">{formatearPrecio(semanaResuelta.total)}</span>
                    <s className="text-[10px] font-bold text-white/70 sm:text-xs md:text-sm">{formatearPrecio(semanaResuelta.totalLista)}</s>
                  </span>
                )}

                {/* Botón de acción con proporciones equilibradas */}
                <span className="mt-2 inline-flex min-h-9 min-w-[7rem] items-center justify-center gap-1.5 self-start rounded-full bg-white px-4 py-1.5 text-[11px] font-extrabold text-brand-dark sm:min-h-11 sm:min-w-[8rem] sm:px-6 sm:text-sm md:mt-2">
                  {cargando ? 'Cargando…' : 'La quiero'} <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
              </div>

              {/* Lado Derecho: Imagen Flotante Adaptativa */}
              <div className="w-28 shrink-0 overflow-visible sm:w-40 md:w-44 lg:w-56 flex justify-center items-center">
                {productoSemana?.imagen ? (
                  <img
                    src={productoSemana.imagen}
                    alt=""
                    className="w-[105%] h-auto object-contain drop-shadow-2xl transition-transform scale-110 sm:scale-105 md:scale-110 lg:scale-105"
                  />
                ) : (
                  <CategoryIcon icono="combo" className="h-20 w-20 text-white/80 sm:h-28 sm:w-28" />
                )}
              </div>
            </button>
          )}
        </div>
      </section>


      {/* ---------- Regalo de la semana ---------- */}
      {promos?.regalo && (
        <div className="mx-auto -mt-7 max-w-6xl px-4">

          <div className="relative flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border-2 border-brand-dark bg-brand-mustard px-6 py-4 shadow-sticker">
            <span className="absolute -top-3 left-20 -translate-y-px rounded-md bg-red-500 border border-2 border-black px-2 py-0.5 text-[10px] !font-black uppercase tracking-wider text-white shadow-sm z-10">
              Esta semana
            </span>

            <div className="flex items-center gap-3 font-extrabold">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-3 border-black bg-red-600 shadow-sm">
                <Gift
                  className="h-6 w-6 text-white fill-blue"
                  strokeWidth={2}
                />
              </div>

              <span className="text-wrap">
                {promos.regalo.titulo}
                {promos.regalo.compraMinima ? (
                  <span className="block text-sm font-bold opacity-80">
                    Con compras desde ${promos.regalo.compraMinima.toLocaleString('es-AR')}
                  </span>
                ) : null}
              </span>
            </div>

            <button
              type="button"
              onClick={() => pedir(promos.regalo!, false)}
              disabled={cargando}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-5 font-bold text-brand-cream transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              Sumalas ya <ArrowRight className="h-4 w-4" />
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
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-brand-dark px-1 sm:min-h-16 ${activo ? 'bg-brand-red text-white' : 'bg-white hover:bg-brand-cream'
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
