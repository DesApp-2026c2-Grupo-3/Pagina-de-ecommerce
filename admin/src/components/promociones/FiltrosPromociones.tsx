import type { ChangeEvent } from 'react'
import { Search } from 'lucide-react'
import { NOMBRE_TIPO } from '../../config/promociones'
import { formatearContador } from '../../utils/listas/formatoContador'
import type { FiltroEstadoPromo, FiltroTipoPromo } from '../../utils/promociones/filtrarPromociones'
import MenuFiltro, { type OpcionMenu } from '../listas/MenuFiltro'

interface Props {
  busqueda: string
  onBusqueda: (valor: string) => void
  tipo: FiltroTipoPromo
  onTipo: (valor: FiltroTipoPromo) => void
  contadoresTipo: Record<FiltroTipoPromo, number>
  estado: FiltroEstadoPromo
  onEstado: (valor: FiltroEstadoPromo) => void
  contadoresEstado: Record<FiltroEstadoPromo, number>
}

const TIPOS: { valor: FiltroTipoPromo; texto: string }[] = [
  { valor: 'todos', texto: 'Todos los tipos' },
  { valor: 'SEMANA', texto: NOMBRE_TIPO.SEMANA },
  { valor: 'REGALO', texto: NOMBRE_TIPO.REGALO },
  { valor: 'DIA', texto: NOMBRE_TIPO.DIA },
]

// D-PR2: la primera opción dice solo «Todos»
const ESTADOS: { valor: FiltroEstadoPromo; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'activas', texto: 'Activas' },
  { valor: 'deshabilitadas', texto: 'Deshabilitadas' },
]

function conContador<T extends string>(opciones: { valor: T; texto: string }[], contadores: Record<T, number>): OpcionMenu[] {
  return opciones.map((o) => ({
    valor: o.valor,
    texto: o.texto,
    contador: { visible: formatearContador(contadores[o.valor] ?? 0), real: contadores[o.valor] ?? 0 },
  }))
}

// Buscador y los dos filtros, siempre con nuestro menú propio (nunca el <select> del navegador):
// escritorio (≥ 48 rem) al lado del buscador · tablet en dos mitades · móvil uno debajo del otro.
export default function FiltrosPromociones(props: Props) {
  return (
    <div className="mb-4 flex flex-col gap-3 @[48rem]:flex-row @[48rem]:items-center">
      <div className="relative w-full @[48rem]:w-96 @[48rem]:flex-none">
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <label htmlFor="filtro-promociones-buscar" className="sr-only">
          Buscar promo o producto
        </label>
        <input
          id="filtro-promociones-buscar"
          type="search"
          value={props.busqueda}
          onChange={(e: ChangeEvent<HTMLInputElement>) => props.onBusqueda(e.target.value)}
          placeholder="Buscar promo o producto..."
          className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @[48rem]:flex">
        <MenuFiltro
          id="filtro-tipo-promo"
          etiqueta="Filtrar por tipo"
          opciones={conContador(TIPOS, props.contadoresTipo)}
          valor={props.tipo}
          onChange={(v) => {
            const elegido = TIPOS.find((o) => o.valor === v)
            if (elegido) props.onTipo(elegido.valor)
          }}
          className="min-w-0 @[48rem]:w-72"
        />
        <MenuFiltro
          id="filtro-estado-promo"
          etiqueta="Filtrar por estado"
          opciones={conContador(ESTADOS, props.contadoresEstado)}
          valor={props.estado}
          onChange={(v) => {
            const elegido = ESTADOS.find((o) => o.valor === v)
            if (elegido) props.onEstado(elegido.valor)
          }}
          className="min-w-0 @[48rem]:w-56"
        />
      </div>
    </div>
  )
}
