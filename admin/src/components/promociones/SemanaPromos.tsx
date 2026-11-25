// Bloque 4: "La semana en promos". Se elige un día con los botones y se ven sus promos en grande:
// cada una se puede editar o quitar de ese día. En los lugares libres se crea una nueva o se elige una ya creada.
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Pencil, Plus, X } from 'lucide-react'
import type { PromocionAdmin } from '../../types/promocion.types'
import type { ProductoOpcion } from '../../utils/mecanicasPromo'
import { DIAS } from '../../config/promociones'
import { actualizarPromocion, deshabilitarPromocion } from '../../services/promocionService'
import { pedidoDesdePromo } from '../../utils/promoAPedido'
import EditorPromoDia from './EditorPromoDia'
import { ErrorGeneral, MARCA, botonPrimario, botonSecundario, campo } from './comun'

/** Qué está abierto en este bloque: una promo nueva para un día, o una existente */
export type AbiertoSemana = { dia: number; promoId: number | null; productoId?: number } | null

interface Props {
  promos: PromocionAdmin[]
  productos: ProductoOpcion[]
  maxPorDia: number
  abierto: AbiertoSemana
  onAbrir: (abierto: { dia: number; promoId: number | null }) => void
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

const nombreDia = (dia: number) => DIAS.find((d) => d.valor === dia)?.nombre.toLowerCase() ?? ''

export default function SemanaPromos({ promos, productos, maxPorDia, abierto, onAbrir, onCerrar, onGuardado }: Props) {
  const [dia, setDia] = useState(() => abierto?.dia ?? new Date().getDay())
  const [eligiendo, setEligiendo] = useState(false)
  const [elegidaId, setElegidaId] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')

  const activas = promos.filter((p) => p.activo)
  const delDia = (d: number) => activas.filter((p) => p.dias.includes(d))
  const lista = delDia(dia)
  const libres = Math.max(0, maxPorDia - lista.length)
  // Las que se pueden sumar a este día: las de otros días y las deshabilitadas
  const candidatas = promos.filter((p) => !(p.activo && p.dias.includes(dia)))
  const enEdicion = abierto?.promoId != null ? promos.find((p) => p.id === abierto.promoId) ?? null : null

  // Si se abre una promo desde la lista, se muestra su día
  useEffect(() => {
    if (abierto) setDia(abierto.dia)
  }, [abierto])

  // Al abrir el editor se lleva la vista hasta él
  const refEditor = useRef<HTMLDivElement>(null)
  const claveAbierto = abierto ? `${abierto.promoId ?? 'nueva'}-${abierto.dia}` : ''
  useEffect(() => {
    if (claveAbierto) refEditor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [claveAbierto])

  function elegirDia(d: number) {
    setDia(d)
    setEligiendo(false)
    setError('')
    onCerrar()
  }

  // Quitar no borra: la promo deja de estar este día (si se queda sin días, se deshabilita)
  async function quitar(p: PromocionAdmin) {
    setTrabajando(true)
    setError('')
    try {
      const quedan = p.dias.filter((d) => d !== dia)
      if (quedan.length === 0) {
        await deshabilitarPromocion(p.id)
        onGuardado(`"${p.titulo}" se quitó del ${nombreDia(dia)}. Quedó deshabilitada: la ves en la lista de abajo.`)
      } else {
        await actualizarPromocion(p.id, pedidoDesdePromo(p, { dias: quedan }))
        onGuardado(`"${p.titulo}" se quitó del ${nombreDia(dia)}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar la promo.')
    } finally {
      setTrabajando(false)
    }
  }

  // Sumar una promo ya creada a este día. Si estaba deshabilitada, se habilita solo para este día.
  async function sumarExistente() {
    const p = promos.find((x) => String(x.id) === elegidaId)
    if (!p) return setError('Elegí una promo de la lista')
    setTrabajando(true)
    setError('')
    try {
      const cambios = p.activo ? { dias: [...p.dias, dia].sort((a, b) => a - b) } : { dias: [dia], activo: true }
      await actualizarPromocion(p.id, pedidoDesdePromo(p, cambios))
      setEligiendo(false)
      setElegidaId('')
      onGuardado(`"${p.titulo}" se agregó al ${nombreDia(dia)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar la promo.')
    } finally {
      setTrabajando(false)
    }
  }

  const otrosDias = (p: PromocionAdmin) =>
    DIAS.filter((d) => d.valor !== dia && p.dias.includes(d.valor)).map((d) => d.corto).join(', ')

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">4 · Pestañas por día</p>
          <h2 className="text-lg font-bold">La semana en promos</h2>
        </div>
        <span className="text-sm text-gray-600">Hasta {maxPorDia} promos por día</span>
      </div>

      {/* Botones de los días */}
      <div role="tablist" aria-label="Días de la semana" className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DIAS.map((d) => {
          const elegido = d.valor === dia
          return (
            <button
              key={d.valor}
              type="button"
              role="tab"
              aria-selected={elegido}
              onClick={() => elegirDia(d.valor)}
              className={`flex flex-col items-center rounded-lg border px-1 py-2 transition-colors ${
                elegido ? 'border-orange-400 bg-orange-500 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-bold">{d.corto}</span>
              <span className={`text-xs ${elegido ? 'text-white/85' : 'text-gray-500'}`}>
                {delDia(d.valor).length}/{maxPorDia}
              </span>
            </button>
          )
        })}
      </div>

      {/* Las promos del día elegido */}
      <div className="mt-4 flex flex-col gap-3">
        {lista.map((p) => (
          <div
            key={p.id}
            className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center ${
              abierto?.promoId === p.id ? 'border-2 border-orange-400 bg-orange-50' : 'bg-gray-50'
            }`}
          >
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-center text-sm font-extrabold leading-tight"
              style={{ background: MARCA.mostaza, color: MARCA.oscuro }}
            >
              {p.destacado}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{p.titulo}</p>
              <p className="text-sm text-gray-600">{p.detalle}</p>
              {otrosDias(p) && <p className="mt-1 text-xs text-gray-500">También: {otrosDias(p)}</p>}
              {!p.completa && (
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-amber-800">
                  <AlertTriangle size={14} /> Un producto fue eliminado: no se muestra hasta que lo cambies.
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => onAbrir({ dia, promoId: p.id })} className={`${botonSecundario} inline-flex items-center gap-1`}>
                <Pencil size={16} /> Editar
              </button>
              <button
                type="button"
                onClick={() => quitar(p)}
                disabled={trabajando}
                className={`${botonSecundario} inline-flex items-center gap-1 text-danger`}
              >
                <X size={16} /> Quitar del día
              </button>
            </div>
          </div>
        ))}

        {lista.length === 0 && <p className="text-sm text-gray-600">El {nombreDia(dia)} no tiene promos.</p>}

        {/* Lugar libre: crear una nueva o elegir una ya creada */}
        {libres > 0 ? (
          <div className="rounded-lg border border-dashed border-gray-400 p-4">
            <p className="mb-3 text-sm text-gray-600">
              {libres === 1 ? 'Queda 1 lugar libre' : `Quedan ${libres} lugares libres`} el {nombreDia(dia)}.
            </p>
            {eligiendo ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  aria-label="Promo ya creada"
                  value={elegidaId}
                  onChange={(e) => { setElegidaId(e.target.value); setError('') }}
                  className={`${campo} min-w-0 flex-1`}
                >
                  <option value="">Elegí una promo ya creada</option>
                  {candidatas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                      {p.activo ? ` · ${DIAS.filter((d) => p.dias.includes(d.valor)).map((d) => d.corto).join(', ')}` : ' · deshabilitada'}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={sumarExistente} disabled={trabajando} className={botonPrimario}>Agregar</button>
                <button type="button" onClick={() => { setEligiendo(false); setError('') }} className={botonSecundario}>Cancelar</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => onAbrir({ dia, promoId: null })} className={`${botonPrimario} inline-flex items-center justify-center gap-1`}>
                  <Plus size={16} /> Crear promo nueva
                </button>
                <button
                  type="button"
                  onClick={() => { setEligiendo(true); onCerrar() }}
                  disabled={candidatas.length === 0}
                  className={botonSecundario}
                >
                  Elegir una ya creada
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            El {nombreDia(dia)} ya tiene {maxPorDia} promos. Quitá una para sumar otra.
          </p>
        )}

        <ErrorGeneral mensaje={error} />
      </div>

      {abierto && (
        <div ref={refEditor} className="mt-4 scroll-mt-4 border-t pt-4">
          <EditorPromoDia
            // key: al cambiar de promo o de día el editor arranca de cero
            key={claveAbierto}
            promo={enEdicion}
            diaInicial={abierto.dia}
            productoInicial={abierto.productoId ?? null}
            activas={activas}
            productos={productos}
            maxPorDia={maxPorDia}
            onCerrar={onCerrar}
            onGuardado={onGuardado}
          />
        </div>
      )}
    </section>
  )
}