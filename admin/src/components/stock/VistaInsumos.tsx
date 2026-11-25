import { POR_PAGINA_STOCK } from '../../config/stock'
import { useIrAlInicioLista } from '../../hooks/useIrAlInicioLista'
import type { ItemStock } from '../../types/stock.types'
import { paginar } from '../../utils/listas/paginar'
import { contarPorEstadoStock, filtrarStock, type FiltroEstadoStock } from '../../utils/stock/filtrarStock'
import BarraFiltrosLista from '../listas/BarraFiltrosLista'
import MensajeVacio from '../MensajeVacio'
import Paginacion from '../Paginacion'
import InsumoCard from './InsumoCard'

const OPCIONES_ESTADO: { valor: FiltroEstadoStock; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'bajo', etiqueta: 'Stock bajo' },
  { valor: 'sin', etiqueta: 'Sin stock' },
  { valor: 'deshabilitado', etiqueta: 'Deshabilitados' },
]

interface Props {
  stock: ItemStock[]
  cargando: boolean
  filtros: {
    busqueda: string
    filtroEstado: FiltroEstadoStock
    pagina: number
    setPagina: (pagina: number) => void
    insumoResaltadoId: number | null
    insumoObjetivoId: number | null
    cambiarBusqueda: (valor: string) => void
    cambiarFiltroEstado: (valor: FiltroEstadoStock) => void
  }
  onDefinirMinimo: (item: ItemStock) => void
  onAumentar: (item: ItemStock) => void
}

// Vista Insumos: buscador + estado (botones en escritorio, desplegable en tablet y móvil),
// fila‑tarjetas sin tabla y 10 por página (D-S7)
export default function VistaInsumos({ stock, cargando, filtros, onDefinirMinimo, onAumentar }: Props) {
  const { refTitulo, irAlInicio } = useIrAlInicioLista()
  const filtrados = filtrarStock({
    items: stock,
    busqueda: filtros.busqueda,
    filtroEstado: filtros.filtroEstado,
    objetivoId: filtros.insumoObjetivoId,
  })
  const { pagina, totalPaginas, items } = paginar(filtrados, filtros.pagina, POR_PAGINA_STOCK)

  return (
    <section aria-labelledby="titulo-insumos">
      <BarraFiltrosLista<FiltroEstadoStock>
        sucursales={null}
        sucursalId={null}
        onSucursal={() => {}}
        busqueda={filtros.busqueda}
        onBusqueda={filtros.cambiarBusqueda}
        placeholder="Buscar insumo"
        filtro={{
          id: 'filtro-estado-stock',
          leyenda: 'Filtrar insumos por estado',
          opciones: OPCIONES_ESTADO,
          valor: filtros.filtroEstado,
          contadores: contarPorEstadoStock(stock, filtros.busqueda),
          onChange: filtros.cambiarFiltroEstado,
        }}
      />

      <h2 id="titulo-insumos" ref={refTitulo} tabIndex={-1} className="sr-only">
        Insumos, página {pagina} de {totalPaginas}
      </h2>

      {cargando ? (
        <p className="text-gray-600">Cargando stock...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
          <MensajeVacio
            mensaje={stock.length === 0 ? 'No hay stock registrado para esta sucursal.' : 'No hay insumos con esos filtros.'}
          />
        </div>
      ) : (
        <ul aria-label="Insumos" className="flex flex-col gap-2.5">
          {items.map((item) => (
            <InsumoCard
              key={item.id}
              item={item}
              resaltado={item.id === filtros.insumoResaltadoId}
              onDefinirMinimo={onDefinirMinimo}
              onAumentar={onAumentar}
            />
          ))}
        </ul>
      )}

      <Paginacion
        paginaActual={pagina}
        totalElementos={filtrados.length}
        elementosPorPagina={POR_PAGINA_STOCK}
        cambiarPagina={(nueva) => {
          filtros.setPagina(nueva)
          irAlInicio()
        }}
      />
    </section>
  )
}
