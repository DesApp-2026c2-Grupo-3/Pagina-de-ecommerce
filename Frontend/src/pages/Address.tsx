import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getDirecciones,
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion,
  marcarPredeterminada,
} from '../services/addressService'
import Modal from '../components/Modal'
import ErrorAlert from '../components/ErrorAlert'
import AddressPicker from '../components/AddressPicker'
import Stepper from '../components/Stepper'
import AccountLayout from '../components/cuenta/AccountLayout'
import DireccionCard from '../components/cuenta/DireccionCard'
import { CLASE_INPUT, CLASE_LABEL } from '../components/ui/formulario'
import type { Address as AddressData, AddressFormData } from '../types/address'
import { ArrowLeft, MapPin, Plus } from 'lucide-react'

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

  // Si viene desde el checkout: a dónde volver, qué abrir al entrar,
  // y la compra directa (si la hay) para no perderla al volver
  const estado = location.state as {
    from?: string
    abrirNueva?: boolean
    editarId?: number
    prefill?: Partial<AddressFormData>
    compraDirecta?: unknown
  } | null
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
      // Viene con una ubicación ya elegida (por ejemplo, la de la zona): solo falta ponerle nombre
      if (estado.prefill) setForm({ ...formVacio, ...estado.prefill })
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

      // Si vino desde el checkout, vuelve con esta dirección elegida (y con la compra directa, si había)
      if (estado?.from) {
        navigate(estado.from, { state: { direccionId: guardada.id, compraDirecta: estado.compraDirecta } })
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

  async function handlePredeterminada(id: number) {
    try {
      await marcarPredeterminada(id)
      cargarDirecciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo marcar como predeterminada')
    }
  }

  // La predeterminada siempre primera
  const ordenadas = [...direcciones].sort((a, b) => Number(b.predeterminada) - Number(a.predeterminada))

  return (
    <AccountLayout
      titulo="Direcciones guardadas"
      subtitulo={loading ? undefined : `${ordenadas.length} ${ordenadas.length === 1 ? 'dirección' : 'direcciones'}`}
      cargando={loading}
    >
      {estado?.from && (
        <Link
          to={estado.from}
          state={{ compraDirecta: estado.compraDirecta }}
          className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-brand-dark bg-white px-4 py-2 text-sm font-bold transition-colors hover:bg-brand-dark hover:text-brand-cream"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al pedido
        </Link>
      )}

      {error && !modalAbierto && <ErrorAlert message={error} />}

      {ordenadas.length === 0 && (
        <p className="rounded-3xl border-2 border-brand-dark bg-white p-8 text-center text-brand-muted">
          Todavía no tenés direcciones guardadas.
        </p>
      )}

      {ordenadas.map((direccion) => (
        <DireccionCard
          key={direccion.id}
          direccion={direccion}
          onEditar={() => abrirEditar(direccion)}
          onEliminar={() => handleEliminar(direccion.id)}
          onPredeterminada={() => handlePredeterminada(direccion.id)}
        />
      ))}

      <button
        type="button"
        onClick={abrirNueva}
        className="flex min-h-22 items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-brand-dark text-lg font-extrabold transition-colors hover:bg-white"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-red text-white">
          <Plus className="h-5 w-5" strokeWidth={3} />
        </span>
        Agregar una dirección
      </button>

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
              <label htmlFor="alias" className={CLASE_LABEL}>
                ¿Cómo querés llamar a esta dirección?
              </label>
              <input
                id="alias"
                type="text"
                autoFocus
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value })}
                placeholder="Ej: Casa"
                className={CLASE_INPUT}
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
              <div className="flex items-start justify-between gap-3 rounded-2xl border-2 border-dashed border-brand-sand bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-dark">{form.alias}</p>
                  <p className="flex items-center gap-1.5 text-sm text-brand-muted">
                    <MapPin className="h-4 w-4 shrink-0 text-brand-red" /> {form.calle} {form.numero}
                    {form.localidad && `, ${form.localidad}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => irAPaso(2)}
                  className="shrink-0 text-sm font-extrabold text-brand-red hover:underline"
                >
                  Cambiar
                </button>
              </div>

              <div>
                <label htmlFor="observaciones" className={CLASE_LABEL}>
                  Observaciones para el repartidor (opcional)
                </label>
                <textarea
                  id="observaciones"
                  value={form.observaciones}
                  maxLength={140}
                  rows={3}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Ej: timbre roto, portón negro"
                  className={`${CLASE_INPUT} resize-none`}
                />
                <p className="mt-1 text-right text-xs text-brand-muted">{form.observaciones.length}/140</p>
              </div>

              <label className="flex items-center gap-3 font-bold text-brand-dark">
                <input
                  type="checkbox"
                  checked={form.predeterminada}
                  onChange={(e) => setForm({ ...form, predeterminada: e.target.checked })}
                  className="h-5 w-5 accent-brand-red"
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
                className="min-h-11 rounded-full border-2 border-brand-dark px-5 font-bold text-brand-dark transition-colors hover:bg-brand-dark hover:text-brand-cream"
              >
                Atrás
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
            >
              {paso < PASOS.length ? 'Siguiente' : saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </AccountLayout>
  )
}

export default Address