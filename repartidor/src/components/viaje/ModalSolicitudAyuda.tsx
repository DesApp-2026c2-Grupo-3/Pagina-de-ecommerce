
import { useState } from 'react'
import {
  AlertTriangle,
  X,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react'

import type { SolicitudAsistencia } from '../../types/viaje.types'

interface ModalSolicitudAyudaProps {
  enviando: boolean
  error: string
  onCerrar: () => void
  onConfirmar: (datos: SolicitudAsistencia) => void
}

export default function ModalSolicitudAyuda({
  enviando,
  error,
  onCerrar,
  onConfirmar,
}: ModalSolicitudAyudaProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3
     backdrop-blur-sm sm:p-4">
      <div className="my-auto w-full max-w-md max-h-[calc(100dvh-1.5rem)] 
      overflow-y-auto rounded-3xl border border-orange-100 bg-white shadow-2xl">

        {/* Encabezado */}
        <div className="relative flex flex-col items-center bg-gradient-to-br from-red-100 via-orange-50 to-amber-100 px-6 py-7">
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-white/70 hover:text-slate-800 disabled:opacity-50"
          >
            <X size={18} />
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-white shadow-sm">
            <AlertTriangle size={30} className="text-red-600" />
          </div>

          <h3 className="mt-4 text-lg font-extrabold text-slate-800">
            Solicitar asistencia
          </h3>

          <p className="mt-1 text-center text-sm text-slate-600">
            Contanos qué ocurrió durante el viaje.
          </p>
        </div>

        {/* Contenido */}
        <div className="p-4">
          <div className="space-y-3">

            {/* Motivo */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Motivo de asistencia
              </label>

              <select
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value as SolicitudAsistencia['motivo'] | '')
                  setErrorValidacion('')
                }}
                disabled={enviando}
                className="w-full rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-3 text-sm text-slate-700 outline-none transition hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* Comentario */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <MessageSquare size={15} className="text-orange-500" />
                  Comentario (opcional)
                </label>
              </div>

              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={500}
                rows={2}
                disabled={enviando}
                placeholder="Explicá brevemente qué sucedió..."
                className="w-full resize-none rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {comentario.length}/500
              </p>
            </div>

            {/* Advertencia */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />

              <p className="text-xs leading-relaxed text-amber-800">
                Al confirmar, se notificará a administración para que pueda ayudarte. Se enviará también tu ubicación actual si está disponible.
              </p>
            </div>

            {/* Errores */}
            {(errorValidacion || error) && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
                {errorValidacion || error}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="flex-1 rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmar}
              disabled={enviando}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-red-500/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Solicitar ayuda'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
