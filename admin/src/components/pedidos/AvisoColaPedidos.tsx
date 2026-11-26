import { Clock } from 'lucide-react'

interface Props {
  enCola: number
  // En otra página no se inserta nada (correría los ítems): se ofrece ir a la primera
  enOtraPagina: boolean
  onMostrar: () => void
  onIrPrimera: () => void
}

// Aviso de los pedidos que esperan su turno en la cola de ingreso (plan responsivo, 4.2)
export default function AvisoColaPedidos({ enCola, enOtraPagina, onMostrar, onIrPrimera }: Props) {
  if (enCola === 0) return null

  const texto = enOtraPagina
    ? enCola === 1
      ? 'Hay 1 pedido nuevo en la página 1.'
      : `Hay ${enCola} pedidos nuevos en la página 1.`
    : enCola === 1
      ? '1 pedido nuevo entrando a la lista.'
      : `${enCola} pedidos nuevos entrando a la lista, de a uno.`

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      <Clock size={18} aria-hidden="true" className="shrink-0 text-amber-700" />
      <span className="min-w-0 flex-1">{texto}</span>
      <button
        type="button"
        onClick={enOtraPagina ? onIrPrimera : onMostrar}
        className="min-h-9 rounded-md border border-amber-500 bg-white px-3 font-semibold text-amber-900 hover:bg-amber-100"
      >
        {enOtraPagina ? 'Ir a la página 1' : 'Mostrar ahora'}
      </button>
    </div>
  )
}
