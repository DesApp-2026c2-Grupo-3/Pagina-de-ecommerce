import { useCallback, useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { obtenerCierresActivos, reabrirSucursal } from '../services/cierreService'
import type { CierreActivo } from '../types/cierre.types'
import { fechaCorta, haceCuanto } from '../utils/tiempo'

// Para el master: qué sucursales están cerradas temporalmente. Las reabre el encargado de cada una,
// y el master también puede reabrir cualquiera desde acá.
export default function CierresActivos() {
  const { mostrarToast } = useToast()
  const [cierres, setCierres] = useState<CierreActivo[]>([])
  const [aReabrir, setAReabrir] = useState<CierreActivo | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerCierresActivos()
      setCierres(Array.isArray(lista) ? lista : [])
    } catch {
      setCierres([])
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function reabrir() {
    if (!aReabrir?.sucursal) return
    setEnviando(true)
    try {
      await reabrirSucursal(aReabrir.sucursal.id)
      mostrarToast(`${aReabrir.sucursal.nombre} reabierta`)
      setAReabrir(null)
      await cargar()
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : 'No se pudo reabrir la sucursal')
    } finally {
      setEnviando(false)
    }
  }

  if (cierres.length === 0) return null

  return (
    <section className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
      <h2 className="mb-2 font-semibold text-red-800">Sucursales cerradas temporalmente</h2>
      <ul className="flex flex-col gap-2 text-sm text-red-900">
        {cierres.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-words">
              <span className="font-medium">{c.sucursal?.nombre ?? 'Sucursal'}</span>: «{c.motivo}» · {c.por?.nombre ?? 'Sin dato'} ·{' '}
              <span title={fechaCorta(c.desde)}>{haceCuanto(c.desde)}</span>
            </span>
            {c.sucursal && (
              <button
                type="button"
                onClick={() => setAReabrir(c)}
                className="inline-flex shrink-0 items-center gap-1 rounded border border-green-300 bg-green-50 px-3 py-1 font-medium text-green-700 hover:bg-green-100"
              >
                <RotateCcw size={14} />
                Reabrir
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-red-700">La reabre el encargado de cada sucursal, o vos desde acá.</p>

      {aReabrir?.sucursal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Reabrir ${aReabrir.sucursal.nombre}`}
        >
          <div className="w-full max-w-md rounded-lg border-2 bg-white p-6 text-gray-900 shadow-xl">
            <h2 className="mb-3 text-xl font-bold">Reabrir {aReabrir.sucursal.nombre}</h2>
            <p className="text-gray-600">
              Vuelve a recibir pedidos según su horario. Se avisa al equipo de la sucursal y queda registrado que la reabriste vos.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setAReabrir(null)} disabled={enviando} className="rounded border px-4 py-2">
                Cancelar
              </button>
              <button
                type="button"
                onClick={reabrir}
                disabled={enviando}
                className="rounded border border-black bg-action px-4 py-2 text-white hover:bg-action-hover disabled:opacity-50"
              >
                {enviando ? 'Guardando...' : 'Reabrir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
