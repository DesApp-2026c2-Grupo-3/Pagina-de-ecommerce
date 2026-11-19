import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { etiquetaTamanio } from '../../config/combo'
import { formatearPrecio } from '../../utils/precio'
import type { ProductoTamanio } from '../../types/product'
import SeccionOpciones from './SeccionOpciones'

interface SelectorTamanioProps {
  tamanios: ProductoTamanio[]
  valor: number | null
  onChange: (tamanioId: number) => void
  /** Habilita el panel giratorio comparativo de tamaños (solo combos) */
  conImagen?: boolean
}

// ==========================================
// MAPA DE IMÁGENES PARA COMBOS (en /public)
// ==========================================
const IMAGENES_TAMANIO_COMBO: Record<string, string> = {
  regular: '/imagenes/Formatos/Formato-Regular.png',
  mediano: '/imagenes/Formatos/Formato-Mediano.png',
  grande: '/imagenes/Formatos/Formato-Grande.png',
}

function resolverImagenCombo(tamanio?: string): string {
  const clave = tamanio?.toLowerCase().trim() ?? ''
  return IMAGENES_TAMANIO_COMBO[clave] ?? IMAGENES_TAMANIO_COMBO.regular
}

// ==========================================
// CONSTANTES DE ESTILO
// ==========================================
const barraSuperiorClase = 'mb-3 flex items-center justify-between gap-2'
const botonToggleVistaClase =
  'inline-flex items-center gap-1.5 rounded-full border-2 border-brand-dark bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-dark hover:text-brand-cream'

const grupoPastillasClase = 'grid grid-cols-3 justify-items-center gap-2 sm:gap-2.5'
// <= 324px: círculo perfecto (h-12 w-12 rounded-full)
// >= 325px (min-[325px]): pastilla completa (w-full rounded-2xl px-2)
const botonPastillaBaseClase =
  'flex h-12 w-12 min-w-0 items-center justify-center rounded-full border-2 border-brand-dark text-center font-bold transition min-[325px]:h-auto min-[325px]:min-h-12 min-[325px]:w-full min-[325px]:rounded-2xl min-[325px]:px-2 sm:min-h-13 sm:px-5'
const botonActivoClase = 'bg-brand-dark text-brand-cream'
const botonInactivoClase = 'bg-white text-brand-dark hover:translate-y-0.5'

const inicialMovilClase = 'font-display text-base font-extrabold uppercase min-[325px]:hidden'
const textoCompletoClase = 'hidden truncate text-sm min-[325px]:inline sm:text-base'

const infoRecargoClase =
  'mt-2.5 flex items-center justify-between px-1 text-xs font-semibold text-brand-muted sm:text-sm'

const grillaComparativaClase = 'grid grid-cols-3 items-end gap-2 sm:gap-3'
const tarjetaTamanioClase =
  'flex min-w-0 flex-col items-center justify-end rounded-2xl border-2 p-2.5 text-center transition-all duration-200 sm:p-3'
const tarjetaActivaClase = 'border-brand-dark bg-brand-cream shadow-[2px_2px_0px_#252525]'
const tarjetaInactivaClase = 'border-dashed border-brand-sand bg-brand-cream/40 hover:border-brand-dark/50'

function SelectorTamanio({ tamanios, valor, onChange, conImagen = false }: SelectorTamanioProps) {
  const [verIlustraciones, setVerIlustraciones] = useState(false)
  // Precarga las ilustraciones en memoria al montar el componente (solo combos)
  useEffect(() => {
    if (!conImagen) return
    Object.values(IMAGENES_TAMANIO_COMBO).forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [conImagen])
  if (tamanios.length === 0) return null

  const primerTamanio = tamanios.at(0)!
  const base = Number(primerTamanio.precio)
  const tamaniosOrdenados = [...tamanios].sort((a, b) => Number(a.precio) - Number(b.precio))
  const seleccionado = tamaniosOrdenados.find((t) => t.tamanioId === valor) ?? primerTamanio
  const diferenciaActiva = Number(seleccionado.precio) - base

  return (
    <SeccionOpciones titulo="Tamaño" etiqueta={conImagen ? undefined : 'Elegí 1'}>
      {conImagen && (
        <div className={barraSuperiorClase}>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Elegí 1</span>
          <button
            type="button"
            onClick={() => setVerIlustraciones((prev) => !prev)}
            className={botonToggleVistaClase}
            aria-expanded={verIlustraciones}
          >
            {verIlustraciones ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Ocultar
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Ver
              </>
            )}
          </button>
        </div>
      )}

      <div className="[perspective:900px]">
        <div
          className="transition-all duration-300 ease-out [transform-style:preserve-3d]"
          style={{
            transform: verIlustraciones ? 'rotateX(360deg)' : 'rotateX(0deg)',
          }}
        >
          {!verIlustraciones ? (
            <>
              <div role="radiogroup" aria-label="Tamaño" className={grupoPastillasClase}>
                {tamaniosOrdenados.map((t) => {
                  const activo = t.tamanioId === valor
                  const nombreEtiqueta = etiquetaTamanio(t.tamanio)
                  const inicial = nombreEtiqueta.trim().charAt(0).toUpperCase()

                  return (
                    <button
                      key={t.tamanioId}
                      type="button"
                      role="radio"
                      aria-checked={activo}
                      aria-label={etiquetaTamanio(t.tamanio, t.etiqueta)}
                      onClick={() => onChange(t.tamanioId)}
                      className={`${botonPastillaBaseClase} ${activo ? botonActivoClase : botonInactivoClase}`}
                    >
                      {/* <= 324px: Inicial circular (R, M, G) */}
                      <span className={inicialMovilClase}>{inicial}</span>
                      {/* >= 325px: Nombre completo */}
                      <span className={textoCompletoClase}>{nombreEtiqueta}</span>
                    </button>
                  )
                })}
              </div>

              {/* Detalle del tamaño seleccionado y su recargo justo debajo */}
              <div className={infoRecargoClase}>
                <span>
                  <span className="hidden max-[324px]:inline">Es: </span>
                  <span className="hidden min-[325px]:inline">Seleccionado: </span>
                  {etiquetaTamanio(seleccionado.tamanio)}
                </span>
                <span className={diferenciaActiva > 0 ? 'font-bold text-brand-red' : 'text-brand-muted'}>
                  {diferenciaActiva > 0 ? `+${formatearPrecio(diferenciaActiva)}` : 'Sin recargo'}
                </span>
              </div>

            </>
          ) : (
            <div role="radiogroup" aria-label="Comparar tamaños" className={grillaComparativaClase}>
              {tamaniosOrdenados.map((t) => {
                const activo = t.tamanioId === valor
                const diferencia = Number(t.precio) - base

                return (
                  <button
                    key={t.tamanioId}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    onClick={() => onChange(t.tamanioId)}
                    className={`${tarjetaTamanioClase} ${activo ? tarjetaActivaClase : tarjetaInactivaClase}`}
                  >
                    <img
                      src={resolverImagenCombo(t.tamanio)}
                      alt={etiquetaTamanio(t.tamanio)}
                      className="h-24 w-auto object-contain sm:h-28"
                    />
                    <span className="mt-2 w-full truncate text-xs font-extrabold uppercase text-brand-dark">
                      {etiquetaTamanio(t.tamanio)}
                    </span>
                    <span className="text-[11px] font-semibold text-brand-muted">
                      {diferencia > 0 ? `+${formatearPrecio(diferencia)}` : 'Incluido'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </SeccionOpciones>
  )
}

export default SelectorTamanio
