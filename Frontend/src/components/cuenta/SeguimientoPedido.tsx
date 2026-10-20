import { PASOS_SEGUIMIENTO, pasoActual, normalizarEstado } from '../../config/pedidoEstados'

type Registro = { estado: string; fecha: string }

// Hora de cada paso según el historial (si un estado se repite, gana el último)
function horasPorPaso(historial: Registro[], fechaPedido?: string) {
  const horas = new Map<string, string>()
  if (fechaPedido) horas.set('Pendiente', fechaPedido) // el pedido nace en Pendiente
  for (const r of historial) horas.set(normalizarEstado(r.estado), r.fecha)
  return horas
}

const hora = (valor: string) =>
  new Date(valor).toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
  })

// Barra de 4 tramos con el estado real del pedido y la hora de cada cambio
function SeguimientoPedido({
  estado,
  historial = [],
  fechaPedido,
}: {
  estado: string
  historial?: Registro[]
  fechaPedido?: string
}) {
  const actual = pasoActual(estado)
  const horas = horasPorPaso(historial, fechaPedido)

  return (
    <ol aria-label="Estado del pedido" className="grid grid-cols-4 gap-2">
      {PASOS_SEGUIMIENTO.map((paso, i) => {
        const fecha = i <= actual ? horas.get(paso) : undefined
        return (
          <li key={paso} aria-current={i === actual ? 'step' : undefined} className="flex flex-col gap-2">
            <span
              className={`h-2 rounded-full ${
                i < actual ? 'bg-brand-mustard' : i === actual ? 'animate-pulse bg-brand-red' : 'bg-white/15'
              }`}
            />
            <span className={`text-xs font-bold sm:text-sm ${i <= actual ? 'text-brand-cream' : 'text-brand-cream/40'}`}>
              {paso}
            </span>
            <span className="text-xs tabular-nums text-brand-cream/60">{fecha ? hora(fecha) : '\u00A0'}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default SeguimientoPedido