import { useState } from 'react'
import { ArrowRight, ChevronDown, Timer } from 'lucide-react'
import { etiquetaTamanio } from '../../config/combo'
import { formatearPrecio } from '../../utils/precio'
import type { CartItem } from '../../types/cart'

interface Props {
  lineas: CartItem[]
  total: number
  /** Envío calculado por el backend. null = todavía no se sabe (falta elegir la dirección) */
  costoEnvio?: number | null
  onConfirmar: () => void
  deshabilitado: boolean
  cargando: boolean
  textoBoton?: string
  demora?: string // ej: "25–35". Si no viene, no se muestra el aviso
}

// A partir de más de 3 productos distintos, la lista se agrupa con "Ver detalles"
const MAX_ITEMS_DIRECTOS = 3

// ==========================================
// CONSTANTES DE ESTILO
// ==========================================
const tarjetaResumenClase =
  'flex flex-col gap-3.5 rounded-[2rem] border-2 border-brand-dark bg-white p-4 shadow-sticker min-[380px]:gap-4 min-[380px]:p-5 sm:gap-5 sm:p-6'
const tituloResumenClase =
  'font-display text-2xl font-extrabold tracking-tight text-brand-dark sm:text-3xl'
const separadorPunteadoClase = 'border-t-2 border-dashed border-brand-dark/20'

const cajaToggleDetallesClase =
  'flex items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-brand-sand bg-brand-cream/50 px-3 py-2 min-[380px]:px-3.5 min-[380px]:py-2.5'
const botonToggleDetallesClase =
  'inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-brand-dark shadow-xs transition-colors hover:bg-brand-mustard min-[380px]:px-3'

const filaDetalleClase =
  'flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm min-[380px]:text-base'
const filaTotalClase =
  'flex flex-wrap items-baseline justify-between gap-2 pt-3.5 min-[380px]:pt-4'
const montoTotalClase =
  'font-display text-2xl font-extrabold tabular-nums tracking-tight text-brand-dark min-[380px]:text-3xl sm:text-4xl'

const pillDemoraClase =
  'flex items-center gap-2.5 rounded-2xl bg-brand-cream px-3.5 py-2.5 text-xs font-bold text-brand-dark min-[380px]:gap-3 min-[380px]:px-4 min-[380px]:py-3 min-[380px]:text-sm'

const botonConfirmarClase =
  'group flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-red px-5 text-sm font-extrabold text-white transition-all duration-200 hover:translate-y-0.5 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 min-[380px]:min-h-13 min-[380px]:text-base sm:min-h-14 sm:px-6 sm:text-lg'

// Columna derecha del checkout: qué se pide, el total y el botón para avanzar
function ResumenPedido({
  lineas,
  total,
  costoEnvio = null,
  onConfirmar,
  deshabilitado,
  cargando,
  textoBoton = 'Confirmar pedido',
  demora,
}: Props) {
  const [detallesAbiertos, setDetallesAbiertos] = useState(false)

  const totalConEnvio = costoEnvio === null ? total : total + costoEnvio
  const esListaLarga = lineas.length > MAX_ITEMS_DIRECTOS
  const mostrarLista = !esListaLarga || detallesAbiertos
  const totalUnidades = lineas.reduce((acc, item) => acc + item.quantity, 0)

  const textoEnvio =
    costoEnvio === null ? 'Elegí tu dirección' : costoEnvio === 0 ? 'Gratis' : formatearPrecio(costoEnvio)

  return (
    <aside className={tarjetaResumenClase}>
      <h2 className={tituloResumenClase}>Tu pedido</h2>

      {/* Si hay más de 3 productos distintos, muestra resumen compacto + botón desplegable */}
      {esListaLarga && (
        <div className={cajaToggleDetallesClase}>
          <span className="min-w-0 truncate text-xs font-bold text-brand-dark min-[380px]:text-sm">
            {totalUnidades} {totalUnidades === 1 ? 'producto' : 'productos'} ({lineas.length} ítems)
          </span>
          <button
            type="button"
            onClick={() => setDetallesAbiertos((prev) => !prev)}
            aria-expanded={detallesAbiertos}
            className={botonToggleDetallesClase}
          >
            <span>{detallesAbiertos ? 'Ocultar' : 'Ver detalles'}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${detallesAbiertos ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      )}

      {/* Listado de productos */}
      {mostrarLista && (
        <ul className="flex flex-col gap-2.5 min-[380px]:gap-3">
          {lineas.map((item) => {
            const detalle = [
              etiquetaTamanio(
                item.tamanio,
                item.product.tamanios?.find((t) => t.tamanioId === item.tamanioId)?.etiqueta,
              ),
              ...item.selectedOptions.filter((t) => !t.startsWith('Promo:')),
            ]
              .filter(Boolean)
              .join(' · ')

            return (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug min-[380px]:text-base">
                    <span className="font-extrabold">{item.quantity}×</span> {item.product.nombre}
                  </p>
                  {detalle && (
                    <p className="mt-0.5 truncate text-xs text-brand-muted min-[380px]:text-sm">{detalle}</p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-extrabold tabular-nums min-[380px]:text-base">
                  {formatearPrecio(item.unitPrice * item.quantity)}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Subtotal y envío */}
      <div className={`flex flex-col gap-1.5 pt-3.5 min-[380px]:gap-2 min-[380px]:pt-4 ${separadorPunteadoClase}`}>
        <div className={filaDetalleClase}>
          <span className="text-brand-muted">Subtotal</span>
          <span className="font-extrabold tabular-nums text-brand-dark">{formatearPrecio(total)}</span>
        </div>

        <div className={filaDetalleClase}>
          <span className="text-brand-muted">Envío</span>
          <span
            className={`text-right font-extrabold tabular-nums ${
              costoEnvio === null ? 'text-xs text-brand-muted min-[380px]:text-sm' : 'text-brand-dark'
            }`}
          >
            {textoEnvio}
          </span>
        </div>
      </div>

      {/* Total final */}
      <div className={`${filaTotalClase} ${separadorPunteadoClase}`}>
        <span className="text-base font-extrabold min-[380px]:text-lg sm:text-xl">Total</span>
        <span className={montoTotalClase}>{formatearPrecio(totalConEnvio)}</span>
      </div>

      {/* Demora estimada */}
      {demora && (
        <p className={pillDemoraClase}>
          <Timer className="h-5 w-5 shrink-0 text-brand-red min-[380px]:h-6 min-[380px]:w-6" />
          <span>Llega en {demora} min aprox.</span>
        </p>
      )}

      {/* Botón principal */}
      <button type="button" onClick={onConfirmar} disabled={deshabilitado} className={botonConfirmarClase}>
        <span>{cargando ? 'Confirmando...' : textoBoton}</span>
        {!cargando && (
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1 min-[380px]:h-5 min-[380px]:w-5" />
        )}
      </button>
    </aside>
  )
}

export default ResumenPedido
