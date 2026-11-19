import type { Order } from '../../types/order'
import { normalizarEstado } from '../../config/pedidoEstados'
import { formatearFechaHora } from '../../utils/fechas'
import { formatearPrecio } from '../../utils/precio'
import { resumenItems, totalConEnvio } from '../../utils/pedidos'
import SeguimientoPedido from './SeguimientoPedido'
import { MessageSquareText, Timer } from 'lucide-react'

// "21:35"
const hora = (fecha: string) => new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

// Tarjeta oscura destacada para un pedido que todavía no se entregó
function PedidoEnCurso({ pedido }: { pedido: Order }) {
  return (
    <article className="flex flex-col gap-5 rounded-[1.75rem] bg-brand-dark p-6 text-brand-cream shadow-[8px_8px_0_var(--color-brand-red)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wider text-brand-mustard">
            {normalizarEstado(pedido.estado)} · Pedido #{pedido.id}
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold leading-tight tracking-tight">{resumenItems(pedido)}</p>
          <p className="mt-1 text-sm text-brand-cream/70">{formatearFechaHora(pedido.fecha)}</p>
          <p className="mt-1 text-sm text-brand-cream/70">
            Sucursal: {pedido.Sucursal?.nombre ?? 'No disponible'}
          </p>
        </div>
        <p className="font-display text-3xl font-extrabold">{formatearPrecio(totalConEnvio(pedido))}</p>
      </div>

      {/* Hora estimada: la calcula el backend y se corre sola si alguna etapa se demora */}
      {pedido.estimacion && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-white/10 px-5 py-3 font-bold">
          <Timer className="h-6 w-6 shrink-0 text-brand-mustard" />
          Llega aprox. a las {hora(pedido.estimacion.llegaAprox)}
          <span className="text-sm font-semibold text-brand-cream/70">
            {pedido.estimacion.demorado ? 'Viene un poco demorado' : `en unos ${pedido.estimacion.minutosRestantes} min`}
          </span>
        </p>
      )}

      <SeguimientoPedido
        estado={pedido.estado}
        historial={pedido.historialDeTiemposPedidos}
        fechaPedido={pedido.fecha}
      />      
      {pedido.observaciones?.trim() && (
        <div className="flex gap-3 rounded-2xl border-l-4 border-brand-mustard bg-white/5 p-4">
          <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-brand-mustard" />
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wider text-brand-mustard">Tu nota para el local</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-brand-cream/90">{pedido.observaciones}</p>
          </div>
        </div>
      )}
    </article>
  )
}

export default PedidoEnCurso