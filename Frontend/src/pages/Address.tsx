import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getDirecciones,
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion,
} from '../services/addressService'
import Modal from '../components/Modal'
import ErrorAlert from '../components/ErrorAlert'
import AddressPicker from '../components/AddressPicker'
import Stepper from '../components/Stepper'
import type { Address as AddressData, AddressFormData } from '../types/address'

const formVacio: AddressFormData = {
  alias: '',
  calle: '',
  numero: '',
  piso: '',
  localidad: '',
  provincia: '',
  codigoPostal: '',
  entreCalles: '',
  observaciones: '',
  latitud: null,
  longitud: null,
  predeterminada: false,
}

const PASOS = ['Nombre', 'Ubicación', 'Detalles']

function Address() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Si viene desde el checkout: a dónde volver y qué abrir al entrar
  const estado = location.state as { from?: string; abrirNueva?: boolean; editarId?: number } | null
  const accionInicialHecha = useRef(false)

  const [direcciones, setDirecciones] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [form, setForm] = useState<AddressFormData>(formVacio)
  const [paso, setPaso] = useState(1)

  useEffect(() => {
    if (!user) return
    cargarDirecciones()
  }, [user])

  // Cuando terminan de cargar las direcciones, abre el formulario que pidió el checkout
  useEffect(() => {
    if (loading || accionInicialHecha.current || !estado) return
    accionInicialHecha.current = true

    if (estado.abrirNueva) {
      abrirNueva()
    } else if (estado.editarId) {
      const aEditar = direcciones.find((d) => d.id === estado.editarId)
      if (aEditar) abrirEditar(aEditar)
    }
  }, [loading])

  function cargarDirecciones() {
    if (!user) return
    setLoading(true)
    getDirecciones(user.id)
      .then(setDirecciones)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar direcciones'))
      .finally(() => setLoading(false))
  }

  function abrirNueva() {
    setForm(formVacio)
    setEditandoId(null)
    setError('')
    setPaso(1)
    setModalAbierto(true)
  }

  function abrirEditar(direccion: AddressData) {
    setForm({
      alias: direccion.alias,
      calle: direccion.calle,
      numero: direccion.numero,
      piso: direccion.piso ?? '',
      localidad: direccion.localidad ?? '',
      provincia: direccion.provincia ?? '',
      codigoPostal: direccion.codigoPostal ?? '',
      entreCalles: direccion.entreCalles ?? '',
      observaciones: direccion.observaciones ?? '',
      latitud: direccion.latitud != null ? Number(direccion.latitud) : null,
      longitud: direccion.longitud != null ? Number(direccion.longitud) : null,
      predeterminada: direccion.predeterminada,
    })
    setEditandoId(direccion.id)
    setError('')
    setPaso(1)
    setModalAbierto(true)
  }

  // Devuelve el error del paso, o '' si está completo
  function validarPaso(n: number): string {
    if (n === 1 && !form.alias.trim()) {
      return 'Poné un nombre para identificar la dirección (ej: Casa)'
    }
    if (n === 2) {
      if (!form.calle.trim() || !form.numero.trim()) return 'Buscá y elegí tu dirección, con altura'
      if (form.latitud === null || form.longitud === null) return 'Marcá la ubicación en el mapa'
    }
    return ''
  }

  // Para llegar a un paso, todos los anteriores tienen que estar completos
  function irAPaso(destino: number) {
    for (let n = 1; n < destino; n++) {
      const errorPaso = validarPaso(n)
      if (errorPaso) {
        setError(errorPaso)
        setPaso(n)
        return
      }
    }
    setError('')
    setPaso(destino)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    // En los primeros pasos, el botón (o Enter) avanza al siguiente
    if (paso < PASOS.length) {
      irAPaso(paso + 1)
      return
    }

    // En el último paso, se revisa todo antes de guardar
    for (let n = 1; n < PASOS.length; n++) {
      const errorPaso = validarPaso(n)
      if (errorPaso) {
        setError(errorPaso)
        setPaso(n)
        return
      }
    }

    setSaving(true)
    try {
      const guardada = editandoId
        ? await actualizarDireccion(editandoId, form)
        : await crearDireccion(user!.id, form)

      // Si vino desde el checkout, vuelve con esta dirección elegida
      if (estado?.from) {
        navigate(estado.from, { state: { direccionId: guardada.id } })
        return
      }

      setModalAbierto(false)
      cargarDirecciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la dirección')
    } finally {
      setSaving(false)
    }
  }

  async function handleEliminar(id: number) {
    const confirmar = window.confirm('¿Seguro que querés eliminar esta dirección?')
    if (!confirmar) return

    try {
      await eliminarDireccion(id)
      cargarDirecciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la dirección')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-gray-600">Cargando...</div>
    )
  }

  return (

    <div className='bg-brand-cream '>
    <div className="mx-auto max-w-2xl px-4 py-12 min-h-[80vh]">

    
      {estado?.from && (
        <Link to={estado.from} className="mb-4 inline-block font-semibold text-brand-red hover:underline">
          ← Volver al pedido
        </Link>
      )}


      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-brand-dark">Direcciones guardadas</h1>
        <button
          type="button"
          onClick={abrirNueva}
          className="rounded-full bg-brand-red px-5 py-2 font-bold text-white transition-opacity hover:opacity-90"
        >
          + Agregar
        </button>
      </div>

      {error && !modalAbierto && (
        <div className="mt-4">
          <ErrorAlert message={error} />
        </div>
      )}

      {direcciones.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Todavía no tenés direcciones guardadas.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {direcciones.map((direccion) => (
            <div key={direccion.id} className="rounded-2xl bg-white p-5 shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-brand-dark">{direccion.alias}</p>
                    {direccion.predeterminada && (
                      <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-bold text-brand-green">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {direccion.calle} {direccion.numero} — {direccion.localidad}
                    {direccion.provincia && `, ${direccion.provincia}`}
                    {direccion.codigoPostal && ` (${direccion.codigoPostal})`}
                  </p>
                  {direccion.latitud == null && (
                    <p className="mt-1 text-xs font-semibold text-amber-600">
                      ⚠️ Sin ubicación en el mapa. Editala para completarla.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-4 border-t border-brand-dark/10 pt-3 sm:border-0 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => abrirEditar(direccion)}
                    className="text-sm font-semibold text-brand-dark hover:text-brand-red"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(direccion.id)}
                    className="text-sm font-semibold text-brand-red hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editandoId ? 'Editar dirección' : 'Nueva dirección'}
        tamanio="lg"
      >
        <div className="mb-4">
          <Stepper pasos={PASOS} actual={paso} onIrA={irAPaso} />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {paso === 1 && (
            <div>
              <label htmlFor="alias" className="text-sm text-gray-500">
                ¿Cómo querés llamar a esta dirección?
              </label>
              <input
                id="alias"
                type="text"
                autoFocus
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value })}
                placeholder="Ej: Casa"
                className="mt-1 w-full border-b border-brand-dark/20 py-2 text-lg focus:border-brand-red focus:outline-none"
              />
            </div>
          )}

          {paso === 2 && (
            <AddressPicker
              value={{
                calle: form.calle,
                numero: form.numero,
                localidad: form.localidad,
                provincia: form.provincia,
                codigoPostal: form.codigoPostal,
                latitud: form.latitud,
                longitud: form.longitud,
              }}
              onChange={(ubicacion) => setForm((prev) => ({ ...prev, ...ubicacion }))}
            />
          )}

          {paso === 3 && (
            <>
              <div className="flex items-start justify-between gap-3 rounded-lg bg-brand-cream px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-dark">{form.alias}</p>
                  <p className="text-sm text-gray-600">
                    📍 {form.calle} {form.numero}
                    {form.localidad && `, ${form.localidad}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => irAPaso(2)}
                  className="shrink-0 text-sm font-semibold text-brand-red hover:underline"
                >
                  Cambiar
                </button>
              </div>

              <div>
                <label htmlFor="observaciones" className="text-sm text-gray-500">
                  Observaciones para el repartidor (opcional)
                </label>
                <textarea
                  id="observaciones"
                  value={form.observaciones}
                  maxLength={140}
                  rows={3}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Ej: timbre roto, portón negro"
                  className="mt-1 w-full rounded-lg border border-brand-dark/20 p-2 focus:border-brand-red focus:outline-none"
                />
                <p className="text-right text-xs text-gray-400">{form.observaciones.length}/140</p>
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                <input
                  type="checkbox"
                  checked={form.predeterminada}
                  onChange={(e) => setForm({ ...form, predeterminada: e.target.checked })}
                  className="h-4 w-4 accent-brand-red"
                />
                Marcar como predeterminada
              </label>
            </>
          )}

          <ErrorAlert message={error} />

          <div className="flex items-center justify-between gap-3">
            {paso > 1 ? (
              <button
                type="button"
                onClick={() => irAPaso(paso - 1)}
                className="rounded-full border border-brand-dark/20 px-5 py-2 font-bold text-brand-dark transition-colors hover:border-brand-red hover:text-brand-red"
              >
                Atrás
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {paso < PASOS.length ? 'Siguiente' : saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
    </div>
  )
}

export default Address