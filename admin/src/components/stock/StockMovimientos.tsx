import { SelectFiltro } from '../Filtros'
import { MOTIVOS_BAJA } from '../../services/stockService'
import { formatearFechaHora } from '../../utils/pedidoEstado'
import type { Movimiento } from '../../types/stock.types'

interface StockMovimientosProps {
  movimientos: Movimiento[]
  filtroTipo: string
  onCambiarFiltro: (valor: string) => void
}

const etiquetaMotivo = (motivo: string | null) =>
  MOTIVOS_BAJA.find((m) => m.valor === motivo)?.etiqueta ?? '—'

function descripcion(m: Movimiento) {
  if (m.tipo === 'baja') return etiquetaMotivo(m.motivo)
  if (m.tipo === 'venta') return `Venta · pedido #${m.pedidoId}`
  if (m.tipo === 'devolucion') return `Pedido #${m.pedidoId} cancelado`
  return 'Carga de stock'
}

const resta = (m: Movimiento) =>
  m.tipo === 'baja' || m.tipo === 'venta'

export default function StockMovimientos({
  movimientos,
  filtroTipo,
  onCambiarFiltro,
}: StockMovimientosProps) {
  const filtrados = movimientos.filter(
    (m) => filtroTipo === 'todos' || m.tipo === filtroTipo,
  )

  return (
    <>
      <div className="mb-3 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Últimos movimientos</h2>
        <SelectFiltro
          valor={filtroTipo}
          onChange={onCambiarFiltro}
          etiqueta="Filtrar movimientos"
          opciones={[
            { valor: 'todos', etiqueta: 'Todos los movimientos' },
            { valor: 'aumento', etiqueta: 'Solo aumentos' },
            { valor: 'baja', etiqueta: 'Solo bajas' },
            { valor: 'venta', etiqueta: 'Solo ventas' },
            { valor: 'devolucion', etiqueta: 'Solo devoluciones' },
          ]}
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-lg border bg-white px-4 py-8 text-center text-gray-500">
          {movimientos.length === 0
            ? 'Todavía no hay movimientos registrados.'
            : 'No hay movimientos de ese tipo.'}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {filtrados.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border bg-white p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate font-medium">{m.insumo}</p>
                  <span
                    className={`shrink-0 font-bold ${
                      resta(m) ? 'text-red-700' : 'text-green-700'
                    }`}
                  >
                    {resta(m) ? '−' : '+'}
                    {m.cantidad.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="mt-1 text-gray-700">
                  {descripcion(m)}
                  {m.detalle && (
                    <span className="block text-gray-500">{m.detalle}</span>
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {formatearFechaHora(m.fecha)}
                  {m.admin && ` · ${m.admin}`}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden rounded-lg border bg-white md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Insumo</th>
                  <th className="px-4 py-3 text-left">Movimiento</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left">Por</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatearFechaHora(m.fecha)}
                    </td>
                    <td className="px-4 py-3">{m.insumo}</td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 font-semibold ${
                        resta(m) ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      {resta(m) ? '−' : '+'}
                      {m.cantidad.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      {descripcion(m)}
                      {m.detalle && (
                        <span className="block text-gray-500">
                          {m.detalle}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{m.admin ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
