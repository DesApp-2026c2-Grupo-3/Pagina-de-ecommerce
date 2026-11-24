import { Search } from 'lucide-react'
import type { ContadoresEtapa, FiltroEtapa, SucursalOpcion } from '../../types/pedido.types'
import FiltroEtapas from './FiltroEtapas'

interface Props {
  // Solo el MASTER elige sucursal; el admin de sucursal siempre ve la suya (RN-35)
  sucursales: SucursalOpcion[] | null
  sucursalId: number | null
  onSucursal: (id: number) => void
  busqueda: string
  onBusqueda: (valor: string) => void
  etapa: FiltroEtapa
  onEtapa: (valor: FiltroEtapa) => void
  contadores: ContadoresEtapa
}

// Filtros de la lista (plan responsivo, 4.3), según el ancho del contenido:
// · escritorio (≥ 60 rem): sucursal + buscador, y abajo los botones de etapa en una fila
// · tablet (≥ 36 rem): buscador + sucursal + etapa (desplegable) en una fila
// · móvil: buscador arriba; abajo sucursal + etapa (o solo etapa, para el admin de sucursal)
export default function BarraFiltrosPedidos({
  sucursales,
  sucursalId,
  onSucursal,
  busqueda,
  onBusqueda,
  etapa,
  onEtapa,
  contadores,
}: Props) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center">
        <div className="relative w-full @xl:flex-1 @[60rem]:order-2 @[60rem]:w-96 @[60rem]:flex-none">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <label htmlFor="buscar-pedido" className="sr-only">
            Buscar por cliente o número de pedido
          </label>
          <input
            id="buscar-pedido"
            type="search"
            value={busqueda}
            onChange={(e) => onBusqueda(e.target.value)}
            placeholder="Buscar por cliente o nº de pedido..."
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3"
          />
        </div>

        <div className="flex gap-3 @[60rem]:order-1">
          {sucursales && (
            <div className="min-w-0 flex-1 @xl:w-48 @xl:flex-none @[60rem]:w-56">
              <label htmlFor="filtro-sucursal" className="sr-only">
                Elegir sucursal
              </label>
              <select
                id="filtro-sucursal"
                value={sucursalId !== null ? String(sucursalId) : ''}
                onChange={(e) => onSucursal(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3"
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.activa ? s.nombre : `${s.nombre} (inactiva)`}
                  </option>
                ))}
              </select>
            </div>
          )}
          <FiltroEtapas
            variante="desplegable"
            valor={etapa}
            contadores={contadores}
            onChange={onEtapa}
            className="min-w-0 flex-1 @xl:w-56 @xl:flex-none @[60rem]:hidden"
          />
        </div>
      </div>

      <FiltroEtapas
        variante="botones"
        valor={etapa}
        contadores={contadores}
        onChange={onEtapa}
        className="hidden @[60rem]:block"
      />
    </div>
  )
}
