import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { SolicitudAsistencia } from '../../types/viaje.types'

interface ModalSolicitudAyudaProps {
  enviando: boolean
  error: string
  onCerrar: () => void
  onConfirmar: (datos: SolicitudAsistencia) => void
}

export default function ModalSolicitudAyuda({enviando, error, onCerrar, onConfirmar }: ModalSolicitudAyudaProps) {
  const [motivo, setMotivo] = useState<SolicitudAsistencia['motivo'] | ''>('')
  const [comentario, setComentario] = useState('')
  const [errorValidacion, setErrorValidacion] = useState('')

  const confirmar = () => {
    if (!motivo) {
      setErrorValidacion('Seleccioná un motivo para continuar.')
      return
    }

    setErrorValidacion('')

    onConfirmar({
      motivo,
      comentario: comentario.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-100 p-3">
            <AlertTriangle className="text-red-600" size={24} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Solicitar asistencia
            </h3>
            <p className="text-sm text-slate-500">
              Contanos qué ocurrió durante el viaje.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Motivo
            </label>

            <select
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value as SolicitudAsistencia['motivo'] | '')
                setErrorValidacion('')
              }}
              disabled={enviando}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-orange-500"
            >
              <option value="">Seleccioná un motivo</option>
              <option value="Problema con el vehículo">
                Problema con el vehículo
              </option>
              <option value="Accidente">Accidente</option>
              <option value="Problema personal">Problema personal</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Comentario (opcional)
            </label>

            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={enviando}
              placeholder="Explicá brevemente qué sucedió..."
              className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-orange-500"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {comentario.length}/500
            </p>
          </div>

          {(errorValidacion || error) && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {errorValidacion || error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCerrar}
            disabled={enviando}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            onClick={confirmar}
            disabled={enviando}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Confirmar solicitud'}
          </button>
        </div>
      </div>
    </div>
  )
}
