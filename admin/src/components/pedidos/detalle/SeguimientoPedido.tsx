import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Etapa, PedidoCompleto } from '../../../types/pedido.types'
import { normalizarEstado } from '../../../utils/pedidoEstado'
import { armarRecorrido } from '../../../utils/pedidos/recorridoPedido'
import { proximoPaso, textoSinAvance } from '../../../utils/pedidos/proximoPaso'
import {
  puedeCancelarDesdePanel,
  textoConfirmacionCancelacion,
} from '../../../utils/pedidos/reglasCancelacion'
import PanelProximoPaso, { type Confirmacion } from './PanelProximoPaso'
import RecorridoPedido from './RecorridoPedido'

interface Props {
  pedido: PedidoCompleto
  guardando: boolean
  error: string
  // Devuelve true si el backend aceptó el cambio
  onCambiarEtapa: (etapa: Etapa) => Promise<boolean>
}

// Bloque de seguimiento del detalle (plan responsivo, 4.4.1):
// arriba el «Próximo paso», abajo el «Recorrido». En tablet van lado a lado.
export default function SeguimientoPedido({ pedido, guardando, error, onCambiarEtapa }: Props) {
  const [confirmacion, setConfirmacion] = useState<Confirmacion>(null)
  const [mensaje, setMensaje] = useState('')
  const refConfirmar = useRef<HTMLButtonElement | null>(null)
  const estado = normalizarEstado(pedido.estado)
  // Etapa a la que se está pasando por una acción propia (para no anunciarla como ajena)
  const [esperado, setEsperado] = useState<string | null>(null)

  // Si otro actor (repartidor, otro admin) cambia el pedido mientras se confirmaba algo,
  // la confirmación se descarta y se explica por qué. Se ajusta en el render, no en un efecto.
  const [estadoVisto, setEstadoVisto] = useState(estado)
  if (estadoVisto !== estado) {
    setEstadoVisto(estado)
    if (confirmacion !== null && estado !== esperado) {
      setConfirmacion(null)
      setMensaje(`El pedido cambió a «${estado}» mientras lo revisabas.`)
    }
  }

  // El foco va al botón que confirma, así teclado y lector de pantalla siguen el flujo
  useEffect(() => {
    if (confirmacion) refConfirmar.current?.focus()
  }, [confirmacion])

  const avance = proximoPaso(estado)
  const retirado = Boolean(pedido.retiradoEn)
  const enViaje = Boolean(pedido.viajeId)
  const puedeCancelar = puedeCancelarDesdePanel(estado, pedido.retiradoEn)

  async function confirmar() {
    const destino: Etapa | null =
      confirmacion === 'cancelar' ? 'Cancelado' : (avance?.destino ?? null)
    if (!destino) return
    // El nuevo estado llega con la recarga del detalle (durante el await):
    // se marca como esperado antes, para no anunciarlo como un cambio ajeno
    setEsperado(normalizarEstado(destino))
    const ok = await onCambiarEtapa(destino)
    setEsperado(null)
    if (!ok) return
    setConfirmacion(null)
    setMensaje(destino === 'Cancelado' ? 'El pedido se canceló.' : `El pedido pasó a «${destino}».`)
  }

  return (
    <section
      aria-labelledby="titulo-seguimiento"
      className="@container flex flex-col gap-4 rounded-xl border bg-white p-4"
    >
      <h2 id="titulo-seguimiento" className="font-bold text-gray-900">
        Seguimiento
      </h2>

      <div className="flex flex-col gap-5 @[38rem]:flex-row @[38rem]:items-start @[38rem]:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p role="status" className={mensaje ? 'flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800' : 'sr-only'}>
            {mensaje && <CheckCircle2 size={16} aria-hidden="true" />}
            {mensaje}
          </p>
          {error && (
            <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <PanelProximoPaso
            pedidoId={pedido.id}
            avance={avance}
            info={avance ? null : textoSinAvance(estado, { retirado, enViaje })}
            puedeCancelar={puedeCancelar}
            textoCancelacion={textoConfirmacionCancelacion(estado, enViaje)}
            confirmacion={confirmacion}
            guardando={guardando}
            refConfirmar={refConfirmar}
            onPedir={(tipo) => {
              setMensaje('')
              setConfirmacion(tipo)
            }}
            onConfirmar={() => void confirmar()}
            onVolver={() => setConfirmacion(null)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-3 text-sm font-extrabold text-gray-700">Recorrido</h3>
          <RecorridoPedido pasos={armarRecorrido(estado, pedido.historialDeTiemposPedidos ?? [])} />
        </div>
      </div>
    </section>
  )
}
