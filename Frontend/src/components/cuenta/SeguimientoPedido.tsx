import { PASOS_SEGUIMIENTO, pasoActual } from '../../config/pedidoEstados'

// Barra de 4 tramos con el estado real del pedido (Pendiente → Entregado)
function SeguimientoPedido({ estado }: { estado: string }) {
  const actual = pasoActual(estado)

  return (
    <ol aria-label="Estado del pedido" className="grid grid-cols-4 gap-2">
      {PASOS_SEGUIMIENTO.map((paso, i) => (
        <li key={paso} aria-current={i === actual ? 'step' : undefined} className="flex flex-col gap-2">
          <span
            className={`h-2 rounded-full ${
              i < actual ? 'bg-brand-mustard' : i === actual ? 'animate-pulse bg-brand-red' : 'bg-white/15'
            }`}
          />
          <span className={`text-xs font-bold sm:text-sm ${i <= actual ? 'text-brand-cream' : 'text-brand-cream/40'}`}>
            {paso}
          </span>
        </li>
      ))}
    </ol>
  )
}

export default SeguimientoPedido