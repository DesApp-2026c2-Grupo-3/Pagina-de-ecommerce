import { useState, type FormEvent } from 'react'
import AddressPicker, { type UbicacionValue } from './AddressPicker'

export interface DatosSucursal {
  nombre: string
  telefono: string
  horario: string
  ubicacion: UbicacionValue
  radioEntregaKm: string
}

export const sucursalVacia: DatosSucursal = {
  nombre: '',
  telefono: '',
  horario: '',
  ubicacion: { calle: '', numero: '', localidad: '', provincia: '', codigoPostal: '', latitud: null, longitud: null },
  radioEntregaKm: '5',
}

// De la sucursal que devuelve el backend al formulario
export function desdeSucursal(s: any): DatosSucursal {
  return {
    nombre: s.nombre ?? '',
    telefono: s.telefono ?? '',
    horario: s.horario ?? '',
    ubicacion: {
      calle: s.calle ?? '',
      numero: s.numero ?? '',
      localidad: s.localidad ?? '',
      provincia: s.provincia ?? '',
      codigoPostal: s.codigoPostal ?? '',
      latitud: s.latitud != null ? Number(s.latitud) : null,
      longitud: s.longitud != null ? Number(s.longitud) : null,
    },
    radioEntregaKm: s.radioEntregaKm != null ? String(s.radioEntregaKm) : '5',
  }
}

// Del formulario a lo que espera el backend
export function aPedido(d: DatosSucursal) {
  return {
    nombre: d.nombre.trim(),
    telefono: d.telefono.trim(),
    horario: d.horario.trim(),
    calle: d.ubicacion.calle,
    numero: d.ubicacion.numero,
    localidad: d.ubicacion.localidad,
    provincia: d.ubicacion.provincia,
    codigoPostal: d.ubicacion.codigoPostal,
    latitud: d.ubicacion.latitud,
    longitud: d.ubicacion.longitud,
    radioEntregaKm: Number(d.radioEntregaKm),
  }
}

const PASOS = ['Datos', 'Ubicación', 'Entrega']

// Devuelve el error del paso, o '' si está completo
function validarPaso(n: number, d: DatosSucursal): string {
  if (n === 1) {
    if (d.nombre.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.'
    if (d.telefono && !/^[0-9+\s-]*$/.test(d.telefono)) {
      return 'El teléfono solo puede contener números, espacios, guiones y el signo +.'
    }
  }
  if (n === 2) {
    const u = d.ubicacion
    if (!u.calle || !u.numero) return 'Buscá y elegí la dirección de la sucursal, con altura.'
    if (u.latitud === null || u.longitud === null) return 'Marcá la ubicación en el mapa.'
    if (!u.localidad || !u.provincia) return 'La dirección elegida no tiene localidad o provincia. Probá con otra búsqueda.'
  }
  if (n === 3) {
    const radio = Number(d.radioEntregaKm)
    if (!radio || radio <= 0) return 'El radio de entrega debe ser mayor a 0.'
    if (radio > 30) return 'El radio de entrega no puede superar los 30 km.'
  }
  return ''
}

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
                className={`w-full rounded border-b-4 px-2 py-2 text-left text-sm font-semibold transition-colors ${
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-medium">
                  Teléfono <span className="font-normal text-gray-500">(opcional)</span>
                </label>
                <input
                  type="tel"
                  maxLength={20}
                  value={datos.telefono}
                  onChange={(e) => cambiar('telefono', e.target.value)}
                  className={campo}
                  placeholder="Ej: 11 4567-8900"
                />
              </div>
              <div>
                <label className="font-medium">
                  Horario <span className="font-normal text-gray-500">(opcional)</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={datos.horario}
                  onChange={(e) => cambiar('horario', e.target.value)}
                  className={campo}
                  placeholder="Ej: Lun a Dom 11 a 23 h"
                />
              </div>
            </div>
          </div>
        )}

        {paso === 2 && <AddressPicker value={u} onChange={(nueva) => cambiar('ubicacion', nueva)} />}

        {paso === 3 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 rounded bg-gray-50 px-3 py-2">
              <div className="min-w-0">
                <p className="font-semibold">{datos.nombre}</p>
                <p className="text-sm text-gray-600">
                  📍 {u.calle} {u.numero}, {u.localidad}
                </p>
              </div>
              <button
                type="button"
                onClick={() => irAPaso(2)}
                className="shrink-0 text-sm font-semibold text-orange-600 hover:underline"
              >
                Cambiar
              </button>
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