import { Check, X } from 'lucide-react'
import type { PasoRecorrido } from '../../../utils/pedidos/recorridoPedido'
import { COLORES_ETAPA, formatearFechaHora, normalizarEstado } from '../../../utils/pedidoEstado'

// Recorrido completo del pedido (plan responsivo, 4.4.1). Cada color significa una sola cosa:
// verde con tilde = cumplido · color de la etapa + «Actual» = dónde está · gris punteado = lo que falta
// · rojo = cancelado. El estado nunca depende solo del color: hay ícono y texto.
function Marca({ paso }: { paso: PasoRecorrido }) {
  if (paso.tipo === 'hecho') {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-700 text-white">
        <Check size={14} strokeWidth={3} aria-hidden="true" />
      </span>
    )
  }
  if (paso.tipo === 'cancelado') {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-700 text-white">
        <X size={14} strokeWidth={3} aria-hidden="true" />
      </span>
    )
  }
  if (paso.tipo === 'actual') {
    return (
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-[3px] border-current bg-white ${colorTexto(paso.estado)}`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      </span>
    )
  }
  return (
    <span className="h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-gray-400 bg-white" />
  )
}

// El texto de COLORES_ETAPA ("text-blue-700") pinta el anillo con border-current
function colorTexto(estado: string): string {
  return COLORES_ETAPA[normalizarEstado(estado)].split(' ').find((c) => c.startsWith('text-')) ?? ''
}

function detalle(paso: PasoRecorrido): string {
  if (paso.tipo === 'pendiente') return paso.quien ?? ''
  if (!paso.fecha) return '—'
  const fecha = formatearFechaHora(paso.fecha)
  return paso.tipo === 'actual' ? `Desde ${fecha}` : fecha
}

export default function RecorridoPedido({ pasos }: { pasos: PasoRecorrido[] }) {
  return (
    <ol aria-label="Recorrido del pedido" className="flex flex-col">
      {pasos.map((paso, i) => {
        const siguiente = pasos[i + 1]
        const lineaPendiente = siguiente?.tipo === 'pendiente'
        return (
          <li
            key={paso.estado}
            aria-current={paso.tipo === 'actual' ? 'step' : undefined}
            className="flex gap-3"
          >
            <div className="flex w-6 flex-col items-center">
              <Marca paso={paso} />
              {siguiente && (
                <span
                  aria-hidden="true"
                  className={`min-h-5 flex-1 ${
                    lineaPendiente ? 'w-0 border-l-2 border-dashed border-gray-300' : 'w-0.5 bg-green-600'
                  }`}
                />
              )}
            </div>
            <div className="min-w-0 pb-4 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm ${
                    paso.tipo === 'actual' || paso.tipo === 'cancelado' ? 'font-extrabold' : 'font-semibold'
                  } ${
                    paso.tipo === 'pendiente'
                      ? 'text-gray-500'
                      : paso.tipo === 'cancelado'
                        ? 'text-red-800'
                        : 'text-gray-900'
                  }`}
                >
                  {paso.estado}
                </span>
                {paso.tipo === 'actual' && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${COLORES_ETAPA[normalizarEstado(paso.estado)]}`}
                  >
                    Actual
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-600">{detalle(paso)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
