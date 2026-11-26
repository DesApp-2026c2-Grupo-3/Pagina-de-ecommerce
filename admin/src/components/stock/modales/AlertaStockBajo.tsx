import { TriangleAlert } from 'lucide-react'
import type { ItemStock } from '../../../types/stock.types'
import { botonPrincipal, botonSecundario, cajaModal, fondoModal } from './estilosModal'

interface Props {
  items: ItemStock[]
  onCerrar: () => void
  onVerEnLista: () => void
}

// Alerta de insumos en el mínimo o sin stock (RN-11), al entrar o después de una baja
export default function AlertaStockBajo({ items, onCerrar, onVerEnLista }: Props) {
  return (
    <div className={fondoModal} role="alertdialog" aria-modal="true" aria-labelledby="titulo-alerta">
      <div className={cajaModal}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
            <TriangleAlert size={22} aria-hidden="true" />
          </span>
          <h2 id="titulo-alerta" className="text-xl font-bold">
            {items.length === 1 ? 'Insumo con stock bajo' : `${items.length} insumos con stock bajo`}
          </h2>
        </div>
        <p className="mt-2 text-sm text-gray-600">Conviene reponer estos insumos para no quedarse sin productos para vender.</p>

        <ul className="mt-4 flex flex-col divide-y">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <span className="font-medium">{item.nombre}</span>
              <span className={`shrink-0 text-sm font-semibold ${item.cantidad <= 0 ? 'text-red-700' : 'text-amber-700'}`}>
                {item.cantidad <= 0
                  ? 'Sin stock'
                  : `Quedan ${item.cantidad}${item.stockMinimo != null ? ` (mín. ${item.stockMinimo})` : ''}`}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCerrar} className={botonSecundario}>
            Entendido
          </button>
          <button type="button" onClick={onVerEnLista} className={botonPrincipal}>
            Ver en la lista
          </button>
        </div>
      </div>
    </div>
  )
}
