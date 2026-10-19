import { useState, type FormEvent } from 'react'
import AddressPicker from './AddressPicker'
import EditorHorario from './EditorHorario'
import type { DatosSucursal, DiaSemana, HorarioDia } from '../types/sucursal'
import { aplicarDiaATodos, formatearHorario, opcionesZonaHoraria } from '../utils/horario'
import { validarPaso } from '../utils/sucursalForm'

const PASOS = ['Datos', 'Horario', 'Ubicación', 'Entrega']

const campo = 'w-full rounded border p-2'

interface Props {
  inicial: DatosSucursal
  textoBoton: string
  onGuardar: (datos: DatosSucursal) => Promise<void>
  onCancelar: () => void
}

export default function FormularioSucursal({ inicial, textoBoton, onGuardar, onCancelar }: Props) {
  const [datos, setDatos] = useState<DatosSucursal>(inicial)
  const [paso, setPaso] = useState(1)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  function cambiar<K extends keyof DatosSucursal>(clave: K, valor: DatosSucursal[K]) {
    setDatos((prev) => ({ ...prev, [clave]: valor }))
    setError('')
  }

  // Cambia un solo día del horario, sin tocar los demás (y sin compartir referencias)
  function cambiarDia(dia: DiaSemana, valor: HorarioDia) {
    setDatos((prev) => ({ ...prev, horario: { ...prev.horario, [dia]: valor } }))
    setError('')
  }

  // Para llegar a un paso, los anteriores tienen que estar completos
  function irAPaso(destino: number) {
    for (let n = 1; n < destino; n++) {
      const e = validarPaso(n, datos)
      if (e) {
        setError(e)
        setPaso(n)
        return
      }
    }
    setError('')
    setPaso(destino)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (paso < PASOS.length) {
      irAPaso(paso + 1)
      return
    }
    for (let n = 1; n <= PASOS.length; n++) {
      const err = validarPaso(n, datos)
      if (err) {
        setError(err)
        setPaso(n)
        return
      }
    }
    setGuardando(true)
    try {
      await onGuardar(datos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la sucursal.')
    } finally {
      setGuardando(false)
    }
  }

  const u = datos.ubicacion

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-2xl flex-col gap-5">
      {/* Indicador de pasos */}
      <ol className="flex gap-2">
        {PASOS.map((titulo, i) => {
          const n = i + 1
          return (
            <li key={titulo} className="flex-1">
              <button
                type="button"
                onClick={() => irAPaso(n)}
                aria-current={paso === n ? 'step' : undefined}
                className={`w-full rounded border-b-4 px-1 py-2 text-left text-xs font-semibold transition-colors sm:px-2 sm:text-sm ${
                  paso === n
                    ? 'border-orange-500 text-orange-600'
                    : n < paso
                      ? 'border-green-500 text-gray-700'
                      : 'border-gray-200 text-gray-400'
                }`}
              >
                {n}. {titulo}
              </button>
            </li>
          )
        })}
      </ol>

      <section className="rounded-lg border bg-white p-5">
        {paso === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-medium">Nombre</label>
              <input
                type="text"
                maxLength={50}
                autoFocus
                value={datos.nombre}
                onChange={(e) => cambiar('nombre', e.target.value)}
                className={campo}
                placeholder="Ej: BurgerFast Morón"
              />
            </div>
            <div>
              <label className="font-medium">
                Teléfono <span className="font-normal text-gray-500">(opcional)</span>
              </label>
              <input
                type="tel"
                maxLength={20}
                value={datos.telefono}
                onChange={(e) => cambiar('telefono', e.target.value)}
                className={`${campo} sm:max-w-xs`}
                placeholder="Ej: 11 4567-8900"
              />
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="flex flex-col gap-4">
            <EditorHorario horario={datos.horario} onCambiarDia={cambiarDia} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <button
                type="button"
                onClick={() => cambiar('horario', aplicarDiaATodos(datos.horario, 'lunes'))}
                className="self-start text-sm font-semibold text-orange-600 hover:underline"
              >
                Aplicar lunes a todos los días
              </button>

              <div className="w-full sm:max-w-xs">
                <label htmlFor="zona-horaria" className="font-medium">
                  Zona horaria
                </label>
                <select
                  id="zona-horaria"
                  value={datos.zonaHoraria}
                  onChange={(e) => cambiar('zonaHoraria', e.target.value)}
                  className={campo}
                >
                  {opcionesZonaHoraria(datos.zonaHoraria).map((zona) => (
                    <option key={zona} value={zona}>
                      {zona}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Los horarios se interpretan en esta zona (los pedidos fuera del horario se rechazan).
                </p>
              </div>
            </div>
          </div>
        )}

        {paso === 3 && <AddressPicker value={u} onChange={(nueva) => cambiar('ubicacion', nueva)} />}

        {paso === 4 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 rounded bg-gray-50 px-3 py-2">
              <div className="min-w-0">
                <p className="font-semibold">{datos.nombre}</p>
                <p className="text-sm text-gray-600">
                  📍 {u.calle} {u.numero}, {u.localidad}
                </p>
                <p className="text-sm text-gray-600">Horario: {formatearHorario(datos.horario)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => irAPaso(3)}
                  className="text-sm font-semibold text-orange-600 hover:underline"
                >
                  Cambiar dirección
                </button>
                <button
                  type="button"
                  onClick={() => irAPaso(2)}
                  className="text-sm font-semibold text-orange-600 hover:underline"
                >
                  Cambiar horario
                </button>
              </div>
            </div>

            <div>
              <label className="font-medium">Radio de entrega (km)</label>
              <input
                type="number"
                min="0.5"
                max="30"
                step="0.5"
                value={datos.radioEntregaKm}
                onChange={(e) => cambiar('radioEntregaKm', e.target.value)}
                className={`${campo} sm:w-40`}
              />
              <p className="mt-1 text-sm text-gray-500">
                Los clientes a más de esta distancia (en línea recta) no pueden pedirle a esta sucursal.
              </p>
            </div>
          </div>
        )}
      </section>

      {error && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={paso > 1 ? () => irAPaso(paso - 1) : onCancelar}
          className="rounded border px-4 py-2 font-semibold hover:bg-gray-50"
        >
          {paso > 1 ? 'Atrás' : 'Cancelar'}
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="rounded border border-orange-300 bg-action px-4 py-2 font-semibold text-white hover:bg-action-hover disabled:opacity-50"
        >
          {paso < PASOS.length ? 'Siguiente' : guardando ? 'Guardando...' : textoBoton}
        </button>
      </div>
    </form>
  )
}
