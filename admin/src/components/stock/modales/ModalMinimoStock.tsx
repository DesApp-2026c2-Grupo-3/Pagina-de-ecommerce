import { useState, type ChangeEvent } from 'react'
import type { ItemStock } from '../../../types/stock.types'
import { botonPrincipal, botonSecundario, cajaModal, campo, fondoModal } from './estilosModal'

interface Props {
  item: ItemStock
  onCancelar: () => void
  // null = sin alerta
  onGuardar: (minimo: number | null) => Promise<void>
  onInvalido: (mensaje: string) => void
}

// Modal chico de un solo campo, sin scroll (D-S6): stock mínimo del insumo (RN-11, RF-43)
export default function ModalMinimoStock({ item, onCancelar, onGuardar, onInvalido }: Props) {
  const [valor, setValor] = useState(item.stockMinimo != null ? String(item.stockMinimo) : '')

  function guardar() {
    const minimo = valor === '' ? null : Number(valor)
    if (minimo !== null && (!Number.isInteger(minimo) || minimo < 0)) {
      onInvalido('El mínimo debe ser un número entero, 0 o más')
      return
    }
    void onGuardar(minimo)
  }

  return (
    <div className={fondoModal} role="dialog" aria-modal="true" aria-labelledby="titulo-minimo">
      <div className={cajaModal}>
        <h2 id="titulo-minimo" className="text-xl font-bold">Stock mínimo</h2>
        <p className="mt-1 text-gray-600">
          {item.nombre} · hay {item.cantidad.toLocaleString('es-AR')}
        </p>

        <label htmlFor="valor-minimo" className="mt-4 block font-medium">Avisar cuando queden</label>
        <input
          id="valor-minimo"
          type="number"
          min="0"
          step="1"
          autoFocus
          value={valor}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setValor(e.target.value)}
          className={campo}
          placeholder="Ej: 10 (vacío = sin alerta)"
          aria-describedby="ayuda-minimo"
        />
        <p id="ayuda-minimo" className="mt-1 text-sm text-gray-500">
          Si el stock llega a este número o menos, se muestra una alerta.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className={botonSecundario}>
            Cancelar
          </button>
          <button type="button" onClick={guardar} className={botonPrincipal}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
