import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MOTIVOS_BAJA } from '../../../services/stockService'
import type { ItemStock } from '../../../types/stock.types'
import { textoAyudaBaja, type FormBaja } from '../../../utils/stock/baja'

interface Props {
  stock: ItemStock[]
  form: FormBaja
  onCambiar: (campo: keyof FormBaja, valor: string) => void
  error: string
  enviando: boolean
  onEnviar: () => void
  cancelarA: string
}

const campo = 'h-11 w-full rounded-lg border border-gray-300 bg-white px-3'

// Mismos campos y validaciones que el modal anterior. Los motivos van a la vista (radios),
// no en un desplegable: son 6 y conviene verlos juntos.
export default function FormularioBaja({ stock, form, onCambiar, error, enviando, onEnviar, cancelarA }: Props) {
  const elegido = stock.find((s) => String(s.id) === form.stockId)
  const ayuda = textoAyudaBaja(elegido, form.cantidad)

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onEnviar()
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 @3xl:p-6">
      <div>
        <label htmlFor="baja-insumo" className="mb-1 block font-semibold">Insumo</label>
        <select id="baja-insumo" value={form.stockId} onChange={(e: ChangeEvent<HTMLSelectElement>) => onCambiar('stockId', e.target.value)} className={campo}>
          <option value="">Elegir insumo</option>
          {stock.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} (hay {s.cantidad.toLocaleString('es-AR')})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="baja-cantidad" className="mb-1 block font-semibold">Cantidad a bajar</label>
        <input
          id="baja-cantidad"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={form.cantidad}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onCambiar('cantidad', e.target.value)}
          className={campo}
          placeholder="Ej: 5"
          aria-describedby="baja-ayuda"
        />
        <p id="baja-ayuda" aria-live="polite" className="mt-1 min-h-5 text-sm text-gray-600">
          {ayuda}
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 font-semibold">Motivo</legend>
        <div className="grid gap-2 @xl:grid-cols-2">
          {MOTIVOS_BAJA.map((m) => (
            <label
              key={m.valor}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-gray-300 px-3 has-[:checked]:border-action has-[:checked]:bg-orange-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-action"
            >
              <input
                type="radio"
                name="baja-motivo"
                value={m.valor}
                checked={form.motivo === m.valor}
                onChange={() => onCambiar('motivo', m.valor)}
                className="accent-[var(--color-action)]"
              />
              {m.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="baja-detalle" className="mb-1 block font-semibold">
          Detalle {form.motivo === 'otro' ? null : <span className="font-normal text-gray-600">(opcional)</span>}
        </label>
        <textarea
          id="baja-detalle"
          maxLength={200}
          rows={2}
          value={form.detalle}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onCambiar('detalle', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Ej: se cortó la luz y se descongeló el freezer"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 @xl:flex-row @xl:justify-end">
        <Link
          to={cancelarA}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-danger px-4 font-bold text-white hover:bg-danger-hover disabled:opacity-60"
        >
          {enviando ? 'Registrando...' : 'Registrar baja'}
        </button>
      </div>
    </form>
  )
}
