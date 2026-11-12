import type { ItemStock } from '../../types/stock.types'
import StockFila, { StockTarjeta } from './StockFila'

interface StockTablaProps {
  items: ItemStock[]
  resaltadoId: number | null
  onDefinirMinimo: (item: ItemStock) => void
  onAumentar: (item: ItemStock) => void
}

export default function StockTabla({
  items,
  resaltadoId,
  onDefinirMinimo,
  onAumentar,
}: StockTablaProps) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <StockTarjeta
            key={item.id}
            item={item}
            resaltado={item.id === resaltadoId}
            onDefinirMinimo={onDefinirMinimo}
            onAumentar={onAumentar}
          />
        ))}
      </ul>

      <div className="hidden rounded-lg border bg-white md:block">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Insumo</th>
              <th className="px-6 py-3 text-left">Cantidad</th>
              <th className="px-6 py-3 text-left">Estado</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <StockFila
                key={item.id}
                item={item}
                resaltado={item.id === resaltadoId}
                onDefinirMinimo={onDefinirMinimo}
                onAumentar={onAumentar}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
