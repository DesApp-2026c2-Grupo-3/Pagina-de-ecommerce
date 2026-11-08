import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Lock, RotateCcw } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { cerrarSucursal, obtenerEstadoCierre, reabrirSucursal } from '../services/cierreService'
import type { EstadoCierre } from '../types/cierre.types'
import { fechaCorta, haceCuanto } from '../utils/tiempo'

function Dialogo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="w-full max-w-md rounded-lg border-2 bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-bold">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

// Cierre temporal de la sucursal por una contingencia (falta de agua o luz, etc.). Lo hace el encargado.
// La app abre y cierra sola según el horario; esto la frena ahora, hasta que el encargado la reabra.
export default function TarjetaCierre({ sucursalId }: { sucursalId: number }) {
  const { mostrarToast } = useToast()
  const [estado, setEstado] = useState<EstadoCierre | null>(null)
  const [error, setError] = useState('')
  const [dialogo, setDialogo] = useState<'cerrar' | 'reabrir' | null>(null)
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      setEstado(await obtenerEstadoCierre(sucursalId))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el estado de la sucursal.')
    }
  }, [sucursalId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const abrirDialogo = (tipo: 'cerrar' | 'reabrir') => {
    setMotivo('')
    setErrorMotivo('')
    setDialogo(tipo)
  }

  const confirmar = async () => {
    if (dialogo === 'cerrar' && motivo.trim().length < 5) {
      setErrorMotivo('Contá brevemente el motivo (al menos 5 caracteres).')
      return
    }
    setEnviando(true)
    try {
      if (dialogo === 'cerrar') {
        await cerrarSucursal(sucursalId, motivo.trim())
        mostrarToast('Sucursal cerrada temporalmente')
      } else {
        await reabrirSucursal(sucursalId)
        mostrarToast('Sucursal reabierta')
      }
      setDialogo(null)
      await cargar()
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : 'No se pudo completar la acción')
    } finally {
      setEnviando(false)
    }
  }

  const cerrada = Boolean(estado?.cerrada)
  const actual = estado?.cierreActual ?? null
  const anteriores = (estado?.historial ?? []).filter((c) => c.reabiertaEn)

  return (
    <section className={`mb-6 max-w-3xl rounded-lg border p-4 shadow-sm md:p-6 ${cerrada ? 'border-red-300 bg-red-50' : 'bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">Estado de la sucursal</h2>
          <p className={`mt-1 font-medium ${cerrada ? 'text-red-700' : 'text-green-700'}`}>
            {estado === null ? 'Cargando...' : cerrada ? 'Cerrada temporalmente' : 'Abierta según su horario'}
          </p>
        </div>
        {estado !== null && (
          <button
            type="button"
            onClick={() => abrirDialogo(cerrada ? 'reabrir' : 'cerrar')}
            className={`inline-flex items-center gap-2 rounded border px-4 py-2 font-medium ${
              cerrada ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            {cerrada ? <RotateCcw size={16} /> : <Lock size={16} />}
            {cerrada ? 'Reabrir sucursal' : 'Cerrar temporalmente'}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {cerrada && actual && (
        <p className="mt-3 break-words text-sm text-red-800">
          «{actual.motivo}» · {actual.por?.nombre ?? 'Sin dato'} · <span title={fechaCorta(actual.desde)}>{haceCuanto(actual.desde)}</span>
        </p>
      )}

      <p className="mt-3 text-sm text-gray-600">
        La sucursal abre y cierra sola según su horario. Si cerrás temporalmente (falta de agua o luz, por ejemplo), no recibe pedidos
        hasta que la reabras. Los pedidos que ya tomaste siguen su curso. Se avisa al administrador general y a tu equipo.
      </p>

      {anteriores.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">Cierres anteriores ({anteriores.length})</summary>
          <ul className="mt-2 flex flex-col gap-2 text-sm text-gray-700">
            {anteriores.map((c) => (
              <li key={c.id} className="rounded border bg-white p-2">
                <span className="block break-words">«{c.motivo}»</span>
                <span className="block text-gray-500">
                  {fechaCorta(c.desde)} → {c.reabiertaEn ? fechaCorta(c.reabiertaEn) : ''}
                  {c.por ? ` · cerró ${c.por.nombre}` : ''}
                  {c.reabiertaPor ? ` · reabrió ${c.reabiertaPor.nombre}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {dialogo === 'cerrar' && (
        <Dialogo titulo="Cerrar la sucursal temporalmente">
          <p className="mb-3 text-gray-600">Deja de recibir pedidos hasta que la reabras. Contá el motivo: queda registrado con quién y cuándo.</p>
          <label className="mb-1 block font-medium" htmlFor="motivo-cierre">Motivo</label>
          <textarea
            id="motivo-cierre"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value)
              setErrorMotivo('')
            }}
            maxLength={200}
            rows={3}
            placeholder="Ej: corte de luz en la zona"
            className="w-full rounded border p-2"
          />
          <p className="text-right text-xs text-gray-500">{motivo.length}/200</p>
          {errorMotivo && <p className="mt-1 text-sm text-red-600">{errorMotivo}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setDialogo(null)} disabled={enviando} className="rounded border px-4 py-2">Cancelar</button>
            <button type="button" onClick={confirmar} disabled={enviando} className="rounded border border-black bg-danger px-4 py-2 text-white hover:bg-danger-hover disabled:opacity-50">
              {enviando ? 'Guardando...' : 'Cerrar sucursal'}
            </button>
          </div>
        </Dialogo>
      )}

      {dialogo === 'reabrir' && (
        <Dialogo titulo="Reabrir la sucursal">
          <p className="text-gray-600">Vuelve a recibir pedidos según su horario. Queda registrado quién y cuándo.</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setDialogo(null)} disabled={enviando} className="rounded border px-4 py-2">Cancelar</button>
            <button type="button" onClick={confirmar} disabled={enviando} className="rounded border border-black bg-action px-4 py-2 text-white hover:bg-action-hover disabled:opacity-50">
              {enviando ? 'Guardando...' : 'Reabrir'}
            </button>
          </div>
        </Dialogo>
      )}
    </section>
  )
}
