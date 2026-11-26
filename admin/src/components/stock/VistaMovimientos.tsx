import { useState } from 'react'
import { POR_PAGINA_MOVIMIENTOS } from '../../config/stock'
import { useIrAlInicioLista } from '../../hooks/useIrAlInicioLista'
import type { Movimiento } from '../../types/stock.types'
import { paginar } from '../../utils/listas/paginar'
import {
  TIPOS_MOVIMIENTO,
  contarPorTipoMovimiento,
  filtrarMovimientos,
  type FiltroTipoMovimiento,
} from '../../utils/stock/movimientos'
import BarraFiltrosLista from '../listas/BarraFiltrosLista'
import MensajeVacio from '../MensajeVacio'
import Paginacion from '../Paginacion'
import MovimientoCard from './MovimientoCard'

const OPCIONES_TIPO: { valor: FiltroTipoMovimiento; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  ...TIPOS_MOVIMIENTO.map((t) => ({ valor: t.valor, etiqueta: t.plural })),
]

// Vista Movimientos: los últimos 50 que devuelve el backend (RF-44), con buscador (D-S4),
// filtro por tipo, fila‑tarjetas sin tabla y 10 por página (D-S7)
export default function VistaMovimientos({ movimientos, cargando }: { movimientos: Movimiento[]; cargando: boolean }) {
  const { refTitulo, irAlInicio } = useIrAlInicioLista()
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<FiltroTipoMovimiento>('todos')
  const [paginaPedida, setPaginaPedida] = useState(1)

  const filtrados = filtrarMovimientos(movimientos, { busqueda, tipo })
  // Un refresco en vivo conserva la página; si quedó fuera de rango, va a la última válida
  const { pagina, totalPaginas, items } = paginar(filtrados, paginaPedida, POR_PAGINA_MOVIMIENTOS)

  return (
    <section aria-labelledby="titulo-movimientos">
      <p className="mb-3 text-sm text-gray-600">
        Los últimos {movimientos.length > 0 ? movimientos.length : 50} movimientos de la sucursal, del más nuevo al más viejo.
      </p>

      <BarraFiltrosLista<FiltroTipoMovimiento>
        sucursales={null}
        sucursalId={null}
        onSucursal={() => {}}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor)
          setPaginaPedida(1)
        }}
        placeholder="Buscar insumo o nº de pedido"
        filtro={{
          id: 'filtro-tipo-movimiento',
          leyenda: 'Filtrar movimientos por tipo',
          opciones: OPCIONES_TIPO,
          valor: tipo,
          contadores: contarPorTipoMovimiento(movimientos, busqueda),
          onChange: (valor) => {
            setTipo(valor)
            setPaginaPedida(1)
          },
        }}
      />

      <h2 id="titulo-movimientos" ref={refTitulo} tabIndex={-1} className="sr-only">
        Movimientos, página {pagina} de {totalPaginas}
      </h2>

      {cargando ? (
        <p className="text-gray-600">Cargando movimientos...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
          <MensajeVacio
            mensaje={movimientos.length === 0 ? 'Todavía no hay movimientos registrados.' : 'No hay movimientos con esos filtros.'}
          />
        </div>
      ) : (
        <ul aria-label="Movimientos" className="flex flex-col gap-2.5">
          {items.map((m) => (
            <MovimientoCard key={m.id} movimiento={m} />
          ))}
        </ul>
      )}

      <Paginacion
        paginaActual={pagina}
        totalElementos={filtrados.length}
        elementosPorPagina={POR_PAGINA_MOVIMIENTOS}
        cambiarPagina={(nueva) => {
          setPaginaPedida(nueva)
          irAlInicio()
        }}
      />
    </section>
  )
}
