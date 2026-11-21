// Bloque 4: "La semana en promos". Una columna por día (una lista por día en el celular),
// con sus promos y un lugar para agregar. Abajo, las promos pausadas para reusarlas.
import { useEffect, useRef } from 'react'
import { AlertTriangle, Pause } from 'lucide-react'
import type { PromocionAdmin } from '../../types/promocion.types'
import type { ProductoOpcion } from '../../utils/mecanicasPromo'
import { DIAS } from '../../config/promociones'
import EditorPromoDia from './EditorPromoDia'

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

export default function SemanaPromos({ promos, productos, maxPorDia, abierto, onAbrir, onCerrar, onGuardado }: Props) {
  const activas = promos.filter((p) => p.activo)
  const pausadas = promos.filter((p) => !p.activo)
  const delDia = (dia: number) => activas.filter((p) => p.dias.includes(dia))

  const enEdicion = abierto?.promoId != null ? promos.find((p) => p.id === abierto.promoId) ?? null : null

  // Al abrir el editor se lleva la vista hasta él (en el celular queda debajo de toda la semana)
  const refEditor = useRef<HTMLDivElement>(null)
  const claveAbierto = abierto ? `${abierto.promoId ?? 'nueva'}-${abierto.dia}` : ''
  useEffect(() => {
    if (claveAbierto) refEditor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [claveAbierto])

  function casilleros(dia: number) {
    const lista = delDia(dia)
    const completo = lista.length >= maxPorDia
    const nuevaAca = abierto?.promoId === null && abierto.dia === dia
    return (
      <>
        {lista.map((p) => {
          const elegida = abierto?.promoId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onAbrir({ dia, promoId: p.id })}
              className={`w-full rounded border p-2 text-left text-xs leading-snug transition-colors ${
                elegida ? 'border-2 border-orange-400 bg-orange-50' : p.completa ? 'bg-gray-50 hover:bg-gray-100' : 'border-amber-300 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              {!p.completa && <AlertTriangle size={12} className="mr-1 inline text-amber-700" aria-label="Producto eliminado" />}
              <span className="font-semibold">{p.destacado}</span> · {p.titulo}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => onAbrir({ dia, promoId: null })}
          title={completo ? 'Sacá una para sumar otra' : undefined}
          className={`w-full rounded border border-dashed p-2 text-center text-xs text-gray-600 transition-colors hover:bg-gray-50 ${
            nuevaAca ? 'border-2 border-solid border-orange-400 bg-orange-50' : 'border-gray-400'
          }`}
        >
          {completo ? <>Día completo<br />Reemplazar</> : '+ Agregar'}
        </button>
      </>
    )
  }

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">4 · Pestañas por día</p>
          <h2 className="text-lg font-bold">La semana en promos</h2>
        </div>
        <span className="text-sm text-gray-600">Hasta {maxPorDia} promos por día</span>
      </div>

      {/* Escritorio: una columna por día */}
      <div className="hidden grid-cols-7 gap-2 md:grid">
        {DIAS.map((d) => (
          <div key={d.valor} className="flex flex-col gap-1.5">
            <p className="text-center text-sm font-semibold">
              {d.corto} <span className="font-normal text-gray-500">{delDia(d.valor).length}/{maxPorDia}</span>
            </p>
            {casilleros(d.valor)}
          </div>
        ))}
      </div>

      {/* Celular: una lista por día */}
      <div className="md:hidden">
        {DIAS.map((d) => (
          <div key={d.valor} className="border-t py-3 first:border-t-0">
            <p className="mb-2 text-sm font-semibold">
              {d.nombre} <span className="font-normal text-gray-500">· {delDia(d.valor).length}/{maxPorDia}</span>
            </p>
            <div className="flex flex-col gap-1.5">
              {casilleros(d.valor)}
            </div>
          </div>
        ))}
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

      {pausadas.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-gray-700">
            <Pause size={14} /> Pausadas ({pausadas.length})
          </p>
          <p className="mb-2 text-xs text-gray-600">No se muestran en la tienda. Abrí una para cambiarla y volver a activarla.</p>
          <div className="flex flex-wrap gap-2">
            {pausadas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onAbrir({ dia: p.dias[0] ?? 1, promoId: p.id })}
                className={`rounded border px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 ${
                  abierto?.promoId === p.id ? 'border-2 border-orange-400 bg-orange-50' : 'bg-gray-50'
                }`}
              >
                {p.titulo}
                <span className="ml-1 text-gray-500">
                  · {DIAS.filter((d) => p.dias.includes(d.valor)).map((d) => d.corto).join(', ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
