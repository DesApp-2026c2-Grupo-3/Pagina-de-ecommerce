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
import { MoveRight } from 'lucide-react'


const TONOS: TonoPromo[] = ['rojo', 'oscuro', 'mostaza']

const ESTILOS = {
  pagina: 'min-h-screen bg-brand-cream pb-16 text-brand-dark',

  // Hero: Producto de la semana
  heroSeccion: 'overflow-hidden bg-brand-dark px-4 pb-16 pt-10 text-brand-cream',
  heroGrid: 'mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2 md:items-center',
  heroColTexto: 'flex flex-col gap-4',
  heroTitulo: 'font-display text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-6xl md:text-7xl',
  heroSubtitulo: 'max-w-md text-base text-brand-cream/70 sm:text-lg',

  semanaBotonCard:
    'mx-auto grid w-full max-w-md -rotate-[1.5deg] grid-cols-[1fr_auto] items-center gap-4 rounded-[2rem] border-2 border-brand-cream bg-brand-red p-5 pr-6 text-left text-white shadow-[10px_10px_0_var(--color-brand-mustard)] transition-transform duration-200 hover:rotate-0 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xl sm:p-6 sm:pr-8 md:max-w-none md:grid-cols-[1.15fr_1fr] md:gap-5 lg:p-8',
  semanaColInfo: 'flex min-w-0 flex-col gap-1 sm:gap-1.5',
  semanaBadge:
    'self-start rounded-full bg-brand-dark px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-brand-mustard sm:text-[10px] md:text-xs',
  semanaDescuento:
    'whitespace-nowrap font-display text-4xl font-extrabold leading-none sm:text-5xl md:text-5xl lg:text-7xl',
  semanaDescuentoOff: 'text-lg font-black uppercase tracking-tight sm:text-2xl md:text-2xl lg:text-3xl',
  semanaTitulo:
    'mt-0.5 break-words font-display text-lg font-extrabold leading-tight tracking-tight sm:text-2xl md:text-xl lg:text-3xl',
  semanaPrecioActual: 'text-lg font-extrabold sm:text-xl md:text-xl lg:text-2xl',
  semanaPrecioLista: 'text-[10px] font-bold text-white/70 sm:text-xs md:text-sm',
    semanaCtaPill:
    'mt-2.5 inline-flex min-h-11 min-w-[8.5rem] items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-2 text-xs font-extrabold text-brand-dark shadow-sm sm:min-h-12 sm:min-w-[9.5rem] sm:px-6 sm:text-sm',

  semanaImgWrapper: 'flex w-28 shrink-0 items-center justify-center overflow-visible sm:w-40 md:w-44 lg:w-56',
  semanaImg: 'h-auto w-[105%] scale-110 object-contain drop-shadow-2xl transition-transform sm:scale-105 md:scale-110 lg:scale-105',

  // Regalo de la semana
  regaloWrapper: 'mx-auto -mt-7 max-w-6xl px-4',
    regaloCard:
    'relative flex cursor-pointer flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border-2 border-brand-dark bg-brand-mustard px-5 py-4 shadow-sticker transition-transform active:scale-[0.99] min-[392px]:cursor-default min-[392px]:px-6 min-[392px]:active:scale-100',
  regaloBoton:
    'hidden min-h-11 items-center gap-2 rounded-full bg-brand-dark px-4 font-bold text-brand-cream transition-transform hover:-translate-y-0.5 disabled:opacity-50 min-[392px]:inline-flex',
  regaloAvisoMobile:
    'mt-1 block text-[11px] font-black uppercase tracking-wider text-brand-dark/70 min-[392px]:hidden',
regaloRibbon:
    'absolute -top-3 left-20 z-10 -translate-y-px rounded-md border-2 border-black bg-red-500 px-2 py-0.5 text-[10px] !font-black uppercase tracking-wider text-white shadow-sm',
  regaloIconoWrapper:
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-3 border-black bg-red-600 shadow-sm',
  

  // La semana en promos
  semanaSeccion: 'mx-auto max-w-6xl px-4 pt-14',
  semanaHeader: 'mb-5 flex flex-wrap items-end justify-between gap-3',
  semanaSeccionTitulo: 'font-display text-4xl font-extrabold tracking-tight',
  diasTablist: 'grid grid-cols-7 gap-1.5 sm:gap-2.5',
  diaTabBase:
    'flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-brand-dark px-1 sm:min-h-16',
  diaTabActivo: 'bg-brand-red text-white',
  diaTabInactivo: 'bg-white hover:bg-brand-cream',
  avisoOtroDia:
    'mt-4 rounded-2xl border-2 border-dashed border-brand-dark/30 px-4 py-3 text-sm font-semibold text-brand-muted',
  promosGrid: 'mt-6 grid auto-rows-fr gap-6',
} as const

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
    <div className={ESTILOS.pagina}>
      {/* ---------- Hero: producto de la semana ---------- */}
      <section className={ESTILOS.heroSeccion}>
        <div className={ESTILOS.heroGrid}>
          <div className={ESTILOS.heroColTexto}>
            <h1 className={ESTILOS.heroTitulo}>
              Promos
              <br />
              <span className="text-brand-red">que pegan</span>
            </h1>
            <p className={ESTILOS.heroSubtitulo}>
              Elegí una promo y la sumamos a tu carrito con el descuento aplicado. Después lo revisás y confirmás.
            </p>
          </div>

          {semana && semanaResuelta && (
            <button
              type="button"
              onClick={() => pedir(semana)}
              disabled={cargando || !semanaResuelta.disponible}
              className={ESTILOS.semanaBotonCard}
            >
              {/* Lado Izquierdo del Botón: Textos */}
              <div className={ESTILOS.semanaColInfo}>
                <span className={ESTILOS.semanaBadge}>Producto de la semana</span>

                <span className={ESTILOS.semanaDescuento}>
                  {semana.destacado}
                  <span className={ESTILOS.semanaDescuentoOff}> OFF</span>
                </span>

                <h2 className={ESTILOS.semanaTitulo}>{semana.titulo}</h2>

                {semanaResuelta.disponible && (
                  <span className="flex items-baseline gap-2 pt-0.5">
                    <span className={ESTILOS.semanaPrecioActual}>{formatearPrecio(semanaResuelta.total)}</span>
                    <s className={ESTILOS.semanaPrecioLista}>{formatearPrecio(semanaResuelta.totalLista)}</s>
                  </span>
                )}

                <span className={ESTILOS.semanaCtaPill}>
                  {cargando ? 'Cargando…' : semanaResuelta.disponible ? 'La quiero' : 'No disponible en tu zona'}{' '}
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
              </div>

              {/* Lado Derecho: Imagen Flotante Adaptativa */}
              <div className={ESTILOS.semanaImgWrapper}>
                {productoSemana?.imagen ? (
                  <img src={productoSemana.imagen} alt="" className={ESTILOS.semanaImg} />
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
        <div className={ESTILOS.regaloWrapper}>
          <div
            role="button"
            tabIndex={0}
            aria-disabled={cargando}
            onClick={() => {
              if (!cargando && window.innerWidth < 392) {
                pedir(promos.regalo!, false)
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !cargando && window.innerWidth < 392) {
                e.preventDefault()
                pedir(promos.regalo!, false)
              }
            }}
            className={ESTILOS.regaloCard}
          >
            <span className={ESTILOS.regaloRibbon}>Esta semana</span>

            <div className="flex items-center gap-3 font-extrabold">
              <div className={ESTILOS.regaloIconoWrapper}>
                <Gift className="fill-blue h-6 w-6 text-white" strokeWidth={2} />
              </div>

              <span className="text-wrap">
                {promos.regalo.titulo}
                {promos.regalo.compraMinima ? (
                  <span className="block text-sm font-bold opacity-80">
                    Con compras desde ${promos.regalo.compraMinima.toLocaleString('es-AR')}
                  </span>
                ) : null}
                <span className={ESTILOS.regaloAvisoMobile}>Tocá para sumar →</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => pedir(promos.regalo!, false)}
              disabled={cargando}
              className={ESTILOS.regaloBoton}
            >
              <span className="hidden min-[480px]:inline min-[520px]:hidden">Sumalas</span>
              <span className="hidden min-[520px]:inline">Sumalas ya</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}



      {/* ---------- Nuevo en la carta ---------- */}
      <NuevoEnLaCarta catalogo={catalogo} />

      {/* ---------- La semana en promos ---------- */}
      <section className={ESTILOS.semanaSeccion}>
        <div className={ESTILOS.semanaHeader}>
          <h2 className={ESTILOS.semanaSeccionTitulo}>La semana en promos</h2>
          <span className="font-semibold text-brand-muted">Tres promos distintas cada día</span>
        </div>

        <div role="tablist" aria-label="Días de la semana" className={ESTILOS.diasTablist}>
          {promos?.dias.map((d) => {
            const activo = d.dia === diaElegido
            return (
              <button
                key={d.dia}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setDia(d.dia)}
                className={`${ESTILOS.diaTabBase} ${activo ? ESTILOS.diaTabActivo : ESTILOS.diaTabInactivo}`}
              >
                <span className="text-xs font-extrabold uppercase tracking-wider sm:text-sm">
                  {d.nombre.slice(0, 3)}
                </span>
                {d.dia === promos.hoy && <span className="text-[10px] font-bold opacity-80">Hoy</span>}
              </button>
            )
          })}
        </div>

        {!esHoy && (
          <p className={ESTILOS.avisoOtroDia}>
            Estas promos son del {delDia?.nombre.toLowerCase()}: se pueden pedir solo ese día.
          </p>
        )}

        <div className={ESTILOS.promosGrid}>
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

