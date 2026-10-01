import { useEffect, useState, type FormEvent } from 'react'
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

function Address() {
  const { user } = useAuth()

  const [direcciones, setDirecciones] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [form, setForm] = useState<AddressFormData>(formVacio)

  useEffect(() => {
    if (!user) return
    cargarDirecciones()
  }, [user])

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
    setModalAbierto(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.alias.trim()) {
      setError('Completá el alias')
      return
    }
    if (!form.calle.trim() || !form.numero.trim()) {
      setError('Buscá y elegí tu dirección, con altura')
      return
    }
    if (form.latitud === null || form.longitud === null) {
      setError('Marcá la ubicación en el mapa')
      return
    }

    setSaving(true)
    try {
      if (editandoId) {
        await actualizarDireccion(editandoId, form)
      } else if (user) {
        await crearDireccion(user.id, form)
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
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-brand-dark">{direccion.alias}</p>
                    {direccion.predeterminada && (
                      <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-bold text-brand-green">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {direccion.calle} {direccion.numero}
                    {direccion.piso && `, piso ${direccion.piso}`} — {direccion.localidad}
                    {direccion.provincia && `, ${direccion.provincia}`}
                    {direccion.codigoPostal && ` (${direccion.codigoPostal})`}
                  </p>
                  {direccion.latitud == null && (
                    <p className="mt-1 text-xs font-semibold text-amber-600">
                      ⚠️ Sin ubicación en el mapa. Editala para completarla.
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
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
      >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">          <div>
            <label className="text-sm text-gray-500">Alias (ej: Casa, Trabajo)</label>
            <input
              type="text"
              value={form.alias}
              onChange={(e) => setForm({ ...form, alias: e.target.value })}
              className="mt-1 w-full border-b border-brand-dark/20 py-2 text-lg focus:border-brand-red focus:outline-none"
            />
          </div>

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
          <div>
            <label className="text-sm text-gray-500">Observaciones (opcional)</label>
            <textarea
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

          <ErrorAlert message={error} />

          <button
            type="submit"
            disabled={saving}
            className="mt-2 self-end rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>
    </div>
    </div>
  )
}

export default Address