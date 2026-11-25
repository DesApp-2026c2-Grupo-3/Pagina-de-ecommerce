import type { ChangeEvent } from 'react'
import { Search } from 'lucide-react'
import type { SucursalOpcion } from '../../types/pedido.types'
import FiltroSegmentado from './FiltroSegmentado'
import SelectorSucursal from './SelectorSucursal'

interface Props<T extends string> {
  // null = admin de sucursal: sin selector (siempre ve la suya, RN-35)
  sucursales: SucursalOpcion[] | null
  sucursalId: number | null
  onSucursal: (id: number) => void
  busqueda: string
  onBusqueda: (valor: string) => void
  placeholder: string
  filtro: {
    id: string
    leyenda: string
    opciones: { valor: T; etiqueta: string }[]
    valor: T
    contadores: Record<T, number>
    onChange: (valor: T) => void
  }
}

// Filtros de las listas del panel (Pedidos y Viajes), según el ancho del contenido:
// · escritorio (≥ 60 rem): sucursal + buscador, y abajo los botones en una fila
// · tablet (≥ 36 rem): buscador + sucursal + desplegable en una fila
// · móvil: buscador arriba; abajo sucursal + desplegable (o solo el desplegable)
export default function BarraFiltrosLista<T extends string>({
  sucursales,
  sucursalId,
  onSucursal,
  busqueda,
  onBusqueda,
  placeholder,
  filtro,
}: Props<T>) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center">
        <div className="relative w-full @xl:flex-1 @[60rem]:order-2 @[60rem]:w-96 @[60rem]:flex-none">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <label htmlFor={`${filtro.id}-buscar`} className="sr-only">
            {placeholder}
          </label>
          <input
            id={`${filtro.id}-buscar`}
            type="search"
            value={busqueda}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onBusqueda(e.target.value)}
            placeholder={`${placeholder}...`}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3"
          />
        </div>

        {/* Sin selector de sucursal, en escritorio este bloque queda vacío: se oculta para que no deje un hueco */}
        <div className={`flex gap-3 @[60rem]:order-1 ${sucursales ? '' : '@[60rem]:hidden'}`}>
          {sucursales && (
            <SelectorSucursal
              sucursales={sucursales}
              sucursalId={sucursalId}
              onChange={onSucursal}
              className="min-w-0 flex-1 @xl:w-48 @xl:flex-none @[60rem]:w-56"
            />
          )}
          <FiltroSegmentado {...filtro} variante="desplegable" className="min-w-0 flex-1 @xl:w-56 @xl:flex-none @[60rem]:hidden" />
        </div>
      </div>

      <FiltroSegmentado {...filtro} variante="botones" className="hidden @[60rem]:block" />
    </div>
  )
}
