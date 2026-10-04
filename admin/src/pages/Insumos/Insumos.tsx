import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
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

const UNIDADES = ['unidad', 'kg', 'g', 'litro', 'ml']

const formularioVacio = { nombre: '', unidadMedida: 'unidad', precioComercial: '' }

export default function Insumos() {
  const { mostrarToast } = useToast()
  const [insumos, setInsumos] = useState<Insumo[]>([])
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

  function editar(insumo: Insumo) {
    setEditandoId(insumo.id)
    setForm({
      nombre: insumo.nombre,
      unidadMedida: insumo.unidadMedida,
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

    const datos = {
      nombre: form.nombre.trim(),
      unidadMedida: form.unidadMedida,
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

  // Si el insumo usa una unidad que no está en la lista, se suma para no perderla
  const unidades = UNIDADES.includes(form.unidadMedida) ? UNIDADES : [...UNIDADES, form.unidadMedida]

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Insumos</h1>
      <p className="mt-2 text-gray-600">
        Los ingredientes con los que se arman las recetas. Al crear uno, se agrega con stock 0 en todas las sucursales.
      </p>

      {/* ---------- Crear o editar ---------- */}
      <form onSubmit={guardar} noValidate className="mt-6 max-w-3xl rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-xl font-bold">{editandoId ? 'Editar insumo' : 'Nuevo insumo'}</h2>

        <div className="grid gap-4 sm:grid-cols-3">
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
            <label className="font-medium">Unidad de medida</label>
            <select
              value={form.unidadMedida}
              onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })}
              className="w-full rounded border p-2"
            >
              {unidades.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
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

        <div className="mt-4 flex justify-end gap-3">
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

      {/* ---------- Lista ---------- */}
      <div className="mt-8 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-max border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Nombre</th>
              <th className="px-6 py-3 text-left">Unidad</th>
              <th className="px-6 py-3 text-left">Precio por extra</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10">
                  <MensajeVacio mensaje="No hay insumos registrados." />
                </td>
              </tr>
            ) : (
              insumos.map((insumo) => (
                <tr key={insumo.id} className={`border-t ${editandoId === insumo.id ? 'bg-orange-50' : ''}`}>
                  <td className="px-6 py-4 font-medium">{insumo.nombre}</td>
                  <td className="px-6 py-4">{insumo.unidadMedida}</td>
                  <td className="px-6 py-4">
                    {insumo.precioComercial != null && Number(insumo.precioComercial) > 0
                      ? `$${Number(insumo.precioComercial).toLocaleString('es-AR')}`
                      : 'Sin cargo'}
                  </td>
                  <td className="flex justify-end gap-2 px-6 py-4">
                    <button
                      type="button"
                      onClick={() => editar(insumo)}
                      aria-label={`Editar ${insumo.nombre}`}
                      className="rounded border bg-emerald-200 p-2 text-success hover:text-success-hover"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAEliminar(insumo)}
                      aria-label={`Eliminar ${insumo.nombre}`}
                      className="rounded border bg-red-200 p-2 text-danger hover:text-danger-hover"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmarEliminacion
        abierto={aEliminar !== null}
        mensaje={`¿Seguro que querés eliminar ${aEliminar?.nombre ?? 'este insumo'}?`}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setAEliminar(null)}
      />
    </main>
  )
}