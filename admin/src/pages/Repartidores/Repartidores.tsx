import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Paginacion from '../../components/Paginacion'
import MensajeVacio from '../../components/MensajeVacio'
import { BarraFiltros, Buscador, SelectFiltro } from '../../components/Filtros'
import { obtenerRepartidores } from '../../services/repartidorService'
import type { Repartidor } from '../../types/repartidor.types'

const POR_PAGINA = 8

export default function Repartidores() {
  const navigate = useNavigate()

  const [repartidores, setRepartidores] = useState<Repartidor[]>([])
  const [paginaActual, setPaginaActual] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [filtroSucursal, setFiltroSucursal] = useState('todas')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerRepartidores()
      .then(setRepartidores)
      .catch((error) => {
        console.error('Error al cargar repartidores:', error)
        setError('No se pudieron cargar los repartidores.')
      })
      .finally(() => setCargando(false))
  }, [])

  const conReinicio = (cambiar: (valor: string) => void) => (valor: string) => {
    cambiar(valor)
    setPaginaActual(1)
  }

  const sucursalesDeLaLista = [
    ...new Map(
      repartidores
        .filter((r) => r.sucursal)
        .map((r) => [r.sucursal!.id, r.sucursal!]),
    ).values(),
  ].sort((a, b) => a.nombre.localeCompare(b.nombre))

  const texto = busqueda.trim().toLowerCase()

  const filtrados = repartidores.filter(
    (r) =>
      (
        `${r.nombre} ${r.apellido}`.toLowerCase().includes(texto) ||
        r.email.toLowerCase().includes(texto)
      ) &&
      (filtroSucursal === 'todas' || String(r.sucursalId) === filtroSucursal),
  )

  const pagina = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  )

  const hayFiltros = busqueda !== '' || filtroSucursal !== 'todas'

  return (
    <main className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Gestión de personal
          </p>
          <h1 className="break-words text-2xl font-bold sm:text-3xl">
            Repartidores
          </h1>
          <p className="mt-2 text-gray-600">
            Gestión de repartidores del sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/repartidores/nuevo')}
          aria-label="Nuevo repartidor"
          title="Nuevo repartidor"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} />
        </button>
      </div>

      <BarraFiltros>
        <Buscador
          valor={busqueda}
          onChange={conReinicio(setBusqueda)}
          placeholder="Buscar por nombre o email..."
        />

        <SelectFiltro
          valor={filtroSucursal}
          onChange={conReinicio(setFiltroSucursal)}
          etiqueta="Filtrar por sucursal"
          opciones={[
            { valor: 'todas', etiqueta: 'Todas las sucursales' },
            ...sucursalesDeLaLista.map((s) => ({
              valor: String(s.id),
              etiqueta: s.nombre,
            })),
          ]}
        />
      </BarraFiltros>

      {cargando ? (
        <div className="rounded-lg border bg-white px-6 py-10 text-center text-gray-500">
          Cargando repartidores...
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-white px-6 py-10 text-center text-red-600">
          {error}
        </div>
      ) : pagina.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio
            mensaje={
              hayFiltros
                ? 'No hay repartidores con esos filtros.'
                : 'No hay repartidores registrados.'
            }
          />
        </div>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {pagina.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {r.nombre} {r.apellido}
                  </p>
                  <p className="truncate text-sm text-gray-600">{r.email}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {r.sucursal?.nombre ?? 'Sin sucursal'}
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      r.activo ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {r.activo ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
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
                  <th className="px-6 py-3 text-left">Sucursal</th>
                  <th className="px-6 py-3 text-right">Estado</th>
                </tr>
              </thead>

              <tbody>
                {pagina.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-6 py-4 font-medium">
                      {r.nombre} {r.apellido}
                    </td>
                    <td className="px-6 py-4">{r.email}</td>
                    <td className="px-6 py-4">
                      {r.sucursal?.nombre ?? 'Sin sucursal'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          r.activo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {r.activo ? 'Activo' : 'Inactivo'}
                      </span>
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
    </main>
  )
}
