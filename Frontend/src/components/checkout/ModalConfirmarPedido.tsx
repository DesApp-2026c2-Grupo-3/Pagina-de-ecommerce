import { MapPin, Store, Wallet } from 'lucide-react'
import Modal from '../Modal'
import { formatearPrecio } from '../../utils/precio'

interface Props {
  abierto: boolean
  total: number
  direccion: string
  sucursal: string
  formaPago: string
  cargando: boolean
  onCancelar: () => void
  onConfirmar: () => void
}

// Última pregunta antes de mandar el pedido a la cocina: repasa lo elegido y el total
function ModalConfirmarPedido({ abierto, total, direccion, sucursal, formaPago, cargando, onCancelar, onConfirmar }: Props) {
  const filas = [
    { Icono: MapPin, titulo: 'Lo enviamos a', valor: direccion },
    { Icono: Store, titulo: 'Lo prepara', valor: sucursal },
    { Icono: Wallet, titulo: 'Pagás con', valor: formaPago },
  ]

  return (
    <Modal isOpen={abierto} onClose={onCancelar} title="¿Confirmás tu pedido?" subtitle="Revisá que esté todo bien." tamanio="sm">
      <ul className="flex flex-col gap-3">
        {filas.map(({ Icono, titulo, valor }) => (
          <li key={titulo} className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-mustard">
              <Icono className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-wider text-brand-muted">{titulo}</span>
              <span className="block font-bold">{valor}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-baseline justify-between border-t-2 border-dashed border-brand-sand pt-4">
        <span className="font-extrabold">Total</span>
        <span className="font-display text-3xl font-extrabold">{formatearPrecio(total)}</span>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancelar}
          disabled={cargando}
          className="min-h-11 rounded-full border-2 border-brand-dark px-5 font-bold transition-colors hover:bg-brand-dark hover:text-brand-cream disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={cargando}
          className="min-h-11 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
        >
          {cargando ? 'Enviando...' : 'Sí, confirmar'}
        </button>
      </div>
    </Modal>
  )
}

export default ModalConfirmarPedido