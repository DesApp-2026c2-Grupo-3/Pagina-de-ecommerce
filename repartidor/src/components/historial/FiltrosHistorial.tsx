
import { useId } from 'react'
import { Search, CalendarDays, Filter, RotateCcw } from 'lucide-react'

interface Props {
  filtroEstado: string
  busqueda: string
  fechaDesde: string
  fechaHasta: string
  setFiltroEstado: (valor: string) => void
  setBusqueda: (valor: string) => void
  setFechaDesde: (valor: string) => void
  setFechaHasta: (valor: string) => void
}

export default function FiltrosHistorial({
  filtroEstado,
  busqueda,
  fechaDesde,
  fechaHasta,
  setFiltroEstado,
  setBusqueda,
  setFechaDesde,
  setFechaHasta,
}: Props) {
  // v1.12: cada campo con su etiqueta asociada (Lighthouse)
  const idBusqueda = useId()
  const idDesde = useId()
  const idHasta = useId()

  const limpiarFiltros = () => {
    setFiltroEstado('todos')
    setBusqueda('')
    setFechaDesde('')
    setFechaHasta('')
  }

  const opciones = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'finalizado', texto: 'Finalizados' },
    { valor: 'cancelado', texto: 'Cancelados' },
  ]

  const hayFiltrosActivos =
    filtroEstado !== 'todos' || busqueda !== '' || fechaDesde !== '' || fechaHasta !== ''

  return (
    <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <Filter size={20} className="text-orange-600" />
          </div>

          <div>
            <h3 className="font-bold text-slate-800">
              Filtrar historial
            </h3>
            <p className="text-xs text-slate-500">
              Encontrá viajes según tus preferencias
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={limpiarFiltros}
          disabled={!hayFiltrosActivos}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-xs md:min-h-0 font-semibold text-orange-700 transition hover:bg-orange-50 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={14} />
          Limpiar filtros
        </button>
      </div>

      {/* Estado */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          Estado del viaje
        </p>

        <div className="flex flex-wrap gap-2">
          {opciones.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setFiltroEstado(opcion.valor)}
              aria-pressed={filtroEstado === opcion.valor}
              className={`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                filtroEstado === opcion.valor
                  ? 'border-orange-700 bg-orange-700 text-white shadow-md shadow-orange-700/20'
                  : 'border-orange-100 bg-orange-50/50 text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <label htmlFor={idBusqueda} className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Buscar viaje
        </label>

        <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/40 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
          <Search size={18} className="shrink-0 text-orange-500" />

          <input
            id={idBusqueda}
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ingresá el número de viaje..."
            className="w-full bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Fechas */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays size={16} className="text-orange-500" />
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Fecha de inicio del viaje
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={idDesde} className="mb-2 block text-sm font-medium text-slate-600">
              Desde
            </label>

            <input
              id={idDesde}
              type="date"
              value={fechaDesde}
              max={fechaHasta || undefined}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-3 text-sm text-slate-700 outline-none transition hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label htmlFor={idHasta} className="mb-2 block text-sm font-medium text-slate-600">
              Hasta
            </label>

            <input
              id={idHasta}
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-3 text-sm text-slate-700 outline-none transition hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
