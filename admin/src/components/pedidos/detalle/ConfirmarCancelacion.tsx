import { useState, type ChangeEvent, type RefObject } from 'react'
import { MOTIVO_CANCELACION_MAX, MOTIVOS_CANCELACION_FRECUENTES } from '../../../config/pedidos'
import { validarMotivoCancelacion } from '../../../utils/pedidos/motivoCancelacion'
import { boton, secundario } from './estilosPanel'

interface Props {
  pedidoId: number
  textoCancelacion: string
  guardando: boolean
  // Va al primer motivo frecuente: así en el celular no se abre el teclado al entrar
  refInicial: RefObject<HTMLButtonElement | null>
  onConfirmar: (motivo: string) => void
  onVolver: () => void
}

// Confirmación de «Cancelar pedido» en el mismo lugar, sin modal (plan de merge del PR #78, 4.1).
// El backend exige un motivo de 3 a 200 caracteres: le llega al cliente en la notificación.
export default function ConfirmarCancelacion({
  pedidoId,
  textoCancelacion,
  guardando,
  refInicial,
  onConfirmar,
  onVolver,
}: Props) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const idCampo = `motivo-cancelacion-${pedidoId}`

  function confirmar() {
    const resultado = validarMotivoCancelacion(motivo)
    if (resultado.error) {
      setError(resultado.error)
      document.getElementById(idCampo)?.focus()
      return
    }
    onConfirmar(resultado.motivo)
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby="confirmar-cancelacion-titulo"
      aria-describedby="confirmar-cancelacion-texto"
      className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4"
    >
      <p id="confirmar-cancelacion-titulo" className="font-extrabold text-red-800">
        ¿Cancelar el pedido #{pedidoId}?
      </p>
      <p id="confirmar-cancelacion-texto" className="text-sm text-red-900">
        {textoCancelacion} No se puede deshacer.
      </p>

      <fieldset className="flex flex-col gap-2" disabled={guardando}>
        <legend className="mb-1 text-sm font-bold text-gray-900">Motivo frecuente</legend>
        {MOTIVOS_CANCELACION_FRECUENTES.map((texto, i) => {
          const elegido = motivo === texto
          return (
            <button
              key={texto}
              ref={i === 0 ? refInicial : undefined}
              type="button"
              aria-pressed={elegido}
              onClick={() => {
                setMotivo(texto)
                setError('')
              }}
              className={`min-h-11 rounded-lg border bg-white px-3 py-2 text-left text-sm leading-snug transition-colors ${
                elegido
                  ? 'border-red-400 font-semibold text-red-900 ring-2 ring-red-300'
                  : 'border-gray-300 text-gray-800 hover:bg-gray-50'
              }`}
            >
              {texto}
            </button>
          )
        })}
      </fieldset>

      <div>
        <label htmlFor={idCampo} className="text-sm font-bold text-gray-900">
          Motivo (lo ve el cliente)
        </label>
        <textarea
          id={idCampo}
          value={motivo}
          maxLength={MOTIVO_CANCELACION_MAX}
          rows={3}
          disabled={guardando}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            setMotivo(e.target.value)
            setError('')
          }}
          placeholder="Escribí el motivo o elegí uno de arriba"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${idCampo}-error` : undefined}
          className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm ${error ? 'border-red-600 focus:outline-2 focus:outline-red-600' : 'border-gray-300'}`}
        />
        <div className="flex items-start justify-between gap-3 text-xs">
          <p id={`${idCampo}-error`} className="font-semibold text-red-700">
            {error}
          </p>
          <p className="shrink-0 text-gray-600">
            {motivo.length}/{MOTIVO_CANCELACION_MAX}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={confirmar}
        disabled={guardando}
        className={`${boton} bg-red-700 text-white hover:bg-red-800`}
      >
        {guardando ? 'Cancelando...' : 'Sí, cancelar pedido'}
      </button>
      <button type="button" onClick={onVolver} disabled={guardando} className={secundario}>
        Volver
      </button>
    </div>
  )
}
