import { useState, type ChangeEvent } from 'react'
import type { ItemStock } from '../../../types/stock.types'
import { botonPrincipal, botonSecundario, cajaModal, campo, fondoModal } from './estilosModal'

interface Props {
  item: ItemStock
  onCancelar: () => void
  // Si se guardó, la página cierra el modal
  onConfirmar: (cantidad: number) => Promise<void>
  onInvalido: (mensaje: string) => void
}

// Modal chico de un solo campo, sin scroll (D-S6). Los ingresos se suman (RN-10).
export default function ModalAumentarStock({ item, onCancelar, onConfirmar, onInvalido }: Props) {
  const [cantidadTexto, setCantidadTexto] = useState('')

  function confirmar() {
    const cantidad = Number(cantidadTexto)
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      onInvalido('Ingresá una cantidad entera mayor a 0')
      return
    }
    void onConfirmar(cantidad)
  }

  return (
    <div className={fondoModal} role="dialog" aria-modal="true" aria-labelledby="titulo-aumentar">
      <div className={cajaModal}>
        <h2 id="titulo-aumentar" className="text-xl font-bold">Aumentar stock</h2>
        <p className="mt-1 text-gray-600">
          {item.nombre} · hay {item.cantidad.toLocaleString('es-AR')}
        </p>

        <label htmlFor="cantidad-aumento" className="mt-4 block font-medium">Cantidad a agregar</label>
        <input
          id="cantidad-aumento"
          type="number"
          min="1"
          step="1"
          autoFocus
          value={cantidadTexto}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setCantidadTexto(e.target.value)}
          className={campo}
          placeholder="Ej: 50"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className={botonSecundario}>
            Cancelar
          </button>
          <button type="button" onClick={confirmar} className={botonPrincipal}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
