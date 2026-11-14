import { Search } from 'lucide-react'

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

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">
          Filtrar historial
        </h3>

        <button
          type="button"
          onClick={limpiarFiltros}
          className="text-xs font-semibold text-orange-600 hover:text-orange-700"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Estado */}
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">
          Estado del viaje
        </p>

        <div className="flex flex-wrap gap-2">
          {opciones.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setFiltroEstado(opcion.valor)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                filtroEstado === opcion.valor
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      </div>

      {/* Búsqueda */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-500">
          Buscar viaje
        </label>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search size={18} className="text-slate-400" />

          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. 125"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
      </div>

      {/* Fechas */}
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">
          Fecha de inicio del viaje
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">
              Desde
            </label>

            <input
              type="date"
              value={fechaDesde}
              max={fechaHasta || undefined}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">
              Hasta
            </label>

            <input
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
            />
          </div>
        </div>
      </div>
    </div>
  )
}