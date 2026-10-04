import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Search, Trash2 } from 'lucide-react'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import { useToast } from '../../context/ToastContext'
import {
  obtenerInsumos,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  type Insumo,
} from '../../services/insumoService'

const formularioVacio = { nombre: '', precioComercial: '' }

const precioTexto = (insumo: Insumo) =>
  insumo.precioComercial != null && Number(insumo.precioComercial) > 0
    ? `$${Number(insumo.precioComercial).toLocaleString('es-AR')}`
    : 'Sin cargo'

export default function Insumos() {
  const { mostrarToast } = useToast()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState(formularioVacio)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [aEliminar, setAEliminar] = useState<Insumo | null>(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    obtenerInsumos()
      .then(setInsumos)
      .catch((err) => setError(err.message))
  }

  useEffect(cargar, [])

  const filtrados = insumos.filter((i) => i.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))

  function editar(insumo: Insumo) {
    setEditandoId(insumo.id)
    setForm({
      nombre: insumo.nombre,
      precioComercial: insumo.precioComercial != null ? String(insumo.precioComercial) : '',
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelar() {
    setEditandoId(null)
    setForm(formularioVacio)
    setError('')
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()

    if (form.nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.')
      return
    }
    if (form.precioComercial !== '' && Number(form.precioComercial) < 0) {
      setError('El precio del extra no puede ser negativo.')
      return
    }

    // Por ahora, todos los insumos se miden en unidades
    const datos = {
      nombre: form.nombre.trim(),
      unidadMedida: 'unidad',
      precioComercial: form.precioComercial === '' ? null : Number(form.precioComercial),
    }

    setGuardando(true)
    try {
      if (editandoId) {
        await actualizarInsumo(editandoId, datos)
        mostrarToast('Insumo modificado!')
      } else {
        await crearInsumo(datos)
        mostrarToast('Insumo creado!')
      }
      cancelar()
      cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el insumo.')
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarEliminacion() {
    if (!aEliminar) return
    try {
      await eliminarInsumo(aEliminar.id)
      mostrarToast('Insumo eliminado!')
      cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el insumo.')
    } finally {
      setAEliminar(null)
    }
  }

  const acciones = (insumo: Insumo) => (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => editar(insumo)}
        aria-label={`Editar ${insumo.nombre}`}
        title="Editar"
        className="rounded border bg-emerald-200 p-2 text-success hover:text-success-hover"
      >
        <Pencil size={18} />
      </button>
      <button
        type="button"
        onClick={() => setAEliminar(insumo)}
        aria-label={`Eliminar ${insumo.nombre}`}
        title="Eliminar"
        className="rounded border bg-red-200 p-2 text-danger hover:text-danger-hover"
      >
        <Trash2 size={18} />
      </button>
    </div>
  )

  return (
    <main className="p-4 md:p-8">
      <h1 className="text-3xl font-bold">Insumos</h1>
      <p className="mt-2 text-gray-600">
        Los ingredientes con los que se arman las recetas. Al crear uno, se agrega con stock 0 en todas las sucursales.
      </p>

      {/* ---------- Crear o editar ---------- */}
      <form onSubmit={guardar} noValidate className="mt-6 max-w-2xl rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-xl font-bold">{editandoId ? 'Editar insumo' : 'Nuevo insumo'}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="font-medium">Nombre</label>
            <input
              type="text"
              maxLength={50}
              value={form.nombre}
              onChange={(e) => {
                setForm({ ...form, nombre: e.target.value })
                setError('')
              }}
              className="w-full rounded border p-2"
              placeholder="Ej: Pepinillos"
            />
          </div>

          <div>
            <label className="font-medium">Precio por extra</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.precioComercial}
              onChange={(e) => {
                setForm({ ...form, precioComercial: e.target.value })
                setError('')
              }}
              className="w-full rounded border p-2"
              placeholder="Ej: 500 (vacío = sin cargo)"
            />
          </div>
        </div>

        {error && <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {editandoId && (
            <button
              type="button"
              onClick={cancelar}
              className="rounded border border-red-300 bg-danger px-4 py-2 text-white transition-colors hover:bg-danger-hover"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={guardando}
            className="rounded border border-orange-300 bg-action px-4 py-2 text-white transition-colors hover:bg-action-hover disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear insumo'}
          </button>
        </div>
      </form>

      {/* ---------- Buscador ---------- */}
      <div className="relative mb-4 mt-8 w-full md:w-80">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar insumo..."
          aria-label="Buscar insumo"
          className="w-full rounded border bg-white py-2 pl-10 pr-3"
        />
      </div>

      {/* ---------- Lista ---------- */}
      {filtrados.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje={busqueda ? 'No hay insumos con ese nombre.' : 'No hay insumos registrados.'} />
        </div>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {filtrados.map((insumo) => (
              <li
                key={insumo.id}
                className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${
                  editandoId === insumo.id ? 'bg-orange-50' : 'bg-white'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{insumo.nombre}</p>
                  <p className="text-sm text-gray-600">Extra: {precioTexto(insumo)}</p>
                </div>
                {acciones(insumo)}
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden rounded-lg border bg-white md:block">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Nombre</th>
                  <th className="px-6 py-3 text-left">Precio por extra</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((insumo) => (
                  <tr key={insumo.id} className={`border-t ${editandoId === insumo.id ? 'bg-orange-50' : ''}`}>
                    <td className="px-6 py-4 font-medium">{insumo.nombre}</td>
                    <td className="px-6 py-4">{precioTexto(insumo)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">{acciones(insumo)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmarEliminacion
        abierto={aEliminar !== null}
        mensaje={`¿Seguro que querés eliminar ${aEliminar?.nombre ?? 'este insumo'}?`}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setAEliminar(null)}
      />
    </main>
  )
}