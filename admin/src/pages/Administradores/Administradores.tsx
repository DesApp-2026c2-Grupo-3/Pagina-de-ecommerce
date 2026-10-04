import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import Paginacion from '../../components/Paginacion'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import { useToast } from '../../context/ToastContext'
import {
  obtenerAdministradores,
  eliminarAdministrador as eliminarAdministradorAPI,
} from '../../services/administradorService'

interface AdminFila {
  id: number
  nombre: string
  email: string
  rol: string
  sucursal: { id: number; nombre: string } | null
}

const POR_PAGINA = 8

const rolTexto = (rol: string) => (rol === 'MASTER' ? 'General' : 'Sucursal')
const botonIcono = 'rounded border p-2 transition-colors'

export default function Administradores() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [administradores, setAdministradores] = useState<AdminFila[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [aEliminar, setAEliminar] = useState<AdminFila | null>(null)

  useEffect(() => {
    obtenerAdministradores()
      .then(setAdministradores)
      .catch((error) => console.error('Error al cargar administradores:', error))
  }, [])

  const texto = busqueda.trim().toLowerCase()
  const filtrados = administradores.filter(
    (a) => a.nombre.toLowerCase().includes(texto) || a.email.toLowerCase().includes(texto),
  )
  const pagina = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  async function eliminar() {
    if (!aEliminar) return
    try {
      await eliminarAdministradorAPI(aEliminar.id)
      setAdministradores((prev) => prev.filter((a) => a.id !== aEliminar.id))
      mostrarToast('Administrador eliminado!')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'No se pudo eliminar el administrador')
    } finally {
      setAEliminar(null)
    }
  }

  const acciones = (a: AdminFila) => (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => navigate(`/admin/administradores/editar/${a.id}`)}
        aria-label={`Editar ${a.nombre}`}
        title="Editar"
        className={`${botonIcono} bg-emerald-200 text-success hover:text-success-hover`}
      >
        <Pencil size={18} />
      </button>
      <button
        type="button"
        onClick={() => setAEliminar(a)}
        aria-label={`Eliminar ${a.nombre}`}
        title="Eliminar"
        className={`${botonIcono} bg-red-200 text-danger hover:text-danger-hover`}
      >
        <Trash2 size={18} />
      </button>
    </div>
  )

  return (
    <main className="p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Administradores</h1>
          <p className="mt-2 text-gray-600">Gestión de administradores del sistema.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/administradores/nuevo')}
          aria-label="Nuevo administrador"
          title="Nuevo administrador"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} />
        </button>
      </div>

      <div className="relative mb-4 w-full md:w-80">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setPaginaActual(1)
          }}
          placeholder="Buscar por nombre o email..."
          aria-label="Buscar administrador"
          className="w-full rounded border bg-white py-2 pl-10 pr-3"
        />
      </div>

      {pagina.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje={busqueda ? 'No hay administradores que coincidan.' : 'No hay administradores registrados.'} />
        </div>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {pagina.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.nombre}</p>
                  <p className="truncate text-sm text-gray-600">{a.email}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {rolTexto(a.rol)} · {a.sucursal?.nombre ?? 'Sin sucursal'}
                  </p>
                </div>
                {acciones(a)}
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden rounded-lg border bg-white md:block">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Nombre</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Rol</th>
                  <th className="px-6 py-3 text-left">Sucursal</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagina.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-6 py-4 font-medium">{a.nombre}</td>
                    <td className="px-6 py-4">{a.email}</td>
                    <td className="px-6 py-4">{rolTexto(a.rol)}</td>
                    <td className="px-6 py-4">{a.sucursal?.nombre ?? 'Sin sucursal'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">{acciones(a)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Paginacion
        paginaActual={paginaActual}
        totalElementos={filtrados.length}
        elementosPorPagina={POR_PAGINA}
        cambiarPagina={setPaginaActual}
      />

      <ConfirmarEliminacion
        abierto={aEliminar !== null}
        mensaje={`¿Seguro que querés eliminar a ${aEliminar?.nombre ?? 'este administrador'}?`}
        onConfirmar={eliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </main>
  )
}