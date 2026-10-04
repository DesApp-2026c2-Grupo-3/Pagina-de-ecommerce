import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Boxes, Plus, Power } from 'lucide-react'
import Paginacion from '../../components/Paginacion'
import MensajeVacio from '../../components/MensajeVacio'
import { BarraFiltros, Buscador, SelectFiltro } from '../../components/Filtros'
import { useToast } from '../../context/ToastContext'
import { obtenerSucursales, cambiarEstadoSucursal } from '../../services/sucursalService'

interface SucursalFila {
  id: number
  nombre: string
  activa: boolean
}

const POR_PAGINA = 8

function Estado({ activa }: { activa: boolean }) {
  return activa ? (
    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Activa</span>
  ) : (
    <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-600">Inactiva</span>
  )
}

const botonIcono = 'rounded border p-2 transition-colors'

export default function Sucursales() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [sucursales, setSucursales] = useState<SucursalFila[]>([])
  const [paginaActual, setPaginaActual] = useState(1)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todas')

  useEffect(() => {
    obtenerSucursales()
      .then(setSucursales)
      .catch((error) => console.error('Error al cargar sucursales:', error))
  }, [])

  // Al cambiar un filtro, se vuelve a la primera página
  const conReinicio = (cambiar: (valor: string) => void) => (valor: string) => {
    cambiar(valor)
    setPaginaActual(1)
  }

  const filtradas = sucursales.filter(
    (s) =>
      s.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) &&
      (filtroEstado === 'todas' || (filtroEstado === 'activas') === s.activa),
  )
  const pagina = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)
  const hayFiltros = busqueda !== '' || filtroEstado !== 'todas'

  async function cambiarEstado(sucursal: SucursalFila) {
    try {
      const respuesta = await cambiarEstadoSucursal(sucursal.id, !sucursal.activa)
      setSucursales((prev) => prev.map((s) => (s.id === sucursal.id ? respuesta.sucursal : s)))
      mostrarToast(sucursal.activa ? 'Sucursal desactivada' : 'Sucursal activada')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'No se pudo cambiar el estado')
    }
  }

  // Los tres botones, iguales en celular y escritorio
  const acciones = (s: SucursalFila) => (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => navigate(`/admin/sucursales/editar/${s.id}`)}
        aria-label={`Ver detalles de ${s.nombre}`}
        title="Ver detalles"
        className={`${botonIcono} bg-emerald-200 text-success hover:text-success-hover`}
      >
        <Eye size={18} />
      </button>
      <button
        type="button"
        onClick={() => navigate(`/admin/sucursales/${s.id}/stock`)}
        aria-label={`Ver stock de ${s.nombre}`}
        title="Ver stock"
        className={`${botonIcono} bg-orange-100 text-action hover:text-action-hover`}
      >
        <Boxes size={18} />
      </button>
      <button
        type="button"
        onClick={() => cambiarEstado(s)}
        aria-label={`${s.activa ? 'Desactivar' : 'Activar'} ${s.nombre}`}
        title={s.activa ? 'Desactivar (deja de recibir pedidos)' : 'Activar'}
        className={`${botonIcono} ${
          s.activa ? 'bg-slate-200 text-gray-700 hover:text-danger' : 'bg-green-100 text-green-700 hover:text-green-900'
        }`}
      >
        <Power size={18} />
      </button>
    </div>
  )

  return (
    <main className="p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sucursales</h1>
          <p className="mt-2 text-gray-600">Gestioná las sucursales y su estado.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/sucursales/nueva')}
          aria-label="Nueva sucursal"
          title="Nueva sucursal"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} />
        </button>
      </div>

      <BarraFiltros>
        <Buscador valor={busqueda} onChange={conReinicio(setBusqueda)} placeholder="Buscar sucursal..." />
        <SelectFiltro
          valor={filtroEstado}
          onChange={conReinicio(setFiltroEstado)}
          etiqueta="Filtrar por estado"
          opciones={[
            { valor: 'todas', etiqueta: 'Todas' },
            { valor: 'activas', etiqueta: 'Activas' },
            { valor: 'inactivas', etiqueta: 'Inactivas' },
          ]}
        />
      </BarraFiltros>

      {pagina.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje={hayFiltros ? 'No hay sucursales con esos filtros.' : 'No hay sucursales registradas.'} />
        </div>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {pagina.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.nombre}</p>
                  <div className="mt-2">
                    <Estado activa={s.activa} />
                  </div>
                </div>
                {acciones(s)}
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden rounded-lg border bg-white md:block">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Nombre</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagina.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-6 py-4 font-medium">{s.nombre}</td>
                    <td className="px-6 py-4">
                      <Estado activa={s.activa} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">{acciones(s)}</div>
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
        totalElementos={filtradas.length}
        elementosPorPagina={POR_PAGINA}
        cambiarPagina={setPaginaActual}
      />
    </main>
  )
}