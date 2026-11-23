import { useEffect, useState } from 'react'
import { Check, EyeOff } from 'lucide-react'
import EstrellasPromedio from '../../components/EstrellasPromedio'
import { useAuth } from '../../context/AuthContext'
import { cambiarEstadoCalificacion, obtenerCalificaciones } from '../../services/calificacionService'
import type { CalificacionAdmin, EstadoCalificacion } from '../../types/calificacion.types'

const PESTANIAS: { estado: EstadoCalificacion; etiqueta: string }[] = [
  { estado: 'PENDIENTE', etiqueta: 'Pendientes' },
  { estado: 'APROBADA', etiqueta: 'Aprobadas' },
  { estado: 'OCULTA', etiqueta: 'Ocultas' },
]

const BOTON =
  'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50'

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })

// Moderación: el admin decide qué calificaciones se muestran en el inicio de la tienda
export default function Calificaciones() {
  const { administrador } = useAuth()
  const esMaster = administrador?.rol === 'MASTER'

  const [estado, setEstado] = useState<EstadoCalificacion>('PENDIENTE')
  const [calificaciones, setCalificaciones] = useState<CalificacionAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState<number | null>(null) // id de la que se está guardando

  // Cada vez que cambia la pestaña, se piden las calificaciones de ese estado
  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError('')
    obtenerCalificaciones(estado)
      .then((datos) => { if (!cancelado) setCalificaciones(datos) })
      .catch((err) => { if (!cancelado) setError(err.message) })
      .finally(() => { if (!cancelado) setCargando(false) })
    return () => { cancelado = true }
  }, [estado])

  async function cambiarEstado(id: number, nuevo: 'APROBADA' | 'OCULTA') {
    setProcesando(id)
    setError('')
    try {
      await cambiarEstadoCalificacion(id, nuevo)
      // Cambió de estado: ya no pertenece a esta pestaña
      setCalificaciones((lista) => lista.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado')
    } finally {
      setProcesando(null)
    }
  }

  const etiquetaActual = PESTANIAS.find((p) => p.estado === estado)!.etiqueta

  return (
    <main className="p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Opinión de los clientes</p>
        <h1 className="text-3xl font-bold">Calificaciones</h1>
        <p className="mt-2 text-gray-600">
          {esMaster
            ? 'Las calificaciones de todas las sucursales.'
            : `Las calificaciones de tu sucursal${administrador?.sucursal ? `: ${administrador.sucursal.nombre}` : ''}.`}{' '}
          En el inicio de la tienda se muestran las aprobadas que tienen comentario.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {PESTANIAS.map((p) => (
          <button
            key={p.estado}
            type="button"
            onClick={() => setEstado(p.estado)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              estado === p.estado ? 'border-orange-600 bg-orange-600 text-white' : 'bg-white hover:bg-gray-50'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {cargando ? (
        <p className="text-gray-600">Cargando...</p>
      ) : calificaciones.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-gray-600">
          No hay calificaciones {etiquetaActual.toLowerCase()}.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {calificaciones.map((c) => (
            <li key={c.id} className="rounded-lg border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{c.nombre}</span>
                  <EstrellasPromedio valor={c.puntaje} tamanio={16} />
                </div>
                <span className="text-sm text-gray-500">
                  {formatearFecha(c.fecha)}
                  {esMaster && ` · ${c.sucursal}`}
                </span>
              </div>

              <p className={`mt-2 break-words ${c.comentario ? '' : 'italic text-gray-400'}`}>
                {c.comentario ?? 'Sin comentario'}
              </p>

              <div className="mt-4 flex gap-2">
                {c.estado !== 'APROBADA' && (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(c.id, 'APROBADA')}
                    disabled={procesando === c.id}
                    className={`${BOTON} bg-green-600 hover:bg-green-700`}
                  >
                    <Check size={16} /> Aprobar
                  </button>
                )}
                {c.estado !== 'OCULTA' && (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(c.id, 'OCULTA')}
                    disabled={procesando === c.id}
                    className={`${BOTON} bg-gray-600 hover:bg-gray-700`}
                  >
                    <EyeOff size={16} /> Ocultar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}