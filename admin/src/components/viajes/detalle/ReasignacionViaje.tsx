import { useEffect, useRef, useState } from 'react'
import { useReasignacionViaje } from '../../../hooks/viajes/useReasignacionViaje'
import type { RespuestaReasignacion } from '../../../types/viaje.types'
import { textoConsecuenciaReasignacion } from '../../../utils/viajes/reasignacion'

interface Props {
  viajeId: number
  repartidorActual: string
  onHecho: (respuesta: RespuestaReasignacion) => void
  onDesactualizado: () => void
}

// Elegir otro repartidor y confirmar en el lugar (sin modal). Disponibles = misma sucursal,
// activos y sin viaje en curso (RN-32); la lista la arma el backend.
export default function ReasignacionViaje({ viajeId, repartidorActual, onHecho, onDesactualizado }: Props) {
  const r = useReasignacionViaje(viajeId, onHecho, onDesactualizado)
  const [elegido, setElegido] = useState<number | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  // Al abrir la confirmación, el foco va a «Sí, reasignar» (el botón que la abrió desaparece)
  const refConfirmar = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (confirmando) refConfirmar.current?.focus()
  }, [confirmando])
  const nuevo = r.disponibles.find((d) => d.id === elegido)
  const nombreNuevo = nuevo ? `${nuevo.nombre} ${nuevo.apellido}` : ''

  // Si el elegido dejó de estar disponible (recarga tras un 409), se vuelve a elegir
  if (elegido !== null && !r.cargando && !nuevo) {
    setElegido(null)
    setConfirmando(false)
  }

  async function confirmar() {
    if (elegido === null) return
    const ok = await r.reasignar(elegido)
    if (!ok) setConfirmando(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-bold text-gray-900">Reasignar a otro repartidor</h3>

      {r.cargando ? (
        <p className="text-sm text-gray-600">Buscando repartidores disponibles...</p>
      ) : r.errorDisponibles ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-700">
          {r.errorDisponibles}
          <button type="button" onClick={r.recargarDisponibles} className="min-h-11 font-semibold underline">
            Reintentar
          </button>
        </div>
      ) : r.disponibles.length === 0 ? (
        <p className="text-sm text-gray-700">
          No hay repartidores disponibles en esta sucursal (activos y sin un viaje en curso).{' '}
          <button type="button" onClick={r.recargarDisponibles} className="min-h-11 font-semibold text-action underline">
            Volver a buscar
          </button>
        </p>
      ) : (
        <fieldset disabled={r.procesando || confirmando}>
          <legend className="sr-only">Repartidores disponibles</legend>
          <div className="grid gap-2 @xl:grid-cols-2">
            {r.disponibles.map((d) => (
              <label
                key={d.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 has-[:checked]:border-action has-[:checked]:bg-orange-50"
              >
                <input
                  type="radio"
                  name={`reasignar-${viajeId}`}
                  checked={elegido === d.id}
                  onChange={() => setElegido(d.id)}
                  className="accent-[var(--color-action)]"
                />
                <span className="font-semibold text-gray-800">
                  {d.nombre} {d.apellido}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {r.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {r.error}
        </p>
      )}

      {confirmando && nuevo ? (
        <div role="alertdialog" aria-labelledby={`confirmar-${viajeId}`} aria-describedby={`consecuencia-${viajeId}`} className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p id={`confirmar-${viajeId}`} className="font-bold text-gray-900">
            ¿Reasignar el viaje a {nombreNuevo}?
          </p>
          <p id={`consecuencia-${viajeId}`} className="mt-1 text-sm text-gray-700">
            {textoConsecuenciaReasignacion(repartidorActual, nombreNuevo)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              ref={refConfirmar}
              type="button"
              onClick={() => void confirmar()}
              disabled={r.procesando}
              className="min-h-11 rounded-lg bg-action px-4 font-bold text-white hover:bg-action-hover disabled:opacity-60"
            >
              {r.procesando ? 'Reasignando...' : 'Sí, reasignar'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={r.procesando}
              className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Volver
            </button>
          </div>
        </div>
      ) : (
        r.disponibles.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            disabled={elegido === null}
            className="min-h-11 self-start rounded-lg bg-action px-4 font-bold text-white hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reasignar repartidor
          </button>
        )
      )}
    </div>
  )
}
